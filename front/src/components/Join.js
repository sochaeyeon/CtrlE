import React, { useState, useEffect, useRef } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Collapse,
  Divider,
  FormControlLabel,
  FormHelperText,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  LinearProgress,
  Link,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  CheckCircleOutline,
  RadioButtonUnchecked,
  GitHub,
  Google,
  LoginOutlined,
  MailOutline,
  CelebrationOutlined,
  RefreshOutlined,
  ArrowBackOutlined,
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
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#CBD5E1',
          padding: '4px 8px 4px 4px',
          '&.Mui-checked': { color: '#2563EB' },
        },
      },
    },
  },
});

const getPwScore = (pw) => {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
};

const pwMeta = [
  null,
  { label: '매우 약함', color: '#EF4444' },
  { label: '약함', color: '#F59E0B' },
  { label: '보통', color: '#10B981' },
  { label: '강함', color: '#059669' },
];

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
      py: 1,
      '&:hover': { borderColor: '#0F172A', backgroundColor: 'rgba(15,23,42,0.04)' },
    }}
  >
    {label}
  </Button>
);

export default function Signup() {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const [step, setStep] = useState('FORM');
  const [verificationCode, setVerificationCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerExpired, setIsTimerExpired] = useState(false);

  const [policyOpen, setPolicyOpen] = useState(false);
  const [policyTitle, setPolicyTitle] = useState('');
  const [policyContent, setPolicyContent] = useState('');

  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', nickname: '',
    termsAgree: false, privacyAgree: false, marketingAgree: false,
  });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [allCheck, setAllCheck] = useState(false);

  const [isOauth, setIsOauth] = useState(false);

  const pwScore = getPwScore(form.password);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const oauthFlag = queryParams.get('oauth');
    const oauthEmail = queryParams.get('email');
    const oauthNick = queryParams.get('nickname');

    if (oauthFlag === 'true' && oauthEmail) {
      setIsOauth(true);
      setForm((f) => ({
        ...f,
        email: oauthEmail,
        nickname: oauthNick ? decodeURIComponent(oauthNick) : '',
        password: 'OAUTH_ACCOUNT',
        confirmPassword: 'OAUTH_ACCOUNT'
      }));
    }
  }, []);

  useEffect(() => {
    if (step === 'VERIFY' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerExpired(true);
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [step, timeLeft]);

  const startTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(180);
    setIsTimerExpired(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((er) => ({ ...er, [k]: '' }));
  };

  const toggleAll = (e) => {
    const v = e.target.checked;
    setAllCheck(v);
    setForm((f) => ({ ...f, termsAgree: v, privacyAgree: v, marketingAgree: v }));
  };

  const syncAll = (updated) => {
    setAllCheck(updated.termsAgree && updated.privacyAgree && updated.marketingAgree);
  };

  const handleCheck = (k) => (e) => {
    const updated = { ...form, [k]: e.target.checked };
    setForm(updated);
    syncAll(updated);
  };

  const openPolicyModal = (type) => {
    if (type === 'termsAgree') {
      setPolicyTitle('서비스 이용약관');
      setPolicyContent('CtrlE 서비스 이용약관 상세 내용이 여기에 들어갑니다. 서비스 이용 규칙, 회원의 권리와 의무, 책임 범위 등을 규정합니다.');
    } else if (type === 'privacyAgree') {
      setPolicyTitle('개인정보 처리방침');
      setPolicyContent('CtrlE 개인정보 처리방침 상세 내용이 여기에 들어갑니다. 수집하는 개인정보 항목, 수집 목적, 보유 및 이용 기간, 파기 절차 등을 투명하게 안내합니다.');
    } else {
      setPolicyTitle('마케팅 정보 수신 동의');
      setPolicyContent('CtrlE 마케팅 정보 수신 동의 상세 내용이 여기에 들어갑니다. 각종 버그 리포트 트렌드 소식지, 커뮤니티 이벤트, 맞춤 기술 세션 알림 등의 혜택 정보를 받아보실 수 있습니다.');
    }
    setPolicyOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.email || !form.email.trim()) e.email = '이메일을 입력해주세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = '올바른 이메일 형식이 아닙니다.';
    if (!form.nickname || !form.nickname.trim() || form.nickname.length < 2) e.nickname = '닉네임은 2자 이상 입력해주세요.';
    if (!form.password || !form.password.trim() || form.password.length < 8) e.password = '비밀번호는 8자 이상이어야 합니다.';
    if (form.password !== form.confirmPassword) e.confirmPassword = '비밀번호가 일치하지 않습니다.';
    if (!form.termsAgree) e.consent = '서비스 이용약관에 동의해주세요.';
    if (!form.privacyAgree) e.consent = '개인정보 처리방침에 동의해주세요.';
    return e;
  };

  const handleRequestRegistration = async (e) => {
    if (e) e.preventDefault();
    setMessage('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);

    if (isOauth) {
      try {
        const response = await fetch('http://localhost:3010/user/signup/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            termsAgree: form.termsAgree ? 'Y' : 'N',
            privacyAgree: form.privacyAgree ? 'Y' : 'N',
            marketingAgree: form.marketingAgree ? 'Y' : 'N',
            code: 'OAUTH_SKIP_CODE'
          })
        });
        const data = await response.json();
        if (response.ok && data.success) {
          const authRes = await fetch('http://localhost:3010/api/auth/oauth/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.email, nickname: form.nickname, type: 'link_account' })
          });
          const authData = await authRes.json();
          if (authData.success) {
            localStorage.setItem('accessToken', authData.token);
            setStep('SUCCESS');
          }
        } else {
          setMessage(data.message || '가입 처리 중 데이터베이스 오류가 발생했습니다.');
        }
      } catch (err) {
        setMessage('서버 연동에 실패했습니다.');
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const response = await fetch('http://localhost:3010/user/signup/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          nickname: form.nickname
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStep('VERIFY');
        startTimer();
        setMessage(`인증 코드가 ${form.email} 자사 메일로 전송되었습니다.`);
      } else {
        setMessage(data.message || '인증 메일 발송에 실패했습니다.');
      }
    } catch (err) {
      setMessage('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (isTimerExpired) {
      setMessage('인증 시간이 만료되었습니다. 다시 발송해 주세요.');
      return;
    }
    if (!verificationCode || verificationCode.trim().length !== 6) {
      setMessage('올바른 6자리 인증 코드를 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3010/user/signup/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          termsAgree: form.termsAgree ? 'Y' : 'N',
          privacyAgree: form.privacyAgree ? 'Y' : 'N',
          marketingAgree: form.marketingAgree ? 'Y' : 'N',
          code: verificationCode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        clearInterval(timerRef.current);
        setStep('SUCCESS');
        setMessage(data.message || 'CtrlE 회원가입이 완료되었습니다!');
        setForm({ email: '', password: '', confirmPassword: '', nickname: '', termsAgree: false, privacyAgree: false, marketingAgree: false });
        setAllCheck(false);
      } else {
        setMessage(data.message || '인증 코드가 일치하지 않거나 만료되었습니다.');
      }
    } catch (err) {
      setMessage('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ minHeight: '100vh', width: '100vw', margin: { md: '-24px', xs: '-16px' }, display: 'flex', backgroundColor: '#F8FAFC' }}>
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: { xs: 3, sm: 5 } }}>
          <Box sx={{ width: '100%', maxWidth: 420 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 4 }}>
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
            {step === 'SUCCESS' && (
              <Box sx={{ textAlign: 'center', animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards', '@keyframes fadeInUp': { '0%': { opacity: 0, transform: 'translateY(15px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } } }}>
                <Box sx={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', animation: 'scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both', '@keyframes scaleIn': { '0%': { transform: 'scale(0)' }, '100%': { transform: 'scale(1)' } } }}><CheckCircleOutline sx={{ fontSize: 40, color: '#10B981' }} /></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}><Typography sx={{ fontWeight: 800, fontSize: '1.8rem', color: '#0F172A', letterSpacing: '-0.03em' }}>가입을 축하합니다!</Typography><CelebrationOutlined sx={{ fontSize: 32, color: '#2563EB', animation: 'bounce 1s infinite' }} /></Box>
                <Typography sx={{ color: '#64748B', fontSize: '0.95rem', mb: 4, lineHeight: 1.6 }}>이메일 연동 및 가입이 완료되었습니다.<br />이제 CtrlE의 에러 동기화 대기열 파이프라인과<br />지식 공유 커뮤니티 세션에 참여해 보세요.</Typography>
                <Button variant="contained" fullWidth size="large" onClick={() => navigate('/feed')} endIcon={<LoginOutlined />} sx={{ py: 1.6, fontSize: '0.95rem', backgroundColor: '#0F172A', '&:hover': { backgroundColor: '#2563EB' } }}>서비스 시작하기</Button>
              </Box>
            )}

            {step === 'VERIFY' && (
              <Box sx={{ animation: 'fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}>
                <Box sx={{ mb: 4 }}><Typography sx={{ fontWeight: 800, fontSize: '1.7rem', color: '#0F172A', mb: 1, letterSpacing: '-0.03em' }}>보안 인증코드 입력</Typography><Typography sx={{ color: '#64748B', fontSize: '0.88rem', lineHeight: 1.5 }}>안전한 계정 생성을 위해 입력하신 메일 주소로<br />보낸 6자리 보안 코드를 하단에 입력해 주세요.</Typography></Box>
                <Box component="form" onSubmit={handleVerifyCode} noValidate>
                  <Stack spacing={2.5}>
                    <TextField label="인증 코드 6자리" required fullWidth disabled={isTimerExpired} value={verificationCode} onChange={(e) => { setVerificationCode(e.target.value); setMessage(''); }} placeholder="000000" inputProps={{ maxLength: 6, style: { textAlign: 'center', letterSpacing: '6px', fontSize: '1.2rem', fontWeight: 700 } }} InputProps={{ endAdornment: (window.location.search ? null : <InputAdornment position="end"><Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: isTimerExpired ? '#EF4444' : '#2563EB', fontFamily: 'monospace', mr: 1 }}>{formatTime(timeLeft)}</Typography></InputAdornment>) }} />
                    {message && <Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5 }}>{message}</Alert>}
                    {isTimerExpired ? (
                      <Button variant="outlined" fullWidth size="large" disabled={loading} onClick={handleRequestRegistration} startIcon={loading ? <CircularProgress size={20} /> : <RefreshOutlined />} sx={{ py: 1.4, fontSize: '0.9rem', borderColor: '#2563EB', color: '#2563EB' }}>인증코드 재발송</Button>
                    ) : (
                      <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} endIcon={!loading && <CheckCircleOutline />} sx={{ py: 1.4, fontSize: '0.9rem' }}>{loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : '인증 완료 및 가입'}</Button>
                    )}
                    <Button variant="outlined" size="large" fullWidth onClick={() => setStep('FORM')} startIcon={<ArrowBackOutlined sx={{ fontSize: 18 }} />} sx={{ py: 1.4, fontSize: '0.9rem', borderColor: '#E2E8F0', color: '#64748B', '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F1F5F9', color: '#0F172A' } }}>이전 단계로 돌아가기</Button>
                  </Stack>
                </Box>
              </Box>
            )}

            {step === 'FORM' && (
              <Box>
                <Box sx={{ mb: 4 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '1.7rem', letterSpacing: '-0.03em', color: '#0F172A', lineHeight: 1.2, mb: 0.8 }}>
                    {isOauth ? '소셜 계정 연동 가입' : '계정 만들기'}
                  </Typography>
                  {!isOauth && (
                    <Typography sx={{ color: '#64748B', fontSize: '0.85rem' }}>
                      이미 계정이 있으신가요?{' '}<Link component={RouterLink} to="/" underline="hover" sx={{ color: '#2563EB', fontWeight: 600 }}>로그인</Link>
                    </Typography>
                  )}
                </Box>

                {!isOauth && (
                  <>
                    <Stack direction="row" spacing={1.5} sx={{ mb: 3 }}>
                      <SocialBtn icon={<Google sx={{ fontSize: 18 }} />} label="Google" onClick={() => window.location.href = 'http://localhost:3010/api/auth/oauth/google'} />
                      <SocialBtn icon={<GitHub sx={{ fontSize: 18 }} />} label="GitHub" onClick={() => window.location.href = 'http://localhost:3010/api/auth/oauth/github'} />
                    </Stack>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}><Divider sx={{ flex: 1, borderColor: '#E2E8F0' }} /><Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>또는 이메일로 가입</Typography><Divider sx={{ flex: 1, borderColor: '#E2E8F0' }} /></Box>
                  </>
                )}

                <Box component="form" onSubmit={handleRequestRegistration} noValidate>
                  <Stack spacing={2}>
                    <TextField label="이메일 주소" type="email" size="small" fullWidth required value={form.email} onChange={set('email')} error={!!errors.email} helperText={errors.email} placeholder="developer@example.com" disabled={isOauth} />
                    <TextField label="닉네임" size="small" fullWidth required value={form.nickname} onChange={set('nickname')} error={!!errors.nickname} helperText={errors.nickname} placeholder="커뮤니티에서 사용할 이름" inputProps={{ maxLength: 20 }} />

                    {!isOauth && (
                      <>
                        <Box>
                          <TextField label="비밀번호" type={showPw ? 'text' : 'password'} size="small" fullWidth required value={form.password} onChange={set('password')} error={!!errors.password} helperText={errors.password} placeholder="8자 이상" InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowPw(!showPw)} edge="end" size="small">{showPw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}</IconButton></InputAdornment>) }} />
                          <Collapse in={form.password.length > 0}><Box sx={{ mt: 1, px: 0.5 }}><LinearProgress variant="determinate" value={pwScore * 25} sx={{ height: 3, borderRadius: 2, backgroundColor: '#E2E8F0', '& .MuiLinearProgress-bar': { backgroundColor: pwMeta[pwScore]?.color || '#E2E8F0', transition: 'all 0.4s ease' } }} />{pwMeta[pwScore] && (<Typography sx={{ fontSize: '0.7rem', color: pwMeta[pwScore].color, mt: 0.4, fontWeight: 600 }}>{pwMeta[pwScore].label}</Typography>)}</Box></Collapse>
                        </Box>
                        <TextField label="비밀번호 확인" type={showCpw ? 'text' : 'password'} size="small" fullWidth required value={form.confirmPassword} onChange={set('confirmPassword')} error={!!errors.confirmPassword} helperText={errors.confirmPassword ? errors.confirmPassword : form.confirmPassword && form.password === form.confirmPassword ? '✓ 일치합니다' : ''} FormHelperTextProps={{ sx: { color: (!errors.confirmPassword && form.password === form.confirmPassword && form.confirmPassword) ? '#10B981' : undefined } }} InputProps={{ endAdornment: (<InputAdornment position="end"><IconButton onClick={() => setShowCpw(!showCpw)} edge="end" size="small">{showCpw ? <VisibilityOff sx={{ fontSize: 16 }} /> : <Visibility sx={{ fontSize: 16 }} />}</IconButton></InputAdornment>) }} />
                      </>
                    )}

                    <Box sx={{ border: `1px solid ${errors.consent ? '#EF4444' : '#E2E8F0'}`, borderRadius: 1.5, overflow: 'hidden' }}>
                      <Box sx={{ px: 2, py: 1.2, backgroundColor: '#F1F5F9' }}><FormControlLabel control={<Checkbox checked={allCheck} onChange={toggleAll} icon={<RadioButtonUnchecked sx={{ fontSize: 18 }} />} checkedIcon={<CheckCircleOutline sx={{ fontSize: 18 }} />} />} label={<Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>전체 동의</Typography>} sx={{ m: 0 }} /></Box>
                      <Divider sx={{ borderColor: '#E2E8F0' }} />
                      {[
                        { key: 'termsAgree', label: '서비스 이용약관', req: true },
                        { key: 'privacyAgree', label: '개인정보 처리방침', req: true },
                        { key: 'marketingAgree', label: '마케팅 정보 수신', req: false },
                      ].map(({ key, label, req }) => (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 0.6, '&:not(:last-child)': { borderBottom: '1px solid #F1F5F9' } }}>
                          <FormControlLabel control={<Checkbox size="small" checked={form[key]} onChange={handleCheck(key)} icon={<RadioButtonUnchecked sx={{ fontSize: 16 }} />} checkedIcon={<CheckCircleOutline sx={{ fontSize: 16 }} />} />} label={<Typography sx={{ fontSize: '0.78rem', color: form[key] ? '#0F172A' : '#64748B' }}><Box component="span" sx={{ color: req ? '#2563EB' : '#94A3B8', mr: 0.5, fontWeight: 600 }}>{req ? '[필수]' : '[선택]'}</Box>{label}</Typography>} sx={{ m: 0 }} />
                          <Link component="button" type="button" onClick={() => openPolicyModal(key)} underline="hover" sx={{ fontSize: '0.7rem', color: '#94A3B8', whiteSpace: 'nowrap', ml: 1, background: 'none', border: 'none', cursor: 'pointer' }}>보기</Link>
                        </Box>
                      ))}
                    </Box>
                    {errors.consent && <FormHelperText error sx={{ mt: -1, ml: 1 }}>{errors.consent}</FormHelperText>}

                    {message && (<Collapse in={!!message}><Alert severity="error" sx={{ fontSize: '0.8rem', py: 0.5, backgroundColor: '#FCE8E6', color: '#C5221F' }}>{message}</Alert></Collapse>)}

                    <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} endIcon={!loading && (isOauth ? <CheckCircleOutline /> : <MailOutline />)} sx={{ py: 1.4, fontSize: '0.9rem', mt: 0.5 }}>
                      {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : isOauth ? '소셜 계정으로 가입하기' : '인증 메일 받기'}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            )}

          </Box>
        </Box>
      </Box>

      <Dialog open={policyOpen} onClose={() => setPolicyOpen(false)} scroll="paper" PaperProps={{ sx: { borderRadius: 2, maxWidth: 500, width: '100%' } }}><DialogTitle sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F172A', pb: 1 }}>{policyTitle}</DialogTitle><Divider /><DialogContent dividers><Typography sx={{ fontSize: '0.88rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{policyContent}</Typography></DialogContent><DialogActions sx={{ p: 2 }}><Button onClick={() => setPolicyOpen(false)} variant="contained" size="medium" sx={{ backgroundColor: '#0F172A', px: 3 }}>확인</Button></DialogActions></Dialog>
    </ThemeProvider>
  );
}