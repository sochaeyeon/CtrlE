import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Button, Chip, Divider, IconButton, InputBase,
  Stack, Typography, Tooltip, Menu, MenuItem, Badge, Dialog, List, ListItem,
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
  ArrowUpward, FavoriteBorder, AutoAwesome,
} from '@mui/icons-material';
import { BugReport, HelpOutline } from '@mui/icons-material';
import { useColorMode } from '../App';

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

const API = 'http://localhost:3010';

const resolveImageSrc = (src) =>
  src ? src.replace(/src="\/uploads/g, `src="${API}/uploads`) : '';

const resolveAvatarSrc = (src) => {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  return `${API}${src}`;
};

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

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

// ── 더블클릭 하트 애니메이션 오버레이 ──────────────────────
const HeartOverlay = ({ trigger, colors }) => {
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

const ReportModal = ({ open, onClose, postId, token, onSuccess, onDuplicate, colors }) => {
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
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlagOutlined sx={{ fontSize: 17, color: '#DC2626' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>게시글 신고</Typography>
            </Box>
            <IconButton size="small" onClick={onClose} sx={{ color: colors.textHint }}>
              <Close sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
          <Box sx={{ px: 3, py: 3 }}>
            <Typography sx={{ fontSize: '0.82rem', color: colors.textMuted, mb: 2 }}>신고 사유를 선택해주세요.</Typography>
            <RadioGroup value={reason} onChange={e => setReason(e.target.value)}>
              {REPORT_REASONS.map(r => (
                <FormControlLabel key={r.value} value={r.value} label={r.label}
                  control={<Radio size="small" sx={{ color: colors.border, '&.Mui-checked': { color: '#2563EB' } }} />}
                  sx={{
                    mx: 0, px: 1.5, py: 0.8, borderRadius: 1.5, mb: 0.5,
                    border: reason === r.value ? '1px solid #BFDBFE' : `1px solid transparent`,
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
              sx={{ mt: 2.5, py: 1.1, borderRadius: 1.5, textTransform: 'none', fontWeight: 700, fontSize: '0.88rem', backgroundColor: '#DC2626', boxShadow: 'none', '&:hover': { backgroundColor: '#B91C1C' }, '&.Mui-disabled': { backgroundColor: colors.hover, color: colors.textHint } }}
            >
              {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : '신고 제출'}
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

const ConfirmModal = ({ open, title, message, confirmLabel = '확인', confirmColor = '#EF4444', onConfirm, onClose, colors }) => (
  <Modal open={open} onClose={onClose} closeAfterTransition
    slots={{ backdrop: Backdrop }}
    slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' } } }}
  >
    <Fade in={open}>
      <Box sx={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: { xs: '88vw', sm: 380 },
        backgroundColor: colors.paper, borderRadius: 3,
        boxShadow: '0 20px 60px rgba(15,23,42,0.16)', overflow: 'hidden', outline: 'none',
      }}>
        <Box sx={{ px: 3, py: 3 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary, mb: 1 }}>{title}</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, lineHeight: 1.7 }}>{message}</Typography>
        </Box>
        <Box sx={{ px: 3, pb: 3, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', color: colors.textMuted, px: 2, borderRadius: 1.5, border: `1px solid ${colors.border}`, '&:hover': { backgroundColor: colors.hover } }}>취소</Button>
          <Button onClick={onConfirm} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.85rem', color: '#fff', px: 2.5, borderRadius: 1.5, backgroundColor: confirmColor, boxShadow: 'none', '&:hover': { filter: 'brightness(0.9)' } }}>{confirmLabel}</Button>
        </Box>
      </Box>
    </Fade>
  </Modal>
);

const NOTI_LABELS = {
  LIKE: { text: '회원님의 게시글을 좋아합니다.', color: '#EF4444' },
  COMMENT: { text: '회원님의 게시글에 댓글을 남겼습니다.', color: '#2563EB' },
  FOLLOW: { text: '회원님을 팔로우하기 시작했습니다.', color: '#10B981' },
  FOLLOW_REQUEST: { text: '팔로우를 요청했습니다.', color: '#F97316' },
  FOLLOW_ACCEPTED: { text: '팔로우 요청을 수락했습니다.', color: '#10B981' },
};

const FollowRequestButtons = ({ requesterId, token, onHandled, colors }) => {
  const [loading, setLoading] = useState(null);
  const handle = async (action) => {
    setLoading(action);
    try {
      await fetch(`${API}/user/follow/${requesterId}/${action}`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      onHandled(action);
    } catch { }
    finally { setLoading(null); }
  };
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
      <Button size="small" variant="contained" disabled={!!loading} onClick={() => handle('accept')}
        sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', px: 1.5, py: 0.3, borderRadius: 1, minWidth: 0, backgroundColor: colors.textPrimary, color: colors.paper, boxShadow: 'none', '&:hover': { backgroundColor: '#2563EB' } }}>
        {loading === 'accept' ? <CircularProgress size={11} sx={{ color: colors.paper }} /> : '수락'}
      </Button>
      <Button size="small" variant="outlined" disabled={!!loading} onClick={() => handle('reject')}
        sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', px: 1.5, py: 0.3, borderRadius: 1, minWidth: 0, borderColor: colors.border, color: colors.textMuted, '&:hover': { backgroundColor: colors.hover, borderColor: colors.borderFocus } }}>
        {loading === 'reject' ? <CircularProgress size={11} sx={{ color: colors.textMuted }} /> : '거절'}
      </Button>
    </Stack>
  );
};

const NotificationModal = ({ open, onClose, token, navigate, colors }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.success) setNotifications(d.notifications ?? []);
        fetch(`${API}/notifications/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [open, token]);

  return (
    <Modal open={open} onClose={onClose} closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(2px)' } } }}
    >
      <Fade in={open}>
        <Box sx={{
          position: 'fixed', top: 64, right: { xs: 12, md: 32 },
          width: { xs: 'calc(100vw - 24px)', sm: 380 }, maxHeight: '70vh',
          backgroundColor: colors.paper, borderRadius: 2.5,
          boxShadow: '0 20px 60px rgba(15,23,42,0.16)', border: `1px solid ${colors.border}`,
          overflow: 'hidden', outline: 'none',
        }}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>알림</Typography>
            <IconButton size="small" onClick={onClose} sx={{ color: colors.textHint }}><Close sx={{ fontSize: 17 }} /></IconButton>
          </Box>
          <Box sx={{ overflowY: 'auto', maxHeight: 'calc(70vh - 56px)' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress size={22} sx={{ color: '#2563EB' }} /></Box>
            ) : notifications.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <NotificationsNoneOutlined sx={{ fontSize: 36, color: colors.border, mb: 1 }} />
                <Typography sx={{ color: colors.textHint, fontSize: '0.85rem' }}>알림이 없습니다.</Typography>
              </Box>
            ) : notifications.map((n, i) => {
              const meta = NOTI_LABELS[n.NOTI_TYPE] || { text: '새 알림', color: '#64748B' };
              const isUnread = n.IS_READ === 'N';
              return (
                <Box key={n.NOTI_ID || i} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, px: 2.5, py: 2,
                  backgroundColor: isUnread ? (colors.mode === 'dark' ? '#1E2A3A' : '#F0F7FF') : 'transparent',
                  borderBottom: `1px solid ${colors.border}`,
                  transition: 'background 0.15s', '&:hover': { backgroundColor: colors.hover }, '&:last-child': { borderBottom: 'none' },
                }}>
                  <Box sx={{ position: 'relative', flexShrink: 0, cursor: n.NOTI_TYPE !== 'FOLLOW_REQUEST' ? 'pointer' : 'default' }}
                    onClick={() => {
                      if (n.NOTI_TYPE === 'FOLLOW_REQUEST') return;
                      if (n.POST_ID) navigate(`/post/${n.POST_ID}`);
                      onClose();
                    }}>
                    <Avatar src={resolveAvatarSrc(n.SENDER_AVATAR)} sx={{ width: 36, height: 36, backgroundColor: colors.textPrimary, fontSize: '0.8rem', fontWeight: 800 }}>
                      {getInitial(n.SENDER_NAME)}
                    </Avatar>
                    {isUnread && <Box sx={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: '50%', backgroundColor: meta.color, border: `2px solid ${colors.paper}` }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: colors.textPrimary, lineHeight: 1.5, cursor: n.NOTI_TYPE !== 'FOLLOW_REQUEST' ? 'pointer' : 'default' }}
                      onClick={() => {
                        if (n.NOTI_TYPE === 'FOLLOW_REQUEST') return;
                        if (n.POST_ID) navigate(`/post/${n.POST_ID}`);
                        onClose();
                      }}>
                      <Box component="span" sx={{ fontWeight: 700 }}>{n.SENDER_NAME || '알 수 없음'}</Box>{' '}{meta.text}
                    </Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.textHint, mt: 0.2 }}>{formatRelativeTime(n.CREATED_AT)}</Typography>
                    {n.NOTI_TYPE === 'FOLLOW_REQUEST' && (
                      <FollowRequestButtons requesterId={n.SENDER_ID} token={token} colors={colors}
                        onHandled={() => setNotifications(prev => prev.filter(x => x.NOTI_ID !== n.NOTI_ID))} />
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

const NavBar = ({ onLogout, notificationCount, onNotificationClick, token, colors }) => {
  const navigate = useNavigate();
  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: colors.mode === 'dark' ? 'rgba(15,17,23,0.9)' : 'rgba(248,250,252,0.85)',
      backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}`,
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }} onClick={() => navigate('/feed')}>
          <Box sx={{ width: 28, height: 28, borderRadius: 1, backgroundColor: colors.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: colors.paper, fontWeight: 900, fontSize: '0.75rem', lineHeight: 1 }}>{'<>'}</Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: colors.textPrimary }}>CtrlE</Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="알림">
            <IconButton size="small" onClick={onNotificationClick}>
              <Badge badgeContent={notificationCount > 0 ? notificationCount : null} color="error"
                sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                <NotificationsNoneOutlined sx={{ fontSize: 20, color: colors.textMuted }} />
              </Badge>
            </IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<Add sx={{ fontSize: 16 }} />} onClick={() => navigate('/register')}
            sx={{ backgroundColor: colors.textPrimary, color: colors.paper, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', px: 2, py: 0.9, borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#2563EB', boxShadow: '0 4px 14px rgba(37,99,235,0.25)', transform: 'translateY(-1px)' }, transition: 'all 0.2s' }}>
            새 게시물
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

const PostCard = ({ feed, token, onOpenDetail, myNickname, onDelete, onTagClick, colors }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(feed.liked ?? false);
  const [likeCount, setLikeCount] = useState(feed.likes ?? 0);
  const [bookmarked, setBookmarked] = useState(feed.bookmarked ?? false);
  const [bookmarkAnim, setBookmarkAnim] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccessOpen, setReportSuccessOpen] = useState(false);
  const [reportDuplicateOpen, setReportDuplicateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // 더블클릭 하트 애니메이션 트리거
  const [heartTrigger, setHeartTrigger] = useState(0);
  const lastTapRef = useRef(0);

  const imageList = feed.images ? feed.images.split(',') : [];
  const isMyPost = myNickname && (feed.writer === myNickname || feed.WRITER === myNickname);

  // 더블클릭/더블탭 감지
  const handleCardDoubleClick = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(c => c + 1);
      fetch(`${API}/feed/${feed.id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
    }
    setHeartTrigger(t => t + 1);
  };

  const clickTimerRef = useRef(null);

  const handleCardTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 200) {
      // 더블클릭
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
      lastTapRef.current = 0;
      handleCardDoubleClick();
      return;
    }
    lastTapRef.current = now;
    clickTimerRef.current = setTimeout(() => {
      clickTimerRef.current = null;
      navigate(`/post/${feed.id}`);
    }, 200);
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    const next = !liked;
    setLiked(next); setLikeCount(c => c + (next ? 1 : -1));
    if (next) setHeartTrigger(t => t + 1);
    try { await fetch(`${API}/feed/${feed.id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); }
    catch { setLiked(!next); setLikeCount(c => c + (next ? -1 : 1)); }
  };

  const handleBookmark = async (e) => {
    e.stopPropagation();
    const next = !bookmarked;
    setBookmarked(next); setBookmarkAnim(true);
    setTimeout(() => setBookmarkAnim(false), 500);
    try { await fetch(`${API}/feed/${feed.id}/bookmark`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }); }
    catch { setBookmarked(!next); }
  };

  const handleShare = async (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/post/${feed.id}`;
    try { await navigator.clipboard.writeText(url); }
    catch {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
    }
    setShareOpen(true);
    fetch(`${API}/feed/${feed.id}/share`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
  };

  const handleDeleteConfirm = async () => {
    setDeleteOpen(false);
    try {
      const res = await fetch(`${API}/feed/${feed.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) onDelete(feed.id);
    } catch { }
  };

  const handleCommentClick = (e) => {
    e.stopPropagation();
    navigate(`/post/${feed.id}#comments`);
  };

  const tag = feed.tag || feed.category || 'General';

  return (
    <>
      <Box
        onClick={handleCardTap}
        onDoubleClick={(e) => { e.preventDefault(); handleCardDoubleClick(); }}
        sx={{
          backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2,
          p: 3, cursor: 'pointer', animation: 'fadeUp 0.4s ease both',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          position: 'relative', overflow: 'hidden',
          '&:hover': { borderColor: colors.borderFocus, boxShadow: '0 4px 20px rgba(15,23,42,0.06)' },
          '@keyframes fadeUp': {
            from: { opacity: 0, transform: 'translateY(16px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        {/* 더블클릭 하트 오버레이 */}
        <HeartOverlay trigger={heartTrigger} colors={colors} />

        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={resolveAvatarSrc(feed.avatar)}
              onClick={(e) => { e.stopPropagation(); navigate(`/user/${feed.writer}`); }}
              sx={{ width: 36, height: 36, backgroundColor: colors.textPrimary, fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', '&:hover': { opacity: 0.85 }, transition: 'opacity 0.15s' }}
            >
              {getInitial(feed.writer)}
            </Avatar>
            <Box>
              <Typography
                onClick={(e) => { e.stopPropagation(); navigate(`/user/${feed.writer}`); }}
                sx={{ fontWeight: 700, fontSize: '0.88rem', color: colors.textPrimary, lineHeight: 1, cursor: 'pointer', '&:hover': { color: '#2563EB' }, transition: 'color 0.15s' }}
              >
                {feed.writer || 'Unknown'}
              </Typography>
              <Typography sx={{ color: colors.textHint, fontSize: '0.72rem', mt: 0.2 }}>
                {feed.role || ''}{feed.role && feed.createdAt ? ' · ' : ''}{formatRelativeTime(feed.createdAt)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Chip
              label={tag}
              size="small"
              onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(tag); }}
              sx={{ backgroundColor: colors.inputBg, color: colors.textMuted, fontWeight: 600, fontSize: '0.7rem', height: 22, border: `1px solid ${colors.border}`, cursor: 'pointer', '&:hover': { backgroundColor: '#EFF6FF', color: '#2563EB', borderColor: '#BFDBFE' }, transition: 'all 0.15s' }}
            />
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }} sx={{ color: colors.border, '&:hover': { color: colors.textMuted } }}>
              <MoreHoriz sx={{ fontSize: 18 }} />
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={(e) => { e?.stopPropagation(); setAnchorEl(null); }}
              onClick={(e) => e.stopPropagation()}
              PaperProps={{ sx: { boxShadow: '0 8px 30px rgba(0,0,0,0.08)', borderRadius: 2, border: `1px solid ${colors.border}`, backgroundColor: colors.paper, minWidth: 120 } }}>
              {isMyPost ? [
                <MenuItem key="edit" onClick={(e) => { e.stopPropagation(); setAnchorEl(null); navigate(`/edit/${feed.id}`); }}
                  sx={{ fontSize: '0.8rem', color: colors.textMuted, gap: 1 }}>
                  <Edit sx={{ fontSize: 15, color: colors.textHint }} /> 수정하기
                </MenuItem>,
                <MenuItem key="delete" onClick={(e) => { e.stopPropagation(); setAnchorEl(null); setDeleteOpen(true); }}
                  sx={{ fontSize: '0.8rem', color: '#EF4444', gap: 1 }}>
                  <Delete sx={{ fontSize: 15, color: '#EF4444' }} /> 삭제하기
                </MenuItem>,
              ] : [
                <MenuItem key="report" onClick={(e) => { e.stopPropagation(); setAnchorEl(null); setReportOpen(true); }}
                  sx={{ fontSize: '0.8rem', color: colors.textMuted, gap: 1 }}>
                  <Flag sx={{ fontSize: 15, color: colors.textHint }} /> 신고하기
                </MenuItem>,
              ]}
            </Menu>
          </Box>
        </Box>

        {imageList.length > 0 && (
          <Box sx={{ width: '100%', paddingTop: '52%', position: 'relative', borderRadius: 1.5, overflow: 'hidden', mb: 2 }}>
            <Box component="img" src={imageList[0].startsWith('http') ? imageList[0] : `${API}${imageList[0]}`} alt={feed.title}
              sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
        )}

        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.textPrimary, mb: 1, lineHeight: 1.4, letterSpacing: '-0.01em' }}>{feed.title}</Typography>
        <Typography sx={{ color: colors.textMuted, fontSize: '0.85rem', lineHeight: 1.75, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
          dangerouslySetInnerHTML={{ __html: resolveImageSrc(feed.description || '') }} />

        {Array.isArray(feed.tags) && feed.tags.filter(Boolean).length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            {feed.tags.filter(Boolean).map(t => (
              <Box
                key={t}
                onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(t); }}
                sx={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600, cursor: 'pointer', px: 0.5, '&:hover': { textDecoration: 'underline' } }}
              >
                #{t}
              </Box>
            ))}
          </Stack>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2.5, pt: 2, borderTop: `1px solid ${colors.border}` }}>
          <Stack direction="row" spacing={0.5}>
            <Button size="small"
              startIcon={liked ? <Favorite sx={{ fontSize: 16, color: '#EF4444' }} /> : <FavoriteBorderOutlined sx={{ fontSize: 16 }} />}
              onClick={handleLike}
              sx={{ color: liked ? '#EF4444' : colors.textMuted, fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', px: 1.2, borderRadius: 1.5, minWidth: 0, '&:hover': { backgroundColor: colors.mode === 'dark' ? 'rgba(239,68,68,0.1)' : '#FEF2F2', color: '#EF4444' }, transition: 'color 0.15s, background 0.15s' }}>
              {likeCount}
            </Button>
            <Button size="small" startIcon={<ChatBubbleOutline sx={{ fontSize: 16 }} />}
              onClick={handleCommentClick}
              sx={{ color: colors.textMuted, fontWeight: 600, fontSize: '0.8rem', textTransform: 'none', px: 1.2, borderRadius: 1.5, minWidth: 0, '&:hover': { backgroundColor: colors.mode === 'dark' ? 'rgba(37,99,235,0.1)' : '#EFF6FF', color: '#2563EB' }, transition: 'all 0.15s' }}>
              {feed.commentCount ?? 0}
            </Button>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="링크 복사" placement="top">
              <IconButton size="small" onClick={handleShare} sx={{ color: colors.textHint, '&:hover': { color: '#2563EB' }, transition: 'color 0.15s' }}>
                <ShareOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={handleBookmark} sx={{ transition: 'color 0.15s' }}>
              <Box sx={{
                animation: bookmarkAnim ? 'bookmarkPop 0.45s ease both' : 'none', display: 'flex',
                '@keyframes bookmarkPop': {
                  '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' },
                },
              }}>
                {bookmarked ? <Bookmark sx={{ fontSize: 19, color: '#2563EB' }} /> : <BookmarkBorderOutlined sx={{ fontSize: 19, color: colors.textHint }} />}
              </Box>
            </IconButton>
          </Stack>
        </Box>

        {(feed.commentCount ?? 0) > 0 && (
          <Typography onClick={handleCommentClick}
            sx={{ color: colors.textHint, fontSize: '0.78rem', mt: 1, cursor: 'pointer', fontWeight: 500, '&:hover': { color: '#2563EB' }, transition: 'color 0.15s' }}>
            댓글 {feed.commentCount}개 모두 보기
          </Typography>
        )}
      </Box>

      <Snackbar open={shareOpen} autoHideDuration={2000} onClose={() => setShareOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>링크가 클립보드에 복사되었습니다!</Alert>
      </Snackbar>

      <ConfirmModal open={deleteOpen} title="게시글 삭제" message="이 게시글을 삭제하시겠습니까? 삭제한 게시글은 복구할 수 없습니다." confirmLabel="삭제" confirmColor="#EF4444" onConfirm={handleDeleteConfirm} onClose={() => setDeleteOpen(false)} colors={colors} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} postId={feed.id} token={token} onSuccess={() => setReportSuccessOpen(true)} onDuplicate={() => setReportDuplicateOpen(true)} colors={colors} />

      <Snackbar open={reportSuccessOpen} autoHideDuration={2500} onClose={() => setReportSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>신고가 접수되었습니다.</Alert>
      </Snackbar>
      <Snackbar open={reportDuplicateOpen} autoHideDuration={2500} onClose={() => setReportDuplicateOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" icon={<FlagOutlined fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>이미 신고한 게시글입니다.</Alert>
      </Snackbar>
    </>
  );
};

const RecommendedDivider = ({ colors }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
    <Box sx={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, px: 1.5, py: 0.6, borderRadius: 2, backgroundColor: colors.inputBg, border: `1px solid ${colors.border}` }}>
      <AutoAwesome sx={{ fontSize: 13, color: '#F97316' }} />
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted }}>팔로잉 글을 모두 봤어요 · 추천 게시글</Typography>
    </Box>
    <Box sx={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
  </Box>
);

const Sidebar = ({ trending, suggestions, loadingTrending, loadingSuggestions, token, colors, onTagClick, navigate }) => {
  const [followStatus, setFollowStatus] = useState({});

  const handleFollow = async (s) => {
    const userId = s.USER_ID;
    const prev = followStatus[userId] || 'NONE';
    // Optimistic
    setFollowStatus(f => ({ ...f, [userId]: prev === 'NONE' ? 'OPTIMISTIC' : 'NONE' }));
    try {
      const res = await fetch(`${API}/user/follow/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setFollowStatus(f => ({ ...f, [userId]: data.status }));
      else setFollowStatus(f => ({ ...f, [userId]: prev }));
    } catch { setFollowStatus(f => ({ ...f, [userId]: prev })); }
  };

  // 팔로우 버튼 스타일 분기
  const getFollowBtnSx = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          // 팔로잉 상태: 흰색(다크에선 paper) 배경
          backgroundColor: colors.paper,
          color: colors.textPrimary,
          border: `1px solid ${colors.border}`,
          boxShadow: 'none',
          '&:hover': { backgroundColor: colors.hover, borderColor: colors.borderFocus },
        };
      case 'PENDING':
      case 'OPTIMISTIC':
        return {
          backgroundColor: colors.hover,
          color: colors.textMuted,
          border: `1px solid ${colors.border}`,
          boxShadow: 'none',
        };
      default: // NONE → 파란색
        return {
          backgroundColor: '#2563EB',
          color: '#fff',
          border: '1px solid #2563EB',
          boxShadow: 'none',
          '&:hover': { backgroundColor: '#1D4ED8' },
        };
    }
  };

  const getFollowLabel = (status) => {
    switch (status) {
      case 'ACCEPTED': return '팔로잉';
      case 'PENDING':
      case 'OPTIMISTIC': return '요청됨';
      default: return '팔로우';
    }
  };

  return (
    <Stack spacing={2.5}>
      {/* 트렌딩 태그 */}
      <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LocalFireDepartment sx={{ fontSize: 15, color: '#F97316' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: colors.textPrimary, letterSpacing: '-0.01em' }}>트렌딩 태그</Typography>
        </Box>
        {loadingTrending ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={18} sx={{ color: '#2563EB' }} /></Box>
        ) : trending.length === 0 ? (
          <Typography sx={{ color: colors.textHint, fontSize: '0.8rem', textAlign: 'center', py: 1 }}>트렌딩 태그가 없습니다.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {trending.map((t, i) => (
              <Box
                key={t.TAG_NAME || t.tag}
                onClick={() => onTagClick && onTagClick(t.TAG_NAME || t.tag)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', p: 1, borderRadius: 1, transition: '0.15s', '&:hover': { backgroundColor: colors.hover } }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: colors.border, fontWeight: 700, fontSize: '0.72rem', width: 16 }}>{i + 1}</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.83rem', color: colors.textMuted }}>#{t.TAG_NAME || t.tag}</Typography>
                </Box>
                <Typography sx={{ color: colors.textHint, fontSize: '0.72rem' }}>{(t.POST_COUNT || t.count || 0).toLocaleString()}</Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>

      {/* 팔로우 추천 */}
      <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2, p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <PeopleAlt sx={{ fontSize: 15, color: colors.textMuted }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: colors.textPrimary, letterSpacing: '-0.01em' }}>팔로우 추천</Typography>
        </Box>
        {loadingSuggestions ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress size={18} sx={{ color: '#2563EB' }} /></Box>
        ) : suggestions.length === 0 ? (
          <Typography sx={{ color: colors.textHint, fontSize: '0.8rem', textAlign: 'center', py: 1 }}>추천 사용자가 없습니다.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {suggestions.map(s => {
              const uid = s.USER_ID || s.handle;
              const status = followStatus[uid] || 'NONE';
              return (
                <Box key={uid} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                  <Box
                    onClick={() => navigate(`/profile/${s.NICKNAME || s.name}`)}
                    sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0, p: 0.8, borderRadius: 1, cursor: 'pointer', transition: '0.15s', '&:hover': { backgroundColor: colors.hover } }}
                  >
                    <Avatar src={resolveAvatarSrc(s.AVATAR || s.avatar)} sx={{ width: 32, height: 32, backgroundColor: colors.textPrimary, fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>
                      {getInitial(s.NICKNAME || s.name)}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: colors.textPrimary, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', '&:hover': { color: '#2563EB' }, transition: 'color 0.15s' }}>
                        {s.NICKNAME || s.name}
                      </Typography>
                      {s.FOLLOWS_ME > 0 ? (
                        <Typography sx={{ color: colors.textHint, fontSize: '0.68rem', fontWeight: 500 }}>나를 팔로우합니다</Typography>
                      ) : (
                        <Typography sx={{ color: colors.textHint, fontSize: '0.72rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.BIO_SHORT || s.role || ''}</Typography>
                      )}
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    onClick={() => handleFollow(s)}
                    sx={{
                      fontSize: '0.72rem', fontWeight: 700, textTransform: 'none',
                      minWidth: 0, px: 1.5, py: 0.4, borderRadius: 1, flexShrink: 0,
                      transition: 'all 0.15s',
                      ...getFollowBtnSx(status),
                    }}
                  >
                    {getFollowLabel(status)}
                  </Button>
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      <Typography sx={{ color: colors.textHint, fontSize: '0.68rem', lineHeight: 1.8, px: 0.5 }}>
        CtrlE · 이용약관 · 개인정보처리방침<br />
        © 2025 CtrlE Inc. All rights reserved.
      </Typography>
    </Stack>
  );
};

export default function Feed() {
  const navigate = useNavigate();
  const { mode } = useColorMode();
  const token = localStorage.getItem('accessToken');
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false);

  const colors = {
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
  };

  const myNickname = (() => {
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
      return payload.nickname || null;
    } catch { return null; }
  })();

  const [feeds, setFeeds] = useState([]);
  const [recommendedFeeds, setRecommendedFeeds] = useState([]);
  const [showRecommended, setShowRecommended] = useState(false);
  const [activeFilter, setActiveFilter] = useState('전체');
  const [loadingFeeds, setLoadingFeeds] = useState(true);
  const [loadingRecommended, setLoadingRecommended] = useState(false);
  const [trending, setTrending] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notiModalOpen, setNotiModalOpen] = useState(false);

  const loadTrending = useCallback(async () => {
    setLoadingTrending(true);
    try {
      const res = await fetch(`${API}/feed/trending`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.success) setTrending(data.tags ?? []);
    } catch { setTrending([]); }
    finally { setLoadingTrending(false); }
  }, [token]);

  const loadRecommended = useCallback(async () => {
    setLoadingRecommended(true);
    try {
      const res = await fetch(`${API}/feed/recommended`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.success) setRecommendedFeeds(data.feeds ?? []);
    } catch { setRecommendedFeeds([]); }
    finally { setLoadingRecommended(false); }
  }, [token]);

  const loadFeeds = useCallback(async () => {
    setLoadingFeeds(true);
    try {
      const response = await fetch(`${API}/feed/list`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (response.ok && data.success) {
        setFeeds(data.feeds ?? []);
        if ((data.feeds ?? []).length === 0) {
          setShowRecommended(true);
          loadRecommended();
        }
      }
    } catch { }
    finally { setLoadingFeeds(false); }
  }, [token, loadRecommended]);

  const loadSidebar = useCallback(async () => {
    loadTrending();
    setLoadingSuggestions(true);
    try {
      const res = await fetch(`${API}/user/suggestions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.success) setSuggestions(data.users ?? []);
    } catch { setSuggestions([]); }
    finally { setLoadingSuggestions(false); }
  }, [token, loadTrending]);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok && data.success) setNotificationCount(data.unread_count ?? 0);
    } catch { setNotificationCount(0); }
  }, [token]);

  useEffect(() => {
    const oauthToken = sessionStorage.getItem('oauthToken');
    if (oauthToken) {
      localStorage.setItem('accessToken', oauthToken);
      sessionStorage.removeItem('oauthToken');
      window.location.reload();
      return;
    } else if (!token) {
      navigate('/');
      return;
    }
    loadFeeds();
    loadSidebar();
    loadNotifications();
  }, [token, navigate, loadFeeds, loadSidebar, loadNotifications]);

  const bottomRef = useRef(null);
  useEffect(() => {
    if (showRecommended || feeds.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShowRecommended(true);
          loadRecommended();
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (bottomRef.current) observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [feeds.length, showRecommended, loadRecommended]);

  const handleNotificationClick = () => { setNotiModalOpen(true); setNotificationCount(0); };

  const handleDelete = useCallback((id) => {
    setFeeds(prev => prev.filter(f => f.id !== id));
    setRecommendedFeeds(prev => prev.filter(f => f.id !== id));
    setDeleteSuccessOpen(true);
    loadTrending();
  }, [loadTrending]);

  const handleTagClick = useCallback((tagName) => {
    navigate(`/explore?tag=${encodeURIComponent(tagName)}`);
  }, [navigate]);

  const dynamicTagLabels = trending.map(t => t.TAG_NAME || t.tag).filter(Boolean);

  const filterFeeds = (list) => {
    if (activeFilter === '전체') return list;
    const found = FIXED_CATEGORIES.find(c => c.label === activeFilter);
    if (found?.value) return list.filter(f => (f.category || f.tag || '') === found.value);
    return list.filter(f => {
      const tagArr = Array.isArray(f.tags) ? f.tags : (f.tags ? f.tags.split(',') : []);
      const cat = f.category || f.tag || '';
      return tagArr.includes(activeFilter) || cat === activeFilter;
    });
  };

  const filteredFeeds = filterFeeds(feeds);
  const filteredRecommended = filterFeeds(recommendedFeeds);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg }}>
      {/* 카테고리 필터 탭 */}
      <Box sx={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.mode === 'dark' ? 'rgba(15,17,23,0.9)' : 'rgba(248,250,252,0.9)', backdropFilter: 'blur(8px)', position: 'sticky', top: 0, zIndex: 90 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Stack direction="row" spacing={0} alignItems="center" sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
            {FIXED_CATEGORIES.map(t => (
              <Button key={t.label} size="small" startIcon={t.icon} onClick={() => setActiveFilter(t.label)}
                sx={{ textTransform: 'none', fontWeight: activeFilter === t.label ? 700 : 500, fontSize: '0.82rem', whiteSpace: 'nowrap', px: 2, py: 1.8, borderRadius: 0, color: activeFilter === t.label ? colors.textPrimary : colors.textHint, borderBottom: activeFilter === t.label ? '2px solid #2563EB' : '2px solid transparent', '&:hover': { color: colors.textPrimary, backgroundColor: 'transparent' }, transition: 'all 0.15s', minWidth: 'fit-content' }}>
                {t.label}
              </Button>
            ))}
            {dynamicTagLabels.length > 0 && <Box sx={{ width: '1px', height: 18, backgroundColor: colors.border, mx: 1, flexShrink: 0 }} />}
            {dynamicTagLabels.map(label => (
              <Button key={label} size="small" onClick={() => handleTagClick(label)}
                sx={{ textTransform: 'none', fontWeight: activeFilter === label ? 700 : 400, fontSize: '0.8rem', whiteSpace: 'nowrap', px: 1.8, py: 1.8, borderRadius: 0, color: activeFilter === label ? '#2563EB' : colors.textHint, borderBottom: activeFilter === label ? '2px solid #2563EB' : '2px solid transparent', '&:hover': { color: '#2563EB', backgroundColor: 'transparent' }, transition: 'all 0.15s', minWidth: 'fit-content' }}>
                #{label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {loadingFeeds ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#2563EB' }} /></Box>
            ) : (
              <>
                {filteredFeeds.length > 0 ? (
                  <Stack spacing={2}>
                    {filteredFeeds.map((feed, i) => (
                      <Box key={feed.id} sx={{ animationDelay: `${i * 0.04}s` }}>
                        <PostCard
                          feed={feed} token={token}
                          onOpenDetail={(f) => navigate(`/post/${f.id}`)}
                          myNickname={myNickname}
                          onDelete={handleDelete}
                          onTagClick={handleTagClick}
                          colors={colors}
                        />
                      </Box>
                    ))}
                    <Box ref={bottomRef} sx={{ height: 1 }} />
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography sx={{ color: colors.textHint, fontSize: '0.88rem' }}>
                      {activeFilter === '전체'
                        ? '팔로우한 사람의 글이 없습니다.'
                        : `'${activeFilter}' 게시물이 없습니다.`}
                    </Typography>
                  </Box>
                )}

                {showRecommended && (
                  <Box sx={{ mt: filteredFeeds.length > 0 ? 3 : 0 }}>
                    <RecommendedDivider colors={colors} />
                    {loadingRecommended ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress sx={{ color: '#2563EB' }} /></Box>
                    ) : filteredRecommended.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography sx={{ color: colors.textHint, fontSize: '0.88rem' }}>추천 게시물이 없습니다.</Typography>
                      </Box>
                    ) : (
                      <Stack spacing={2} sx={{ mt: 2 }}>
                        {filteredRecommended.map((feed, i) => (
                          <Box key={feed.id} sx={{ animationDelay: `${i * 0.04}s` }}>
                            <PostCard
                              feed={feed} token={token}
                              onOpenDetail={(f) => navigate(`/post/${f.id}`)}
                              myNickname={myNickname}
                              onDelete={handleDelete}
                              onTagClick={handleTagClick}
                              colors={colors}
                            />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>

          <Box sx={{ width: 280, flexShrink: 0, display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 120 }}>
            <Sidebar
              trending={trending}
              suggestions={suggestions}
              loadingTrending={loadingTrending}
              loadingSuggestions={loadingSuggestions}
              token={token}
              colors={colors}
              onTagClick={handleTagClick}
              navigate={navigate}
            />
          </Box>
        </Box>
      </Box>

      <Snackbar open={deleteSuccessOpen} autoHideDuration={2000} onClose={() => setDeleteSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success">게시글이 삭제되었습니다.</Alert>
      </Snackbar>
      <NotificationModal open={notiModalOpen} onClose={() => setNotiModalOpen(false)} token={token} navigate={navigate} colors={colors} />
    </Box>
  );
}