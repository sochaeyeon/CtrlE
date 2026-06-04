const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middlewares/auth');
const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

router.get('/stats', authMiddleware, async (req, res) => {
    const userId = req.user.userId ?? req.user.id;

    try {
        const [
            summary,
            monthlyActivity,
            followMonthlyActivity,
            topTags,
            saveStats,
            followStats,
            recentPosts,
            topLikedPosts,
            topViewedPosts,
            topScrappedPosts,
        ] = await Promise.all([
            getSummary(userId),
            getMonthlyActivity(userId),
            getFollowMonthlyActivity(userId),
            getTopTags(userId),
            getSaveStats(userId),
            getFollowStats(userId),
            getRecentPostsForAI(userId),
            getTopLikedPosts(userId),
            getTopViewedPosts(userId),
            getTopScrappedPosts(userId),
        ]);

        res.json({
            success: true,
            data: {
                summary,
                monthlyActivity,
                followMonthlyActivity,
                topTags,
                saveStats,
                followStats,
                recentPosts,
                topLikedPosts,
                topViewedPosts,
                topScrappedPosts,
            },
        });
    } catch (err) {
        console.error('[activity/stats error]', err);
        res.status(500).json({ success: false, message: '서버 에러' });
    }
});

router.post('/analyze', authMiddleware, async (req, res) => {
    try {
        const { posts } = req.body;
        if (!posts || posts.length === 0)
            return res.status(400).json({ success: false, message: '분석할 데이터가 없습니다.' });

        const postsText = posts
            .map((p, i) => `[${i + 1}] 제목: ${p.title}\n내용: ${p.excerpt}`)
            .join('\n\n');

        const prompt = `다음은 사용자가 최근 작성한 게시글 ${posts.length}개입니다.

게시글 목록:
${postsText}

아래 항목을 분석하여 JSON 객체만 반환하세요 (설명이나 마크다운 없이):
{
  "mainTopics": ["주요 주제1", "주요 주제2"],
  "commonErrors": ["자주 다룬 오류나 문제1", "오류2"],
  "engagementPattern": "독자가 어떤 글에 반응할 것 같은지 패턴 분석 (예: 실습 코드 포함 글에 반응이 높을 것으로 예상, 질문 형식 제목이 많음 등)",
  "insight": "이 사용자의 전반적인 콘텐츠 활동 인사이트 (성장 가능성, 강점 등 구체적으로)",
  "suggestion": "다음 글을 더 잘 쓰기 위한 구체적이고 실질적인 제안"
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
        });

        const data = JSON.parse(response.text);
        res.json({ success: true, data });
    } catch (err) {
        console.error('[activity/analyze error]', err);
        res.status(500).json({ success: false, message: 'AI 분석 중 오류가 발생했습니다.' });
    }
});

// ─────────────────────────────────────────
// 기존 함수들
// ─────────────────────────────────────────
async function getSummary(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
        (SELECT COUNT(*) FROM POSTS    WHERE USER_ID = :u1 AND STATUS = 'ACTIVE') AS post_count,
        (SELECT COUNT(*) FROM COMMENTS WHERE USER_ID = :u2 AND STATUS = 'ACTIVE') AS comment_count,
        (SELECT COUNT(*) FROM POST_LIKES pl
           JOIN POSTS p ON pl.POST_ID = p.POST_ID
          WHERE p.USER_ID = :u3 AND p.STATUS = 'ACTIVE')       AS received_likes,
        (SELECT NVL(SUM(VIEW_COUNT), 0) FROM POSTS WHERE USER_ID = :u4 AND STATUS = 'ACTIVE') AS total_views
       FROM DUAL`,
            { u1: userId, u2: userId, u3: userId, u4: userId }
        );
        const row = result.rows[0];
        return {
            postCount: Number(row[0]),
            commentCount: Number(row[1]),
            receivedLikes: Number(row[2]),
            totalViews: Number(row[3]),
        };
    } finally {
        if (connection) await connection.close();
    }
}

