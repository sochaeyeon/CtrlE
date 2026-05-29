import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import {
  Box, Avatar, Button, Chip, Divider, IconButton, Stack,
  Typography, createTheme, ThemeProvider, CssBaseline,
  CircularProgress, Skeleton, Tooltip, Modal, Backdrop, Fade,
  Radio, RadioGroup, FormControlLabel, TextField, Snackbar, Alert,
} from '@mui/material';
import {
  ArrowBack, FavoriteBorderOutlined, Favorite,
  ChatBubbleOutline, BookmarkBorderOutlined, Bookmark,
  ArrowUpward, Code, BugReport, Rocket, Lightbulb,
  TrendingUp, ContentCopy, Check, FlagOutlined, ShareOutlined,
  ReplyOutlined, VisibilityOutlined, Close,
} from '@mui/icons-material';

// ──────────────────────────────────────────
//  Theme
// ──────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    secondary: { main: '#0F172A' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
  },
  typography: { fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif' },
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `,
    },
  },
});

const API = 'http://localhost:3010';

// ──────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────
const TAG_META = {
  'Bug Fix': { color: '#DC2626', bg: '#FEF2F2', icon: <BugReport sx={{ fontSize: 12 }} /> },
  'React': { color: '#2563EB', bg: '#EFF6FF', icon: <Code sx={{ fontSize: 12 }} /> },
  'TypeScript': { color: '#7C3AED', bg: '#F5F3FF', icon: <Code sx={{ fontSize: 12 }} /> },
  'Architecture': { color: '#D97706', bg: '#FFFBEB', icon: <Rocket sx={{ fontSize: 12 }} /> },
  'Tip': { color: '#059669', bg: '#ECFDF5', icon: <Lightbulb sx={{ fontSize: 12 }} /> },
  'DevOps': { color: '#0891B2', bg: '#ECFEFF', icon: <TrendingUp sx={{ fontSize: 12 }} /> },
  'General': { color: '#64748B', bg: '#F1F5F9', icon: null },
};

const REPORT_REASONS = [
  { value: 'SPAM', label: '스팸 / 광고성 게시물' },
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
const tagMeta = (tag) => TAG_META[tag] || TAG_META['General'];
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
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
//  CodeBlock
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
//  InlineCodeCopyWrapper
// ──────────────────────────────────────────
const InlineCodeCopyWrapper = ({ children, codeText }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(codeText); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Box sx={{ position: 'relative', my: 2, '&:hover .copy-btn': { opacity: 1 } }}>
      {children}
      <Tooltip title={copied ? '복사됨!' : '복사'} placement="top">
        <IconButton className="copy-btn" size="small" onClick={handleCopy}
          sx={{ position: 'absolute', top: 10, right: 10, opacity: 0, transition: 'opacity 0.2s', color: copied ? '#28C840' : '#94A3B8', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', width: 26, height: 26, '&:hover': { backgroundColor: 'rgba(37,99,235,0.3)', color: '#fff' } }}
        >
          {copied ? <Check sx={{ fontSize: 13 }} /> : <ContentCopy sx={{ fontSize: 13 }} />}
        </IconButton>
      </Tooltip>
    </Box>
  );
};

// ──────────────────────────────────────────
//  ImageGallery
// ──────────────────────────────────────────
const ImageGallery = ({ images }) => {
  const [active, setActive] = useState(0);
  if (!images?.length) return null;
  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ width: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0', backgroundColor: '#0F172A', maxHeight: 480, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box component="img" src={resolveImageSrc(images[active])} alt={`이미지 ${active + 1}`}
          sx={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', animation: 'scaleIn 0.2s ease both' }} />
      </Box>
      {images.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 0.5 }}>
          {images.map((img, i) => (
            <Box key={i} onClick={() => setActive(i)}
              sx={{ width: 64, height: 64, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', border: active === i ? '2px solid #2563EB' : '2px solid #E2E8F0', cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <Box component="img" src={resolveImageSrc(img)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
};

// ✅ 수정 후
const ReportModal = ({ open, onClose, postId, token, onSuccess, onDuplicate }) => {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/feed/${postId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason, detail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReason(''); setDetail('');
        onClose();
        onSuccess();           // ← 모달 닫고 토스트 띄움
      } else if (res.status === 409) {
        onClose();
        onDuplicate();         // ← 중복 신고도 토스트로
      } else {
        onClose();
        onDuplicate();
      }
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' } } }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'fixed',           // ← absolute → fixed
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 440 },
          backgroundColor: '#fff',
          borderRadius: 3,
          boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
          overflow: 'hidden',
          outline: 'none',
        }}>
          <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlagOutlined sx={{ fontSize: 17, color: '#DC2626' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>게시글 신고</Typography>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>

          <Box sx={{ px: 3, py: 3 }}>
            <Typography sx={{ fontSize: '0.82rem', color: '#64748B', mb: 2 }}>신고 사유를 선택해주세요.</Typography>
            <RadioGroup value={reason} onChange={e => setReason(e.target.value)}>
              {REPORT_REASONS.map(r => (
                <FormControlLabel key={r.value} value={r.value} label={r.label}
                  control={<Radio size="small" sx={{ color: '#CBD5E1', '&.Mui-checked': { color: '#2563EB' } }} />}
                  sx={{
                    mx: 0, px: 1.5, py: 0.8, borderRadius: 1.5, mb: 0.5,
                    border: reason === r.value ? '1px solid #BFDBFE' : '1px solid transparent',
                    backgroundColor: reason === r.value ? '#EFF6FF' : 'transparent',
                    transition: 'all 0.15s',
                    '& .MuiFormControlLabel-label': { fontSize: '0.88rem', fontWeight: reason === r.value ? 600 : 400 },
                  }}
                />
              ))}
            </RadioGroup>

            {reason === 'OTHER' && (
              <TextField multiline rows={2} fullWidth
                placeholder="기타 사유를 입력해주세요"
                value={detail} onChange={e => setDetail(e.target.value)}
                sx={{ mt: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: 1.5, '& fieldset': { borderColor: '#E2E8F0' }, '&:hover fieldset': { borderColor: '#CBD5E1' }, '&.Mui-focused fieldset': { borderColor: '#2563EB' } } }}
              />
            )}

            <Button fullWidth variant="contained"
              disabled={!reason || submitting}
              onClick={handleSubmit}
              sx={{ mt: 2.5, py: 1.1, borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.88rem', backgroundColor: '#DC2626', boxShadow: 'none', '&:hover': { backgroundColor: '#B91C1C' }, '&.Mui-disabled': { backgroundColor: '#F1F5F9', color: '#94A3B8' } }}
            >
              {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : '신고 제출'}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

// ──────────────────────────────────────────
//  ShareToast — 링크 복사 팝업
// ──────────────────────────────────────────
const ShareToast = ({ open, onClose }) => (
  <Snackbar open={open} autoHideDuration={2500} onClose={onClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
    <Alert severity="success" icon={<Check fontSize="inherit" />}
      sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
      링크가 클립보드에 복사되었습니다!
    </Alert>
  </Snackbar>
);

// ──────────────────────────────────────────
//  Skeleton Loader
// ──────────────────────────────────────────
const PostSkeleton = () => (
  <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
    <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 3 }} />
    <Skeleton width="60%" height={32} sx={{ mb: 1.5 }} />
    <Skeleton width="40%" height={20} sx={{ mb: 3 }} />
    <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1.5 }} />
  </Box>
);

// ──────────────────────────────────────────
//  Quill 스타일 공통
// ──────────────────────────────────────────
const quillBoxSx = {
  border: '1px solid #E2E8F0', borderRadius: 1.5, overflow: 'hidden', transition: 'border-color 0.2s',
  '&:focus-within': { borderColor: '#2563EB' },
  '.ql-toolbar': { backgroundColor: '#F8FAFC', border: 'none', borderBottom: '1px solid #E2E8F0' },
  '.ql-container': { border: 'none', fontSize: '0.88rem', fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif', minHeight: 100 },
  '.ql-editor': { minHeight: 100, maxHeight: 300, overflowY: 'auto', padding: '12px 14px', lineHeight: 1.75, '&.ql-blank::before': { color: '#CBD5E1', fontStyle: 'normal', fontSize: '0.88rem' } },
  '.ql-editor pre.ql-syntax': { backgroundColor: '#0F172A', color: '#E2E8F0', borderRadius: '6px', fontSize: '0.78rem', fontFamily: '"JetBrains Mono", monospace', padding: '12px 14px', border: '1px solid #1E293B' },
  '.ql-editor blockquote': { borderLeft: '3px solid #2563EB', paddingLeft: '12px', color: '#64748B' },
  '.ql-snow .ql-stroke': { stroke: '#64748B' },
  '.ql-snow .ql-fill': { fill: '#64748B' },
  '.ql-snow.ql-toolbar button:hover .ql-stroke': { stroke: '#2563EB' },
  '.ql-snow.ql-toolbar button.ql-active .ql-stroke': { stroke: '#2563EB' },
};

const CommentItem = ({ comment, index, depth = 0, onReply, myNickname, navigate, postWriter }) => {
  const isPostWriter = (comment.WRITER || comment.writer) === postWriter;
  const isReply = depth > 0;  // ← 이 줄 추가
  return (
    <Box sx={{
      animation: `fadeUp 0.3s ease ${index * 0.04}s both`,
      backgroundColor: isReply ? '#EFF6FF' : 'transparent',
    }}>
      <Box sx={{
        display: 'flex', gap: 1.5,
        py: 2,
        pl: isReply ? `${depth * 16}px` : 0,
        borderBottom: '1px solid #F1F5F9',
        backgroundColor: isReply ? '#F8FAFC' : 'transparent',
        '&:last-child': { borderBottom: 'none' },
        position: 'relative',
        // 답글 들여쓰기 선
        ...(isReply && {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: `${depth * 28 - 14}px`,
            top: 0,
            bottom: 0,
            width: 0,              
            boxSizing: 'border-box',   
            backgroundColor: '#E2E8F0',
          },
        }),
      }}>
        <Avatar
          sx={{ width: isReply ? 28 : 34, height: isReply ? 28 : 34, flexShrink: 0, backgroundColor: '#0F172A', fontSize: isReply ? '0.65rem' : '0.75rem', fontWeight: 800, cursor: 'pointer' }}
          onClick={() => {
            if (!comment.WRITER) return;
            if (comment.WRITER === myNickname) navigate('/mypage');
            else navigate(`/user/${comment.WRITER}`);
          }}
        >
          {getInitial(comment.WRITER || comment.writer)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Typography sx={{ fontWeight: 700, fontSize: isReply ? '0.78rem' : '0.85rem', color: '#0F172A' }}>
              {comment.WRITER || comment.writer || '익명'}
            </Typography>
            {isPostWriter && (
              <Chip
                label="작성자"
                size="small"
                sx={{
                  height: 16, fontSize: '0.6rem', fontWeight: 700,
                  backgroundColor: '#0F172A', color: '#fff', px: 0.2,
                }}
              />
            )}
            {isReply && (
              <Chip label="답글" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, backgroundColor: '#F1F5F9', color: '#94A3B8', px: 0.2 }} />
            )}
            {(comment.CREATED_AT || comment.createdAt) && (
              <Typography sx={{ fontSize: '0.72rem', color: '#CBD5E1' }}>
                {formatDate(comment.CREATED_AT || comment.createdAt)}
              </Typography>
            )}
          </Box>

          <Box sx={{
            fontSize: '0.88rem', color: '#475569', lineHeight: 1.7,
            '& p': {
              mb: 0.5, mt: 0, color: '#475569'
            }, '& strong': { fontWeight: 700, color: '#0F172A' },
            '& em': { fontStyle: 'italic' },
            '& blockquote': { borderLeft: '3px solid #2563EB', pl: 1.5, my: 0.8, color: '#64748B', fontStyle: 'italic' },
            '& pre': { backgroundColor: '#0F172A', color: '#E2E8F0', borderRadius: '6px', p: 1.5, fontSize: '0.78rem', fontFamily: '"JetBrains Mono", monospace', overflowX: 'auto', my: 1, whiteSpace: 'pre-wrap', border: '1px solid #1E293B' },
            '& code': { backgroundColor: '#F1F5F9', color: '#DC2626', px: 0.6, py: 0.15, borderRadius: 0.5, fontSize: '0.82em', fontFamily: '"JetBrains Mono", monospace' },
          }}
            dangerouslySetInnerHTML={{ __html: comment.CONTENT || comment.content || comment.text || '' }}
          />

          {/* 답글 버튼 (depth < 2 로 제한) */}
          {depth < 2 && (
            <Button size="small" startIcon={<ReplyOutlined sx={{ fontSize: 13 }} />}
              onClick={() => onReply(comment)}
              sx={{ mt: 0.5, color: '#94A3B8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'none', px: 0, minWidth: 0, '&:hover': { color: '#2563EB', backgroundColor: 'transparent' } }}
            >
              답글
            </Button>
          )}
        </Box>
      </Box>
      {comment.replies?.map((reply, ri) => (
        <CommentItem
          key={reply.COMMENT_ID || reply.id}
          comment={reply}
          index={ri}
          depth={depth + 1}
          onReply={onReply}
          myNickname={myNickname}
          navigate={navigate}
          postWriter={postWriter}
        />
      ))}
    </Box>
  );
};

// ──────────────────────────────────────────
//  본문 콘텐츠 스타일
// ──────────────────────────────────────────
const contentSx = {
  fontSize: '0.93rem', color: '#334155', lineHeight: 1.85, mb: 1,
  '& img': { maxWidth: '100%', borderRadius: 1.5, my: 1.5, display: 'block' },
  '& p': { mb: 1.5, mt: 0 },
  '& h1, & h2, & h3': { fontWeight: 800, color: '#0F172A', mb: 1, mt: 2 },
  '& ul, & ol': { pl: 2.5, mb: 1.5 },
  '& li': { mb: 0.5 },
  '& a': { color: '#2563EB', textDecoration: 'underline' },
  '& code': { fontFamily: '"JetBrains Mono", monospace', backgroundColor: '#F1F5F9', color: '#DC2626', px: 0.8, py: 0.2, borderRadius: 0.5, fontSize: '0.85em' },
  '& pre': { backgroundColor: '#0F172A', color: '#E2E8F0', borderRadius: '8px', p: 2, fontSize: '0.82rem', fontFamily: '"JetBrains Mono", monospace', overflowX: 'auto', lineHeight: 1.75, border: '1px solid #1E293B', boxShadow: '0 4px 20px rgba(15,23,42,0.2)' },
  '& blockquote': { borderLeft: '3px solid #2563EB', pl: 2, my: 2, color: '#64748B', fontStyle: 'italic', backgroundColor: '#F8FAFC', py: 1, borderRadius: '0 6px 6px 0' },
};

export default function PostDetail() {
  const navigate = useNavigate();
  const { postId } = useParams();
  const token = localStorage.getItem('accessToken');

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

  const [replyTarget, setReplyTarget] = useState(null); // { COMMENT_ID, WRITER }

  const commentListRef = useRef(null);

  const commentModules = useMemo(() => ({
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'], ['clean'],
      ],
    },
  }), []);

  const isCommentEmpty = (html) =>
    !html || html.replace(/<[^>]*>?/gm, '').trim().length === 0;

  // ── 데이터 로드 ────────────────────────
  useEffect(() => {
    if (!token) { navigate('/'); return; }

    const fetchPost = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/feed/${postId}`, { headers: { Authorization: `Bearer ${token}` } });
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
        console.log('댓글 데이터:', JSON.stringify(data.comments, null, 2)); // ← 추가
        setComments(data.success ? (data.comments ?? []) : []);
      } catch { setComments([]); }
      finally { setCommLoading(false); }
    };

    fetchPost();
    fetchComments();
  }, [postId, token, navigate]);

  // ── 작성자 클릭 ────────────────────────
  const handleProfileClick = useCallback((writerNickname) => {
    if (!writerNickname) return;
    navigate(writerNickname === myNickname ? '/mypage' : `/user/${writerNickname}`);
  }, [myNickname, navigate]);

  // ── 좋아요 ──────────────────────────────
  const handleLike = async () => {
    const next = !liked;
    setLiked(next); setLikeCount(c => c + (next ? 1 : -1));
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

  // ── 공유하기 ────────────────────────────
  const handleShare = async () => {
    const url = window.location.href;
    try { await navigator.clipboard.writeText(url); }
    catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setShareOpen(true);
    // 공유 카운트 서버 반영 (fire-and-forget)
    fetch(`${API}/feed/${postId}/share`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
  };

  const handleAddComment = async () => {
    if (isCommentEmpty(newComment) || submitting) return;

    const currentReplyTarget = replyTarget; // ✅ null되기 전에 미리 저장

    const optimistic = {
      id: Date.now(),
      COMMENT_ID: Date.now(),
      WRITER: myNickname || '나',
      CONTENT: newComment,
      PARENT_ID: currentReplyTarget?.COMMENT_ID ?? null,
      replies: [],
    };

    // Optimistic UI
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
        if (currentReplyTarget) { // ✅ replyTarget 대신 currentReplyTarget 사용
          setComments(prev => replaceInTree(prev, optimistic.COMMENT_ID, serverComment));
        } else {
          setComments(c => c.map(cm =>
            (cm.COMMENT_ID === optimistic.COMMENT_ID || cm.id === optimistic.id)
              ? serverComment
              : cm
          ));
        }
      }
    } catch { /* optimistic stays */ }
    finally { setSubmitting(false); }
  };

  // ──────────────────────────────────────
  if (loading) {
    return (
      <ThemeProvider theme={theme}><CssBaseline />
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
          <Box sx={{ height: 56, borderBottom: '1px solid #E2E8F0', backgroundColor: '#fff' }} />
          <PostSkeleton />
        </Box>
      </ThemeProvider>
    );
  }
  if (!feed) return null;

  const imageList = feed.IMAGES || feed.images
    ? (feed.IMAGES || feed.images).split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const meta = tagMeta(feed.TAG || feed.tag);

  // 본문 <pre> 파싱 → 복사 버튼 래핑
  const renderContentWithCopy = (html) => {
    if (!html) return null;
    const resolved = resolveImageSrc(html);
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

  const totalComments = countComments(comments);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

        {/* ── Top bar ── */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(248,250,252,0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0' }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => navigate('/feed')} sx={{ color: '#64748B' }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/feed')}>
              <Box sx={{ width: 26, height: 26, borderRadius: 1, backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.7rem' }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: '#0F172A' }}>CtrlE</Typography>
            </Box>
            <Box sx={{ flex: 1 }} />
            {/* 조회수 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
              <VisibilityOutlined sx={{ fontSize: 15, color: '#CBD5E1' }} />
              <Typography sx={{ fontSize: '0.75rem', color: '#CBD5E1', fontWeight: 600 }}>
                {(feed.VIEW_COUNT ?? feed.viewCount ?? 0).toLocaleString()}
              </Typography>
            </Box>
            <Chip label={feed.TAG || feed.tag || 'General'} size="small"
              sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.72rem', height: 24, border: `1px solid ${meta.color}22` }} />
          </Box>
        </Box>

        {/* ── Content ── */}
        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: { xs: 3, md: 5 } }}>

          {/* 게시물 본문 카드 */}
          <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2.5, p: { xs: 2.5, md: 4 }, mb: 3, animation: 'fadeUp 0.4s ease both' }}>

            {/* 작성자 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', '&:hover .writer-name': { color: '#2563EB' } }}
                onClick={() => handleProfileClick(feed.WRITER || feed.writer)}>
                <Avatar src={feed.AVATAR || feed.avatar || undefined}
                  sx={{ width: 44, height: 44, backgroundColor: '#0F172A', fontWeight: 800, fontSize: '1rem', boxShadow: '0 2px 10px rgba(15,23,42,0.12)', transition: 'all 0.2s', '&:hover': { boxShadow: '0 4px 16px rgba(37,99,235,0.25)' } }}>
                  {getInitial(feed.WRITER || feed.writer)}
                </Avatar>
                <Box>
                  <Typography className="writer-name" sx={{ fontWeight: 700, fontSize: '0.92rem', color: '#0F172A', lineHeight: 1.2, transition: 'color 0.15s' }}>
                    {feed.WRITER || feed.writer || 'Unknown'}
                  </Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem', mt: 0.2 }}>
                    {(feed.ROLE || feed.role || 'Developer')}
                    {(feed.CREATED_AT || feed.createdAt) ? ` · ${formatDate(feed.CREATED_AT || feed.createdAt)}` : ''}
                  </Typography>
                </Box>
              </Box>

              {/* 신고 / 공유 */}
              <Stack direction="row" spacing={0.5}>
                <Tooltip title="공유하기" placement="top">
                  <IconButton size="small" onClick={handleShare}
                    sx={{ color: '#94A3B8', borderRadius: 1.5, border: '1px solid #F1F5F9', '&:hover': { backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }, transition: 'all 0.15s' }}>
                    <ShareOutlined sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="신고하기" placement="top">
                  <IconButton size="small" onClick={() => setReportOpen(true)}
                    sx={{ color: '#94A3B8', borderRadius: 1.5, border: '1px solid #F1F5F9', '&:hover': { backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }, transition: 'all 0.15s' }}>
                    <FlagOutlined sx={{ fontSize: 17 }} />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Box>

            {/* 제목 */}
            <Typography sx={{ fontWeight: 800, fontSize: { xs: '1.3rem', md: '1.65rem' }, color: '#0F172A', lineHeight: 1.3, letterSpacing: '-0.02em', mb: 3 }}>
              {feed.TITLE || feed.title}
            </Typography>

            {/* 이미지 */}
            {imageList.length > 0 && <ImageGallery images={imageList} />}

            {/* 본문 */}
            {renderContentWithCopy(feed.DESCRIPTION || feed.description || feed.CONTENT || feed.content)}

            {/* 별도 code prop */}
            {(feed.CODE || feed.code) && <CodeBlock code={feed.CODE || feed.code} />}

            {/* 액션 바 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 3, mt: 2, borderTop: '1px solid #E2E8F0' }}>
              <Stack direction="row" spacing={1}>
                <Button size="small"
                  startIcon={liked ? <Favorite sx={{ fontSize: 17, color: '#EF4444' }} /> : <FavoriteBorderOutlined sx={{ fontSize: 17 }} />}
                  onClick={handleLike}
                  sx={{ color: liked ? '#EF4444' : '#64748B', fontWeight: 600, fontSize: '0.82rem', textTransform: 'none', px: 1.5, borderRadius: 1.5, '&:hover': { backgroundColor: '#FEF2F2', color: '#EF4444' }, transition: 'all 0.15s' }}>
                  {likeCount}
                </Button>
                <Button size="small"
                  startIcon={<ChatBubbleOutline sx={{ fontSize: 17 }} />}
                  onClick={() => commentListRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  sx={{ color: '#64748B', fontWeight: 600, fontSize: '0.82rem', textTransform: 'none', px: 1.5, borderRadius: 1.5, '&:hover': { backgroundColor: '#EFF6FF', color: '#2563EB' }, transition: 'all 0.15s' }}>
                  {totalComments}
                </Button>
              </Stack>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Tooltip title="공유하기" placement="top">
                  <IconButton size="small" onClick={handleShare} sx={{ color: '#94A3B8', '&:hover': { color: '#2563EB' } }}>
                    <ShareOutlined sx={{ fontSize: 19 }} />
                  </IconButton>
                </Tooltip>
                <IconButton size="small" onClick={handleBookmark}>
                  {bookmarked
                    ? <Bookmark sx={{ fontSize: 20, color: '#2563EB' }} />
                    : <BookmarkBorderOutlined sx={{ fontSize: 20, color: '#94A3B8' }} />
                  }
                </IconButton>
              </Stack>
            </Box>
          </Box>

          {/* ── 댓글 섹션 ── */}
          <Box sx={{ animation: 'fadeUp 0.4s ease 0.1s both' }}>
            <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2.5 }}>

              {/* 헤더 */}
              <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <ChatBubbleOutline sx={{ fontSize: 18, color: '#64748B' }} />
                <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>댓글</Typography>
                <Box sx={{ px: 1.2, py: 0.15, backgroundColor: '#F1F5F9', borderRadius: 1, border: '1px solid #E2E8F0' }}>
                  <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B' }}>{totalComments}</Typography>
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
                    <ChatBubbleOutline sx={{ fontSize: 32, color: '#E2E8F0', mb: 1.5 }} />
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem', fontWeight: 500 }}>첫 댓글을 남겨보세요!</Typography>
                  </Box>
                ) : (
                  comments.map((c, i) => (
                    <CommentItem
                      key={c.COMMENT_ID || c.id}
                      comment={c}
                      index={i}
                      depth={0}
                      onReply={setReplyTarget}
                      myNickname={myNickname}
                      navigate={navigate}
                      postWriter={feed.WRITER || feed.writer}
                    />
                  ))
                )}
              </Box>

              {/* 댓글 입력 */}
              <Box sx={{ px: 3, py: 3, borderTop: '1px solid #F1F5F9', backgroundColor: '#FAFBFC' }}>

                {/* 답글 대상 배너 */}
                {replyTarget && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, mb: 1.5, backgroundColor: '#EFF6FF', borderRadius: 1.5, border: '1px solid #BFDBFE', animation: 'slideDown 0.2s ease both' }}>
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
                  <Avatar sx={{ width: 34, height: 34, fontSize: '0.7rem', backgroundColor: '#0F172A', flexShrink: 0, mt: 0.5, fontWeight: 800 }}>
                    {getInitial(myNickname)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={quillBoxSx}>
                      <ReactQuill
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
                        sx={{ backgroundColor: '#0F172A', color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', px: 2.5, py: 0.8, borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#2563EB' }, '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' }, transition: 'all 0.15s' }}>
                        {replyTarget ? '답글 등록' : '댓글 등록'}
                      </Button>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        postId={postId}
        token={token}
        onSuccess={() => setReportSuccessOpen(true)}
        onDuplicate={() => setReportDuplicateOpen(true)}
      />

      {/* ── 공유 토스트 ── */}
      <ShareToast open={shareOpen} onClose={() => setShareOpen(false)} />

      {/* ← 아래 2개 추가 */}
      <Snackbar open={reportSuccessOpen} autoHideDuration={2500} onClose={() => setReportSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />}
          sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          신고가 접수되었습니다.
        </Alert>
      </Snackbar>

      <Snackbar open={reportDuplicateOpen} autoHideDuration={2500} onClose={() => setReportDuplicateOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" icon={<FlagOutlined fontSize="inherit" />}
          sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          이미 신고한 게시글입니다.
        </Alert>
      </Snackbar>
    </ThemeProvider>
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