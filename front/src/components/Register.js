import React, { useState, useEffect, useRef, useMemo, useCallback, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ColorModeContext } from '../App';
import {
  Box, Button, Container, Typography, TextField, Autocomplete, Chip,
  createTheme, ThemeProvider, CssBaseline, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment, CircularProgress, Alert, Collapse,
  LinearProgress,
} from '@mui/material';
import {
  Search, ArrowForward, BugReport, HelpOutline, ChatBubbleOutline,
  LocalOffer, TitleOutlined, ArticleOutlined, WarningAmberOutlined,
  Close, AutoAwesome, SmartToyOutlined, InfoOutlined, ReportProblemOutlined
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const API = 'http://localhost:3010';

const TOKEN = {
  light: {
    bg: '#F8FAFC', paper: '#FFFFFF', border: '#E2E8F0',
    textPrimary: '#0F172A', textSecondary: '#64748B', textHint: '#94A3B8',
    inputBg: '#FFFFFF', accent: '#2563EB', accentBg: '#EFF6FF',
    hover: '#F8FAFC', cardFocus: '#CBD5E1',
  },
  dark: {
    bg: '#0F1117', paper: '#1A1D27', border: '#2D3148',
    textPrimary: '#F1F5F9', textSecondary: '#94A3B8', textHint: '#64748B',
    inputBg: '#22253A', accent: '#7B75E8', accentBg: '#2D2B4E',
    hover: '#22253A', cardFocus: '#4B5280',
  },
};

const TECH_STACK_OPTIONS = [
  'React', 'Vue', 'Next.js', 'TypeScript', 'JavaScript',
  'Spring Boot', 'Node.js', 'Python', 'Java', 'Go',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle',
  'Docker', 'Kubernetes', 'AWS', 'Git',
];

const CATEGORIES = [
  { value: 'ERROR', label: '트러블슈팅 / 에러 해결', icon: <BugReport sx={{ fontSize: 16 }} />, color: '#EF4444', bg: '#FEF2F2', darkBg: '#2D1515' },
  { value: 'QUESTION', label: '일반 질문', icon: <HelpOutline sx={{ fontSize: 16 }} />, color: '#2563EB', bg: '#EFF6FF', darkBg: '#172033' },
  { value: 'FREE', label: '자유 게시판', icon: <ChatBubbleOutline sx={{ fontSize: 16 }} />, color: '#10B981', bg: '#ECFDF5', darkBg: '#0D2318' },
];

function SectionLabel({ icon, title, required, hint, tk }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
        <Box sx={{ color: tk.accent, display: 'flex', alignItems: 'center' }}>{icon}</Box>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: tk.textPrimary, letterSpacing: '-0.01em' }}>
          {title}
          {required && <Box component="span" sx={{ color: '#EF4444', ml: 0.4 }}>*</Box>}
        </Typography>
      </Box>
      {hint && <Typography sx={{ fontSize: '0.78rem', color: tk.textHint, lineHeight: 1.5, pl: 3 }}>{hint}</Typography>}
    </Box>
  );
}

function SectionCard({ children, sx = {}, tk }) {
  return (
    <Box sx={{
      backgroundColor: tk.paper, border: `1px solid ${tk.border}`, borderRadius: 2, p: 3,
      transition: 'border-color 0.2s', '&:focus-within': { borderColor: tk.cardFocus },
      animation: 'fadeUp 0.35s ease both', ...sx,
    }}>
      {children}
    </Box>
  );
}

