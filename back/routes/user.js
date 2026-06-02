const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const db = require('../db');
const oracledb = require('oracledb');
const jwtAuthentication = require('../middlewares/auth');
const JWT_SECRET = process.env.JWT_SECRET;
const createUploader = require('../middlewares/upload');
const upload = createUploader('profile');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const emailVerificationStore = {};

// ── [1단계] 이메일 인증 코드 발송 API ───────────────────────────
router.post('/signup/request', async (req, res) => {
    const { email, nickname } = req.body;

    if (!email || !email.trim() || !nickname || !nickname.trim()) {
        return res.status(400).json({ success: false, message: '이메일과 닉네임은 필수 입력 항목입니다.' });
    }

    let connection;

    try {
        connection = await db.getConnection();

        const emailCheckSql = `SELECT COUNT(*) AS CNT FROM USERS WHERE EMAIL = :email`;
        const emailResult = await connection.execute(emailCheckSql, { email });
        if (emailResult.rows[0][0] > 0) {
            return res.status(400).json({ success: false, message: '이미 가입된 이메일입니다.' });
        }

        const nickCheckSql = `SELECT COUNT(*) AS CNT FROM USERS WHERE NICKNAME = :nickname`;
        const nickResult = await connection.execute(nickCheckSql, { nickname });
        if (nickResult.rows[0][0] > 0) {
            return res.status(400).json({ success: false, message: '이미 사용 중인 닉네임입니다.' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        const mailOptions = {
            from: `"CtrlE" <${process.env.EMAIL_USER}>`,
            to: email.trim(),
            subject: '[CtrlE] 회원가입 보안 인증 코드입니다.',
            headers: {
                'X-Mailer': 'CtrlE_Mailer',
                'X-Priority': '3'
            },
            html: `
    <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 500px; padding: 32px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563EB; margin-bottom: 8px; letter-spacing: -0.05em;">CtrlE</h2>
        <p style="font-size: 16px; font-weight: bold; color: #0f172a;">안녕하세요, 개발자님!</p>
        <p style="font-size: 14px; color: #64748b; line-height: 1.6;">
        CtrlE 시스템 계정 생성을 위한 보안 인증 코드입니다.<br/>
        하단의 6자리 코드를 가입 화면에 입력해 주세요.
        </p>
        <div style="background-color: #f1f5f9; padding: 16px; text-align: center; font-size: 24px; font-weight: 800; color: #0f172a; letter-spacing: 4px; border-radius: 6px; margin: 24px 0;">
        ${verificationCode}
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">본 코드는 5분간 유효합니다. 가입을 요청하지 않았다면 이 메일을 무시하셔도 됩니다.</p>
    </div>
    `
        };

        await transporter.sendMail(mailOptions);

        emailVerificationStore[email] = {
            code: verificationCode,
            expiresAt: Date.now() + 5 * 60 * 1000
        };

        res.status(200).json({ success: true, message: '인증 코드가 성공적으로 발송되었습니다.' });

    } catch (err) {
        console.error('메일 요청 에러:', err);
        res.status(500).json({ success: false, message: '인증 메일 전송 중 서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
});

// ── [2단계] 인증코드 검증 및 최종 회원 데이터 인서트 API ──────────────────
router.post('/signup/verify', async (req, res) => {
    const { email, password, nickname, termsAgree, privacyAgree, marketingAgree, code } = req.body;

    const isOauthSkip = (code === 'OAUTH_SKIP_CODE');

    if (!isOauthSkip) {
        const record = emailVerificationStore[email];
        if (!record) {
            return res.status(400).json({ success: false, message: '인증 요청 이력이 없거나 잘못된 접근입니다.' });
        }
        if (Date.now() > record.expiresAt) {
            delete emailVerificationStore[email];
            return res.status(400).json({ success: false, message: '인증 시간이 만료되었습니다. 다시 요청해 주세요.' });
        }
        if (record.code !== code) {
            return res.status(400).json({ success: false, message: '인증 코드가 일치하지 않습니다.' });
        }
    }

    let connection;

    try {
        connection = await db.getConnection();

        const hashedPassword = isOauthSkip ? null : await bcrypt.hash(password, 10);

        const insertSql = `
            INSERT INTO USERS (
                USER_ID, EMAIL, PASSWORD, NICKNAME, 
                TERMS_AGREE_YN, PRIVACY_AGREE_YN, MARKETING_YN, 
                AGREED_AT, EMAIL_VERIFIED_AT, OAUTH_TYPE
            ) VALUES (
                SEQ_USER_ID.NEXTVAL, :email, :password, :nickname, 
                :terms, :privacy, :marketing, 
                SYSDATE, SYSDATE, :oauthType
            )
        `;

        const bindParams = {
            email: email,
            password: hashedPassword,
            nickname: nickname,
            terms: termsAgree === 'Y' || termsAgree === true ? 'Y' : 'N',
            privacy: privacyAgree === 'Y' || privacyAgree === true ? 'Y' : 'N',
            marketing: marketingAgree === 'Y' || marketingAgree === true ? 'Y' : 'N',
            oauthType: isOauthSkip ? 'PENDING' : 'LOCAL'
        };

        await connection.execute(insertSql, bindParams, { autoCommit: true });

        if (!isOauthSkip) {
            delete emailVerificationStore[email];
        }

        res.status(201).json({ success: true, message: 'CtrlE 회원가입이 최종 승인 완료되었습니다!' });

    } catch (err) {
        console.error('최종 가입 완료 에러:', err);
        res.status(500).json({ success: false, message: '데이터베이스 저장 중 서버 에러가 발생했습니다.' });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
});

// ── [3단계] 일반 로그인 검증 및 처리 API ──────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !email.trim() || !password) {
        return res.status(400).json({ success: false, message: '이메일과 비밀번호를 모두 입력해 주세요.' });
    }

    let connection;

    try {
        connection = await db.getConnection();

        const selectSql = `
            SELECT USER_ID, EMAIL, PASSWORD, NICKNAME, OAUTH_TYPE 
            FROM USERS 
            WHERE EMAIL = :email
        `;

        const result = await connection.execute(selectSql, { email: email.trim() });

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: '가입되지 않은 이메일 주소입니다.' });
        }

        const [userId, dbEmail, dbPassword, nickname, oauthType] = result.rows[0];

        if (!dbPassword && (oauthType === 'GOOGLE' || oauthType === 'GITHUB')) {
            return res.status(401).json({
                success: false,
                message: `소셜 회원가입 계정입니다. 하단의 ${oauthType} 로그인 버튼을 이용해 주세요.`
            });
        }

        const isMatch = await bcrypt.compare(password, dbPassword);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        const token = jwt.sign(
            { userId, email: dbEmail, nickname },
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(200).json({
            success: true,
            message: `${nickname}님, 환영합니다!`,
            token: token
        });

    } catch (err) {
        console.error('로그인 처리 에러:', err);
        res.status(500).json({ success: false, message: '로그인 처리 중 서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
});

// ──────────────────────────────────────────────────────────
//  GET /user/mypage/data  — BIO_SHORT + 카테고리 JOIN 추가
// ──────────────────────────────────────────────────────────
router.get('/mypage/data', jwtAuthentication, async (req, res) => {
    const userId = req.user.userId;
    let connection;
    try {
        connection = await db.getConnection();
        // userRes SELECT에 IS_PRIVATE 추가
        const userRes = await connection.execute(
            `SELECT 
     u.NICKNAME, u.EMAIL, u.BIO, u.BIO_SHORT, u.GITHUB, u.WEBSITE,
     u.IS_PRIVATE,
     (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWER_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS FOLLOWING_CNT,
     (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWING_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS FOLLOWER_CNT,
     (SELECT IMAGE_URL FROM PROFILE_IMAGES
      WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR
   FROM USERS u WHERE u.USER_ID = :id`,
            { id: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // postsRes SELECT에 좋아요수, 댓글수 추가
        const postsRes = await connection.execute(
            `SELECT 
     p.POST_ID AS "id",
     p.TITLE AS "title",
     p.CONTENT AS "description",
     p.CREATED_AT AS "CREATED_AT",
     NVL(c.CATEGORY_NAME, 'General') AS "tag",
(SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID) AS "likes",
     (SELECT COUNT(*) FROM COMMENTS WHERE POST_ID = p.POST_ID) AS "commentCount"
   FROM POSTS p
   LEFT JOIN CATEGORIES c ON c.CATEGORY_ID = p.CATEGORY_ID
   WHERE p.USER_ID = :id AND p.STATUS = 'ACTIVE'
   ORDER BY p.CREATED_AT DESC`,
            { id: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const postData = await Promise.all((postsRes.rows || []).map(async (row) => {
            let content = row.description;
            if (content && typeof content.getData === 'function') {
                content = await content.getData();
            }

            const imgMatch = content ? content.match(/<img[^>]+src=["']([^"']+)["']/) : null;
            const firstImage = imgMatch ? imgMatch[1] : null;

            return { ...row, description: content, images: firstImage };
        }));
        const userData = (userRes.rows && userRes.rows.length > 0) ? userRes.rows[0] : {};
        res.status(200).json({ success: true, user: userData, posts: postData });

    } catch (err) {
        console.error('MYPAGE_ERROR:', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

router.get('/followers', jwtAuthentication, async (req, res) => {
    const userId = req.user.userId;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT 
            u.USER_ID AS "userId",
            u.NICKNAME AS "nickname",
            u.BIO_SHORT AS "bioShort",
            (SELECT IMAGE_URL FROM PROFILE_IMAGES
             WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS "avatar",
            (SELECT STATUS FROM FOLLOWS         
             WHERE FOLLOWER_ID = :userId2 AND FOLLOWING_ID = u.USER_ID) AS "followStatus"
         FROM FOLLOWS f
         JOIN USERS u ON u.USER_ID = f.FOLLOWER_ID
         WHERE f.FOLLOWING_ID = :userId
         ORDER BY f.CREATED_AT DESC`,
            { userId, userId2: userId }, 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, list: result.rows || [] });
    } catch (err) {
        console.error('[GET /user/followers]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ──────────────────────────────────────────────────────────
//  GET /user/following  — 내가 팔로우하는 사람들
// ──────────────────────────────────────────────────────────
router.get('/following', jwtAuthentication, async (req, res) => {
    const userId = req.user.userId;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT 
                u.USER_ID AS "userId",
                u.NICKNAME AS "nickname",
                u.BIO_SHORT AS "bioShort",
                (SELECT IMAGE_URL FROM PROFILE_IMAGES
                 WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS "avatar"
             FROM FOLLOWS f
             JOIN USERS u ON u.USER_ID = f.FOLLOWING_ID
             WHERE f.FOLLOWER_ID = :userId
             ORDER BY f.CREATED_AT DESC`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, list: result.rows || [] });
    } catch (err) {
        console.error('[GET /user/following]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ──────────────────────────────────────────────────────────
//  PUT /user/profile
// ──────────────────────────────────────────────────────────
router.put('/profile', jwtAuthentication, async (req, res) => {
    const userId = req.user.userId;
    const { nickname, bio, bio_short, github, website } = req.body;

    if (!nickname || !nickname.trim()) {
        return res.status(400).json({ success: false, message: '닉네임은 필수 입력 항목입니다.' });
    }

    let connection;
    try {
        connection = await db.getConnection();

        const nickCheck = await connection.execute(
            `SELECT COUNT(*) AS CNT FROM USERS WHERE NICKNAME = :nickname AND USER_ID != :userId`,
            { nickname: nickname.trim(), userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        if (nickCheck.rows[0].CNT > 0) {
            return res.status(400).json({ success: false, message: '이미 사용 중인 닉네임입니다.' });
        }

        await connection.execute(
            `UPDATE USERS
             SET NICKNAME  = :nickname,
                 BIO       = :bio,
                 BIO_SHORT = :bio_short,
                 GITHUB    = :github,
                 WEBSITE   = :website
             WHERE USER_ID = :userId`,
            {
                nickname: nickname.trim(),
                bio: bio || null,
                bio_short: bio_short || null,
                github: github || null,
                website: website || null,
                userId,
            },
            { autoCommit: true }
        );

        res.json({ success: true, message: '프로필이 업데이트되었습니다.' });

    } catch (err) {
        console.error('[PUT /user/profile]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// ──────────────────────────────────────────────────────────
//  POST /user/avatar
// ──────────────────────────────────────────────────────────
router.post('/avatar', jwtAuthentication, upload.single('avatar'), async (req, res) => {
    const userId = req.user.userId;

    if (!req.file) {
        return res.status(400).json({ success: false, message: '이미지 파일이 없습니다.' });
    }

    const imageUrl = `/uploads/profile/${req.file.filename}`;

    let connection;
    try {
        connection = await db.getConnection();

        await connection.execute(
            `UPDATE PROFILE_IMAGES SET IS_MAIN = 'N' WHERE USER_ID = :userId`,
            { userId },
            { autoCommit: false }
        );

        await connection.execute(
            `INSERT INTO PROFILE_IMAGES (IMAGE_ID, USER_ID, IMAGE_URL, IS_MAIN)
             VALUES (SEQ_IMAGE_ID.NEXTVAL, :userId, :imageUrl, 'Y')`,
            { userId, imageUrl },
            { autoCommit: false }
        );

        await connection.commit();
        res.json({ success: true, imageUrl });

    } catch (err) {
        if (connection) await connection.rollback();
        console.error('[POST /user/avatar]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// =====================================================
// user.js 의 router.get('/suggestions', ...) 를 아래로 교체
// =====================================================

router.get('/suggestions', jwtAuthentication, async (req, res) => {
    const userId = req.user?.userId ?? req.user?.id;
    const conn = await db.getConnection();
    try {
        const result = await conn.execute(
            `SELECT u.USER_ID, u.NICKNAME, u.BIO_SHORT,
                    (SELECT image_url FROM profile_images
                     WHERE user_id = u.user_id AND is_main = 'Y' AND rownum = 1) AS AVATAR,
                    (SELECT COUNT(*) FROM follows
                     WHERE follower_id = u.user_id AND following_id = :userId3
                     AND status = 'ACCEPTED') AS FOLLOWS_ME
             FROM users u
             WHERE u.user_id <> :userId
               AND u.user_id NOT IN (
                   SELECT following_id FROM follows WHERE follower_id = :userId2
               )
               AND rownum <= 5`,
            { userId, userId2: userId, userId3: userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('[GET /user/suggestions]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.post('/follow/:targetId', jwtAuthentication, async (req, res) => {
    const userId = req.user?.userId ?? req.user?.id;
    const { targetId } = req.params;
    const conn = await db.getConnection();
    try {
        // 대상 유저 비밀계정 여부 확인
        const targetUser = await conn.execute(
            `SELECT IS_PRIVATE FROM USERS WHERE USER_ID = :targetId`,
            { targetId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        const isPrivate = targetUser.rows[0]?.IS_PRIVATE === 'Y';

        // 기존 팔로우/요청 여부 확인
        const exists = await conn.execute(
            `SELECT STATUS FROM FOLLOWS WHERE FOLLOWER_ID = :userId AND FOLLOWING_ID = :targetId`,
            { userId, targetId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (exists.rows.length > 0) {
            // 이미 존재 → 취소 (팔로우 또는 요청 모두)
            await conn.execute(
                `DELETE FROM FOLLOWS WHERE FOLLOWER_ID = :userId AND FOLLOWING_ID = :targetId`,
                { userId, targetId }
            );
            // 관련 알림도 삭제
            await conn.execute(
                `DELETE FROM NOTIFICATIONS 
                 WHERE SENDER_ID = :userId AND RECEIVER_ID = :targetId 
                 AND NOTI_TYPE IN ('FOLLOW', 'FOLLOW_REQUEST')`,
                { userId, targetId }
            );
            await conn.commit();
            return res.json({ success: true, status: 'NONE' });
        }

        // 신규
        const followStatus = isPrivate ? 'PENDING' : 'ACCEPTED';
        await conn.execute(
            `INSERT INTO FOLLOWS (FOLLOWER_ID, FOLLOWING_ID, STATUS) 
             VALUES (:userId, :targetId, :status)`,
            { userId, targetId, status: followStatus }
        );

        // 알림 타입 분기
        const notiType = isPrivate ? 'FOLLOW_REQUEST' : 'FOLLOW';
        await conn.execute(
            `INSERT INTO NOTIFICATIONS (NOTI_ID, RECEIVER_ID, SENDER_ID, NOTI_TYPE, TARGET_TYPE, TARGET_ID)
             VALUES (SEQ_NOTI_ID.NEXTVAL, :targetId, :userId, :notiType, 'USER', :userId2)`,
            { targetId, userId, notiType, userId2: userId }
        );

        await conn.commit();
        return res.json({ success: true, status: followStatus });
    } catch (err) {
        await conn.rollback();
        console.error('[POST /user/follow/:targetId]', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.put('/follow/:requesterId/accept', jwtAuthentication, async (req, res) => {
    const userId = req.user?.userId ?? req.user?.id; // 나 (수락하는 사람)
    const { requesterId } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.execute(
            `UPDATE FOLLOWS SET STATUS = 'ACCEPTED'
             WHERE FOLLOWER_ID = :requesterId AND FOLLOWING_ID = :userId AND STATUS = 'PENDING'`,
            { requesterId, userId }
        );
        // 요청 알림 → FOLLOW 알림으로 교체
        await conn.execute(
            `UPDATE NOTIFICATIONS SET NOTI_TYPE = 'FOLLOW'
             WHERE SENDER_ID = :requesterId AND RECEIVER_ID = :userId AND NOTI_TYPE = 'FOLLOW_REQUEST'`,
            { requesterId, userId }
        );
        // 수락 알림을 요청자에게 발송
        await conn.execute(
            `INSERT INTO NOTIFICATIONS (NOTI_ID, RECEIVER_ID, SENDER_ID, NOTI_TYPE, TARGET_TYPE, TARGET_ID)
             VALUES (SEQ_NOTI_ID.NEXTVAL, :requesterId, :userId, 'FOLLOW_ACCEPTED', 'USER', :userId2)`,
            { requesterId, userId, userId2: userId }
        );
        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        console.error('[PUT /user/follow/:requesterId/accept]', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.put('/follow/:requesterId/reject', jwtAuthentication, async (req, res) => {
    const userId = req.user?.userId ?? req.user?.id;
    const { requesterId } = req.params;
    const conn = await db.getConnection();
    try {
        await conn.execute(
            `DELETE FROM FOLLOWS 
             WHERE FOLLOWER_ID = :requesterId AND FOLLOWING_ID = :userId AND STATUS = 'PENDING'`,
            { requesterId, userId }
        );
        await conn.execute(
            `DELETE FROM NOTIFICATIONS
             WHERE SENDER_ID = :requesterId AND RECEIVER_ID = :userId AND NOTI_TYPE = 'FOLLOW_REQUEST'`,
            { requesterId, userId }
        );
        await conn.commit();
        return res.json({ success: true });
    } catch (err) {
        await conn.rollback();
        console.error('[PUT /user/follow/:requesterId/reject]', err);
        return res.status(500).json({ success: false, message: err.message });
    } finally {
        await conn.close();
    }
});

router.get('/profile/:nickname', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { nickname } = req.params;
    let connection;

    try {
        connection = await db.getConnection();
        const userRes = await connection.execute(
            `SELECT u.USER_ID, u.NICKNAME, u.BIO, u.BIO_SHORT, u.GITHUB, u.WEBSITE, u.IS_PRIVATE,
                    (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWER_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS FOLLOWING_CNT,
                    (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWING_ID = u.USER_ID AND STATUS = 'ACCEPTED') AS FOLLOWER_CNT,
                    (SELECT STATUS FROM FOLLOWS WHERE FOLLOWER_ID = :myId AND FOLLOWING_ID = u.USER_ID) AS FOLLOW_STATUS,
                    (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR
             FROM USERS u
             WHERE u.NICKNAME = :nickname`,
            { myId, nickname },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: '사용자를 찾을 수 없습니다.' });
        }

        const targetUser = userRes.rows[0];
        const isPrivate = targetUser.IS_PRIVATE === 'Y';
        const isFollowing = targetUser.FOLLOW_STATUS === 'ACCEPTED';
        const isMe = targetUser.USER_ID === myId;
        const canView = isMe || !isPrivate || isFollowing;

        let posts = [];

        if (canView) {
            const postsRes = await connection.execute(
                `SELECT p.POST_ID AS "id", p.TITLE AS "title", p.CONTENT AS "description", NVL(c.CATEGORY_NAME, 'General') AS "tag"
                 FROM POSTS p
                 LEFT JOIN CATEGORIES c ON c.CATEGORY_ID = p.CATEGORY_ID
                 WHERE p.USER_ID = :id AND p.STATUS = 'ACTIVE'
                 ORDER BY p.CREATED_AT DESC`,
                { id: targetUser.USER_ID },
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            posts = await Promise.all((postsRes.rows || []).map(async (row) => {
                let content = row.description;
                if (content && typeof content.getData === 'function') {
                    content = await content.getData();
                }
                const imgMatch = content ? content.match(/<img[^>]+src=["']([^"']+)["']/) : null;
                return { ...row, description: content, images: imgMatch ? imgMatch[1] : null };
            }));
        }

        res.json({
            success: true,
            user: targetUser,
            posts,
            canView,
            isMe
        });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// routes/user.js 에 추가
router.get('/search/public', jwtAuthentication, async (req, res) => {
    const myId = req.user?.userId ?? req.user?.id;
    const { q = '' } = req.query;
    // 검색어가 없으면 '%%'가 되어 모든 계정을 가져옵니다.
    const keyword = `%${q.toLowerCase()}%`;

    const conn = await db.getConnection();
    try {
        const sql = `
            SELECT u.USER_ID, u.NICKNAME, u.BIO_SHORT,
                   (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS AVATAR
            FROM USERS u
            WHERE NVL(u.IS_PRIVATE, 'N') = 'N' -- 비공개 계정 제외 (N이거나 NULL인 경우)
              AND u.USER_ID != :myId           -- 내 계정 제외
              AND LOWER(u.NICKNAME) LIKE :keyword
            ORDER BY u.USER_ID DESC            -- 최근 가입자 순으로 정렬
            FETCH FIRST 30 ROWS ONLY           -- 최대 30명까지만
        `;
        const result = await conn.execute(sql, { myId, keyword }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
        res.json({ success: true, users: result.rows });
    } catch (err) {
        console.error('[GET /user/search/public]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (conn) await conn.close();
    }
});

// GET /user/bookmarks
router.get('/bookmarks', jwtAuthentication, async (req, res) => {
    const userId = req.user.userId;
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT 
         p.POST_ID AS "id",
         p.TITLE AS "title",
         p.CONTENT AS "description",
         p.CREATED_AT AS "CREATED_AT",
         NVL(c.CATEGORY_NAME, 'General') AS "tag",
(SELECT COUNT(*) FROM POST_LIKES WHERE POST_ID = p.POST_ID) AS "likes",
         (SELECT COUNT(*) FROM COMMENTS WHERE POST_ID = p.POST_ID) AS "commentCount"
       FROM BOOKMARKS b
       JOIN POSTS p ON p.POST_ID = b.POST_ID
       LEFT JOIN CATEGORIES c ON c.CATEGORY_ID = p.CATEGORY_ID
       WHERE b.USER_ID = :userId AND p.STATUS = 'ACTIVE'
       ORDER BY b.CREATED_AT DESC`,
            { userId },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const bookmarkData = await Promise.all((result.rows || []).map(async (row) => {
            let content = row.description;
            if (content && typeof content.getData === 'function') {
                content = await content.getData();
            }
            const imgMatch = content ? content.match(/<img[^>]+src=["']([^"']+)["']/) : null;
            return { ...row, description: content, images: imgMatch ? imgMatch[1] : null };
        }));

        res.json({ success: true, list: bookmarkData });
    } catch (err) {
        console.error('[GET /user/bookmarks]', err);
        res.status(500).json({ success: false, message: err.message });
    } finally {
        if (connection) await connection.close();
    }
});

// GET /user/settings — 설정값 조회
router.get('/settings', jwtAuthentication, async (req, res) => {
  const userId = req.user.userId;
  const conn = await db.getConnection();
  try {
    const result = await conn.execute(
      `SELECT IS_PRIVATE, NOTI_COMMENT, NOTI_LIKE, NOTI_FOLLOW, NOTI_MESSAGE,
              MSG_ALLOW, GROUP_ALLOW, TAG_ALLOW, MENTION_ALLOW, HIDE_LIKE_COUNT
       FROM USERS WHERE USER_ID = :userId`,
      { userId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, settings: result.rows[0] });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
  finally { await conn.close(); }
});

// PUT /user/settings — 설정값 저장
router.put('/settings', jwtAuthentication, async (req, res) => {
  const userId = req.user.userId;
  const fields = ['is_private','noti_comment','noti_like','noti_follow','noti_message',
                  'msg_allow','group_allow','tag_allow','mention_allow','hide_like_count'];
  const body = req.body;
  const updates = fields.filter(f => body[f] !== undefined);
  if (!updates.length) return res.json({ success: true });
  const conn = await db.getConnection();
  try {
    const setClauses = updates.map(f => `${f.toUpperCase()} = :${f}`).join(', ');
    const binds = { userId };
    updates.forEach(f => binds[f] = body[f]);
    await conn.execute(`UPDATE USERS SET ${setClauses} WHERE USER_ID = :userId`, binds, { autoCommit: true });
    res.json({ success: true });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
  finally { await conn.close(); }
});

// GET /user/blocked — 차단 목록
router.get('/blocked', jwtAuthentication, async (req, res) => {
  const userId = req.user.userId;
  const conn = await db.getConnection();
  try {
    const result = await conn.execute(
      `SELECT u.USER_ID AS "userId", u.NICKNAME AS "nickname", u.BIO_SHORT AS "bioShort",
              (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS "avatar"
       FROM BLOCKS b JOIN USERS u ON u.USER_ID = b.BLOCKED_ID
       WHERE b.BLOCKER_ID = :userId ORDER BY b.CREATED_AT DESC`,
      { userId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, list: result.rows });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
  finally { await conn.close(); }
});

// POST /user/block/:targetId — 차단/해제 토글
router.post('/block/:targetId', jwtAuthentication, async (req, res) => {
  const userId = req.user.userId;
  const { targetId } = req.params;
  const conn = await db.getConnection();
  try {
    const exists = await conn.execute(
      `SELECT BLOCK_ID FROM BLOCKS WHERE BLOCKER_ID = :userId AND BLOCKED_ID = :targetId`,
      { userId, targetId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (exists.rows.length > 0) {
      await conn.execute(`DELETE FROM BLOCKS WHERE BLOCKER_ID = :userId AND BLOCKED_ID = :targetId`, { userId, targetId });
      await conn.commit();
      return res.json({ success: true, status: 'UNBLOCKED' });
    }
    await conn.execute(
      `INSERT INTO BLOCKS (BLOCK_ID, BLOCKER_ID, BLOCKED_ID) VALUES (SEQ_BLOCK_ID.NEXTVAL, :userId, :targetId)`,
      { userId, targetId }, { autoCommit: true }
    );
    res.json({ success: true, status: 'BLOCKED' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
  finally { await conn.close(); }
});

// GET /user/muted — 뮤트 목록
router.get('/muted', jwtAuthentication, async (req, res) => {
  const userId = req.user.userId;
  const conn = await db.getConnection();
  try {
    const result = await conn.execute(
      `SELECT u.USER_ID AS "userId", u.NICKNAME AS "nickname", u.BIO_SHORT AS "bioShort",
              (SELECT IMAGE_URL FROM PROFILE_IMAGES WHERE USER_ID = u.USER_ID AND IS_MAIN = 'Y' AND ROWNUM = 1) AS "avatar"
       FROM MUTES m JOIN USERS u ON u.USER_ID = m.MUTED_ID
       WHERE m.MUTER_ID = :userId ORDER BY m.CREATED_AT DESC`,
      { userId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json({ success: true, list: result.rows });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
  finally { await conn.close(); }
});

// POST /user/mute/:targetId — 뮤트/해제 토글
router.post('/mute/:targetId', jwtAuthentication, async (req, res) => {
  const userId = req.user.userId;
  const { targetId } = req.params;
  const conn = await db.getConnection();
  try {
    const exists = await conn.execute(
      `SELECT MUTE_ID FROM MUTES WHERE MUTER_ID = :userId AND MUTED_ID = :targetId`,
      { userId, targetId }, { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    if (exists.rows.length > 0) {
      await conn.execute(`DELETE FROM MUTES WHERE MUTER_ID = :userId AND MUTED_ID = :targetId`, { userId, targetId });
      await conn.commit();
      return res.json({ success: true, status: 'UNMUTED' });
    }
    await conn.execute(
      `INSERT INTO MUTES (MUTE_ID, MUTER_ID, MUTED_ID) VALUES (SEQ_MUTE_ID.NEXTVAL, :userId, :targetId)`,
      { userId, targetId }, { autoCommit: true }
    );
    res.json({ success: true, status: 'MUTED' });
  } catch(err) { res.status(500).json({ success: false, message: err.message }); }
  finally { await conn.close(); }
});

module.exports = router;