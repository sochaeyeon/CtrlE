const express = require('express');
const router = express.Router();
const getUserId = (req) => req.user?.userId ?? req.user?.id ?? null;
const oracledb = require('oracledb');
const db = require('../db');
const jwtAuthentication = require('../middlewares/auth');
const createUploader = require('../middlewares/upload');
const upload = createUploader('post');

router.post('/upload', jwtAuthentication, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ success: false, message: '파일 없음' });
    res.json({ success: true, fileUrl: `/uploads/post/${req.file.filename}` });

});

router.post('/register', jwtAuthentication, async (req, res) => {
    const { category, title, content, tags } = req.body;
    const userId = req.user.userId;

    let connection;
    try {
        connection = await db.getConnection();
        const catRes = await connection.execute(`SELECT CATEGORY_ID FROM CATEGORIES WHERE CATEGORY_NAME = :c`, [category]);

        if (!catRes.rows || catRes.rows.length === 0) {
            return res.status(400).json({ success: false, message: '존재하지 않는 카테고리입니다.' });
        }

        const categoryId = catRes.rows[0][0];

        // 1. 초기 데이터 삽입 (CONTENT에는 EMPTY_CLOB() 사용)
        await connection.execute(
            `INSERT INTO POSTS (POST_ID, USER_ID, CATEGORY_ID, POST_TYPE, TITLE, CONTENT) 
             VALUES (SEQ_POST_ID.NEXTVAL, :userId, :categoryId, 'QUESTION', :title, EMPTY_CLOB())`,
            { userId, categoryId, title },
            { autoCommit: false }
        );

        // 2. 방금 삽입한 POST_ID 가져오기
        const idRes = await connection.execute(`SELECT SEQ_POST_ID.CURRVAL FROM DUAL`);
        const postId = idRes.rows[0][0];

        // 3. CLOB 스트리밍 시작
        const lobRes = await connection.execute(
            `SELECT CONTENT FROM POSTS WHERE POST_ID = :postId FOR UPDATE`,
            [postId],
            { autoCommit: false }
        );
        const lob = lobRes.rows[0][0];

        // 💡 중요: 텍스트를 스트림으로 작성
        await new Promise((resolve, reject) => {
            lob.on('error', reject);
            lob.on('finish', resolve);
            lob.write(content, 'utf8');
            lob.end();
        });

        // 4. 이미지 경로 추출 및 ATTACHED_FILES 저장
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        while ((match = imgRegex.exec(content)) !== null) {
            // feed.js register 라우터
            const imgUrl = match[1];
            if (imgUrl.includes('http://localhost:3010')) {
                const relativeUrl = imgUrl.replace('http://localhost:3010', '');
                // 결과: /uploads/post/파일명.png  ← 이 형태로 저장되어야 함
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
                // 없으면 insert, 있으면 skip
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
// GET /feed/trending - 많이 사용된 태그 Top 5
router.get('/trending', jwtAuthentication, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const result = await conn.execute(
            `select t.tag_name, count(pt.post_id) as post_count
             from tags t
             join post_tags pt on pt.tag_id = t.tag_id
             join posts p on p.post_id = pt.post_id and p.status = 'ACTIVE'
             group by t.tag_name
             order by post_count desc
             fetch first 5 rows only`,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
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
                c.CATEGORY_NAME AS "category",
                u.NICKNAME   AS "writer",
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
                 WHERE f.target_id = p.post_id AND f.target_type = 'POST') AS "images"
            FROM posts p
            JOIN users u ON u.user_id = p.user_id
            LEFT JOIN categories c ON c.category_id = p.category_id
            WHERE p.status = 'ACTIVE'
            ORDER BY p.created_at DESC
        `;
        const result = await connection.execute(
            sql,
            { userId1: userId, userId2: userId },
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
    const { postId } = req.params;
    const userId = getUserId(req);
    const conn = await db.getConnection();

    try {
        // 1) 조회수 중복 방지: 최근 1시간 내 동일 유저+포스트 조회 여부 확인
        const dupCheck = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM POST_VIEWS
        WHERE POST_ID = :postId
          AND USER_ID = :userId
          AND VIEWED_AT > SYSDATE - 1/24`,
            { postId, userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }

        );

        if (dupCheck.rows[0].CNT === 0) {
            // 조회 이력 INSERT
            await conn.execute(
                `INSERT INTO POST_VIEWS (POST_ID, USER_ID, IP_ADDR)
         VALUES (:postId, :userId, :ip)`,
                { postId, userId, ip: req.ip }
            );
            // VIEW_COUNT 증가
            await conn.execute(
                `UPDATE POSTS SET VIEW_COUNT = VIEW_COUNT + 1 WHERE POST_ID = :postId`,
                { postId }
            );
            await conn.commit();
        }

        // 2) 게시글 조회
        const postResult = await conn.execute(
            `SELECT p.*,
      u.NICKNAME  AS WRITER,
      u.BIO       AS ROLE,
      (SELECT IMAGE_URL FROM PROFILE_IMAGES
       WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y'
       AND ROWNUM = 1) AS AVATAR,
      (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID) AS LIKES,
      (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID AND USER_ID = :userId1) AS LIKED,
      (SELECT COUNT(*) FROM BOOKMARKS  WHERE POST_ID = p.POST_ID AND USER_ID = :userId2) AS BOOKMARKED,
     (SELECT LISTAGG(t.tag_name, ',') WITHIN GROUP (ORDER BY t.tag_id)
  FROM post_tags pt JOIN tags t ON t.tag_id = pt.tag_id
  WHERE pt.post_id = p.post_id) AS TAGS

 FROM POSTS p
 JOIN USERS u ON u.USER_ID = p.USER_ID
WHERE p.POST_ID = :postId
  AND p.STATUS  = 'ACTIVE'`,
            { postId, userId1: userId, userId2: userId },  // ✅ 이름 다르게
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

        return res.json({
            success: true,
            feed: {
                ...feed,
                CONTENT: content,
                liked: feed.LIKED > 0,
                bookmarked: feed.BOOKMARKED > 0,
                tags: feed.TAGS ? feed.TAGS.split(',') : [],
            },
        });
    } catch (err) {
        console.error('[GET /feed/:postId]', err);
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});

router.get('/:postId/comments', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const conn = await db.getConnection();

    try {
        const result = await conn.execute(
            `SELECT c.COMMENT_ID, c.POST_ID, c.PARENT_ID,
              c.CONTENT, c.CODE_CONTENT, c.LANGUAGE,
              c.CREATED_AT,
              u.NICKNAME  AS WRITER,
              (SELECT IMAGE_URL FROM PROFILE_IMAGES
               WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y'
               AND ROWNUM = 1) AS AVATAR
         FROM COMMENTS c
         JOIN USERS u ON u.USER_ID = c.USER_ID
        WHERE c.POST_ID = :postId
          AND c.STATUS  = 'ACTIVE'
        ORDER BY c.CREATED_AT ASC`,
            { postId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }

        );

        // 플랫 배열 → 트리 구조 변환
        const map = {};
        const tree = [];
        result.rows.forEach(row => {
            map[row.COMMENT_ID] = { ...row, replies: [] };
        });
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
    const { text, content, parentId, codeContent, language } = req.body;

    if (!text?.trim()) {
        return res.status(400).json({ success: false, message: '내용을 입력해주세요.' });
    }

    const conn = await db.getConnection();
    try {
        const result = await conn.execute(
            `INSERT INTO COMMENTS
         (COMMENT_ID, POST_ID, USER_ID, PARENT_ID, CONTENT, CODE_CONTENT, LANGUAGE, STATUS)
       VALUES
         (SEQ_COMMENT_ID.NEXTVAL, :postId, :userId, :parentId, :content, :codeContent, :language, 'ACTIVE')`,
            {
                postId,
                userId,
                parentId: parentId ?? null,
                content: content ?? text,
                codeContent: codeContent ?? null,
                language: language ?? null,
            }
        );
        const postOwner = await conn.execute(
            `select user_id from posts where post_id = :postId`,
            { postId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
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

        // 방금 등록한 댓글 조회 (writer 포함)
        const inserted = await conn.execute(
            `SELECT c.COMMENT_ID, c.POST_ID, c.PARENT_ID,
              c.CONTENT, c.CODE_CONTENT, c.LANGUAGE, c.CREATED_AT,
               u.NICKNAME AS WRITER,
              (SELECT IMAGE_URL FROM PROFILE_IMAGES
               WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y'
               AND ROWNUM = 1) AS AVATAR
         FROM COMMENTS c
         JOIN USERS u ON u.USER_ID = c.USER_ID
        WHERE c.COMMENT_ID = :newId`,
            { newId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }

        );
        const row = inserted.rows[0];

        if (row.CONTENT && typeof row.CONTENT.getData === 'function') {
            row.CONTENT = await row.CONTENT.getData();
        }
        if (row.CODE_CONTENT && typeof row.CODE_CONTENT.getData === 'function') {
            row.CODE_CONTENT = await row.CODE_CONTENT.getData();
        }

        return res.json({
            success: true,
            comment: { ...row, replies: [] },
        });
    } catch (err) {
        console.error('[POST /feed/:postId/comment]', err);
        await conn.rollback();
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});

// ──────────────────────────────────────────────────────────
//  POST /feed/:postId/report  — 게시글 신고
// ──────────────────────────────────────────────────────────
router.post('/:postId/report', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const { reason, detail } = req.body;

    if (!reason) {
        return res.status(400).json({ success: false, message: '신고 사유를 선택해주세요.' });
    }

    const conn = await db.getConnection();
    try {
        await conn.execute(
            `INSERT INTO POST_REPORTS (POST_ID, USER_ID, REASON, DETAIL)
       VALUES (:postId, :userId, :reason, :detail)`,
            { postId, userId, reason, detail: detail ?? null }
        );
        await conn.commit();
        return res.json({ success: true, message: '신고가 접수되었습니다.' });
    } catch (err) {
        // ORA-00001: unique constraint — 이미 신고한 경우
        if (err.errorNum === 1) {
            return res.status(409).json({ success: false, message: '이미 신고한 게시글입니다.' });
        }
        console.error('[POST /feed/:postId/report]', err);
        await conn.rollback();
        return res.status(500).json({ success: false, message: '서버 오류' });
    } finally {
        await conn.close();
    }
});

// ──────────────────────────────────────────────────────────
//  POST /feed/:postId/share  — 공유 카운트 증가
// ──────────────────────────────────────────────────────────
router.post('/:postId/share', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.execute(
            `UPDATE POSTS SET SHARE_COUNT = SHARE_COUNT + 1 WHERE POST_ID = :postId`,
            { postId }
        );
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
            const postOwner = await conn.execute(
                `select user_id from posts where post_id = :postId`,
                { postId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
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
// DELETE /feed/:postId — 게시글 삭제
router.delete('/:postId', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const conn = await db.getConnection();
    try {
        // 본인 게시글인지 확인
        const check = await conn.execute(
            `SELECT USER_ID FROM POSTS WHERE POST_ID = :postId AND STATUS = 'ACTIVE'`,
            { postId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!check.rows.length) {
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        }
        if (check.rows[0].USER_ID !== userId) {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
        }

        // 소프트 삭제
        await conn.execute(
            `UPDATE POSTS SET STATUS = 'DELETED' WHERE POST_ID = :postId`,
            { postId }
        );
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

// PUT /feed/:postId — 게시글 수정
router.put('/:postId', jwtAuthentication, async (req, res) => {
    const { postId } = req.params;
    const userId = getUserId(req);
    const { category, title, content, tags } = req.body;

    if (!title?.trim() || !content?.trim()) {
        return res.status(400).json({ success: false, message: '제목과 본문은 필수입니다.' });
    }

    const conn = await db.getConnection();
    try {
        // 본인 게시글 확인
        const check = await conn.execute(
            `SELECT USER_ID FROM POSTS WHERE POST_ID = :postId AND STATUS = 'ACTIVE'`,
            { postId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (!check.rows.length)
            return res.status(404).json({ success: false, message: '게시글을 찾을 수 없습니다.' });
        if (check.rows[0].USER_ID !== userId)
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });

        // 카테고리 ID 조회
        const catRes = await conn.execute(
            `SELECT CATEGORY_ID FROM CATEGORIES WHERE CATEGORY_NAME = :c`,
            [category],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const categoryId = catRes.rows[0]?.CATEGORY_ID ?? null;

        // 제목 + 카테고리 업데이트
        await conn.execute(
            `UPDATE POSTS SET TITLE = :title, CATEGORY_ID = :categoryId, UPDATED_AT = SYSDATE
             WHERE POST_ID = :postId`,
            { title, categoryId, postId },
            { autoCommit: false }
        );

        // CLOB(본문) 업데이트
        const lobRes = await conn.execute(
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

        // 기존 태그 삭제 후 재삽입
        await conn.execute(
            `DELETE FROM POST_TAGS WHERE POST_ID = :postId`,
            { postId },
            { autoCommit: false }
        );
        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                await conn.execute(
                    `MERGE INTO TAGS t
                     USING (SELECT :name AS TAG_NAME FROM DUAL) s
                     ON (t.TAG_NAME = s.TAG_NAME)
                     WHEN NOT MATCHED THEN
                       INSERT (TAG_ID, TAG_NAME) VALUES (SEQ_TAG_ID.NEXTVAL, :name2)`,
                    { name: tagName, name2: tagName },
                    { autoCommit: false }
                );
                const tagRes = await conn.execute(
                    `SELECT TAG_ID FROM TAGS WHERE TAG_NAME = :name`,
                    { name: tagName }
                );
                const tagId = tagRes.rows[0][0];
                await conn.execute(
                    `INSERT INTO POST_TAGS (POST_ID, TAG_ID) VALUES (:postId, :tagId)`,
                    { postId, tagId },
                    { autoCommit: false }
                );
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

module.exports = router;