import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactDOM from 'react-dom';
import {
    Box, Typography, Avatar, IconButton, CssBaseline, Button, Chip,
    Menu, MenuItem, Snackbar, Alert, CircularProgress,
    TextField, InputAdornment, Modal, Backdrop, Fade, RadioGroup, FormControlLabel, Radio, Stack
} from '@mui/material';
import {
    FavoriteBorder, Favorite, ChatBubbleOutline, Send,
    MoreHoriz, MusicNote, Delete, Edit, Flag, Close, VolumeOff, VolumeUp,
    ShareOutlined, FavoriteBorderOutlined, FlagOutlined
} from '@mui/icons-material';
import { useColorMode } from '../App';
import EditModal from './EditModal';
import { ShareModal } from './Feed';

const API = 'http://localhost:3010';

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

const resolveAvatarSrc = (src) => {
    if (!src) return undefined;
    if (src.startsWith('http')) return src;
    return `${API}${src}`;
};

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (diff < 60000) return '방금 전';
    if (mins < 60) return `${mins}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    return d.toLocaleDateString('ko-KR');
};

// ==========================================
// 모달 & 오버레이 컴포넌트
// ==========================================
// 1. 하트 애니메이션 오버레이
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
                    <Favorite sx={{ fontSize: 100, color: '#EF4444', filter: 'drop-shadow(0 4px 12px rgba(239,68,68,0.5))' }} />
                </Box>
            ))}
        </>
    );
};

// 2. 삭제 확인 모달
const ConfirmModal = ({ open, title, message, confirmLabel = '확인', confirmColor = '#EF4444', onConfirm, onClose, colors }) => (
    <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 200 } }}>
        <Fade in={open}>
            <Box sx={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                width: 320, backgroundColor: colors.paper, borderRadius: 3, p: 3, outline: 'none'
            }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary, mb: 1 }}>{title}</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 3 }}>{message}</Typography>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} sx={{ color: colors.textMuted }}>취소</Button>
                    <Button onClick={onConfirm} sx={{ backgroundColor: confirmColor, color: '#fff', '&:hover': { opacity: 0.9 } }}>{confirmLabel}</Button>
                </Box>
            </Box>
        </Fade>
    </Modal>
);

const ReportModal = ({ open, onClose, postId, commentId, token, colors, title = '신고하기', reasons = REPORT_REASONS }) => {
    const [reason, setReason] = useState('');
    const [detail, setDetail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!reason || submitting) return;
        setSubmitting(true);
        try {
            const url = commentId
                ? `${API}/feed/${postId}/comment/${commentId}/report`
                : `${API}/feed/${postId}/report`;
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ reason, detail }),
            });
            setReason(''); setDetail('');
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); onClose(); }
    };

    return (
        <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }}
            slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' } } }}>
            <Fade in={open}>
                <Box sx={{
                    position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: { xs: '90vw', sm: 440 }, backgroundColor: colors.paper, borderRadius: 3,
                    border: `1px solid ${colors.border}`, boxShadow: '0 20px 60px rgba(15,23,42,0.25)',
                    overflow: 'hidden', outline: 'none',
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
                                        border: reason === r.value ? '1px solid #2563EB' : '1px solid transparent',
                                        backgroundColor: reason === r.value
                                            ? (colors.mode === 'dark' ? '#172033' : '#EFF6FF')
                                            : 'transparent',
                                        transition: 'all 0.15s',
                                        '& .MuiFormControlLabel-label': {
                                            fontSize: '0.88rem',
                                            fontWeight: reason === r.value ? 600 : 400,
                                            color: colors.textPrimary,
                                        },
                                    }}
                                />
                            ))}
                        </RadioGroup>
                        {reason === 'OTHER' && (
                            <TextField multiline rows={2} fullWidth placeholder="기타 사유를 입력해주세요"
                                value={detail} onChange={e => setDetail(e.target.value)}
                                sx={{ mt: 1.5, '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: 1.5, backgroundColor: colors.paper, color: colors.textPrimary, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#2563EB' } } }}
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

const addReplyToTree = (comments, parentId, newReply) =>
    comments.map(c => {
        if ((c.COMMENT_ID || c.id) === parentId) return { ...c, replies: [...(c.replies || []), newReply] };
        if (c.replies?.length) return { ...c, replies: addReplyToTree(c.replies, parentId, newReply) };
        return c;
    });

const removeFromTree = (comments, commentId) =>
    comments.filter(c => (c.COMMENT_ID || c.id) !== commentId)
        .map(c => ({ ...c, replies: removeFromTree(c.replies || [], commentId) }));

const countComments = (comments) =>
    comments.reduce((acc, c) => acc + 1 + countComments(c.replies || []), 0);


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
                    onClick={(e) => { e.stopPropagation(); navigate(`/user/${data.user.NICKNAME}`); }}>
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
                        <Box key={p.id} onClick={(e) => { e.stopPropagation(); navigate(`/post/${p.id}`); }}
                            sx={{ aspectRatio: '1', borderRadius: 1, overflow: 'hidden', backgroundColor: colors.inputBg, cursor: 'pointer', '&:hover': { opacity: 0.8 }, transition: 'opacity 0.15s' }}>
                            {(p.tag === 'REEL' || p.category === 'REEL') ? (
                                p.images ? (
                                    <Box component="video"
                                        src={p.images.startsWith('http') ? p.images : `${API}${p.images}`}
                                        muted preload="auto"
                                        onLoadedMetadata={e => {
                                            const video = e.target;
                                            video.addEventListener('seeked', () => { }, { once: true });
                                            video.currentTime = video.duration ? video.duration / 2 : 1;
                                        }}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
                                    />
                                ) : (
                                    <Box sx={{ width: '100%', height: '100%', backgroundColor: '#111' }} />
                                )
                            ) : (
                                <Box component="img"
                                    src={p.images ? (p.images.startsWith('http') ? p.images : `${API}${p.images}`) : `${API}/uploads/post/defaultImg.png`}
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

const ReelCommentItem = ({ comment, index, depth = 0, onReply, onDelete, myNickname, postWriter, colors, token, postId, navigate }) => {
    const isReply = depth > 0;
    const isMyComment = (comment.WRITER || comment.writer) === myNickname;
    const isPostWriter = (comment.WRITER || comment.writer) === postWriter;
    const [liked, setLiked] = useState((comment.MY_LIKE ?? 0) > 0);
    const [likeCount, setLikeCount] = useState(comment.LIKE_COUNT ?? 0);
    const [repliesOpen, setRepliesOpen] = useState(true);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [editText, setEditText] = useState('');
    const [reportOpen, setReportOpen] = useState(false);
    const [hoverAnchor, setHoverAnchor] = useState(null);
    const [hoverVisible, setHoverVisible] = useState(false);
    const hoverTimer = useRef(null);
    const leaveTimer = useRef(null);

    const handleLike = async (e) => {
        e.stopPropagation();
        const next = !liked;
        setLiked(next); setLikeCount(c => c + (next ? 1 : -1));
        try {
            await fetch(`${API}/feed/${postId}/comment/${comment.COMMENT_ID}/like`, {
                method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
        } catch { setLiked(!next); setLikeCount(c => c + (next ? -1 : 1)); }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`${API}/feed/${postId}/comment/${comment.COMMENT_ID}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) onDelete(comment.COMMENT_ID);
        } catch { }
        setDeleteOpen(false);
    };

    const handleEditSubmit = async () => {
        if (!editText.trim()) return;
        try {
            const res = await fetch(`${API}/feed/${postId}/comment/${comment.COMMENT_ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ content: `<p>${editText}</p>`, text: editText }),
            });
            if (res.ok) {
                comment.CONTENT = `<p>${editText}</p>`;
            }
        } catch { }
        setEditOpen(false);
    };

    const commentBodySx = {
        fontSize: '0.85rem', color: colors.textMuted, lineHeight: 1.6,
        '& p': { mb: 0.3, mt: 0, color: colors.textMuted },
        '& span[style]': { color: '#2563EB', fontWeight: 600 },
        '& code': { backgroundColor: colors.mode === 'dark' ? '#0D1117' : '#F1F5F9', color: '#CE9178', px: 0.6, py: 0.1, borderRadius: 0.5, fontSize: '0.82em', fontFamily: 'monospace' },
    };

    const writerName = comment.WRITER || comment.writer;

    return (
        <Box>
            <Box sx={{
                display: 'flex', gap: 1.2, py: 1.5,
                pl: depth === 1 ? 2 : depth === 2 ? 4 : 0,
                borderBottom: `1px solid ${colors.border}`,
                borderLeft: depth > 0 ? `2px solid ${colors.border}` : 'none',
                '&:last-child': { borderBottom: 'none' },
            }}>
                <Avatar
                    src={resolveAvatarSrc(comment.AVATAR || comment.avatar)}
                    onMouseEnter={(e) => {
                        clearTimeout(leaveTimer.current);
                        const el = e.currentTarget;
                        hoverTimer.current = setTimeout(() => { setHoverAnchor(el); setHoverVisible(true); }, 400);
                    }}
                    onMouseLeave={() => {
                        clearTimeout(hoverTimer.current);
                        leaveTimer.current = setTimeout(() => { setHoverVisible(false); setHoverAnchor(null); }, 200);
                    }}
                    onClick={() => navigate(`/user/${writerName}`)}
                    sx={{ width: isReply ? 26 : 30, height: isReply ? 26 : 30, flexShrink: 0, backgroundColor: colors.textPrimary, fontSize: isReply ? '0.6rem' : '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                >
                    {getInitial(writerName)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.3, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: isReply ? '0.75rem' : '0.82rem', color: colors.textPrimary }}>
                            {writerName || '익명'}
                        </Typography>
                        {isPostWriter && (
                            <Chip label="작성자" size="small" sx={{ height: 14, fontSize: '0.58rem', fontWeight: 700, backgroundColor: colors.textPrimary, color: colors.paper, px: 0.2 }} />
                        )}
                        <Typography sx={{ fontSize: '0.7rem', color: colors.textHint }}>
                            {formatRelativeTime(comment.CREATED_AT || comment.createdAt)}
                        </Typography>
                        <IconButton size="small" onClick={e => { e.stopPropagation(); setMenuAnchor(e.currentTarget); }} sx={{ ml: 'auto', color: colors.textHint, p: 0.2 }}>
                            <MoreHoriz sx={{ fontSize: 14 }} />
                        </IconButton>
                        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
                            PaperProps={{ sx: { backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 1.5, minWidth: 100 } }}>
                            {isMyComment ? [
                                <MenuItem key="edit" onClick={() => { setEditText(comment.CONTENT?.replace(/<[^>]+>/g, '') || ''); setEditOpen(true); setMenuAnchor(null); }} sx={{ fontSize: '0.8rem', color: colors.textPrimary, gap: 1 }}>
                                    <Edit sx={{ fontSize: 14 }} /> 수정
                                </MenuItem>,
                                <MenuItem key="delete" onClick={() => { setDeleteOpen(true); setMenuAnchor(null); }} sx={{ fontSize: '0.8rem', color: '#EF4444', gap: 1 }}>
                                    <Delete sx={{ fontSize: 14, color: '#EF4444' }} /> 삭제
                                </MenuItem>
                            ] : (
                                <MenuItem onClick={() => { setReportOpen(true); setMenuAnchor(null); }} sx={{ fontSize: '0.8rem', color: colors.textPrimary, gap: 1 }}>
                                    <FlagOutlined sx={{ fontSize: 14, color: colors.textMuted }} /> 신고
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>

                    {editOpen ? (
                        <Box sx={{ mt: 0.5 }}>
                            <TextField
                                fullWidth size="small" value={editText}
                                onChange={e => setEditText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSubmit(); } if (e.key === 'Escape') setEditOpen(false); }}
                                sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: 1.5, backgroundColor: colors.paper, color: colors.textPrimary, '& fieldset': { borderColor: colors.border }, '&.Mui-focused fieldset': { borderColor: '#2563EB' } } }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.8, justifyContent: 'flex-end' }}>
                                <Button size="small" onClick={() => setEditOpen(false)} sx={{ fontSize: '0.75rem', color: colors.textMuted, textTransform: 'none' }}>취소</Button>
                                <Button size="small" variant="contained" onClick={handleEditSubmit} sx={{ fontSize: '0.75rem', textTransform: 'none', backgroundColor: '#2563EB', boxShadow: 'none', borderRadius: 1.5 }}>저장</Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box sx={commentBodySx} dangerouslySetInnerHTML={{ __html: comment.CONTENT || comment.content || '' }} />
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        {depth < 2 && (
                            <Button size="small" onClick={() => onReply(comment)}
                                sx={{ color: colors.textHint, fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', px: 0, minWidth: 0, '&:hover': { color: '#2563EB', backgroundColor: 'transparent' } }}>
                                답글
                            </Button>
                        )}
                        {comment.replies?.length > 0 && (
                            <Button size="small" onClick={() => setRepliesOpen(o => !o)}
                                sx={{ color: colors.textHint, fontSize: '0.7rem', fontWeight: 600, textTransform: 'none', px: 0.5, minWidth: 0, '&:hover': { color: '#2563EB', backgroundColor: 'transparent' } }}>
                                {repliesOpen ? `▲ 답글 숨기기` : `▼ 답글 ${comment.replies.length}개`}
                            </Button>
                        )}
                        <Button size="small"
                            startIcon={liked ? <Favorite sx={{ fontSize: 12, color: '#EF4444' }} /> : <FavoriteBorderOutlined sx={{ fontSize: 12 }} />}
                            onClick={handleLike}
                            sx={{ color: liked ? '#EF4444' : colors.textHint, fontSize: '0.72rem', fontWeight: 600, textTransform: 'none', px: 0.5, minWidth: 0, '&:hover': { color: '#EF4444', backgroundColor: 'transparent' } }}>
                            {likeCount > 0 ? likeCount : ''}
                        </Button>
                    </Box>
                </Box>
            </Box>

            {repliesOpen && comment.replies?.map((reply, ri) => (
                <ReelCommentItem key={reply.COMMENT_ID || reply.id} comment={reply} index={ri} depth={depth + 1}
                    onReply={onReply} myNickname={myNickname} postWriter={postWriter}
                    colors={colors} onDelete={onDelete} token={token} postId={postId} navigate={navigate} />
            ))}

            {/* 삭제 확인 모달 */}
            <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)} closeAfterTransition slots={{ backdrop: Backdrop }}
                slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' } } }}>
                <Fade in={deleteOpen}>
                    <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: { xs: '88vw', sm: 340 }, backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 3, p: 3, outline: 'none' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary, mb: 1 }}>댓글 삭제</Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 3 }}>이 댓글을 삭제하시겠습니까?</Typography>
                        <Stack direction="row" spacing={1.5} justifyContent="flex-end">
                            <Button onClick={() => setDeleteOpen(false)} sx={{ fontSize: '0.82rem', color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 1.5, textTransform: 'none', px: 2 }}>취소</Button>
                            <Button variant="contained" onClick={handleDelete} sx={{ fontSize: '0.82rem', backgroundColor: '#EF4444', color: '#fff', boxShadow: 'none', borderRadius: 1.5, textTransform: 'none', px: 2, '&:hover': { backgroundColor: '#DC2626' } }}>삭제</Button>
                        </Stack>
                    </Box>
                </Fade>
            </Modal>

            <ReportModal
                open={reportOpen}
                onClose={() => setReportOpen(false)}
                postId={postId}
                commentId={comment.COMMENT_ID}
                token={token}
                colors={colors}
                title="댓글 신고"
                reasons={COMMENT_REPORT_REASONS}
            />

            {/* 호버 프로필 카드 */}
            {hoverVisible && navigate && (
                <ProfileHoverCard
                    nickname={writerName}
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

const ReelCard = ({ reel, token, myNickname, colors, onUpdate, onDelete }) => {
    const navigate = useNavigate();
    const videoRef = useRef(null);
    const [commentLikeMap, setCommentLikeMap] = useState({});
    const [replyTarget, setReplyTarget] = useState(null);
    const plainInputRef = useRef(null);
    const [plainText, setPlainText] = useState('');
    const mentionStartRef = useRef(-1);
    const mentionStateRef = useRef({ open: false, suggestions: [], activeIdx: 0 });
    const mentionDebounceRef = useRef(null);
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionSuggestions, setMentionSuggestions] = useState([]);
    const [mentionActiveIdx, setMentionActiveIdx] = useState(0);
    const [mentionAnchorPos, setMentionAnchorPos] = useState({ top: 0, left: 0 });
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [liked, setLiked] = useState(reel.likes > 0);
    const [likeCount, setLikeCount] = useState(reel.likes || 0);
    const [followStatus, setFollowStatus] = useState(reel.followStatus || 'NONE');
    const [heartTrigger, setHeartTrigger] = useState(0);
    const [myAvatar, setMyAvatar] = useState(null);

    const [anchorEl, setAnchorEl] = useState(null);
    const [commentsOpen, setCommentsOpen] = useState(() => {
        return localStorage.getItem(`reelComments_${reel.id}`) === 'true';
    });
    const [reportOpen, setReportOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState('');
    const [thumbnail, setThumbnail] = useState(null);

    const handleVideoLoaded = (e) => {
        const video = e.target;
        video.currentTime = 0.5;
        video.addEventListener('seeked', () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                setThumbnail(canvas.toDataURL('image/jpeg'));
            } catch { }
        }, { once: true });
    };

    const setCommentsOpenPersist = (val) => {
        const next = typeof val === 'function' ? val(commentsOpen) : val;
        setCommentsOpen(next);
        if (next) localStorage.setItem(`reelComments_${reel.id}`, 'true');
        else localStorage.removeItem(`reelComments_${reel.id}`);
    };

    useEffect(() => {
        if (!token || !myNickname) return;
        fetch(`${API}/user/profile/${myNickname}`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(d => { if (d.success) setMyAvatar(d.user?.AVATAR || null); })
            .catch(() => { });
    }, [token, myNickname]);

    const isMyPost = myNickname && reel.username === myNickname;
    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (!videoRef.current) return;
            if (entry.isIntersecting) {
                videoRef.current.play().then(() => setPlaying(true)).catch(() => { });
            } else {
                videoRef.current.pause();
                setPlaying(false);
            }
        }, { threshold: 0.6 });
        if (videoRef.current) observer.observe(videoRef.current);
        return () => observer.disconnect();
    }, []);
    const fetchMentionUsers = useCallback(async (q) => {
        try {
            const url = q ? `${API}/user/tag-search?q=${encodeURIComponent(q)}` : `${API}/user/tag-search`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) {
                const users = data.users || [];
                setMentionSuggestions(users);
                setMentionOpen(users.length > 0);
                setMentionActiveIdx(0);
                mentionStateRef.current = { open: users.length > 0, suggestions: users, activeIdx: 0 };
            }
        } catch { setMentionOpen(false); }
    }, [token]);

    const handleAddPlainComment = useCallback(async () => {
        if (!plainText.trim()) return;
        const el = plainInputRef.current;
        const content = el ? `<p>${el.innerHTML.replace(/\n/g, '<br>')}</p>` : `<p>${plainText}</p>`;
        const currentReplyTarget = replyTarget;

        const optimistic = {
            COMMENT_ID: Date.now(), id: Date.now(),
            WRITER: myNickname || '나', AVATAR: null,
            CONTENT: content,
            PARENT_ID: currentReplyTarget?.COMMENT_ID ?? null,
            replies: [], LIKE_COUNT: 0, MY_LIKE: 0,
            CREATED_AT: new Date().toISOString(),
        };

        if (currentReplyTarget) {
            setComments(prev => addReplyToTree(prev, currentReplyTarget.COMMENT_ID, optimistic));
        } else {
            setComments(c => [...c, optimistic]);
        }

        setPlainText('');
        if (plainInputRef.current) plainInputRef.current.innerHTML = '';
        setReplyTarget(null);

        try {
            const res = await fetch(`${API}/feed/${reel.id}/comment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ text: plainText.trim(), content, parentId: optimistic.PARENT_ID, commentMode: 'plain' }),
            });
            const data = await res.json();
            if (res.ok && data.success) {
                const serverComment = { ...data.comment, replies: [] };
                if (currentReplyTarget) {
                    setComments(prev => {
                        const replace = (list) => list.map(c => {
                            if ((c.COMMENT_ID || c.id) === optimistic.COMMENT_ID) return serverComment;
                            if (c.replies?.length) return { ...c, replies: replace(c.replies) };
                            return c;
                        });
                        return replace(prev);
                    });
                } else {
                    setComments(c => c.map(cm => (cm.COMMENT_ID === optimistic.COMMENT_ID || cm.id === optimistic.id) ? serverComment : cm));
                }
                if (reel.username !== myNickname) {
                    fetch(`${API}/notifications`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({
                            type: 'COMMENT',
                            targetUserId: reel.userId || reel.username,
                            postId: reel.id,
                        }),
                    }).catch(() => { });
                }
            }
        } catch { }
    }, [plainText, replyTarget, myNickname, reel.id, token]);

    useEffect(() => {
        if (commentsOpen && reel.id) {
            fetch(`${API}/feed/${reel.id}/comments`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => res.json())
                .then(data => { if (data.success) setComments(data.comments); });
        }
    }, [commentsOpen, reel.id, token]);

    const handleCommentSubmit = async () => {
        if (!commentText.trim()) return;
        const res = await fetch(`${API}/feed/${reel.id}/comment`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ text: commentText }),
        });
        const data = await res.json();
        if (data.success) { setComments(prev => [...prev, data.comment]); setCommentText(''); }
    };

    const togglePlay = (e) => {
        e.stopPropagation();
        if (commentsOpen) setCommentsOpenPersist(false);
        if (videoRef.current.paused) {
            videoRef.current.play(); setPlaying(true);
        } else {
            videoRef.current.pause(); setPlaying(false);
        }
    };

    const handleDoubleClick = (e) => {
        e.preventDefault();
        if (!liked) {
            setLiked(true);
            setLikeCount(c => c + 1);
            fetch(`${API}/feed/${reel.id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
        }
        setHeartTrigger(t => t + 1);
    };

    const handleLikeClick = (e) => {
        e.stopPropagation();
        const next = !liked;
        setLiked(next);
        setLikeCount(c => c + (next ? 1 : -1));
        if (next) setHeartTrigger(t => t + 1);
        fetch(`${API}/feed/${reel.id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } }).catch(() => { });
    };

    const handleFollow = async (e) => {
        e.stopPropagation();
        const prev = followStatus;
        setFollowStatus('OPTIMISTIC');
        try {
            const res = await fetch(`${API}/user/follow/${reel.userId || reel.username}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setFollowStatus(data.status);
            else setFollowStatus(prev);
        } catch { setFollowStatus(prev); }
    };

    const handleDeleteConfirm = async () => {
        setDeleteOpen(false);
        try {
            const res = await fetch(`${API}/feed/${reel.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) onDelete(reel.id);
        } catch { }
    };

    const handleEditSaved = (updatedFeed) => {
        setEditOpen(false);
        if (updatedFeed) onUpdate?.({ ...reel, ...updatedFeed });
    };

    const followBtnStyle = (() => {
        if (followStatus === 'ACCEPTED') return {
            backgroundColor: 'transparent',
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
        };
        if (followStatus === 'PENDING' || followStatus === 'OPTIMISTIC') return {
            backgroundColor: 'transparent',
            color: colors.textMuted,
            border: `1px solid ${colors.border}`,
        };
        return {
            backgroundColor: '#2563EB',
            color: '#fff',
            border: '1px solid #2563EB',
        };
    })();

    const followBtnLabel = followStatus === 'ACCEPTED' ? '팔로잉' : (followStatus === 'PENDING' || followStatus === 'OPTIMISTIC') ? '요청됨' : '팔로우';
    return (
        <Box sx={{
            height: '100vh', width: '100%', scrollSnapAlign: 'start',
            display: 'flex', flexDirection: 'row', alignItems: 'stretch',
            backgroundColor: colors.bg, overflow: 'hidden', position: 'relative',
        }}>
            {/* 왼쪽 정보 패널 */}
            <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
                <Box sx={{
                    width: 260, flexShrink: 0,
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    px: 3, py: 4, gap: 2,
                    backgroundColor: colors.bg,
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                        <Avatar
                            src={resolveAvatarSrc(reel.avatar)}
                            onClick={() => navigate(`/user/${reel.username}`)}
                            sx={{ width: 40, height: 40, cursor: 'pointer', border: `2px solid ${colors.border}` }}
                        >
                            {getInitial(reel.username)}
                        </Avatar>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                                onClick={() => navigate(`/user/${reel.username}`)}
                                sx={{ fontWeight: 700, fontSize: '0.9rem', color: colors.textPrimary, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                            >
                                {reel.username}
                            </Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: colors.textHint }}>
                                {formatRelativeTime(reel.createdAt)}
                            </Typography>
                        </Box>
                        {!isMyPost && (
                            <Button
                                onClick={handleFollow}
                                size="small"
                                sx={{
                                    fontSize: '0.72rem', px: 1.2, py: 0.3, borderRadius: 5,
                                    minWidth: 0, flexShrink: 0,
                                    textTransform: 'none', fontWeight: 700,
                                    transition: 'all 0.15s',
                                    ...followBtnStyle,
                                    '&:hover': { opacity: 0.85 },
                                }}
                            >
                                {followBtnLabel}
                            </Button>
                        )}
                    </Box>

                    {reel.title && (
                        <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary, lineHeight: 1.3 }}>
                            {reel.title}
                        </Typography>
                    )}

                    {reel.caption && (
                        <Typography sx={{
                            fontSize: '0.85rem', color: colors.textMuted,
                            lineHeight: 1.6, whiteSpace: 'pre-wrap',
                            overflowY: 'auto', maxHeight: 220,
                            '&::-webkit-scrollbar': { display: 'none' },
                        }}>
                            {reel.caption}
                        </Typography>
                    )}

                    {reel.tags && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.7 }}>
                            {(Array.isArray(reel.tags) ? reel.tags : reel.tags.split(',')).map(t => t.trim()).filter(Boolean).map((tag, i) => (
                                <Typography
                                    key={i}
                                    onClick={() => navigate(`/explore?tag=${encodeURIComponent(tag)}`)}
                                    sx={{ fontSize: '0.78rem', color: '#3B82F6', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                                >
                                    #{tag}
                                </Typography>
                            ))}
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <MusicNote sx={{ fontSize: 13, color: colors.textHint }} />
                        <Typography sx={{ fontSize: '0.78rem', color: colors.textHint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            원본 오디오 - {reel.username}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ width: 500, maxWidth: 500, flexShrink: 0, position: 'relative', backgroundColor: '#000', overflow: 'hidden' }}>
                <Box
                    component="video"
                    ref={videoRef}
                    src={reel.videoSrc}
                    loop playsInline muted={muted}
                    preload="metadata"
                    onLoadedMetadata={handleVideoLoaded}
                    onClick={togglePlay}
                    onDoubleClick={handleDoubleClick}
                    sx={{
                        width: '100%', height: '100%', objectFit: 'cover',
                        position: 'absolute', top: 0, left: 0, zIndex: 0,
                    }}
                />
                {thumbnail && (
                    <Box
                        component="img"
                        src={thumbnail}
                        sx={{
                            width: '100%', height: '100%', objectFit: 'cover',
                            position: 'absolute', top: 0, left: 0, zIndex: 0,
                            opacity: playing ? 0 : 1,
                            transition: 'opacity 0.3s',
                            pointerEvents: 'none',
                        }}
                    />
                )}
                {!playing && (
                    <Box sx={{ position: 'absolute', zIndex: 1, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <Box sx={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid #fff', ml: '4px' }} />
                    </Box>
                )}

                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.85) 100%)', zIndex: 1, pointerEvents: 'none' }} />

                <HeartOverlay trigger={heartTrigger} />

                {reel.overlayText && (
                    <Typography sx={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', color: '#fff', fontWeight: 800, fontSize: '1.4rem', textAlign: 'center', textShadow: '2px 2px 4px rgba(0,0,0,0.6)', zIndex: 2, width: '90%' }}>
                        {reel.overlayText}
                    </Typography>
                )}

                {/* 오른쪽 액션 버튼들 */}
                <Box sx={{ position: 'absolute', bottom: '30px', right: '12px', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <IconButton onClick={handleLikeClick} sx={{ color: liked ? '#EF4444' : '#fff', p: 0, transition: 'transform 0.1s', '&:active': { transform: 'scale(0.8)' } }}>
                            {liked ? <Favorite sx={{ fontSize: 32 }} /> : <FavoriteBorder sx={{ fontSize: 32 }} />}
                        </IconButton>
                        <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{likeCount}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <IconButton onClick={(e) => {
                            e.stopPropagation(); setCommentsOpenPersist(prev => !prev);
                        }} sx={{ color: '#fff', p: 0 }}>
                            <ChatBubbleOutline sx={{ fontSize: 30 }} />
                        </IconButton>
                        <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{reel.comments || 0}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                        <IconButton onClick={(e) => { e.stopPropagation(); setShareOpen(true); }} sx={{ color: '#fff', p: 0 }}>
                            <ShareOutlined sx={{ fontSize: 28 }} />
                        </IconButton>
                        <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600, mt: '4px', textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}>{reel.shares || 0}</Typography>
                    </Box>

                    <IconButton onClick={(e) => { e.stopPropagation(); setAnchorEl(e.currentTarget); }} sx={{ color: '#fff', p: 0 }}>
                        <MoreHoriz sx={{ fontSize: 30 }} />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                        PaperProps={{ sx: { borderRadius: 2, backgroundColor: colors.paper, minWidth: 120 } }}
                    >
                        {isMyPost ? [
                            <MenuItem key="edit" onClick={() => { setAnchorEl(null); setEditOpen(true); }} sx={{ fontSize: '0.85rem', gap: 1 }}>
                                <Edit sx={{ fontSize: 16 }} /> 수정하기
                            </MenuItem>,
                            <MenuItem key="delete" onClick={() => { setAnchorEl(null); setDeleteOpen(true); }} sx={{ fontSize: '0.85rem', color: '#EF4444', gap: 1 }}>
                                <Delete sx={{ fontSize: 16 }} /> 삭제하기
                            </MenuItem>
                        ] : [
                            <MenuItem key="report" onClick={() => { setAnchorEl(null); setReportOpen(true); }} sx={{ fontSize: '0.85rem', gap: 1 }}>
                                <Flag sx={{ fontSize: 16 }} /> 신고하기
                            </MenuItem>
                        ]}
                    </Menu>

                    <Box
                        onClick={(e) => { e.stopPropagation(); setMuted(!muted); }}
                        sx={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1, cursor: 'pointer' }}
                    >
                        {muted ? <VolumeOff sx={{ fontSize: 16, color: '#fff' }} /> : <VolumeUp sx={{ fontSize: 16, color: '#fff' }} />}
                    </Box>
                </Box>

                <EditModal open={editOpen} postId={reel.id} onClose={() => setEditOpen(false)} onSaved={handleEditSaved} />
                <ConfirmModal open={deleteOpen} title="릴스 삭제" message="이 릴스를 삭제하시겠습니까?" onConfirm={handleDeleteConfirm} onClose={() => setDeleteOpen(false)} colors={colors} />
                <ReportModal
                    open={reportOpen}
                    onClose={() => setReportOpen(false)}
                    postId={reel.id}
                    token={token}
                    colors={colors}
                    title="릴스 신고"
                    reasons={REPORT_REASONS}
                />
                <ShareModal
                    open={shareOpen}
                    onClose={() => setShareOpen(false)}
                    feed={{
                        id: reel.id,
                        title: reel.title,
                        description: reel.caption,
                        images: null,
                        category: 'REEL',
                        tag: 'REEL',
                    }}
                    token={token}
                    colors={colors}
                />
            </Box>
            <Box
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                sx={{
                    width: commentsOpen ? 360 : 0,
                    minWidth: commentsOpen ? 360 : 0,
                    flexShrink: 0,
                    overflow: 'hidden',
                    transition: 'width 0.28s ease, min-width 0.28s ease',
                    height: '100%',
                    backgroundColor: colors.paper,
                    borderLeft: commentsOpen ? `1px solid ${colors.border}` : 'none',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', minWidth: 360 }}>
                    <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${colors.border}` }}>
                        <Typography sx={{ fontWeight: 800, color: colors.textPrimary }}>댓글</Typography>
                        <IconButton size="small" onClick={() => setCommentsOpenPersist(false)} sx={{ color: colors.textPrimary }}>
                            <Close />
                        </IconButton>
                    </Box>
                    <Box sx={{ flex: 1, overflowY: 'auto', px: 2, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: colors.border, borderRadius: 2 } }}>
                        {comments.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 8 }}>
                                <ChatBubbleOutline sx={{ fontSize: 32, color: colors.border, mb: 1.5 }} />
                                <Typography sx={{ color: colors.textHint, fontSize: '0.85rem' }}>첫 댓글을 남겨보세요!</Typography>
                            </Box>
                        ) : (
                            comments.map((c, i) => (
                                <ReelCommentItem
                                    key={c.COMMENT_ID || c.id}
                                    comment={c} index={i} depth={0}
                                    myNickname={myNickname}
                                    colors={colors} token={token}
                                    postId={reel.id}
                                    postWriter={reel.username}
                                    onReply={setReplyTarget}
                                    navigate={navigate}
                                    onDelete={(commentId) => setComments(prev => removeFromTree(prev, commentId))}
                                />
                            ))
                        )}
                    </Box>
                    <Box sx={{ px: 2, py: 2, borderTop: `1px solid ${colors.border}`, backgroundColor: colors.mode === 'dark' ? 'rgba(255,255,255,0.02)' : '#FAFBFC' }}>
                        {replyTarget && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, mb: 1.5, backgroundColor: colors.mode === 'dark' ? '#1E3A5F' : '#EFF6FF', borderRadius: 1.5, border: '1px solid #2563EB' }}>
                                <Typography sx={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 600 }}>
                                    @{replyTarget.WRITER || replyTarget.writer} 에게 답글 작성 중
                                </Typography>
                                <IconButton size="small" onClick={() => setReplyTarget(null)} sx={{ color: colors.textHint, p: 0.3 }}>
                                    <Close sx={{ fontSize: 14 }} />
                                </IconButton>
                            </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-start' }}>
                            <Avatar
                                src={resolveAvatarSrc(myAvatar)}
                                sx={{ width: 30, height: 30, fontSize: '0.65rem', backgroundColor: colors.textPrimary, flexShrink: 0, mt: 0.5, fontWeight: 800 }}
                            >
                                {getInitial(myNickname)}
                            </Avatar>
                            <Box sx={{ flex: 1, position: 'relative' }}>
                                <Box
                                    ref={plainInputRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={() => {
                                        const el = plainInputRef.current;
                                        if (!el) return;
                                        const sel = window.getSelection();
                                        if (!sel.rangeCount) return;
                                        const range = sel.getRangeAt(0);
                                        const preCaretRange = range.cloneRange();
                                        preCaretRange.selectNodeContents(el);
                                        preCaretRange.setEnd(range.endContainer, range.endOffset);
                                        const textBefore = preCaretRange.toString();
                                        setPlainText(el.innerText || '');
                                        const atIdx = textBefore.lastIndexOf('@');
                                        if (atIdx === -1 || textBefore.slice(atIdx + 1).includes(' ') || textBefore.slice(atIdx + 1).includes('\n')) {
                                            setMentionOpen(false); mentionStateRef.current.open = false; return;
                                        }
                                        mentionStartRef.current = atIdx;
                                        const rect = el.getBoundingClientRect();
                                        setMentionAnchorPos({ top: rect.top - 4, left: rect.left });
                                        clearTimeout(mentionDebounceRef.current);
                                        const q = textBefore.slice(atIdx + 1);
                                        mentionDebounceRef.current = setTimeout(() => fetchMentionUsers(q), q === '' ? 0 : 150);
                                    }}
                                    onKeyDown={e => {
                                        const { open, suggestions, activeIdx } = mentionStateRef.current;
                                        if (open && suggestions.length) {
                                            if (e.key === 'ArrowDown') { e.preventDefault(); const n = Math.min(activeIdx + 1, suggestions.length - 1); setMentionActiveIdx(n); mentionStateRef.current.activeIdx = n; return; }
                                            if (e.key === 'ArrowUp') { e.preventDefault(); const n = Math.max(activeIdx - 1, 0); setMentionActiveIdx(n); mentionStateRef.current.activeIdx = n; return; }
                                            if (e.key === 'Tab' || e.key === 'Enter') {
                                                e.preventDefault();
                                                const u = suggestions[activeIdx];
                                                if (!u) return;
                                                const el = plainInputRef.current;
                                                const sel2 = window.getSelection();
                                                if (!el || !sel2.rangeCount) return;
                                                const range2 = sel2.getRangeAt(0);
                                                const textNode = range2.startContainer;
                                                const cursorPos = range2.startOffset;
                                                const start = mentionStartRef.current;
                                                if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
                                                const safeStart = Math.max(0, Math.min(start, textNode.textContent.length));
                                                const safeEnd = Math.max(safeStart, Math.min(cursorPos, textNode.textContent.length));
                                                const deleteRange = document.createRange();
                                                deleteRange.setStart(textNode, safeStart);
                                                deleteRange.setEnd(textNode, safeEnd);
                                                deleteRange.deleteContents();
                                                const span = document.createElement('span');
                                                span.style.color = '#2563EB'; span.style.fontWeight = '600';
                                                span.textContent = `@${u.NICKNAME}`; span.contentEditable = 'false';
                                                deleteRange.insertNode(span);
                                                const space = document.createTextNode(' ');
                                                span.after(space);
                                                const newRange = document.createRange();
                                                newRange.setStartAfter(space); newRange.collapse(true);
                                                sel2.removeAllRanges(); sel2.addRange(newRange);
                                                setPlainText(el.innerText || '');
                                                setMentionOpen(false); mentionStateRef.current = { open: false, suggestions: [], activeIdx: 0 };
                                                return;
                                            }
                                            if (e.key === 'Escape') { setMentionOpen(false); mentionStateRef.current.open = false; return; }
                                        }
                                        if (e.key === 'Enter') {
                                            if (e.ctrlKey || e.shiftKey) {
                                                return;
                                            }
                                            e.preventDefault();
                                            setMentionOpen(false); mentionStateRef.current.open = false;
                                            handleAddPlainComment();
                                        }
                                    }}
                                    data-placeholder={replyTarget ? `@${replyTarget.WRITER || replyTarget.writer}에게 답글...` : '댓글 작성... (@멘션 지원)'}
                                    sx={{
                                        width: '100%', minHeight: 56, outline: 'none',
                                        border: `1px solid ${colors.border}`, borderRadius: 1.5,
                                        backgroundColor: colors.paper, color: colors.textPrimary,
                                        fontSize: '0.85rem', lineHeight: 1.75, p: '8px 12px',
                                        fontFamily: '"Plus Jakarta Sans","Noto Sans KR",sans-serif',
                                        transition: 'border-color 0.2s', wordBreak: 'break-word',
                                        '&:focus': { borderColor: '#2563EB' },
                                        '&:empty::before': { content: 'attr(data-placeholder)', color: colors.textHint, pointerEvents: 'none' },
                                    }}
                                />

                                {mentionOpen && mentionSuggestions.length > 0 && (
                                    <Box sx={{
                                        position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0,
                                        backgroundColor: colors.paper, border: `1px solid ${colors.border}`,
                                        borderRadius: 1.5, boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                                        zIndex: 9999, maxHeight: 200, overflowY: 'auto', mb: 0.5,
                                    }}>
                                        {mentionSuggestions.map((u, idx) => (
                                            <Box
                                                key={u.USER_ID || u.NICKNAME}
                                                onMouseDown={(e) => {
                                                    e.preventDefault();
                                                    const el = plainInputRef.current;
                                                    const sel = window.getSelection();
                                                    if (!el || !sel.rangeCount) return;
                                                    const range = sel.getRangeAt(0);
                                                    const textNode = range.startContainer;
                                                    const cursorPos = range.startOffset;
                                                    const start = mentionStartRef.current;
                                                    if (!textNode || textNode.nodeType !== Node.TEXT_NODE) return;
                                                    const safeStart = Math.max(0, Math.min(start, textNode.textContent.length));
                                                    const safeEnd = Math.max(safeStart, Math.min(cursorPos, textNode.textContent.length));
                                                    const deleteRange = document.createRange();
                                                    deleteRange.setStart(textNode, safeStart);
                                                    deleteRange.setEnd(textNode, safeEnd);
                                                    deleteRange.deleteContents();
                                                    const span = document.createElement('span');
                                                    span.style.color = '#2563EB'; span.style.fontWeight = '600';
                                                    span.textContent = `@${u.NICKNAME}`; span.contentEditable = 'false';
                                                    deleteRange.insertNode(span);
                                                    const space = document.createTextNode(' ');
                                                    span.after(space);
                                                    const newRange = document.createRange();
                                                    newRange.setStartAfter(space); newRange.collapse(true);
                                                    sel.removeAllRanges(); sel.addRange(newRange);
                                                    setPlainText(el.innerText || '');
                                                    setMentionOpen(false);
                                                    mentionStateRef.current = { open: false, suggestions: [], activeIdx: 0 };
                                                }}
                                                sx={{
                                                    display: 'flex', alignItems: 'center', gap: 1.2,
                                                    px: 1.5, py: 1,
                                                    backgroundColor: idx === mentionActiveIdx ? colors.hover : 'transparent',
                                                    cursor: 'pointer',
                                                    '&:hover': { backgroundColor: colors.hover },
                                                    transition: 'background 0.1s',
                                                }}
                                            >
                                                <Avatar
                                                    src={resolveAvatarSrc(u.AVATAR)}
                                                    sx={{ width: 28, height: 28, fontSize: '0.65rem', backgroundColor: colors.textPrimary, fontWeight: 800 }}
                                                >
                                                    {getInitial(u.NICKNAME)}
                                                </Avatar>
                                                <Typography sx={{ fontSize: '0.83rem', fontWeight: 600, color: colors.textPrimary }}>
                                                    {u.NICKNAME}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                )}
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                    <Button variant="contained" disabled={!plainText.trim()}
                                        onClick={() => { setMentionOpen(false); mentionStateRef.current.open = false; handleAddPlainComment(); }}
                                        sx={{ backgroundColor: colors.textPrimary, color: colors.paper, textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 2, py: 0.6, borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#2563EB' }, '&.Mui-disabled': { backgroundColor: colors.border, color: colors.textHint } }}>
                                        {replyTarget ? '답글 등록' : '댓글 등록'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Box>

            <Box sx={{ flex: 1 }} />
        </Box>
    );
};

export default function Reels() {
    const containerRef = useRef(null);
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);

    const token = localStorage.getItem('accessToken');
    const { mode } = useColorMode();

    const colors = {
        mode,
        bg: mode === 'dark' ? '#0F1117' : '#F8FAFC',
        paper: mode === 'dark' ? '#1A1D27' : '#FFFFFF',
        border: mode === 'dark' ? '#2D3148' : '#E2E8F0',
        textPrimary: mode === 'dark' ? '#F1F5F9' : '#0F172A',
        textMuted: mode === 'dark' ? '#94A3B8' : '#64748B',
        textHint: mode === 'dark' ? '#64748B' : '#94A3B8',
        inputBg: mode === 'dark' ? '#22253A' : '#F1F5F9',
        hover: mode === 'dark' ? '#22253A' : '#F8FAFC',
    };

    const myNickname = (() => {
        try { return JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1])))).nickname; }
        catch { return null; }
    })();

    useEffect(() => {
        if (!token) { navigate('/'); return; }
        fetch(`${API}/reels`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => { if (data.success) setReels(data.reels); })
            .catch(err => console.error(err));
    }, [token, navigate]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        let isScrolling = false;
        const handleWheel = (e) => {
            e.preventDefault();
            if (isScrolling) return;
            isScrolling = true;
            if (e.deltaY > 0) container.scrollBy({ top: container.clientHeight, behavior: 'smooth' });
            else container.scrollBy({ top: -container.clientHeight, behavior: 'smooth' });
            setTimeout(() => { isScrolling = false; }, 600);
        };
        container.addEventListener('wheel', handleWheel, { passive: false });
        return () => container.removeEventListener('wheel', handleWheel);
    }, []);

    const handleDelete = (id) => setReels(prev => prev.filter(r => r.id !== id));
    const handleUpdate = (updatedReel) => setReels(prev => prev.map(r => r.id === updatedReel.id ? updatedReel : r));

    return (
        <>
            <CssBaseline />
            <Box sx={{ display: 'flex', justifyContent: 'center', backgroundColor: colors.bg, height: '100vh', width: '100vw', overflow: 'hidden' }}>
                <Box
                    ref={containerRef}
                    sx={{
                        height: '100vh', width: '100%',
                        overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none',
                        msOverflowStyle: 'none', '&::-webkit-scrollbar': { display: 'none' },
                        boxShadow: mode === 'light' ? '0 0 20px rgba(0,0,0,0.05)' : 'none',
                    }}
                >
                    {reels.map((reel) => (
                        <ReelCard
                            key={reel.id}
                            reel={reel}
                            token={token}
                            myNickname={myNickname}
                            colors={colors}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                        />
                    ))}
                    {reels.length === 0 && (
                        <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CircularProgress sx={{ color: colors.textMuted }} />
                        </Box>
                    )}
                </Box>
            </Box>
        </>
    );
}