import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box, Avatar, Button, Chip, Divider, IconButton, Stack,
  Typography, CircularProgress, Skeleton, Tooltip,
  Modal, Backdrop, Fade,
  Radio, RadioGroup, FormControlLabel, TextField, Snackbar, Alert,
  Menu, MenuItem, LinearProgress,
} from '@mui/material';
import {
  ArrowBack, FavoriteBorderOutlined, Favorite,
  ChatBubbleOutline, BookmarkBorderOutlined, Bookmark,
  ArrowUpward, ContentCopy, Check, FlagOutlined, ShareOutlined,
  ReplyOutlined, VisibilityOutlined, Close,
  MoreHoriz, Edit, Delete, SmartToyOutlined, AutoAwesome,
  RefreshOutlined, PlayArrow,
  LocationOn, ChevronLeft, ChevronRight, VolumeOff, VolumeUp
} from '@mui/icons-material';
import { useColorMode } from '../App';
import EditModal from './EditModal';
import ReactDOM from 'react-dom';

const API = 'http://localhost:3010';

const TAG_META = {
  'Bug Fix': { color: '#DC2626', bg: '#FEF2F2', darkBg: '#2D1515' },
  'React': { color: '#2563EB', bg: '#EFF6FF', darkBg: '#172033' },
  'TypeScript': { color: '#7C3AED', bg: '#F5F3FF', darkBg: '#1E1533' },
  'Architecture': { color: '#D97706', bg: '#FFFBEB', darkBg: '#2A1F0A' },
  'Tip': { color: '#059669', bg: '#ECFDF5', darkBg: '#0D2318' },
  'DevOps': { color: '#0891B2', bg: '#ECFEFF', darkBg: '#0D2228' },
  'General': { color: '#64748B', bg: '#F1F5F9', darkBg: '#1E2433' },
};

const REPORT_REASONS = [
  { value: 'SPAM', label: '스팸 / 광고성 게시물' },
  { value: 'HATE', label: '혐오 발언 / 차별' },
  { value: 'ADULT', label: '성인 / 음란물' },
  { value: 'FALSE', label: '허위 정보' },
  { value: 'OTHER', label: '기타' },
];
const COMMENT_REPORT_REASONS = [
  { value: 'SPAM', label: '스팸 / 광고성 댓글' },
  { value: 'HATE', label: '혐오 발언 / 차별' },
  { value: 'ADULT', label: '성인 / 음란물' },
  { value: 'FALSE', label: '허위 정보' },
  { value: 'OTHER', label: '기타' },
];

const resolveImageSrc = (src) =>
  src ? src.replace(/src="\/uploads/g, `src="${API}/uploads`) : '';

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const tagMeta = (tag, mode) => {
  const m = TAG_META[tag] || TAG_META['General'];
  return { ...m, bg: mode === 'dark' ? m.darkBg : m.bg };
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (diff < 60000) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days < 7) return `${days}일 전`;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const resolveAvatarSrc = (src) => {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  return `${API}${src}`;
};

// ──────────────────────────────────────────
//  colors 팩토리
// ──────────────────────────────────────────
const makeColors = (mode) => ({
  mode,
  bg: mode === 'dark' ? '#0F1117' : '#F8FAFC',
  paper: mode === 'dark' ? '#1A1D27' : '#FFFFFF',
  border: mode === 'dark' ? '#2D3148' : '#E2E8F0',
  borderFocus: mode === 'dark' ? '#4B5280' : '#CBD5E1',
  textPrimary: mode === 'dark' ? '#F1F5F9' : '#0F172A',
  textMuted: mode === 'dark' ? '#94A3B8' : '#64748B',
  textHint: mode === 'dark' ? '#64748B' : '#94A3B8',
  inputBg: mode === 'dark' ? '#22253A' : '#F1F5F9',
  hover: mode === 'dark' ? '#22253A' : '#F8FAFC',
  codeBg: mode === 'dark' ? '#0D1117' : '#0F172A',
  codeHeader: mode === 'dark' ? '#161B22' : '#1E293B',
  accent: mode === 'dark' ? '#7B75E8' : '#2563EB',
  accentBg: mode === 'dark' ? '#2D2B4E' : '#EFF6FF',
});

// ──────────────────────────────────────────
//  구문 강조 토크나이저 (개선)
// ──────────────────────────────────────────
const KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'class', 'new', 'this', 'typeof', 'instanceof',
  'import', 'export', 'default', 'from', 'async', 'await', 'try', 'catch', 'finally',
  'throw', 'void', 'null', 'undefined', 'true', 'false', 'in', 'of', 'extends',
  'super', 'static', 'get', 'set', 'yield', 'delete',
  'public', 'private', 'protected', 'int', 'String', 'boolean', 'def', 'print',
  'lambda', 'with', 'pass', 'elif', 'and', 'or', 'not', 'is', 'None', 'True', 'False',
  'interface', 'type', 'enum', 'namespace', 'abstract', 'readonly', 'implements',
  'struct', 'fn', 'let', 'mut', 'use', 'mod', 'impl', 'trait', 'where', 'self', 'Self',
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'ON', 'GROUP', 'BY',
  'ORDER', 'HAVING', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
  'TABLE', 'INDEX', 'DROP', 'ALTER', 'AND', 'OR', 'NOT', 'IN', 'LIKE', 'IS', 'NULL',
  'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
]);

const TYPE_KEYWORDS = new Set([
  'int', 'float', 'double', 'string', 'boolean', 'bool', 'void', 'char', 'byte',
  'short', 'long', 'String', 'Number', 'Array', 'Object', 'Promise', 'any', 'never',
  'unknown', 'null', 'undefined',
]);

function tokenizeLine(line) {
  // 전체 주석 라인
  if (/^\s*(\/\/|#|--\s*|\/\*)/.test(line)) return [{ type: 'comment', text: line }];

  const tokens = [];
  let i = 0;
  while (i < line.length) {
    // 인라인 주석
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', text: line.slice(i) });
      break;
    }
    if (line[i] === '#') {
      tokens.push({ type: 'comment', text: line.slice(i) });
      break;
    }

    // 문자열 " ' `
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const q = line[i];
      let j = i + 1;
      while (j < line.length && line[j] !== q) {
        if (line[j] === '\\') j++;
        j++;
      }
      tokens.push({ type: 'string', text: line.slice(i, j + 1) });
      i = j + 1;
      continue;
    }

    // 숫자 (0x hex, 소수점 포함)
    if (/[0-9]/.test(line[i]) && (i === 0 || /\W/.test(line[i - 1]))) {
      let j = i;
      while (j < line.length && /[0-9._xXa-fA-FbBoO]/.test(line[j])) j++;
      tokens.push({ type: 'number', text: line.slice(i, j) });
      i = j;
      continue;
    }

    // 식별자 / 키워드
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i;
      while (j < line.length && /[\w$]/.test(line[j])) j++;
      const word = line.slice(i, j);
      const isFunc = j < line.length && line[j] === '(';
      let type = 'default';
      if (KEYWORDS.has(word)) type = 'keyword';
      else if (TYPE_KEYWORDS.has(word)) type = 'type';
      else if (isFunc) type = 'function';
      else if (/^[A-Z]/.test(word)) type = 'class';  // PascalCase → 클래스/컴포넌트
      tokens.push({ type, text: word });
      i = j;
      continue;
    }

    // 연산자
    if (/[=!<>+\-*/&|^~%?:;,.]/.test(line[i])) {
      tokens.push({ type: 'operator', text: line[i] });
      i++;
      continue;
    }

    // 괄호 / 브라켓
    if (/[()[\]{}]/.test(line[i])) {
      tokens.push({ type: 'bracket', text: line[i] });
      i++;
      continue;
    }

    tokens.push({ type: 'default', text: line[i] });
    i++;
  }
  return tokens;
}

// VS Code Dark+ 테마 기반 컬러
const SYNTAX_COLORS = {
  keyword: '#569CD6',   // 파란 계열 (const, let, if …)
  type: '#4EC9B0',   // 청록 (int, string …)
  string: '#CE9178',   // 주황/살구 (문자열)
  comment: '#6A9955',   // 초록 (주석)
  number: '#B5CEA8',   // 연두 (숫자)
  operator: '#D4D4D4',   // 밝은 회 (=, +, …)
  function: '#DCDCAA',   // 노란 (함수명)
  class: '#4EC9B0',   // 청록 (클래스/컴포넌트)
  bracket: '#FFD700',   // 금색 괄호
  variable: '#9CDCFE',   // 연한 파랑 (변수)
  default: '#D4D4D4',   // 기본 밝은 회
};

function SyntaxHighlightedCode({ code }) {
  const lines = code.split('\n');
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",monospace',
        fontSize: '0.82rem',
        lineHeight: 1.75,
        color: SYNTAX_COLORS.default,
        whiteSpace: 'pre',
        tabSize: 2,
        overflowX: 'auto',
      }}
    >
      {lines.map((line, li) => {
        const tokens = tokenizeLine(line);
        return (
          <Box key={li} component="span" sx={{ display: 'block' }}>
            {tokens.length > 0
              ? tokens.map((tok, ti) => (
                <Box
                  key={ti}
                  component="span"
                  sx={{ color: SYNTAX_COLORS[tok.type] || SYNTAX_COLORS.default }}
                >
                  {tok.text}
                </Box>
              ))
              : '\u00A0' /* 빈 줄 유지 */
            }
          </Box>
        );
      })}
    </Box>
  );
}

