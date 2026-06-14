import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import {
  Box, Avatar, Button, Chip, IconButton,
  Stack, Typography, Tooltip, Menu, MenuItem, Badge,
  CircularProgress, Snackbar, Alert, Modal, Backdrop, Fade,
  Radio, RadioGroup, FormControlLabel, TextField,
} from '@mui/material';
import {
  FavoriteBorderOutlined, Favorite,
  ChatBubbleOutline, BookmarkBorderOutlined, Bookmark,
  MoreHoriz, Add, NotificationsNoneOutlined,
  Close, LocalFireDepartment, PeopleAlt,
  ShareOutlined, Check, Edit, Delete, Flag,
  ViewList, FlagOutlined, AutoAwesome,
  ChevronLeft, ChevronRight, LocationOn, Search, ContentCopy, KeyboardArrowUp, Videocam
} from '@mui/icons-material';
import { BugReport, HelpOutline, VolumeOff, VolumeUp } from '@mui/icons-material';
import { useColorMode } from '../App';
import EditModal from './EditModal';

const FIXED_CATEGORIES = [
  { label: '전체', value: null, icon: <ViewList sx={{ fontSize: 13 }} /> },
  { label: '트러블슈팅', value: 'ERROR', icon: <BugReport sx={{ fontSize: 13 }} /> },
  { label: '일반 질문', value: 'QUESTION', icon: <HelpOutline sx={{ fontSize: 13 }} /> },
  { label: '자유 게시판', value: 'FREE', icon: <ChatBubbleOutline sx={{ fontSize: 13 }} /> },
  { label: '릴스', value: 'REEL', icon: <Videocam sx={{ fontSize: 13 }} /> },
];

const REPORT_REASONS = [
  { value: 'SPAM', label: '스팸 / 광고성 게시물' },
  { value: 'HATE', label: '혐오 발언 / 차별' },
  { value: 'ADULT', label: '성인 / 음란물' },
  { value: 'FALSE', label: '허위 정보' },
  { value: 'OTHER', label: '기타' },
];

const API = 'http://localhost:3010';

// ─────────────────────────────────────────────
//  헬퍼
// ─────────────────────────────────────────────
const resolveImageSrc = (src) =>
  src ? src.replace(/src="\/uploads/g, `src="${API}/uploads`) : '';

const resolveAvatarSrc = (src) => {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  return `${API}${src}`;
};

const resolveFileSrc = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API}${url}`;
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

// ─────────────────────────────────────────────
//  HeartOverlay
// ─────────────────────────────────────────────
const HeartOverlay = ({ trigger }) => {
  const [hearts, setHearts] = useState([]);
  useEffect(() => {
    if (!trigger) return;
    const id = Date.now();
    setHearts(prev => [...prev, id]);
    const t = setTimeout(() => setHearts(prev => prev.filter(h => h !== id)), 900);
    return () => clearTimeout(t);
  }, [trigger]);
  if (!hearts.length) return null;
  return (
    <>
      {hearts.map(id => (
        <Box key={id} sx={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)', pointerEvents: 'none', zIndex: 10,
          animation: 'heartBurst 0.85s ease forwards',
          '@keyframes heartBurst': {
            '0%': { opacity: 0, transform: 'translate(-50%,-50%) scale(0.2)' },
            '25%': { opacity: 1, transform: 'translate(-50%,-50%) scale(1.3)' },
            '60%': { opacity: 1, transform: 'translate(-50%,-50%) scale(1.1)' },
            '100%': { opacity: 0, transform: 'translate(-50%,-60%) scale(0.9)' },
          },
        }}>
          <Favorite sx={{ fontSize: 80, color: '#EF4444', filter: 'drop-shadow(0 4px 12px rgba(239,68,68,0.5))' }} />
        </Box>
      ))}
    </>
  );
};

