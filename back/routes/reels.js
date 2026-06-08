const express = require('express');
const router = express.Router();
const db = require('../db');
const oracledb = require('oracledb');
const jwtAuthentication = require('../middlewares/auth');

router.get('/', jwtAuthentication, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();

        const sql = `
            SELECT 
                p.POST_ID AS "id",
                p.TITLE AS "overlayText",
                p.CONTENT AS "caption",
                p.SHARE_COUNT AS "shares",
                u.NICKNAME AS "username",
                u.USER_ID AS "userId",
(SELECT STATUS FROM FOLLOWS WHERE FOLLOWER_ID = :myUserId AND FOLLOWING_ID = u.USER_ID AND ROWNUM = 1) AS "followStatus",
                (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS "avatar",
                (SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID) AS "likes",
                (SELECT COUNT(*) FROM COMMENTS WHERE POST_ID = p.POST_ID AND STATUS = 'ACTIVE') AS "comments",
             (SELECT LISTAGG(t.TAG_NAME, ',') WITHIN GROUP (ORDER BY t.TAG_ID)
 FROM POST_TAGS pt JOIN TAGS t ON t.TAG_ID = pt.TAG_ID
 WHERE pt.POST_ID = p.POST_ID) AS "tags",
                (SELECT FILE_URL FROM ATTACHED_FILES 
                 WHERE TARGET_ID = p.POST_ID AND TARGET_TYPE = 'POST' 
                   AND (FILE_URL LIKE '%.mp4' OR FILE_URL LIKE '%.webm' OR FILE_URL LIKE '%.mov') 
                   AND ROWNUM = 1) AS "videoSrc"
            FROM POSTS p
            JOIN USERS u ON u.USER_ID = p.USER_ID
            WHERE p.STATUS = 'ACTIVE'
              AND EXISTS (
                  SELECT 1 FROM ATTACHED_FILES 
                  WHERE TARGET_ID = p.POST_ID AND TARGET_TYPE = 'POST'
                    AND (FILE_URL LIKE '%.mp4' OR FILE_URL LIKE '%.webm' OR FILE_URL LIKE '%.mov')
              )
            ORDER BY p.CREATED_AT DESC
            FETCH FIRST 20 ROWS ONLY
        `;

        const myUserId = req.user?.userId ?? req.user?.id;
        const result = await connection.execute(sql, { myUserId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        const API_URL = 'http://localhost:3010';

        const reels = await Promise.all(result.rows.map(async (row) => {
            let captionText = row.caption;

            if (captionText && typeof captionText.getData === 'function') {
                captionText = await captionText.getData();
            }
            if (captionText) {
                captionText = captionText
                    .replace(/<video[\s\S]*?<\/video>/gi, '')
                    .replace(/<[^>]+>/g, '')
                    .replace(/&nbsp;/g, ' ')
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/\s+/g, ' ')
                    .trim();
            }

            return {
                id: row.id,
                overlayText: row.overlayText,
                caption: captionText,
                username: row.username,
                userId: row.userId,         
                followStatus: row.followStatus ?? 'NONE', 
                tags: row.tags ? row.tags.split(',') : [],
                likes: row.likes || 0,
                comments: row.comments || 0,
                shares: row.shares || 0,
                videoSrc: row.videoSrc ? (row.videoSrc.startsWith('http') ? row.videoSrc : `${API_URL}${row.videoSrc}`) : null,
                avatar: row.avatar ? (row.avatar.startsWith('http') ? row.avatar : `${API_URL}${row.avatar}`) : null,
            };
        }));

        res.json({ success: true, reels });

    } catch (err) {
        console.error('[GET /reels error]', err);
        res.status(500).json({ success: false, message: '릴스 데이터를 불러오는 중 오류가 발생했습니다.' });
    } finally {
        if (connection) await connection.close();
    }
});

module.exports = router;