function BadWordModal({ open, badWords, replaceMap, onConfirm, onReplace, onCancel, tk }) {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 2.5, backgroundColor: tk.paper, border: `1px solid ${tk.border}` } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: tk.textPrimary, display: 'flex', alignItems: 'center', gap: 1.2, pb: 1 }}>
        <Box sx={{ width: 34, height: 34, borderRadius: 1.5, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <WarningAmberOutlined sx={{ fontSize: 18, color: '#DC2626' }} />
        </Box>
        부적절한 표현이 감지되었습니다
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography sx={{ fontSize: '0.88rem', color: tk.textSecondary, lineHeight: 1.7, mb: 2 }}>
          게시물에 커뮤니티 가이드라인에 위반될 수 있는 표현이 포함되어 있습니다.
        </Typography>
        <Box sx={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 1.5, p: 2, mb: 2 }}>
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#991B1B', mb: 1 }}>감지된 표현:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
            {badWords.map((w, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 1, px: 1, py: 0.3 }}>
                <Chip label={w} size="small" sx={{ backgroundColor: 'transparent', color: '#DC2626', fontWeight: 700, fontSize: '0.75rem', height: 'auto', '& .MuiChip-label': { px: 0 } }} />
                {replaceMap[w] && (
                  <>
                    <ArrowForward sx={{ fontSize: 12, color: '#94A3B8' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>{replaceMap[w]}</Typography>
                  </>
                )}
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ backgroundColor: tk.hover, border: `1px solid ${tk.border}`, borderRadius: 1.5, p: 2, mb: 1.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.8 }}>
            <InfoOutlined sx={{ fontSize: 15, color: tk.textSecondary }} />
            <Typography sx={{ fontSize: '0.82rem', color: tk.textSecondary, fontWeight: 600 }}>
              커뮤니티 이용 약관 제15조 (금지 행위)
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: tk.textSecondary, lineHeight: 1.75 }}>
            회원은 타인에게 불쾌감을 주거나 커뮤니티 분위기를 해치는 비속어, 욕설, 혐오 표현을 게시할 수 없습니다.
            이를 위반할 경우 운영팀의 판단에 따라 해당 게시물이 <strong style={{ color: tk.textPrimary }}>즉시 삭제</strong>되거나
            서비스 이용이 <strong style={{ color: tk.textPrimary }}>일시 정지 또는 영구 정지</strong>될 수 있습니다.
          </Typography>
        </Box>
        <Box sx={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 1.5, p: 1.5, display: 'flex', alignItems: 'flex-start', gap: 0.8 }}>
          <ReportProblemOutlined sx={{ fontSize: 15, color: '#D97706', mt: 0.1, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.78rem', color: '#92400E', lineHeight: 1.7 }}>
            반복적인 위반 시 계정 이용에 불이익이 생길 수 있습니다.
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexDirection: 'column' }}>
        <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
          <Button fullWidth variant="outlined" onClick={onCancel}
            sx={{ color: tk.textSecondary, borderColor: tk.border, fontSize: '0.82rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}>
            수정하기
          </Button>
          <Button fullWidth variant="contained" onClick={onReplace}
            sx={{ backgroundColor: '#16A34A', color: '#fff', fontSize: '0.82rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#15803D' } }}>
            대체 후 등록
          </Button>
          <Button fullWidth variant="contained" onClick={onConfirm}
            sx={{ backgroundColor: '#DC2626', color: '#fff', fontSize: '0.82rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#B91C1C' } }}>
            그래도 등록
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}

