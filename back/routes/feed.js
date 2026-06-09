const express = require('express');
const router = express.Router();
const getUserId = (req) => req.user?.userId ?? req.user?.id ?? null;
const oracledb = require('oracledb');
const db = require('../db');
const jwtAuthentication = require('../middlewares/auth');
const createUploader = require('../middlewares/upload');
const upload = createUploader('post');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = path.join(__dirname, '../uploads/post');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});
const uploadVideo = multer({
    storage: videoStorage,
    limits: { fileSize: 500 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, ['video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype));
    },
});
router.post('/upload', jwtAuthentication, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: '파일 없음' });
    res.json({ success: true, fileUrl: `/uploads/post/${req.file.filename}` });
});
router.post('/upload-video', jwtAuthentication, uploadVideo.single('video'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: '동영상 파일 없음' });
    res.json({ success: true, fileUrl: `/uploads/post/${req.file.filename}` });
});
router.get('/tags', async (req, res) => {
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(`SELECT TAG_NAME FROM TAGS`);
        res.json({
            success: true,
            tags: result.rows.map(row => row[0])
        });
    } catch (err) {
        console.error('[GET /feed/tags]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.post('/check-profanity', jwtAuthentication, async (req, res) => {
    const { title, content } = req.body;
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT BANNED_WORD, REPLACE_WORD FROM BAD_WORDS`,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const fullText = ((title || '') + ' ' + (content || '')).replace(/<[^>]*>?/gm, '').toLowerCase();
        const detected = [];
        const replaceMap = {};

        for (const row of result.rows) {
            const word = row.BANNED_WORD;
            if (word && fullText.includes(word.toLowerCase())) {
                detected.push(word);
                replaceMap[word] = row.REPLACE_WORD || '***';
            }
        }
        res.json({ success: true, hasProfanity: detected.length > 0, words: detected, replaceMap });
    } catch (err) {
        console.error('[POST /feed/check-profanity]', err);
        res.json({ success: true, hasProfanity: false, words: [], replaceMap: {} });
    } finally {
        if (conn) await conn.close();
    }
});

router.get('/:postId/ai-answer', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT DBMS_LOB.SUBSTR(ANSWER, 10000, 1) AS ANSWER, UPDATED_AT, CREATED_AT
     FROM AI_ANSWERS WHERE POST_ID = :postId
     ORDER BY CREATED_AT DESC FETCH FIRST 1 ROWS ONLY`,
            { postId: Number(postId) },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({
            success: true,
            answer: result.rows[0]?.ANSWER ?? null,
            updatedAt: result.rows[0]?.UPDATED_AT ?? null,
            createdAt: result.rows[0]?.CREATED_AT ?? null,  
        });
    } catch {
        res.json({ success: true, answer: null, updatedAt: null });
    } finally {
        if (conn) await conn.close();
    }
});

