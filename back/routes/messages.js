const express = require('express');
const router = express.Router();
const oracledb = require('oracledb');
const db = require('../db');
const jwtAuthentication = require('../middlewares/auth');

const createUploader = require('../middlewares/upload');
const upload = createUploader('chat');


const typingStore = {};

router.get('/rooms', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    let conn;
    try {
        conn = await db.getConnection();

        const sql = `
            SELECT
                r.ROOM_ID,
                r.ROOM_TYPE,
                r.ROOM_NAME,
                r.ROOM_IMAGE, 
                CASE WHEN r.ROOM_TYPE = 'DIRECT' THEN u.NICKNAME ELSE r.ROOM_NAME END AS TARGET_NICKNAME,
                CASE WHEN r.ROOM_TYPE = 'DIRECT' THEN
                    (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1)
                ELSE NULL END AS TARGET_AVATAR,
                (SELECT COUNT(*) FROM CHAT_MEMBERS WHERE ROOM_ID = r.ROOM_ID) AS MEMBER_COUNT,
                (
                    SELECT MESSAGE FROM (
                        SELECT MESSAGE FROM CHAT_MESSAGES
                        WHERE ROOM_ID = r.ROOM_ID AND IS_DELETED = 'N'
                        ORDER BY SENT_AT DESC
                    ) WHERE ROWNUM = 1
                ) AS LAST_MESSAGE,
                (
                    SELECT MAX(SENT_AT) FROM CHAT_MESSAGES
                    WHERE ROOM_ID = r.ROOM_ID AND IS_DELETED = 'N'
                ) AS LAST_MESSAGE_AT,
                (
                    SELECT IMAGE_URL FROM (
                        SELECT IMAGE_URL FROM CHAT_MESSAGES
                        WHERE ROOM_ID = r.ROOM_ID AND IS_DELETED = 'N'
                        ORDER BY SENT_AT DESC
                    ) WHERE ROWNUM = 1
                ) AS LAST_IMAGE_URL,
                (
                    SELECT SENDER_NICKNAME FROM (
                        SELECT su.NICKNAME AS SENDER_NICKNAME 
                        FROM CHAT_MESSAGES cm_inner
                        JOIN USERS su ON cm_inner.SENDER_ID = su.USER_ID
                        WHERE cm_inner.ROOM_ID = r.ROOM_ID AND cm_inner.IS_DELETED = 'N'
                        ORDER BY cm_inner.SENT_AT DESC
                    ) WHERE ROWNUM = 1
                ) AS LAST_SENDER_NICKNAME,
                (
                    SELECT SENDER_AVATAR FROM (
                        SELECT (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = cm_inner.SENDER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS SENDER_AVATAR
                        FROM CHAT_MESSAGES cm_inner
                        WHERE cm_inner.ROOM_ID = r.ROOM_ID AND cm_inner.IS_DELETED = 'N'
                        ORDER BY cm_inner.SENT_AT DESC
                    ) WHERE ROWNUM = 1
                ) AS LAST_SENDER_AVATAR,
               (
    SELECT COUNT(*) FROM CHAT_MESSAGES msg2
    WHERE msg2.ROOM_ID = r.ROOM_ID
      AND msg2.SENDER_ID != :myId
      AND msg2.IS_READ = 'N'
      AND msg2.IS_DELETED = 'N'
      AND NOT EXISTS (
          SELECT 1 FROM CHAT_MESSAGE_DELETES d
          WHERE d.MESSAGE_ID = msg2.MESSAGE_ID AND d.USER_ID = :myId
      )
) AS UNREAD_COUNT,
        CASE 
        WHEN EXISTS (SELECT 1 FROM BLOCKS WHERE BLOCKER_ID = :myId2 AND BLOCKED_ID = u.USER_ID) THEN 'ME'
        WHEN EXISTS (SELECT 1 FROM BLOCKS WHERE BLOCKER_ID = u.USER_ID AND BLOCKED_ID = :myId3) THEN 'THEM'
        ELSE NULL
        END AS BLOCK_STATUS
            FROM CHAT_ROOMS r
JOIN CHAT_MEMBERS cm1 ON r.ROOM_ID = cm1.ROOM_ID AND cm1.USER_ID = :myId AND cm1.IS_HIDDEN = 'N'
            LEFT JOIN CHAT_MEMBERS cm2 ON r.ROOM_ID = cm2.ROOM_ID
                AND cm2.USER_ID != :myId
                AND r.ROOM_TYPE = 'DIRECT'
            LEFT JOIN USERS u ON cm2.USER_ID = u.USER_ID
       WHERE r.ROOM_ID IN (SELECT ROOM_ID FROM CHAT_MEMBERS WHERE USER_ID = :myId AND IS_HIDDEN = 'N')
  AND (
    r.ROOM_TYPE = 'GROUP'
    OR EXISTS (
      SELECT 1 FROM CHAT_MESSAGES WHERE ROOM_ID = r.ROOM_ID AND IS_SYSTEM = 'N'
    )
  )
            ORDER BY LAST_MESSAGE_AT DESC NULLS LAST
        `;
        const result = await conn.execute(sql, { myId, myId2: myId, myId3: myId }, { outFormat: oracledb.OUT_FORMAT_OBJECT });

        const seen = new Set();
        const rooms = [];
        for (const row of result.rows) {
            if (seen.has(row.ROOM_ID)) continue;
            seen.add(row.ROOM_ID);

            if (row.ROOM_TYPE === 'GROUP') {
                const avatarRes = await conn.execute(
                    `SELECT u.NICKNAME, pi.IMAGE_URL
     FROM CHAT_MEMBERS cm
     JOIN USERS u ON cm.USER_ID = u.USER_ID
     LEFT JOIN PROFILE_IMAGES pi ON pi.USER_ID = cm.USER_ID AND pi.IS_MAIN = 'Y'
     WHERE cm.ROOM_ID = :roomId AND cm.USER_ID != :myId AND ROWNUM <= 4`,
                    { roomId: row.ROOM_ID, myId },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                row.PARTICIPANT_AVATARS = avatarRes.rows.map(r => r.IMAGE_URL);
                row.PARTICIPANT_NICKNAMES = avatarRes.rows.map(r => r.NICKNAME);
                const nicknameRes = await conn.execute(
                    `SELECT u.NICKNAME FROM CHAT_MEMBERS cm
   JOIN USERS u ON cm.USER_ID = u.USER_ID
   WHERE cm.ROOM_ID = :roomId AND cm.USER_ID != :myId AND ROWNUM <= 3`,
                    { roomId: row.ROOM_ID, myId },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                const names = nicknameRes.rows.map(r => r.NICKNAME).join(', ');
                const displayName = row.ROOM_NAME || names;
                row.TARGET_NICKNAME = `${displayName} (${row.MEMBER_COUNT})`;
            }
            row.LAST_HAS_IMAGE = !!(row.LAST_IMAGE_URL && !row.LAST_MESSAGE?.trim());
            row.LAST_IS_STICKER = row.LAST_MESSAGE?.startsWith('__STICKER__') || false;
            if (row.LAST_IS_STICKER) row.LAST_MESSAGE = '';
            const isLastEmoticon = row.LAST_MESSAGE?.startsWith('__EMOTICON__') || false;
            if (isLastEmoticon) { row.LAST_MESSAGE = '이모티콘을 보냈습니다.'; row.LAST_HAS_IMAGE = false; }
            const unreadRes = await conn.execute(
                `SELECT MESSAGE, IMAGE_URL, SENT_AT,
            u.NICKNAME AS SENDER_NICKNAME
     FROM (
         SELECT cm.MESSAGE, cm.IMAGE_URL, cm.SENT_AT, cm.SENDER_ID
         FROM CHAT_MESSAGES cm
         WHERE cm.ROOM_ID = :roomId
           AND cm.SENDER_ID != :myId
           AND cm.IS_READ = 'N'
           AND cm.IS_DELETED = 'N'
AND NOT EXISTS (SELECT 1 FROM CHAT_MESSAGE_DELETES d WHERE d.MESSAGE_ID = cm.MESSAGE_ID AND d.USER_ID = :myId2)
         ORDER BY cm.SENT_AT DESC
     ) sub
     JOIN USERS u ON sub.SENDER_ID = u.USER_ID
     WHERE ROWNUM <= 3
     ORDER BY sub.SENT_AT ASC`,
                { roomId: row.ROOM_ID, myId, myId2: myId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            row.UNREAD_MESSAGES = unreadRes.rows;

            const muteRes = await conn.execute(
                `SELECT IS_MUTED FROM CHAT_MEMBER_SETTINGS WHERE ROOM_ID = :roomId AND USER_ID = :myId`,
                { roomId: row.ROOM_ID, myId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            row.IS_MUTED = muteRes.rows[0]?.IS_MUTED === 'Y';
            if (row.BLOCK_STATUS) {
                row.IS_BLOCKED = true;
                row.TARGET_NICKNAME = '차단된 사용자';
                row.TARGET_AVATAR = null;
                row.PARTICIPANT_AVATARS = [];
                row.PARTICIPANT_NICKNAMES = [];
            }
            rooms.push(row);
        }
        const now = Date.now();
        rooms.forEach(room => {
            const roomTyping = typingStore[room.ROOM_ID] || {};
            room.TYPING_USERS = Object.entries(roomTyping)
                .filter(([uid, data]) => String(uid) !== String(myId) && data.expiresAt > now)
                .map(([, data]) => data.nickname);
        });
        res.json({ success: true, rooms });
    } catch (err) {
        console.error('[GET /messages/rooms]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.post('/room', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { targetNicknames } = req.body;
    let conn;

    try {
        conn = await db.getConnection();

        const placeholders = targetNicknames.map((_, i) => `:n${i}`).join(',');
        const binds = {};
        targetNicknames.forEach((n, i) => { binds[`n${i}`] = n; });

        const usersRes = await conn.execute(
            `SELECT USER_ID FROM USERS WHERE NICKNAME IN (${placeholders})`,
            binds, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (usersRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        const targetIds = usersRes.rows.map(r => r.USER_ID);

        // 1:1인 경우 기존 방 재사용
        if (targetIds.length === 1) {
            const targetId = targetIds[0];
            const roomRes = await conn.execute(
                `SELECT r.ROOM_ID FROM CHAT_ROOMS r
                 JOIN CHAT_MEMBERS m1 ON r.ROOM_ID = m1.ROOM_ID AND m1.USER_ID = :myId
                 JOIN CHAT_MEMBERS m2 ON r.ROOM_ID = m2.ROOM_ID AND m2.USER_ID = :targetId
                 WHERE r.ROOM_TYPE = 'DIRECT'
                 AND (SELECT COUNT(*) FROM CHAT_MEMBERS WHERE ROOM_ID = r.ROOM_ID) = 2`,
                { myId, targetId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            if (roomRes.rows.length > 0) {
                await conn.execute(
                    `UPDATE CHAT_MEMBERS SET IS_HIDDEN = 'N' WHERE ROOM_ID = :roomId AND USER_ID = :myId`,
                    { roomId: roomRes.rows[0].ROOM_ID, myId },
                    { autoCommit: true }
                );
                return res.json({ success: true, roomId: roomRes.rows[0].ROOM_ID });
            }
        }

        const roomType = targetIds.length > 1 ? 'GROUP' : 'DIRECT';

        const newRoomRes = await conn.execute(
            `SELECT SEQ_ROOM_ID.NEXTVAL AS NEW_ID FROM DUAL`,
            {}, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const newRoomId = newRoomRes.rows[0].NEW_ID;

        await conn.execute(
            `INSERT INTO CHAT_ROOMS (ROOM_ID, ROOM_TYPE, CREATED_AT) VALUES (:newRoomId, :roomType, SYSDATE)`,
            { newRoomId, roomType }, { autoCommit: false }
        );
        await conn.execute(
            `INSERT INTO CHAT_MEMBERS (ROOM_ID, USER_ID, JOINED_AT) VALUES (:newRoomId, :myId, SYSDATE)`,
            { newRoomId, myId }, { autoCommit: false }
        );
        for (const tid of targetIds) {
            await conn.execute(
                `INSERT INTO CHAT_MEMBERS (ROOM_ID, USER_ID, JOINED_AT) VALUES (:newRoomId, :tid, SYSDATE)`,
                { newRoomId, tid }, { autoCommit: false }
            );
        }

        await conn.commit();

        if (roomType === 'GROUP') {
            const myNickRes = await conn.execute(
                `SELECT NICKNAME FROM USERS WHERE USER_ID = :myId`,
                { myId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            const myNick = myNickRes.rows[0]?.NICKNAME || '';
            const sysMsg = `${myNick}님이 ${targetNicknames.join(', ')}님을 초대했습니다.`;
            await conn.execute(
                `INSERT INTO CHAT_MESSAGES (MESSAGE_ID, ROOM_ID, SENDER_ID, MESSAGE, IS_SYSTEM, SENT_AT)
     VALUES (SEQ_MSG_ID.NEXTVAL, :newRoomId, :myId, :msg, 'Y', SYSDATE)`,
                { newRoomId, myId, msg: sysMsg }, { autoCommit: true }
            );
        }
        res.json({ success: true, roomId: newRoomId });

    } catch (err) {
        if (conn) await conn.rollback();
        console.error('[POST /messages/room]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.get('/:roomId', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    let conn;

    try {
        conn = await db.getConnection();

        const authCheck = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM CHAT_MEMBERS WHERE ROOM_ID = :roomId AND USER_ID = :myId AND IS_HIDDEN = 'N'
`,
            { roomId, myId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (authCheck.rows[0].CNT === 0) {
            return res.status(403).json({ success: false, message: '접근 권한이 없습니다.' });
        }

        const roomRes = await conn.execute(
            `SELECT r.ROOM_ID, r.ROOM_TYPE, r.ROOM_NAME, r.ROOM_IMAGE,
            (SELECT COUNT(*) FROM CHAT_MEMBERS WHERE ROOM_ID = r.ROOM_ID) AS MEMBER_COUNT,
                    u.NICKNAME AS TARGET_NICKNAME,
                    u.USER_ID AS TARGET_ID,
                    u.LAST_ACTIVE AS TARGET_LAST_ACTIVE,
                    (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS TARGET_AVATAR,
CASE 
                WHEN EXISTS (SELECT 1 FROM BLOCKS WHERE BLOCKER_ID = :myId2 AND BLOCKED_ID = u.USER_ID) THEN 'ME'
                WHEN EXISTS (SELECT 1 FROM BLOCKS WHERE BLOCKER_ID = u.USER_ID AND BLOCKED_ID = :myId3) THEN 'THEM'
                ELSE NULL
                END AS BLOCK_STATUS
             FROM CHAT_ROOMS r
             LEFT JOIN CHAT_MEMBERS cm ON r.ROOM_ID = cm.ROOM_ID AND cm.USER_ID != :myId AND r.ROOM_TYPE = 'DIRECT'
             LEFT JOIN USERS u ON cm.USER_ID = u.USER_ID
             WHERE r.ROOM_ID = :roomId
             FETCH FIRST 1 ROWS ONLY`,
            { myId, myId2: myId, myId3: myId, roomId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const roomInfo = roomRes.rows[0];
        if (roomInfo && roomInfo.ROOM_TYPE === 'GROUP') {
            const avatarRes = await conn.execute(
                `SELECT u.NICKNAME, pi.IMAGE_URL
     FROM CHAT_MEMBERS cm
     JOIN USERS u ON cm.USER_ID = u.USER_ID
     LEFT JOIN PROFILE_IMAGES pi ON pi.USER_ID = cm.USER_ID AND pi.IS_MAIN = 'Y'
     WHERE cm.ROOM_ID = :roomId AND cm.USER_ID != :myId AND ROWNUM <= 4`,
                { roomId, myId },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            roomInfo.PARTICIPANT_AVATARS = avatarRes.rows.map(r => r.IMAGE_URL);
            roomInfo.PARTICIPANT_NICKNAMES = avatarRes.rows.map(r => r.NICKNAME);
            if (!roomInfo.ROOM_NAME) {
                const nicknameRes = await conn.execute(
                    `SELECT u.NICKNAME FROM CHAT_MEMBERS cm
                     JOIN USERS u ON cm.USER_ID = u.USER_ID
                     WHERE cm.ROOM_ID = :roomId AND cm.USER_ID != :myId AND ROWNUM <= 3`,
                    { roomId, myId },
                    { outFormat: oracledb.OUT_FORMAT_OBJECT }
                );
                const names = nicknameRes.rows.map(r => r.NICKNAME).join(', ');
                roomInfo.TARGET_NICKNAME = `${names} (${roomInfo.MEMBER_COUNT})`;
            }
        }

        const msgRes = await conn.execute(
            `SELECT m.MESSAGE_ID, m.MESSAGE, m.SENT_AT, m.IS_READ,
       m.IMAGE_URL, m.IS_EDITED, m.IS_SYSTEM, m.IS_DELETED, m.IS_EMOTICON,
            u.NICKNAME AS SENDER_NICKNAME,
            u.USER_ID AS SENDER_ID,
            (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS SENDER_AVATAR
     FROM CHAT_MESSAGES m
     JOIN USERS u ON m.SENDER_ID = u.USER_ID
WHERE m.ROOM_ID = :roomId
  AND NOT EXISTS (
      SELECT 1 FROM CHAT_MESSAGE_DELETES d
      WHERE d.MESSAGE_ID = m.MESSAGE_ID AND d.USER_ID = :myId
  )
     ORDER BY m.SENT_AT ASC`,
            { roomId, myId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        await conn.execute(
            `UPDATE CHAT_MESSAGES SET IS_READ = 'Y'
             WHERE ROOM_ID = :roomId AND SENDER_ID != :myId AND IS_READ = 'N'`,
            { roomId, myId }
        );

        await conn.execute(
            `UPDATE CHAT_MEMBERS SET LAST_READ_AT = SYSDATE WHERE ROOM_ID = :roomId AND USER_ID = :myId`,
            { roomId, myId }
        );
        await conn.commit();

        res.json({ success: true, room: roomInfo, messages: msgRes.rows });
    } catch (err) {
        console.error('[GET /messages/:roomId]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.post('/:roomId/send', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    const { message, IS_SYSTEM, IS_EMOTICON } = req.body;

    if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: '메시지를 입력해주세요.' });
    }

    const isSystem = IS_SYSTEM === true || IS_SYSTEM === 'Y' ? 'Y' : 'N';

    let conn;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO CHAT_MESSAGES (MESSAGE_ID, ROOM_ID, SENDER_ID, MESSAGE, IS_SYSTEM, IS_EMOTICON, SENT_AT)
 VALUES (SEQ_MSG_ID.NEXTVAL, :roomId, :myId, :message, :isSystem, :isEmoticon, SYSDATE)`,
            { roomId, myId, message, isSystem, isEmoticon: IS_EMOTICON === true ? 'Y' : 'N' },
            { autoCommit: true }
        );
        res.json({ success: true });
    } catch (err) {
        console.error('[POST /messages/:roomId/send]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.post('/:roomId/upload', jwtAuthentication, upload.single('file'), async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;

    if (!req.file) {
        return res.status(400).json({ success: false, message: '파일이 없습니다.' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    const messageText = isImage ? ' ' : `[파일] ${req.file.originalname}`;
    let conn;
    try {
        conn = await db.getConnection();

        if (isImage) {
            // IMAGE_URL 컬럼에 저장
            await conn.execute(
                `INSERT INTO CHAT_MESSAGES (MESSAGE_ID, ROOM_ID, SENDER_ID, MESSAGE, IMAGE_URL, SENT_AT)
                 VALUES (SEQ_MSG_ID.NEXTVAL, :roomId, :myId, :message, :imageUrl, SYSDATE)`,
                { roomId, myId, message: messageText, imageUrl: fileUrl },
                { autoCommit: true }
            );
        } else {
            // 파일은 MESSAGE에 파일 경로 포함
            await conn.execute(
                `INSERT INTO CHAT_MESSAGES (MESSAGE_ID, ROOM_ID, SENDER_ID, MESSAGE, IMAGE_URL, SENT_AT)
                 VALUES (SEQ_MSG_ID.NEXTVAL, :roomId, :myId, :message, :fileUrl, SYSDATE)`,
                { roomId, myId, message: messageText, fileUrl },
                { autoCommit: true }
            );
        }

        res.json({
            success: true,
            imageUrl: isImage ? fileUrl : null,
            fileUrl: !isImage ? fileUrl : null,
            fileName: !isImage ? req.file.originalname : null,
            message: messageText
        });
    } catch (err) {
        console.error('[POST /messages/:roomId/upload]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// ─────────────────────────────────────────────
// PUT /messages/:roomId/edit — 메시지 수정
// IS_EDITED = 'Y' 처리
// ─────────────────────────────────────────────
router.put('/:roomId/edit', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { messageId, newMessage } = req.body;
    let conn;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `UPDATE CHAT_MESSAGES
             SET MESSAGE = :newMessage, IS_EDITED = 'Y'
             WHERE MESSAGE_ID = :messageId AND SENDER_ID = :myId`,
            { newMessage, messageId, myId }, { autoCommit: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.delete('/:roomId/delete-me', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { messageIds } = req.body;
    if (!messageIds || messageIds.length === 0) return res.json({ success: true });

    let conn;
    try {
        conn = await db.getConnection();
        for (const msgId of messageIds) {
            await conn.execute(
                `MERGE INTO CHAT_MESSAGE_DELETES d
         USING DUAL ON (d.MESSAGE_ID = :msgId AND d.USER_ID = :myId)
         WHEN NOT MATCHED THEN INSERT (MESSAGE_ID, USER_ID) VALUES (:msgId, :myId)`,
                { msgId, myId }, { autoCommit: false }
            );
        }
        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// ─────────────────────────────────────────────
// DELETE /messages/:roomId/delete-all — 모두에게서 삭제
// IS_DELETED = 'Y' 처리 (본인 메시지만)
// ─────────────────────────────────────────────
router.delete('/:roomId/delete-all', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { messageIds } = req.body;
    if (!messageIds || messageIds.length === 0) return res.json({ success: true });

    let conn;
    try {
        conn = await db.getConnection();
        for (const msgId of messageIds) {
            await conn.execute(
                `UPDATE CHAT_MESSAGES SET IS_DELETED = 'Y' WHERE MESSAGE_ID = :msgId AND SENDER_ID = :myId`,
                { msgId, myId }, { autoCommit: false }
            );
        }
        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        if (conn) await conn.rollback();
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// ─────────────────────────────────────────────
// DELETE /messages/:roomId/leave — 채팅방 나가기
// CHAT_MEMBERS에서 삭제, 방에 아무도 없으면 방도 삭제
// ─────────────────────────────────────────────
router.delete('/:roomId/leave', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    let conn;

    try {
        conn = await db.getConnection();
        await conn.execute(
            `INSERT INTO CHAT_MESSAGE_DELETES (MESSAGE_ID, USER_ID)
     SELECT MESSAGE_ID, :myId FROM CHAT_MESSAGES
     WHERE ROOM_ID = :roomId
       AND NOT EXISTS (
           SELECT 1 FROM CHAT_MESSAGE_DELETES d
           WHERE d.MESSAGE_ID = CHAT_MESSAGES.MESSAGE_ID AND d.USER_ID = :myId2
       )`,
            { myId, roomId, myId2: myId }, { autoCommit: false }
        );

        const roomTypeRes = await conn.execute(
            `SELECT ROOM_TYPE FROM CHAT_ROOMS WHERE ROOM_ID = :roomId`,
            { roomId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const roomType = roomTypeRes.rows[0]?.ROOM_TYPE;

        if (roomType === 'DIRECT') {
            await conn.execute(
                `UPDATE CHAT_MEMBERS SET IS_HIDDEN = 'Y' WHERE ROOM_ID = :roomId AND USER_ID = :myId`,
                { roomId, myId }, { autoCommit: false }
            );
        } else {
            await conn.execute(
                `DELETE FROM CHAT_MEMBERS WHERE ROOM_ID = :roomId AND USER_ID = :myId`,
                { roomId, myId }, { autoCommit: false }
            );
        }
        const cntRes = await conn.execute(
            `SELECT COUNT(*) AS CNT FROM CHAT_MEMBERS WHERE ROOM_ID = :roomId AND IS_HIDDEN = 'N'
`,
            { roomId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (cntRes.rows[0].CNT === 0) {
            await conn.execute(`DELETE FROM CHAT_MESSAGES WHERE ROOM_ID = :roomId`, { roomId }, { autoCommit: false });
            await conn.execute(`DELETE FROM CHAT_ROOMS WHERE ROOM_ID = :roomId`, { roomId }, { autoCommit: false });
        }

        await conn.commit();
        res.json({ success: true });
    } catch (err) {
        if (conn) await conn.rollback();
        console.error('[DELETE /messages/:roomId/leave]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.get('/:roomId/participants', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT u.USER_ID, u.NICKNAME, cm.LAST_READ_AT,
       (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR
FROM CHAT_MEMBERS cm
JOIN USERS u ON cm.USER_ID = u.USER_ID
WHERE cm.ROOM_ID = :roomId
ORDER BY cm.JOINED_AT ASC`,
            { roomId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, participants: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.post('/:roomId/typing', jwtAuthentication, (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    // 프론트에서 넘어온 nickname을 최우선으로 사용
    const myNickname = req.body.nickname || req.user?.nickname;
    const { roomId } = req.params;
    const { isTyping } = req.body;

    if (!typingStore[roomId]) typingStore[roomId] = {};

    if (isTyping) {
        typingStore[roomId][myId] = {
            nickname: myNickname,
            expiresAt: Date.now() + 3000
        };
    } else {
        delete typingStore[roomId][myId];
    }
    res.json({ success: true });
});

router.get('/:roomId/typing', jwtAuthentication, (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    const now = Date.now();
    const room = typingStore[roomId] || {};

    const typingUsers = Object.entries(room)
        // parseInt 대신 String 변환으로 타입 불일치 원천 차단
        .filter(([uid, data]) => String(uid) !== String(myId) && data.expiresAt > now)
        .map(([, data]) => data.nickname);

    for (const [uid, data] of Object.entries(room)) {
        if (data.expiresAt <= now) delete room[uid];
    }
    res.json({ success: true, typingUsers });
});

router.get('/:roomId/typing', jwtAuthentication, (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;

    const now = Date.now();
    const room = typingStore[roomId] || {};

    const typingUsers = Object.entries(room)
        .filter(([uid, data]) => parseInt(uid) !== myId && data.expiresAt > now)
        .map(([, data]) => data.nickname);

    // 만료된 항목 정리
    for (const [uid, data] of Object.entries(room)) {
        if (data.expiresAt <= now) delete room[uid];
    }

    res.json({ success: true, typingUsers });
});

// GET — USER_ID 조건 제거
router.get('/:roomId/settings', jwtAuthentication, async (req, res) => {
    const { roomId } = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT BG_COLOR, BUBBLE_STYLE FROM CHAT_ROOM_SETTINGS
             WHERE ROOM_ID = :roomId`,
            { roomId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, settings: result.rows[0] || { BG_COLOR: '#F8FAFC', BUBBLE_STYLE: 'rounded' } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// PUT — USER_ID 없이 방 단위로 UPSERT
router.put('/:roomId/settings', jwtAuthentication, async (req, res) => {
    const { roomId } = req.params;
    const { bgColor, bubbleStyle } = req.body;
    let conn;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `MERGE INTO CHAT_ROOM_SETTINGS s
             USING DUAL ON (s.ROOM_ID = :roomId)
             WHEN MATCHED THEN
                 UPDATE SET BG_COLOR = :bgColor, BUBBLE_STYLE = :bubbleStyle, UPDATED_AT = SYSDATE
             WHEN NOT MATCHED THEN
                 INSERT (ROOM_ID, BG_COLOR, BUBBLE_STYLE, UPDATED_AT)
                 VALUES (:roomId, :bgColor, :bubbleStyle, SYSDATE)`,
            { roomId, bgColor, bubbleStyle },
            { autoCommit: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// PUT /messages/:roomId/room-info — 채팅방 이름/사진 변경
router.put('/:roomId/room-info', jwtAuthentication, upload.single('roomImage'), async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    const { roomName } = req.body;
    let conn;
    try {
        conn = await db.getConnection();
        const imageUrl = req.file ? `/uploads/chat/${req.file.filename}` : null;

        await conn.execute(
            `UPDATE CHAT_ROOMS SET
                ROOM_NAME = :roomName
                ${imageUrl ? ', ROOM_IMAGE = :imageUrl' : ''}
             WHERE ROOM_ID = :roomId`,
            imageUrl ? { roomName, imageUrl, roomId } : { roomName, roomId },
            { autoCommit: true }
        );
        res.json({ success: true, roomName, imageUrl });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.get('/:roomId/peer-profile', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT u.USER_ID, u.NICKNAME, u.BIO_SHORT,
              (SELECT COUNT(*) FROM POSTS WHERE USER_ID = u.USER_ID AND STATUS = 'ACTIVE') AS POST_CNT,
              (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWER_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS FOLLOWING_CNT,
              (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWING_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS FOLLOWER_CNT,
              (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR,
              (SELECT STATUS FROM FOLLOWS WHERE FOLLOWER_ID = :myId AND FOLLOWING_ID = u.USER_ID) AS I_FOLLOW,
              (SELECT STATUS FROM FOLLOWS WHERE FOLLOWER_ID = u.USER_ID AND FOLLOWING_ID = :myId2) AS THEY_FOLLOW
       FROM CHAT_MEMBERS cm
       JOIN USERS u ON cm.USER_ID = u.USER_ID
       WHERE cm.ROOM_ID = :roomId AND cm.USER_ID != :myId3`,
            { myId, myId2: myId, myId3: myId, roomId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, peer: result.rows[0] || null });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

router.put('/:roomId/mute', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    const { isMuted } = req.body;
    let conn;
    try {
        conn = await db.getConnection();
        await conn.execute(
            `MERGE INTO CHAT_MEMBER_SETTINGS s
       USING DUAL ON (s.ROOM_ID = :roomId AND s.USER_ID = :myId)
       WHEN MATCHED THEN UPDATE SET IS_MUTED = :isMuted
       WHEN NOT MATCHED THEN INSERT (ROOM_ID, USER_ID, IS_MUTED)
       VALUES (:roomId, :myId, :isMuted)`,
            { roomId, myId, isMuted: isMuted ? 'Y' : 'N' },
            { autoCommit: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// 리액션 추가/취소
router.post('/:roomId/messages/:messageId/reaction', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId, messageId } = req.params;
    const { emoji } = req.body;
    let conn;
    try {
        conn = await db.getConnection();
        const existing = await conn.execute(
            `SELECT REACTION_ID FROM CHAT_REACTIONS WHERE MESSAGE_ID = :messageId AND USER_ID = :myId AND EMOJI = :emoji`,
            { messageId, myId, emoji }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (existing.rows.length > 0) {
            await conn.execute(
                `DELETE FROM CHAT_REACTIONS WHERE MESSAGE_ID = :messageId AND USER_ID = :myId AND EMOJI = :emoji`,
                { messageId, myId, emoji }, { autoCommit: true }
            );
            return res.json({ success: true, action: 'removed' });
        }
        await conn.execute(
            `INSERT INTO CHAT_REACTIONS (REACTION_ID, MESSAGE_ID, ROOM_ID, USER_ID, EMOJI, CREATED_AT)
             VALUES (SEQ_REACTION_ID.NEXTVAL, :messageId, :roomId, :myId, :emoji, SYSDATE)`,
            { messageId, roomId, myId, emoji }, { autoCommit: true }
        );
        res.json({ success: true, action: 'added' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// 메시지별 리액션 조회 (GET /:roomId 에서 messages 가져올 때 같이 포함시키거나 별도 호출)
router.get('/:roomId/reactions', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { roomId } = req.params;
    let conn;
    try {
        conn = await db.getConnection();
        const result = await conn.execute(
            `SELECT r.MESSAGE_ID, r.EMOJI, r.USER_ID, u.NICKNAME
             FROM CHAT_REACTIONS r
             JOIN USERS u ON r.USER_ID = u.USER_ID
             WHERE r.ROOM_ID = :roomId
             ORDER BY r.CREATED_AT ASC`,
            { roomId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        // MESSAGE_ID별로 그룹핑
        const grouped = {};
        for (const row of result.rows) {
            const mid = row.MESSAGE_ID;
            if (!grouped[mid]) grouped[mid] = {};
            if (!grouped[mid][row.EMOJI]) grouped[mid][row.EMOJI] = { count: 0, users: [], myReaction: false };
            grouped[mid][row.EMOJI].count++;
            grouped[mid][row.EMOJI].users.push(row.NICKNAME);
            if (row.USER_ID === myId) grouped[mid][row.EMOJI].myReaction = true;
        }
        res.json({ success: true, reactions: grouped });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

module.exports = router;