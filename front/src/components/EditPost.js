import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Button, Container, Typography, TextField, Autocomplete, Chip,
  Stack, InputAdornment, CircularProgress, Alert, Collapse, Skeleton,
} from '@mui/material';
import {
  Search, ArrowForward, BugReport, HelpOutline, ChatBubbleOutline,
  LocalOffer, TitleOutlined, ArticleOutlined, WarningAmberOutlined, ArrowBack,
} from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { useColorMode } from '../App';

const API = 'http://localhost:3010';

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

const SectionLabel = ({ icon, title, required, hint, colors }) => (
  <Box sx={{ mb: 1.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.4 }}>
      <Box sx={{ color: '#2563EB', display: 'flex', alignItems: 'center' }}>{icon}</Box>
      <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: colors.textPrimary, letterSpacing: '-0.01em' }}>
        {title}
        {required && <Box component="span" sx={{ color: '#EF4444', ml: 0.4 }}>*</Box>}
      </Typography>
    </Box>
    {hint && <Typography sx={{ fontSize: '0.78rem', color: colors.textMuted, lineHeight: 1.5, pl: 3 }}>{hint}</Typography>}
  </Box>
);

const SectionCard = ({ children, sx = {}, colors }) => (
  <Box sx={{
    backgroundColor: colors.paper,
    border: `1px solid ${colors.border}`,
    borderRadius: 2, p: 3,
    transition: 'border-color 0.2s',
    '&:focus-within': { borderColor: colors.borderFocus },
    animation: 'fadeUp 0.35s ease both',
    ...sx,
  }}>
    {children}
  </Box>
);

const SectionSkeleton = ({ colors }) => (
  <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2, p: 3 }}>
    <Skeleton width="30%" height={20} sx={{ mb: 2 }} />
    <Skeleton variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
  </Box>
);

export default function EditPost() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const token = localStorage.getItem('accessToken');
  const { mode } = useColorMode();
  const quillRef = useRef(null);
  const contentRef = useRef('');