router.post('/:postId/ai-answer', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const postResult = await conn.execute(
            `SELECT TITLE, CONTENT, UPDATED_AT FROM POSTS WHERE POST_ID = :postId`,
            { postId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!postResult.rows.length)
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });

        const post = postResult.rows[0];
        let contentText = post.CONTENT;
        if (contentText && typeof contentText.getData === 'function')
            contentText = await contentText.getData();
        const cleanContent = contentText.replace(/<[^>]*>?/gm, '');

        const prompt = `당신은 시니어 개발자입니다. 다음 사용자의 에러/트러블슈팅 질문을 읽고 해결책을 제시해주세요.

[제목]: ${post.TITLE}
[내용]: ${cleanContent}

답변 작성 규칙:
1. 답변은 반드시 HTML 태그(<p>, <ul>, <li>, <strong>, <pre>, <code> 등)로만 구성하세요. 마크다운(Markdown)은 절대 사용하지 마세요.
2. 코드가 필요하다면 <pre><code>...</code></pre> 형태로 작성하세요.
3. 친절하고 명확하게 원인과 해결 방법을 설명해주세요.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
        });
        let htmlAnswer = response.text.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

        // DB 저장 (MERGE)
        await conn.execute(
            `MERGE INTO AI_ANSWERS a
       USING (SELECT :postId AS POST_ID FROM DUAL) s ON (a.POST_ID = s.POST_ID)
       WHEN MATCHED THEN UPDATE SET a.ANSWER = :answer, a.UPDATED_AT = SYSDATE
       WHEN NOT MATCHED THEN INSERT (POST_ID, ANSWER, CREATED_AT, UPDATED_AT)
                              VALUES (:postId2, :answer2, SYSDATE, SYSDATE)`,
            { postId: Number(postId), answer: htmlAnswer, postId2: Number(postId), answer2: htmlAnswer },
            { autoCommit: true }
        );

        res.json({ success: true, answer: htmlAnswer });
    } catch (err) {
        console.error('[POST /feed/:postId/ai-answer]', err);
        res.status(500).json({ success: false, message: 'AI 답변 생성 실패' });
    } finally {
        if (conn) await conn.close();
    }
});

// ── 게시글 등록 ──
router.post('/register', jwtAuthentication, async (req, res) => {
    const { category, title, content, tags, hide_like_count, disable_comments, location } = req.body;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await db.getConnection();
        const catRes = await connection.execute(`SELECT CATEGORY_ID FROM CATEGORIES WHERE CATEGORY_NAME = :c`, [category]);

        if (!catRes.rows || catRes.rows.length === 0) {
            return res.status(400).json({ success: false, message: '존재하지 않는 카테고리입니다.' });
        }

        const categoryId = catRes.rows[0][0];


        await connection.execute(
            `INSERT INTO POSTS (POST_ID, USER_ID, CATEGORY_ID, POST_TYPE, TITLE, CONTENT, LOCATION, HIDE_LIKE_COUNT, DISABLE_COMMENTS) 
     VALUES (SEQ_POST_ID.NEXTVAL, :userId, :categoryId, 'QUESTION', :title, EMPTY_CLOB(), :location, :hideLike, :disableComments)`,
            { userId, categoryId, title, location: location || null, hideLike: hide_like_count || 'N', disableComments: disable_comments || 'N' },
            { autoCommit: false }
        );

        const idRes = await connection.execute(`SELECT SEQ_POST_ID.CURRVAL FROM DUAL`);
        const postId = idRes.rows[0][0];

        const lobRes = await connection.execute(
            `SELECT CONTENT FROM POSTS WHERE POST_ID = :postId FOR UPDATE`,
            [postId],
            { autoCommit: false }
        );
        const lob = lobRes.rows[0][0];

        await new Promise((resolve, reject) => {
            lob.on('error', reject);
            lob.on('finish', resolve);
            lob.write(content, 'utf8');
            lob.end();
        });

        // 4. 이미지 및 비디오 경로 추출 (비디오도 추출되도록 확장)
        const mediaRegex = /<(img|video)[^>]+src="([^">]+)"/g;
        let match;
        while ((match = mediaRegex.exec(content)) !== null) {
            const fileUrl = match[2];
            if (fileUrl.includes('http://localhost:3010')) {
                const relativeUrl = fileUrl.replace('http://localhost:3010', '');
                await connection.execute(
                    `INSERT INTO ATTACHED_FILES (FILE_ID, USER_ID, TARGET_TYPE, TARGET_ID, FILE_URL) 
                     VALUES (SEQ_FILE_ID.NEXTVAL, :userId, 'POST', :postId, :imgUrl)`,
                    { userId, postId, imgUrl: relativeUrl },
                    { autoCommit: false }
                );
            }
        }

        // 5. 태그 처리
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                await connection.execute(
                    `MERGE INTO TAGS t
                     USING (SELECT :name AS TAG_NAME FROM DUAL) s
                     ON (t.TAG_NAME = s.TAG_NAME)
                     WHEN NOT MATCHED THEN
                       INSERT (TAG_ID, TAG_NAME) VALUES (SEQ_TAG_ID.NEXTVAL, :name2)`,
                    { name: tagName, name2: tagName },
                    { autoCommit: false }
                );

                const tagRes = await connection.execute(
                    `SELECT TAG_ID FROM TAGS WHERE TAG_NAME = :name`,
                    { name: tagName }
                );
                const tagId = tagRes.rows[0][0];

                await connection.execute(
                    `INSERT INTO POST_TAGS (POST_ID, TAG_ID) VALUES (:postId, :tagId)`,
                    { postId, tagId },
                    { autoCommit: false }
                );
            }
        }
        await connection.commit();
        res.status(201).json({ success: true, postId });
    } catch (err) {
        if (connection) await connection.rollback();
        console.error('REGISTER ERROR >>>', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/trending', jwtAuthentication, async (req, res) => {
    const { category } = req.query; // 'ERROR' | 'QUESTION' | 'FREE' | undefined
    const conn = await db.getConnection();
    try {
        const binds = {};
        let categoryFilter = '';
        if (category) {
            categoryFilter = `AND c.CATEGORY_NAME = :category`;
            binds.category = category;
        }
        const result = await conn.execute(
            `SELECT t.TAG_NAME, COUNT(pt.POST_ID) AS POST_COUNT
       FROM TAGS t
       JOIN POST_TAGS pt ON pt.TAG_ID = t.TAG_ID
       JOIN POSTS p ON p.POST_ID = pt.POST_ID AND p.STATUS = 'ACTIVE'
       LEFT JOIN CATEGORIES c ON c.CATEGORY_ID = p.CATEGORY_ID
       WHERE 1=1 ${categoryFilter}
       GROUP BY t.TAG_NAME
       ORDER BY POST_COUNT DESC
       FETCH FIRST 5 ROWS ONLY`,
            binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, tags: result.rows });
    } catch (err) {
        console.error('[GET /feed/trending]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.get('/list', jwtAuthentication, async (req, res) => {
    const userId = getUserId(req);
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `
            SELECT 
                p.POST_ID    AS "id",
                p.TITLE      AS "title",
                p.CONTENT    AS "description",
                p.USER_ID    AS "userId",
                p.CREATED_AT AS "createdAt",
                u.BIO_SHORT AS "bioShort",
                c.CATEGORY_NAME AS "category",
                u.NICKNAME   AS "writer",
                u.BIO        AS "role",
                p.LOCATION AS "LOCATION",
                (SELECT image_url FROM profile_images
                 WHERE user_id = u.user_id AND is_main = 'Y' AND rownum = 1) AS "avatar",
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS "likes",
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id AND user_id = :userId1) AS "liked",
                (SELECT COUNT(*) FROM bookmarks  WHERE post_id = p.post_id AND user_id = :userId2) AS "bookmarked",
                (SELECT COUNT(*) FROM comments   WHERE post_id = p.post_id AND status = 'ACTIVE') AS "commentCount",
                (SELECT LISTAGG(t.tag_name, ',') WITHIN GROUP (ORDER BY t.tag_id)
                 FROM post_tags pt JOIN tags t ON t.tag_id = pt.tag_id
                 WHERE pt.post_id = p.post_id) AS "tags",
                (SELECT LISTAGG(f.file_url, ',') WITHIN GROUP (ORDER BY f.file_id)
                 FROM attached_files f
                 WHERE f.target_id = p.post_id AND f.target_type = 'POST') AS "images",
                'FOLLOWING' AS "feedType"
            FROM posts p
            JOIN users u ON u.user_id = p.user_id
            LEFT JOIN categories c ON c.category_id = p.category_id
            WHERE p.status = 'ACTIVE'
              AND (
                  p.user_id = :userId3
                  OR p.user_id IN (
                      SELECT following_id FROM follows
                      WHERE follower_id = :userId3 AND status = 'ACCEPTED'
                  )
              )
              AND p.user_id NOT IN (
                  SELECT muted_id FROM mutes WHERE muter_id = :userId4
              )
              AND p.user_id NOT IN (
                  SELECT blocked_id FROM blocks WHERE blocker_id = :userId5
              )
            ORDER BY p.created_at DESC
        `;

        const result = await connection.execute(
            sql,
            { userId1: userId, userId2: userId, userId3: userId, userId4: userId, userId5: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const feeds = await Promise.all(result.rows.map(async (row) => {
            let desc = row.description;
            if (desc && typeof desc.getData === 'function')
                desc = await desc.getData();
            return {
                ...row,
                description: desc,
                liked: row.liked > 0,
                bookmarked: row.bookmarked > 0,
                tags: row.tags ? row.tags.split(',') : [],
            };
        }));

        res.status(200).json({ success: true, feeds });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/recommended', jwtAuthentication, async (req, res) => {
    const userId = getUserId(req);
    let connection;
    try {
        connection = await db.getConnection();
        const sql = `
            SELECT 
                p.POST_ID    AS "id",
                p.TITLE      AS "title",
                p.CONTENT    AS "description",
                p.USER_ID    AS "userId",
                p.CREATED_AT AS "createdAt",
                c.CATEGORY_NAME AS "category",
                u.NICKNAME   AS "writer",
                u.BIO_SHORT AS "bioShort",
                u.BIO        AS "role",
                (SELECT image_url FROM profile_images
                 WHERE user_id = u.user_id AND is_main = 'Y' AND rownum = 1) AS "avatar",
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS "likes",
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id AND user_id = :userId1) AS "liked",
                (SELECT COUNT(*) FROM bookmarks  WHERE post_id = p.post_id AND user_id = :userId2) AS "bookmarked",
                (SELECT COUNT(*) FROM comments   WHERE post_id = p.post_id AND status = 'ACTIVE') AS "commentCount",
                (SELECT LISTAGG(t.tag_name, ',') WITHIN GROUP (ORDER BY t.tag_id)
                 FROM post_tags pt JOIN tags t ON t.tag_id = pt.tag_id
                 WHERE pt.post_id = p.post_id) AS "tags",
                (SELECT LISTAGG(f.file_url, ',') WITHIN GROUP (ORDER BY f.file_id)
                 FROM attached_files f
                 WHERE f.target_id = p.post_id AND f.target_type = 'POST') AS "images",
                'RECOMMENDED' AS "feedType"
            FROM posts p
            JOIN users u ON u.user_id = p.user_id
            LEFT JOIN categories c ON c.category_id = p.category_id
            WHERE p.status = 'ACTIVE'
              AND NVL(u.is_private, 'N') = 'N'
              AND p.user_id != :userId3
              AND p.user_id NOT IN (
                  SELECT following_id FROM follows
                  WHERE follower_id = :userId4 AND status = 'ACCEPTED'
              )
              AND p.user_id NOT IN (
                  SELECT muted_id FROM mutes WHERE muter_id = :userId5
              )
              AND p.user_id NOT IN (
                  SELECT blocked_id FROM blocks WHERE blocker_id = :userId6
              )
            ORDER BY p.created_at DESC
            FETCH FIRST 20 ROWS ONLY
        `;

        const result = await connection.execute(
            sql,
            { userId1: userId, userId2: userId, userId3: userId, userId4: userId, userId5: userId, userId6: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const feeds = await Promise.all(result.rows.map(async (row) => {
            let desc = row.description;
            if (desc && typeof desc.getData === 'function')
                desc = await desc.getData();
            return {
                ...row,
                description: desc,
                liked: row.liked > 0,
                bookmarked: row.bookmarked > 0,
                tags: row.tags ? row.tags.split(',') : [],
            };
        }));

        res.status(200).json({ success: true, feeds });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/:postId', jwtAuthentication, async (req, res) => {
    const postId = Number(req.params.postId);
    const userId = getUserId(req);

    if (isNaN(postId)) {
        return res.status(400).json({ success: false, message: '유효하지 않은 게시글 번호입니다.' });
    }

    const conn = await db.getConnection();
    try {
        const postResult = await conn.execute(
            `SELECT p.*,
             p.LOCATION AS LOCATION, 
              p.HIDE_LIKE_COUNT AS HIDE_LIKE_COUNT,
   p.DISABLE_COMMENTS AS DISABLE_COMMENTS,
   c.CATEGORY_NAME AS CATEGORY_NAME,
       c.CATEGORY_NAME AS CATEGORY_NAME,
       u.NICKNAME  AS WRITER,
       u.BIO       AS ROLE,
       u.BIO_SHORT AS BIO_SHORT,
       (SELECT IMAGE_URL FROM PROFILE_IMAGES
        WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR,
       (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID) AS LIKES,
       (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID AND USER_ID = :userId1) AS LIKED,
       (SELECT COUNT(*) FROM BOOKMARKS  WHERE POST_ID = p.POST_ID AND USER_ID = :userId2) AS BOOKMARKED,
       (SELECT LISTAGG(t.tag_name, ',') WITHIN GROUP (ORDER BY t.tag_id)
        FROM post_tags pt JOIN tags t ON t.tag_id = pt.tag_id
        WHERE pt.post_id = p.post_id) AS TAGS
       FROM POSTS p
       JOIN USERS u ON u.USER_ID = p.USER_ID
       LEFT JOIN CATEGORIES c ON c.CATEGORY_ID = p.CATEGORY_ID
       WHERE p.POST_ID = :postId AND p.STATUS = 'ACTIVE'`,
            { postId, userId1: userId, userId2: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (!postResult.rows.length) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }

        const feed = postResult.rows[0];
        let content = feed.CONTENT;
        if (content && typeof content.getData === 'function') {
            content = await content.getData();
        }

        // 응답 먼저
        res.json({
            success: true,
            feed: {
                ...feed,
                CONTENT: content,
                liked: feed.LIKED > 0,
                bookmarked: feed.BOOKMARKED > 0,
                tags: feed.TAGS ? feed.TAGS.split(',') : [],
            },
        });

        // 조회수 처리는 응답 후 백그라운드에서
        db.getConnection().then(async (bgConn) => {
            try {
                const dupCheck = await bgConn.execute(
                    `SELECT COUNT(*) AS CNT FROM POST_VIEWS
           WHERE POST_ID = :postId AND USER_ID = :userId
           AND VIEWED_AT > SYSDATE - 1/24`,
                    { postId, userId },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                if (dupCheck.rows[0].CNT === 0) {
                    await bgConn.execute(
                        `INSERT INTO POST_VIEWS (POST_ID, USER_ID, IP_ADDR) VALUES (:postId, :userId, :ip)`,
                        { postId, userId, ip: req.ip }
                    );
                    await bgConn.execute(
                        `UPDATE POSTS SET VIEW_COUNT = VIEW_COUNT + 1 WHERE POST_ID = :postId`,
                        { postId }
                    );
                    await bgConn.commit();
                }
            } catch (e) {
                console.error('[view count bg]', e);
            } finally {
                await bgConn.close();
            }
        }).catch(() => { });

    } catch (err) {
        console.error('[GET /feed/:postId]', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});


router.get('/:postId/comments', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const conn = await db.getConnection();

    try {
        const result = await conn.execute(
            `SELECT c.COMMENT_ID, c.POST_ID, c.PARENT_ID,
                    c.CONTENT, c.CODE_CONTENT, c.LANGUAGE,
                    c.CREATED_AT,
                    u.NICKNAME  AS WRITER,
                    u.BIO       AS ROLE,
                    u.BIO_SHORT AS BIO_SHORT,
                    (SELECT IMAGE_URL FROM PROFILE_IMAGES
                     WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR,
                     (SELECT COUNT(*) FROM COMMENT_LIKES WHERE COMMENT_ID = c.COMMENT_ID) AS LIKE_COUNT,
(SELECT COUNT(*) FROM COMMENT_LIKES WHERE COMMENT_ID = c.COMMENT_ID AND USER_ID = :myUserId) AS MY_LIKE
             FROM COMMENTS c
             JOIN USERS u ON u.USER_ID = c.USER_ID
             WHERE c.POST_ID = :postId AND c.STATUS = 'ACTIVE'
             ORDER BY c.CREATED_AT ASC`,
            { postId, myUserId: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const map = {};
        const tree = [];
        result.rows.forEach(row => { map[row.COMMENT_ID] = { ...row, replies: [] }; });
        result.rows.forEach(row => {
            if (row.PARENT_ID && map[row.PARENT_ID]) {
                map[row.PARENT_ID].replies.push(map[row.COMMENT_ID]);
            } else {
                tree.push(map[row.COMMENT_ID]);
            }
        });

        const resolveClob = async (node) => {
            if (node.CONTENT && typeof node.CONTENT.getData === 'function') {
                node.CONTENT = await node.CONTENT.getData();
            }
            if (node.CODE_CONTENT && typeof node.CODE_CONTENT.getData === 'function') {
                node.CODE_CONTENT = await node.CODE_CONTENT.getData();
            }
            for (const reply of node.replies ?? []) await resolveClob(reply);
        };
        for (const node of tree) await resolveClob(node);

        return res.json({ success: true, comments: tree });
    } catch (err) {
        console.error('[GET /feed/:postId/comments]', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});

router.post('/:postId/comment', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const { text, content, parentId, codeContent, language, commentMode } = req.body;

    if (!text?.trim()) {
        return res.status(400).json({ success: false, message: '내용을 입력해주세요.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.execute(
            `INSERT INTO COMMENTS (COMMENT_ID, POST_ID, USER_ID, PARENT_ID, CONTENT, CODE_CONTENT, LANGUAGE, COMMENT_MODE, STATUS)
     VALUES (SEQ_COMMENT_ID.NEXTVAL, :postId, :userId, :parentId, :content, :codeContent, :language, :commentMode, 'ACTIVE')`,
            {
                postId, userId,
                parentId: parentId ?? null,
                content: content ?? text,
                codeContent: codeContent ?? null,
                language: language ?? null,
                commentMode: commentMode ?? 'plain',
            }
        );

        const postOwner = await conn.execute(
            `select user_id from posts where post_id = :postId`,
            { postId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const ownerId = postOwner.rows[0]?.USER_ID;
        if (ownerId && ownerId !== userId) {
            await conn.execute(
                `insert into notifications(noti_id, receiver_id, sender_id, noti_type, target_type, target_id)
                 values(seq_noti_id.nextval, :ownerId, :userId, 'COMMENT', 'POST', :postId)`,
                { ownerId, userId, postId }
            );
        }
        await conn.commit();

        const idRes = await conn.execute(`SELECT SEQ_COMMENT_ID.CURRVAL FROM DUAL`);
        const newId = idRes.rows[0][0];

        const inserted = await conn.execute(
            `SELECT c.COMMENT_ID, c.POST_ID, c.PARENT_ID,
                    c.CONTENT, c.CODE_CONTENT, c.LANGUAGE, c.COMMENT_MODE, c.COMMENT_MODE,c.CREATED_AT,
                    u.NICKNAME AS WRITER,
                    (SELECT IMAGE_URL FROM PROFILE_IMAGES
                     WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR
             FROM COMMENTS c
             JOIN USERS u ON u.USER_ID = c.USER_ID
             WHERE c.COMMENT_ID = :newId`,
            { newId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const row = inserted.rows[0];

        if (row.CONTENT && typeof row.CONTENT.getData === 'function') row.CONTENT = await row.CONTENT.getData();
        if (row.CODE_CONTENT && typeof row.CODE_CONTENT.getData === 'function') row.CODE_CONTENT = await row.CODE_CONTENT.getData();

        return res.json({ success: true, comment: { ...row, replies: [] } });
    } catch (err) {
        console.error('[POST /feed/:postId/comment]', err);
        await conn.rollback();
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});

router.post('/:postId/report', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const { reason, detail } = req.body;

    if (!reason) return res.status(400).json({ success: false, message: '신고 사유를 선택해주세요.' });

    const conn = await db.getConnection();
    try {
        await conn.execute(
            `INSERT INTO POST_REPORTS (POST_ID, USER_ID, REASON, DETAIL) VALUES (:postId, :userId, :reason, :detail)`,
            { postId, userId, reason, detail: detail ?? null }
        );
        await conn.commit();
        return res.json({ success: true, message: '신고가 접수되었습니다.' });
    } catch (err) {
        if (err.errorNum === 1) return res.status(409).json({ success: false, message: '이미 신고한 게시글입니다.' });
        console.error('[POST /feed/:postId/report]', err);
        await conn.rollback();
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});

router.post('/:postId/share', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.execute(`UPDATE POSTS SET SHARE_COUNT = SHARE_COUNT + 1 WHERE POST_ID = :postId`, { postId });
        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        console.error('[POST /feed/:postId/share]', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});

router.post('/:postId/like', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const conn = await db.getConnection();
    try {
        const exists = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM POST_LIKES WHERE POST_ID=:postId AND USER_ID=:userId`,
            { postId, userId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (exists.rows[0].CNT > 0) {
            await conn.execute(`DELETE FROM POST_LIKES WHERE POST_ID=:postId AND USER_ID=:userId`, { postId, userId });
        } else {
            await conn.execute(`INSERT INTO POST_LIKES (POST_ID, USER_ID) VALUES (:postId, :userId)`, { postId, userId });
        }
        if (exists.rows[0].CNT === 0) {
            const postOwner = await conn.execute(`select user_id from posts where post_id = :postId`, { postId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
            const ownerId = postOwner.rows[0]?.USER_ID;
            if (ownerId && ownerId !== userId) {
                await conn.execute(
                    `insert into notifications(noti_id, receiver_id, sender_id, noti_type, target_type, target_id)
                     values(seq_noti_id.nextval, :ownerId, :userId, 'LIKE', 'POST', :postId)`,
                    { ownerId, userId, postId }
                );
            }
        }
        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        console.error('[POST like]', err);
        return res.status(500).json({ success: false });
    } finally {
        await conn.close();
    }
});

router.delete('/:postId', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const conn = await db.getConnection();
    try {
        const check = await conn.execute(
            `SELECT USER_ID FROM POSTS WHERE POST_ID = :postId AND STATUS = 'ACTIVE'`,
            { postId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!check.rows.length) return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        if (check.rows[0].USER_ID !== userId) return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });

        await conn.execute(`UPDATE POSTS SET STATUS = 'DELETED' WHERE POST_ID = :postId`, { postId });
        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        console.error('[DELETE /feed/:postId]', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});

router.post('/:postId/bookmark', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const conn = await db.getConnection();
    try {
        const exists = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM BOOKMARKS WHERE POST_ID=:postId AND USER_ID=:userId`,
            { postId, userId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (exists.rows[0].CNT > 0) {
            await conn.execute(`DELETE FROM BOOKMARKS WHERE POST_ID=:postId AND USER_ID=:userId`, { postId, userId });
        } else {
            await conn.execute(`INSERT INTO BOOKMARKS (POST_ID, USER_ID) VALUES (:postId, :userId)`, { postId, userId });
        }
        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        console.error('[POST bookmark]', err);
        return res.status(500).json({ success: false });
    } finally {
        await conn.close();
    }
});

router.put('/:postId', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const { category, title, content, tags, hide_like_count, disable_comments, location } = req.body;

    if (!title?.trim() || !content?.trim()) {
        return res.status(400).json({ success: false, message: '제목과 본문은 필수입니다.' });
    }

    const conn = await db.getConnection();
    try {
        const check = await conn.execute(
            `SELECT USER_ID FROM POSTS WHERE POST_ID = :postId AND STATUS = 'ACTIVE'`,
            { postId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!check.rows.length) return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        if (check.rows[0].USER_ID !== userId) return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });

        const catRes = await conn.execute(
            `SELECT CATEGORY_ID FROM CATEGORIES WHERE CATEGORY_NAME = :c`,
            [category], { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const categoryId = catRes.rows[0]?.CATEGORY_ID ?? null;

        await conn.execute(
            `UPDATE POSTS SET TITLE = :title, CATEGORY_ID = :categoryId, LOCATION = :location,
             HIDE_LIKE_COUNT = :hideLike, DISABLE_COMMENTS = :disableComments, UPDATED_AT = SYSDATE
             WHERE POST_ID = :postId`,
            { title, categoryId, location: location || null, hideLike: hide_like_count || 'N', disableComments: disable_comments || 'N', postId },
            { autoCommit: false }
        );

        const lobRes = await conn.execute(
            `SELECT CONTENT FROM POSTS WHERE POST_ID = :postId FOR UPDATE`,
            [postId], { autoCommit: false }
        );
        const lob = lobRes.rows[0][0];
        await new Promise((resolve, reject) => {
            lob.on('error', reject);
            lob.on('finish', resolve);
            lob.write(content, 'utf8');
            lob.end();
        });

        // ✅ 이미지 처리: 기존 첨부파일 삭제 후 content에서 재추출하여 재등록
        await conn.execute(
            `DELETE FROM ATTACHED_FILES WHERE TARGET_TYPE = 'POST' AND TARGET_ID = :postId`,
            { postId }, { autoCommit: false }
        );

        const mediaRegex = /<(?:img|video)[^>]+src="([^">]+)"/g;
        let match;
        while ((match = mediaRegex.exec(content)) !== null) {
            const fileUrl = match[1];
            // 절대 URL이면 상대 경로로 변환, 이미 상대 경로면 그대로
            const relativeUrl = fileUrl.startsWith('http://localhost:3010')
                ? fileUrl.replace('http://localhost:3010', '')
                : fileUrl.startsWith('/uploads')
                    ? fileUrl
                    : null;

            if (relativeUrl) {
                await conn.execute(
                    `INSERT INTO ATTACHED_FILES (FILE_ID, USER_ID, TARGET_TYPE, TARGET_ID, FILE_URL)
                     VALUES (SEQ_FILE_ID.NEXTVAL, :userId, 'POST', :postId, :fileUrl)`,
                    { userId, postId, fileUrl: relativeUrl },
                    { autoCommit: false }
                );
            }
        }

        // 태그 처리
        await conn.execute(`DELETE FROM POST_TAGS WHERE POST_ID = :postId`, { postId }, { autoCommit: false });
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                await conn.execute(
                    `MERGE INTO TAGS t USING (SELECT :name AS TAG_NAME FROM DUAL) s ON (t.TAG_NAME = s.TAG_NAME)
                     WHEN NOT MATCHED THEN INSERT (TAG_ID, TAG_NAME) VALUES (SEQ_TAG_ID.NEXTVAL, :name2)`,
                    { name: tagName, name2: tagName }, { autoCommit: false }
                );
                const tagRes = await conn.execute(`SELECT TAG_ID FROM TAGS WHERE TAG_NAME = :name`, { name: tagName });
                const tagId = tagRes.rows[0][0];
                await conn.execute(`INSERT INTO POST_TAGS (POST_ID, TAG_ID) VALUES (:postId, :tagId)`, { postId, tagId }, { autoCommit: false });
            }
        }

        await conn.commit();
        return res.json({ success: true, postId });
    } catch (err) {
        await conn.rollback();
        console.error('[PUT /feed/:postId]', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.put('/:postId/comment/:commentId', jwtAuthentication, async (req, res) => {
    const { commentId } = req.params;
    const userId = getUserId(req);
    const { content } = req.body;
    const conn = await db.getConnection();
    try {
        const check = await conn.execute(
            `SELECT USER_ID FROM COMMENTS WHERE COMMENT_ID = :commentId AND STATUS = 'ACTIVE'`,
            { commentId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!check.rows.length) return res.status(404).json({ success: false });
        if (check.rows[0].USER_ID !== userId) return res.status(403).json({ success: false });

        const lobRes = await conn.execute(
            `SELECT CONTENT FROM COMMENTS WHERE COMMENT_ID = :commentId FOR UPDATE`,
            [commentId], { autoCommit: false }
        );
        const lob = lobRes.rows[0][0];
        await new Promise((resolve, reject) => {
            lob.on('error', reject);
            lob.on('finish', resolve);
            lob.write(content, 'utf8');
            lob.end();
        });
        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.delete('/:postId/comment/:commentId', jwtAuthentication, async (req, res) => {
    const { commentId } = req.params;
    const userId = getUserId(req);
    const conn = await db.getConnection();
    try {
        const check = await conn.execute(
            `SELECT USER_ID FROM COMMENTS WHERE COMMENT_ID = :commentId AND STATUS = 'ACTIVE'`,
            { commentId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!check.rows.length) return res.status(404).json({ success: false });
        if (check.rows[0].USER_ID !== userId) return res.status(403).json({ success: false });

        await conn.execute(
            `UPDATE COMMENTS SET STATUS = 'DELETED', DELETED_AT = SYSDATE WHERE COMMENT_ID = :commentId`,
            { commentId }, { autoCommit: true }
        );
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.post('/:postId/comment/:commentId/report', jwtAuthentication, async (req, res) => {
    const { commentId } = req.params;
    const userId = getUserId(req);
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false });
    const conn = await db.getConnection();
    try {
        const dup = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM REPORTS 
             WHERE TARGET_TYPE = 'COMMENT' AND TARGET_ID = :commentId AND REPORTER_ID = :userId`,
            { commentId, userId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (dup.rows[0].CNT > 0) return res.status(409).json({ success: false, message: '이미 신고한 댓글입니다.' });

        await conn.execute(
            `INSERT INTO REPORTS (REPORT_ID, TARGET_TYPE, TARGET_ID, REPORTER_ID, REASON)
             VALUES (SEQ_REPORT_ID.NEXTVAL, 'COMMENT', :commentId, :userId, :reason)`,
            { commentId, userId, reason }, { autoCommit: true }
        );
        return res.json({ success: true });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

// 댓글 좋아요 토글
router.post('/:postId/comment/:commentId/like', jwtAuthentication, async (req, res) => {
    const { commentId } = req.params;
    const userId = getUserId(req);
    const conn = await db.getConnection();
    try {
        const exists = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM COMMENT_LIKES WHERE COMMENT_ID=:commentId AND USER_ID=:userId`,
            { commentId, userId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (exists.rows[0].CNT > 0) {
            await conn.execute(`DELETE FROM COMMENT_LIKES WHERE COMMENT_ID=:commentId AND USER_ID=:userId`, { commentId, userId });
        } else {
            await conn.execute(`INSERT INTO COMMENT_LIKES (COMMENT_ID, USER_ID) VALUES (:commentId, :userId)`, { commentId, userId });
        }
        await conn.commit();
        const countRes = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM COMMENT_LIKES WHERE COMMENT_ID=:commentId`,
            { commentId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        return res.json({ success: true, liked: exists.rows[0].CNT === 0, count: countRes.rows[0].CNT });
    } catch (err) {
        return res.status(500).json({ success: false });
    } finally {
        await conn.close();
    }
});

module.exports = router;