async function getMonthlyActivity(userId) {
    let connection;
    try {
        connection = await db.getConnection();

        const postResult = await connection.execute(
            `SELECT TO_CHAR(CREATED_AT, 'YYYY-MM') AS month, COUNT(*) AS cnt
         FROM POSTS
        WHERE USER_ID = :userId
          AND STATUS = 'ACTIVE'
          AND CREATED_AT >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -11)
        GROUP BY TO_CHAR(CREATED_AT, 'YYYY-MM')
        ORDER BY month`,
            { userId }
        );

        const commentResult = await connection.execute(
            `SELECT TO_CHAR(CREATED_AT, 'YYYY-MM') AS month, COUNT(*) AS cnt
         FROM COMMENTS
        WHERE USER_ID = :userId
          AND STATUS = 'ACTIVE'
          AND CREATED_AT >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -11)
        GROUP BY TO_CHAR(CREATED_AT, 'YYYY-MM')
        ORDER BY month`,
            { userId }
        );

        const months = generateLast12Months();
        const postMap = Object.fromEntries(postResult.rows.map(r => [r[0], Number(r[1])]));
        const commentMap = Object.fromEntries(commentResult.rows.map(r => [r[0], Number(r[1])]));

        return months.map(m => ({ month: m, posts: postMap[m] || 0, comments: commentMap[m] || 0 }));
    } finally {
        if (connection) await connection.close();
    }
}

/**
 * 팔로워/팔로잉 월별 변동 추이
 * FOLLOWS 테이블에서 월별 누적 팔로워·팔로잉 수를 계산합니다.
 * STATUS = 'ACCEPTED' 기준, 최근 12개월
 */
async function getFollowMonthlyActivity(userId) {
    let connection;
    try {
        connection = await db.getConnection();

        // 월별 신규 팔로워 수 (나를 팔로우한 사람)
        const followerResult = await connection.execute(
            `SELECT TO_CHAR(CREATED_AT, 'YYYY-MM') AS month, COUNT(*) AS cnt
         FROM FOLLOWS
        WHERE FOLLOWING_ID = :userId
          AND STATUS = 'ACCEPTED'
          AND CREATED_AT >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -11)
        GROUP BY TO_CHAR(CREATED_AT, 'YYYY-MM')
        ORDER BY month`,
            { userId }
        );

        // 월별 신규 팔로잉 수 (내가 팔로우한 사람)
        const followingResult = await connection.execute(
            `SELECT TO_CHAR(CREATED_AT, 'YYYY-MM') AS month, COUNT(*) AS cnt
         FROM FOLLOWS
        WHERE FOLLOWER_ID = :userId
          AND STATUS = 'ACCEPTED'
          AND CREATED_AT >= ADD_MONTHS(TRUNC(SYSDATE, 'MM'), -11)
        GROUP BY TO_CHAR(CREATED_AT, 'YYYY-MM')
        ORDER BY month`,
            { userId }
        );

        const months = generateLast12Months();
        const followerMap = Object.fromEntries(followerResult.rows.map(r => [r[0], Number(r[1])]));
        const followingMap = Object.fromEntries(followingResult.rows.map(r => [r[0], Number(r[1])]));

        // 누적 합산으로 변환 (월별 신규 → 누적)
        let cumulativeFollowers = 0;
        let cumulativeFollowing = 0;
        return months.map(m => {
            cumulativeFollowers += followerMap[m] || 0;
            cumulativeFollowing += followingMap[m] || 0;
            return { month: m, followers: cumulativeFollowers, following: cumulativeFollowing };
        });
    } finally {
        if (connection) await connection.close();
    }
}

