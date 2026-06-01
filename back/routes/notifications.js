const express = require('express');
const router = require('express').Router();
const oracledb = require('oracledb');
const db = require('../db');
const auth = require('../middlewares/auth');

// GET /notifications - 내 알림 목록
router.get('/', auth, async (req, res) => {
    const userId = req.user?.userId ?? req.user?.id;
    const conn = await db.getConnection();
    try {
        const result = await conn.execute(
            `SELECT n.noti_id, n.sender_id, n.noti_type, n.target_type,
                    n.target_id, n.is_read, n.created_at,
                    u.nickname as sender_name,
                    (select image_url from profile_images
                     where user_id = u.user_id and is_main = 'Y' and rownum = 1) as sender_avatar
             from notifications n
             left join users u on u.user_id = n.sender_id
             where n.receiver_id = :userId
             order by n.created_at desc`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const unread_count = result.rows.filter(r => r.IS_READ === 'N').length;
        res.json({ success: true, notifications: result.rows, unread_count });
    } catch (err) {
        console.error('[GET /notifications]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

// PUT /notifications/read - 전체 읽음 처리
router.put('/read', auth, async (req, res) => {
    const userId = req.user?.userId ?? req.user?.id;
    const conn = await db.getConnection();
    try {
        await conn.execute(
            `update notifications set is_read = 'Y' where receiver_id = :userId and is_read = 'N'`,
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