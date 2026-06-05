import React, {
  useState, useEffect, useRef, useMemo, useCallback, useContext,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { ColorModeContext } from '../App';
import {
  Box, Button, Typography, TextField, Autocomplete, Chip,
  createTheme, ThemeProvider, CssBaseline, Stack, Dialog,
  DialogTitle, DialogContent, DialogActions, InputAdornment,
  CircularProgress, Alert, Collapse, Skeleton, Slider,
  IconButton, Tooltip,
} from '@mui/material';
import {
  Search, ArrowForward, BugReport, HelpOutline, ChatBubbleOutline,
  LocalOffer, TitleOutlined, ArticleOutlined, WarningAmberOutlined,
  Close, ReportProblemOutlined, ArrowBack, Add,
  Crop169, CropPortrait, ZoomIn, ZoomOut,
  WbSunny, Contrast, InvertColors,
  LocationOn, Image,
  BlurOn, LensBlur, Brightness4, CropFree,
} from '@mui/icons-material';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';

hljs.configure({
  languages: ['javascript', 'typescript', 'python', 'java', 'go', 'bash', 'sql',
    'jsx', 'tsx', 'css', 'html', 'json', 'cpp', 'c', 'kotlin', 'swift', 'rust', 'yaml'],
});

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

const ASPECT_RATIOS = [
  { label: '1:1', value: '1/1', icon: <CropFree sx={{ fontSize: 16 }} /> },
  { label: '4:5', value: '4/5', icon: <CropPortrait sx={{ fontSize: 16 }} /> },
  { label: '16:9', value: '16/9', icon: <Crop169 sx={{ fontSize: 16 }} /> },
];

const FILTERS = [
  { label: '없음', value: 'none', css: 'none' },
  { label: '클라로', value: 'claro', css: 'brightness(1.1) contrast(1.15) saturate(1.2)' },
  { label: '문', value: 'moon', css: 'grayscale(0.6) brightness(1.1)' },
  { label: '라크', value: 'lark', css: 'brightness(1.1) contrast(0.9) saturate(1.1)' },
  { label: '리얼', value: 'reyes', css: 'sepia(0.3) brightness(1.1) contrast(0.85) saturate(0.75)' },
  { label: '깅엄', value: 'gingham', css: 'brightness(1.05) hue-rotate(-10deg) contrast(0.9)' },
  { label: '허드슨', value: 'hudson', css: 'brightness(1.2) contrast(0.9) saturate(1.1)' },
  { label: '잉크웰', value: 'inkwell', css: 'grayscale(1) brightness(1.1) contrast(1.1)' },
];

const QUILL_CODE_CSS = `
  .ql-editor pre.ql-syntax {
    border-radius: 8px !important;
    padding: 16px !important;
    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace !important;
    font-size: 0.82rem !important;
    line-height: 1.75 !important;
    tab-size: 2 !important;
    overflow-x: auto !important;
  }
  .ql-editor pre.ql-syntax .hljs-keyword  { color: #C678DD; }
  .ql-editor pre.ql-syntax .hljs-string   { color: #98C379; }
  .ql-editor pre.ql-syntax .hljs-number   { color: #D19A66; }
  .ql-editor pre.ql-syntax .hljs-comment  { color: #5C6370; font-style: italic; }
  .ql-editor pre.ql-syntax .hljs-built_in { color: #E5C07B; }
  .ql-editor pre.ql-syntax .hljs-function { color: #61AFEF; }
  .ql-editor pre.ql-syntax .hljs-title    { color: #61AFEF; }
  .ql-editor pre.ql-syntax .hljs-variable { color: #E06C75; }
  .ql-editor pre.ql-syntax .hljs-attr     { color: #E06C75; }
  .ql-editor pre.ql-syntax .hljs-type     { color: #E5C07B; }
  .ql-editor pre.ql-syntax .hljs-literal  { color: #56B6C2; }
  .ql-editor code {
    background: #282C34 !important;
    color: #E06C75 !important;
    border-radius: 4px !important;
    padding: 2px 6px !important;
    font-family: 'JetBrains Mono', monospace !important;
    font-size: 0.83em !important;
  }
`;

// ─── 이미지 크롭 유틸 ────────────────────────────────────────
async function cropImageToFile(src, ratio, zoom, offset, outputSize = 800) {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const cw = outputSize;
      const ch = ratio === '16/9' ? Math.round(outputSize * 9 / 16)
        : ratio === '4/5' ? Math.round(outputSize * 5 / 4)
          : outputSize;

      const canvas = document.createElement('canvas');
      canvas.width = cw; canvas.height = ch;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, cw, ch);

      const coverScale = Math.max(cw / img.width, ch / img.height);
      const totalScale = coverScale * zoom;
      const displayW = img.width * totalScale;
      const displayH = img.height * totalScale;

      const previewBoxW = 580;
      const offsetRatio = cw / previewBoxW;
      const drawX = (cw - displayW) / 2 + offset.x * offsetRatio;
      const drawY = (ch - displayH) / 2 + offset.y * offsetRatio;

      ctx.drawImage(img, drawX, drawY, displayW, displayH);
      canvas.toBlob((blob) => {
        const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
        const previewUrl = URL.createObjectURL(blob);
        resolve({ file, previewUrl });
      }, 'image/jpeg', 0.92);
    };
    img.src = src;
  });
}