// ── AI 답변 모달 (ERROR 카테고리 전용) ─────────────────────
function AIAnswerModal({ open, onClose, postId, token, navigate, tk }) {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState(null);

  const fetchAIAnswer = useCallback(async () => {
    if (!postId) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/feed/${postId}/ai-answer`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setAnswer(data.answer);
      else throw new Error(data.message);
    } catch { setError('AI 답변 생성 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  }, [postId, token]);

  const handleGoPost = () => {
    onClose();
    navigate(`/feed/${postId}`);
  };

  return (
    <Dialog open={open} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 2.5, backgroundColor: tk.paper, border: `1px solid ${tk.border}`, maxHeight: '85vh' } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: tk.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 1.5, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <SmartToyOutlined sx={{ fontSize: 18, color: '#fff' }} />
          </Box>
          AI에게 먼저 답변을 받아보시겠어요?
        </Box>
        <Button size="small" onClick={handleGoPost}
          sx={{ color: tk.textSecondary, fontSize: '0.78rem', textTransform: 'none', fontWeight: 600 }}>
          게시글로 이동
        </Button>
      </DialogTitle>
      <DialogContent sx={{ pt: 0, overflowY: 'auto' }}>
        <Typography sx={{ fontSize: '0.85rem', color: tk.textSecondary, lineHeight: 1.7, mb: 3 }}>
          트러블슈팅 게시글이 등록되었습니다. AI가 에러 내용을 분석하여 해결 방법을 제안해드릴 수 있습니다.
          커뮤니티의 답변을 기다리는 동안 AI 답변을 먼저 참고해보세요!
        </Typography>

        {!answer && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2, boxShadow: '0 8px 24px rgba(86,156,214,0.35)' }}>
              <AutoAwesome sx={{ fontSize: 28, color: '#fff' }} />
            </Box>
            <Typography sx={{ fontSize: '0.88rem', color: tk.textSecondary, mb: 2.5 }}>
              AI가 에러를 분석하여 원인과 해결 방법을 제안해드립니다
            </Typography>
            <Button variant="contained" onClick={fetchAIAnswer}
              sx={{ background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', color: '#fff', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, px: 3, py: 1.2, boxShadow: '0 4px 14px rgba(86,156,214,0.4)', '&:hover': { boxShadow: '0 6px 20px rgba(86,156,214,0.5)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
              <AutoAwesome sx={{ fontSize: 16, mr: 0.8 }} />
              AI 답변 받기
            </Button>
          </Box>
        )}

        {loading && (
          <Box sx={{ py: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1.5s ease-in-out infinite', '@keyframes pulse': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.6 } } }}>
                <SmartToyOutlined sx={{ fontSize: 16, color: '#fff' }} />
              </Box>
              <Typography sx={{ fontSize: '0.88rem', color: tk.textSecondary, fontWeight: 600 }}>에러를 분석하고 있습니다...</Typography>
            </Box>
            <LinearProgress sx={{ borderRadius: 1, backgroundColor: tk.border, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #569CD6 0%, #4EC9B0 100%)' } }} />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ borderRadius: 1.5, fontSize: '0.85rem' }}>{error}</Alert>
        )}

        {answer && (
          <Box sx={{ animation: 'fadeUp 0.4s ease both', '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, pb: 1.5, borderBottom: `1px solid ${tk.border}` }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SmartToyOutlined sx={{ fontSize: 15, color: '#fff' }} />
              </Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: tk.textPrimary }}>AI 분석 답변</Typography>
              <Chip label="Beta" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, backgroundColor: tk.accentBg, color: tk.accent, ml: 0.5 }} />
            </Box>
            <Box sx={{
              fontSize: '0.88rem', color: tk.textSecondary, lineHeight: 1.85,
              '& h3': { fontWeight: 700, color: tk.textPrimary, fontSize: '0.95rem', mt: 2.5, mb: 1 },
              '& p': { mb: 1.5 },
              '& code': { fontFamily: '"JetBrains Mono", monospace', backgroundColor: tk.inputBg, color: '#CE9178', px: 0.8, py: 0.2, borderRadius: 0.5, fontSize: '0.82em' },
              '& pre': { backgroundColor: '#0F172A', color: '#D4D4D4', borderRadius: '8px', p: 2, fontSize: '0.82rem', fontFamily: '"JetBrains Mono", monospace', overflowX: 'auto', lineHeight: 1.75, my: 1.5, border: '1px solid #1E293B' },
              '& ul, & ol': { pl: 2.5, mb: 1.5 },
              '& li': { mb: 0.5 },
              '& strong': { color: tk.textPrimary, fontWeight: 700 },
            }} dangerouslySetInnerHTML={{ __html: answer }} />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, borderTop: `1px solid ${tk.border}` }}>
        <Button fullWidth variant="outlined" onClick={handleGoPost}
          sx={{ color: tk.textSecondary, borderColor: tk.border, fontWeight: 700, textTransform: 'none', borderRadius: 1.5, '&:hover': { borderColor: tk.cardFocus } }}>
          게시글로 이동
        </Button>
        {answer && (
          <Button fullWidth variant="contained" onClick={handleGoPost}
            sx={{ background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', color: '#fff', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none' }}>
            확인 완료
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}

// ── 동영상 미리보기 ─────────────────────────────────────────
function VideoPreview({ file, onRemove, tk }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(url), [url]);
  return (
    <Box sx={{ position: 'relative', display: 'inline-block', borderRadius: 1.5, overflow: 'hidden', border: `1px solid ${tk.border}`, mt: 1 }}>
      <video src={url} controls style={{ maxWidth: '100%', maxHeight: 280, display: 'block', backgroundColor: '#000' }} />
      <Box onClick={onRemove}
        sx={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: '50%', backgroundColor: 'rgba(15,23,42,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', '&:hover': { backgroundColor: 'rgba(239,68,68,0.85)' }, transition: 'background 0.15s' }}>
        <Close sx={{ fontSize: 16, color: '#fff' }} />
      </Box>
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────
export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const quillRef = useRef(null);
  const { mode } = useContext(ColorModeContext);
  const tk = TOKEN[mode] || TOKEN.light;

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: tk.accent },
      background: { default: tk.bg, paper: tk.paper },
    },
    typography: { fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif' },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(12px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `,
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: tk.inputBg, borderRadius: 8,
            '& fieldset': { borderColor: tk.border },
            '&:hover fieldset': { borderColor: tk.cardFocus },
            '&.Mui-focused fieldset': { borderColor: tk.accent, borderWidth: 1 },
            '& input': { color: tk.textPrimary },
            '& textarea': { color: tk.textPrimary },
          },
        },
      },
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, borderRadius: 8 } } },
    },
  }), [mode, tk]);

  const contentRef = useRef(localStorage.getItem('draft_content') || '');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [nextPath, setNextPath] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [dbTags, setDbTags] = useState([]);

  // 비속어 감지
  const [badWordModal, setBadWordModal] = useState(false);
  const [detectedWords, setDetectedWords] = useState([]);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  const [replaceMap, setReplaceMap] = useState({});

  // AI 답변 모달
  const [aiModal, setAiModal] = useState(false);
  const [newPostId, setNewPostId] = useState(null);

  const [metadata, setMetadata] = useState(() => {
    try {
      const saved = localStorage.getItem('draft_metadata');
      return saved ? JSON.parse(saved) : { category: 'ERROR', title: '', tags: [] };
    } catch { return { category: 'ERROR', title: '', tags: [] }; }
  });

  useEffect(() => {
    fetch(`${API}/feed/tags`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.tags)) {
          const merged = Array.from(new Set([...TECH_STACK_OPTIONS, ...data.tags]));
          setDbTags(merged);
        } else {
          setDbTags(TECH_STACK_OPTIONS);
        }
      })
      .catch(() => setDbTags(TECH_STACK_OPTIONS));
  }, []);

  useEffect(() => {
    localStorage.setItem('draft_metadata', JSON.stringify(metadata));
  }, [metadata]);

  useEffect(() => {
    const t = setInterval(() => {
      localStorage.setItem('draft_content', contentRef.current);
    }, 500);
    return () => clearInterval(t);
  }, []);

  const [isDirty, setIsDirty] = useState(false);
  useEffect(() => {
    const dirty = !!(
      metadata.title ||
      metadata.tags.length > 0 ||
      contentRef.current.replace(/<[^>]*>?/gm, '').trim().length > 0
    );
    setIsDirty(dirty);
  }, [metadata]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty && !submitted) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty, submitted]);

  useEffect(() => {
    const handlePopState = () => {
      if (isDirty && !submitted) {
        window.history.pushState(null, null, location.pathname);
        setNextPath(-1);
        setIsNavigating(true);
      }
    };
    if (isDirty && !submitted) {
      window.history.pushState(null, null, location.pathname);
      window.addEventListener('popstate', handlePopState);
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isDirty, submitted, location.pathname]);

  const confirmNavigation = () => {
    setIsNavigating(false); setSubmitted(true);
    setTimeout(() => { nextPath === -1 ? navigate(-1) : navigate(nextPath); }, 10);
  };
  const cancelNavigation = () => { setIsNavigating(false); setNextPath(null); };

  const handleMetaChange = (k) => (e) => setMetadata(prev => ({ ...prev, [k]: e.target.value }));
  const handleTagsChange = (_, newValue) => {
    const cleaned = newValue
      .map(v => (typeof v === 'string' ? v.trim() : v))
      .filter(v => v && v.length > 0);
    setMetadata(prev => ({ ...prev, tags: cleaned.slice(0, 5) }));
  };

  const insertImage = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const quill = quillRef.current.getEditor();
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      const base64 = reader.result;
      const orig = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = () => { };
      quill.insertEmbed(index, 'image', base64, 'user');
      quill.setSelection(index + 1, 0, 'silent');
      contentRef.current = quill.root.innerHTML;
      setImageFiles(prev => [...prev, { file, previewUrl: base64 }]);
      setIsDirty(true);
      setTimeout(() => { Element.prototype.scrollIntoView = orig; }, 100);
    };
    reader.readAsDataURL(file);
  }, []);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.click();
    input.onchange = () => { if (input.files[0]) insertImage(input.files[0]); };
  }, [insertImage]);

  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const handler = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      if (!imageItem) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const file = imageItem.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        const selection = quill.getSelection() || { index: quill.getLength(), length: 0 };
        const index = selection.index;
        quill.insertEmbed(index, 'image', base64, 'user');
        quill.setSelection(index + 1, 0, 'silent');
        contentRef.current = quill.root.innerHTML;
        setImageFiles(prev => [...prev, { file, previewUrl: base64 }]);
        setIsDirty(true);
      };
      reader.readAsDataURL(file);
    };
    quill.root.addEventListener('paste', handler, { capture: true });
    return () => quill.root.removeEventListener('paste', handler, { capture: true });
  }, [insertImage]);

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: imageHandler },
    },
    clipboard: { matchVisual: false },
  }), [imageHandler]);

  // ── 비속어 검사: /feed/check-profanity 엔드포인트 사용 ──
  const checkBadWords = async (text) => {
    try {
      const res = await fetch(`${API}/feed/check-profanity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ title: metadata.title, content: text }),
      });
      const data = await res.json();
      return data.success ? { words: data.words || [], replaceMap: data.replaceMap || {} } : { words: [], replaceMap: {} };
    } catch { return { words: [], replaceMap: {} }; }
  };


  const doSubmit = async () => {
    setErrorMsg('');
    const currentContent = contentRef.current;
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let finalContent = currentContent;

      for (const image of imageFiles) {
        const formData = new FormData();
        formData.append('image', image.file);
        const uploadResponse = await fetch(`${API}/feed/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error('이미지 업로드 실패');
        finalContent = finalContent.replace(image.previewUrl, `${API}${uploadData.fileUrl}`);
      }

      const response = await fetch(`${API}/feed/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...metadata, content: finalContent}),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitted(true);
        localStorage.removeItem('draft_metadata');
        localStorage.removeItem('draft_content');
        const pid = data.postId;
        setNewPostId(pid);
        if (metadata.category === 'ERROR') {
          setAiModal(true);
        } else {
          navigate(`/feed/${pid}`);
        }
      } else {
        setErrorMsg(data.message || '게시물 등록에 실패했습니다.');
      }
    } catch (err) {
      setErrorMsg('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const currentContent = contentRef.current;
    if (!metadata.category || !metadata.title.trim() || !currentContent.replace(/<[^>]*>?/gm, '').trim()) {
      setErrorMsg('카테고리, 제목, 본문 내용은 필수 항목입니다.');
      return;
    }
    const plainText = currentContent.replace(/<[^>]*>?/gm, '');
    const { words, replaceMap: rm } = await checkBadWords(plainText);
    if (words.length > 0) {
      setDetectedWords(words);
      setReplaceMap(rm);
      setBadWordModal(true);
      setPendingSubmit(true);
      return;
    }
    await doSubmit();
  };

  const handleBadWordReplace = async () => {
    setBadWordModal(false);
    setPendingSubmit(false);

    let newTitle = metadata.title;
    let newContent = contentRef.current;
    for (const [bad, rep] of Object.entries(replaceMap)) {
      const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      newTitle = newTitle.replace(regex, rep);
      newContent = newContent.replace(regex, rep);
    }
    setMetadata(prev => ({ ...prev, title: newTitle }));
    contentRef.current = newContent;
    if (quillRef.current) quillRef.current.getEditor().root.innerHTML = newContent;
    await doSubmit();
  };

  const handleBadWordConfirm = async () => {
    setBadWordModal(false);
    setPendingSubmit(false);
    await doSubmit();
  };

  const handleBadWordCancel = () => {
    setBadWordModal(false);
    setPendingSubmit(false);
  };

  const quillDarkCss = mode === 'dark' ? `
    .ql-toolbar.ql-snow { background: ${tk.inputBg} !important; border-color: ${tk.border} !important; }
    .ql-container.ql-snow { background: ${tk.paper} !important; border-color: ${tk.border} !important; }
    .ql-editor { color: ${tk.textPrimary} !important; }
    .ql-editor.ql-blank::before { color: ${tk.textHint} !important; font-style: normal !important; }
    .ql-snow .ql-stroke { stroke: ${tk.textSecondary} !important; }
    .ql-snow .ql-fill { fill: ${tk.textSecondary} !important; }
    .ql-snow .ql-picker { color: ${tk.textSecondary} !important; }
    .ql-snow .ql-picker-options { background: ${tk.paper} !important; border-color: ${tk.border} !important; }
    .ql-snow.ql-toolbar button:hover .ql-stroke, .ql-snow.ql-toolbar button.ql-active .ql-stroke { stroke: ${tk.accent} !important; }
    .ql-editor pre.ql-syntax { background: #0F172A !important; color: #D4D4D4 !important; }
    .ql-editor blockquote { border-left-color: ${tk.accent} !important; color: ${tk.textSecondary} !important; }
  ` : '';

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      {quillDarkCss && <style>{quillDarkCss}</style>}
      <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: tk.bg, pt: 6, pb: 12 }}>
        <Container maxWidth="md">

          {/* 헤더 */}
          <Box sx={{ mb: 5, animation: 'fadeUp 0.3s ease both' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, backgroundColor: tk.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: tk.paper, fontWeight: 900, fontSize: '0.85rem' }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: tk.textPrimary, letterSpacing: '-0.03em' }}>새 게시물 작성</Typography>
            </Box>
            <Typography sx={{ color: tk.textHint, fontSize: '0.83rem', pl: 6.5 }}>
              버그 해결 경험, 질문, 인사이트를 커뮤니티와 공유하세요.&nbsp;
              <Box component="span" sx={{ color: '#EF4444' }}>*</Box>는 필수 항목입니다.
            </Typography>
          </Box>

          <Stack spacing={2.5}>

            {/* 카테고리 */}
            <SectionCard tk={tk} sx={{ animationDelay: '0.05s' }}>
              <SectionLabel icon={<BugReport sx={{ fontSize: 17 }} />} title="카테고리" required hint="게시물 성격에 맞는 카테고리를 선택해주세요." tk={tk} />
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {CATEGORIES.map(cat => {
                  const isSelected = metadata.category === cat.value;
                  const catBg = mode === 'dark' ? cat.darkBg : cat.bg;
                  return (
                    <Box key={cat.value} onClick={() => setMetadata(prev => ({ ...prev, category: cat.value }))}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8, px: 2, py: 1, borderRadius: 1.5,
                        border: `1.5px solid ${isSelected ? cat.color : tk.border}`,
                        backgroundColor: isSelected ? catBg : 'transparent',
                        color: isSelected ? cat.color : tk.textSecondary,
                        cursor: 'pointer', fontWeight: isSelected ? 700 : 500, fontSize: '0.83rem',
                        fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
                        transition: 'all 0.18s', userSelect: 'none',
                        '&:hover': { borderColor: cat.color, backgroundColor: catBg, color: cat.color },
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>{cat.icon}</Box>
                      {cat.label}
                    </Box>
                  );
                })}
              </Stack>
            </SectionCard>

            {/* 제목 */}
            <SectionCard tk={tk} sx={{ animationDelay: '0.1s' }}>
              <SectionLabel icon={<TitleOutlined sx={{ fontSize: 17 }} />} title="제목" required hint="구체적으로, 다른 사람에게 질문하는 것처럼 작성하세요. 최소 15자 이상 권장합니다." tk={tk} />
              <TextField fullWidth size="small" value={metadata.title} onChange={handleMetaChange('title')}
                placeholder="예: React useEffect에서 무한 루프가 발생하는 이유가 무엇인가요?"
                inputProps={{ maxLength: 150 }}
                InputProps={{
                  sx: { fontSize: '0.9rem', color: tk.textPrimary },
                  endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ fontSize: '0.72rem', color: tk.textHint }}>{metadata.title.length}/150</Typography>
                    </InputAdornment>
                  ),
                }}
              />
            </SectionCard>

            {/* 본문 */}
            <SectionCard tk={tk} sx={{ animationDelay: '0.15s' }}>
              <SectionLabel icon={<ArticleOutlined sx={{ fontSize: 17 }} />} title="본문" required hint="[</>] 버튼으로 코드 블록을 삽입할 수 있습니다." tk={tk} />
              <Box sx={{
                '.ql-toolbar': { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
                '.ql-container': { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, minHeight: 360, fontSize: '0.92rem' },
                '.ql-editor': { minHeight: 360, lineHeight: 1.8, padding: '16px' },
                '.ql-editor pre.ql-syntax': { backgroundColor: '#0F172A', color: '#D4D4D4', padding: '16px', borderRadius: 6, fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.82rem', lineHeight: 1.7 },
                '.ql-editor blockquote': { borderLeft: `3px solid ${tk.accent}`, paddingLeft: 16, color: tk.textSecondary, margin: '8px 0' },
                '.ql-editor img': { maxWidth: '100%', height: 'auto', borderRadius: 6, display: 'block' },
              }}>
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  defaultValue={contentRef.current}
                  onChange={(val) => { contentRef.current = val; setIsDirty(true); }}
                  modules={quillModules}
                  preserveWhitespace
                  placeholder="문제 상황, 시도한 방법, 에러 메시지 등을 자세히 작성해주세요..."
                />
              </Box>
            </SectionCard>

            {/* 태그 */}
            <SectionCard tk={tk} sx={{ animationDelay: '0.2s' }}>
              <SectionLabel icon={<LocalOffer sx={{ fontSize: 17 }} />} title="태그" hint="관련 기술 스택 태그를 최대 5개까지 추가하세요." tk={tk} />
              <Autocomplete freeSolo multiple size="small" onChange={handleTagsChange}
                options={dbTags} value={metadata.tags}
                getOptionDisabled={() => metadata.tags.length >= 5}
                onInputChange={(_, val) => {
                  if (val.endsWith(',') || val.endsWith(' ')) {
                    const trimmed = val.slice(0, -1).trim();
                    if (trimmed && !metadata.tags.includes(trimmed) && metadata.tags.length < 5)
                      handleTagsChange(null, [...metadata.tags, trimmed]);
                  }
                }}
                PaperComponent={({ children, ...props }) => (
                  <Box {...props} sx={{ backgroundColor: tk.paper, border: `1px solid ${tk.border}`, borderRadius: 1.5, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', mt: 0.5 }}>
                    {children}
                  </Box>
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props}
                    sx={{ fontSize: '0.85rem', color: tk.textPrimary, px: 2, py: 1, cursor: 'pointer', '&:hover': { backgroundColor: tk.hover } }}>
                    {option}
                  </Box>
                )}
                renderTags={(value, getTagProps) => value.map((option, index) => (
                  <Chip key={index} label={option} size="small"
                    sx={{ backgroundColor: tk.accentBg, color: tk.accent, border: `1px solid ${tk.border}`, borderRadius: 1, fontWeight: 700, fontSize: '0.75rem' }}
                    {...getTagProps({ index })} />
                ))}
                renderInput={(params) => (
                  <TextField {...params}
                    placeholder={metadata.tags.length >= 5 ? '태그는 최대 5개입니다' : '기술 스택 입력 (예: React, TypeScript)'}
                    sx={{ '& .MuiInputBase-input': { color: tk.textPrimary } }}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <><InputAdornment position="start" sx={{ pl: 0.5, color: tk.textHint }}><Search fontSize="small" /></InputAdornment>{params.InputProps.startAdornment}</>
                      ),
                    }}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 1.5 }}>
                {dbTags.slice(0, 8).map(opt => (
                  !metadata.tags.includes(opt) && (
                    <Box key={opt} onClick={() => metadata.tags.length < 5 && handleTagsChange(null, [...metadata.tags, opt])}
                      sx={{
                        px: 1.2, py: 0.3, borderRadius: 1, border: `1px solid ${tk.border}`,
                        backgroundColor: tk.hover, color: tk.textSecondary,
                        fontSize: '0.72rem', fontWeight: 600, cursor: metadata.tags.length >= 5 ? 'not-allowed' : 'pointer',
                        opacity: metadata.tags.length >= 5 ? 0.4 : 1, transition: 'all 0.15s',
                        '&:hover': metadata.tags.length < 5 ? { borderColor: tk.accent, color: tk.accent, backgroundColor: tk.accentBg } : {},
                      }}>+ {opt}</Box>
                  )
                ))}
              </Box>
            </SectionCard>

            <Collapse in={!!errorMsg}>
              <Alert severity="error" icon={<WarningAmberOutlined fontSize="small" />} onClose={() => setErrorMsg('')}
                sx={{ borderRadius: 2, fontSize: '0.83rem', fontWeight: 600 }}>
                {errorMsg}
              </Alert>
            </Collapse>

            {/* 하단 버튼 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
              {isDirty ? (
                <Typography sx={{ fontSize: '0.75rem', color: tk.textHint, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                  임시저장됨
                </Typography>
              ) : <Box />}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button variant="outlined" onClick={() => { if (isDirty) { setNextPath('/feed'); setIsNavigating(true); } else navigate('/feed'); }}
                  sx={{ color: tk.textSecondary, borderColor: tk.border, fontSize: '0.83rem', px: 2.5, py: 1, '&:hover': { borderColor: tk.cardFocus } }}>
                  취소
                </Button>
                <Button variant="contained" disabled={loading} onClick={handleSubmit}
                  endIcon={!loading && <ArrowForward sx={{ fontSize: 16 }} />}
                  sx={{
                    backgroundColor: tk.textPrimary, color: tk.paper, fontSize: '0.88rem', px: 3, py: 1, boxShadow: 'none',
                    '&:hover': { backgroundColor: tk.accent, boxShadow: '0 4px 14px rgba(37,99,235,0.25)', transform: 'translateY(-1px)' },
                    '&.Mui-disabled': { backgroundColor: tk.border, color: tk.textHint }, transition: 'all 0.2s',
                  }}>
                  {loading ? <><CircularProgress size={14} sx={{ color: tk.paper, mr: 1 }} />등록 중...</> : '게시물 등록하기'}
                </Button>
              </Stack>
            </Box>

          </Stack>
        </Container>
      </Box>

      {/* ── 이탈 확인 다이얼로그 ── */}
      <Dialog open={isNavigating} maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2.5, p: 1, border: `1px solid ${tk.border}`, backgroundColor: tk.paper } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', color: tk.textPrimary, pb: 1 }}>작성을 취소하시겠습니까?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: tk.textSecondary, lineHeight: 1.6 }}>
            지금 페이지를 이동하면 작성 중인 내용이 모두 사라집니다. 그래도 이동하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={cancelNavigation}
            sx={{ color: tk.textSecondary, borderColor: tk.border, fontSize: '0.83rem' }}>
            계속 작성
          </Button>
          <Button fullWidth variant="contained" onClick={confirmNavigation}
            sx={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '0.83rem', boxShadow: 'none', '&:hover': { backgroundColor: '#DC2626' } }}>
            이탈하기
          </Button>
        </DialogActions>
      </Dialog>

      <BadWordModal
        open={badWordModal}
        badWords={detectedWords}
        replaceMap={replaceMap}
        onConfirm={handleBadWordConfirm}
        onReplace={handleBadWordReplace}
        onCancel={handleBadWordCancel}
        tk={tk}
      />

      {/* ── AI 답변 모달 (ERROR 카테고리) ── */}
      <AIAnswerModal
        open={aiModal}
        onClose={() => { setAiModal(false); navigate(`/feed/${newPostId}`); }}
        postId={newPostId}
        token={localStorage.getItem('accessToken')}
        navigate={navigate}
        tk={tk}
      />
    </ThemeProvider>
  );
}