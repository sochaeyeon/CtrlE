const express = require('express');
const router = require('express').Router();
const oracledb = require('oracledb');
const db = require('../db');
const auth = require('../middlewares/auth');

router.get('/', auth, async (req, res) => {
    const userId = req.user?.userId ?? req.user?.id;
    const conn = await db.getConnection();
    try {
        const result = await conn.execute(
            `SELECT n.noti_id, n.sender_id, n.noti_type, n.target_type,
                    n.target_id, n.is_read, n.created_at,
                    u.nickname as sender_nickname,
                    (SELECT image_url FROM profile_images
                     WHERE user_id = u.user_id AND is_main = 'Y' AND rownum = 1) AS sender_avatar,
                    (SELECT CASE WHEN COUNT(*) > 0 THEN 'Y' ELSE 'N' END
                     FROM follows
                     WHERE follower_id = :userId AND following_id = n.sender_id) AS is_following,
                    CASE WHEN n.target_type = 'POST' THEN
                        (SELECT p.content FROM posts p WHERE p.post_id = n.target_id)
                    ELSE NULL END AS target_content
             FROM notifications n
             LEFT JOIN users u ON u.user_id = n.sender_id
             WHERE n.receiver_id = :userId
             ORDER BY n.created_at DESC`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const notifications = await Promise.all(result.rows.map(async (row) => {
            let targetImage = null;
            if (row.TARGET_CONTENT) {
                let content = row.TARGET_CONTENT;
                if (typeof content.getData === 'function') {
                    content = await content.getData();
                }
                const imgMatch = content.match(/<img[^>]+src=["']([^"']+)["']/);
                const videoMatch = content.match(/<(?:video|source)[^>]+src=["']([^"']+)["']/);
                targetImage = imgMatch ? imgMatch[1] : (videoMatch ? videoMatch[1] : null);
            }
            const isVideo = targetImage ? /\.(mp4|webm|mov)(\?|$)/i.test(targetImage) : false;
            const { TARGET_CONTENT, ...rest } = row;
            return { ...rest, TARGET_IMAGE: targetImage, TARGET_IS_VIDEO: isVideo ? 'Y' : 'N' };
        }));

        const unread_count = notifications.filter(r => r.IS_READ === 'N').length;
        res.json({ success: true, notifications, unread_count });
    } catch (err) {
        console.error('[GET /notifications]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.put('/read', auth, async (req, res) => {
    const userId = req.user?.userId ?? req.user?.id;
    const conn = await db.getConnection();
    try {
        await conn.execute(
            `UPDATE notifications SET is_read = 'Y' WHERE receiver_id = :userId AND is_read = 'N'`,
            { userId }
        );
        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        console.error('[PUT /notifications/read]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

module.exports = router;