// ─── PhotoEditModal ───────────────────────────────────────────
function PhotoEditModal({ open, images, onClose, onDone, tk }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState('crop');
  const [perImage, setPerImage] = useState(() =>
    images.map(() => ({
      ratio: '1/1', zoom: 1, offset: { x: 0, y: 0 },
      filter: 'none',
      adjustments: { brightness: 100, contrast: 100, blur: 0, saturation: 100, temperature: 0, vignette: 0 },
    }))
  );
  const [imgList, setImgList] = useState(images);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const cur = perImage[currentIdx] || perImage[0];
  const { ratio, zoom, offset } = cur;

  const setField = (field, val) => {
    setPerImage(prev => {
      const next = [...prev];
      next[currentIdx] = { ...next[currentIdx], [field]: val };
      return next;
    });
  };

  const handleMouseDown = (e) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e) => {
    if (!dragging) return;
    setField('offset', { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setDragging(false);

  const getFilterStyle = (img) => {
    const f = FILTERS.find(f => f.value === img.filter)?.css || 'none';
    const a = img.adjustments;
    const adj = [
      `brightness(${a.brightness / 100})`,
      `contrast(${a.contrast / 100})`,
      `blur(${a.blur}px)`,
      `saturate(${a.saturation / 100})`,
      `hue-rotate(${a.temperature}deg)`,
    ].join(' ');
    return f !== 'none' ? `${f} ${adj}` : adj;
  };

  const handleDone = async () => {
    setProcessing(true);
    try {
      const results = await Promise.all(
        imgList.map(async (img, i) => {
          const meta = perImage[i];
          const src = img.previewUrl || img;
          return cropImageToFile(src, meta.ratio, meta.zoom, meta.offset);
        })
      );
      onDone(results, perImage);
    } finally {
      setProcessing(false);
    }
  };

  const ratioNum = ratio === '1/1' ? 1 : ratio === '4/5' ? 4 / 5 : 16 / 9;
  const previewW = 580;
  const previewH = Math.round(previewW / ratioNum);

  return (
    <Dialog
      open={open}
      maxWidth={false}
      disableScrollLock
      PaperProps={{
        sx: {
          width: 980, maxWidth: '98vw',
          borderRadius: 2.5,
          backgroundColor: tk.paper,
          border: `1px solid ${tk.border}`,
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ display: 'flex', height: Math.min(Math.max(previewH + 200, 640), 860), maxHeight: '94vh' }}>
        {/* 왼쪽: 미리보기 */}
        <Box sx={{ width: previewW, flexShrink: 0, backgroundColor: '#0A0A0A', display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <Box
            onMouseDown={handleMouseDown} onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            sx={{ flex: 1, overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}
          >
            <Box sx={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.12)', zIndex: 2, pointerEvents: 'none' }} />
            <img
              src={imgList[currentIdx]?.previewUrl || imgList[currentIdx]}
              alt=""
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                filter: getFilterStyle(cur),
                width: '100%', height: '100%', objectFit: 'cover',
                userSelect: 'none', pointerEvents: 'none', display: 'block',
                aspectRatio: ratio, maxHeight: '100%',
              }}
              draggable={false}
            />
            {cur.adjustments.vignette > 0 && (
              <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 3, background: `radial-gradient(ellipse at center, transparent ${100 - cur.adjustments.vignette}%, rgba(0,0,0,0.8) 100%)` }} />
            )}
          </Box>

          {/* 줌 슬라이더 */}
          <Box sx={{ backgroundColor: 'rgba(0,0,0,0.85)', px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <ZoomOut sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
            <Slider
              min={0.5} max={3} step={0.05} value={zoom}
              onChange={(_, v) => setField('zoom', v)}
              sx={{ color: '#fff', flex: 1, '& .MuiSlider-thumb': { width: 12, height: 12 }, '& .MuiSlider-rail': { opacity: 0.3 } }}
            />
            <ZoomIn sx={{ fontSize: 16, color: 'rgba(255,255,255,0.5)' }} />
          </Box>

          {/* 썸네일 목록 */}
          {imgList.length > 1 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5, py: 1, backgroundColor: 'rgba(0,0,0,0.9)', overflowX: 'auto' }}>
              {imgList.map((img, i) => (
                <Box key={i} onClick={() => setCurrentIdx(i)}
                  sx={{ flexShrink: 0, width: 52, height: 52, borderRadius: 1, overflow: 'hidden', border: `2px solid ${i === currentIdx ? '#fff' : 'transparent'}`, cursor: 'pointer', position: 'relative', opacity: i === currentIdx ? 1 : 0.5, transition: 'all 0.15s', '&:hover': { opacity: 1 } }}>
                  <img src={img.previewUrl || img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton size="small"
                    onClick={e => {
                      e.stopPropagation();
                      const nl = [...imgList]; nl.splice(i, 1);
                      const nm = [...perImage]; nm.splice(i, 1);
                      setImgList(nl); setPerImage(nm);
                      if (currentIdx >= nl.length) setCurrentIdx(nl.length - 1);
                    }}
                    sx={{ position: 'absolute', top: 0, right: 0, p: 0.2, backgroundColor: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 0, opacity: 0, '.MuiBox-root:hover &': { opacity: 1 } }}>
                    <Close sx={{ fontSize: 10 }} />
                  </IconButton>
                </Box>
              ))}
              <Box component="label"
                sx={{ flexShrink: 0, width: 52, height: 52, borderRadius: 1, border: '1.5px dashed rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', '&:hover': { borderColor: '#fff', color: '#fff' } }}>
                <Add sx={{ fontSize: 18 }} />
                <input type="file" accept="image/*" multiple hidden onChange={e => {
                  const files = Array.from(e.target.files);
                  const newImgs = files.map(f => ({ originalFile: f, file: f, previewUrl: URL.createObjectURL(f) }));
                  const newMeta = files.map(() => ({ ratio: '1/1', zoom: 1, offset: { x: 0, y: 0 }, filter: 'none', adjustments: { brightness: 100, contrast: 100, blur: 0, saturation: 100, temperature: 0, vignette: 0 } }));
                  setImgList(p => [...p, ...newImgs]);
                  setPerImage(p => [...p, ...newMeta]);
                }} />
              </Box>
            </Box>
          )}
        </Box>

        {/* 오른쪽: 컨트롤 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: `1px solid ${tk.border}`, flexShrink: 0 }}>
            <IconButton onClick={onClose} size="small" sx={{ color: tk.textSecondary }}>
              <ArrowBack sx={{ fontSize: 18 }} />
            </IconButton>
            <Box sx={{ display: 'flex', gap: 0.8 }}>
              {['crop', 'edit'].map(s => (
                <Button key={s} size="small" onClick={() => setStep(s)}
                  sx={{ fontSize: '0.75rem', px: 1.5, py: 0.5, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', fontWeight: 700, backgroundColor: step === s ? tk.textPrimary : 'transparent', color: step === s ? tk.paper : tk.textSecondary, border: `1px solid ${step === s ? tk.textPrimary : tk.border}`, '&:hover': { backgroundColor: step === s ? tk.textPrimary : tk.hover } }}>
                  {s === 'crop' ? '자르기' : '편집'}
                </Button>
              ))}
            </Box>
            <Button size="small" onClick={handleDone} disabled={processing}
              sx={{ fontSize: '0.8rem', fontWeight: 800, color: tk.accent, textTransform: 'none', minWidth: 48 }}>
              {processing ? <CircularProgress size={13} /> : '완료'}
            </Button>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: tk.border, borderRadius: 2 } }}>
            {step === 'crop' && (
              <Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: tk.textHint, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>비율</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                  {ASPECT_RATIOS.map(ar => (
                    <Box key={ar.value} onClick={() => setField('ratio', ar.value)}
                      sx={{ flex: 1, py: 1.2, borderRadius: 1.5, border: `1.5px solid ${ratio === ar.value ? tk.accent : tk.border}`, backgroundColor: ratio === ar.value ? tk.accentBg : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, cursor: 'pointer', color: ratio === ar.value ? tk.accent : tk.textSecondary, transition: 'all 0.15s' }}>
                      {ar.icon}
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700 }}>{ar.label}</Typography>
                    </Box>
                  ))}
                </Stack>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: tk.textHint, mb: 1, textTransform: 'uppercase', letterSpacing: '0.08em' }}>이미지 이동</Typography>
                <Typography sx={{ fontSize: '0.75rem', color: tk.textHint, mb: 1.5 }}>왼쪽 이미지를 드래그해서 위치를 조정하세요</Typography>
              </Box>
            )}

            {step === 'edit' && (
              <Box>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: tk.textHint, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>필터</Typography>
                <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1.5, mb: 3, '&::-webkit-scrollbar': { height: 3 }, '&::-webkit-scrollbar-thumb': { backgroundColor: tk.border, borderRadius: 2 } }}>
                  {FILTERS.map(f => (
                    <Box key={f.value} onClick={() => setField('filter', f.value)} sx={{ flexShrink: 0, textAlign: 'center', cursor: 'pointer' }}>
                      <Box sx={{ width: 64, height: 64, borderRadius: 1.5, overflow: 'hidden', border: `2.5px solid ${cur.filter === f.value ? tk.accent : 'transparent'}`, mb: 0.5, transition: 'border-color 0.15s' }}>
                        <img src={imgList[currentIdx]?.previewUrl || imgList[currentIdx]} alt={f.label} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: f.css === 'none' ? 'none' : f.css }} />
                      </Box>
                      <Typography sx={{ fontSize: '0.65rem', color: cur.filter === f.value ? tk.accent : tk.textHint, fontWeight: cur.filter === f.value ? 800 : 400 }}>{f.label}</Typography>
                    </Box>
                  ))}
                </Box>

                <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: tk.textHint, mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.08em' }}>조정</Typography>
                {[
                  { key: 'brightness', label: '밝기', icon: <WbSunny sx={{ fontSize: 14 }} />, min: 50, max: 150 },
                  { key: 'contrast', label: '대비', icon: <Contrast sx={{ fontSize: 14 }} />, min: 50, max: 200 },
                  { key: 'saturation', label: '채도', icon: <InvertColors sx={{ fontSize: 14 }} />, min: 0, max: 200 },
                  { key: 'blur', label: '흐리게', icon: <BlurOn sx={{ fontSize: 14 }} />, min: 0, max: 5 },
                  { key: 'temperature', label: '온도', icon: <Brightness4 sx={{ fontSize: 14 }} />, min: -30, max: 30 },
                  { key: 'vignette', label: '비네트', icon: <LensBlur sx={{ fontSize: 14 }} />, min: 0, max: 80 },
                ].map(adj => (
                  <Box key={adj.key} sx={{ mb: 1.8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, color: tk.textSecondary }}>
                        {adj.icon}
                        <Typography sx={{ fontSize: '0.78rem' }}>{adj.label}</Typography>
                      </Box>
                      <Typography sx={{ fontSize: '0.7rem', color: tk.textHint, fontFamily: 'monospace' }}>{cur.adjustments[adj.key]}</Typography>
                    </Box>
                    <Slider
                      size="small" min={adj.min} max={adj.max} step={1}
                      value={cur.adjustments[adj.key]}
                      onChange={(_, v) => setPerImage(prev => {
                        const next = [...prev];
                        next[currentIdx] = { ...next[currentIdx], adjustments: { ...next[currentIdx].adjustments, [adj.key]: v } };
                        return next;
                      })}
                      sx={{ color: tk.accent, py: 0.5, '& .MuiSlider-thumb': { width: 12, height: 12 } }}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

// ─── BadWordModal ─────────────────────────────────────────────
function BadWordModal({ open, badWords, replaceMap, onConfirm, onReplace, onCancel, tk }) {
  return (
    <Dialog open={open} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 2.5, backgroundColor: tk.paper, border: `1px solid ${tk.border}` } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', color: tk.textPrimary, display: 'flex', alignItems: 'center', gap: 1.2, pb: 1 }}>
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <WarningAmberOutlined sx={{ fontSize: 17, color: '#DC2626' }} />
        </Box>
        부적절한 표현 감지됨
      </DialogTitle>
      <DialogContent sx={{ pt: 0 }}>
        <Typography sx={{ fontSize: '0.85rem', color: tk.textSecondary, lineHeight: 1.7, mb: 2 }}>커뮤니티 가이드라인에 위반될 수 있는 표현이 포함되어 있습니다.</Typography>
        <Box sx={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 1.5, p: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#991B1B', mb: 0.8 }}>감지된 표현:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
            {badWords.map((w, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: 1, px: 1, py: 0.2 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#DC2626', fontWeight: 700 }}>{w}</Typography>
                {replaceMap[w] && (
                  <>
                    <ArrowForward sx={{ fontSize: 11, color: '#94A3B8' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#16A34A', fontWeight: 700 }}>{replaceMap[w]}</Typography>
                  </>
                )}
              </Box>
            ))}
          </Box>
        </Box>
        <Box sx={{ backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 1.5, p: 1.2, display: 'flex', gap: 0.8 }}>
          <ReportProblemOutlined sx={{ fontSize: 14, color: '#D97706', mt: 0.1, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.77rem', color: '#92400E', lineHeight: 1.7 }}>반복 위반 시 계정 이용에 불이익이 생길 수 있습니다.</Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2, gap: 0.8 }}>
        <Button fullWidth variant="outlined" onClick={onCancel} sx={{ color: tk.textSecondary, borderColor: tk.border, fontSize: '0.8rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5 }}>수정하기</Button>
        <Button fullWidth variant="contained" onClick={onReplace} sx={{ backgroundColor: '#16A34A', color: '#fff', fontSize: '0.8rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#15803D' } }}>대체 후 저장</Button>
        <Button fullWidth variant="contained" onClick={onConfirm} sx={{ backgroundColor: '#DC2626', color: '#fff', fontSize: '0.8rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#B91C1C' } }}>그래도 저장</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── LeaveConfirmDialog ───────────────────────────────────────
function LeaveConfirmDialog({ open, onConfirm, onCancel, tk }) {
  return (
    <Dialog open={open} maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 2.5, p: 1, border: `1px solid ${tk.border}`, backgroundColor: tk.paper } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '0.98rem', color: tk.textPrimary, pb: 1 }}>수정을 취소하시겠습니까?</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontSize: '0.84rem', color: tk.textSecondary, lineHeight: 1.6 }}>지금 닫으면 수정 중인 내용이 모두 사라집니다.</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button fullWidth variant="outlined" onClick={onCancel} sx={{ color: tk.textSecondary, borderColor: tk.border, fontSize: '0.82rem', textTransform: 'none', fontWeight: 700 }}>계속 수정</Button>
        <Button fullWidth variant="contained" onClick={onConfirm} sx={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '0.82rem', boxShadow: 'none', textTransform: 'none', fontWeight: 700, '&:hover': { backgroundColor: '#DC2626' } }}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── LocationAutocomplete ─────────────────────────────────────
function LocationAutocomplete({ value, onChange, tk }) {
  const [inputValue, setInputValue] = useState(value || '');

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) { setOptions([]); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=6&accept-language=ko`,
        { headers: { 'Accept-Language': 'ko' } }
      );
      const data = await res.json();
      const formatted = data.map(item => {
        const a = item.address;
        const parts = [
          a?.country === '대한민국' ? null : a?.country,
          a?.province || a?.state,
          a?.city || a?.town || a?.municipality || a?.county,
          a?.suburb || a?.neighbourhood || a?.quarter,
          a?.road,
        ].filter(Boolean);
        return { label: parts.join(' ') || item.display_name, full: item.display_name };
      });
      const seen = new Set();
      setOptions(formatted.filter(o => { if (seen.has(o.label)) return false; seen.add(o.label); return true; }));
    } catch {
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (_, newInput) => {
    setInputValue(newInput);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(newInput), 350);
  };

  return (
    <Autocomplete
      freeSolo size="small" options={options}
      getOptionLabel={opt => (typeof opt === 'string' ? opt : opt.label)}
      loading={loading} inputValue={inputValue}
      onInputChange={handleInputChange}
      onChange={(_, val) => {
        const label = typeof val === 'string' ? val : val?.label || '';
        setInputValue(label);
        onChange(label);
      }}
      PaperComponent={({ children, ...props }) => (
        <Box {...props} sx={{ backgroundColor: tk.paper, border: `1px solid ${tk.border}`, borderRadius: 1.5, boxShadow: '0 8px 24px rgba(15,23,42,0.15)', mt: 0.5 }}>{children}</Box>
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.9, fontSize: '0.83rem', color: tk.textPrimary, cursor: 'pointer', '&:hover': { backgroundColor: tk.hover } }}>
          <LocationOn sx={{ fontSize: 15, color: tk.textHint, flexShrink: 0 }} />
          <Typography sx={{ fontSize: '0.83rem', color: tk.textPrimary, lineHeight: 1.4 }}>{option.label}</Typography>
        </Box>
      )}
      renderInput={(params) => (
        <TextField {...params}
          placeholder="위치를 검색하세요 (예: 서울, 강남구...)"
          InputProps={{
            ...params.InputProps,
            sx: { fontSize: '0.84rem' },
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn sx={{ fontSize: 16, color: tk.textHint }} />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading && <CircularProgress size={13} sx={{ color: tk.textHint, mr: 1 }} />}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}

// ─── 메인: EditModal ──────────────────────────────────────────
// Props:
//   open     : boolean       - 모달 열림 여부
//   postId   : string|number - 수정할 게시물 ID
//   onClose  : () => void    - 닫기 콜백
//   onSaved  : () => void    - 저장 성공 후 콜백 (없으면 post 페이지로 navigate)
export default function EditModal({ open, postId, onClose, onSaved }) {
  const navigate = useNavigate();
  const { mode } = useContext(ColorModeContext);
  const quillRef = useRef(null);
  const contentRef = useRef('');
  const isDirtyRef = useRef(false);
  const token = localStorage.getItem('accessToken');

  const tk = TOKEN[mode] || TOKEN.light;

  const markDirty = useCallback(() => { isDirtyRef.current = true; setIsDirty(true); }, []);

  const muiTheme = useMemo(() => createTheme({
    palette: { mode, primary: { main: tk.accent }, background: { default: tk.bg, paper: tk.paper } },
    typography: { fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif' },
    components: {
      MuiCssBaseline: { styleOverrides: `@keyframes fadeUp { from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)} }` },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: tk.inputBg, borderRadius: 8,
            '& fieldset': { borderColor: tk.border },
            '&:hover fieldset': { borderColor: tk.cardFocus },
            '&.Mui-focused fieldset': { borderColor: tk.accent, borderWidth: 1 },
            '& input, & textarea': { color: tk.textPrimary },
          },
        },
      },
      MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700, borderRadius: 8 } } },
    },
  }), [mode, tk]);

  // ── 상태 ──────────────────────────────────────────────────────
  const [initialLoading, setInitialLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [leaveConfirm, setLeaveConfirm] = useState(false);
  const [badWordModal, setBadWordModal] = useState(false);
  const [detectedWords, setDetectedWords] = useState([]);
  const [replaceMap, setReplaceMap] = useState({});
  const [activeTab, setActiveTab] = useState('settings');
  const [location, setLocation] = useState('');
  const [hideLikes, setHideLikes] = useState(false);
  const [disableComments, setDisableComments] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [photoEditOpen, setPhotoEditOpen] = useState(false);
  const [editingImageIdx, setEditingImageIdx] = useState(null);
  const [metadata, setMetadata] = useState({ category: 'ERROR', title: '', tags: [] });

  useEffect(() => {
    if (!open || !postId) return;

    setInitialLoading(true);
    setErrorMsg('');
    setImageFiles([]);
    setLocation('');
    setHideLikes(false);
    setDisableComments(false);
    setIsDirty(false);
    isDirtyRef.current = false;
    contentRef.current = '';

    const fetchPost = async () => {
      try {
        const res = await fetch(`${API}/feed/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) { onClose?.(); return; }

        const feed = data.feed;

        // ✅ 실제 어떤 키로 오는지 확인용 (개발 후 제거)
        console.log('[EditModal] feed keys:', Object.keys(feed));
        console.log('[EditModal] location fields:', {
          LOCATION: feed.LOCATION,
          location: feed.location,
        });

        setMetadata({
          category: feed.CATEGORY_NAME || feed.CATEGORY_NAME || 'ERROR',
          title: feed.TITLE || '',
          tags: feed.TAGS ? feed.TAGS.split(',').filter(Boolean) : (feed.tags || []),
        });

        // ✅ 가능한 모든 키 조합 시도
        const loc = feed.LOCATION ?? feed.location ?? feed['LOCATION'] ?? '';
        console.log('[EditModal] resolved location:', loc);
        setLocation(loc);

        setHideLikes(feed.HIDE_LIKE_COUNT === 'Y' || feed.hide_like_count === 'Y');
        setDisableComments(feed.DISABLE_COMMENTS === 'Y' || feed.disable_comments === 'Y');

        const existingContent = feed.CONTENT || feed.content || '';
        contentRef.current = existingContent;

        // 기존 이미지 복원
        const imgRegex = /<img[^>]+src="([^">]+)"/g;
        let match;
        const restoredImages = [];
        while ((match = imgRegex.exec(existingContent)) !== null) {
          const src = match[1];
          restoredImages.push({
            file: null,
            previewUrl: src.startsWith('http') ? src : `${API}${src}`,
            editorSrc: src,
            originalUrl: src.startsWith('http') ? src : `${API}${src}`,
            isRestored: true,
          });
        }
        setImageFiles(restoredImages);

        setTimeout(() => {
          const quill = quillRef.current?.getEditor();
          if (quill) quill.clipboard.dangerouslyPasteHTML(existingContent);
        }, 100);
      } catch (e) {
        console.error('[EditModal] fetchPost error:', e);
        onClose?.();
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPost();
  }, [open, postId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 이미지 ref 동기화 ──────────────────────────────────────────
  const imageFilesRef = useRef([]);
  useEffect(() => { imageFilesRef.current = imageFiles; }, [imageFiles]);

  // ── MutationObserver: 에디터 이미지 삭제 감지 ─────────────────
  useEffect(() => {
    if (initialLoading) return;
    const timer = setTimeout(() => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      let debounceTimer;
      const observer = new MutationObserver(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const editorSrcs = new Set(
            Array.from(quill.root.querySelectorAll('img')).map(img => img.getAttribute('src'))
          );
          setImageFiles(prev => {
            const next = prev.filter(f =>
              editorSrcs.has(f.editorSrc) || editorSrcs.has(f.previewUrl)
            );
            return next.length === prev.length ? prev : next;
          });
        }, 150);
      });

      observer.observe(quill.root, { childList: true, subtree: true });
      return () => { clearTimeout(debounceTimer); observer.disconnect(); };
    }, 300);
    return () => clearTimeout(timer);
  }, [initialLoading]);

  // ── 이미지 삽입 ───────────────────────────────────────────────
  const insertImage = useCallback((file, previewUrl) => {
    const reader = new FileReader();
    reader.onload = () => {
      const quill = quillRef.current?.getEditor();
      if (!quill) return;

      const savedX = window.scrollX;
      const savedY = window.scrollY;
      const origSIV = Element.prototype.scrollIntoView;
      Element.prototype.scrollIntoView = function () { };

      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      quill.insertEmbed(index, 'image', reader.result, 'user');
      quill.setSelection(index + 1, 0, 'silent');
      contentRef.current = quill.root.innerHTML;

      setImageFiles(prev => [
        ...prev,
        { file, previewUrl: previewUrl || reader.result, editorSrc: reader.result, originalUrl: previewUrl || reader.result },
      ]);
      markDirty();

      requestAnimationFrame(() => {
        Element.prototype.scrollIntoView = origSIV;
        window.scrollTo(savedX, savedY);
      });
    };
    reader.readAsDataURL(file);
  }, [markDirty]);

  // ── 이미지 핸들러 (툴바) ──────────────────────────────────────
  const imageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.click();
    input.onchange = () => {
      if (!input.files[0]) return;
      const file = input.files[0];
      setPendingFiles([{ originalFile: file, file, previewUrl: URL.createObjectURL(file) }]);
      setEditingImageIdx(null);
      setPhotoEditOpen(true);
    };
  }, []);

  // ── 클립보드 붙여넣기 ─────────────────────────────────────────
  useEffect(() => {
    if (initialLoading || !open) return;
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handlePaste = (e) => {
      const imageItem = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'));
      if (!imageItem) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      const file = imageItem.getAsFile();
      if (file) {
        setPendingFiles([{ originalFile: file, file, previewUrl: URL.createObjectURL(file) }]);
        setEditingImageIdx(null);
        setPhotoEditOpen(true);
      }
    };

    quill.root.addEventListener('paste', handlePaste, { capture: true });
    return () => quill.root.removeEventListener('paste', handlePaste, { capture: true });
  }, [initialLoading, open]);

  // ── 이미지 재편집 ─────────────────────────────────────────────
  const handleReEditImage = (idx) => {
    const img = imageFiles[idx];
    setPendingFiles([{ file: img.file, previewUrl: img.originalUrl || img.previewUrl }]);
    setEditingImageIdx(idx);
    setPhotoEditOpen(true);
  };

  // ── PhotoEdit 완료 ────────────────────────────────────────────
  const handlePhotoDone = useCallback(async (finalImgs) => {
    setPhotoEditOpen(false);

    if (editingImageIdx !== null) {
      const { file, previewUrl } = finalImgs[0];
      const reader = new FileReader();
      reader.onload = () => {
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const imgs = quill.root.querySelectorAll('img');
          const oldSrc = imageFiles[editingImageIdx]?.editorSrc;
          imgs.forEach(imgEl => { if (imgEl.getAttribute('src') === oldSrc) imgEl.src = reader.result; });
          contentRef.current = quill.root.innerHTML;
        }
        setImageFiles(prev => {
          const next = [...prev];
          const cur = prev[editingImageIdx];
          next[editingImageIdx] = { file, previewUrl, editorSrc: reader.result, originalUrl: cur.originalUrl || cur.previewUrl };
          return next;
        });
        markDirty();
      };
      reader.readAsDataURL(file);
    } else {
      for (let i = 0; i < finalImgs.length; i++) {
        insertImage(finalImgs[i].file, pendingFiles[i].previewUrl);
      }
    }

    setEditingImageIdx(null);
    setPendingFiles([]);
  }, [editingImageIdx, imageFiles, insertImage, pendingFiles, markDirty]);

  // ── 에디터에서 이미지 제거 ────────────────────────────────────
  const removeImageFromEditor = useCallback((imgFile) => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;
    const imgs = Array.from(quill.root.querySelectorAll('img'));
    const target = imgs.find(el => el.getAttribute('src') === imgFile.editorSrc || el.getAttribute('src') === imgFile.previewUrl);
    if (target) {
      const blot = Quill.find(target);
      if (blot) {
        const index = quill.getIndex(blot);
        quill.deleteText(index, 1, 'user');
      } else {
        target.closest('p')?.remove() || target.remove();
      }
      contentRef.current = quill.root.innerHTML;
    }
  }, []);

  // ── 비속어 검사 ───────────────────────────────────────────────
  const checkBadWords = async (title, plainContent) => {
    try {
      const res = await fetch(`${API}/feed/check-profanity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, content: plainContent }),
      });
      if (!res.ok) return { words: [], replaceMap: {} };
      const data = await res.json();
      return {
        words: Array.isArray(data.words) ? data.words : [],
        replaceMap: (data.replaceMap && typeof data.replaceMap === 'object') ? data.replaceMap : {},
      };
    } catch {
      return { words: [], replaceMap: {} };
    }
  };

  // ── 실제 저장 ─────────────────────────────────────────────────
  const doSubmit = async () => {
    setErrorMsg(''); setLoading(true);
    try {
      let finalContent = contentRef.current;

      for (const image of imageFiles) {
        if (image.isRestored || !image.file) continue; // ✅ 기존 이미지 스킵
        if (!finalContent.includes(image.editorSrc || image.previewUrl)) continue;

        const formData = new FormData();
        formData.append('image', image.file);
        const uploadRes = await fetch(`${API}/feed/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) throw new Error('이미지 업로드 실패');
        const serverUrl = `${API}${uploadData.fileUrl}`;
        if (image.editorSrc) finalContent = finalContent.split(image.editorSrc).join(serverUrl);
        if (image.previewUrl && image.previewUrl !== image.editorSrc) {
          finalContent = finalContent.split(image.previewUrl).join(serverUrl);
        }
      }

      const res = await fetch(`${API}/feed/${postId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          category: metadata.category,
          title: metadata.title,
          content: finalContent,
          tags: metadata.tags,
          hide_like_count: hideLikes ? 'Y' : 'N',
          disable_comments: disableComments ? 'Y' : 'N',
          location,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        isDirtyRef.current = false;
        setIsDirty(false);
        onClose?.();
        if (onSaved) {
          onSaved();
        } else {
          navigate(`/post/${postId}`);
        }
      } else {
        setErrorMsg(data.message || '수정에 실패했습니다.');
      }
    } catch {
      setErrorMsg('서버와 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  // ── 저장 버튼 ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMsg('');
    const plainContent = contentRef.current.replace(/<[^>]*>?/gm, '').trim();
    if (!metadata.title.trim() || !plainContent) {
      setErrorMsg('제목과 본문 내용은 필수 항목입니다.');
      return;
    }
    const { words, replaceMap: rm } = await checkBadWords(metadata.title, plainContent);
    if (words.length > 0) {
      setDetectedWords(words);
      setReplaceMap(rm);
      setBadWordModal(true);
      return;
    }
    await doSubmit();
  };

  // ── 비속어 대체 후 저장 ───────────────────────────────────────
  const handleBadWordReplace = async () => {
    setBadWordModal(false);
    let nt = metadata.title;
    let nc = contentRef.current;
    for (const [bad, rep] of Object.entries(replaceMap)) {
      const regex = new RegExp(bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      nt = nt.replace(regex, rep);
      nc = nc.replace(regex, rep);
    }
    setMetadata(p => ({ ...p, title: nt }));
    contentRef.current = nc;
    if (quillRef.current) quillRef.current.getEditor().root.innerHTML = nc;
    await doSubmit();
  };

  // ── 닫기 처리 ─────────────────────────────────────────────────
  const handleClose = () => {
    if (isDirty) { setLeaveConfirm(true); return; }
    doClose();
  };

  const doClose = () => {
    setLeaveConfirm(false);
    setIsDirty(false);
    isDirtyRef.current = false;
    onClose?.();
  };

  const handleTagsChange = (_, newValue) => {
    const cleaned = newValue.map(v => (typeof v === 'string' ? v.trim() : v)).filter(Boolean);
    setMetadata(prev => ({ ...prev, tags: cleaned.slice(0, 5) }));
  };

  // ── Quill 설정 ────────────────────────────────────────────────
  const quillModules = useMemo(() => ({
    syntax: { highlight: (text) => hljs.highlightAuto(text).value },
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
    .ql-editor blockquote { border-left-color: ${tk.accent} !important; color: ${tk.textSecondary} !important; }
  ` : '';

  // ── 렌더 ──────────────────────────────────────────────────────
  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <style>{QUILL_CODE_CSS}</style>
      {quillDarkCss && <style>{quillDarkCss}</style>}

      <Dialog
        open={open}
        maxWidth={false}
        onClose={handleClose}
        disableScrollLock
        PaperProps={{
          sx: {
            width: { xs: '98vw', md: 1100 }, maxWidth: '98vw',
            borderRadius: 2.5, backgroundColor: tk.paper,
            border: `1px solid ${tk.border}`, overflow: 'hidden',
          },
        }}
      >
        {/* 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, borderBottom: `1px solid ${tk.border}`, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
            <Box sx={{ width: 30, height: 30, borderRadius: 1, backgroundColor: tk.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: tk.paper, fontWeight: 900, fontSize: '0.75rem' }}>{'<>'}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 900, fontSize: '1rem', color: tk.textPrimary, letterSpacing: '-0.02em' }}>게시물 수정</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {isDirty && (
              <Typography sx={{ fontSize: '0.72rem', color: tk.textHint, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box component="span" sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
                미저장 변경사항
              </Typography>
            )}
            <IconButton onClick={handleClose} size="small" sx={{ color: tk.textSecondary }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>

        {/* 바디 */}
        <Box sx={{ display: 'flex', height: { xs: 'auto', md: 700 }, maxHeight: '82vh', overflow: 'hidden' }}>

          {/* 좌측: 에디터 영역 */}
          <Box sx={{
            flex: 1, overflowY: 'auto', p: 3,
            display: 'flex', flexDirection: 'column', gap: 2.5,
            borderRight: `1px solid ${tk.border}`,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { backgroundColor: tk.border, borderRadius: 2 },
          }}>
            {initialLoading ? (
              <Stack spacing={2.5}>
                {[1, 2, 3, 4].map(i => (
                  <Box key={i} sx={{ backgroundColor: tk.paper, border: `1px solid ${tk.border}`, borderRadius: 2, p: 3 }}>
                    <Skeleton width="30%" height={20} sx={{ mb: 2, bgcolor: tk.border }} />
                    <Skeleton variant="rectangular" height={i === 3 ? 300 : 44} sx={{ borderRadius: 1, bgcolor: tk.border }} />
                  </Box>
                ))}
              </Stack>
            ) : (
              <>
                {/* 카테고리 */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                    <BugReport sx={{ fontSize: 16, color: tk.accent }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: tk.textPrimary }}>카테고리 <Box component="span" sx={{ color: '#EF4444' }}>*</Box></Typography>
                  </Box>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {CATEGORIES.map(cat => {
                      const isSel = metadata.category === cat.value;
                      const catBg = mode === 'dark' ? cat.darkBg : cat.bg;
                      return (
                        <Box key={cat.value} onClick={() => { setMetadata(p => ({ ...p, category: cat.value })); markDirty(); }}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.7, px: 1.5, py: 0.7, borderRadius: 1.5, border: `1.5px solid ${isSel ? cat.color : tk.border}`, backgroundColor: isSel ? catBg : 'transparent', color: isSel ? cat.color : tk.textSecondary, cursor: 'pointer', fontWeight: isSel ? 700 : 500, fontSize: '0.8rem', fontFamily: '"Plus Jakarta Sans","Noto Sans KR",sans-serif', transition: 'all 0.15s', userSelect: 'none', '&:hover': { borderColor: cat.color, backgroundColor: catBg, color: cat.color } }}>
                          <Box sx={{ display: 'flex', color: 'inherit' }}>{cat.icon}</Box>
                          {cat.label}
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>

                {/* 제목 */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                    <TitleOutlined sx={{ fontSize: 16, color: tk.accent }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: tk.textPrimary }}>제목 <Box component="span" sx={{ color: '#EF4444' }}>*</Box></Typography>
                  </Box>
                  <TextField fullWidth size="small" value={metadata.title}
                    onChange={e => { setMetadata(p => ({ ...p, title: e.target.value })); markDirty(); }}
                    placeholder="제목을 입력하세요"
                    inputProps={{ maxLength: 150 }}
                    InputProps={{
                      sx: { fontSize: '0.88rem' },
                      endAdornment: <InputAdornment position="end"><Typography sx={{ fontSize: '0.7rem', color: tk.textHint }}>{metadata.title.length}/150</Typography></InputAdornment>,
                    }}
                  />
                </Box>

                {/* 본문 */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                    <ArticleOutlined sx={{ fontSize: 16, color: tk.accent }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: tk.textPrimary }}>본문 <Box component="span" sx={{ color: '#EF4444' }}>*</Box></Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: tk.textHint, ml: 0.5 }}>[&lt;/&gt;] 버튼으로 코드 블록 삽입 (문법 색상 자동 적용)</Typography>
                  </Box>
                  <Box sx={{
                    '.ql-toolbar': { borderTopLeftRadius: 8, borderTopRightRadius: 8 },
                    '.ql-container': { borderBottomLeftRadius: 8, borderBottomRightRadius: 8, minHeight: 300, fontSize: '0.9rem' },
                    '.ql-editor': { minHeight: 300, lineHeight: 1.8, padding: '14px' },
                    '.ql-editor blockquote': { borderLeft: `3px solid ${tk.accent}`, paddingLeft: 14, color: tk.textSecondary, margin: '8px 0' },
                    '.ql-editor img': { maxWidth: '100%', height: 'auto', borderRadius: 6, display: 'block', cursor: 'pointer' },
                  }}>
                    <ReactQuill
                      ref={quillRef}
                      theme="snow"
                      defaultValue={contentRef.current}
                      onChange={(val) => { contentRef.current = val; markDirty(); }}
                      modules={quillModules}
                      preserveWhitespace
                      placeholder="내용을 입력하세요..."
                    />
                  </Box>
                </Box>

                {/* 태그 */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1.2 }}>
                    <LocalOffer sx={{ fontSize: 16, color: tk.accent }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: tk.textPrimary }}>태그</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: tk.textHint, ml: 0.5 }}>최대 5개</Typography>
                  </Box>
                  <Autocomplete
                    freeSolo multiple size="small" onChange={handleTagsChange}
                    options={TECH_STACK_OPTIONS} value={metadata.tags}
                    getOptionDisabled={() => metadata.tags.length >= 5}
                    onInputChange={(_, val) => {
                      if (val.endsWith(',') || val.endsWith(' ')) {
                        const t = val.slice(0, -1).trim();
                        if (t && !metadata.tags.includes(t) && metadata.tags.length < 5) handleTagsChange(null, [...metadata.tags, t]);
                      }
                    }}
                    PaperComponent={({ children, ...props }) => (
                      <Box {...props} sx={{ backgroundColor: tk.paper, border: `1px solid ${tk.border}`, borderRadius: 1.5, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', mt: 0.5 }}>{children}</Box>
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" {...props} sx={{ fontSize: '0.84rem', color: tk.textPrimary, px: 2, py: 0.8, cursor: 'pointer', '&:hover': { backgroundColor: tk.hover } }}>{option}</Box>
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip key={index} label={option} size="small"
                          sx={{ backgroundColor: tk.accentBg, color: tk.accent, border: `1px solid ${tk.border}`, borderRadius: 1, fontWeight: 700, fontSize: '0.72rem' }}
                          {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params}
                        placeholder={metadata.tags.length >= 5 ? '태그는 최대 5개입니다' : '기술 스택 입력 (예: React, TypeScript)'}
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: <><InputAdornment position="start" sx={{ pl: 0.5, color: tk.textHint }}><Search fontSize="small" /></InputAdornment>{params.InputProps.startAdornment}</>,
                        }}
                      />
                    )}
                  />
                  <Box sx={{ display: 'flex', gap: 0.7, flexWrap: 'wrap', mt: 1.2 }}>
                    {TECH_STACK_OPTIONS.slice(0, 8).map(opt => !metadata.tags.includes(opt) && (
                      <Box key={opt} onClick={() => { if (metadata.tags.length < 5) { handleTagsChange(null, [...metadata.tags, opt]); markDirty(); } }}
                        sx={{ px: 1, py: 0.25, borderRadius: 1, border: `1px solid ${tk.border}`, backgroundColor: tk.hover, color: tk.textSecondary, fontSize: '0.7rem', fontWeight: 600, cursor: metadata.tags.length >= 5 ? 'not-allowed' : 'pointer', opacity: metadata.tags.length >= 5 ? 0.4 : 1, transition: 'all 0.15s', '&:hover': metadata.tags.length < 5 ? { borderColor: tk.accent, color: tk.accent, backgroundColor: tk.accentBg } : {} }}>
                        + {opt}
                      </Box>
                    ))}
                  </Box>
                </Box>

                <Collapse in={!!errorMsg}>
                  <Alert severity="error" icon={<WarningAmberOutlined fontSize="small" />} onClose={() => setErrorMsg('')} sx={{ borderRadius: 2, fontSize: '0.82rem', fontWeight: 600 }}>{errorMsg}</Alert>
                </Collapse>
              </>
            )}
          </Box>

          {/* 우측: 설정 패널 */}
          <Box sx={{ width: 300, flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* 탭 */}
            <Box sx={{ display: 'flex', borderBottom: `1px solid ${tk.border}`, flexShrink: 0 }}>
              {[{ key: 'settings', label: '설정' }, { key: 'advanced', label: '고급 설정' }].map(tab => (
                <Box key={tab.key} onClick={() => setActiveTab(tab.key)}
                  sx={{ flex: 1, py: 1.2, textAlign: 'center', fontSize: '0.8rem', fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? tk.textPrimary : tk.textSecondary, borderBottom: `2px solid ${activeTab === tab.key ? tk.accent : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {tab.label}
                </Box>
              ))}
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 2, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: tk.border, borderRadius: 2 } }}>
              {activeTab === 'settings' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  {/* 위치 */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1 }}>
                      <LocationOn sx={{ fontSize: 15, color: tk.accent }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: tk.textPrimary }}>위치 추가</Typography>
                    </Box>
                    <LocationAutocomplete value={location} onChange={(v) => { setLocation(v); markDirty(); }} tk={tk} />
                  </Box>

                  {/* 첨부 사진 */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7, mb: 1 }}>
                      <Image sx={{ fontSize: 15, color: tk.accent }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: tk.textPrimary }}>첨부 사진</Typography>
                      {imageFiles.length > 0 && (
                        <Typography sx={{ fontSize: '0.72rem', color: tk.textHint, ml: 'auto' }}>{imageFiles.length}장</Typography>
                      )}
                    </Box>

                    {imageFiles.length > 0 ? (
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {imageFiles.map((img, i) => (
                          <Tooltip key={i} title="클릭하여 재편집" placement="top">
                            <Box onClick={() => handleReEditImage(i)}
                              sx={{ position: 'relative', width: 70, height: 70, borderRadius: 1.5, overflow: 'hidden', border: `1px solid ${tk.border}`, cursor: 'pointer', '&:hover .edit-overlay': { opacity: 1 }, transition: 'box-shadow 0.15s', '&:hover': { boxShadow: `0 0 0 2px ${tk.accent}` } }}>
                              <img src={img.previewUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <Box className="edit-overlay" sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.15s' }}>
                                <Typography sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 800 }}>편집</Typography>
                              </Box>
                              <IconButton size="small"
                                onClick={e => { e.stopPropagation(); removeImageFromEditor(img); setImageFiles(p => { const n = [...p]; n.splice(i, 1); return n; }); }}
                                sx={{ position: 'absolute', top: 2, right: 2, p: 0.3, backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 0.5, '&:hover': { backgroundColor: 'rgba(239,68,68,0.85)' } }}>
                                <Close sx={{ fontSize: 10 }} />
                              </IconButton>
                            </Box>
                          </Tooltip>
                        ))}
                        <Box component="label"
                          sx={{ width: 70, height: 70, borderRadius: 1.5, border: `1.5px dashed ${tk.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: tk.textHint, gap: 0.3, transition: 'all 0.15s', '&:hover': { borderColor: tk.accent, color: tk.accent, backgroundColor: tk.accentBg } }}>
                          <Add sx={{ fontSize: 18 }} />
                          <Typography sx={{ fontSize: '0.62rem', fontWeight: 700 }}>추가</Typography>
                          <input type="file" accept="image/*" multiple hidden onChange={e => {
                            const files = Array.from(e.target.files);
                            setPendingFiles(files.map(f => ({ originalFile: f, file: f, previewUrl: URL.createObjectURL(f) })));
                            setEditingImageIdx(null);
                            setPhotoEditOpen(true);
                          }} />
                        </Box>
                      </Box>
                    ) : (
                      <Box component="label"
                        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 3, borderRadius: 1.5, border: `1.5px dashed ${tk.border}`, cursor: 'pointer', color: tk.textHint, gap: 0.5, transition: 'all 0.15s', '&:hover': { borderColor: tk.accent, color: tk.accent, backgroundColor: tk.accentBg } }}>
                        <Image sx={{ fontSize: 24 }} />
                        <Typography sx={{ fontSize: '0.75rem', fontWeight: 600 }}>사진 추가</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: tk.textHint }}>클릭하거나 에디터에 붙여넣기</Typography>
                        <input type="file" accept="image/*" multiple hidden onChange={e => {
                          const files = Array.from(e.target.files);
                          setPendingFiles(files.map(f => ({ originalFile: f, file: f, previewUrl: URL.createObjectURL(f) })));
                          setEditingImageIdx(null);
                          setPhotoEditOpen(true);
                        }} />
                      </Box>
                    )}
                  </Box>
                </Box>
              )}

              {activeTab === 'advanced' && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {/* 좋아요 숨기기 */}
                  <Box sx={{ py: 2.5, borderBottom: `1px solid ${tk.border}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: tk.textPrimary }}>좋아요 및 조회수 숨기기</Typography>
                      <Box onClick={() => { setHideLikes(p => !p); markDirty(); }}
                        sx={{ width: 38, height: 22, borderRadius: 11, backgroundColor: hideLikes ? tk.accent : tk.border, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, ml: 2 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 3, left: hideLikes ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: tk.textSecondary, lineHeight: 1.6 }}>이 게시물의 총 좋아요 및 조회수는 회원님만 볼 수 있습니다.</Typography>
                  </Box>
                  {/* 댓글 기능 해제 */}
                  <Box sx={{ py: 2.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.8 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.84rem', color: tk.textPrimary }}>댓글 기능 해제</Typography>
                      <Box onClick={() => { setDisableComments(p => !p); markDirty(); }}
                        sx={{ width: 38, height: 22, borderRadius: 11, backgroundColor: disableComments ? tk.accent : tk.border, position: 'relative', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0, ml: 2 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: 3, left: disableComments ? 19 : 3, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: tk.textSecondary, lineHeight: 1.6 }}>나중에 게시물 상단의 메뉴(···)에서 이 설정을 변경할 수 있습니다.</Typography>
                  </Box>
                </Box>
              )}
            </Box>

            {/* 저장 버튼 */}
            <Box sx={{ p: 2, borderTop: `1px solid ${tk.border}`, flexShrink: 0, display: 'flex', gap: 1 }}>
              <Button variant="outlined" onClick={handleClose}
                sx={{ color: tk.textSecondary, borderColor: tk.border, fontSize: '0.83rem', flexShrink: 0, '&:hover': { borderColor: tk.textSecondary, backgroundColor: tk.hover } }}>
                취소
              </Button>
              <Button fullWidth variant="contained" disabled={loading || initialLoading} onClick={handleSubmit}
                endIcon={!loading && <ArrowForward sx={{ fontSize: 15 }} />}
                sx={{ backgroundColor: tk.textPrimary, color: tk.paper, fontSize: '0.88rem', py: 1.3, boxShadow: 'none', '&:hover': { backgroundColor: tk.accent, boxShadow: '0 4px 14px rgba(37,99,235,0.25)' }, '&.Mui-disabled': { backgroundColor: tk.border, color: tk.textHint }, transition: 'all 0.2s' }}>
                {loading ? <><CircularProgress size={14} sx={{ color: tk.paper, mr: 1 }} />저장 중...</> : '수정 저장하기'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Dialog>

      {/* PhotoEditModal */}
      {photoEditOpen && pendingFiles.length > 0 && (
        <PhotoEditModal
          open={photoEditOpen}
          images={pendingFiles}
          onClose={() => { setPhotoEditOpen(false); setPendingFiles([]); setEditingImageIdx(null); }}
          onDone={handlePhotoDone}
          tk={tk}
        />
      )}

      {/* 닫기 확인 */}
      <LeaveConfirmDialog open={leaveConfirm} onConfirm={doClose} onCancel={() => setLeaveConfirm(false)} tk={tk} />

      {/* 비속어 모달 */}
      <BadWordModal
        open={badWordModal}
        badWords={detectedWords}
        replaceMap={replaceMap}
        onConfirm={async () => { setBadWordModal(false); await doSubmit(); }}
        onReplace={handleBadWordReplace}
        onCancel={() => setBadWordModal(false)}
        tk={tk}
      />
    </ThemeProvider>
  );
}