const colors = {
  bg:          mode === 'dark' ? '#0F1117' : '#F8FAFC',  
  paper:       mode === 'dark' ? '#1A1D27' : '#FFFFFF',   
  border:      mode === 'dark' ? '#2D3148' : '#E2E8F0',
  borderFocus: mode === 'dark' ? '#4B5280' : '#CBD5E1',
  textPrimary: mode === 'dark' ? '#F1F5F9'  : '#0F172A', 
  textMuted:   mode === 'dark' ? '#94A3B8'  : '#64748B', 
  textHint:    mode === 'dark' ? '#64748B'  : '#94A3B8',
  inputBg:     mode === 'dark' ? '#22253A'  : '#F8FAFC',
  quillBg:     mode === 'dark' ? '#22253A'  : '#FFFFFF',
  quillText:   mode === 'dark' ? '#E2E8F0'  : '#0F172A',
  quillBorder: mode === 'dark' ? '#2D3148'  : '#E2E8F0',
  tagBg:       mode === 'dark' ? '#22253A'  : '#F8FAFC',
  hover:       mode === 'dark' ? '#2D3148'  : '#F1F5F9',
};

  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageFiles, setImageFiles] = useState([]);

  const [metadata, setMetadata] = useState({
    category: 'ERROR',
    title: '',
    tags: [],
  });

  useEffect(() => {
    if (!token) { navigate('/'); return; }

    const fetchPost = async () => {
      setInitialLoading(true);
      try {
        const res = await fetch(`${API}/feed/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) { navigate('/feed'); return; }

        const feed = data.feed;
        const categoryValue = feed.CATEGORY_NAME || feed.category || 'ERROR';

        setMetadata({
          category: categoryValue,
          title: feed.TITLE || feed.title || '',
          tags: feed.tags || [],
        });

        const existingContent = feed.CONTENT || feed.content || feed.DESCRIPTION || feed.description || '';
        contentRef.current = existingContent;

        setTimeout(() => {
          if (quillRef.current) {
            const quill = quillRef.current.getEditor();
            quill.clipboard.dangerouslyPasteHTML(existingContent);
          }
        }, 100);

      } catch {
        navigate('/feed');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPost();
  }, [postId, token, navigate]);

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
      setTimeout(() => { Element.prototype.scrollIntoView = orig; }, 100);
    };
    reader.readAsDataURL(file);
  }, []);

  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.click();
    input.onchange = () => { if (input.files[0]) insertImage(input.files[0]); };
  }, [insertImage]);

  useEffect(() => {
    if (!quillRef.current) return;
    const quill = quillRef.current.getEditor();
    const handler = (e) => {
      const items = Array.from(e.clipboardData?.items || []);
      const imgItem = items.find(i => i.type.startsWith('image/'));
      if (!imgItem) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const file = imgItem.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result;
        const sel = quill.getSelection() || { index: quill.getLength(), length: 0 };
        quill.insertEmbed(sel.index, 'image', base64, 'user');
        quill.setSelection(sel.index + 1, 0, 'silent');
        contentRef.current = quill.root.innerHTML;
        setImageFiles(prev => [...prev, { file, previewUrl: base64 }]);
      };
      reader.readAsDataURL(file);
    };
    quill.root.addEventListener('paste', handler, { capture: true });
    return () => quill.root.removeEventListener('paste', handler, { capture: true });
  }, [initialLoading]);

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

  const handleTagsChange = (_, newValue) => {
    const cleaned = newValue
      .map(v => (typeof v === 'string' ? v.trim() : v))
      .filter(v => v && v.length > 0);
    setMetadata(prev => ({ ...prev, tags: cleaned.slice(0, 5) }));
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    const currentContent = contentRef.current;

    if (!metadata.title.trim() || !currentContent.replace(/<[^>]*>?/gm, '').trim()) {
      setErrorMsg('제목과 본문 내용은 필수 항목입니다.');
      return;
    }

    setLoading(true);
    try {
      let finalContent = currentContent;
      for (const image of imageFiles) {
        if (!finalContent.includes(image.previewUrl)) continue;
        const formData = new FormData();
        formData.append('image', image.file);
        const uploadRes = await fetch(`${API}/feed/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error('이미지 업로드 실패');
        finalContent = finalContent.replace(image.previewUrl, `${API}${uploadData.fileUrl}`);
      }

      const res = await fetch(`${API}/feed/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...metadata, content: finalContent }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        navigate(`/post/${postId}`);
      } else {
        setErrorMsg(data.message || '수정에 실패했습니다.');
      }
    } catch {
      setErrorMsg('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg, pt: 6, pb: 12 }}>
        <Container maxWidth="md">
          <Stack spacing={2.5}>
            <SectionSkeleton colors={colors} />
            <SectionSkeleton colors={colors} />
            <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2, p: 3 }}>
              <Skeleton width="20%" height={20} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" height={360} sx={{ borderRadius: 1 }} />
            </Box>
            <SectionSkeleton colors={colors} />
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: colors.bg, pt: 6, pb: 12 }}>
      <Container maxWidth="md">

        {/* 헤더 */}
        <Box sx={{ mb: 5, animation: 'fadeUp 0.3s ease both' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{ width: 36, height: 36, borderRadius: 1.5, backgroundColor: colors.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: colors.paper, fontWeight: 900, fontSize: '0.85rem' }}>{'<>'}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1.6rem', color: colors.textPrimary, letterSpacing: '-0.03em' }}>
              게시물 수정
            </Typography>
          </Box>
          <Typography sx={{ color: colors.textHint, fontSize: '0.83rem', pl: 6.5 }}>
            내용을 수정한 뒤 저장하세요.&nbsp;
            <Box component="span" sx={{ color: '#EF4444' }}>*</Box>는 필수 항목입니다.
          </Typography>
        </Box>

        <Stack spacing={2.5}>

          {/* 카테고리 */}
          <SectionCard colors={colors} sx={{ animationDelay: '0.05s' }}>
            <SectionLabel colors={colors} icon={<BugReport sx={{ fontSize: 17 }} />} title="카테고리" required
              hint="게시물 성격에 맞는 카테고리를 선택해주세요." />
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {CATEGORIES.map(cat => {
                const isSelected = metadata.category === cat.value;
                return (
                  <Box key={cat.value}
                    onClick={() => setMetadata(prev => ({ ...prev, category: cat.value }))}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 0.8,
                      px: 2, py: 1, borderRadius: 1.5,
                      border: `1.5px solid ${isSelected ? cat.color : colors.border}`,
                      backgroundColor: isSelected ? cat.bg : 'transparent',
                      color: isSelected ? cat.color : colors.textMuted,
                      cursor: 'pointer', fontWeight: isSelected ? 700 : 500, fontSize: '0.83rem',
                      fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
                      transition: 'all 0.18s', userSelect: 'none',
                      '&:hover': { borderColor: cat.color, backgroundColor: cat.bg, color: cat.color },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', color: 'inherit' }}>{cat.icon}</Box>
                    {cat.label}
                  </Box>
                );
              })}
            </Stack>
          </SectionCard>

          {/* 제목 */}
          <SectionCard colors={colors} sx={{ animationDelay: '0.1s' }}>
            <SectionLabel colors={colors} icon={<TitleOutlined sx={{ fontSize: 17 }} />} title="제목" required
              hint="구체적으로 작성하세요. 최소 15자 이상 권장합니다." />
            <TextField
              fullWidth size="small"
              value={metadata.title}
              onChange={e => setMetadata(prev => ({ ...prev, title: e.target.value }))}
              placeholder="제목을 입력하세요"
              inputProps={{ maxLength: 150 }}
              InputProps={{
                sx: { fontSize: '0.9rem', backgroundColor: colors.paper, color: colors.textPrimary },
                endAdornment: (
                  <InputAdornment position="end">
                    <Typography sx={{ fontSize: '0.72rem', color: colors.textHint }}>
                      {metadata.title.length}/150
                    </Typography>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: colors.border },
                  '&:hover fieldset': { borderColor: colors.textMuted },
                  '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1 },
                },
                '& input': { color: colors.textPrimary },
              }}
            />
          </SectionCard>

          {/* 본문 */}
          <SectionCard colors={colors} sx={{ animationDelay: '0.15s' }}>
            <SectionLabel colors={colors} icon={<ArticleOutlined sx={{ fontSize: 17 }} />} title="본문" required
              hint="[</>] 버튼으로 코드 블록을 삽입할 수 있습니다." />
            <Box sx={{
              '.ql-toolbar': { backgroundColor: colors.inputBg, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderColor: colors.quillBorder, fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif' },
              '.ql-container': { backgroundColor: colors.quillBg, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, borderColor: colors.quillBorder, minHeight: 360, fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif', fontSize: '0.92rem', color: colors.quillText },
              '.ql-editor': { minHeight: 360, lineHeight: 1.8, padding: '16px', color: colors.quillText },
              '.ql-editor.ql-blank::before': { color: colors.textHint, fontStyle: 'normal', fontSize: '0.9rem' },
              '.ql-editor pre.ql-syntax': { backgroundColor: '#0F172A', color: '#E2E8F0', padding: '16px', borderRadius: 6, fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.82rem', lineHeight: 1.7 },
              '.ql-editor blockquote': { borderLeft: '3px solid #2563EB', paddingLeft: 16, color: colors.textMuted, margin: '8px 0' },
              '.ql-editor img': { maxWidth: '100%', height: 'auto', borderRadius: 6, display: 'block' },
              '.ql-snow .ql-stroke': { stroke: colors.textMuted },
              '.ql-snow .ql-fill': { fill: colors.textMuted },
              '.ql-snow.ql-toolbar button:hover .ql-stroke': { stroke: '#2563EB' },
              '.ql-snow.ql-toolbar button.ql-active .ql-stroke': { stroke: '#2563EB' },
              '.ql-picker-label': { color: colors.textMuted },
            }}>
              <ReactQuill
                ref={quillRef}
                theme="snow"
                defaultValue={contentRef.current}
                onChange={(val) => { contentRef.current = val; }}
                modules={quillModules}
                preserveWhitespace
                placeholder="내용을 입력하세요..."
              />
            </Box>
          </SectionCard>

          {/* 태그 */}
          <SectionCard colors={colors} sx={{ animationDelay: '0.2s' }}>
            <SectionLabel colors={colors} icon={<LocalOffer sx={{ fontSize: 17 }} />} title="태그"
              hint="관련 기술 스택 태그를 최대 5개까지 추가하세요." />
            <Autocomplete
              freeSolo multiple size="small"
              onChange={handleTagsChange}
              options={TECH_STACK_OPTIONS}
              value={metadata.tags}
              getOptionDisabled={() => metadata.tags.length >= 5}
              onInputChange={(_, val) => {
                if (val.endsWith(',') || val.endsWith(' ')) {
                  const trimmed = val.slice(0, -1).trim();
                  if (trimmed && !metadata.tags.includes(trimmed) && metadata.tags.length < 5) {
                    handleTagsChange(null, [...metadata.tags, trimmed]);
                  }
                }
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip key={index} label={option} size="small"
                    sx={{ backgroundColor: '#EFF6FF', color: '#2563EB', border: '1px solid #BFDBFE', borderRadius: 1, fontWeight: 700, fontSize: '0.75rem' }}
                    {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params}
                  placeholder={metadata.tags.length >= 5 ? '태그는 최대 5개입니다' : '기술 스택 입력 (예: React, TypeScript)'}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: colors.paper,
                      '& fieldset': { borderColor: colors.border },
                      '&:hover fieldset': { borderColor: colors.textMuted },
                      '&.Mui-focused fieldset': { borderColor: '#2563EB', borderWidth: 1 },
                    },
                    '& input': { color: colors.textPrimary },
                  }}
                  InputProps={{
                    ...params.InputProps,
                    startAdornment: (
                      <>
                        <InputAdornment position="start" sx={{ pl: 0.5, color: colors.textHint }}>
                          <Search fontSize="small" />
                        </InputAdornment>
                        {params.InputProps.startAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mt: 1.5 }}>
              {TECH_STACK_OPTIONS.slice(0, 8).map(opt =>
                !metadata.tags.includes(opt) && (
                  <Box key={opt}
                    onClick={() => metadata.tags.length < 5 && handleTagsChange(null, [...metadata.tags, opt])}
                    sx={{
                      px: 1.2, py: 0.3, borderRadius: 1,
                      border: `1px solid ${colors.border}`,
                      backgroundColor: colors.tagBg,
                      color: colors.textMuted,
                      fontSize: '0.72rem', fontWeight: 600,
                      cursor: metadata.tags.length >= 5 ? 'not-allowed' : 'pointer',
                      opacity: metadata.tags.length >= 5 ? 0.4 : 1,
                      transition: 'all 0.15s',
                      '&:hover': metadata.tags.length < 5
                        ? { borderColor: '#2563EB', color: '#2563EB', backgroundColor: '#EFF6FF' }
                        : {},
                    }}
                  >
                    + {opt}
                  </Box>
                )
              )}
            </Box>
          </SectionCard>

          {/* 에러 */}
          <Collapse in={!!errorMsg}>
            <Alert severity="error" icon={<WarningAmberOutlined fontSize="small" />}
              onClose={() => setErrorMsg('')}
              sx={{ borderRadius: 2, backgroundColor: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA', fontSize: '0.83rem', fontWeight: 600 }}>
              {errorMsg}
            </Alert>
          </Collapse>

          {/* 버튼 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pt: 1 }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Button
                variant="outlined"
                startIcon={<ArrowBack sx={{ fontSize: 15 }} />}
                onClick={() => navigate(`/post/${postId}`)}
                sx={{
                  color: colors.textMuted, borderColor: colors.border, fontSize: '0.83rem', px: 2.5, py: 1,
                  '&:hover': { borderColor: colors.textMuted, backgroundColor: colors.bg },
                }}
              >
                취소
              </Button>
              <Button
                variant="contained"
                disabled={loading}
                onClick={handleSubmit}
                endIcon={!loading && <ArrowForward sx={{ fontSize: 16 }} />}
                sx={{
                  backgroundColor: colors.textPrimary, color: colors.paper, fontSize: '0.88rem', px: 3, py: 1,
                  boxShadow: 'none',
                  '&:hover': { backgroundColor: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.25)', transform: 'translateY(-1px)' },
                  '&.Mui-disabled': { backgroundColor: colors.border, color: colors.textMuted },
                  transition: 'all 0.2s',
                }}
              >
                {loading
                  ? <><CircularProgress size={14} sx={{ color: colors.paper, mr: 1 }} />저장 중...</>
                  : '수정 저장하기'
                }
              </Button>
            </Stack>
          </Box>

        </Stack>
      </Container>
    </Box>
  );
}