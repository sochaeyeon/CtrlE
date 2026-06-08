const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const oracledb = require('oracledb'); // 추가: outFormat 옵션을 위해 필요
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'YOUR_SECRET_KEY';

// ─── 미들웨어: 관리자 권한 확인 (선택 사항이지만 권장) ───
// 프론트엔드에서 보낸 토큰을 검증하는 역할을 합니다.
const verifyAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ success: false, message: '인증 토큰이 없습니다.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ success: false, message: '관리자 권한이 없습니다.' });
        }
        req.admin = decoded; // 요청 객체에 관리자 정보 저장
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: '유효하지 않은 토큰입니다.' });
    }
};

// ==========================================
// 1. 관리자 로그인 API
// ==========================================
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    let connection;

    try {
        connection = await db.getConnection();

        const result = await connection.execute(
            `SELECT ADMIN_ID, PASSWORD FROM ADMIN_USER WHERE EMAIL = :email`,
            [email],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: '존재하지 않는 관리자 계정입니다.' });
        }

        const admin = result.rows[0];

        if (password !== admin.PASSWORD) {
            return res.status(401).json({ success: false, message: '비밀번호가 일치하지 않습니다.' });
        }

        const token = jwt.sign(
            { adminId: admin.ADMIN_ID, email: email, role: 'SUPER_ADMIN' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ success: true, token });

    } catch (err) {
        console.error('관리자 로그인 에러:', err);
        res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
});


// ==========================================
// 2. 대시보드 데이터 조회 API (프론트엔드 연동)
// 모든 GET 요청은 verifyAdmin 미들웨어를 거치게 설정
// ==========================================

// 공통 DB 조회 유틸리티 함수 (코드 중복 방지)
async function fetchTableData(sql) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
        return result.rows;
    } catch (error) {
        console.error(`DB Fetch Error [${sql}]:`, error);
        throw error;
    } finally {
        if (connection) {
            try { await connection.close(); } catch (err) { console.error(err); }
        }
    }
}

// 사용자 목록 조회
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT USER_ID, EMAIL, NICKNAME, STATUS, IS_PRIVATE, 
                   CREATED_AT, OAUTH_TYPE, BIO_SHORT, IS_PUBLIC 
            FROM USERS 
            ORDER BY CREATED_AT DESC
        `;
        const users = await fetchTableData(sql);
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: '사용자 데이터를 가져오지 못했습니다.' });
    }
});

// 게시글 목록 조회
router.get('/posts', verifyAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT p.POST_ID, p.USER_ID, p.TITLE, p.POST_TYPE, p.STATUS, 
                   p.VIEW_COUNT, p.CREATED_AT, u.NICKNAME
            FROM POSTS p
            LEFT JOIN USERS u ON p.USER_ID = u.USER_ID
            ORDER BY p.CREATED_AT DESC
        `;
        const posts = await fetchTableData(sql);
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: '게시글 데이터를 가져오지 못했습니다.' });
    }
});

router.get('/reports', verifyAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT * FROM (
                SELECT r.REPORT_ID, r.POST_ID AS TARGET_ID, 'POST' AS TARGET_TYPE, 
                       r.USER_ID AS REPORTER_ID, r.REASON, r.DETAIL, 
                       p.TITLE AS TARGET_CONTENT, r.STATUS, r.CREATED_AT
                FROM POST_REPORTS r
                LEFT JOIN POSTS p ON r.POST_ID = p.POST_ID
                
                UNION ALL
                
                SELECT REPORT_ID, TARGET_ID, TARGET_TYPE, REPORTER_ID, REASON, NULL AS DETAIL, 
                       NULL AS TARGET_CONTENT, STATUS, CREATED_AT
                FROM REPORTS
            ) ORDER BY CREATED_AT DESC
        `;
        const reports = await fetchTableData(sql);
        res.json(reports);
    } catch (error) {
        console.error('Reports 조회 에러:', error);
        res.status(500).json({ error: 'Server Error' });
    }
});

// 댓글 목록 조회
router.get('/comments', verifyAdmin, async (req, res) => {
    try {
        const sql = `
            SELECT c.COMMENT_ID, c.POST_ID, c.CONTENT, c.STATUS, c.CREATED_AT, 
                   c.USER_ID, u.NICKNAME
            FROM COMMENTS c
            LEFT JOIN USERS u ON c.USER_ID = u.USER_ID
            ORDER BY c.CREATED_AT DESC
        `;
        const comments = await fetchTableData(sql);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: '댓글 데이터를 가져오지 못했습니다.' });
    }
});

// 문의 목록 조회 (현재 DB 스키마에 문의(INQUIRIES) 테이블이 없으므로 빈 배열 반환)
// 프론트엔드 에러 방지용
router.get('/inquiries', verifyAdmin, async (req, res) => {
    // 만약 나중에 INQUIRIES 테이블을 만드신다면 여기에 조회 로직을 넣으세요.
    res.json([]);
});

// 금지어 목록 조회
router.get('/badwords', verifyAdmin, async (req, res) => {
    try {
        const sql = `SELECT WORD_ID, BANNED_WORD, REPLACE_WORD, CREATED_AT FROM BAD_WORDS ORDER BY WORD_ID DESC`;
        const badwords = await fetchTableData(sql);
        res.json(badwords);
    } catch (error) {
        res.status(500).json({ error: '금지어 데이터를 가져오지 못했습니다.' });
    }
});

// 카테고리 목록 조회
router.get('/categories', verifyAdmin, async (req, res) => {
    try {
        // 카테고리에 속한 게시물 개수를 알기 위해 COUNT 조인
        const sql = `
            SELECT c.CATEGORY_ID, c.CATEGORY_NAME, c.DISPLAY_ORDER,
                   (SELECT COUNT(*) FROM POSTS p WHERE p.CATEGORY_ID = c.CATEGORY_ID) as POST_COUNT
            FROM CATEGORIES c
            ORDER BY c.DISPLAY_ORDER ASC
        `;
        const categories = await fetchTableData(sql);
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: '카테고리 데이터를 가져오지 못했습니다.' });
    }
});

module.exports = router;