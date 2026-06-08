const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const db = require('../db');
const jwtAuthentication = require('../middlewares/auth');

const getUserId = (req) => req.user?.userId ?? req.user?.id ?? null;

router.get('/trending-tags', jwtAuthentication, async (req, res) => {
    const conn = await db.getConnection();
    try {
        const result = await conn.execute(
            `SELECT t.TAG_NAME,
        c.CATEGORY_NAME,
        MIN(c.DISPLAY_ORDER) AS DISPLAY_ORDER,
        COUNT(pt.POST_ID) AS POST_COUNT
        FROM TAGS t
        JOIN POST_TAGS pt ON pt.TAG_ID = t.TAG_ID
        JOIN POSTS p ON p.POST_ID = pt.POST_ID AND p.STATUS = 'ACTIVE'
        LEFT JOIN CATEGORIES c ON c.CATEGORY_ID = p.CATEGORY_ID
        GROUP BY t.TAG_NAME, c.CATEGORY_NAME
        ORDER BY MIN(c.DISPLAY_ORDER), POST_COUNT DESC
        FETCH FIRST 40 ROWS ONLY`
            ,
            {},
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, tags: result.rows });
    } catch (err) {
        console.error('[GET /explore/trending-tags]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.get('/recommended-users', jwtAuthentication, async (req, res) => {
    const userId = getUserId(req);
    const conn = await db.getConnection();
    try {
        const result = await conn.execute(
            `SELECT u.USER_ID,
                    u.NICKNAME,
                    u.BIO,
                    (SELECT IMAGE_URL FROM PROFILE_IMAGES
                     WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR,
                    (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWING_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS FOLLOWER_COUNT,
                  (SELECT CASE WHEN COUNT(*) > 0 THEN 'ACCEPTED' ELSE 'N' END
                    FROM FOLLOWS
                    WHERE FOLLOWER_ID = :userId1 AND FOLLOWING_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS IS_FOLLOWING
             FROM USERS u
         WHERE u.USER_ID != :userId2
            AND u.STATUS = 'ACTIVE'
            AND NOT EXISTS (
                SELECT 1 FROM FOLLOWS
                WHERE FOLLOWER_ID = :userId3 AND FOLLOWING_ID = u.USER_ID AND STATUS = 'ACCEPTED'
            )
             ORDER BY FOLLOWER_COUNT DESC
             FETCH FIRST 8 ROWS ONLY`,
            { userId1: userId, userId2: userId, userId3: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('[GET /explore/recommended-users]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.get('/posts', jwtAuthentication, async (req, res) => {
    const userId = getUserId(req);
    const conn = await db.getConnection();
    try {
        const sql = `
            SELECT p.POST_ID        AS "id",
                   p.TITLE          AS "title",
                   p.VIEW_COUNT     AS "viewCount",
                   u.NICKNAME       AS "writer",
                   (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID) AS "likes",
                   (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID AND USER_ID = :userId1) AS "liked",
                   (SELECT COUNT(*) FROM BOOKMARKS  WHERE POST_ID = p.POST_ID AND USER_ID = :userId2) AS "bookmarked",
                   (SELECT COUNT(*) FROM COMMENTS   WHERE POST_ID = p.POST_ID AND STATUS = 'ACTIVE')  AS "commentCount",
                   (SELECT LISTAGG(f.FILE_URL, ',') WITHIN GROUP (ORDER BY f.FILE_ID)
                    FROM ATTACHED_FILES f
                    WHERE f.TARGET_ID = p.POST_ID AND f.TARGET_TYPE = 'POST') AS "images"
            FROM POSTS p
            JOIN USERS u ON u.USER_ID = p.USER_ID
            WHERE p.STATUS = 'ACTIVE'
            ORDER BY p.CREATED_AT DESC
            FETCH FIRST 18 ROWS ONLY
        `;
        const result = await conn.execute(
            sql,
            { userId1: userId, userId2: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const posts = result.rows.map(row => {
            const imageList = row.images ? row.images.split(',') : [];
            return {
                ...row,
                firstImage: imageList[0] || '/uploads/post/defaultImg.png',
                liked: row.liked > 0,
                bookmarked: row.bookmarked > 0,
            };
        });

        res.json({ success: true, posts });
    } catch (err) {
        console.error('[GET /explore/posts]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.get('/search', jwtAuthentication, async (req, res) => {
    const userId = getUserId(req);
    const { q = '', type = 'all', tag = '', category = '', location = '', page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const keyword = `%${q.toLowerCase()}%`;

    const conn = await db.getConnection();
    try {
        const output = {};

        if (type === 'posts' || type === 'all') {
            const postSql = `
                SELECT p.POST_ID        AS "id",
                       p.TITLE          AS "title",
                       p.CONTENT        AS "description",
                       p.USER_ID        AS "userId",
                       p.CREATED_AT     AS "createdAt",
                       p.VIEW_COUNT     AS "viewCount",
                       c.CATEGORY_NAME  AS "category",
                       u.NICKNAME       AS "writer",
                       u.BIO            AS "role",
                       (SELECT IMAGE_URL FROM PROFILE_IMAGES
                        WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS "avatar",
                       (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID)                         AS "likes",
                       (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID AND USER_ID = :userId1)  AS "liked",
                       (SELECT COUNT(*) FROM BOOKMARKS  WHERE POST_ID = p.POST_ID AND USER_ID = :userId2)  AS "bookmarked",
                       (SELECT COUNT(*) FROM COMMENTS   WHERE POST_ID = p.POST_ID AND STATUS = 'ACTIVE')   AS "commentCount",
                       (SELECT LISTAGG(t.TAG_NAME, ',') WITHIN GROUP (ORDER BY t.TAG_ID)
                        FROM POST_TAGS pt JOIN TAGS t ON t.TAG_ID = pt.TAG_ID
                        WHERE pt.POST_ID = p.POST_ID) AS "tags",
                       (SELECT LISTAGG(f.FILE_URL, ',') WITHIN GROUP (ORDER BY f.FILE_ID)
                        FROM ATTACHED_FILES f
                        WHERE f.TARGET_ID = p.POST_ID AND f.TARGET_TYPE = 'POST') AS "images"
                FROM POSTS p
                JOIN USERS u ON u.USER_ID = p.USER_ID
                LEFT JOIN CATEGORIES c ON c.CATEGORY_ID = p.CATEGORY_ID
              WHERE p.STATUS = 'ACTIVE'
  AND (
        :q = '%%'
        OR LOWER(p.TITLE) LIKE :q
        OR EXISTS (
            SELECT 1 FROM POST_TAGS pt2
            JOIN TAGS t2 ON t2.TAG_ID = pt2.TAG_ID
            WHERE pt2.POST_ID = p.POST_ID
              AND LOWER(t2.TAG_NAME) LIKE :q2
        )
  )
AND (:category IS NULL OR :category = '' OR UPPER(c.CATEGORY_NAME) = UPPER(:category2))
AND (:location IS NULL OR :location = '' OR UPPER(p.LOCATION) = UPPER(:location2))  -- ← 추가
AND (:tag IS NULL OR :tag = '' OR EXISTS (
                        SELECT 1 FROM POST_TAGS pt3
                        JOIN TAGS t3 ON t3.TAG_ID = pt3.TAG_ID
                        WHERE pt3.POST_ID = p.POST_ID
                          AND LOWER(t3.TAG_NAME) = LOWER(:tag)
                  ))
                ORDER BY p.CREATED_AT DESC
                OFFSET :offset ROWS FETCH NEXT :lim ROWS ONLY
            `;
            const postRes = await conn.execute(
                postSql,
                { userId1: userId, userId2: userId, q: keyword, q2: keyword, tag: tag || null, category: category || null, category2: category || null, location: location || null, location2: location || null, offset, lim: Number(limit) },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            output.posts = await Promise.all(postRes.rows.map(async (row) => {
                let desc = row.description;
                if (desc && typeof desc.getData === 'function') desc = await desc.getData();
                const plainDesc = desc ? desc.replace(/<[^>]*>?/gm, '').slice(0, 150) : '';
                const imageList = row.images ? row.images.split(',') : [];
                return {
                    ...row,
                    description: plainDesc,
                    firstImage: imageList[0] || '/uploads/post/defaultImg.png',
                    liked: row.liked > 0,
                    bookmarked: row.bookmarked > 0,
                    tags: row.tags ? row.tags.split(',') : [],
                };
            }));
        }

        if (type === 'users' || type === 'all') {
            const userRes = await conn.execute(
                `SELECT u.USER_ID,
                        u.NICKNAME,
                        u.BIO,
                        (SELECT IMAGE_URL FROM PROFILE_IMAGES
                         WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR,
                        (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWING_ID = u.USER_ID AND STATUS = 'ACCEPTED')                          AS FOLLOWER_COUNT,
                        (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWER_ID = :userId AND FOLLOWING_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS IS_FOLLOWING
                 FROM USERS u
                 WHERE u.STATUS = 'ACTIVE'
                   AND u.USER_ID != :userId2
                   AND (:q = '%%' OR LOWER(u.NICKNAME) LIKE :q2 OR LOWER(u.EMAIL) LIKE :q3)
                 ORDER BY FOLLOWER_COUNT DESC
                 FETCH FIRST :lim ROWS ONLY`,
                { userId, userId2: userId, q: keyword, q2: keyword, q3: keyword, lim: Number(limit) },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            output.users = userRes.rows.map(u => ({
                ...u,
                IS_FOLLOWING: u.IS_FOLLOWING > 0,
            }));
        }

        if (type === 'tags' || type === 'all') {
            const tagRes = await conn.execute(
                `SELECT t.TAG_NAME,
                        COUNT(pt.POST_ID) AS POST_COUNT
                 FROM TAGS t
                 JOIN POST_TAGS pt ON pt.TAG_ID = t.TAG_ID
                 JOIN POSTS p ON p.POST_ID = pt.POST_ID AND p.STATUS = 'ACTIVE'
                 WHERE (:q = '%%' OR LOWER(t.TAG_NAME) LIKE :q2)
                 GROUP BY t.TAG_NAME
                 ORDER BY POST_COUNT DESC
                 FETCH FIRST :lim ROWS ONLY`,
                { q: keyword, q2: keyword, lim: Number(limit) },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            output.tags = tagRes.rows;
        }

        res.json({ success: true, ...output });
    } catch (err) {
        console.error('[GET /explore/search]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.post('/follow/:targetId', jwtAuthentication, async (req, res) => {
    const { targetId } = req.params;
    const userId = getUserId(req);

    if (Number(targetId) === userId) {
        return res.status(400).json({ success: false, message: '자기 자신을 팔로우할 수 없습니다.' });
    }

    const conn = await db.getConnection();
    try {
        const exists = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM FOLLOWS
             WHERE FOLLOWER_ID = :userId AND FOLLOWING_ID = :targetId AND STATUS = 'ACCEPTED'`,
            { userId, targetId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (exists.rows[0].CNT > 0) {
            await conn.execute(
                `DELETE FROM FOLLOWS WHERE FOLLOWER_ID = :userId AND FOLLOWING_ID = :targetId`,
                { userId, targetId }
            );
            await conn.execute(
                `DELETE FROM FOLLOW_REQUESTS
                 WHERE SENDER_ID = :userId AND RECEIVER_ID = :targetId`,
                { userId, targetId }
            );
        } else {
            await conn.execute(
                `INSERT INTO FOLLOWS (FOLLOWER_ID, FOLLOWING_ID, STATUS)
                 VALUES (:userId, :targetId, 'ACCEPTED')`,
                { userId, targetId }
            );
            await conn.execute(
                `MERGE INTO FOLLOW_REQUESTS fr
                 USING (SELECT :userId AS SID, :targetId AS RID FROM DUAL) src
                 ON (fr.SENDER_ID = src.SID AND fr.RECEIVER_ID = src.RID)
                 WHEN MATCHED THEN
                   UPDATE SET fr.STATUS = 'PENDING', fr.REQUESTED_AT = SYSDATE
                 WHEN NOT MATCHED THEN
                   INSERT (REQUEST_ID, SENDER_ID, RECEIVER_ID, STATUS)
                   VALUES (SEQ_REQUEST_ID.NEXTVAL, :userId2, :targetId2, 'PENDING')`,
                { userId, targetId, userId2: userId, targetId2: targetId }
            );
            await conn.execute(
                `INSERT INTO NOTIFICATIONS (NOTI_ID, RECEIVER_ID, SENDER_ID, NOTI_TYPE, TARGET_TYPE, TARGET_ID)
                 VALUES (SEQ_NOTI_ID.NEXTVAL, :targetId, :userId, 'FOLLOW', 'USER', :targetId2)`,
                { targetId, userId, targetId2: targetId }
            );
        }

        await conn.commit();
        const isFollowing = exists.rows[0].CNT === 0;
        res.json({ success: true, following: isFollowing });
    } catch (err) {
        await conn.rollback();
        console.error('[POST /explore/follow/:targetId]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

module.exports = router;