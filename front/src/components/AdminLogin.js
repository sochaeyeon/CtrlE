import React, { useState } from 'react';
import {
  Box, Typography, TextField, Button,
  CircularProgress, Alert, Fade,
} from '@mui/material';
import { Lock, Terminal } from '@mui/icons-material';

// ─── 색상 ───────────────────────────────────────────
const COLORS = {
  bg: '#0F1117',
  paper: '#1A1D27',
  border: '#2D3148',
  borderFocus: '#4B5280',
  textPrimary: '#F1F5F9',
  textMuted: '#94A3B8',
  textHint: '#64748B',
  inputBg: '#22253A',
  accent: '#2563EB',
  accentHover: '#1D4ED8',
  danger: '#EF4444',
};

// ─── 더미 인증 (실제 환경에선 API 호출로 교체) ───────
const ADMIN_EMAIL    = 'admin@ctrle.com';
const ADMIN_PASSWORD = 'admin1234';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true);

    // 실제 환경: await fetch('/api/admin/login', { method:'POST', body: JSON.stringify({email, password}) })
    await new Promise(r => setTimeout(r, 900));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      onLogin?.({ email, role: 'SUPER_ADMIN' });
    } else {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: COLORS.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 격자 배경 */}
      <Box sx={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />
      {/* 글로우 */}
      <Box sx={{
        position: 'fixed', top: -240, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 700, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 68%)',
      }} />

      <Fade in timeout={500}>
        <Box sx={{ width: '100%', maxWidth: 420, px: 2, position: 'relative', zIndex: 1 }}>

          {/* 로고 */}
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: 2,
              border: `1px solid ${COLORS.border}`,
              backgroundColor: COLORS.paper,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              mb: 2.5,
            }}>
              <Terminal sx={{ fontSize: 26, color: COLORS.accent }} />
            </Box>
            <Typography sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '1.4rem', fontWeight: 700,
              color: COLORS.textPrimary, letterSpacing: '-0.5px',
            }}>
              CtrlE <Box component="span" sx={{
                fontSize: '0.65rem', fontWeight: 700, ml: 1,
                backgroundColor: 'rgba(37,99,235,0.15)',
                color: '#60A5FA',
                px: '7px', py: '3px', borderRadius: '5px',
                border: '1px solid rgba(37,99,235,0.3)',
                verticalAlign: 'middle',
              }}>ADMIN</Box>
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: COLORS.textHint, mt: 0.8, fontFamily: '"JetBrains Mono", monospace' }}>
              관리자 전용 · 권한 없는 접근 금지
            </Typography>
          </Box>

          {/* 카드 */}
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              backgroundColor: COLORS.paper,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 3,
              p: 4,
            }}
          >
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 1.5, fontSize: '0.82rem', backgroundColor: 'rgba(239,68,68,0.1)', color: '#FCA5A5', border: '1px solid rgba(239,68,68,0.2)', '& .MuiAlert-icon': { color: '#EF4444' } }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', color: COLORS.textMuted, mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                관리자 이메일
              </Typography>
              <TextField
                fullWidth
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@ctrle.com"
                autoComplete="username"
                size="small"
                sx={inputSx()}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace', color: COLORS.textMuted, mb: 0.8, textTransform: 'uppercase', letterSpacing: '0.7px' }}>
                비밀번호
              </Typography>
              <TextField
                fullWidth
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                size="small"
                sx={inputSx()}
              />
            </Box>

            <Button
              fullWidth
              type="submit"
              disabled={loading}
              sx={{
                py: 1.3, borderRadius: 1.5, textTransform: 'none',
                fontWeight: 700, fontSize: '0.9rem',
                backgroundColor: COLORS.accent,
                color: '#fff',
                boxShadow: 'none',
                '&:hover': { backgroundColor: COLORS.accentHover, boxShadow: 'none' },
                '&.Mui-disabled': { backgroundColor: COLORS.inputBg, color: COLORS.textHint },
              }}
            >
              {loading ? <CircularProgress size={17} sx={{ color: '#fff' }} /> : '로그인'}
            </Button>
          </Box>

          <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.7rem', color: COLORS.textHint, fontFamily: '"JetBrains Mono", monospace' }}>
            CtrlE Admin v1.0 · Oracle DB
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}

function inputSx() {
  return {
    '& .MuiOutlinedInput-root': {
      backgroundColor: COLORS.inputBg,
      color: COLORS.textPrimary,
      fontSize: '0.88rem',
      borderRadius: 1.5,
      '& fieldset': { borderColor: COLORS.border },
      '&:hover fieldset': { borderColor: COLORS.borderFocus },
      '&.Mui-focused fieldset': { borderColor: COLORS.accent },
      '& input::placeholder': { color: COLORS.textHint, opacity: 1 },
    },
  };
}