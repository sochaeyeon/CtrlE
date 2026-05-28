const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;

const db = require('./db');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3010/api/auth/oauth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value;
    const nickname = profile.displayName;
    const oauthId = profile.id; // 💡 구글 고유 ID 수집
    let connection;

    try {
        connection = await db.getConnection();

        // 💡 중요: 이메일뿐만 아니라 OAUTH_TYPE과 OAUTH_ID까지 조회합니다.
        const checkSql = `SELECT USER_ID, EMAIL, NICKNAME, OAUTH_TYPE, OAUTH_ID FROM USERS WHERE EMAIL = :email`;
        const result = await connection.execute(checkSql, { email });

        if (result.rows.length > 0) {
            const [userId, dbEmail, dbNickname, oauthType, dbOauthId] = result.rows[0];
            
            // 💡 [케이스 1] 이미 구글 연동이 완료된 유저라면 프리패스 신호를 보냅니다.
            if (oauthType === 'GOOGLE' && dbOauthId === oauthId) {
                return done(null, { userId, email: dbEmail, nickname: dbNickname, isLinked: true, existing: true });
            }
            
            // [케이스 2] 자체 계정은 있으나 구글 연동은 처음인 경우 연동 동의 팝업 플래그 발송
            return done(null, { userId, email: dbEmail, nickname: dbNickname, isLinked: false, existing: true, oauthId, provider: 'GOOGLE' });
        }

        // [케이스 3] 아예 신규 이메일 계정인 경우
        return done(null, { email, nickname, existing: false, oauthId, provider: 'GOOGLE' });

    } catch (err) {
        return done(err, null);
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}));

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: 'http://localhost:3010/api/auth/oauth/github/callback',
    scope: ['user:email']
}, async (accessToken, refreshToken, profile, done) => {
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;
    const nickname = profile.displayName || profile.username;
    const oauthId = profile.id.toString(); // 💡 깃허브 고유 ID 수집
    let connection;

    try {
        connection = await db.getConnection();

        const checkSql = `SELECT USER_ID, EMAIL, NICKNAME, OAUTH_TYPE, OAUTH_ID FROM USERS WHERE EMAIL = :email`;
        const result = await connection.execute(checkSql, { email });

        if (result.rows.length > 0) {
            const [userId, dbEmail, dbNickname, oauthType, dbOauthId] = result.rows[0];
            
            // 💡 [케이스 1] 이미 깃허브 연동이 완료된 유저라면 프리패스
            if (oauthType === 'GITHUB' && dbOauthId === oauthId) {
                return done(null, { userId, email: dbEmail, nickname: dbNickname, isLinked: true, existing: true });
            }
            
            // [케이스 2] 자체 계정은 있으나 깃허브 연동은 처음인 경우
            return done(null, { userId, email: dbEmail, nickname: dbNickname, isLinked: false, existing: true, oauthId, provider: 'GITHUB' });
        }

        return done(null, { email, nickname, existing: false, oauthId, provider: 'GITHUB' });

    } catch (err) {
        return done(err, null);
    } finally {
        if (connection) {
            try { await connection.close(); } catch (e) { console.error(e); }
        }
    }
}));