async function getTopTags(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT t.TAG_NAME, COUNT(*) AS cnt
         FROM POST_TAGS pt
         JOIN TAGS t  ON pt.TAG_ID  = t.TAG_ID
         JOIN POSTS p ON pt.POST_ID = p.POST_ID
        WHERE p.USER_ID = :userId AND p.STATUS = 'ACTIVE'
        GROUP BY t.TAG_NAME
        ORDER BY cnt DESC
        FETCH FIRST 5 ROWS ONLY`,
            { userId }
        );
        return result.rows.map(r => ({ tag: r[0], count: Number(r[1]) }));
    } finally {
        if (connection) await connection.close();
    }
}

async function getSaveStats(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
        (SELECT COUNT(*) FROM SCRAPS    WHERE USER_ID = :u1) AS scrap_count,
        (SELECT COUNT(*) FROM BOOKMARKS WHERE USER_ID = :u2) AS bookmark_count
       FROM DUAL`,
            { u1: userId, u2: userId }
        );
        const row = result.rows[0];
        return { scrapCount: Number(row[0]), bookmarkCount: Number(row[1]) };
    } finally {
        if (connection) await connection.close();
    }
}

async function getFollowStats(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT
        (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWING_ID = :u1 AND STATUS = 'ACCEPTED') AS follower_count,
        (SELECT COUNT(*) FROM FOLLOWS WHERE FOLLOWER_ID  = :u2 AND STATUS = 'ACCEPTED') AS following_count
       FROM DUAL`,
            { u1: userId, u2: userId }
        );
        const row = result.rows[0];
        return { followerCount: Number(row[0]), followingCount: Number(row[1]) };
    } finally {
        if (connection) await connection.close();
    }
}

async function getRecentPostsForAI(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT TITLE, DBMS_LOB.SUBSTR(CONTENT, 500, 1) AS excerpt, CREATED_AT
         FROM (
           SELECT TITLE, CONTENT, CREATED_AT
             FROM POSTS
            WHERE USER_ID = :userId AND STATUS = 'ACTIVE'
            ORDER BY CREATED_AT DESC
         )
        WHERE ROWNUM <= 10`,
            { userId }
        );
        return result.rows.map(r => ({ title: r[0], excerpt: r[1], createdAt: r[2] }));
    } finally {
        if (connection) await connection.close();
    }
}

// ─────────────────────────────────────────
// 신규: 인기 게시글 TOP 5
// ─────────────────────────────────────────

/** 좋아요 많은 게시글 TOP 5 */
async function getTopLikedPosts(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.POST_ID, p.TITLE, COUNT(pl.POST_ID) AS like_count
         FROM POSTS p
         LEFT JOIN POST_LIKES pl ON p.POST_ID = pl.POST_ID
        WHERE p.USER_ID = :userId AND p.STATUS = 'ACTIVE'
        GROUP BY p.POST_ID, p.TITLE
        ORDER BY like_count DESC
        FETCH FIRST 5 ROWS ONLY`,
            { userId }
        );
        return result.rows.map(r => ({ postId: r[0], title: r[1], likeCount: Number(r[2]) }));
    } finally {
        if (connection) await connection.close();
    }
}

/** 조회수 높은 게시글 TOP 5 */
async function getTopViewedPosts(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT POST_ID, TITLE, VIEW_COUNT
         FROM POSTS
        WHERE USER_ID = :userId AND STATUS = 'ACTIVE'
        ORDER BY VIEW_COUNT DESC
        FETCH FIRST 5 ROWS ONLY`,
            { userId }
        );
        return result.rows.map(r => ({ postId: r[0], title: r[1], viewCount: Number(r[2]) }));
    } finally {
        if (connection) await connection.close();
    }
}

/** 스크랩 많은 게시글 TOP 5 */
async function getTopScrappedPosts(userId) {
    let connection;
    try {
        connection = await db.getConnection();
        const result = await connection.execute(
            `SELECT p.POST_ID, p.TITLE, COUNT(s.POST_ID) AS scrap_count
         FROM POSTS p
         LEFT JOIN SCRAPS s ON p.POST_ID = s.POST_ID
        WHERE p.USER_ID = :userId AND p.STATUS = 'ACTIVE'
        GROUP BY p.POST_ID, p.TITLE
        ORDER BY scrap_count DESC
        FETCH FIRST 5 ROWS ONLY`,
            { userId }
        );
        return result.rows.map(r => ({ postId: r[0], title: r[1], scrapCount: Number(r[2]) }));
    } finally {
        if (connection) await connection.close();
    }
}

function generateLast12Months() {
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    return months;
}

module.exports = router;