// ──────────────────────────────────────────
//  더블클릭 하트 오버레이
// ──────────────────────────────────────────
const HeartOverlay = ({ trigger }) => {
  const [hearts, setHearts] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const id = Date.now();
    setHearts(prev => [...prev, id]);
    const timer = setTimeout(() => setHearts(prev => prev.filter(h => h !== id)), 900);
    return () => clearTimeout(timer);
  }, [trigger]);
  if (!hearts.length) return null;
  return (
    <>
      {hearts.map(id => (
        <Box key={id} sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 10,
          animation: 'heartBurst 0.85s ease forwards',
          '@keyframes heartBurst': {
            '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.2)' },
            '25%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.3)' },
            '60%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.1)' },
            '100%': { opacity: 0, transform: 'translate(-50%, -60%) scale(0.9)' },
          },
        }}>
          <Favorite sx={{ fontSize: 80, color: '#EF4444', filter: 'drop-shadow(0 4px 12px rgba(239,68,68,0.5))' }} />
        </Box>
      ))}
    </>
  );
};

// ──────────────────────────────────────────
//  CopyButton
// ──────────────────────────────────────────
const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code); }
    catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Tooltip title={copied ? '복사됨!' : '코드 복사'} placement="top">
      <IconButton size="small" onClick={handleCopy}
        sx={{ color: copied ? '#28C840' : '#64748B', backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 1, width: 28, height: 28, transition: 'all 0.2s', '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' } }}>
        {copied ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
      </IconButton>
    </Tooltip>
  );
};