const ImageGallery = ({ imageList, colors }) => {
  const [cur, setCur] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  if (!imageList.length) return null;

  const prev = (e) => { e.stopPropagation(); setCur(i => (i - 1 + imageList.length) % imageList.length); };
  const next = (e) => { e.stopPropagation(); setCur(i => (i + 1) % imageList.length); };
  const lbPrev = () => setLbIdx(i => (i - 1 + imageList.length) % imageList.length);
  const lbNext = () => setLbIdx(i => (i + 1) % imageList.length);

  return (
    <>
      <Box
        sx={{ mt: 2, position: 'relative', borderRadius: 1.5, overflow: 'hidden', height: 500 }}
        onClick={e => e.stopPropagation()}
      >
        <Box sx={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
          {imageList.map((img, idx) => (
            <Box
              key={img}
              component="img"
              src={resolveFileSrc(img)}
              alt=""
              onClick={() => { setLbIdx(idx); setLightbox(true); }}
              sx={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                cursor: 'zoom-in', display: 'block',
                transform: `translateX(${(idx - cur) * 100}%)`,
                transition: 'transform 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: idx === cur ? 'auto' : 'none',
              }}
            />
          ))}
        </Box>

        {imageList.length > 1 && (
          <Box sx={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: '0.7rem', fontWeight: 700, px: 1, py: 0.3, borderRadius: 2,
          }}>
            {cur + 1}/{imageList.length}
          </Box>
        )}

        {imageList.length > 1 && (
          <>
            <IconButton size="small" onClick={prev} sx={{
              position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' }, width: 28, height: 28,
            }}>
              <ChevronLeft sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" onClick={next} sx={{
              position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)',
              backgroundColor: 'rgba(0,0,0,0.45)', color: '#fff',
              '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' }, width: 28, height: 28,
            }}>
              <ChevronRight sx={{ fontSize: 18 }} />
            </IconButton>
          </>
        )}
      </Box>

      <Modal
        open={lightbox}
        onClose={() => setLightbox(false)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
        slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.9)' } } }}
        onClick={() => setLightbox(false)}
      >
        <Box onClick={e => e.stopPropagation()} sx={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh', outline: 'none' }}>
          <Box
            component="img"
            src={resolveFileSrc(imageList[lbIdx])}
            sx={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 1, display: 'block' }}
          />
          {imageList.length > 1 && (
            <>
              <IconButton onClick={lbPrev} sx={{
                position: 'absolute', left: -52, top: '50%', transform: 'translateY(-50%)',
                color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.28)' },
              }}>
                <ChevronLeft />
              </IconButton>
              <IconButton onClick={lbNext} sx={{
                position: 'absolute', right: -52, top: '50%', transform: 'translateY(-50%)',
                color: '#fff', backgroundColor: 'rgba(255,255,255,0.15)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.28)' },
              }}>
                <ChevronRight />
              </IconButton>
              <Box sx={{
                position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)',
                color: '#fff', fontSize: '0.8rem', fontWeight: 600,
              }}>
                {lbIdx + 1} / {imageList.length}
              </Box>
            </>
          )}
          <IconButton onClick={() => setLightbox(false)} sx={{
            position: 'absolute', top: 8, right: 8,
            color: '#fff', backgroundColor: 'rgba(0,0,0,0.45)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' },
          }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Modal>
    </>
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
      .then(d => {
        if (d.success) {
          setData(d);
          setFollowStatus(d.user?.FOLLOW_STATUS || 'NONE');
        }
      }).catch(() => { });
  }, [anchorEl, nickname, token]);

  if (!anchorEl || !data) return null;

  const handleFollow = async (e) => {
    e.stopPropagation();
    const prev = followStatus;
    setFollowStatus('OPTIMISTIC');
    try {
      const res = await fetch(`${API}/user/follow/${data.user.USER_ID}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
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
    <Box
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        position: 'absolute', top: pos.top, left: pos.left,
        width: 300, zIndex: 9999,
        backgroundColor: colors.paper, border: `1px solid ${colors.border}`,
        borderRadius: 2.5, boxShadow: '0 8px 40px rgba(15,23,42,0.14)',
        p: 2.5,
        animation: 'hoverFadeUp 0.15s ease both',
        '@keyframes hoverFadeUp': {
          from: { opacity: 0, transform: 'translateY(6px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
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
              sx={{
                aspectRatio: '1', borderRadius: 1, overflow: 'hidden',
                backgroundColor: colors.inputBg, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                '&:hover': { opacity: 0.8 }, transition: 'opacity 0.15s',
              }}>
              {(p.tag === 'REEL' || p.category === 'REEL') && p.images ? (
                <Box
                  component="video"
                  src={p.images.startsWith('http') ? p.images : `${API}${p.images}`}
                  muted
                  preload="metadata"
                  sx={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                />
              ) : (
                <Box component="img"
                  src={p.images
                    ? (p.images.startsWith('http') ? p.images : `${API}${p.images}`)
                    : `${API}/uploads/post/defaultImg.png`
                  }
                  sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              )}
            </Box>
          ))}
        </Box>
      )}
    </Box>,
    document.body
  );
};

// ─────────────────────────────────────────────
//  ReportModal
// ─────────────────────────────────────────────
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
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' } } }}>
      <Fade in={open}>
        <Box sx={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
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

// ─────────────────────────────────────────────
//  ConfirmModal
// ─────────────────────────────────────────────
const ConfirmModal = ({ open, title, message, confirmLabel = '확인', confirmColor = '#EF4444', onConfirm, onClose, colors }) => (
  <Modal open={open} onClose={onClose} closeAfterTransition
    slots={{ backdrop: Backdrop }}
    slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' } } }}>
    <Fade in={open}>
      <Box sx={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
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

const ShareModal = ({ open, onClose, feed, token, colors }) => {
  const [search, setSearch] = useState('');
  const [followingUsers, setFollowingUsers] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [selected, setSelected] = useState([]);
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState(new Set());
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendSuccessOpen, setSendSuccessOpen] = useState(false);

  const shareUrl = `${window.location.origin}/post/${feed.id}`;
  const [shareText, setShareText] = useState('');

  useEffect(() => {
    if (!open) {
      setSelected([]);
      setSentIds(new Set());
      setSearch('');
      setCopied(false);
      return;
    }
    setLoading(true);
    Promise.all([
      fetch(`${API}/user/following`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API}/user/suggestions`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({ success: false })),
      fetch(`${API}/messages/rooms`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).catch(() => ({ success: false })),
    ]).then(([following, suggestions, rooms]) => {
      if (following.success) setFollowingUsers(following.list ?? []);
      if (suggestions.success) setRecommendedUsers(suggestions.users ?? []);
      if (rooms.success) {
        console.log('[ShareModal] raw rooms:', rooms.rooms);
        const normalized = (rooms.rooms ?? []).map(r => ({
          ...r,
          ROOM_TYPE: (r.ROOM_TYPE || '').toUpperCase(),
        }));
        console.log('[ShareModal] normalized rooms:', normalized);
        console.log('[ShareModal] GROUP rooms:', normalized.filter(r => r.ROOM_TYPE === 'GROUP'));
        setChatRooms(normalized);
      }
    }).finally(() => setLoading(false));
  }, [open, token]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    fetch(`${API}/feed/${feed.id}/share`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const toggleSelect = (id) =>
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const handleSendIndividual = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    const newSent = new Set(sentIds);
    const isReelPost = feed.tag === 'REEL' || feed.category === 'REEL';
    const reelVideoUrl = isReelPost ? (feed.images?.split(',')[0]?.trim() || null) : null;
    const message = `__SHARE__${JSON.stringify({
      postId: feed.id,
      title: feed.title,
      description: feed.description,
      image: isReelPost ? reelVideoUrl : (feed.images?.split(',')[0] || null),  // ← 릴스도 영상 URL 포함
      isReel: isReelPost,
      url: shareUrl,
      text: shareText
    })}`;

    try {
      const roomKeys = selected.filter(id => typeof id === 'string' && id.startsWith('room_'));
      const userKeys = selected.filter(id => typeof id === 'string' && id.startsWith('user_'));

      await Promise.all([
        ...userKeys.map(async (key) => {
          const rawId = key.replace('user_', '');
          const u =
            followingUsers.find(u => String(u.USER_ID ?? u.userId ?? u.id) === rawId) ||
            recommendedUsers.find(u => String(u.USER_ID ?? u.id) === rawId);
          const nickname = u?.nickname ?? u?.NICKNAME;
          if (!nickname) return;

          const roomRes = await fetch(`${API}/messages/room`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ targetNicknames: [nickname] }),
          });
          const roomData = await roomRes.json();
          const roomId = roomData.roomId ?? roomData.room_id;
          if (!roomId) throw new Error('방 생성 실패');

          const sendRes = await fetch(`${API}/messages/${roomId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ message }),
          });
          if (!sendRes.ok) throw new Error('메시지 전송 실패');
          newSent.add(key);
        }),
        ...roomKeys.map(async (key) => {
          const roomId = Number(key.replace('room_', ''));
          const sendRes = await fetch(`${API}/messages/${roomId}/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ message }),
          });
          if (!sendRes.ok) throw new Error('메시지 전송 실패');
          newSent.add(key);
        }),
      ]);

      setSentIds(newSent);
      setSelected([]);
      setSendSuccessOpen(true);
      onClose();
    } catch (err) {
      console.error('[ShareModal] 전송 실패:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSendGroup = async () => {
    if (!selected.length || sending) return;
    setSending(true);
    const userKeys = selected.filter(id => typeof id === 'string' && id.startsWith('user_'));
    const nicknames = userKeys
      .map(key => {
        const rawId = key.replace('user_', '');
        const u =
          followingUsers.find(u => String(u.userId) === rawId) ||
          recommendedUsers.find(u => String(u.USER_ID ?? u.id) === rawId);
        return u?.nickname ?? u?.NICKNAME;
      })
      .filter(Boolean);

    try {
      const roomRes = await fetch(`${API}/messages/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetNicknames: nicknames }),
      });
      const roomData = await roomRes.json();
      const roomId = roomData.roomId ?? roomData.room_id;
      if (!roomId) throw new Error('그룹방 생성 실패');
      const isReelPost2 = feed.tag === 'REEL' || feed.category === 'REEL';
      const reelVideoUrl2 = isReelPost2 ? (feed.images?.split(',')[0]?.trim() || null) : null;

      await fetch(`${API}/messages/${roomId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: `__SHARE__${JSON.stringify({ postId: feed.id, title: feed.title, description: feed.description, image: isReelPost2 ? reelVideoUrl2 : (feed.images?.split(',')[0] || null), isReel: isReelPost2, url: shareUrl, text: shareText })}` }),
      });
      setSendSuccessOpen(true);
      onClose();
    } catch (err) {
      console.error('[ShareModal] 그룹 전송 실패:', err);
    } finally {
      setSending(false);
    }
  };

  const isDark = colors?.mode === 'dark';
  const c = {
    bg: isDark ? '#1C1C1E' : '#FFFFFF',
    divider: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    searchBg: isDark ? 'rgba(255,255,255,0.1)' : '#EFEFF0',
    searchText: isDark ? '#EBEBF5' : '#000000',
    searchPlaceholder: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)',
    text: isDark ? '#EBEBF5' : '#000000',
    subText: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)',
    iconBtn: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    urlBg: isDark ? 'rgba(255,255,255,0.07)' : '#F5F5F7',
    copyBtn: isDark ? 'rgba(255,255,255,0.1)' : '#EFEFF0',
    copyBtnHover: isDark ? 'rgba(255,255,255,0.16)' : '#E0E0E2',
    shadow: isDark ? '0 24px 80px rgba(0,0,0,0.65)' : '0 24px 80px rgba(0,0,0,0.15)',
    sendBtnBg: isDark ? 'rgba(255,255,255,0.1)' : '#EFEFF0',
    sendBtnBorder: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
    sendBtnHover: isDark ? 'rgba(255,255,255,0.16)' : '#E5E5E7',
    groupBtnBg: isDark ? '#EBEBF5' : '#000000',
    groupBtnText: isDark ? '#000000' : '#FFFFFF',
  };

  const q = search.trim().toLowerCase();
  const filteredFollowing = q ? followingUsers.filter(u => (u.nickname || '').toLowerCase().includes(q)) : followingUsers;
  const filteredRecommended = q ? recommendedUsers.filter(u => (u.NICKNAME || '').toLowerCase().includes(q)) : recommendedUsers;
  const filteredRooms = q
    ? chatRooms.filter(r => {
      const name = (r.TARGET_NICKNAME || r.ROOM_NAME || '').toLowerCase();
      const participants = (r.PARTICIPANT_NICKNAMES || []).join(' ').toLowerCase();
      return name.includes(q) || participants.includes(q);
    })
    : chatRooms;
  const followingIds = new Set(followingUsers.map(u => String(u.userId)));
  const deduplicatedRecommended = filteredRecommended.filter(u => !followingIds.has(String(u.USER_ID)));
  const allRooms = filteredRooms.filter(r => r.ROOM_TYPE === 'GROUP');
  const hasItems = filteredFollowing.length > 0 || deduplicatedRecommended.length > 0 || allRooms.length > 0;
  const selectedIndividuals = selected.filter(
    id => typeof id === 'string' && id.startsWith('user_')
  );

  return (
    <>
      <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 180, sx: { backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' } } }}>
        <Fade in={open}>
          <Box sx={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: { xs: '94vw', sm: 460 }, maxHeight: '88vh',
            backgroundColor: c.bg, borderRadius: '20px', overflow: 'hidden',
            outline: 'none', display: 'flex', flexDirection: 'column', boxShadow: c.shadow,
          }}>
            <Box sx={{ px: 2, pt: 1.5, pb: 1.5, borderBottom: `0.5px solid ${c.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <IconButton size="small" onClick={onClose} sx={{ color: c.text, backgroundColor: 'transparent', '&:hover': { backgroundColor: c.iconBtn } }}>
                <Close sx={{ fontSize: 22 }} />
              </IconButton>
              <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: c.text, position: 'absolute', left: '50%', transform: 'translateX(-50%)', letterSpacing: '-0.01em' }}>공유</Typography>
              <Box sx={{ width: 36 }} />
            </Box>

            <Box sx={{ px: 2, py: 1.2, borderBottom: `0.5px solid ${c.divider}` }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: c.searchBg, borderRadius: '12px', px: 1.5, py: 0.85 }}>
                <Search sx={{ fontSize: 17, color: c.searchPlaceholder, flexShrink: 0 }} />
                <Box component="input" placeholder="검색" value={search} onChange={e => setSearch(e.target.value)}
                  sx={{ flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.9rem', color: c.searchText, '&::placeholder': { color: c.searchPlaceholder } }} />
              </Box>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { width: 0 } }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress size={22} sx={{ color: c.text }} /></Box>
              ) : !hasItems ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ color: c.subText, fontSize: '0.88rem' }}>{search ? '검색 결과가 없습니다.' : '공유할 수 있는 사용자가 없습니다.'}</Typography>
                </Box>
              ) : (
                <Box sx={{ pt: 1.5, pb: 1 }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', px: 1 }}>
                    {filteredFollowing.map(u => {
                      const uid = `user_${u.USER_ID ?? u.userId ?? u.id}`;
                      return (
                        <UserGridItem
                          key={`f-${uid}`}
                          uid={uid}
                          name={u.NICKNAME ?? u.nickname}
                          avatar={resolveAvatarSrc(u.AVATAR ?? u.avatar)}
                          isSel={selected.includes(uid)}
                          wasSent={sentIds.has(uid)}
                          isDark={isDark}
                          onToggle={toggleSelect}
                        />
                      );
                    })}
                    {allRooms.map(room => {
                      const isGroup = room.ROOM_TYPE === 'GROUP';
                      return isGroup
                        ? < GroupRoomGridItem
                          key={`room-${room.ROOM_ID}`
                          }
                          room={room}
                          isSel={selected.includes(`room_${room.ROOM_ID}`)}
                          wasSent={sentIds.has(`room_${room.ROOM_ID}`)}
                          isDark={isDark}
                          onToggle={toggleSelect}
                        /> : <UserGridItem
                          key={`dm-${room.ROOM_ID}`}
                          uid={`room_${room.ROOM_ID}`}
                          name={room.TARGET_NICKNAME ?? room.ROOM_NAME}
                          avatar={resolveAvatarSrc(room.TARGET_AVATAR)}
                          isSel={selected.includes(`room_${room.ROOM_ID}`)}
                          wasSent={sentIds.has(`room_${room.ROOM_ID}`)}
                          isDark={isDark}
                          onToggle={toggleSelect}
                        />
                    })}
                    {deduplicatedRecommended.map(u => {
                      const uid = `user_${u.USER_ID ?? u.id}`;
                      return (
                        <UserGridItem
                          key={`r-${uid}`}
                          uid={uid}
                          name={u.NICKNAME ?? u.nickname}
                          avatar={resolveAvatarSrc(u.AVATAR ?? u.avatar)}
                          isSel={selected.includes(uid)}
                          wasSent={sentIds.has(uid)}
                          isDark={isDark}
                          onToggle={toggleSelect}
                          badge="추천"
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}
            </Box>
            <Box sx={{ px: 2, py: 1.2, borderTop: `0.5px solid ${c.divider}` }}>
              <Box component="input"
                placeholder="메시지를 함께 보내세요..."
                value={shareText}
                onChange={e => setShareText(e.target.value)}
                sx={{ width: '100%', border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.88rem', color: c.text, '&::placeholder': { color: c.subText } }}
              />
            </Box>
            <Box sx={{ borderTop: `0.5px solid ${c.divider}`, px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.2 }}>
              <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', backgroundColor: c.urlBg, borderRadius: '10px', px: 1.5, py: 0.9, overflow: 'hidden' }}>
                <Typography sx={{ fontSize: '0.78rem', color: c.subText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{shareUrl}</Typography>
              </Box>
              <Box component="button" onClick={handleCopy}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, flexShrink: 0, backgroundColor: copied ? (isDark ? 'rgba(16,185,129,0.2)' : '#ECFDF5') : c.copyBtn, border: copied ? `1px solid ${isDark ? 'rgba(16,185,129,0.4)' : '#A7F3D0'}` : '1px solid transparent', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.18s', '&:hover': { backgroundColor: copied ? (isDark ? 'rgba(16,185,129,0.28)' : '#D1FAE5') : c.copyBtnHover } }}>
                {copied ? <Check sx={{ fontSize: 17, color: '#10B981' }} /> : <ContentCopy sx={{ fontSize: 17, color: c.text }} />}
              </Box>
            </Box>

            {selected.length > 0 && (
              <Box sx={{ borderTop: `0.5px solid ${c.divider}`, px: 2, py: 1.5, display: 'flex', gap: 1 }}>
                <Box component="button" onClick={handleSendIndividual} disabled={sending}
                  sx={{ flex: 1, py: 1.1, backgroundColor: c.sendBtnBg, border: `1px solid ${c.sendBtnBorder}`, borderRadius: '12px', cursor: sending ? 'not-allowed' : 'pointer', transition: 'all 0.15s', '&:hover': { backgroundColor: c.sendBtnHover } }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: c.text }}>
                    {sending ? '전송 중...' : selected.length === 1 ? '보내기' : `따로 보내기 (${selected.length})`}
                  </Typography>
                </Box>
                {selectedIndividuals.length >= 2 && (
                  <Box component="button" onClick={handleSendGroup} disabled={sending}
                    sx={{ flex: 1, py: 1.1, backgroundColor: c.groupBtnBg, border: 'none', borderRadius: '12px', cursor: sending ? 'not-allowed' : 'pointer', transition: 'all 0.15s', '&:hover': { opacity: 0.85 } }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: c.groupBtnText }}>새 그룹채팅 ({selectedIndividuals.length}명)</Typography>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Fade>
      </Modal>
      <Snackbar open={copied} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>링크가 복사되었습니다!</Alert>
      </Snackbar>
      <Snackbar open={sendSuccessOpen} autoHideDuration={2000} onClose={() => setSendSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>전송되었습니다!</Alert>
      </Snackbar>
    </>
  );
};

// ── 그리드 아이템 ──
const UserGridItem = ({ uid, name, avatar, isSel, wasSent, isDark, onToggle, badge }) => (
  <Box onClick={() => !wasSent && onToggle(uid)}
    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1.5, px: 0.5, gap: 0.8, cursor: wasSent ? 'default' : 'pointer', borderRadius: '12px', transition: 'background 0.12s', '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' } }}>
    <Box sx={{ position: 'relative' }}>
      <Avatar src={avatar} sx={{ width: 62, height: 62, backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA', fontWeight: 700, fontSize: '1.3rem', color: isDark ? '#EBEBF5' : '#000', border: isSel ? `3px solid ${isDark ? '#EBEBF5' : '#000'}` : '3px solid transparent', transition: 'border 0.15s' }}>
        {getInitial(name)}
      </Avatar>
      {(isSel || wasSent) && (
        <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', backgroundColor: isDark ? '#EBEBF5' : '#000', border: `2px solid ${isDark ? '#1C1C1E' : '#fff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
          <Check sx={{ fontSize: 13, color: isDark ? '#000' : '#fff' }} />
        </Box>
      )}
      {badge && !isSel && !wasSent && (
        <Box sx={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', backgroundColor: '#2563EB', color: '#fff', fontSize: '0.58rem', fontWeight: 800, px: '5px', py: '1.5px', borderRadius: '6px', whiteSpace: 'nowrap', border: `1.5px solid ${isDark ? '#1C1C1E' : '#fff'}`, zIndex: 3, letterSpacing: '0.02em' }}>추천</Box>
      )}
    </Box>
    <Typography sx={{ fontSize: '0.72rem', fontWeight: wasSent ? 700 : 500, color: wasSent ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)') : (isDark ? '#EBEBF5' : '#000'), textAlign: 'center', lineHeight: 1.3, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mt: badge && !isSel && !wasSent ? 0.8 : 0 }}>
      {wasSent ? '전송됨' : name}
    </Typography>
  </Box>
);

const GroupRoomGridItem = ({ room, isSel, wasSent, isDark, onToggle }) => {
  const avatars = room.PARTICIPANT_AVATARS || [];
  const nicknames = room.PARTICIPANT_NICKNAMES || [];
  const count = Math.max(avatars.length, nicknames.length);

  const renderGroupAvatar = () => {
    // 방 대표 이미지가 있으면 우선 사용
    if (room.ROOM_IMAGE) {
      const src = room.ROOM_IMAGE.startsWith('http') ? room.ROOM_IMAGE : `${API}${room.ROOM_IMAGE}`;
      return (
        <Box component="img" src={src}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
      );
    }

    // 참여자 없으면 기본 아이콘
    if (count === 0) {
      return (
        <PeopleAlt sx={{ fontSize: 26, color: isDark ? '#EBEBF5' : '#636366' }} />
      );
    }

    // 참여자 1명
    if (count === 1) {
      return avatars[0]
        ? <Box component="img"
          src={avatars[0].startsWith('http') ? avatars[0] : `${API}${avatars[0]}`}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
        />
        : <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: isDark ? '#EBEBF5' : '#000' }}>
          {getInitial(nicknames[0])}
        </Typography>;
    }

    // 참여자 2명 이상 — 그리드 분할
    return (
      <Box sx={{
        width: '100%', height: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: count > 2 ? '1fr 1fr' : '1fr',
        borderRadius: '50%',
        overflow: 'hidden',
      }}>
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          avatars[i]
            ? <Box key={i} component="img"
              src={avatars[i].startsWith('http') ? avatars[i] : `${API}${avatars[i]}`}
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            : <Box key={i} sx={{
              width: '100%', height: '100%',
              backgroundColor: isDark ? '#4B5563' : '#0F172A',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.7rem', fontWeight: 800,
            }}>
              {getInitial(nicknames[i])}
            </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box onClick={() => !wasSent && onToggle(`room_${room.ROOM_ID}`)}
      sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 1.5, px: 0.5, gap: 0.8, cursor: wasSent ? 'default' : 'pointer', borderRadius: '12px', transition: 'background 0.12s', '&:hover': { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' } }}>
      <Box sx={{ position: 'relative' }}>
        <Box sx={{
          width: 62, height: 62, borderRadius: '50%',
          backgroundColor: isDark ? '#3A3A3C' : '#E5E5EA',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: isSel ? `3px solid ${isDark ? '#EBEBF5' : '#000'}` : '3px solid transparent',
          transition: 'border 0.15s',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          {renderGroupAvatar()}
        </Box>

        {(isSel || wasSent) && (
          <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: '50%', backgroundColor: isDark ? '#EBEBF5' : '#000', border: `2px solid ${isDark ? '#1C1C1E' : '#fff'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check sx={{ fontSize: 13, color: isDark ? '#000' : '#fff' }} />
          </Box>
        )}
      </Box>

      <Typography sx={{ fontSize: '0.72rem', fontWeight: wasSent ? 700 : 500, color: wasSent ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)') : (isDark ? '#EBEBF5' : '#000'), textAlign: 'center', lineHeight: 1.3, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mt: 0.8 }}>
        {wasSent ? '전송됨' : (room.ROOM_NAME || room.TARGET_NICKNAME)}
      </Typography>
    </Box>
  );
};

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
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.3)', backdropFilter: 'blur(2px)' } } }}>
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
                    onClick={() => { if (n.NOTI_TYPE === 'FOLLOW_REQUEST') return; if (n.POST_ID) navigate(`/post/${n.POST_ID}`); onClose(); }}>
                    <Avatar src={resolveAvatarSrc(n.SENDER_AVATAR)} sx={{ width: 36, height: 36, backgroundColor: colors.textPrimary, fontSize: '0.8rem', fontWeight: 800 }}>
                      {getInitial(n.SENDER_NAME)}
                    </Avatar>
                    {isUnread && <Box sx={{ position: 'absolute', top: -1, right: -1, width: 9, height: 9, borderRadius: '50%', backgroundColor: meta.color, border: `2px solid ${colors.paper}` }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: colors.textPrimary, lineHeight: 1.5, cursor: n.NOTI_TYPE !== 'FOLLOW_REQUEST' ? 'pointer' : 'default' }}
                      onClick={() => { if (n.NOTI_TYPE === 'FOLLOW_REQUEST') return; if (n.POST_ID) navigate(`/post/${n.POST_ID}`); onClose(); }}>
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

const ReelPlayer = ({ src }) => {
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
      { threshold: 0.5 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); }
    else { videoRef.current.pause(); setPlaying(false); }
  };

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', height: '100%' }}>
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        playsInline
        loop
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        onClick={toggle}
      />
      {!playing && (
        <Box onClick={toggle} sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Box sx={{ width: 0, height: 0, borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '18px solid #fff', ml: '3px' }} />
        </Box>
      )}
      <Box
        onClick={e => { e.stopPropagation(); setMuted(m => { videoRef.current.muted = !m; return !m; }); }}
        sx={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
      >
        {muted ? <VolumeOff sx={{ fontSize: 16, color: '#fff' }} /> : <VolumeUp sx={{ fontSize: 16, color: '#fff' }} />}
      </Box>
    </Box>
  );
};

const PostCard = ({ feed: initialFeed, token, myNickname, onDelete, onUpdate, onTagClick, colors }) => {
  const navigate = useNavigate();

  const [feed, setFeed] = useState(initialFeed);
  const [liked, setLiked] = useState(feed.liked ?? false);
  const [likeCount, setLikeCount] = useState(feed.likes ?? 0);
  const [bookmarked, setBookmarked] = useState(feed.bookmarked ?? false);
  const [bookmarkAnim, setBookmarkAnim] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareSnackOpen, setShareSnackOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportSuccessOpen, setReportSuccessOpen] = useState(false);
  const [reportDuplicateOpen, setReportDuplicateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [followStatus, setFollowStatus] = useState('NONE');
  const [heartTrigger, setHeartTrigger] = useState(0);
  const [hoverAnchor, setHoverAnchor] = useState(null);
  const [hoverVisible, setHoverVisible] = useState(false);

  const lastTapRef = useRef(0);
  const clickTimerRef = useRef(null);

  const imageList = feed.images ? feed.images.split(',').filter(Boolean) : [];

  const isReel = feed.tag === 'REEL' || feed.category === 'REEL';
  const videoList = isReel ? feed.images?.split(',').filter(Boolean) ?? [] : [];
  const displayImageList = isReel ? [] : imageList;

  const isMyPost = myNickname && (feed.writer === myNickname || feed.WRITER === myNickname);
  const tag = feed.tag || feed.category || 'General';
  const postLocation = feed.LOCATION || feed.location || null;

  const bioShort = feed.bioShort || feed.BIO_SHORT || '';

  const handleCardDoubleClick = () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(c => c + 1);
      fetch(`${API}/feed/${feed.id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
    }
    setHeartTrigger(t => t + 1);
  };

  const handleCardTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 280) {
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
    }, 280);
  };

  const leaveTimer = useRef(null);
  const hoverTimer = useRef(null);

  const handleAvatarEnter = (e) => {
    clearTimeout(leaveTimer.current);
    const el = e.currentTarget;
    hoverTimer.current = setTimeout(() => { setHoverAnchor(el); setHoverVisible(true); }, 400);
  };
  const handleAvatarLeave = () => {
    clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => {
      setHoverVisible(false);
      setHoverAnchor(null);
    }, 200);
  };
  const handleCardMouseEnter = () => clearTimeout(leaveTimer.current);
  const handleCardMouseLeave = () => {
    leaveTimer.current = setTimeout(() => {
      setHoverVisible(false);
      setHoverAnchor(null);
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

  const handleFollow = async (e) => {
    e.stopPropagation();
    const prev = followStatus;
    setFollowStatus('OPTIMISTIC');
    try {
      const res = await fetch(`${API}/user/follow/${feed.userId ?? feed.USER_ID}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setFollowStatus(data.status);
      else setFollowStatus(prev);
    } catch { setFollowStatus(prev); }
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

  const handleEditSaved = (updatedFeed) => {
    setEditOpen(false);
    if (updatedFeed) {
      const merged = {
        ...feed,
        title: updatedFeed.TITLE ?? updatedFeed.title ?? feed.title,
        description: updatedFeed.CONTENT ?? updatedFeed.content ?? updatedFeed.DESCRIPTION ?? updatedFeed.description ?? feed.description,
        images: updatedFeed.IMAGES ?? updatedFeed.images ?? feed.images,  // ← 이미 있음
        tag: updatedFeed.CATEGORY_NAME ?? updatedFeed.category ?? updatedFeed.TAG ?? updatedFeed.tag ?? feed.tag,
        tags: updatedFeed.TAGS
          ? (typeof updatedFeed.TAGS === 'string' ? updatedFeed.TAGS.split(',').filter(Boolean) : updatedFeed.TAGS)
          : (updatedFeed.tags ?? feed.tags),
        LOCATION: updatedFeed.LOCATION ?? updatedFeed.location ?? feed.LOCATION,
      };
      setFeed(merged);
      onUpdate?.(merged);
    }
  };

  const followBtnLabel = followStatus === 'ACCEPTED' ? '팔로잉' : (followStatus === 'PENDING' || followStatus === 'OPTIMISTIC') ? '요청됨' : '팔로우';
  const followBtnSx = followStatus === 'ACCEPTED'
    ? { backgroundColor: colors.paper, color: colors.textPrimary, border: `1px solid ${colors.border}`, '&:hover': { backgroundColor: colors.hover } }
    : (followStatus === 'PENDING' || followStatus === 'OPTIMISTIC')
      ? { backgroundColor: colors.hover, color: colors.textMuted, border: `1px solid ${colors.border}` }
      : { backgroundColor: '#2563EB', color: '#fff', '&:hover': { backgroundColor: '#1D4ED8' } };

  return (
    <>
      <Box
        onClick={handleCardTap}
        onDoubleClick={(e) => { e.preventDefault(); handleCardDoubleClick(); }}
        sx={{
          backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2,
          p: 3, cursor: 'pointer',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          position: 'relative', overflow: 'hidden',
          '&:hover': { borderColor: colors.borderFocus, boxShadow: '0 4px 20px rgba(15,23,42,0.06)' },
          '@keyframes fadeUp': {
            from: { opacity: 0, transform: 'translateY(16px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
        }}
      >
        <HeartOverlay trigger={heartTrigger} />

        {/* ── 헤더 ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              src={resolveAvatarSrc(feed.avatar)}
              onMouseEnter={handleAvatarEnter}
              onMouseLeave={handleAvatarLeave}
              onClick={(e) => { e.stopPropagation(); navigate(`/user/${feed.writer}`); }}
              sx={{ width: 36, height: 36, backgroundColor: colors.textPrimary, fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer', flexShrink: 0, '&:hover': { opacity: 0.85 }, transition: 'opacity 0.15s' }}
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
              {/* [FIX] 한줄소개 별도 줄로 분리 */}
              {bioShort && (
                <Typography sx={{ color: colors.textHint, fontSize: '0.72rem', mt: 0.15, lineHeight: 1.3, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bioShort}
                </Typography>
              )}
              <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: bioShort ? 0.2 : 0.3 }}>
                <Typography sx={{ color: colors.textHint, fontSize: '0.72rem' }}>
                  {formatRelativeTime(feed.createdAt)}
                </Typography>
                {postLocation && (
                  <>
                    <Typography sx={{ color: colors.textHint, fontSize: '0.72rem' }}>·</Typography>
                    <LocationOn sx={{ fontSize: 11, color: colors.textHint }} />
                    <Typography
                      onClick={(e) => {
                        e.stopPropagation(); navigate(`/explore?location=${encodeURIComponent(postLocation)}`);
                      }}
                      sx={{ color: colors.textHint, fontSize: '0.72rem', cursor: 'pointer', '&:hover': { color: '#2563EB', textDecoration: 'underline' }, transition: 'color 0.15s' }}
                    >
                      {postLocation}
                    </Typography>
                  </>
                )}
              </Stack>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {feed.feedType === 'RECOMMENDED' && !isMyPost && (
              <Button size="small" onClick={handleFollow}
                sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', px: 1.5, py: 0.4, borderRadius: 1, mr: 0.5, transition: 'all 0.15s', ...followBtnSx }}>
                {followBtnLabel}
              </Button>
            )}
            <Chip label={tag} size="small"
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
                <MenuItem key="edit" onClick={(e) => { e.stopPropagation(); setAnchorEl(null); setEditOpen(true); }}
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

        {/* ── 제목 ── */}
        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: colors.textPrimary, mb: 0.8, lineHeight: 1.4, letterSpacing: '-0.01em' }}>
          {feed.title}
        </Typography>

        {!isReel && (
          <Typography
            component="div"
            sx={{
              color: colors.textMuted, fontSize: '0.85rem', lineHeight: 1.75,
              display: '-webkit-box', WebkitLineClamp: displayImageList.length > 0 ? 2 : 4,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
              maxHeight: displayImageList.length > 0 ? '3.5em' : '7em',
              '& pre': {
                backgroundColor: colors.mode === 'dark' ? '#0D1117' : '#F1F5F9',
                border: `1px solid ${colors.border}`, borderRadius: '6px',
                padding: '6px 10px',
                fontFamily: '"Fira Code", "Consolas", monospace',
                fontSize: '0.78rem', color: colors.mode === 'dark' ? '#E2E8F0' : '#1E293B',
                display: 'block', overflowX: 'auto', my: 0.5, maxWidth: '100%',
                whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '4.5em', overflow: 'hidden',
              },
              '& code': {
                backgroundColor: colors.mode === 'dark' ? '#0D1117' : '#F1F5F9',
                border: `1px solid ${colors.border}`, borderRadius: '4px', padding: '1px 5px',
                fontFamily: '"Fira Code", "Consolas", monospace',
                fontSize: '0.78rem', color: colors.mode === 'dark' ? '#E2E8F0' : '#1E293B',
              },
              '& img': { display: 'none' },
            }}
            dangerouslySetInnerHTML={{ __html: resolveImageSrc(feed.description || '') }}
          />
        )}

        {/* ── 해시태그 ── */}
        {Array.isArray(feed.tags) && feed.tags.filter(Boolean).length > 0 && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
            {feed.tags.filter(Boolean).map(t => (
              <Box key={t} onClick={(e) => { e.stopPropagation(); onTagClick && onTagClick(t); }}
                sx={{ fontSize: '0.72rem', color: '#2563EB', fontWeight: 600, cursor: 'pointer', px: 0.5, '&:hover': { textDecoration: 'underline' } }}>
                #{t}
              </Box>
            ))}
          </Stack>
        )}

        {isReel && videoList.length > 0 && (
          <Box
            onClick={e => e.stopPropagation()}
            sx={{ mt: 2, borderRadius: 1.5, overflow: 'hidden', position: 'relative', aspectRatio: '9/16', backgroundColor: '#000', cursor: 'pointer' }}
          >
            <ReelPlayer src={resolveFileSrc(videoList[0])} />
          </Box>
        )}
        {!isReel && <ImageGallery imageList={imageList} colors={colors} />}

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
            <Tooltip title="공유하기" placement="top">
              <IconButton size="small"
                onClick={(e) => { e.stopPropagation(); setShareModalOpen(true); }}
                sx={{ color: colors.textHint, '&:hover': { color: '#2563EB' }, transition: 'color 0.15s' }}>
                <ShareOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={handleBookmark} sx={{ transition: 'color 0.15s' }}>
              <Box sx={{
                animation: bookmarkAnim ? 'bookmarkPop 0.45s ease both' : 'none', display: 'flex',
                '@keyframes bookmarkPop': { '0%': { transform: 'scale(1)' }, '40%': { transform: 'scale(1.35)' }, '100%': { transform: 'scale(1)' } },
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

      <EditModal
        open={editOpen}
        postId={feed.id}
        onClose={() => setEditOpen(false)}
        onSaved={handleEditSaved}
      />

      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        feed={feed}
        token={token}
        colors={colors}
        navigate={navigate}
      />

      <Snackbar open={shareSnackOpen} autoHideDuration={2000} onClose={() => setShareSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>링크가 클립보드에 복사되었습니다!</Alert>
      </Snackbar>

      <ConfirmModal open={deleteOpen} title="게시글 삭제" message="이 게시글을 삭제하시겠습니까? 삭제한 게시글은 복구할 수 없습니다." confirmLabel="삭제" confirmColor="#EF4444" onConfirm={handleDeleteConfirm} onClose={() => setDeleteOpen(false)} colors={colors} />
      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} postId={feed.id} token={token} onSuccess={() => setReportSuccessOpen(true)} onDuplicate={() => setReportDuplicateOpen(true)} colors={colors} />

      <Snackbar open={reportSuccessOpen} autoHideDuration={2500} onClose={() => setReportSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>신고가 접수되었습니다.</Alert>
      </Snackbar>
      <Snackbar open={reportDuplicateOpen} autoHideDuration={2500} onClose={() => setReportDuplicateOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="warning" icon={<FlagOutlined fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>이미 신고한 게시글입니다.</Alert>
      </Snackbar>

      {hoverVisible && (
        <ProfileHoverCard
          nickname={feed.writer}
          token={token}
          anchorEl={hoverAnchor}
          colors={colors}
          navigate={navigate}
          onMouseEnter={handleCardMouseEnter}
          onMouseLeave={handleCardMouseLeave}
        />
      )}
    </>
  );
};

const RecommendedDivider = ({ colors }) => (
  <Box sx={{ textAlign: 'center', py: 4 }}>
    <Box sx={{ width: 56, height: 56, borderRadius: '50%', border: `2px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
      <Check sx={{ fontSize: 22, color: colors.textHint }} />
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: colors.textPrimary, mb: 0.5 }}>모두 확인했습니다</Typography>
    <Typography sx={{ fontSize: '0.82rem', color: colors.textHint, mb: 3 }}>최근 3일 동안 새롭게 올라온 게시물을 모두 확인했습니다.</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textHint, whiteSpace: 'nowrap' }}>추천 게시글</Typography>
      <Box sx={{ flex: 1, height: '1px', backgroundColor: colors.border }} />
    </Box>
  </Box>
);

// ─────────────────────────────────────────────
//  Sidebar
// ─────────────────────────────────────────────
const Sidebar = ({ trending, suggestions, loadingTrending, loadingSuggestions, token, colors, onTagClick, navigate }) => {
  const [followStatus, setFollowStatus] = useState({});

  const handleFollow = async (s) => {
    const userId = s.USER_ID;
    const prev = followStatus[userId] || 'NONE';
    setFollowStatus(f => ({ ...f, [userId]: prev === 'NONE' ? 'OPTIMISTIC' : 'NONE' }));
    try {
      const res = await fetch(`${API}/user/follow/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setFollowStatus(f => ({ ...f, [userId]: data.status }));
      else setFollowStatus(f => ({ ...f, [userId]: prev }));
    } catch { setFollowStatus(f => ({ ...f, [userId]: prev })); }
  };

  const getFollowBtnSx = (status) => {
    switch (status) {
      case 'ACCEPTED': return { backgroundColor: colors.paper, color: colors.textPrimary, border: `1px solid ${colors.border}`, boxShadow: 'none', '&:hover': { backgroundColor: colors.hover, borderColor: colors.borderFocus } };
      case 'PENDING':
      case 'OPTIMISTIC': return { backgroundColor: colors.hover, color: colors.textMuted, border: `1px solid ${colors.border}`, boxShadow: 'none' };
      default: return { backgroundColor: '#2563EB', color: '#fff', border: '1px solid #2563EB', boxShadow: 'none', '&:hover': { backgroundColor: '#1D4ED8' } };
    }
  };
  const getFollowLabel = (s) => s === 'ACCEPTED' ? '팔로잉' : (s === 'PENDING' || s === 'OPTIMISTIC') ? '요청됨' : '팔로우';

  return (
    <Stack spacing={2.5}>
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
              <Box key={t.TAG_NAME || t.tag}
                onClick={() => onTagClick && onTagClick(t.TAG_NAME || t.tag)}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', p: 1, borderRadius: 1, transition: '0.15s', '&:hover': { backgroundColor: colors.hover } }}>
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
                <Box key={uid} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, p: 0.8, borderRadius: 1, cursor: 'pointer', transition: '0.15s', '&:hover': { backgroundColor: colors.hover } }}>
                  <Box onClick={() => navigate(`/user/${s.NICKNAME || s.name}`)} sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
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
                  <Button size="small" onClick={() => handleFollow(s)}
                    sx={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'none', minWidth: 0, px: 1.5, py: 0.4, borderRadius: 1, flexShrink: 0, transition: 'all 0.15s', ...getFollowBtnSx(status) }}>
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
  const location = useLocation();
  const { mode } = useColorMode();
  const token = localStorage.getItem('accessToken');
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(!!location.state?.deletedPost);
  const [sendSuccessOpen, setSendSuccessOpen] = useState(false);
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
  const [editSuccessOpen, setEditSuccessOpen] = useState(false);
  // [FIX] 맨 위로 버튼 상태
  const [showTopBtn, setShowTopBtn] = useState(false);

  // [FIX] 스크롤 감지
  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleUpdate = useCallback((updatedFeed) => {
    if (updatedFeed) {
      setFeeds(prev => prev.map(f => f.id === (updatedFeed.id ?? updatedFeed.POST_ID) ? { ...f, ...updatedFeed } : f));
      setRecommendedFeeds(prev => prev.map(f => f.id === (updatedFeed.id ?? updatedFeed.POST_ID) ? { ...f, ...updatedFeed } : f));
    }
    setEditSuccessOpen(true);
  }, []);

  const loadTrending = useCallback(async (filter) => {
    try {
      const found = FIXED_CATEGORIES.find(c => c.label === filter);
      const categoryParam = found?.value ? `?category=${found.value}` : '';
      const res = await fetch(`${API}/feed/trending${categoryParam}`, { headers: { Authorization: `Bearer ${token}` } });
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
    loadTrending('전체');
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

  useEffect(() => {
    const handler = async () => {
      await loadFeeds();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('postCreated', handler);
    return () => window.removeEventListener('postCreated', handler);
  }, [loadFeeds]);

  useEffect(() => {
    const saved = sessionStorage.getItem('feedScrollY');
    if (saved) {
      setTimeout(() => {
        window.scrollTo({ top: Number(saved), behavior: 'instant' });
        sessionStorage.removeItem('feedScrollY');
      }, 50);
    }
    const handleScroll = () => {
      sessionStorage.setItem('feedScrollY', String(window.scrollY));
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    loadTrending(activeFilter);
  }, [loadTrending, activeFilter]);

  const handleTagClick = useCallback((tagName) => {
    const CATEGORIES = ['REEL', 'ERROR', 'QUESTION', 'FREE', 'General', '트러블슈팅 / 에러 해결'];
    if (CATEGORIES.includes(tagName)) {
      navigate(`/explore?category=${encodeURIComponent(tagName)}`);
    } else {
      navigate(`/explore?tag=${encodeURIComponent(tagName)}`);
    }
  }, [navigate]);

  const handleFilterChange = (label) => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    setActiveFilter(label);
    loadTrending(label);
  };

  const dynamicTagLabels = trending.map(t => t.TAG_NAME || t.tag).filter(Boolean);

  const filteredFeeds = useMemo(() => {
    if (activeFilter === '전체') return feeds;
    const found = FIXED_CATEGORIES.find(c => c.label === activeFilter);
    if (found?.value) return feeds.filter(f => (f.category || f.tag || '') === found.value);
    return feeds.filter(f => {
      const tagArr = Array.isArray(f.tags) ? f.tags : (f.tags ? f.tags.split(',') : []);
      return tagArr.includes(activeFilter) || (f.category || f.tag || '') === activeFilter;
    });
  }, [feeds, activeFilter]);

  const filteredRecommended = useMemo(() => {
    if (activeFilter === '전체') return recommendedFeeds;
    const found = FIXED_CATEGORIES.find(c => c.label === activeFilter);
    if (found?.value) return recommendedFeeds.filter(f => (f.category || f.tag || '') === found.value);
    return recommendedFeeds.filter(f => {
      const tagArr = Array.isArray(f.tags) ? f.tags : (f.tags ? f.tags.split(',') : []);
      return tagArr.includes(activeFilter) || (f.category || f.tag || '') === activeFilter;
    });
  }, [recommendedFeeds, activeFilter]);

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg }}>

      {/* ── 카테고리 필터 탭 ── */}
      <Box sx={{
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.mode === 'dark' ? 'rgba(15,17,23,0.9)' : 'rgba(248,250,252,0.9)',
        backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 90,
      }}>
        <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 4 } }}>
          <Stack direction="row" spacing={0} alignItems="center" sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
            {FIXED_CATEGORIES.map(t => (
              <Button key={t.label} size="small" startIcon={t.icon}
                onClick={() => handleFilterChange(t.label)}
                sx={{ textTransform: 'none', fontWeight: activeFilter === t.label ? 700 : 500, fontSize: '0.82rem', whiteSpace: 'nowrap', px: 2, py: 1.8, borderRadius: 0, color: activeFilter === t.label ? colors.textPrimary : colors.textHint, borderBottom: activeFilter === t.label ? '2px solid #2563EB' : '2px solid transparent', '&:hover': { color: colors.textPrimary, backgroundColor: 'transparent' }, transition: 'all 0.15s', minWidth: 'fit-content' }}>
                {t.label}
              </Button>
            ))}
            {dynamicTagLabels.length > 0 && <Box sx={{ width: '1px', height: 18, backgroundColor: colors.border, mx: 1, flexShrink: 0 }} />}
            {dynamicTagLabels.map(label => (
              <Button key={label} size="small"
                onClick={() => { handleTagClick(label); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                sx={{ textTransform: 'none', fontWeight: activeFilter === label ? 700 : 400, fontSize: '0.8rem', whiteSpace: 'nowrap', px: 1.8, py: 1.8, borderRadius: 0, color: activeFilter === label ? '#2563EB' : colors.textHint, borderBottom: activeFilter === label ? '2px solid #2563EB' : '2px solid transparent', '&:hover': { color: '#2563EB', backgroundColor: 'transparent' }, transition: 'all 0.15s', minWidth: 'fit-content' }}>
                #{label}
              </Button>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* ── 메인 콘텐츠 ── */}
      <Box sx={{ maxWidth: 960, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>

          {/* 피드 목록 */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {loadingFeeds ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress sx={{ color: '#2563EB' }} /></Box>
            ) : (
              <>
                {filteredFeeds.length > 0 ? (
                  <Stack spacing={2}>
                    {filteredFeeds.map((feed, i) => (
                      <Box key={feed.id} sx={{ animationDelay: `${i * 0.04}s` }}>
                        {/* [FIX] onUpdate prop 전달 */}
                        <PostCard feed={feed} token={token} myNickname={myNickname} onUpdate={handleUpdate}
                          onDelete={handleDelete} onTagClick={handleTagClick} colors={colors} />
                      </Box>
                    ))}
                    <Box ref={bottomRef} sx={{ height: 1 }} />
                  </Stack>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography sx={{ color: colors.textHint, fontSize: '0.88rem' }}>
                      {activeFilter === '전체' ? '팔로우한 사람의 글이 없습니다.' : `'${activeFilter}' 게시물이 없습니다.`}
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
                            {/* [FIX] onUpdate prop 전달 */}
                            <PostCard feed={feed} token={token} myNickname={myNickname} onUpdate={handleUpdate}
                              onDelete={handleDelete} onTagClick={handleTagClick} colors={colors} />
                          </Box>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )}
              </>
            )}
          </Box>

          <Box sx={{ width: 280, flexShrink: 0, display: { xs: 'none', lg: 'block' }, position: 'sticky', top: 80, alignSelf: 'flex-start' }}>
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

      {/* ── 스낵바 ── */}
      <Snackbar open={deleteSuccessOpen} autoHideDuration={2000} onClose={() => setDeleteSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success">게시글이 삭제되었습니다.</Alert>
      </Snackbar>
      {/* [FIX] 수정 성공 토스트 */}
      <Snackbar open={editSuccessOpen} autoHideDuration={2000} onClose={() => setEditSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>게시글이 수정되었습니다.</Alert>
      </Snackbar>

      {/* [FIX] 맨 위로 버튼 — 스크롤 400px 이상 시 표시 */}
      {showTopBtn && (
        <Fade in={showTopBtn}>
          <Box
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              zIndex: 999,
              width: 44, height: 44,
              borderRadius: '50%',
              backgroundColor: colors.paper,
              border: `1px solid ${colors.border}`,
              boxShadow: colors.mode === 'dark'
                ? '0 4px 20px rgba(0,0,0,0.5)'
                : '0 4px 16px rgba(15,23,42,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: colors.hover,
                borderColor: colors.borderFocus,
                transform: 'translateY(-2px)',
                boxShadow: colors.mode === 'dark'
                  ? '0 8px 28px rgba(0,0,0,0.6)'
                  : '0 8px 24px rgba(15,23,42,0.16)',
              },
            }}
          >
            <KeyboardArrowUp sx={{ fontSize: 22, color: colors.textPrimary }} />
          </Box>
        </Fade>
      )}

      <NotificationModal open={notiModalOpen} onClose={() => setNotiModalOpen(false)} token={token} navigate={navigate} colors={colors} />
    </Box>
  );
}

export { ShareModal };
