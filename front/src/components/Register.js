import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Button, Container, Typography, TextField, Autocomplete, Chip,
  createTheme, ThemeProvider, CssBaseline, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, InputAdornment, CircularProgress, Alert, Collapse,
} from '@mui/material';
import {
  Search, ArrowForward, BugReport, HelpOutline, ChatBubbleOutline,
  LocalOffer, TitleOutlined, ArticleOutlined, WarningAmberOutlined,
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
    error: { main: '#EF4444' },
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
          backgroundColor: '#FFFFFF', borderRadius: 8,
          '& fieldset': { borderColor: '#E2E8F0' },
          '&:hover fieldset': { borderColor: '#94A3B8' },
          '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1 },
        },
      },
    },
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, borderRadius: 8 } } },
    MuiSelect: { styleOverrides: { root: { borderRadius: 8 } } },
  },
});

const TECH_STACK_OPTIONS = [
  'React', 'Vue', 'Next.js', 'TypeScript', 'JavaScript',
  'Spring Boot', 'Node.js', 'Python', 'Java', 'Go',
  'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle',
  'Docker', 'Kubernetes', 'AWS', 'Git',
];

const CATEGORIES = [
  { value: 'ERROR', label: '트러블슈팅 / 에러 해결', icon: <BugReport sx={{ fontSize: 16 }} />, color: '#EF4444', bg: '#FEF2F2' },
  { value: 'QUESTION', label: '일반 질문', icon: <HelpOutline sx={{ fontSize: 16 }} />, color: '#2563EB', bg: '#EFF6FF' },
  { value: 'FREE', label: '자유 게시판', icon: <ChatBubbleOutline sx={{ fontSize: 16 }} />, color: '#10B981', bg: '#ECFDF5' },
];

