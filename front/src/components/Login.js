import React, { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Collapse,
  Divider,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Link,
  createTheme,
  ThemeProvider,
  CssBaseline,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ArrowForward,
  GitHub,
  Google,
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    secondary: { main: '#0F172A' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
    success: { main: '#10B981' },
    error: { main: '#EF4444' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
    h3: {
      fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
      fontWeight: 800,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#F1F5F9',
            '& fieldset': { borderColor: '#E2E8F0' },
            '&:hover fieldset': { borderColor: '#0F172A' },
            '&.Mui-focused fieldset': {
              borderColor: '#2563EB',
              borderWidth: 1,
            },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#2563EB' },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          borderRadius: 8,
          transition: 'all 0.2s',
        },
        containedPrimary: {
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#2563EB',
            boxShadow: '0 6px 20px rgba(37,99,235,0.2)',
            transform: 'translateY(-1px)',
          },
        },
      },
    },
  },
});

const SocialBtn = ({ icon, label, onClick }) => (
  <Button
    fullWidth
    variant="outlined"
    startIcon={icon}
    onClick={onClick}
    sx={{
      borderColor: '#E2E8F0',
      color: '#0F172A',
      fontWeight: 500,
      fontSize: '0.8rem',
      py: 1.2,
      '&:hover': { borderColor: '#0F172A', backgroundColor: 'rgba(15,23,42,0.04)' },
    }}
  >
    {label}
  </Button>
);

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isOk, setIsOk] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('code=') || window.location.search.includes('oauth=')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const oauthStatus = sessionStorage.getItem('oauthStatus');
    if (oauthStatus === 'new_account') {
      navigate('/join');
    }
  }, [navigate]);

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.';
    if (!form.password) e.password = '비밀번호를 입력해주세요.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3010/user/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsOk(true);
        setMessage(data.message || '로그인에 성공했습니다.');
        localStorage.setItem('accessToken', data.token);
        navigate('/feed');
      } else {
        setIsOk(false);
        setMessage(data.message || '이메일 또는 비밀번호를 확인해주세요.');
      }
    } catch (err) {
      setIsOk(false);
      setMessage('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{
        minHeight: '100vh',
        width: '100vw',
        margin: { md: '-24px', xs: '-16px' },
        display: 'flex',
        backgroundColor: '#F8FAFC',
      }}>


        {/* 우측 실무 입력 폼 영역 */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5 },
        }}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>

            <Box sx={{ mb: 4 }}>
              {/* ── 블랙 테마 로고 추가된 부분 ── */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 3 }}>
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
              </Box>
              {/* ───────────────────────────── */}

              <Typography sx={{
                fontWeight: 800,
                fontSize: '1.7rem',
                letterSpacing: '-0.03em',
                color: '#0F172A',
                lineHeight: 1.2,
                mb: 0.8,
              }}>
                반가워요! 다시 오셨군요
              </Typography>
              <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                아직 계정이 없으신가요?{' '}
                <Link component={RouterLink} to="/join" underline="hover" sx={{ color: '#2563EB', fontWeight: 600 }}>
                  회원가입
                </Link>
              </Typography>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
              <SocialBtn
                icon={<Google sx={{ fontSize: 18 }} />}
                label="Google"
                onClick={() => window.location.href = 'http://localhost:3010/api/auth/oauth/google'}
              />
              <SocialBtn
                icon={<GitHub sx={{ fontSize: 18 }} />}
                label="GitHub"
                onClick={() => window.location.href = 'http://localhost:3010/api/auth/oauth/github'}
              />
            </Stack>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Divider sx={{ flex: 1, borderColor: '#E2E8F0' }} />
              <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>또는 이메일로 로그인</Typography>
              <Divider sx={{ flex: 1, borderColor: '#E2E8F0' }} />
            </Box>

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Stack spacing={2}>

                <TextField
                  label="이메일 주소"
                  type="email"
                  size="small"
                  fullWidth
                  required
                  value={form.email}
                  onChange={set('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  placeholder="developer@example.com"
                />

                <TextField
                  label="비밀번호"
                  type={showPw ? 'text' : 'password'}
                  size="small"
                  fullWidth
                  required
                  value={form.password}
                  onChange={set('password')}
                  error={!!errors.password}
                  helperText={errors.password}
                  placeholder="비밀번호 입력"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">
                          {showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Collapse in={!!message}>
                  <Alert
                    severity={isOk ? 'success' : 'error'}
                    sx={{
                      fontSize: '0.8rem', py: 0.5,
                      ...(isOk
                        ? { backgroundColor: '#E6F4EA', color: '#137333' }
                        : { backgroundColor: '#FCE8E6', color: '#C5221F' }
                      ),
                    }}
                  >
                    {message}
                  </Alert>
                </Collapse>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading}
                  endIcon={!loading && <ArrowForward sx={{ fontSize: 18 }} />}
                  sx={{ py: 1.4, fontSize: '0.9rem', mt: 1 }}
                >
                  {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : '로그인'}
                </Button>

              </Stack>
            </Box>

          </Box>
        </Box>

      </Box>
    </ThemeProvider>
  );
}