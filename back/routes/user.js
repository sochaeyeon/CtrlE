const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const db = require('../db');
const oracledb = require('oracledb');
const jwtAuthentication = require('../middlewares/auth');
const JWT_SECRET = process.env.JWT_SECRET;

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

    // 💡 프론트엔드가 소셜 가입 우회용 특수 마킹 코드를 보냈는지 판단합니다.
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

        // 💡 소셜 가입일 경우 비밀번호 해싱 단계를 거치지 않고 완전히 비워둡니다. (디비 변경 기준 NULL 안착)
        // 만약 자체 비밀번호 생성을 원한다면 나중에 마이페이지 등에서 수정 가능하도록 인프라를 마련합니다.
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
            // 💡 소셜 가입 절차를 밟은 유저는 디폴트 연동 상태인 'PENDING'으로 두고, 
            // 가입 최종 승인 절차가 완전히 마무리될 때 auth.js confirm 라우터에서 GOOGLE/GITHUB로 확정 표기됩니다.
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

        // 💡 새로운 통합 컬럼인 OAUTH_TYPE을 디비에서 같이 퍼옵니다.
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

        // 💡 [핵심 가드 정정] 소셜 연동 계정이라도 일반 가입 시 비밀번호를 설정했다면 로그인이 가능해야 합니다.
        // 단, 비밀번호 컬럼이 비어있고 오직 소셜 로그인의 다리로만 들어온 계정인 경우에만 예외 가이드를 띄웁니다.
        if (!dbPassword && (oauthType === 'GOOGLE' || oauthType === 'GITHUB')) {
            return res.status(401).json({
                success: false,
                message: `소셜 회원가입 계정입니다. 하단의 ${oauthType} 로그인 버튼을 이용해 주세요.`
            });
        }

        // 비밀번호 대조 검증 수행
        const isMatch = await bcrypt.compare(password, dbPassword);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        // 인증 완결 시 피드에서 가독 및 조작할 통합 JWT 규격 발행
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

// [back/routes/user.js] - /mypage/data 라우터 내부
router.get('/mypage/data', jwtAuthentication, async (req, res) => {
    const userId = req.user.userId;
    let connection;
    try {
        connection = await db.getConnection();
        
        // 1. 사용자 정보
        const userRes = await connection.execute(
            `SELECT NICKNAME, EMAIL, BIO, GITHUB, WEBSITE FROM USERS WHERE USER_ID = :id`,
            { id: userId }, 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );
        
        // 💡 2. 게시물 정보 + 이미지(LISTAGG 사용) 쿼리 수정
        const postsRes = await connection.execute(
            `SELECT 
                p.POST_ID AS "id", 
                p.TITLE AS "title", 
                p.CONTENT AS "description", 
                'General' AS "tag",
                (SELECT LISTAGG(f.FILE_URL, ',') WITHIN GROUP (ORDER BY f.FILE_ID)
                 FROM ATTACHED_FILES f 
                 WHERE f.TARGET_ID = p.POST_ID AND f.TARGET_TYPE = 'POST') AS "images"
             FROM POSTS p
             WHERE p.USER_ID = :id AND p.STATUS = 'ACTIVE'`,
            { id: userId }, 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // CLOB 처리 및 데이터 정제
        const postData = await Promise.all((postsRes.rows || []).map(async (row) => {
            let content = row.description;
            if (content && typeof content.getData === 'function') {
                content = await content.getData();
            }
            return { ...row, description: content };
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
module.exports = router;