const SectionLabel = ({ icon, title, required, hint }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
      <Box sx={{ color: '#2563EB', display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', letterSpacing: '-0.01em' }}>
        {title}
        {required && <Box component="span" sx={{ color: '#EF4444', ml: 0.4 }}>*</Box>}
      </Typography>
    </Box>
    {hint && <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8', lineHeight: 1.5, pl: 3 }}>{hint}</Typography>}
  </Box>
);

const SectionCard = ({ children, sx = {} }) => (
  <Box sx={{
    backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, p: 3,
    transition: 'border-color 0.2s', '&:focus-within': { borderColor: '#CBD5E1' },
    animation: 'fadeUp 0.35s ease both', ...sx,
  }}>
    {children}
  </Box>
);

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const quillRef = useRef(null);

  // ── content를 ref로 관리 (리렌더링 방지) ──
  const contentRef = useRef(localStorage.getItem('draft_content') || '');

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [nextPath, setNextPath] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageFiles, setImageFiles] = useState([]);

  const [metadata, setMetadata] = useState(() => {
    try {
      const saved = localStorage.getItem('draft_metadata');
      return saved ? JSON.parse(saved) : { category: 'ERROR', title: '', tags: [] };
    } catch { return { category: 'ERROR', title: '', tags: [] }; }
  });

  // localStorage 저장 (500ms 디바운스)
  useEffect(() => {
    localStorage.setItem('draft_metadata', JSON.stringify(metadata));
  }, [metadata]);

  useEffect(() => {
    const t = setInterval(() => {
      localStorage.setItem('draft_content', contentRef.current);
    }, 500);
    return () => clearInterval(t);
  }, []);

  // ── Dirty check ──
  const [isDirty, setIsDirty] = useState(false);
  useEffect(() => {
    const dirty = !!(
      metadata.title ||
      metadata.tags.length > 0 ||
      contentRef.current.replace(/<[^>]*>?/gm, '').trim().length > 0
    );
    setIsDirty(dirty);
  }, [metadata]);

  // ── Navigation guard ──
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

      // scrollIntoView를 임시로 막기
      const originalScrollIntoView = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = () => { };

      quill.insertEmbed(index, 'image', base64, 'user');
      quill.setSelection(index + 1, 0, 'silent');
      contentRef.current = quill.root.innerHTML;
      setImageFiles(prev => [...prev, { file, previewUrl: base64 }]);
      setIsDirty(true);

      // 복원
      setTimeout(() => {
        Element.prototype.scrollIntoView = originalScrollIntoView;
      }, 100);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── 툴바 이미지 버튼 ──
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = () => {
      const file = input.files[0];
      if (file) insertImage(file);
    };
  }, [insertImage]);
  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();

    const handler = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imageItem = items.find(item => item.type.startsWith('image/'));
      if (!imageItem) return;

      // 이미지가 있으면 Quill의 모든 paste 처리를 막음
      e.preventDefault();
      e.stopImmediatePropagation();  // stopPropagation → stopImmediatePropagation

      const file = imageItem.getAsFile();
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        // getSelection 대신 현재 커서를 직접 가져옴
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
    clipboard: {
      matchVisual: false,  // ← Quill 기본 paste 처리 비활성화
    },
  }), [imageHandler]);

  // ── Submit ──
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const currentContent = contentRef.current;
    if (!metadata.category || !metadata.title.trim() || !currentContent.replace(/<[^>]*>?/gm, '').trim()) {
      setErrorMsg('카테고리, 제목, 본문 내용은 필수 항목입니다.');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      let finalContent = currentContent;
      for (const image of imageFiles) {
        const formData = new FormData();
        formData.append('image', image.file);
        const uploadResponse = await fetch('http://localhost:3010/feed/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadResponse.json();
        if (!uploadData.success) throw new Error('이미지 업로드 실패');
        finalContent = finalContent.replace(image.previewUrl, `http://localhost:3010${uploadData.fileUrl}`);
      }
      const response = await fetch('http://localhost:3010/feed/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...metadata, content: finalContent }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSubmitted(true);
        localStorage.removeItem('draft_metadata');
        localStorage.removeItem('draft_content');
        setTimeout(() => navigate('/feed'), 10);
      } else {
        setErrorMsg(data.message || '게시물 등록에 실패했습니다.');
      }
    } catch (err) {
      setErrorMsg('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: '#F8FAFC', pt: 6, pb: 12 }}>
        <Container maxWidth="md">

          <Box sx={{ mb: 5, animation: 'fadeUp 0.3s ease both' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem' }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: '#0F172A', letterSpacing: '-0.03em' }}>새 게시물 작성</Typography>
            </Box>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.83rem', pl: 6.5 }}>
              버그 해결 경험, 질문, 인사이트를 커뮤니티와 공유하세요.&nbsp;
              <Box component="span" sx={{ color: '#EF4444' }}>*</Box>는 필수 항목입니다.
            </Typography>
          </Box>

          <Stack spacing={2.5}>

            {/* 카테고리 */}
            <SectionCard sx={{ animationDelay: '0.05s' }}>
              <SectionLabel icon={<BugReport sx={{ fontSize: 17 }} />} title="카테고리" required hint="게시물 성격에 맞는 카테고리를 선택해주세요." />
              <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
                {CATEGORIES.map(cat => {
                  const isSelected = metadata.category === cat.value;
                  return (
                    <Box key={cat.value} onClick={() => setMetadata(prev => ({ ...prev, category: cat.value }))}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 0.8, px: 2, py: 1, borderRadius: 1.5,
                        border: `1.5px solid ${isSelected ? cat.color : '#E2E8F0'}`,
                        backgroundColor: isSelected ? cat.bg : 'transparent',
                        color: isSelected ? cat.color : '#64748B',
                        cursor: 'pointer', fontWeight: isSelected ? 700 : 500, fontSize: '0.83rem',
                        fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
                        transition: 'all 0.18s', userSelect: 'none',
                        '&:hover': { borderColor: cat.color, backgroundColor: cat.bg, color: cat.color },
                      }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>{cat.icon}</Box>
                      {cat.label}
                    </Box>
                  );
                })}
              </Stack>
            </SectionCard>

            {/* 제목 */}
            <SectionCard sx={{ animationDelay: '0.1s' }}>
              <SectionLabel icon={<TitleOutlined sx={{ fontSize: 17 }} />} title="제목" required hint="구체적으로, 다른 사람에게 질문하는 것처럼 작성하세요. 최소 15자 이상 권장합니다." />
              <TextField fullWidth size="small" value={metadata.title} onChange={handleMetaChange('title')}
                placeholder="예: React useEffect에서 무한 루프가 발생하는 이유가 무엇인가요?"
                inputProps={{ maxLength: 150 }}
                InputProps={{
                  sx: { fontSize: '0.9rem' }, endAdornment: (
                    <InputAdornment position="end">
                      <Typography sx={{ fontSize: '0.72rem', color: '#CBD5E1' }}>{metadata.title.length}/150</Typography>
                    </InputAdornment>
                  )
                }}
              />
            </SectionCard>

            {/* 본문 */}
            <SectionCard sx={{ animationDelay: '0.15s' }}>
              <SectionLabel icon={<ArticleOutlined sx={{ fontSize: 17 }} />} title="본문" required hint="[</>] 버튼으로 코드 블록을 삽입할 수 있습니다." />
              <Box sx={{
                '.ql-toolbar': { backgroundColor: '#F8FAFC', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderColor: '#E2E8F0', fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif' },
                '.ql-container': { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderColor: '#E2E8F0', minHeight: 360, fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif', fontSize: '0.92rem', color: '#0F172A' },
                '.ql-editor': { minHeight: 360, lineHeight: 1.8, padding: '16px' },
                '.ql-editor.ql-blank::before': { color: '#CBD5E1', fontStyle: 'normal', fontSize: '0.9rem' },
                '.ql-editor pre.ql-syntax': { backgroundColor: '#0F172A', color: '#E2E8F0', padding: '16px', borderRadius: 6, fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.82rem', lineHeight: 1.7 },
                '.ql-editor blockquote': { borderLeft: '3px solid #2563EB', paddingLeft: 16, color: '#64748B', margin: '8px 0' },
                '.ql-editor img': { maxWidth: '100%', height: 'auto', borderRadius: 6, display: 'block' },
                '.ql-snow .ql-stroke': { stroke: '#64748B' },
                '.ql-snow .ql-fill': { fill: '#64748B' },
                '.ql-snow.ql-toolbar button:hover .ql-stroke': { stroke: '#2563EB' },
                '.ql-snow.ql-toolbar button.ql-active .ql-stroke': { stroke: '#2563EB' },
              }}>
                {/* defaultValue 사용 → React 제어 밖 → 리렌더링 없음 → 스크롤 안 튐 */}
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  defaultValue={contentRef.current}
                  onChange={(val) => {
                    contentRef.current = val;
                    setIsDirty(true);
                  }}
                  modules={quillModules}
                  preserveWhitespace
                  placeholder="문제 상황, 시도한 방법, 에러 메시지 등을 자세히 작성해주세요..."
                />
              </Box>
            </SectionCard>

            {/* 태그 */}
            <SectionCard sx={{ animationDelay: '0.2s' }}>
              <SectionLabel icon={<LocalOffer sx={{ fontSize: 17 }} />} title="태그" hint="관련 기술 스택 태그를 최대 5개까지 추가하세요." />
              <Autocomplete freeSolo multiple size="small" onChange={handleTagsChange} options={TECH_STACK_OPTIONS}
                value={metadata.tags} getOptionDisabled={() => metadata.tags.length >= 5}
                onInputChange={(_, val, reason) => {
                  if (val.endsWith(',') || val.endsWith(' ')) {
                    const trimmed = val.slice(0, -1).trim();
                    if (trimmed && !metadata.tags.includes(trimmed) && metadata.tags.length < 5) {
                      handleTagsChange(null, [...metadata.tags, trimmed]);
                    }
                  }
                }}
                renderTags={(value, getTagProps) => value.map((option, index) => (
                  <Chip key={index} label={option} size="small"
                    sx={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 1, fontWeight: 700, fontSize: '0.75rem' }}
                    {...getTagProps({ index })} />
                ))}
                renderInput={(params) => (
                  <TextField {...params} placeholder={metadata.tags.length >= 5 ? '태그는 최대 5개입니다' : '기술 스택 입력 (예: React, TypeScript)'}
                    InputProps={{
                      ...params.InputProps, startAdornment: (
                        <><InputAdornment position="start" sx={{ pl: 0.5, color: '#94A3B8' }}><Search fontSize="small" /></InputAdornment>{params.InputProps.startAdornment}</>
                      )
                    }}
                  />
                )}
              />
              <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 1.5 }}>
                {TECH_STACK_OPTIONS.slice(0, 8).map(opt => (
                  !metadata.tags.includes(opt) && (
                    <Box key={opt} onClick={() => metadata.tags.length < 5 && handleTagsChange(null, [...metadata.tags, opt])}
                      sx={{
                        px: 1.2, py: 0.3, borderRadius: 1, border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', color: '#64748B', fontSize: '0.72rem', fontWeight: 600,
                        cursor: metadata.tags.length >= 5 ? 'not-allowed' : 'pointer', opacity: metadata.tags.length >= 5 ? 0.4 : 1, transition: 'all 0.15s',
                        '&:hover': metadata.tags.length < 5 ? { borderColor: '#2563EB', color: '#2563EB', backgroundColor: '#EFF6FF' } : {},
                      }}>+ {opt}</Box>
                  )
                ))}
              </Box>
            </SectionCard>

            <Collapse in={!!errorMsg}>
              <Alert severity="error" icon={<WarningAmberOutlined fontSize="small" />} onClose={() => setErrorMsg('')}
                sx={{ borderRadius: 2, backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '0.83rem', fontWeight: 600 }}>
                {errorMsg}
              </Alert>
            </Collapse>

            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1 }}>
              {isDirty ? (
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Box component="span" sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                  임시저장됨
                </Typography>
              ) : <Box />}
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Button variant="outlined" onClick={() => { if (isDirty) { setNextPath('/feed'); setIsNavigating(true); } else navigate('/feed'); }}
                  sx={{ color: '#64748B', borderColor: '#E2E8F0', fontSize: '0.83rem', px: 2.5, py: 1, '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' } }}>
                  취소
                </Button>
                <Button variant="contained" disabled={loading} onClick={handleSubmit} endIcon={!loading && <ArrowForward sx={{ fontSize: 16 }} />}
                  sx={{
                    backgroundColor: '#0F172A', color: '#fff', fontSize: '0.88rem', px: 3, py: 1, boxShadow: 'none',
                    '&:hover': { backgroundColor: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.25)', transform: 'translateY(-1px)' },
                    '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' }, transition: 'all 0.2s'
                  }}>
                  {loading ? <><CircularProgress size={14} sx={{ color: '#fff', mr: 1 }} />등록 중...</> : '게시물 등록하기'}
                </Button>
              </Stack>
            </Box>

          </Stack>
        </Container>
      </Box>

      <Dialog open={isNavigating} maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 2.5, p: 1, border: '1px solid #E2E8F0', boxShadow: '0 24px 64px rgba(15,23,42,0.12)' } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', pb: 1 }}>작성을 취소하시겠습니까?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.6 }}>
            지금 페이지를 이동하면 작성 중인 내용이 모두 사라집니다. 그래도 이동하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button fullWidth variant="outlined" onClick={cancelNavigation}
            sx={{ color: '#64748B', borderColor: '#E2E8F0', fontSize: '0.83rem', '&:hover': { borderColor: '#94A3B8' } }}>
            계속 작성
          </Button>
          <Button fullWidth variant="contained" onClick={confirmNavigation}
            sx={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '0.83rem', boxShadow: 'none', '&:hover': { backgroundColor: '#DC2626' } }}>
            이탈하기
          </Button>
        </DialogActions>
      </Dialog>

    </ThemeProvider>
  );
}