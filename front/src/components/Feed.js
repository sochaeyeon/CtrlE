import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Button, Chip, Divider, IconButton, InputBase,
  Stack, Typography, createTheme, ThemeProvider, CssBaseline,
  Tooltip, Menu, MenuItem, Badge, Dialog, List, ListItem,
  ListItemAvatar, ListItemText, CircularProgress,
  Snackbar, Alert, Modal, Backdrop, Fade,
  Radio, RadioGroup, FormControlLabel, TextField,
} from '@mui/material';
import {
  FavoriteBorderOutlined, Favorite,
  ChatBubbleOutline, BookmarkBorderOutlined, Bookmark,
  MoreHoriz, Add, Search, NotificationsNoneOutlined,
  Close, LocalFireDepartment, PeopleAlt,
  ShareOutlined, Check, Edit, Delete, Flag,
  ViewList, Category, Layers, FlagOutlined,
  ArrowUpward, FavoriteBorder,
} from '@mui/icons-material';
import { BugReport, HelpOutline } from '@mui/icons-material';

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
        @keyframes heartPop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.5); }
          60%  { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes bookmarkPop {
          0%   { transform: scale(1) rotate(0deg); }
          40%  { transform: scale(1.4) rotate(-8deg); }
          70%  { transform: scale(0.9) rotate(4deg); }
          100% { transform: scale(1) rotate(0deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes notiIn {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `,
    },
  },
});

const FIXED_CATEGORIES = [
  { label: '전체', value: null, icon: <ViewList sx={{ fontSize: 13 }} /> },
  { label: '트러블슈팅', value: 'ERROR', icon: <BugReport sx={{ fontSize: 13 }} /> },
  { label: '일반 질문', value: 'QUESTION', icon: <HelpOutline sx={{ fontSize: 13 }} /> },
  { label: '자유 게시판', value: 'FREE', icon: <ChatBubbleOutline sx={{ fontSize: 13 }} /> },
];

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
const API = 'http://localhost:3010';

const resolveImageSrc = (src) =>
  src ? src.replace(/src="\/uploads/g, `src="${API}/uploads`) : '';

const resolveAvatarSrc = (src) => {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  return `${API}${src}`;
};

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

// ── 시간 포맷: "방금 전", "3분 전", "2시간 전", "2025년 6월 3일"
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

// ──────────────────────────────────────────
//  ReportModal (PostDetail과 동일)
// ──────────────────────────────────────────
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
        onSuccess();
      } else if (res.status === 409) {
        onClose();
        onDuplicate();
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
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90vw', sm: 440 },
          backgroundColor: '#fff', borderRadius: 3,
          boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
          overflow: 'hidden', outline: 'none',
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
//  ConfirmModal (alert/confirm 대체)
// ──────────────────────────────────────────
const ConfirmModal = ({ open, title, message, confirmLabel = '확인', confirmColor = '#EF4444', onConfirm, onClose }) => (
  <Modal open={open} onClose={onClose} closeAfterTransition
    slots={{ backdrop: Backdrop }}
    slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' } } }}
  >
    <Fade in={open}>
      <Box sx={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '88vw', sm: 380 },
        backgroundColor: '#fff', borderRadius: 3,
        boxShadow: '0 20px 60px rgba(15,23,42,0.16)',
        overflow: 'hidden', outline: 'none',
      }}>
        <Box sx={{ px: 3, py: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', mb: 1 }}>{title}</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#64748B', lineHeight: 1.7 }}>{message}</Typography>
        </Box>
        <Box sx={{ px: 3, pb: 3, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', color: '#64748B', px: 2, borderRadius: 1.5, border: '1px solid #E2E8F0', '&:hover': { backgroundColor: '#F8FAFC' } }}>
            취소
          </Button>
          <Button onClick={onConfirm} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#fff', px: 2.5, borderRadius: 1.5, backgroundColor: confirmColor, boxShadow: 'none', '&:hover': { filter: 'brightness(0.9)' } }}>
            {confirmLabel}
          </Button>
        </Box>
      </Box>
    </Fade>
  </Modal>
);

// ──────────────────────────────────────────
//  NotificationModal
// ──────────────────────────────────────────
const NOTI_LABELS = {
  LIKE: { text: '회원님의 게시글을 좋아합니다.', color: '#EF4444' },
  COMMENT: { text: '회원님의 게시글에 댓글을 남겼습니다.', color: '#2563EB' },
  FOLLOW: { text: '회원님을 팔로우하기 시작했습니다.', color: '#10B981' },
  FOLLOW_REQUEST: { text: '팔로우를 요청했습니다.', color: '#F97316' },
  FOLLOW_ACCEPTED: { text: '팔로우 요청을 수락했습니다.', color: '#10B981' },
};
const FollowRequestButtons = ({ requesterId, token, onHandled }) => {
  const [loading, setLoading] = useState(null); // 'accept' | 'reject' | null

  const handle = async (action) => {
    setLoading(action);
    try {
      await fetch(`${API}/user/follow/${requesterId}/${action}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      onHandled(action);
    } catch { /* ignore */ }
    finally { setLoading(null); }
  };

  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <Button size="small" variant="contained"
        disabled={!!loading}
        onClick={() => handle('accept')}
        sx={{
          fontSize: '0.72rem', fontWeight: 700, textTransform: 'none',
          px: 1.5, py: 0.3, borderRadius: 1, minWidth: 0,
          backgroundColor: '#0F172A', color: '#fff', boxShadow: 'none',
          '&:hover': { backgroundColor: '#2563EB' },
        }}
      >
        {loading === 'accept' ? <CircularProgress size={11} sx={{ color: '#fff' }} /> : '수락'}
      </Button>
      <Button size="small" variant="outlined"
        disabled={!!loading}
        onClick={() => handle('reject')}
        sx={{
          fontSize: '0.72rem', fontWeight: 700, textTransform: 'none',
          px: 1.5, py: 0.3, borderRadius: 1, minWidth: 0,
          borderColor: '#E2E8F0', color: '#64748B',
          '&:hover': { borderColor: '#94A3B8', backgroundColor: '#F8FAFC' },
        }}
      >
        {loading === 'reject' ? <CircularProgress size={11} sx={{ color: '#64748B' }} /> : '거절'}
      </Button>
    </Stack>
  );
};
const NotificationModal = ({ open, onClose, token, navigate }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) setNotifications(d.notifications ?? []);
        // 전체 읽음 처리
        fetch(`${API}/notifications/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [open, token]);

  const handleClick = (n) => {
    onClose();
    if (n.TARGET_TYPE === 'POST' && n.TARGET_ID) navigate(`/post/${n.TARGET_ID}`);
  };

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(2px)' } } }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'fixed', top: 64, right: { xs: 12, md: 32 },
          width: { xs: 'calc(100vw - 24px)', sm: 380 },
          maxHeight: '70vh',
          backgroundColor: '#fff', borderRadius: 2.5,
          boxShadow: '0 20px 60px rgba(15,23,42,0.16)',
          border: '1px solid #E2E8F0',
          overflow: 'hidden', outline: 'none',
          animation: 'notiIn 0.2s ease both',
        }}>
          {/* 헤더 */}
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>알림</Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
              <Close sx={{ fontSize: 17 }} />
            </IconButton>
          </Box>

          {/* 목록 */}
          <Box sx={{ overflowY: 'auto', maxHeight: 'calc(70vh - 56px)' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                <CircularProgress size={22} sx={{ color: '#2563EB' }} />
              </Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <NotificationsNoneOutlined sx={{ fontSize: 36, color: '#E2E8F0', mb: 1 }} />
                <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>알림이 없습니다.</Typography>
              </Box>
            ) : (
              notifications.map((n, i) => {
                const meta = NOTI_LABELS[n.NOTI_TYPE] || { text: '새 알림', color: '#64748B' };
                const isUnread = n.IS_READ === 'N';
                return (
                  <Box key={n.NOTI_ID || i}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1.5,
                      px: 2.5, py: 2,
                      backgroundColor: isUnread ? '#F0F7FF' : 'transparent',
                      borderBottom: '1px solid #F8FAFC',
                      transition: 'background 0.15s',
                      '&:hover': { backgroundColor: '#F8FAFC' },
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    {/* 아바타 — FOLLOW_REQUEST 아닐 때만 클릭 이동 */}
                    <Box
                      sx={{ position: 'relative', flexShrink: 0, cursor: n.NOTI_TYPE !== 'FOLLOW_REQUEST' ? 'pointer' : 'default' }}
                      onClick={() => n.NOTI_TYPE !== 'FOLLOW_REQUEST' && handleClick(n)}
                    >
                      <Avatar
                        src={resolveAvatarSrc(n.SENDER_AVATAR)}
                        sx={{ width: 36, height: 36, backgroundColor: '#0F172A', fontSize: '0.8rem', fontWeight: 800 }}
                      >
                        {getInitial(n.SENDER_NAME)}
                      </Avatar>
                      {isUnread && (
                        <Box sx={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: '50%', backgroundColor: meta.color, border: '2px solid #fff' }} />
                      )}
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{ fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.5, cursor: n.NOTI_TYPE !== 'FOLLOW_REQUEST' ? 'pointer' : 'default' }}
                        onClick={() => n.NOTI_TYPE !== 'FOLLOW_REQUEST' && handleClick(n)}
                      >
                        <Box component="span" sx={{ fontWeight: 700 }}>{n.SENDER_NAME || '알 수 없음'}</Box>
                        {' '}{meta.text}
                      </Typography>
                      <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8', mt: 0.2 }}>
                        {formatRelativeTime(n.CREATED_AT)}
                      </Typography>

                      {/* 팔로우 요청일 때만 수락/거절 버튼 */}
                      {n.NOTI_TYPE === 'FOLLOW_REQUEST' && (
                        <FollowRequestButtons
                          requesterId={n.SENDER_ID}
                          token={token}
                          onHandled={() => setNotifications(prev =>
                            prev.filter(x => x.NOTI_ID !== n.NOTI_ID)
                          )}
                        />
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

// ──────────────────────────────────────────
//  NavBar
// ──────────────────────────────────────────
const NavBar = ({ onLogout, notificationCount, onNotificationClick, token }) => {
  const navigate = useNavigate();

  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: 'rgba(248,250,252,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E2E8F0',
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, cursor: 'pointer' }} onClick={() => navigate('/feed')}>
          <Box sx={{ width: 28, height: 28, borderRadius: 1, backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.75rem', lineHeight: 1 }}>{'<>'}</Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#0F172A' }}>CtrlE</Typography>
        </Box>

        {/* Search */}
        <Box sx={{
          flex: 1, maxWidth: 380,
          display: 'flex', alignItems: 'center', gap: 1,
          backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0',
          borderRadius: 2, px: 1.5, py: 0.6,
          '&:focus-within': { borderColor: '#2563EB', backgroundColor: '#fff' },
          transition: 'all 0.2s',
        }}>
          <Search sx={{ color: '#94A3B8', fontSize: 17 }} />
          <InputBase
            placeholder="버그, 기술, 개발자 검색..."
            sx={{ fontSize: '0.83rem', color: '#0F172A', flex: 1, '& input::placeholder': { color: '#94A3B8' } }}
          />
        </Box>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="알림">
            <IconButton size="small" onClick={onNotificationClick}>
              <Badge
                badgeContent={notificationCount > 0 ? notificationCount : null}
                color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}
              >
                <NotificationsNoneOutlined sx={{ fontSize: 20, color: '#64748B' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/register')}
            sx={{
              backgroundColor: '#0F172A', color: '#fff', textTransform: 'none',
              fontWeight: 700, fontSize: '0.8rem', px: 2, py: 0.9, borderRadius: 1.5,
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.25)', transform: 'translateY(-1px)' },
              transition: 'all 0.2s',
            }}
          >
            새 게시물
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

// ──────────────────────────────────────────
//  PostCard
// ──────────────────────────────────────────
const PostCard = ({ feed, token, onOpenDetail, myNickname, onDelete }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(feed.liked ?? false);
  const [likeCount, setLikeCount] = useState(feed.likes ?? 0);
  const [bookmarked, setBookmarked] = useState(feed.bookmarked ?? false);
  const [likeAnim, setLikeAnim] = useState(false);
  const [bookmarkAnim, setBookmarkAnim] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);

  // 신고 모달 상태
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccessOpen, setReportSuccessOpen] = useState(false);
  const [reportDuplicateOpen, setReportDuplicateOpen] = useState(false);

  // 삭제 확인 모달
  const [deleteOpen, setDeleteOpen] = useState(false);

  const imageList = feed.images ? feed.images.split(',') : [];
  const isMyPost = myNickname && (feed.writer === myNickname || feed.WRITER === myNickname);

  const handleLike = async (e) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    setLikeAnim(true);
    setTimeout(() => setLikeAnim(false), 500);
    try {
      await fetch(`${API}/feed/${feed.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setLiked(!next);
      setLikeCount(c => c + (next ? -1 : 1));
    }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next);
    setBookmarkAnim(true);
    setTimeout(() => setBookmarkAnim(false), 500);
    try {
      await fetch(`${API}/feed/${feed.id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      setBookmarked(!next);
    }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${feed.id}`;
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
    fetch(`${API}/feed/${feed.id}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => { });
  };

  const handleMenuClick = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleMenuClose = (e) => {
    e?.stopPropagation();
    setAnchorEl(null);
  };
  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      await fetch(`${API}/feed/${feed.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      onDelete(feed.id);
    } catch { /* ignore */ }
  };

  const tag = feed.tag || feed.category || 'General';

  return (
    <>
      <Box
        onClick={() => onOpenDetail(feed)}
        sx={{
          backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2,
          p: 3, cursor: 'pointer', animation: 'fadeUp 0.4s ease both',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' },
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={resolveAvatarSrc(feed.avatar)}
              sx={{ width: 36, height: 36, backgroundColor: '#0F172A', fontWeight: 800, fontSize: '0.9rem' }}
            >
              {getInitial(feed.writer)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', lineHeight: 1 }}>
                {feed.writer || 'Unknown'}
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 0.2 }}>
                {feed.role || ''}{feed.role && feed.createdAt ? ' · ' : ''}{formatRelativeTime(feed.createdAt)}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={tag}
              size="small"
              sx={{
                backgroundColor: '#F1F5F9', color: '#475569',
                fontWeight: 600, fontSize: '0.7rem', height: 22,
                border: '1px solid #E2E8F0',
              }}
            />
            <IconButton size="small" onClick={handleMenuClick} sx={{ color: '#CBD5E1', '&:hover': { color: '#64748B' } }}>
              <MoreHoriz sx={{ fontSize: 18 }} />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              onClick={(e) => e.stopPropagation()}
              PaperProps={{ sx: { boxShadow: '0 8px 30px rgba(0,0,0,0.08)', borderRadius: 2, border: '1px solid #E2E8F0', minWidth: 120 } }}
            >
              {isMyPost ? [
                <MenuItem key="edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(null);
                    navigate(`/edit/${feed.id}`);
                  }}
                  sx={{ fontSize: '0.8rem', color: '#475569', gap: 1 }}>
                  <Edit sx={{ fontSize: 15, color: '#94A3B8' }} /> 수정하기
                </MenuItem>,
                <MenuItem key="delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(null);
                    setDeleteOpen(true);
                  }}
                  sx={{ fontSize: '0.8rem', color: '#EF4444', gap: 1 }}>
                  <Delete sx={{ fontSize: 15, color: '#EF4444' }} /> 삭제하기
                </MenuItem>,
              ] : [
                <MenuItem key="report"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchorEl(null);
                    setReportOpen(true);
                  }}
                  sx={{ fontSize: '0.8rem', color: '#475569', gap: 1 }}>
                  <Flag sx={{ fontSize: 15, color: '#94A3B8' }} /> 신고하기
                </MenuItem>,
              ]}
            </Menu>
          </Box>
        </Box>

        {/* Image */}
        {imageList.length > 0 && (
          <Box sx={{ width: '100%', paddingTop: '52%', position: 'relative', borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
            <Box component="img"
              src={imageList[0].startsWith('http') ? imageList[0] : `${API}${imageList[0]}`} 
              alt={feed.title}
              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </Box>
        )}

        {/* Title */}
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', mb: 1, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
          {feed.title}
        </Typography>

        {/* Description */}
        <Typography
          sx={{
            color: '#64748B', fontSize: '0.85rem', lineHeight: 1.75,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}
          dangerouslySetInnerHTML={{ __html: resolveImageSrc(feed.description || '') }}
        />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2.5, pt: 2, borderTop: '1px solid #F1F5F9' }}>
          <Stack direction="row" spacing={0.5}>
            {/* 좋아요 */}
            <Button
              size="small"
              startIcon={
                <Box sx={{
                  display: 'flex', alignItems: 'center',
                  animation: likeAnim ? 'heartPop 0.45s ease both' : 'none'
                }}>
                  {liked
                    ? <Favorite sx={{ fontSize: 16, color: '#EF4444' }} />
                    : <FavoriteBorderOutlined sx={{ fontSize: 16 }} />
                  }
                </Box>
              }
              onClick={handleLike}
              sx={{
                color: liked ? '#EF4444' : '#64748B',
                fontWeight: 600, fontSize: '0.8rem', textTransform: 'none',
                px: 1.2, borderRadius: 1.5, minWidth: 0,
                '&:hover': { backgroundColor: '#FEF2F2', color: '#EF4444' },
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              {likeCount}
            </Button>

            <Button
              size="small"
              startIcon={<ChatBubbleOutline sx={{ fontSize: 16 }} />}
              onClick={(e) => { e.stopPropagation(); onOpenDetail(feed); }}
              sx={{
                color: '#64748B', fontWeight: 600, fontSize: '0.8rem', textTransform: 'none',
                px: 1.2, borderRadius: 1.5, minWidth: 0,
                '&:hover': { backgroundColor: '#EFF6FF', color: '#2563EB' },
                transition: 'all 0.15s',
              }}
            >
              {feed.commentCount ?? 0}
            </Button>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="링크 복사" placement="top">
              <IconButton size="small" onClick={handleShare}
                sx={{ color: '#94A3B8', '&:hover': { color: '#2563EB' }, transition: 'color 0.15s' }}>
                <ShareOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            {/* 북마크 */}
            <IconButton size="small" onClick={handleBookmark} sx={{ transition: 'color 0.15s' }}>
              <Box sx={{ animation: bookmarkAnim ? 'bookmarkPop 0.45s ease both' : 'none', display: 'flex' }}>
                {bookmarked
                  ? <Bookmark sx={{ fontSize: 19, color: '#2563EB' }} />
                  : <BookmarkBorderOutlined sx={{ fontSize: 19, color: '#94A3B8' }} />
                }
              </Box>
            </IconButton>
          </Stack>
        </Box>

        {(feed.commentCount ?? 0) > 0 && (
          <Typography
            onClick={(e) => { e.stopPropagation(); onOpenDetail(feed); }}
            sx={{ color: '#CBD5E1', fontSize: '0.78rem', mt: 1, cursor: 'pointer', fontWeight: 500, '&:hover': { color: '#2563EB' }, transition: 'color 0.15s' }}
          >
            댓글 {feed.commentCount}개 모두 보기
          </Typography>
        )}
      </Box>

      {/* 공유 토스트 */}
      <Snackbar open={shareOpen} autoHideDuration={2000} onClose={() => setShareOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />}
          sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          링크가 클립보드에 복사되었습니다!
        </Alert>
      </Snackbar>

      {/* 삭제 확인 모달 */}
      <ConfirmModal
        open={deleteOpen}
        title="게시글 삭제"
        message="이 게시글을 삭제하시겠습니까? 삭제한 게시글은 복구할 수 없습니다."
        confirmLabel="삭제"
        confirmColor="#EF4444"
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteOpen(false)}
      />

      {/* 신고 모달 */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        postId={feed.id}
        token={token}
        onSuccess={() => setReportSuccessOpen(true)}
        onDuplicate={() => setReportDuplicateOpen(true)}
      />

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
    </>
  );
};

// ──────────────────────────────────────────
//  Sidebar
// ──────────────────────────────────────────
const Sidebar = ({ trending, suggestions, loadingTrending, loadingSuggestions, token }) => {
  const [followed, setFollowed] = useState({});

  const handleFollow = async (s) => {
    const prev = followed[s.USER_ID] || 'NONE';
    setFollowed(f => ({ ...f, [s.USER_ID]: prev === 'NONE' ? 'OPTIMISTIC' : 'NONE' }));
    try {
      const res = await fetch(`${API}/user/follow/${s.USER_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setFollowed(f => ({ ...f, [s.USER_ID]: data.status })); // 'NONE' | 'PENDING' | 'ACCEPTED'
      }
    } catch {
      setFollowed(f => ({ ...f, [s.USER_ID]: prev }));
    }
  };

  return (
    <Stack spacing={2.5}>
      {/* Trending */}
      <Box sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalFireDepartment sx={{ fontSize: 15, color: '#F97316' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', letterSpacing: '-0.01em' }}>
            트렌딩 태그
          </Typography>
        </Box>

        {loadingTrending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={18} sx={{ color: '#2563EB' }} />
          </Box>
        ) : trending.length === 0 ? (
          <Typography sx={{ color: '#CBD5E1', fontSize: '0.8rem', textAlign: 'center', py: 1 }}>
            트렌딩 태그가 없습니다.
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            {trending.map((t, i) => (
              <Box key={t.TAG_NAME || t.tag} sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', '&:hover .tag-label': { color: '#2563EB' },
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: '#E2E8F0', fontWeight: 700, fontSize: '0.72rem', width: 16 }}>{i + 1}</Typography>
                  <Typography className="tag-label" sx={{ fontWeight: 600, fontSize: '0.83rem', color: '#475569', transition: 'color 0.15s' }}>
                    #{t.TAG_NAME || t.tag}
                  </Typography>
                </Box>
                <Typography sx={{ color: '#CBD5E1', fontSize: '0.72rem' }}>
                  {(t.POST_COUNT || t.count || 0).toLocaleString()}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* Suggestions */}
      <Box sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PeopleAlt sx={{ fontSize: 15, color: '#64748B' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', letterSpacing: '-0.01em' }}>
            팔로우 추천
          </Typography>
        </Box>

        {loadingSuggestions ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={18} sx={{ color: '#2563EB' }} />
          </Box>
        ) : suggestions.length === 0 ? (
          <Typography sx={{ color: '#CBD5E1', fontSize: '0.8rem', textAlign: 'center', py: 1 }}>
            추천 사용자가 없습니다.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {suggestions.map(s => (
              <Box key={s.USER_ID || s.handle} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                  <Avatar
                    src={resolveAvatarSrc(s.AVATAR || s.avatar)}
                    sx={{ width: 32, height: 32, backgroundColor: '#0F172A', fontWeight: 800, fontSize: '0.8rem' }}
                  >
                    {getInitial(s.NICKNAME || s.name)}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.2 }}>
                      {s.NICKNAME || s.name}
                    </Typography>
                    <Typography sx={{ color: '#CBD5E1', fontSize: '0.72rem' }}>
                      {s.BIO_SHORT || s.role || ''}
                    </Typography>
                  </Box>
                </Box>
                <Button
                  size="small"
                  onClick={() => handleFollow(s)}
                  sx={{
                    fontSize: '0.72rem', fontWeight: 700, textTransform: 'none',
                    minWidth: 0, px: 1.5, py: 0.4, borderRadius: 1,
                    ...({
                      ACCEPTED: { backgroundColor: '#0F172A', color: '#fff', boxShadow: 'none', '&:hover': { backgroundColor: '#2563EB' } },
                      PENDING: { backgroundColor: '#F1F5F9', color: '#64748B', boxShadow: 'none', border: '1px solid #E2E8F0' },
                      OPTIMISTIC: { backgroundColor: '#F1F5F9', color: '#64748B', boxShadow: 'none', border: '1px solid #E2E8F0' },
                      NONE: { border: '1px solid #E2E8F0', color: '#475569', backgroundColor: 'transparent', '&:hover': { borderColor: '#CBD5E1' } },
                    }[followed[s.USER_ID] || 'NONE']),
                  }}
                >
                  {{ ACCEPTED: '팔로잉', PENDING: '요청됨', OPTIMISTIC: '요청됨', NONE: '팔로우' }[followed[s.USER_ID] || 'NONE']}
                </Button>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      <Typography sx={{ color: '#E2E8F0', fontSize: '0.68rem', lineHeight: 1.8, px: 0.5 }}>
        CtrlE · 이용약관 · 개인정보처리방침<br />
        © 2025 CtrlE Inc. All rights reserved.
      </Typography>
    </Stack>
  );
};

// ──────────────────────────────────────────
//  Main Feed
// ──────────────────────────────────────────
export default function Feed() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const myNickname = (() => {
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
      return payload.nickname || null;
    } catch { return null; }
  })();

  const [feeds, setFeeds] = useState([]);
  const [activeFilter, setActiveFilter] = useState('전체');
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  // Sidebar
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Notification
  const [notificationCount, setNotificationCount] = useState(0);
  const [notiModalOpen, setNotiModalOpen] = useState(false);

  // ── loadFeeds ──────────────────────────
  const loadFeeds = useCallback(async () => {
    setLoadingFeeds(true);
    try {
      const response = await fetch(`${API}/feed/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) setFeeds(data.feeds ?? []);
    } catch (err) {
      console.error('피드 로드 실패:', err);
    } finally {
      setLoadingFeeds(false);
    }
  }, [token]);

  // ── loadSidebar ────────────────────────
  const loadSidebar = useCallback(async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch(`${API}/feed/trending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setTrending(data.tags ?? []);
    } catch {
      setTrending([]);
    } finally {
      setLoadingTrending(false);
    }

    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${API}/user/suggestions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setSuggestions(data.users ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [token]);

  // ── loadNotifications ──────────────────
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) setNotificationCount(data.unread_count ?? 0);
    } catch {
      setNotificationCount(0);
    }
  }, [token]);

  useEffect(() => {
    const oauthToken = sessionStorage.getItem('oauthToken');
    if (oauthToken) {
      localStorage.setItem('accessToken', oauthToken);
      sessionStorage.removeItem('oauthToken');
    } else if (!token) {
      navigate('/');
      return;
    }
    loadFeeds();
    loadSidebar();
    loadNotifications();
  }, [token, navigate, loadFeeds, loadSidebar, loadNotifications]);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/');
  };

  const handleOpenDetail = (feed) => navigate(`/post/${feed.id}`);

  const handleNotificationClick = () => {
    setNotiModalOpen(true);
    setNotificationCount(0); // 낙관적 초기화
  };

  const dynamicTagLabels = trending.map(t => t.TAG_NAME || t.tag).filter(Boolean);

  const filteredFeeds = (() => {
    if (activeFilter === '전체') return feeds;
    const found = FIXED_CATEGORIES.find(c => c.label === activeFilter);
    if (found?.value) {
      return feeds.filter(f => (f.category || f.tag || '') === found.value);
    }
    return feeds.filter(f => {
      const tagArr = Array.isArray(f.tags) ? f.tags : (f.tags ? f.tags.split(',') : []);
      return tagArr.includes(activeFilter);
    });
  })();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

        <NavBar
          onLogout={handleLogout}
          notificationCount={notificationCount}
          onNotificationClick={handleNotificationClick}
          token={token}
        />

        {/* ── Filter bar ── */}
        <Box sx={{
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: 'rgba(248,250,252,0.9)',
          backdropFilter: 'blur(8px)',
          position: 'sticky', top: 57, zIndex: 90,
        }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
            <Stack direction="row" spacing={0} alignItems="center"
              sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>

              {/* 고정 카테고리 3개 */}
              {FIXED_CATEGORIES.map(t => (
                <Button
                  key={t.label}
                  size="small"
                  startIcon={t.icon}
                  onClick={() => setActiveFilter(t.label)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: activeFilter === t.label ? 700 : 500,
                    fontSize: '0.82rem', whiteSpace: 'nowrap',
                    px: 2, py: 1.8, borderRadius: 0,
                    color: activeFilter === t.label ? '#0F172A' : '#94A3B8',
                    borderBottom: activeFilter === t.label ? '2px solid #2563EB' : '2px solid transparent',
                    '&:hover': { color: '#0F172A', backgroundColor: 'transparent' },
                    transition: 'all 0.15s', minWidth: 'fit-content',
                  }}
                >
                  {t.label}
                </Button>
              ))}

              {/* 구분선 */}
              {dynamicTagLabels.length > 0 && (
                <Box sx={{ width: '1px', height: 18, backgroundColor: '#E2E8F0', mx: 1, flexShrink: 0 }} />
              )}

              {/* 동적 태그 (trending 기반) */}
              {dynamicTagLabels.map(label => (
                <Button
                  key={label}
                  size="small"
                  onClick={() => setActiveFilter(label)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: activeFilter === label ? 700 : 400,
                    fontSize: '0.8rem', whiteSpace: 'nowrap',
                    px: 1.8, py: 1.8, borderRadius: 0,
                    color: activeFilter === label ? '#2563EB' : '#94A3B8',
                    borderBottom: activeFilter === label ? '2px solid #2563EB' : '2px solid transparent',
                    '&:hover': { color: '#2563EB', backgroundColor: 'transparent' },
                    transition: 'all 0.15s', minWidth: 'fit-content',
                  }}
                >
                  #{label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* ── Main layout ── */}
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>

            {/* Feed list */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {loadingFeeds ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                  <CircularProgress sx={{ color: '#2563EB' }} />
                </Box>
              ) : filteredFeeds.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                  <Typography sx={{ color: '#CBD5E1', fontSize: '0.88rem' }}>
                    {activeFilter === '전체' ? '아직 게시물이 없습니다.' : `'${activeFilter}' 게시물이 없습니다.`}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {filteredFeeds.map((feed, i) => (
                    <Box key={feed.id} sx={{ animationDelay: `${i * 0.04}s` }}>
                      <PostCard
                        feed={feed}
                        token={token}
                        onOpenDetail={handleOpenDetail}
                        myNickname={myNickname}
                        onDelete={(id) => setFeeds(prev => prev.filter(f => f.id !== id))}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Sidebar */}
            <Box sx={{ width: 280, flexShrink: 0, display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 120 }}>
              <Sidebar
                trending={trending}
                suggestions={suggestions}
                loadingTrending={loadingTrending}
                loadingSuggestions={loadingSuggestions}
                token={token}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* 알림 모달 */}
      <NotificationModal
        open={notiModalOpen}
        onClose={() => setNotiModalOpen(false)}
        token={token}
        navigate={navigate}
      />
    </ThemeProvider>
  );
}