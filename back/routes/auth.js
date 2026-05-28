const express = require('express');
const router = express.Router();
const passport = require('passport');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET;

const handleCallback = (req, res) => {
    try {
        const email = req.user.email || '';
        const nickname = req.user.nickname ? req.user.nickname.replace(/'/g, "\\'") : 'User';
        const userId = req.user.userId || '';
        const oauthId = req.user.oauthId || '';
        const provider = req.user.provider || '';

        // [분기 1] 이미 연동이 완료되어 프리패스 상태인 경우
        if (req.user.existing && req.user.isLinked) {
            const token = jwt.sign({ userId, email, nickname }, JWT_SECRET, { expiresIn: '2h' });
            res.send(`
                <script>
                    sessionStorage.setItem('oauthToken', '${token}');
                    window.location.href = 'http://localhost:3000/feed';
                </script>
            `);
            return;
        }

        // [분기 2] 기존 이메일 계정은 있지만 소셜 연동이 최초인 경우 -> 팝업 렌더링
        // 📄 back/routes/auth.js 파일의 [분기 2] res.send 구문 내부 수정
        if (req.user.existing && !req.user.isLinked) {
            res.send(`
        <!DOCTYPE html>
        <html lang="ko">
        <head>
            <meta charset="UTF-8">
            <title>CtrlE 계정 통합 연동</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&family=Noto+Sans+KR:wght@700;900&display=swap" rel="stylesheet">
            
            <script>
                if (window.location.search) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            </script>
            
            <style>
                body { font-family: 'Plus Jakarta Sans', 'Noto Sans KR', sans-serif; }
            </style>
        </head>
        <body class="bg-[#F8FAFC] min-h-screen flex items-center justify-center p-4">
            <div class="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm max-w-[440px] w-full p-8 text-center">
                
                <div class="w-[60px] h-[60px] rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-5 animate-pulse">
                    <svg class="w-7 h-7 text-[#2563EB]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                    </svg>
                </div>
                
                <h2 class="font-extrabold text-xl text-[#0F172A] mb-2 tracking-tight">이미 존재하는 이메일 계정입니다</h2>
                <p class="text-sm text-[#64748B] leading-relaxed mb-8 px-2">
                    입력하신 소셜 메일 주소(<b class="text-[#2563EB] font-black underline underline-offset-4">${email}</b>)로<br>
                    가입된 기존 자체 계정이 발견되었습니다.<br>
                    해당 계정과 소셜 로그인을 통합 연동하시겠습니까?
                </p>

                <div class="flex gap-3">
                    <button onclick="location.href='http://localhost:3000/'" class="w-full border border-[#E2E8F0] text-[#64748B] font-bold py-3 rounded-lg hover:bg-gray-50 text-sm transition-colors">취소</button>
                    <button onclick="handleConfirm()" class="w-full bg-[#0F172A] text-white font-bold py-3 rounded-lg hover:bg-[#2563EB] text-sm transition-all shadow-sm">통합 연동 및 시작</button>
                </div>
            </div>
            
            <script>
                // 기존 handleConfirm() 비동기 함수 로직 (그대로 유지)
                async function handleConfirm() {
                    try {
                        const response = await fetch('http://localhost:3010/api/auth/oauth/confirm', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                email: '${email}', 
                                nickname: '${nickname}', 
                                userId: '${userId}',
                                oauthId: '${oauthId}',
                                provider: '${provider}'
                            })
                        });
                        const data = await response.json();
                        if (data.success) {
                            sessionStorage.setItem('oauthToken', data.token);
                            window.location.href = 'http://localhost:3000/feed';
                        } else {
                            alert(data.message || '연동 실패');
                        }
                    } catch (err) { alert('연동 처리 중 에러 발생'); }
                }
            </script>
        </body>
        </html>
    `);
            return;
        }

        // [분기 3] 아예 신규 가입 대상자인 경우 세션 구워서 회원가입 폼으로 SPA 이동 유도
        res.send(`
            <script>
                sessionStorage.setItem('oauthStatus', 'new_account');
                sessionStorage.setItem('oauthEmail', '${email}');
                sessionStorage.setItem('oauthNickname', '${nickname}');
                window.location.href = 'http://localhost:3000/';
            </script>
        `);
    } catch (err) {
        res.redirect('http://localhost:3000/?error=server_error');
    }
};

router.get('/oauth/google', passport.authenticate('google', { scope: ['profile', 'email'], session: false }));
router.get('/oauth/google/callback', passport.authenticate('google', { failureRedirect: 'http://localhost:3000/', session: false }), handleCallback);

router.get('/oauth/github', passport.authenticate('github', { session: false }));
router.get('/oauth/github/callback', passport.authenticate('github', { failureRedirect: 'http://localhost:3000/', session: false }), handleCallback);

// 계정 통합 전용 최종 라우터 (오라클 데이터베이스 영구 락인 매핑 반영)
router.post('/oauth/confirm', async (req, res) => {
    const { email, nickname, userId, oauthId, provider } = req.body;
    let connection;
    try {
        connection = await db.getConnection();

        const updateSql = `
            UPDATE USERS 
            SET OAUTH_TYPE = :provider,
                OAUTH_ID = :oauthId
            WHERE USER_ID = :userId
        `;

        await connection.execute(updateSql, { provider, oauthId, userId }, { autoCommit: true });

        const token = jwt.sign({ userId, email, nickname }, JWT_SECRET, { expiresIn: '2h' });
        res.status(200).json({ success: true, token });
    } catch (err) {
        console.error('연동 DB 처리 에러:', err);
        res.status(500).json({ success: false, message: '서버 DB 업데이트 실패' });
    } finally {
        if (connection) { try { await connection.close(); } catch (e) { } }
    }
});

module.exports = router;