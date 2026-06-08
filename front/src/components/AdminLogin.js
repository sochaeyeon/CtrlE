import React, { useState } from 'react';
import { Box, Typography, TextField, Button, CircularProgress, Alert, Fade } from '@mui/material';
import { useNavigate, useNavigationType } from 'react-router-dom';

// 대시보드와 동일한 컬러 시스템
const C = {
  bg: '#F8FAFC',
  paper: '#FFFFFF',
  border: '#E2E8F0',
  borderFocus: '#CBD5E1',
  textPrimary: '#0F172A',
  textMuted: '#64748B',
  textHint: '#94A3B8',
  inputBg: '#F1F5F9',
  accent: '#2563EB',
  accentHover: '#1D4ED8',
  red: '#EF4444',
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('접근 권한이 필요합니다.'); return; }
    setLoading(true);

    try {
      // 3. 백엔드 API 호출
      const response = await fetch('http://localhost:3010/admin/login', { // admin.js 경로에 맞춰 수정
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        navigate('/admin'); 
      } else {
        setError(data.message);
        setLoading(false);
      }
    } catch (err) {
      setError('서버 연결 실패');
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      backgroundColor: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Fade in timeout={500}>
        <Box sx={{ width: '100%', maxWidth: 380 }}>

          {/* 요청하신 로고 영역 */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 4, justifyContent: 'center' }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: 1.2,
              backgroundColor: '#000000',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Typography sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>{'<>'}</Typography>
            </Box>
            <Typography sx={{ color: '#000000', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              CtrlE
            </Typography>
            <Typography sx={{ color: C.textHint, fontWeight: 700, ml: 1, fontSize: '0.8rem' }}>ADMIN</Typography>
          </Box>

          {/* 로그인 폼 */}
          <Box component="form" onSubmit={handleSubmit} sx={{
            backgroundColor: C.paper,
            border: `1px solid ${C.border}`,
            borderRadius: 3,
            p: 4,
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}>
            {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, mb: 1 }}>ADMIN ID</Typography>
              <TextField fullWidth size="small" placeholder="admin@ctrle.com"
                value={email} onChange={e => setEmail(e.target.value)}
                sx={inputSx}
              />
            </Box>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: C.textMuted, mb: 1 }}>PASSWORD</Typography>
              <TextField fullWidth size="small" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                sx={inputSx}
              />
            </Box>

            <Button fullWidth type="submit" disabled={loading} sx={{
              py: 1.3, fontWeight: 800, borderRadius: 2,
              backgroundColor: C.textPrimary, color: '#fff',
              '&:hover': { backgroundColor: C.accent }
            }}>
              {loading ? <CircularProgress size={20} color="inherit" /> : '로그인'}
            </Button>
          </Box>

          <Typography sx={{ textAlign: 'center', mt: 3, fontSize: '0.7rem', color: C.textHint }}>
            © 2026 CtrlE Platform. All rights reserved.
          </Typography>
        </Box>
      </Fade>
    </Box>
  );
}

// 공통 인풋 스타일 (폰트 설정 없음)
const inputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: C.inputBg,
    borderRadius: 1.5,
    fontSize: '0.85rem',
    '& fieldset': { borderColor: C.border },
    '&:hover fieldset': { borderColor: C.borderFocus },
    '&.Mui-focused fieldset': { borderColor: C.accent },
  }
};