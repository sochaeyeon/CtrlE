import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box, Avatar, Button, Chip, Divider, IconButton, Stack,
  Typography, CircularProgress, Skeleton, Tooltip,
  Modal, Backdrop, Fade,
  Radio, RadioGroup, FormControlLabel, TextField, Snackbar, Alert,
  Menu, MenuItem,
} from '@mui/material';
import {
  ArrowBack, FavoriteBorderOutlined, Favorite,
  ChatBubbleOutline, BookmarkBorderOutlined, Bookmark,
  ArrowUpward, ContentCopy, Check, FlagOutlined, ShareOutlined,
  ReplyOutlined, VisibilityOutlined, Close,
  MoreHoriz, Edit, Delete,
} from '@mui/icons-material';
import { useColorMode } from '../App';
const API = 'http://localhost:3010';

// ──────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────
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
// ──────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────
const resolveImageSrc = (src) =>
  src ? src.replace(/src="\/uploads/g, `src="${API}/uploads`) : '';

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const tagMeta = (tag, mode) => {
  const m = TAG_META[tag] || TAG_META['General'];
  return { ...m, bg: mode === 'dark' ? m.darkBg : m.bg };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
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
});

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
        <Box
          key={id}
          sx={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'heartBurst 0.85s ease forwards',
            '@keyframes heartBurst': {
              '0%': { opacity: 0, transform: 'translate(-50%, -50%) scale(0.2)' },
              '25%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.3)' },
              '60%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1.1)' },
              '100%': { opacity: 0, transform: 'translate(-50%, -60%) scale(0.9)' },
            },
          }}
        >
          <Favorite sx={{ fontSize: 80, color: '#EF4444', filter: 'drop-shadow(0 4px 12px rgba(239,68,68,0.5))' }} />
        </Box>
      ))}
    </>
  );
};

// ──────────────────────────────────────────
//  CopyButton (코드 블록용)
// ──────────────────────────────────────────
const CopyButton = ({ code }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(code); }
    catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Tooltip title={copied ? '복사됨!' : '코드 복사'} placement="top">
      <IconButton size="small" onClick={handleCopy}
        sx={{
          color: copied ? '#28C840' : '#64748B',
          backgroundColor: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 1, width: 28, height: 28, transition: 'all 0.2s',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff' },
        }}
      >
        {copied ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
      </IconButton>
    </Tooltip>
  );
};

// ──────────────────────────────────────────
//  CodeBlock (별도 code prop)
// ──────────────────────────────────────────
const CodeBlock = ({ code }) => (
  <Box sx={{ my: 3, borderRadius: 2, overflow: 'hidden', border: '1px solid #1E293B', boxShadow: '0 4px 24px rgba(15,23,42,0.25)' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1E293B', px: 2, py: 1, borderBottom: '1px solid #334155' }}>
      <Box sx={{ display: 'flex', gap: 0.6 }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
          <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: c }} />
        ))}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography sx={{ fontSize: '0.68rem', fontWeight: 600, color: '#475569', fontFamily: '"JetBrains Mono", monospace', letterSpacing: '0.05em', textTransform: 'uppercase' }}>code</Typography>
        <CopyButton code={code} />
      </Box>
    </Box>
    <Box sx={{ backgroundColor: '#0F172A', px: 2.5, py: 2.5, overflowX: 'auto', position: 'relative', '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #2563EB 0%, #7C3AED 50%, #06B6D4 100%)' } }}>
      <Typography component="pre" sx={{ fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: '0.82rem', lineHeight: 1.75, color: '#E2E8F0', margin: 0, whiteSpace: 'pre', tabSize: 2 }}>
        {code}
      </Typography>
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

// ──────────────────────────────────────────
//  ImageGallery
// ──────────────────────────────────────────
const ImageGallery = ({ images, colors }) => {
  const [active, setActive] = useState(0);
  if (!images?.length) return null;
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: `1px solid ${colors.border}`, backgroundColor: colors.codeBg, maxHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box component="img" src={resolveImageSrc(images[active])} alt={`이미지 ${active + 1}`}
          sx={{
            width: '100%', height: '100%', objectFit: 'contain', display: 'block', animation: 'scaleIn 0.2s ease both',
            '@keyframes scaleIn': { from: { opacity: 0, transform: 'scale(0.97)' }, to: { opacity: 1, transform: 'scale(1)' } },
          }} />
      </Box>
      {images.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
          {images.map((img, i) => (
            <Box key={i} onClick={() => setActive(i)}
              sx={{ width: 64, height: 64, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', border: active === i ? '2px solid #2563EB' : `2px solid ${colors.border}`, cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <Box component="img" src={resolveImageSrc(img)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

// ──────────────────────────────────────────
//  ReportModal
// ──────────────────────────────────────────
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
    <Modal open={open} onClose={onClose} closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' } } }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 440 },
          backgroundColor: colors.paper, borderRadius: 3,
          boxShadow: '0 20px 60px rgba(15,23,42,0.18)', overflow: 'hidden', outline: 'none',
        }}>
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
                  control={<Radio size="small" sx={{ color: colors.border, '&.Mui-checked': { color: '#2563EB' } }} />}
                  sx={{
                    mx: 0, px: 1.5, py: 0.8, borderRadius: 1.5, mb: 0.5,
                    border: reason === r.value ? '1px solid #BFDBFE' : '1px solid transparent',
                    backgroundColor: reason === r.value ? (colors.mode === 'dark' ? '#1E3A5F' : '#EFF6FF') : 'transparent',
                    transition: 'all 0.15s',
                    '& .MuiFormControlLabel-label': { fontSize: '0.88rem', fontWeight: reason === r.value ? 600 : 400, color: colors.textPrimary },
                  }}
                />
              ))}
            </RadioGroup>
            {reason === 'OTHER' && (
              <TextField multiline rows={2} fullWidth placeholder="기타 사유를 입력해주세요"
                value={detail} onChange={e => setDetail(e.target.value)}
                sx={{ mt: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: 1.5, backgroundColor: colors.paper, color: colors.textPrimary, '& fieldset': { borderColor: colors.border }, '&:hover fieldset': { borderColor: colors.borderFocus }, '&.Mui-focused fieldset': { borderColor: '#2563EB' } } }}
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
//  본문 콘텐츠 스타일 (다크 대응)
// ──────────────────────────────────────────
const makeContentSx = (colors) => ({
  fontSize: '0.93rem', color: colors.textMuted, lineHeight: 1.85, mb: 1,
  '& img': { maxWidth: '100%', borderRadius: 1.5, my: 1.5, display: 'block' },
  '& p': { mb: 1.5, mt: 0, color: colors.textMuted },
  '& h1, & h2, & h3': { fontWeight: 800, color: colors.textPrimary, mb: 1, mt: 2 },
  '& ul, & ol': { pl: 2.5, mb: 1.5, color: colors.textMuted },
  '& li': { mb: 0.5 },
  '& a': { color: '#2563EB', textDecoration: 'underline' },
  '& code': { fontFamily: '"JetBrains Mono", monospace', backgroundColor: colors.inputBg, color: '#DC2626', px: 0.8, py: 0.2, borderRadius: 0.5, fontSize: '0.85em' },
  '& pre': { backgroundColor: colors.codeBg, color: '#E2E8F0', borderRadius: '8px', p: 2, fontSize: '0.82rem', fontFamily: '"JetBrains Mono", monospace', overflowX: 'auto', lineHeight: 1.75, border: `1px solid ${colors.codeHeader}`, boxShadow: '0 4px 20px rgba(15,23,42,0.2)' },
  '& blockquote': { borderLeft: '3px solid #2563EB', pl: 2, my: 2, color: colors.textMuted, fontStyle: 'italic', backgroundColor: colors.inputBg, py: 1, borderRadius: '0 6px 6px 0' },
});

// ──────────────────────────────────────────
//  Quill 스타일 (다크 대응)
// ──────────────────────────────────────────
const makeQuillBoxSx = (colors) => ({
  border: `1px solid ${colors.border}`, borderRadius: 1.5, overflow: 'hidden', transition: 'border-color 0.2s',
  '&:focus-within': { borderColor: '#2563EB' },
  '.ql-toolbar': { backgroundColor: colors.inputBg, border: 'none', borderBottom: `1px solid ${colors.border}` },
  '.ql-container': { border: 'none', fontSize: '0.88rem', fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif', minHeight: 100, backgroundColor: colors.paper, color: colors.textPrimary },
  '.ql-editor': { minHeight: 100, maxHeight: 300, overflowY: 'auto', padding: '12px 14px', lineHeight: 1.75, color: colors.textPrimary, '&.ql-blank::before': { color: colors.textHint, fontStyle: 'normal', fontSize: '0.88rem' } },
  '.ql-editor pre.ql-syntax': { backgroundColor: colors.codeBg, color: '#E2E8F0', borderRadius: '6px', fontSize: '0.78rem', fontFamily: '"JetBrains Mono", monospace', padding: '12px 14px', border: `1px solid ${colors.codeHeader}` },
  '.ql-editor blockquote': { borderLeft: '3px solid #2563EB', paddingLeft: '12px', color: colors.textMuted },
  '.ql-snow .ql-stroke': { stroke: colors.textMuted },
  '.ql-snow .ql-fill': { fill: colors.textMuted },
  '.ql-snow.ql-toolbar button:hover .ql-stroke': { stroke: '#2563EB' },
  '.ql-snow.ql-toolbar button.ql-active .ql-stroke': { stroke: '#2563EB' },
  '.ql-picker-label': { color: colors.textMuted },
});

// ──────────────────────────────────────────
//  renderContentWithCopy (컴포넌트 밖)
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
            .replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"');
          return (
            <InlineCodeCopyWrapper key={i} codeText={rawCode}>
              <Box dangerouslySetInnerHTML={{ __html: part }} />
            </InlineCodeCopyWrapper>
          );
        }
        return <Box key={i} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </Box>
  );
};

// ──────────────────────────────────────────
//  CommentItem
// ──────────────────────────────────────────
const CommentItem = ({ comment, index, depth = 0, onReply, onDelete, onEdit, myNickname, navigate, postWriter, colors, token, commentModules }) => {
  const isPostWriter = (comment.WRITER || comment.writer) === postWriter;
  const isReply = depth > 0;
  const isMyComment = (comment.WRITER || comment.writer) === myNickname;

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const handleEditSubmit = async () => {
    try {
      const res = await fetch(`${API}/feed/${comment.POST_ID}/comment/${comment.COMMENT_ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editContent }),
      });
      if (res.ok) {
        onEdit(comment.COMMENT_ID, editContent);
        setEditing(false);
      }
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
    '& blockquote': { borderLeft: '3px solid #2563EB', pl: 1.5, my: 0.8, color: colors.textHint, fontStyle: 'italic', backgroundColor: colors.inputBg, py: 0.5, borderRadius: '0 4px 4px 0' },
    '& pre': { backgroundColor: colors.codeBg, color: '#E2E8F0', borderRadius: '6px', p: 1.5, fontSize: '0.78rem', fontFamily: '"JetBrains Mono", monospace', overflowX: 'auto', my: 1, whiteSpace: 'pre-wrap', border: `1px solid ${colors.codeHeader}` },
    '& code': { backgroundColor: colors.inputBg, color: '#DC2626', px: 0.6, py: 0.15, borderRadius: 0.5, fontSize: '0.82em', fontFamily: '"JetBrains Mono", monospace' },
  };

  return (
    <Box sx={{
      animation: `fadeUp 0.3s ease ${index * 0.04}s both`,
      '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
    }}>
      <Box sx={{
        display: 'flex', gap: 1.5, py: 2,
        pl: isReply ? `${depth * 16}px` : 0,
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: isReply
          ? (colors.mode === 'dark' ? 'rgba(37,99,235,0.05)' : '#F8FAFF')
          : 'transparent',
        '&:last-child': { borderBottom: 'none' },
        position: 'relative',
        ...(isReply && {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: `${depth * 28 - 14}px`,
            top: 0, bottom: 0, width: 0,
            backgroundColor: colors.border,
          },
        }),
      }}>
        <Avatar
          src={resolveAvatarSrc(comment.AVATAR)}
          sx={{ width: isReply ? 28 : 34, height: isReply ? 28 : 34, flexShrink: 0, backgroundColor: colors.textPrimary, fontSize: isReply ? '0.65rem' : '0.75rem', fontWeight: 800, cursor: 'pointer' }}
          onClick={() => {
            if (!comment.WRITER) return;
            if (comment.WRITER === myNickname) navigate('/mypage');
            else navigate(`/user/${comment.WRITER}`);
          }}
        >
          {getInitial(comment.WRITER || comment.writer)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontWeight: 700, fontSize: isReply ? '0.78rem' : '0.85rem', color: colors.textPrimary }}>
              {comment.WRITER || comment.writer || '익명'}
            </Typography>
            {isPostWriter && (
              <Chip label="작성자" size="small"
                sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, backgroundColor: colors.textPrimary, color: colors.paper, px: 0.2 }} />
            )}
            {isReply && (
              <Chip label="답글" size="small"
                sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, backgroundColor: colors.inputBg, color: colors.textHint, px: 0.2 }} />
            )}
            {(comment.CREATED_AT || comment.createdAt) && (
              <Typography sx={{ fontSize: '0.72rem', color: colors.textHint }}>
                {formatDate(comment.CREATED_AT || comment.createdAt)}
              </Typography>
            )}
            {/* 더보기 메뉴 버튼 */}
            <IconButton
              size="small"
              onClick={e => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }}
              sx={{ ml: 'auto', color: colors.textHint, p: 0.3 }}
            >
              <MoreHoriz sx={{ fontSize: 16 }} />
            </IconButton>
            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              PaperProps={{
                sx: {
                  backgroundColor: colors.paper,
                  border: `1px solid ${colors.border}`,
                  boxShadow: '0 8px 32px rgba(15,23,42,0.12)',
                  borderRadius: 1.5,
                  minWidth: 120,
                }
              }}
            >
              {isMyComment ? [
                <MenuItem key="edit"
                  onClick={() => { setEditing(true); setEditContent(comment.CONTENT || comment.content || ''); setMenuAnchor(null); }}
                  sx={{ fontSize: '0.82rem', gap: 1, color: colors.textPrimary }}>
                  <Edit sx={{ fontSize: 15, color: colors.textMuted }} /> 수정
                </MenuItem>,
                <MenuItem key="delete"
                  onClick={() => { setDeleteOpen(true); setMenuAnchor(null); }}
                  sx={{ fontSize: '0.82rem', color: '#EF4444', gap: 1 }}>
                  <Delete sx={{ fontSize: 15, color: '#EF4444' }} /> 삭제
                </MenuItem>,
              ] : [
                <MenuItem key="report"
                  onClick={() => { setReportOpen(true); setMenuAnchor(null); }}
                  sx={{ fontSize: '0.82rem', gap: 1, color: colors.textPrimary }}>
                  <FlagOutlined sx={{ fontSize: 15, color: colors.textMuted }} /> 신고
                </MenuItem>,
              ]}
            </Menu>
          </Box>

          {/* 본문 or 수정 에디터 */}
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
                  sx={{ fontSize: '0.78rem', backgroundColor: colors.textPrimary, color: colors.paper, boxShadow: 'none', borderRadius: 1.5, textTransform: 'none', '&:hover': { backgroundColor: '#2563EB' } }}>
                  저장
                </Button>
              </Stack>
            </Box>
          ) : (
            renderContentWithCopy(comment.CONTENT || comment.content || '', colors, commentBodySx)
          )}

          {depth < 2 && (
            <Button size="small" startIcon={<ReplyOutlined sx={{ fontSize: 13 }} />}
              onClick={() => onReply(comment)}
              sx={{ mt: 0.5, color: colors.textHint, fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', px: 0, minWidth: 0, '&:hover': { color: '#2563EB', backgroundColor: 'transparent' } }}>
              답글
            </Button>
          )}
        </Box>
      </Box>

      {/* 대댓글 */}
      {comment.replies?.map((reply, ri) => (
        <CommentItem
          key={reply.COMMENT_ID || reply.id}
          comment={reply} index={ri} depth={depth + 1}
          onReply={onReply} myNickname={myNickname}
          navigate={navigate} postWriter={postWriter} colors={colors}
          onDelete={onDelete}
          onEdit={onEdit}
          token={token}
          commentModules={commentModules}
        />
      ))}

      {/* 댓글 신고 모달 */}
      {reportOpen && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportUrl={`${API}/feed/${comment.POST_ID}/comment/${comment.COMMENT_ID}/report`}
          token={token}
          onSuccess={() => setReportOpen(false)}
          onDuplicate={() => setReportOpen(false)}
          colors={colors}
          title="댓글 신고"
          reasons={COMMENT_REPORT_REASONS}
        />
      )}

      {/* 댓글 삭제 확인 모달 */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' } } }}
      >
        <Fade in={deleteOpen}>
          <Box sx={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            width: { xs: '88vw', sm: 360 },
            backgroundColor: colors.paper, borderRadius: 3,
            boxShadow: '0 20px 60px rgba(15,23,42,0.16)', p: 3, outline: 'none',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.5 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: colors.mode === 'dark' ? '#2D1515' : '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Delete sx={{ fontSize: 17, color: '#EF4444' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>댓글 삭제</Typography>
            </Box>
            <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 3 }}>
              이 댓글을 삭제하시겠습니까? 삭제된 댓글은 복구할 수 없습니다.
            </Typography>
            <Stack direction="row" spacing={1.5} justifyContent="flex-end">
              <Button onClick={() => setDeleteOpen(false)}
                sx={{ fontSize: '0.82rem', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 1.5, textTransform: 'none', px: 2 }}>
                취소
              </Button>
              <Button variant="contained" onClick={handleDelete}
                sx={{ fontSize: '0.82rem', backgroundColor: '#EF4444', color: '#fff', boxShadow: 'none', borderRadius: 1.5, textTransform: 'none', px: 2, '&:hover': { backgroundColor: '#DC2626' } }}>
                삭제
              </Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

// ──────────────────────────────────────────
//  PostDetail (메인)
// ──────────────────────────────────────────
export default function PostDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { postId } = useParams();
  const token = localStorage.getItem('accessToken');
  const { mode } = useColorMode();
  const colors = makeColors(mode);

  const myNickname = (() => {
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
      return payload.nickname || null;
    } catch { return null; }
  })();

  // ── State ──────────────────────────────
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

  // ── commentImageHandler (commentModules보다 먼저 선언) ──
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
        ['link', 'image'],
        ['clean'],
      ],
      handlers: { image: commentImageHandler },
    },
  }), [commentImageHandler]);

  const isCommentEmpty = (html) =>
    !html || html.replace(/<[^>]*>?/gm, '').trim().length === 0;

  // ── 스크롤 맨 위로 감지 ────────────────
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── 데이터 로드 ────────────────────────
  useEffect(() => {
    if (!token) { navigate('/'); return; }

    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/feed/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
        // 내 아바타 조회
        fetch(`${API}/user/mypage/data`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.json())
          .then(d => { if (d.success) setMyAvatar(d.user?.AVATAR || null); })
          .catch(() => { });
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

    fetchPost();
    fetchComments();
  }, [postId, token, navigate]);

  // ── #comments 해시 스크롤 ──────────────
  useEffect(() => {
    if (!location.hash || loading) return;
    if (location.hash === '#comments') {
      setTimeout(() => {
        commentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => commentInputRef.current?.focus?.(), 400);
      }, 200);
    }
  }, [location.hash, loading]);

  // ── 작성자 클릭 ────────────────────────
  const handleProfileClick = useCallback((writerNickname) => {
    if (!writerNickname) return;
    navigate(writerNickname === myNickname ? '/mypage' : `/user/${writerNickname}`);
  }, [myNickname, navigate]);

  // ── 더블클릭/탭 ────────────────────────
  const handleCardDoubleClick = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(c => c + 1);
      fetch(`${API}/feed/${postId}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
    }
    setHeartTrigger(t => t + 1);
  };

  const clickTimerRef = useRef(null);

  const handleCardClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      handleCardDoubleClick();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null;
      }, 200);
    }
  };

  // ── 좋아요 ──────────────────────────────
  const handleLike = async () => {
    const next = !liked;
    setLiked(next); setLikeCount(c => c + (next ? 1 : -1));
    if (next) setHeartTrigger(t => t + 1);
    try {
      await fetch(`${API}/feed/${postId}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch { setLiked(!next); setLikeCount(c => c + (next ? -1 : 1)); }
  };

  // ── 북마크 ──────────────────────────────
  const handleBookmark = async () => {
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await fetch(`${API}/feed/${postId}/bookmark`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    } catch { setBookmarked(!next); }
  };

  // ── 공유 ────────────────────────────────
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

  // ── 댓글 등록 ───────────────────────────
  const handleAddComment = async () => {
    if (isCommentEmpty(newComment) || submitting) return;

    // 이미지 업로드
    let finalContent = newComment;
    for (const img of commentImageFiles.current) {
      const formData = new FormData();
      formData.append('image', img.file);
      try {
        const uploadRes = await fetch(`${API}/feed/upload`, {
          method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.success) {
          finalContent = finalContent.replace(img.previewUrl, `${API}${uploadData.fileUrl}`);
        }
      } catch { }
    }
    commentImageFiles.current = [];

    const currentReplyTarget = replyTarget;

    const optimistic = {
      id: Date.now(),
      COMMENT_ID: Date.now(),
      WRITER: myNickname || '나',
      AVATAR: myAvatar,
      CONTENT: finalContent,
      PARENT_ID: currentReplyTarget?.COMMENT_ID ?? null,
      replies: [],
    };

    if (currentReplyTarget) {
      setComments(prev => addReplyToTree(prev, currentReplyTarget.COMMENT_ID, optimistic));
    } else {
      setComments(c => [...c, optimistic]);
    }

    setNewComment('');
    setReplyTarget(null);
    setSubmitting(true);

    setTimeout(() => {
      commentListRef.current?.scrollTo({ top: commentListRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);

    try {
      const res = await fetch(`${API}/feed/${postId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          text: optimistic.CONTENT.replace(/<[^>]*>?/gm, '').trim(),
          content: optimistic.CONTENT,
          parentId: optimistic.PARENT_ID,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const serverComment = { ...data.comment, replies: [] };
        if (currentReplyTarget) {
          setComments(prev => replaceInTree(prev, optimistic.COMMENT_ID, serverComment));
        } else {
          setComments(c => c.map(cm =>
            (cm.COMMENT_ID === optimistic.COMMENT_ID || cm.id === optimistic.id)
              ? serverComment : cm
          ));
        }
      }
    } catch { }
    finally { setSubmitting(false); }
  };

  // ── 댓글 삭제 ───────────────────────────
  const handleCommentDelete = useCallback((commentId) => {
    setComments(prev => removeFromTree(prev, commentId));
  }, []);

  // ── 로딩 / 없음 ────────────────────────
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg }}>
        <Box sx={{ height: 56, borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.paper }} />
        <PostSkeleton colors={colors} />
      </Box>
    );
  }
  if (!feed) return null;

  const imageList = (feed.IMAGES || feed.images)
    ? (feed.IMAGES || feed.images).split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const meta = tagMeta(feed.TAG || feed.tag, mode);
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
          <IconButton size="small" onClick={() => navigate('/feed')} sx={{ color: colors.textMuted }}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/feed')}>
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
          <Chip
            label={feed.CATEGORY_NAME || feed.category || feed.TAG || feed.tag || 'General'}
            size="small"
            sx={{
              backgroundColor: colors.inputBg,
              color: colors.textMuted,
              fontWeight: 700, fontSize: '0.72rem', height: 24,
              border: `1px solid ${colors.border}`
            }}
          />
        </Box>
      </Box>

      {/* ── Content ── */}
      <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>

        {/* 게시물 본문 카드 */}
        <Box
          onClick={handleCardClick}
          sx={{
            backgroundColor: colors.paper, border: `1px solid ${colors.border}`,
            borderRadius: 2.5, p: { xs: 2.5, md: 4 }, mb: 3,
            animation: 'fadeUp 0.4s ease both', cursor: 'default',
            position: 'relative', overflow: 'hidden',
            '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
          }}
        >
          <HeartOverlay trigger={heartTrigger} />

          {/* 작성자 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box
              sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover .writer-name': { color: '#2563EB' } }}
              onClick={e => { e.stopPropagation(); handleProfileClick(feed.WRITER || feed.writer); }}
            >
              <Avatar src={resolveAvatarSrc(feed.AVATAR || feed.avatar)}
                sx={{ width: 44, height: 44, backgroundColor: colors.textPrimary, fontWeight: 800, fontSize: '1rem', boxShadow: '0 2px 10px rgba(15,23,42,0.12)', transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(37,99,235,0.25)' } }}>
                {getInitial(feed.WRITER || feed.writer)}
              </Avatar>
              <Box>
                <Typography className="writer-name" sx={{ fontWeight: 700, fontSize: '0.92rem', color: colors.textPrimary, lineHeight: 1.2, transition: 'color 0.15s' }}>
                  {feed.WRITER || feed.writer || 'Unknown'}
                </Typography>
                <Typography sx={{ color: colors.textHint, fontSize: '0.75rem', mt: 0.2 }}>
                  {(feed.ROLE || feed.role || 'Developer')}
                  {(feed.CREATED_AT || feed.createdAt) ? ` · ${formatDate(feed.CREATED_AT || feed.createdAt)}` : ''}
                </Typography>
              </Box>
            </Box>
            <Tooltip title="신고하기" placement="top">
              <IconButton size="small" onClick={e => { e.stopPropagation(); setReportOpen(true); }}
                sx={{ color: colors.textHint, borderRadius: 1.5, border: `1px solid ${colors.border}`, '&:hover': { backgroundColor: colors.mode === 'dark' ? '#2D1515' : '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }, transition: 'all 0.15s' }}>
                <FlagOutlined sx={{ fontSize: 17 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* 제목 */}
          <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.65rem' }, color: colors.textPrimary, lineHeight: 1.3, letterSpacing: '-0.02em', mb: 3 }}>
            {feed.TITLE || feed.title}
          </Typography>

          {/* 이미지 */}
          {imageList.length > 0 && <ImageGallery images={imageList} colors={colors} />}

          {/* 본문 */}
          {renderContentWithCopy(feed.DESCRIPTION || feed.description || feed.CONTENT || feed.content, colors)}

          {/* 별도 code prop */}
          {(feed.CODE || feed.code) && <CodeBlock code={feed.CODE || feed.code} />}

          {/* 액션 바 */}
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
                sx={{ color: colors.textMuted, fontWeight: 600, fontSize: '0.82rem', textTransform: 'none', px: 1.5, borderRadius: 1.5, '&:hover': { backgroundColor: colors.mode === 'dark' ? 'rgba(37,99,235,0.1)' : '#EFF6FF', color: '#2563EB' }, transition: 'all 0.15s' }}>
                {totalComments}
              </Button>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Tooltip title="공유하기" placement="top">
                <IconButton size="small" onClick={e => { e.stopPropagation(); handleShare(); }} sx={{ color: colors.textHint, '&:hover': { color: '#2563EB' }, transition: 'color 0.15s' }}>
                  <ShareOutlined sx={{ fontSize: 19 }} />
                </IconButton>
              </Tooltip>
              <IconButton size="small" onClick={e => { e.stopPropagation(); handleBookmark(); }}>
                {bookmarked
                  ? <Bookmark sx={{ fontSize: 20, color: '#2563EB' }} />
                  : <BookmarkBorderOutlined sx={{ fontSize: 20, color: colors.textHint }} />
                }
              </IconButton>
            </Stack>
          </Box>
        </Box>

        {/* ── 댓글 섹션 ── */}
        <Box
          id="comments"
          ref={commentSectionRef}
          sx={{
            animation: 'fadeUp 0.4s ease 0.1s both',
            '@keyframes fadeUp': { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
          }}
        >
          <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2.5 }}>

            {/* 헤더 */}
            <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ChatBubbleOutline sx={{ fontSize: 18, color: colors.textMuted }} />
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>댓글</Typography>
              <Box sx={{ px: 1.2, py: 0.15, backgroundColor: colors.inputBg, borderRadius: 1, border: `1px solid ${colors.border}` }}>
                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: colors.textMuted }}>{totalComments}</Typography>
              </Box>
            </Box>

            {/* 목록 */}
            <Box ref={commentListRef} sx={{ px: 3 }}>
              {commLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                  <CircularProgress size={22} sx={{ color: '#2563EB' }} />
                </Box>
              ) : comments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <ChatBubbleOutline sx={{ fontSize: 32, color: colors.border, mb: 1.5 }} />
                  <Typography sx={{ color: colors.textHint, fontSize: '0.85rem', fontWeight: 500 }}>첫 댓글을 남겨보세요!</Typography>
                </Box>
              ) : (
                comments.map((c, i) => (
                  <CommentItem
                    key={c.COMMENT_ID || c.id}
                    comment={c} index={i} depth={0}
                    onReply={setReplyTarget}
                    myNickname={myNickname}
                    navigate={navigate}
                    postWriter={feed.WRITER || feed.writer}
                    colors={colors}
                    onDelete={handleCommentDelete}
                    onEdit={handleCommentEdit}
                    token={token}
                    commentModules={commentModules}
                  />
                ))
              )}
            </Box>

            {/* 댓글 입력 */}
            <Box sx={{ px: 3, py: 3, borderTop: `1px solid ${colors.border}`, backgroundColor: colors.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#FAFBFC' }}>

              {/* 답글 대상 배너 */}
              {replyTarget && (
                <Box sx={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  px: 1.5, py: 1, mb: 1.5,
                  backgroundColor: colors.mode === 'dark' ? '#1E3A5F' : '#EFF6FF',
                  borderRadius: 1.5, border: '1px solid #BFDBFE',
                  animation: 'slideDown 0.2s ease both',
                  '@keyframes slideDown': { from: { opacity: 0, transform: 'translateY(-8px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <ReplyOutlined sx={{ fontSize: 14, color: '#2563EB' }} />
                    <Typography sx={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}>
                      @{replyTarget.WRITER || replyTarget.writer} 에게 답글 작성 중
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={() => setReplyTarget(null)} sx={{ color: '#93C5FD', p: 0.3 }}>
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
                    <ReactQuill
                      ref={commentInputRef}
                      theme="snow"
                      value={newComment}
                      onChange={setNewComment}
                      modules={commentModules}
                      placeholder={replyTarget ? `@${replyTarget.WRITER || replyTarget.writer}에게 답글...` : '댓글을 작성하세요... 코드 강조, 인용구 사용 가능'}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
                    <Button variant="contained"
                      disabled={isCommentEmpty(newComment) || submitting}
                      onClick={handleAddComment}
                      endIcon={submitting ? <CircularProgress size={13} sx={{ color: '#fff' }} /> : <ArrowUpward sx={{ fontSize: 15 }} />}
                      sx={{ backgroundColor: colors.textPrimary, color: colors.paper, textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', px: 2.5, py: 0.8, borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#2563EB' }, '&.Mui-disabled': { backgroundColor: colors.border, color: colors.textHint }, transition: 'all 0.15s' }}>
                      {replyTarget ? '답글 등록' : '댓글 등록'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── 게시글 신고 모달 ── */}
      {reportOpen && (
        <ReportModal
          open={reportOpen}
          onClose={() => setReportOpen(false)}
          reportUrl={`${API}/feed/${postId}/report`}
          token={token}
          onSuccess={() => { setReportOpen(false); setReportSuccessOpen(true); }}
          onDuplicate={() => { setReportOpen(false); setReportDuplicateOpen(true); }}
          colors={colors}
        />
      )}

      {/* ── 토스트 ── */}
      <Snackbar open={shareOpen} autoHideDuration={2500} onClose={() => setShareOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          링크가 클립보드에 복사되었습니다!
        </Alert>
      </Snackbar>
      <Snackbar open={reportSuccessOpen} autoHideDuration={2500} onClose={() => setReportSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          신고가 접수되었습니다.
        </Alert>
      </Snackbar>
      <Snackbar open={reportDuplicateOpen} autoHideDuration={2500} onClose={() => setReportDuplicateOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" icon={<FlagOutlined fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          이미 신고한 게시글입니다.
        </Alert>
      </Snackbar>

      {/* ── 맨 위로 버튼 ── */}
      {showScrollTop && (
        <Box
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{
            position: 'fixed', bottom: 32, right: 32, zIndex: 200,
            width: 44, height: 44, borderRadius: '50%',
            backgroundColor: colors.textPrimary, color: colors.paper,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(15,23,42,0.2)',
            animation: 'fadeUp 0.2s ease both',
            transition: 'all 0.2s',
            '&:hover': { backgroundColor: '#2563EB', transform: 'translateY(-2px)' },
          }}
        >
          <ArrowUpward sx={{ fontSize: 20 }} />
        </Box>
      )}
    </Box>
  );
}

// ──────────────────────────────────────────
//  Tree 유틸 함수
// ──────────────────────────────────────────
function addReplyToTree(comments, parentId, newReply) {
  return comments.map(c => {
    if ((c.COMMENT_ID || c.id) === parentId) {
      return { ...c, replies: [...(c.replies || []), newReply] };
    }
    if (c.replies?.length) {
      return { ...c, replies: addReplyToTree(c.replies, parentId, newReply) };
    }
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
  return comments
    .filter(c => (c.COMMENT_ID || c.id) !== commentId)
    .map(c => ({ ...c, replies: removeFromTree(c.replies || [], commentId) }));
}

function editInTree(comments, commentId, newContent) {
  return comments.map(c => {
    if ((c.COMMENT_ID || c.id) === commentId) return { ...c, CONTENT: newContent };
    if (c.replies?.length) return { ...c, replies: editInTree(c.replies, commentId, newContent) };
    return c;
  });
}