// ──────────────────────────────────────────
//  CodeBlock (구문 강조 포함)
// ──────────────────────────────────────────
const CodeBlock = ({ code, lang = 'code' }) => (
  <Box sx={{ my: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #1E293B', boxShadow: '0 4px 24px rgba(15,23,42,0.35)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#161B22', px: 2, py: 1, borderBottom: '1px solid #2D3748' }}>
      <Box sx={{ display: 'flex', gap: 0.6 }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
          <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#6B7280', fontFamily: '"JetBrains Mono",monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {lang}
        </Typography>
        <CopyButton code={code} />
      </Box>
    </Box>
    <Box sx={{ backgroundColor: '#0D1117', px: 2.5, py: 2.5, position: 'relative', overflowX: 'auto', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #569CD6 0%, #4EC9B0 50%, #DCDCAA 100%)' } }}>
      <SyntaxHighlightedCode code={code} />
    </Box>
  </Box>
);

// ──────────────────────────────────────────
//  InlineCodeCopyWrapper (본문 <pre> 블록)
// ──────────────────────────────────────────
const InlineCodeCopyWrapper = ({ children, codeText }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(codeText); } catch { }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Box sx={{ position: 'relative', my: 2, '&:hover .copy-btn': { opacity: 1 } }}>
      {children}
      <Tooltip title={copied ? '복사됨!' : '복사'} placement="top">
        <IconButton className="copy-btn" size="small" onClick={handleCopy}
          sx={{ position: 'absolute', top: 10, right: 10, opacity: 0, transition: 'opacity 0.2s', color: copied ? '#28C840' : '#94A3B8', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', width: 26, height: 26, '&:hover': { backgroundColor: 'rgba(37,99,235,0.3)', color: '#fff' } }}>
          {copied ? <Check sx={{ fontSize: 13 }} /> : <ContentCopy sx={{ fontSize: 13 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

const ImageGallery = ({ images, colors }) => {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images?.length) return null;

  const prev = (e) => { e.stopPropagation(); setActive(i => (i - 1 + images.length) % images.length); };
  const next = (e) => { e.stopPropagation(); setActive(i => (i + 1) % images.length); };

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Box
          onClick={() => setLightbox(true)}
          sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border}`, backgroundColor: colors.codeBg, maxHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in', position: 'relative' }}
        >
          <Box component="img" src={resolveImageSrc(images[active])} alt=""
            sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          {images.length > 1 && (
            <>
              <IconButton size="small" onClick={prev} sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' }, width: 32, height: 32 }}>
                <ChevronLeft sx={{ fontSize: 20 }} />
              </IconButton>
              <IconButton size="small" onClick={next} sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' }, width: 32, height: 32 }}>
                <ChevronRight sx={{ fontSize: 20 }} />
              </IconButton>
              <Box sx={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, px: 1, py: 0.3, borderRadius: 2 }}>
                {active + 1} / {images.length}
              </Box>
            </>
          )}
        </Box>
        {images.length > 1 && (
          <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
            {images.map((img, i) => (
              <Box key={i} onClick={() => setActive(i)}
                sx={{ width: 64, height: 64, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', border: active === i ? `2px solid ${colors.accent}` : `2px solid ${colors.border}`, cursor: 'pointer' }}>
                <Box component="img" src={resolveImageSrc(img)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* 라이트박스 모달 */}
      <Modal open={lightbox} onClose={() => setLightbox(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.92)' } } }}>
        <Box onClick={() => setLightbox(false)} sx={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', outline: 'none' }}>
          <Box component="img" src={resolveImageSrc(images[active])} onClick={e => e.stopPropagation()}
            sx={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 1, display: 'block' }} />
          {images.length > 1 && (
            <>
              <IconButton onClick={e => { e.stopPropagation(); setActive(i => (i - 1 + images.length) % images.length); }}
                sx={{ position: 'absolute', left: -52, top: '50%', transform: 'translateY(-50%)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.28)' } }}>
                <ChevronLeft />
              </IconButton>
              <IconButton onClick={e => { e.stopPropagation(); setActive(i => (i + 1) % images.length); }}
                sx={{ position: 'absolute', right: -52, top: '50%', transform: 'translateY(-50%)', color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.28)' } }}>
                <ChevronRight />
              </IconButton>
              <Box sx={{ position: 'absolute', bottom: -28, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontSize: '0.8rem', fontWeight: 600 }}>
                {active + 1} / {images.length}
              </Box>
            </>
          )}
          <IconButton onClick={() => setLightbox(false)} sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', backgroundColor: 'rgba(0,0,0,0.45)' }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Modal>
    </>
  );
};

const VideoPlayer = ({ src, colors }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return;
        if (entry.isIntersecting) {
          videoRef.current.play().then(() => setPlaying(true)).catch(() => { });
        } else {
          videoRef.current.pause();
          setPlaying(false);
        }
      },
      { threshold: 0.1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play().then(() => setPlaying(true)).catch(() => { }); }
  };

  return (
    <Box ref={containerRef} sx={{ mb: 3 }}>
      <Box sx={{
        position: 'relative',
        width: '100%',
        borderRadius: 2,
        overflow: 'hidden',
        backgroundColor: '#000',
        aspectRatio: '9/16',
        cursor: 'pointer',
      }}>
        <video
          ref={videoRef}
          src={src}
          muted={muted}
          playsInline
          loop
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
        {!playing && (
          <Box onClick={toggle} sx={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(0,0,0,0.25)',
          }}>
            <Box sx={{
              width: 52, height: 52, borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Box sx={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '18px solid #0F172A', ml: '3px' }} />
            </Box>
          </Box>
        )}
        <Box
          onClick={e => { e.stopPropagation(); setMuted(m => { videoRef.current.muted = !m; return !m; }); }}
          sx={{
            position: 'absolute', bottom: 12, right: 12,
            backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%',
            width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {muted
            ? <VolumeOff sx={{ fontSize: 18, color: '#fff' }} />
            : <VolumeUp sx={{ fontSize: 18, color: '#fff' }} />
          }
        </Box>
      </Box>
    </Box>
  );
};

const ReportModal = ({ open, onClose, reportUrl, token, onSuccess, onDuplicate, colors, title = '신고하기', reasons = REPORT_REASONS }) => {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(reportUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason, detail }),
      });
      const data = await res.json();
      if (res.ok && data.success) { setReason(''); setDetail(''); onClose(); onSuccess(); }
      else { onClose(); onDuplicate(); }
    } catch { onClose(); }
    finally { setSubmitting(false); }
  };

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' } } }}>
      <Fade in={open}>
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '90vw', sm: 440 }, backgroundColor: colors.paper, borderRadius: 3, border: `1px solid ${colors.border}`, boxShadow: '0 20px 60px rgba(15,23,42,0.25)', overflow: 'hidden', outline: 'none' }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: colors.mode === 'dark' ? '#2D1515' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlagOutlined sx={{ fontSize: 17, color: '#DC2626' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>{title}</Typography>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: colors.textHint }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Box sx={{ px: 3, py: 3 }}>
            <Typography sx={{ fontSize: '0.82rem', color: colors.textMuted, mb: 2 }}>신고 사유를 선택해주세요.</Typography>
            <RadioGroup value={reason} onChange={e => setReason(e.target.value)}>
              {reasons.map(r => (
                <FormControlLabel key={r.value} value={r.value} label={r.label}
                  control={<Radio size="small" sx={{ color: colors.border, '&.Mui-checked': { color: colors.accent } }} />}
                  sx={{
                    mx: 0, px: 1.5, py: 0.8, borderRadius: 1.5, mb: 0.5,
                    border: reason === r.value ? `1px solid ${colors.accent}` : '1px solid transparent',
                    backgroundColor: reason === r.value ? colors.accentBg : 'transparent',
                    transition: 'all 0.15s',
                    '& .MuiFormControlLabel-label': { fontSize: '0.88rem', fontWeight: reason === r.value ? 600 : 400, color: colors.textPrimary },
                  }}
                />
              ))}
            </RadioGroup>
            {reason === 'OTHER' && (
              <TextField multiline rows={2} fullWidth placeholder="기타 사유를 입력해주세요"
                value={detail} onChange={e => setDetail(e.target.value)}
                sx={{ mt: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: 1.5, backgroundColor: colors.paper, color: colors.textPrimary, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: colors.accent } } }}
              />
            )}
            <Button fullWidth variant="contained" disabled={!reason || submitting} onClick={handleSubmit}
              sx={{ mt: 2.5, py: 1.1, borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.88rem', backgroundColor: '#DC2626', boxShadow: 'none', '&:hover': { backgroundColor: '#B91C1C' }, '&.Mui-disabled': { backgroundColor: colors.hover, color: colors.textHint } }}>
              {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : '신고 제출'}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

// ──────────────────────────────────────────
//  Skeleton Loader
// ──────────────────────────────────────────
const PostSkeleton = ({ colors }) => (
  <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3, backgroundColor: colors.border }} />
    <Skeleton width="60%" height={32} sx={{ mb: 1.5, backgroundColor: colors.border }} />
    <Skeleton width="40%" height={20} sx={{ mb: 3, backgroundColor: colors.border }} />
    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1.5, backgroundColor: colors.border }} />
  </Box>
);

// ──────────────────────────────────────────
//  본문 콘텐츠 스타일
// ──────────────────────────────────────────
const makeContentSx = (colors) => ({
  fontSize: '0.93rem', color: colors.textMuted, lineHeight: 1.85, mb: 1,
  '& img': { maxWidth: '100%', borderRadius: 1.5, my: 1.5, display: 'block' },
  '& p': { mb: 1.5, mt: 0, color: colors.textMuted },
  '& h1, & h2, & h3': { fontWeight: 800, color: colors.textPrimary, mb: 1, mt: 2 },
  '& ul, & ol': { pl: 2.5, mb: 1.5, color: colors.textMuted },
  '& li': { mb: 0.5 },
  '& a': { color: colors.accent, textDecoration: 'underline' },
  '& code': { fontFamily: '"JetBrains Mono",monospace', backgroundColor: colors.inputBg, color: '#CE9178', px: 0.8, py: 0.2, borderRadius: 0.5, fontSize: '0.85em' },
  '& pre': { backgroundColor: '#0D1117', color: '#D4D4D4', borderRadius: '10px', p: 0, fontSize: '0.82rem', fontFamily: '"JetBrains Mono",monospace', overflowX: 'auto', lineHeight: 1.75, border: '1px solid #1E293B', boxShadow: '0 4px 20px rgba(15,23,42,0.2)' },
  '& blockquote': { borderLeft: `3px solid ${colors.accent}`, pl: 2, my: 2, color: colors.textMuted, fontStyle: 'italic', backgroundColor: colors.inputBg, py: 1, borderRadius: '0 6px 6px 0' },
});

// ──────────────────────────────────────────
//  Quill 스타일
// ──────────────────────────────────────────
const makeQuillBoxSx = (colors) => ({
  border: `1px solid ${colors.border}`, borderRadius: 1.5, overflow: 'hidden', transition: 'border-color 0.2s',
  '&:focus-within': { borderColor: colors.accent },
  '.ql-toolbar': { backgroundColor: colors.inputBg, border: 'none', borderBottom: `1px solid ${colors.border}` },
  '.ql-container': { border: 'none', fontSize: '0.88rem', fontFamily: '"Plus Jakarta Sans","Noto Sans KR",sans-serif', minHeight: 100, backgroundColor: colors.paper, color: colors.textPrimary },
  '.ql-editor': { minHeight: 100, maxHeight: 300, overflowY: 'auto', padding: '12px 14px', lineHeight: 1.75, color: colors.textPrimary, '&.ql-blank::before': { color: colors.textHint, fontStyle: 'normal', fontSize: '0.88rem' } },
  '.ql-editor pre.ql-syntax': { backgroundColor: '#0D1117', color: '#D4D4D4', borderRadius: '6px', fontSize: '0.78rem', fontFamily: '"JetBrains Mono",monospace', padding: '12px 14px', border: '1px solid #1E293B' },
  '.ql-editor blockquote': { borderLeft: `3px solid ${colors.accent}`, paddingLeft: '12px', color: colors.textMuted },
  '.ql-snow .ql-stroke': { stroke: colors.textMuted },
  '.ql-snow .ql-fill': { fill: colors.textMuted },
  '.ql-snow.ql-toolbar button:hover .ql-stroke': { stroke: colors.accent },
  '.ql-snow.ql-toolbar button.ql-active .ql-stroke': { stroke: colors.accent },
  '.ql-picker-label': { color: colors.textMuted },
  '.ql-picker-options': { backgroundColor: `${colors.paper} !important`, border: `1px solid ${colors.border} !important` },
});

// ──────────────────────────────────────────
//  renderContentWithCopy — <pre> 블록에 구문강조 적용
// ──────────────────────────────────────────
const renderContentWithCopy = (html, colors, wrapperSx = null) => {
  if (!html) return null;
  const resolved = resolveImageSrc(html);
  const contentSx = wrapperSx ?? makeContentSx(colors);

  if (!resolved.includes('<pre')) {
    return <Box sx={contentSx} dangerouslySetInnerHTML={{ __html: resolved }} />;
  }

  const parts = resolved.split(/(<pre[\s\S]*?<\/pre>)/gi);
  return (
    <Box sx={contentSx}>
      {parts.map((part, i) => {
        const preMatch = part.match(/^<pre[^>]*>([\s\S]*?)<\/pre>$/i);
        if (preMatch) {
          const rawCode = preMatch[1]
            .replace(/<br\s*\/?>/gi, '\n')
            .replace(/<[^>]*>/g, '')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
          return (
            <Box key={i} sx={{ my: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #1E293B', boxShadow: '0 4px 20px rgba(15,23,42,0.25)' }}>
              {/* 헤더 */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#161B22', px: 2, py: 0.8, borderBottom: '1px solid #2D3748' }}>
                <Box sx={{ display: 'flex', gap: 0.6 }}>
                  {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
                    <Box key={c} sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c }} />
                  ))}
                </Box>
                <CopyButton code={rawCode} />
              </Box>
              {/* 구문 강조 코드 */}
              <Box sx={{ backgroundColor: '#0D1117', px: 2.5, py: 2, overflowX: 'auto' }}>
                <SyntaxHighlightedCode code={rawCode} />
              </Box>
            </Box>
          );
        }
        return <Box key={i} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </Box>
  );
};
const ProfileHoverCard = ({ nickname, token, anchorEl, colors, navigate, onMouseEnter, onMouseLeave }) => {
  const [data, setData] = useState(null);
  const [followStatus, setFollowStatus] = useState('NONE');
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!anchorEl || !nickname) { setData(null); return; }
    const rect = anchorEl.getBoundingClientRect();
    setPos({
      top: rect.bottom + window.scrollY + 8,
      left: Math.min(rect.left + window.scrollX, window.innerWidth - 320),
    });
    fetch(`${API}/user/profile/${nickname}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.success) { setData(d); setFollowStatus(d.user?.FOLLOW_STATUS || 'NONE'); } })
      .catch(() => { });
  }, [anchorEl, nickname, token]);

  if (!anchorEl || !data) return null;

  const handleFollow = async (e) => {
    e.stopPropagation();
    const prev = followStatus;
    setFollowStatus('OPTIMISTIC');
    try {
      const res = await fetch(`${API}/user/follow/${data.user.USER_ID}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const d = await res.json();
      if (d.success) setFollowStatus(d.status);
      else setFollowStatus(prev);
    } catch { setFollowStatus(prev); }
  };

  const latestPosts = (data.posts || []).slice(0, 3);
  const followBtnSx = followStatus === 'ACCEPTED'
    ? { backgroundColor: colors.paper, color: colors.textPrimary, border: `1px solid ${colors.border}` }
    : (followStatus === 'PENDING' || followStatus === 'OPTIMISTIC')
      ? { backgroundColor: colors.hover, color: colors.textMuted, border: `1px solid ${colors.border}` }
      : { backgroundColor: '#2563EB', color: '#fff', '&:hover': { backgroundColor: '#1D4ED8' } };
  const followLabel = followStatus === 'ACCEPTED' ? '팔로잉' : (followStatus === 'PENDING' || followStatus === 'OPTIMISTIC') ? '요청됨' : '팔로우';

  return ReactDOM.createPortal(
    <Box onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}
      sx={{
        position: 'absolute', top: pos.top, left: pos.left, width: 300, zIndex: 9999,
        backgroundColor: colors.paper, border: `1px solid ${colors.border}`,
        borderRadius: 2.5, boxShadow: '0 8px 40px rgba(15,23,42,0.14)', p: 2.5,
        animation: 'hoverFadeUp 0.15s ease both',
        '@keyframes hoverFadeUp': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer' }}
          onClick={() => navigate(`/user/${data.user.NICKNAME}`)}>
          <Avatar src={resolveAvatarSrc(data.user.AVATAR)}
            sx={{ width: 44, height: 44, backgroundColor: colors.textPrimary, fontWeight: 800 }}>
            {getInitial(data.user.NICKNAME)}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: colors.textPrimary }}>{data.user.NICKNAME}</Typography>
            {data.user.BIO_SHORT && (
              <Typography sx={{ fontSize: '0.72rem', color: colors.textHint }}>{data.user.BIO_SHORT}</Typography>
            )}
          </Box>
        </Box>
        {!data.isMe && (
          <Button size="small" onClick={handleFollow}
            sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', px: 1.5, py: 0.4, borderRadius: 1, ...followBtnSx }}>
            {followLabel}
          </Button>
        )}
      </Box>
      <Stack direction="row" spacing={2} sx={{ mb: 1.5 }}>
        {[
          { label: '게시물', value: data.posts?.length ?? 0 },
          { label: '팔로워', value: data.user.FOLLOWER_CNT ?? 0 },
          { label: '팔로잉', value: data.user.FOLLOWING_CNT ?? 0 },
        ].map(s => (
          <Box key={s.label} sx={{ textAlign: 'center' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: colors.textPrimary }}>{s.value}</Typography>
            <Typography sx={{ fontSize: '0.7rem', color: colors.textHint }}>{s.label}</Typography>
          </Box>
        ))}
      </Stack>
      {latestPosts.length > 0 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0.5 }}>
          {latestPosts.map(p => (
            <Box key={p.id} onClick={() => navigate(`/post/${p.id}`)}
              sx={{ aspectRatio: '1', borderRadius: 1, overflow: 'hidden', backgroundColor: colors.inputBg, cursor: 'pointer', '&:hover': { opacity: 0.8 }, transition: 'opacity 0.15s' }}>
              <Box component="img"
                src={p.images ? (p.images.startsWith('http') ? p.images : `${API}${p.images}`) : `${API}/uploads/post/defaultImg.png`}
                sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          ))}
        </Box>
      )}
    </Box>,
    document.body
  );
};
const AIAnswerSection = ({ postId, token, colors, postUpdatedAt, isMyPost }) => {
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [aiCreatedAt, setAiCreatedAt] = useState(null);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (!postId) return;
    fetch(`${API}/feed/${postId}/ai-answer`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        if (data.success && data.answer) { setAnswer(data.answer); setAiCreatedAt(data.updatedAt || data.createdAt); }
      }).catch(() => { });
  }, [postId, token]);

  const isStale = useMemo(() => {
    if (!answer || !postUpdatedAt || !aiCreatedAt) return false;
    return new Date(postUpdatedAt) > new Date(aiCreatedAt);
  }, [answer, postUpdatedAt, aiCreatedAt]);

  const requestAnswer = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(`${API}/feed/${postId}/ai-answer`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) { setAnswer(data.answer); setAiCreatedAt(new Date().toISOString()); setModalOpen(true); }
      else throw new Error(data.message);
    } catch { setError('AI 답변 생성 중 오류가 발생했습니다.'); }
    finally { setLoading(false); }
  };

  const commentBodySx = {
    fontSize: '0.82rem', color: colors.textMuted, lineHeight: 1.8,
    '& p': { mb: 0.8, mt: 0 }, '& strong': { fontWeight: 700, color: colors.textPrimary },
    '& h3': { fontWeight: 700, color: colors.textPrimary, fontSize: '0.88rem', mt: 1.5, mb: 0.6 },
    '& ul, & ol': { pl: 2, mb: 0.8 }, '& li': { mb: 0.3 },
    '& code': { fontFamily: '"JetBrains Mono",monospace', backgroundColor: colors.inputBg, color: '#CE9178', px: 0.6, py: 0.1, borderRadius: 0.5, fontSize: '0.78em' },
    '& pre': { backgroundColor: '#0D1117', color: '#D4D4D4', borderRadius: '6px', p: 1.5, fontSize: '0.76rem', fontFamily: '"JetBrains Mono",monospace', overflowX: 'auto', lineHeight: 1.7, my: 1, border: '1px solid #1E293B' },
  };

  // 타인: 버튼 없음, 답변 있을 때만 보기 버튼
  if (!isMyPost) {
    if (!answer) return null;
    return (
      <>
        <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ px: 2, py: 1.8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: colors.mode === 'dark' ? 'linear-gradient(135deg, rgba(86,156,214,0.15) 0%, rgba(78,201,176,0.08) 100%)' : 'linear-gradient(135deg, rgba(86,156,214,0.1) 0%, rgba(78,201,176,0.05) 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 28, height: 28, borderRadius: 1, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <SmartToyOutlined sx={{ fontSize: 15, color: '#fff' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: colors.textPrimary }}>AI 답변</Typography>
              <Chip label="Beta" size="small" sx={{ height: 14, fontSize: '0.58rem', fontWeight: 700, background: 'linear-gradient(135deg, #569CD6, #4EC9B0)', color: '#fff', px: 0.2 }} />
            </Box>
            <Button size="small" onClick={() => setModalOpen(true)}
              sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, px: 1.5, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', color: '#fff', boxShadow: 'none' }}>
              답변 보기
            </Button>
          </Box>
        </Box>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }}
          slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' } } }}>
          <Fade in={modalOpen}>
            <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: { xs: '92vw', sm: 640 }, maxHeight: '80vh', backgroundColor: colors.paper, borderRadius: 3, border: `1px solid ${colors.border}`, boxShadow: '0 24px 80px rgba(15,23,42,0.25)', display: 'flex', flexDirection: 'column', outline: 'none', overflow: 'hidden' }}>
              <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(86,156,214,0.12) 0%, rgba(78,201,176,0.06) 100%)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: 1.5, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SmartToyOutlined sx={{ fontSize: 16, color: '#fff' }} />
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>AI 답변</Typography>
                  <Chip label="Beta" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, background: 'linear-gradient(135deg, #569CD6, #4EC9B0)', color: '#fff' }} />
                </Box>
                <IconButton size="small" onClick={() => setModalOpen(false)} sx={{ color: colors.textHint }}>
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: colors.border, borderRadius: 2 } }}>
                {renderContentWithCopy(answer, colors, commentBodySx)}
              </Box>
            </Box>
          </Fade>
        </Modal>
      </>
    );
  }

  // 내 글
  return (
    <>
      <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 2, py: 1.8, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: colors.mode === 'dark' ? 'linear-gradient(135deg, rgba(86,156,214,0.15) 0%, rgba(78,201,176,0.08) 100%)' : 'linear-gradient(135deg, rgba(86,156,214,0.1) 0%, rgba(78,201,176,0.05) 100%)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: 1, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SmartToyOutlined sx={{ fontSize: 15, color: '#fff' }} />
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.82rem', color: colors.textPrimary }}>AI 답변</Typography>
            <Chip label="Beta" size="small" sx={{ height: 14, fontSize: '0.58rem', fontWeight: 700, background: 'linear-gradient(135deg, #569CD6, #4EC9B0)', color: '#fff', px: 0.2 }} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {answer && (
              <Button size="small" onClick={() => setModalOpen(true)}
                sx={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, px: 1.5, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', color: '#fff', boxShadow: 'none' }}>
                답변 보기
              </Button>
            )}
            {!answer && !loading && (
              <Button size="small" variant="contained" onClick={requestAnswer}
                sx={{ background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', color: '#fff', fontWeight: 700, textTransform: 'none', borderRadius: 1.5, px: 2, py: 0.6, boxShadow: 'none', fontSize: '0.78rem' }}>
                <AutoAwesome sx={{ fontSize: 13, mr: 0.6 }} />AI 답변 받기
              </Button>
            )}
            {loading && <CircularProgress size={16} sx={{ color: colors.accent }} />}
          </Box>
        </Box>

        {/* 수정 감지 배너 */}
        {isStale && !loading && (
          <Box sx={{ px: 2, py: 1.5, backgroundColor: colors.mode === 'dark' ? '#2A1F0A' : '#FFFBEB', border: `1px solid #FDE68A`, borderRadius: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#92400E', fontWeight: 600 }}>게시글이 수정되었습니다</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#B45309' }}>새로운 내용으로 AI 답변을 다시 받아보시겠어요?</Typography>
            </Box>
            <Button size="small" variant="contained" onClick={requestAnswer}
              sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', borderRadius: 1, px: 1.5, py: 0.5, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', boxShadow: 'none', color: '#fff', whiteSpace: 'nowrap', ml: 1 }}>
              다시 분석
            </Button>
          </Box>
        )}

        {error && (
          <Box sx={{ px: 2, py: 1.5 }}>
            <Alert severity="error" sx={{ borderRadius: 1.5, fontSize: '0.78rem' }}>{error}</Alert>
          </Box>
        )}
      </Box>

      {/* AI 답변 모달 */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(6px)' } } }}>
        <Fade in={modalOpen}>
          <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: { xs: '92vw', sm: 640 }, maxHeight: '80vh', backgroundColor: colors.paper, borderRadius: 3, border: `1px solid ${colors.border}`, boxShadow: '0 24px 80px rgba(15,23,42,0.25)', display: 'flex', flexDirection: 'column', outline: 'none', overflow: 'hidden' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, rgba(86,156,214,0.12) 0%, rgba(78,201,176,0.06) 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: 1.5, background: 'linear-gradient(135deg, #569CD6 0%, #4EC9B0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SmartToyOutlined sx={{ fontSize: 16, color: '#fff' }} />
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>AI 답변</Typography>
                <Chip label="Beta" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, background: 'linear-gradient(135deg, #569CD6, #4EC9B0)', color: '#fff' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="다시 분석">
                  <IconButton size="small" disabled={loading} onClick={requestAnswer} sx={{ color: colors.textHint, '&:hover': { color: colors.accent } }}>
                    <RefreshOutlined sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={() => setModalOpen(false)} sx={{ color: colors.textHint }}>
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: colors.border, borderRadius: 2 } }}>
              {loading
                ? <Box sx={{ py: 4 }}><LinearProgress sx={{ borderRadius: 1, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #569CD6 0%, #4EC9B0 100%)' } }} /></Box>
                : renderContentWithCopy(answer, colors, commentBodySx)
              }
            </Box>
          </Box>
        </Fade>
      </Modal>
    </>
  );
};

const CommentItem = ({ comment, index, depth = 0, onReply, onDelete, onEdit, myNickname, navigate, postWriter, colors, token, commentModules, highlighted, highlightedNickname }) => {
  const isPostWriter = (comment.WRITER || comment.writer) === postWriter;
  const isReply = depth > 0;
  const isMyComment = (comment.WRITER || comment.writer) === myNickname;

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [commentLiked, setCommentLiked] = useState((comment.MY_LIKE ?? 0) > 0);
  const [commentLikeCount, setCommentLikeCount] = useState(comment.LIKE_COUNT ?? 0);
  const [repliesOpen, setRepliesOpen] = useState(true);
  const [hoverAnchor, setHoverAnchor] = useState(null);
  const [hoverVisible, setHoverVisible] = useState(false);
  const leaveTimer = useRef(null);
  const hoverTimer = useRef(null);

  const handleCommentLike = async (e) => {
    e.stopPropagation();
    const next = !commentLiked;
    setCommentLiked(next);
    setCommentLikeCount(c => c + (next ? 1 : -1));
    try {
      await fetch(`${API}/feed/${comment.POST_ID}/comment/${comment.COMMENT_ID}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setCommentLiked(!next);
      setCommentLikeCount(c => c + (next ? -1 : 1));
    }
  };

  const handleEditSubmit = async () => {
    try {
      const res = await fetch(`${API}/feed/${comment.POST_ID}/comment/${comment.COMMENT_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) { onEdit(comment.COMMENT_ID, editContent); setEditing(false); }
    } catch { }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/feed/${comment.POST_ID}/comment/${comment.COMMENT_ID}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) onDelete(comment.COMMENT_ID);
    } catch { }
    setDeleteOpen(false);
  };

  const commentBodySx = {
    fontSize: '0.88rem', color: colors.textMuted, lineHeight: 1.7,
    '& p': { mb: 0.5, mt: 0, color: colors.textMuted },
    '& strong': { fontWeight: 700, color: colors.textPrimary },
    '& em': { fontStyle: 'italic' },
    '& blockquote': { borderLeft: `3px solid ${colors.accent}`, pl: 1.5, my: 0.8, color: colors.textHint, fontStyle: 'italic', backgroundColor: colors.inputBg, py: 0.5, borderRadius: '0 4px 4px 0' },
    '& pre': { backgroundColor: '#0D1117', color: '#D4D4D4', borderRadius: '6px', p: 1.5, fontSize: '0.78rem', fontFamily: '"JetBrains Mono",monospace', overflowX: 'auto', my: 1, whiteSpace: 'pre-wrap', border: '1px solid #1E293B' },
    '& code': { backgroundColor: colors.inputBg, color: '#CE9178', px: 0.6, py: 0.15, borderRadius: 0.5, fontSize: '0.82em', fontFamily: '"JetBrains Mono",monospace' },
  };

  return (
    <Box sx={{ animation: `fadeUp 0.3s ease ${index * 0.04}s both`, '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
      <Box sx={{
        display: 'flex', gap: 1.5, py: 2,
        pl: depth === 1 ? 2 : depth === 2 ? 4 : 0,
        ml: depth === 1 ? 1 : depth === 2 ? 2 : 0,
        borderBottom: `1px solid ${colors.border}`,
        borderLeft: depth === 1
          ? `3px solid ${colors.accent}60`
          : depth === 2
            ? `3px solid ${colors.textHint}40`
            : 'none',
        backgroundColor: depth === 1
          ? (colors.mode === 'dark' ? 'rgba(86,156,214,0.04)' : '#F8FAFF')
          : depth === 2
            ? (colors.mode === 'dark' ? 'rgba(100,116,139,0.04)' : '#F9FAFB')
            : 'transparent',
        borderRadius: depth > 0 ? '0 8px 8px 0' : 2,
        animation: highlighted ? 'commentPulse 1.5s ease 3' : 'none',
        '@keyframes commentPulse': {
          '0%, 100%': { backgroundColor: depth === 1 ? (colors.mode === 'dark' ? 'rgba(86,156,214,0.04)' : '#F8FAFF') : 'transparent' },
          '50%': { backgroundColor: colors.mode === 'dark' ? 'rgba(37,99,235,0.25)' : '#DBEAFE' },
        },
        '&:last-child': { borderBottom: 'none' },
        position: 'relative',
      }}>
        <Avatar src={resolveAvatarSrc(comment.AVATAR)}
          sx={{ width: isReply ? 28 : 34, height: isReply ? 28 : 34, flexShrink: 0, backgroundColor: colors.textPrimary, fontSize: isReply ? '0.65rem' : '0.75rem', fontWeight: 800, cursor: 'pointer' }}
          onMouseEnter={e => {
            clearTimeout(leaveTimer.current);
            const el = e.currentTarget;
            hoverTimer.current = setTimeout(() => { setHoverAnchor(el); setHoverVisible(true); }, 400);
          }}
          onMouseLeave={() => {
            clearTimeout(hoverTimer.current);
            leaveTimer.current = setTimeout(() => { setHoverVisible(false); setHoverAnchor(null); }, 200);
          }}
          onClick={() => { if (!comment.WRITER) return; navigate(comment.WRITER === myNickname ? '/mypage' : `/user/${comment.WRITER}`); }}>
          {getInitial(comment.WRITER || comment.writer)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: isReply ? '0.78rem' : '0.85rem', color: colors.textPrimary }}>
              {comment.WRITER || comment.writer || '익명'}
            </Typography>
            {isPostWriter && (
              <Chip label="작성자" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, backgroundColor: colors.textPrimary, color: colors.paper, px: 0.2 }} />
            )}
            {isReply && (
              <Chip label="답글" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, backgroundColor: colors.inputBg, color: colors.textHint, px: 0.2 }} />
            )}
            {(comment.CREATED_AT || comment.createdAt) && (
              <Typography sx={{ fontSize: '0.72rem', color: colors.textHint }}>
                {formatRelativeTime(comment.CREATED_AT || comment.createdAt)}
              </Typography>
            )}
            <IconButton size="small" onClick={e => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }} sx={{ ml: 'auto', color: colors.textHint, p: 0.3 }}>
              <MoreHoriz sx={{ fontSize: 16 }} />
            </IconButton>
            <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
              PaperProps={{ sx: { backgroundColor: colors.paper, border: `1px solid ${colors.border}`, boxShadow: '0 8px 32px rgba(15,23,42,0.15)', borderRadius: 1.5, minWidth: 120 } }}>
              {isMyComment ? [
                <MenuItem key="edit" onClick={() => { setEditing(true); setEditContent(comment.CONTENT || comment.content || ''); setMenuAnchor(null); }}
                  sx={{ fontSize: '0.82rem', gap: 1, color: colors.textPrimary }}>
                  <Edit sx={{ fontSize: 15, color: colors.textMuted }} />수정
                </MenuItem>,
                <MenuItem key="delete" onClick={() => { setDeleteOpen(true); setMenuAnchor(null); }}
                  sx={{ fontSize: '0.82rem', color: '#EF4444', gap: 1 }}>
                  <Delete sx={{ fontSize: 15, color: '#EF4444' }} />삭제
                </MenuItem>,
              ] : [
                <MenuItem key="report" onClick={() => { setReportOpen(true); setMenuAnchor(null); }}
                  sx={{ fontSize: '0.82rem', gap: 1, color: colors.textPrimary }}>
                  <FlagOutlined sx={{ fontSize: 15, color: colors.textMuted }} />신고
                </MenuItem>,
              ]}
            </Menu>
          </Box>

          {editing ? (
            <Box>
              <Box sx={makeQuillBoxSx(colors)}>
                <ReactQuill theme="snow" value={editContent} onChange={setEditContent} modules={commentModules} />
              </Box>
              <Stack direction="row" spacing={1} justifyContent="flex-end" mt={1}>
                <Button size="small" onClick={() => setEditing(false)}
                  sx={{ fontSize: '0.78rem', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 1.5, textTransform: 'none' }}>
                  취소
                </Button>
                <Button size="small" variant="contained" onClick={handleEditSubmit}
                  sx={{ fontSize: '0.78rem', backgroundColor: colors.textPrimary, color: colors.paper, boxShadow: 'none', borderRadius: 1.5, textTransform: 'none', '&:hover': { backgroundColor: colors.accent } }}>
                  저장
                </Button>
              </Stack>
            </Box>
          ) : (
            renderContentWithCopy(comment.CONTENT || comment.content || '', colors, commentBodySx)
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            {depth < 2 && (
              <Button size="small" startIcon={<ReplyOutlined sx={{ fontSize: 13 }} />} onClick={() => onReply(comment)}
                sx={{ color: colors.textHint, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', px: 0, minWidth: 0, '&:hover': { color: colors.accent, backgroundColor: 'transparent' } }}>
                답글
              </Button>
            )}
            {comment.replies?.length > 0 && (
              <Button size="small" onClick={() => setRepliesOpen(o => !o)}
                sx={{ color: colors.textHint, fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', px: 0.5, minWidth: 0, '&:hover': { color: colors.accent, backgroundColor: 'transparent' } }}>
                {repliesOpen ? `▲ 답글 ${comment.replies.length}개 숨기기` : `▼ 답글 ${comment.replies.length}개 보기`}
              </Button>
            )}
            <Button size="small"
              startIcon={commentLiked
                ? <Favorite sx={{ fontSize: 13, color: '#EF4444' }} />
                : <FavoriteBorderOutlined sx={{ fontSize: 13 }} />}
              onClick={handleCommentLike}
              sx={{ color: commentLiked ? '#EF4444' : colors.textHint, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', px: 0.5, minWidth: 0, '&:hover': { color: '#EF4444', backgroundColor: 'transparent' } }}>
              {commentLikeCount > 0 ? commentLikeCount : ''}
            </Button>
          </Box>
        </Box>
      </Box>

      {repliesOpen && comment.replies?.map((reply, ri) => (
        <CommentItem key={reply.COMMENT_ID || reply.id} comment={reply} index={ri} depth={depth + 1}
          onReply={onReply} myNickname={myNickname} navigate={navigate} postWriter={postWriter}
          colors={colors} onDelete={onDelete} onEdit={onEdit} token={token} commentModules={commentModules}
          highlighted={highlightedNickname === (reply.WRITER || reply.writer)}
          highlightedNickname={highlightedNickname} />
      ))}

      {reportOpen && (
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)}
          reportUrl={`${API}/feed/${comment.POST_ID}/comment/${comment.COMMENT_ID}/report`}
          token={token} onSuccess={() => setReportOpen(false)} onDuplicate={() => setReportOpen(false)}
          colors={colors} title="댓글 신고" reasons={COMMENT_REPORT_REASONS} />
      )}

      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' } } }}>
        <Fade in={deleteOpen}>
          <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '88vw', sm: 360 }, backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 3, boxShadow: '0 20px 60px rgba(15,23,42,0.2)', p: 3, outline: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: colors.mode === 'dark' ? '#2D1515' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Delete sx={{ fontSize: 17, color: '#EF4444' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>댓글 삭제</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 3 }}>이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.</Typography>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setDeleteOpen(false)} sx={{ fontSize: '0.82rem', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 1.5, textTransform: 'none', px: 2 }}>취소</Button>
              <Button variant="contained" onClick={handleDelete}
                sx={{ fontSize: '0.82rem', backgroundColor: '#EF4444', color: '#fff', boxShadow: 'none', borderRadius: 1.5, textTransform: 'none', px: 2, '&:hover': { backgroundColor: '#DC2626' } }}>삭제</Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>
      {hoverVisible && (
        <ProfileHoverCard
          nickname={comment.WRITER || comment.writer}
          token={token}
          anchorEl={hoverAnchor}
          colors={colors}
          navigate={navigate}
          onMouseEnter={() => clearTimeout(leaveTimer.current)}
          onMouseLeave={() => { leaveTimer.current = setTimeout(() => { setHoverVisible(false); setHoverAnchor(null); }, 200); }}
        />
      )}
    </Box>
  );
};

export default function PostDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId } = useParams();
  const token = localStorage.getItem('accessToken');
  const { mode } = useColorMode();
  const colors = makeColors(mode);
  const [editOpen, setEditOpen] = useState(false);
  const [highlightedCommentNickname, setHighlightedCommentNickname] = useState(null);
  const [editSuccessOpen, setEditSuccessOpen] = useState(false);
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);

  useEffect(() => {
    if (!location.state?.highlightComment || !location.state?.highlightNickname) return;
    const nickname = location.state.highlightNickname;
    setHighlightedCommentNickname(nickname);

    window.history.replaceState({}, '');

    setTimeout(() => {
      commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);

    const timer = setTimeout(() => setHighlightedCommentNickname(null), 3500);
    return () => clearTimeout(timer);
  }, [location.state]);

  const myNickname = (() => {
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
      return payload.nickname || null;
    } catch { return null; }
  })();

  const [feed, setFeed] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commLoading, setCommLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportSuccessOpen, setReportSuccessOpen] = useState(false);
  const [reportDuplicateOpen, setReportDuplicateOpen] = useState(false);
  const [myAvatar, setMyAvatar] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [heartTrigger, setHeartTrigger] = useState(0);

  const lastTapRef = useRef(0);
  const commentSectionRef = useRef(null);
  const commentListRef = useRef(null);
  const commentInputRef = useRef(null);
  const commentImageFiles = useRef([]);
  const clickTimerRef = useRef(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [aiModal, setAiModal] = useState(false);
  const [writerHoverAnchor, setWriterHoverAnchor] = useState(null);
  const [writerHoverVisible, setWriterHoverVisible] = useState(false);
  const writerLeaveTimer = useRef(null);
  const writerHoverTimer = useRef(null);

  const commentImageHandler = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = 'image/*'; input.click();
    input.onchange = () => {
      const file = input.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const quill = commentInputRef.current?.getEditor();
        if (!quill) return;
        const range = quill.getSelection(true);
        const index = range ? range.index : quill.getLength();
        quill.insertEmbed(index, 'image', reader.result, 'user');
        quill.setSelection(index + 1, 0, 'silent');
        commentImageFiles.current.push({ file, previewUrl: reader.result });
      };
      reader.readAsDataURL(file);
    };
  }, []);

  const handleCommentEdit = useCallback((commentId, newContent) => {
    setComments(prev => editInTree(prev, commentId, newContent));
  }, []);

  const commentModules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link', 'image'], ['clean'],
      ],
      handlers: { image: commentImageHandler },
    },
  }), [commentImageHandler]);

  const isCommentEmpty = (html) => !html || html.replace(/<[^>]*>?/gm, '').trim().length === 0;

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/feed/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
        fetch(`${API}/user/mypage/data`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json()).then(d => { if (d.success) setMyAvatar(d.user?.AVATAR || null); }).catch(() => { });
        const data = await res.json();
        if (res.ok && data.success) {
          setFeed(data.feed);
          setLiked(data.feed.LIKED ?? data.feed.liked ?? false);
          setLikeCount(data.feed.LIKES ?? data.feed.likes ?? 0);
          setBookmarked(data.feed.BOOKMARKED ?? data.feed.bookmarked ?? false);
        } else { navigate('/feed'); }
      } catch { navigate('/feed'); }
      finally { setLoading(false); }
    };
    const fetchComments = async () => {
      setCommLoading(true);
      try {
        const res = await fetch(`${API}/feed/${postId}/comments`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        setComments(data.success ? (data.comments ?? []) : []);
      } catch { setComments([]); }
      finally { setCommLoading(false); }
    };
    fetchPost(); fetchComments();
  }, [postId, token, navigate]);

  useEffect(() => {
    if (!location.hash || loading) return;
    if (location.hash === '#comments') {
      setTimeout(() => {
        commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => commentInputRef.current?.focus?.(), 400);
      }, 200);
    }
  }, [location.hash, loading]);

  useEffect(() => {
    if (location.state?.showAIModal && feed && !loading) {
      setAiModal(true);
      window.history.replaceState({}, '');
    }
  }, [location.state, feed, loading]);

  const handleProfileClick = useCallback((writerNickname) => {
    if (!writerNickname) return;
    navigate(writerNickname === myNickname ? '/mypage' : `/user/${writerNickname}`);
  }, [myNickname, navigate]);

  const handleCardDoubleClick = () => {
    if (!liked) {
      setLiked(true); setLikeCount(c => c + 1);
      fetch(`${API}/feed/${postId}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
    }
    setHeartTrigger(t => t + 1);
  };

  const handleCardClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current); clickTimerRef.current = null;
      handleCardDoubleClick();
    } else {
      clickTimerRef.current = setTimeout(() => { clickTimerRef.current = null; }, 200);
    }
  };

  const handleLike = async () => {
    const next = !liked;
    setLiked(next); setLikeCount(c => c + (next ? 1 : -1));
    if (next) setHeartTrigger(t => t + 1);
    try {
      await fetch(`${API}/feed/${postId}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch { setLiked(!next); setLikeCount(c => c + (next ? -1 : 1)); }
  };

  const handleBookmark = async () => {
    const next = !bookmarked; setBookmarked(next);
    try {
      await fetch(`${API}/feed/${postId}/bookmark`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch { setBookmarked(!next); }
  };

  const handleDeletePost = async () => {
    try {
      const res = await fetch(`${API}/feed/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const from = location.state?.from || '/feed';
        navigate(from, { replace: true, state: { deletedPost: true } });
      }
    } catch { }
    setDeleteOpen(false);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); }
    catch {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setShareOpen(true);
    fetch(`${API}/feed/${postId}/share`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
  };

  const handleAddComment = async () => {
    if (isCommentEmpty(newComment) || submitting) return;
    let finalContent = newComment;
    for (const img of commentImageFiles.current) {
      const formData = new FormData();
      formData.append('image', img.file);
      try {
        const uploadRes = await fetch(`${API}/feed/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
        const uploadData = await uploadRes.json();
        if (uploadData.success) finalContent = finalContent.replace(img.previewUrl, `${API}${uploadData.fileUrl}`);
      } catch { }
    }
    commentImageFiles.current = [];
    const currentReplyTarget = replyTarget;
    const optimistic = { id: Date.now(), COMMENT_ID: Date.now(), WRITER: myNickname || '나', AVATAR: myAvatar, CONTENT: finalContent, PARENT_ID: currentReplyTarget?.COMMENT_ID ?? null, replies: [] };
    if (currentReplyTarget) setComments(prev => addReplyToTree(prev, currentReplyTarget.COMMENT_ID, optimistic));
    else setComments(c => [...c, optimistic]);
    setNewComment(''); setReplyTarget(null); setSubmitting(true);
    setTimeout(() => { commentListRef.current?.scrollTo({ top: commentListRef.current.scrollHeight, behavior: 'smooth' }); }, 100);
    try {
      const res = await fetch(`${API}/feed/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: optimistic.CONTENT.replace(/<[^>]*>?/gm, '').trim(), content: optimistic.CONTENT, parentId: optimistic.PARENT_ID }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const serverComment = { ...data.comment, replies: [] };
        if (currentReplyTarget) setComments(prev => replaceInTree(prev, optimistic.COMMENT_ID, serverComment));
        else setComments(c => c.map(cm => (cm.COMMENT_ID === optimistic.COMMENT_ID || cm.id === optimistic.id) ? serverComment : cm));
      }
    } catch { }
    finally { setSubmitting(false); }
  };

  const handleCommentDelete = useCallback((commentId) => {
    setComments(prev => removeFromTree(prev, commentId));
  }, []);

  if (loading) return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg }}>
      <Box sx={{ height: 56, borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.paper }} />
      <PostSkeleton colors={colors} />
    </Box>
  );
  if (!feed) return null;

  const imageList = (feed.IMAGES || feed.images)
    ? (feed.IMAGES || feed.images).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const isReelPost = (feed.CATEGORY_NAME || feed.category || '') === 'REEL';
  const videoUrl = (() => {
    if (feed.VIDEO_URL || feed.videoUrl) return feed.VIDEO_URL || feed.videoUrl;
    if (isReelPost) {
      const match = (feed.DESCRIPTION || feed.description || feed.CONTENT || feed.content || '').match(/src="([^"]+\.mp4[^"]*)"/);
      return match ? (match[1].startsWith('http') ? match[1] : `${API}${match[1]}`) : null;
    }
    return null;
  })();

  const categoryName = feed.CATEGORY_NAME || feed.category || '';
  const isError = categoryName === 'ERROR' || categoryName === '트러블슈팅 / 에러 해결';

  const totalComments = countComments(comments);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg }}>

      {/* ── Top bar ── */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: colors.mode === 'dark' ? 'rgba(15,17,23,0.92)' : 'rgba(248,250,252,0.88)',
        backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}`,
      }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton size="small" onClick={() => {
            const from = location.state?.from || '/feed';
            navigate(from, { replace: true });
          }} sx={{ color: colors.textMuted }}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => {
            const from = location.state?.from || '/feed';
            navigate(from, { replace: true });
          }}>
            <Box sx={{ width: 26, height: 26, borderRadius: 1, backgroundColor: colors.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: colors.paper, fontWeight: 900, fontSize: '0.7rem' }}>{'<>'}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: colors.textPrimary }}>CtrlE</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
            <VisibilityOutlined sx={{ fontSize: 15, color: colors.textHint }} />
            <Typography sx={{ fontSize: '0.75rem', color: colors.textHint, fontWeight: 600 }}>
              {(feed.VIEW_COUNT ?? feed.viewCount ?? 0).toLocaleString()}
            </Typography>
          </Box>
          <Chip label={categoryName || 'General'} size="small"
            sx={{ backgroundColor: colors.inputBg, color: colors.textMuted, fontWeight: 700, fontSize: '0.72rem', height: 24, border: `1px solid ${colors.border}` }} />
        </Box>
      </Box>

      {/* ── Content ── */}
      <Box sx={{ position: 'relative', py: { xs: 3, md: 5 } }}>
        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box>
              {isError && (
                <Box sx={{ display: { xs: 'block', xl: 'none' }, mb: 3 }}>
                </Box>
              )}
              <Box onClick={handleCardClick}
                sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2.5, p: { xs: 2.5, md: 4 }, mb: 3, animation: 'fadeUp 0.4s ease both', cursor: 'default', position: 'relative', overflow: 'hidden', '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                <HeartOverlay trigger={heartTrigger} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover .writer-name': { color: colors.accent } }}
                    onClick={e => { e.stopPropagation(); handleProfileClick(feed.WRITER || feed.writer); }}>
                    <Avatar src={resolveAvatarSrc(feed.AVATAR || feed.avatar)}
                      sx={{ width: 44, height: 44, backgroundColor: colors.textPrimary, fontWeight: 800, fontSize: '1rem', boxShadow: '0 2px 10px rgba(15,23,42,0.12)', transition: 'all 0.2s', '&:hover': { boxShadow: `0 4px 16px rgba(86,156,214,0.3)` } }}
                      onMouseEnter={e => {
                        clearTimeout(writerLeaveTimer.current);
                        const el = e.currentTarget;
                        writerHoverTimer.current = setTimeout(() => { setWriterHoverAnchor(el); setWriterHoverVisible(true); }, 400);
                      }}
                      onMouseLeave={() => {
                        clearTimeout(writerHoverTimer.current);
                        writerLeaveTimer.current = setTimeout(() => { setWriterHoverVisible(false); setWriterHoverAnchor(null); }, 200);
                      }}>
                      {getInitial(feed.WRITER || feed.writer)}
                    </Avatar>
                    <Box>
                      <Typography className="writer-name" sx={{ fontWeight: 700, fontSize: '0.92rem', color: colors.textPrimary, lineHeight: 1.2, transition: 'color 0.15s' }}>
                        {feed.WRITER || feed.writer || 'Unknown'}
                      </Typography>
                      <Typography sx={{ color: colors.textHint, fontSize: '0.75rem', mt: 0.2 }}>
                        {(feed.ROLE || feed.role || 'Developer')}
                        {(feed.CREATED_AT || feed.createdAt) ? ` · ${formatRelativeTime(feed.CREATED_AT || feed.createdAt)}` : ''}
                      </Typography>

                      {(feed.LOCATION || feed.location) && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, mt: 0.3 }}>
                          <LocationOn sx={{ fontSize: 12, color: colors.textHint }} />
                          <Typography
                            onClick={e => { e.stopPropagation(); navigate(`/explore?location=${encodeURIComponent(feed.LOCATION || feed.location)}`); }}
                            sx={{ fontSize: '0.75rem', color: colors.textHint, cursor: 'pointer', '&:hover': { color: colors.accent, textDecoration: 'underline' } }}
                          >
                            {feed.LOCATION || feed.location}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  {(feed.WRITER || feed.writer) === myNickname ? (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="수정" placement="top">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); setEditOpen(true); }}
                          sx={{ color: colors.textHint, borderRadius: 1.5, border: `1px solid ${colors.border}`, '&:hover': { color: colors.accent, borderColor: colors.accent }, transition: 'all 0.15s' }}>
                          <Edit sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="삭제" placement="top">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); setDeleteOpen(true); }}
                          sx={{ color: colors.textHint, borderRadius: 1.5, border: `1px solid ${colors.border}`, '&:hover': { backgroundColor: colors.mode === 'dark' ? '#2D1515' : '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }, transition: 'all 0.15s' }}>
                          <Delete sx={{ fontSize: 17 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  ) : (
                    <Tooltip title="신고하기" placement="top">
                      <IconButton size="small" onClick={e => { e.stopPropagation(); setReportOpen(true); }}
                        sx={{ color: colors.textHint, borderRadius: 1.5, border: `1px solid ${colors.border}`, '&:hover': { backgroundColor: colors.mode === 'dark' ? '#2D1515' : '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }, transition: 'all 0.15s' }}>
                        <FlagOutlined sx={{ fontSize: 17 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.65rem' }, color: colors.textPrimary, lineHeight: 1.3, letterSpacing: '-0.02em', mb: 3 }}>
                  {feed.TITLE || feed.title}
                </Typography>
                {imageList.length > 0 && <ImageGallery images={imageList} colors={colors} />}
                {videoUrl && <VideoPlayer src={videoUrl} colors={colors} />}
                {renderContentWithCopy(
                  isReelPost
                    ? (feed.DESCRIPTION || feed.description || feed.CONTENT || feed.content || '')
                      .replace(/<video[^>]*>.*?<\/video>/gi, '')
                      .replace(/<video[^>]*\/>/gi, '')
                      .trim()
                    : (feed.DESCRIPTION || feed.description || feed.CONTENT || feed.content),
                  colors
                )}
                {(feed.CODE || feed.code) && <CodeBlock code={feed.CODE || feed.code} />}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 3, mt: 2, borderTop: `1px solid ${colors.border}` }}>
                  <Stack direction="row" spacing={1}>
                    <Button size="small"
                      startIcon={liked ? <Favorite sx={{ fontSize: 17, color: '#EF4444' }} /> : <FavoriteBorderOutlined sx={{ fontSize: 17 }} />}
                      onClick={e => { e.stopPropagation(); handleLike(); }}
                      sx={{ color: liked ? '#EF4444' : colors.textMuted, fontWeight: 600, fontSize: '0.82rem', textTransform: 'none', px: 1.5, borderRadius: 1.5, '&:hover': { backgroundColor: colors.mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#FEF2F2', color: '#EF4444' }, transition: 'all 0.15s' }}>
                      {likeCount}
                    </Button>
                    <Button size="small"
                      startIcon={<ChatBubbleOutline sx={{ fontSize: 17 }} />}
                      onClick={e => { e.stopPropagation(); commentSectionRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                      sx={{ color: colors.textMuted, fontWeight: 600, fontSize: '0.82rem', textTransform: 'none', px: 1.5, borderRadius: 1.5, '&:hover': { backgroundColor: colors.mode === 'dark' ? 'rgba(37,99,235,0.1)' : '#EFF6FF', color: colors.accent }, transition: 'all 0.15s' }}>
                      {totalComments}
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Tooltip title="공유하기" placement="top">
                      <IconButton size="small" onClick={e => { e.stopPropagation(); handleShare(); }} sx={{ color: colors.textHint, '&:hover': { color: colors.accent }, transition: 'color 0.15s' }}>
                        <ShareOutlined sx={{ fontSize: 19 }} />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={e => { e.stopPropagation(); handleBookmark(); }}>
                      {bookmarked
                        ? <Bookmark sx={{ fontSize: 20, color: colors.accent }} />
                        : <BookmarkBorderOutlined sx={{ fontSize: 20, color: colors.textHint }} />}
                    </IconButton>
                  </Stack>
                </Box>
              </Box>

              {isError && (
                <Box sx={{ mb: 3, animation: 'fadeUp 0.4s ease 0.05s both' }}>
                  <AIAnswerSection
                    postId={postId}
                    token={token}
                    colors={colors}
                    postUpdatedAt={feed.UPDATED_AT || feed.updatedAt}
                    isMyPost={(feed.WRITER || feed.writer) === myNickname}
                  />
                </Box>
              )}
              <Box id="comments" ref={commentSectionRef}
                sx={{ animation: 'fadeUp 0.4s ease 0.1s both', '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2.5 }}>
                  <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <ChatBubbleOutline sx={{ fontSize: 18, color: colors.textMuted }} />
                    <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>댓글</Typography>
                    <Box sx={{ px: 1.2, py: 0.15, backgroundColor: colors.inputBg, borderRadius: 1, border: `1px solid ${colors.border}` }}>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: colors.textMuted }}>{totalComments}</Typography>
                    </Box>
                  </Box>
                  <Box ref={commentListRef} sx={{ px: 3 }}>
                    {commLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress size={22} sx={{ color: colors.accent }} />
                      </Box>
                    ) : comments.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 8 }}>
                        <ChatBubbleOutline sx={{ fontSize: 32, color: colors.border, mb: 1.5 }} />
                        <Typography sx={{ color: colors.textHint, fontSize: '0.85rem', fontWeight: 500 }}>첫 댓글을 남겨보세요!</Typography>
                      </Box>
                    ) : (
                      comments.map((c, i) => (
                        <CommentItem key={c.COMMENT_ID || c.id} comment={c} index={i} depth={0}
                          onReply={setReplyTarget} myNickname={myNickname} navigate={navigate}
                          postWriter={feed.WRITER || feed.writer} colors={colors}
                          onDelete={handleCommentDelete} onEdit={handleCommentEdit}
                          token={token} commentModules={commentModules}
                          highlighted={highlightedCommentNickname === (c.WRITER || c.writer)}
                          highlightedNickname={highlightedCommentNickname} />
                      ))
                    )}
                  </Box>
                  <Box sx={{ px: 3, py: 3, borderTop: `1px solid ${colors.border}`, backgroundColor: colors.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#FAFBFC' }}>
                    {replyTarget && (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, mb: 1.5, backgroundColor: colors.mode === 'dark' ? '#1E3A5F' : '#EFF6FF', borderRadius: 1.5, border: `1px solid ${colors.accent}`, animation: 'slideDown 0.2s ease both', '@keyframes slideDown': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <ReplyOutlined sx={{ fontSize: 14, color: colors.accent }} />
                          <Typography sx={{ fontSize: '0.78rem', color: colors.accent, fontWeight: 600 }}>
                            @{replyTarget.WRITER || replyTarget.writer} 에게 답글 작성 중
                          </Typography>
                        </Box>
                        <IconButton size="small" onClick={() => setReplyTarget(null)} sx={{ color: colors.textHint, p: 0.3 }}>
                          <Close sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                      <Avatar src={resolveAvatarSrc(myAvatar)} sx={{ width: 34, height: 34, fontSize: '0.7rem', backgroundColor: colors.textPrimary, flexShrink: 0, mt: 0.5, fontWeight: 800 }}>
                        {getInitial(myNickname)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={makeQuillBoxSx(colors)}>
                          <ReactQuill ref={commentInputRef} theme="snow" value={newComment} onChange={setNewComment} modules={commentModules}
                            placeholder={replyTarget ? `@${replyTarget.WRITER || replyTarget.writer}에게 답글...` : '댓글을 작성하세요... 코드 강조, 인용구 사용 가능'} />
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                          <Button variant="contained" disabled={isCommentEmpty(newComment) || submitting} onClick={handleAddComment}
                            endIcon={submitting ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : <ArrowUpward sx={{ fontSize: 15 }} />}
                            sx={{ backgroundColor: colors.textPrimary, color: colors.paper, textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', px: 2.5, py: 0.8, borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: colors.accent }, '&.Mui-disabled': { backgroundColor: colors.border, color: colors.textHint }, transition: 'all 0.15s' }}>
                            {replyTarget ? '답글 등록' : '댓글 등록'}
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>

            {isError && (
              <Box sx={{
                display: { xs: 'none', xl: 'block' },
                position: 'absolute',
                top: { xs: 24, md: 40 },
                left: 'calc(50% + 420px)',
                width: 300,
              }}>
              </Box>
            )}

          </Box>

        </Box>
      </Box>

      <EditModal
        open={editOpen}
        postId={postId}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          setEditSuccessOpen(true);
          fetch(`${API}/feed/${postId}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => { if (data.success) setFeed(data.feed); });
        }}
      />
      {reportOpen && (
        <ReportModal open={reportOpen} onClose={() => setReportOpen(false)}
          reportUrl={`${API}/feed/${postId}/report`} token={token}
          onSuccess={() => { setReportOpen(false); setReportSuccessOpen(true); }}
          onDuplicate={() => { setReportOpen(false); setReportDuplicateOpen(true); }}
          colors={colors} />
      )}

      {/* ── 게시글 삭제 확인 모달 ── */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' } } }}>
        <Fade in={deleteOpen}>
          <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: '88vw', sm: 360 }, backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 3, boxShadow: '0 20px 60px rgba(15,23,42,0.2)', p: 3, outline: 'none' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: colors.mode === 'dark' ? '#2D1515' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Delete sx={{ fontSize: 17, color: '#EF4444' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>게시글 삭제</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 3 }}>이 게시글을 삭제하시겠습니까? 삭제된 게시글은 복구할 수 없습니다.</Typography>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setDeleteOpen(false)} sx={{ fontSize: '0.82rem', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 1.5, textTransform: 'none', px: 2 }}>취소</Button>
              <Button variant="contained" onClick={handleDeletePost}
                sx={{ fontSize: '0.82rem', backgroundColor: '#EF4444', color: '#fff', boxShadow: 'none', borderRadius: 1.5, textTransform: 'none', px: 2, '&:hover': { backgroundColor: '#DC2626' } }}>삭제</Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>

      <Snackbar open={shareOpen} autoHideDuration={2500} onClose={() => setShareOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, backgroundColor: colors.paper, color: colors.textPrimary, border: `1px solid ${colors.border}` }}>
          링크가 클립보드에 복사되었습니다!
        </Alert>
      </Snackbar>
      <Snackbar open={reportSuccessOpen} autoHideDuration={2500} onClose={() => setReportSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>신고가 접수되었습니다.</Alert>
      </Snackbar>
      <Snackbar open={reportDuplicateOpen} autoHideDuration={2500} onClose={() => setReportDuplicateOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" icon={<FlagOutlined fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>이미 신고한 게시글입니다.</Alert>
      </Snackbar>
      <Snackbar open={editSuccessOpen} autoHideDuration={2000} onClose={() => setEditSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, backgroundColor: colors.paper, color: colors.textPrimary, border: `1px solid ${colors.border}` }}>
          게시글이 수정되었습니다.
        </Alert>
      </Snackbar>
      <Snackbar open={deleteSuccessOpen} autoHideDuration={1500} onClose={() => setDeleteSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, backgroundColor: colors.paper, color: colors.textPrimary, border: `1px solid ${colors.border}` }}>
          게시글이 삭제되었습니다.
        </Alert>
      </Snackbar>
      {showScrollTop && (
        <Box onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 200, width: 44, height: 44, borderRadius: '50%', backgroundColor: colors.textPrimary, color: colors.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 20px rgba(15,23,42,0.2)', animation: 'fadeUp 0.2s ease both', transition: 'all 0.2s', '&:hover': { backgroundColor: colors.accent, transform: 'translateY(-2px)' } }}>
          <ArrowUpward sx={{ fontSize: 20 }} />
        </Box>
      )}
      {writerHoverVisible && (
        <ProfileHoverCard
          nickname={feed.WRITER || feed.writer}
          token={token}
          anchorEl={writerHoverAnchor}
          colors={colors}
          navigate={navigate}
          onMouseEnter={() => clearTimeout(writerLeaveTimer.current)}
          onMouseLeave={() => { writerLeaveTimer.current = setTimeout(() => { setWriterHoverVisible(false); setWriterHoverAnchor(null); }, 200); }}
        />
      )}
    </Box>
  );
}

function addReplyToTree(comments, parentId, newReply) {
  return comments.map(c => {
    if ((c.COMMENT_ID || c.id) === parentId) return { ...c, replies: [...(c.replies || []), newReply] };
    if (c.replies?.length) return { ...c, replies: addReplyToTree(c.replies, parentId, newReply) };
    return c;
  });
}
function replaceInTree(comments, tempId, real) {
  return comments.map(c => {
    if ((c.COMMENT_ID || c.id) === tempId) return real;
    if (c.replies?.length) return { ...c, replies: replaceInTree(c.replies, tempId, real) };
    return c;
  });
}
function countComments(comments) {
  return comments.reduce((acc, c) => acc + 1 + countComments(c.replies || []), 0);
}
function removeFromTree(comments, commentId) {
  return comments.filter(c => (c.COMMENT_ID || c.id) !== commentId)
    .map(c => ({ ...c, replies: removeFromTree(c.replies || [], commentId) }));
}
function editInTree(comments, commentId, newContent) {
  return comments.map(c => {
    if ((c.COMMENT_ID || c.id) === commentId) return { ...c, CONTENT: newContent };
    if (c.replies?.length) return { ...c, replies: editInTree(c.replies, commentId, newContent) };
    return c;
  });
}