import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Avatar, Button, Chip, Stack, Typography,
  InputBase, CircularProgress, IconButton, Divider, Skeleton,
  Modal, Fade, Backdrop
} from '@mui/material';
import {
  Search, Close, TrendingUp, Code, BugReport, Rocket, Lightbulb,
  Favorite, FavoriteBorder, ChatBubbleOutline, BookmarkBorderOutlined,
  Bookmark, PersonAdd, PersonRemove, ArrowBack, Tag, People, Article,
  History, NorthEast, LocalFireDepartment, GroupAdd, AutoAwesome,
  WorkspacePremium, EmojiEvents, Visibility, LocationOn
} from '@mui/icons-material';
import { useColorMode } from '../App';

const API = 'http://localhost:3010';

const TAG_COLORS = [
  { color: '#DC2626', bg: '#FEF2F2' },
  { color: '#2563EB', bg: '#EFF6FF' },
  { color: '#7C3AED', bg: '#F5F3FF' },
  { color: '#D97706', bg: '#FFFBEB' },
  { color: '#059669', bg: '#ECFDF5' },
  { color: '#0891B2', bg: '#ECFEFF' },
  { color: '#DB2777', bg: '#FDF2F8' },
  { color: '#65A30D', bg: '#F7FEE7' },
];

const tagColorCache = {};

const getTagColor = (name) => {
  if (!tagColorCache[name]) {
    const idx = Object.keys(tagColorCache).length % TAG_COLORS.length;
    tagColorCache[name] = TAG_COLORS[idx];
  }
  return tagColorCache[name];
};

const getInitial = (name) => name?.charAt(0).toUpperCase() ?? '?';

const formatCount = (n) => {
  if (!n && n !== 0) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
};

const resolvePostImage = (img) => {
  if (!img) return '';
  if (img.startsWith('http')) return img;
  if (img.startsWith('/uploads/post')) return `${API}${img}`;
  return `${API}/uploads/post/${img.replace(/^\//, '')}`;
};

const resolveAvatarSrc = (src) => {
  if (!src) return undefined;
  if (src.startsWith('http')) return src;
  return `${API}${src.startsWith('/') ? '' : '/'}${src}`;
};

const SearchBar = ({ value, onChange, onClear, onFocus, onBlur, inputRef, onEnter, colors }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 1,
    backgroundColor: colors.paper, border: `1.5px solid ${colors.border}`,
    borderRadius: 2, px: 2, py: 1.2, transition: 'all 0.2s',
    '&:focus-within': { borderColor: '#2563EB', boxShadow: '0 0 0 3px rgba(37,99,235,0.08)' },
  }}>
    <Search sx={{ color: colors.textHint, fontSize: 20, flexShrink: 0 }} />
    <InputBase
      inputRef={inputRef}
      placeholder="게시물, 개발자, 태그 검색..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
      fullWidth
      sx={{ fontSize: '0.92rem', color: colors.textPrimary, fontWeight: 500, '& input::placeholder': { color: colors.textHint } }}
    />
    {value && (
      <IconButton size="small" onClick={onClear} sx={{ color: colors.textHint, p: 0.3 }}>
        <Close sx={{ fontSize: 16 }} />
      </IconButton>
    )}
  </Box>
);

const SearchDropdown = ({ query, recentSearches, trendingTags, onSelect, onClearRecent, onDeleteRecent, token, colors }) => {
  const [liveUsers, setLiveUsers] = useState([]);
  const [liveTags, setLiveTags] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length < 1) { setLiveUsers([]); setLiveTags([]); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/explore/search?q=${encodeURIComponent(query)}&type=all&limit=5`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) { setLiveUsers(data.users?.slice(0, 4) || []); setLiveTags(data.tags?.slice(0, 4) || []); }
      } catch { }
    }, 150);
    return () => clearTimeout(timerRef.current);
  }, [query, token]);

  return (
    <Box sx={{
      position: 'absolute', top: '100%', left: 0, right: 0, mt: 1,
      backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2,
      boxShadow: '0 16px 40px rgba(15,23,42,0.12)', zIndex: 200,
      overflow: 'hidden', animation: 'slideDown 0.18s ease both',
    }}>
      {!query ? (
        <>
          {recentSearches.length > 0 && (
            <>
              <Box sx={{ px: 2, pt: 2, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: colors.textHint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>최근 검색</Typography>
                <Typography onClick={onClearRecent} sx={{ fontSize: '0.7rem', color: colors.textHint, cursor: 'pointer', '&:hover': { color: colors.textMuted } }}>전체삭제</Typography>
              </Box>
              {recentSearches.map((s) => (
                <Box key={s} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2,
                  '&:hover': { backgroundColor: colors.hover }, '&:hover .delete-btn': { opacity: 1 }, transition: 'background 0.12s',
                }}>
                  <History sx={{ fontSize: 15, color: colors.textHint, flexShrink: 0 }} />
                  <Typography onMouseDown={() => onSelect(s)} sx={{ fontSize: '0.88rem', color: colors.textMuted, fontWeight: 500, flex: 1, cursor: 'pointer' }}>{s}</Typography>
                  <IconButton className="delete-btn" size="small" onMouseDown={(e) => { e.stopPropagation(); onDeleteRecent(s); }}
                    sx={{ opacity: 0, transition: 'opacity 0.15s', p: 0.3, color: colors.textHint, '&:hover': { color: colors.textMuted, backgroundColor: 'transparent' } }}>
                    <Close sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ))}
              <Divider sx={{ borderColor: colors.border, mx: 2 }} />
            </>
          )}
          {trendingTags.length > 0 && (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: colors.textHint, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>인기 태그</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.8}>
                {trendingTags.slice(0, 8).map(t => {
                  const m = getTagColor(t.TAG_NAME);
                  return (
                    <Chip key={t.TAG_NAME} label={`#${t.TAG_NAME}`} size="small"
                      onMouseDown={() => onSelect(t.TAG_NAME)}
                      sx={{ backgroundColor: m.bg, color: m.color, fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer', border: `1px solid ${m.color}22`, '&:hover': { opacity: 0.8 } }}
                    />
                  );
                })}
              </Stack>
            </Box>
          )}
        </>
      ) : (
        <Box sx={{ py: 0.5 }}>
          {liveUsers.length > 0 && (
            <>
              <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: '0.68rem', fontWeight: 800, color: colors.textHint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>개발자</Typography>
              {liveUsers.map(u => {
                const nickname = u.NICKNAME || u.nickname || u.name;
                const bio = u.BIO || u.bio;
                const avatar = u.AVATAR || u.avatar;

                return (
                  <Box key={u.USER_ID || u.userId || u.id} onMouseDown={() => onSelect(nickname)} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1, cursor: 'pointer',
                    '&:hover': { backgroundColor: colors.hover }, transition: 'background 0.1s',
                  }}>
                    <Avatar src={resolveAvatarSrc(avatar)} sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 800, backgroundColor: colors.textPrimary }}>
                      {getInitial(nickname)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontSize: '0.85rem', color: colors.textPrimary, fontWeight: 700, lineHeight: 1.2 }}>{nickname}</Typography>
                      {bio && <Typography sx={{ fontSize: '0.72rem', color: colors.textHint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bio}</Typography>}
                    </Box>
                    <NorthEast sx={{ fontSize: 13, color: colors.textHint, flexShrink: 0 }} />
                  </Box>
                )
              })}
            </>
          )}
          {liveTags.length > 0 && (
            <>
              {liveUsers.length > 0 && <Divider sx={{ borderColor: colors.border, mx: 2, my: 0.5 }} />}
              <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: '0.68rem', fontWeight: 800, color: colors.textHint, letterSpacing: '0.08em', textTransform: 'uppercase' }}>태그</Typography>
              {liveTags.map(t => {
                const m = getTagColor(t.TAG_NAME);
                return (
                  <Box key={t.TAG_NAME} onMouseDown={() => onSelect(t.TAG_NAME)} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 0.9, cursor: 'pointer',
                    '&:hover': { backgroundColor: colors.hover }, transition: 'background 0.1s',
                  }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: 1, backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: m.color }}>
                      <Tag sx={{ fontSize: 14 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: colors.textPrimary, fontWeight: 700, flex: 1 }}>#{t.TAG_NAME}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: colors.textHint }}>{formatCount(t.POST_COUNT)}개</Typography>
                  </Box>
                );
              })}
            </>
          )}
          {(liveUsers.length > 0 || liveTags.length > 0) && <Divider sx={{ borderColor: colors.border, mx: 2, my: 0.5 }} />}
          <Box onMouseDown={() => onSelect(query)} sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.2, cursor: 'pointer',
            '&:hover': { backgroundColor: colors.hover },
          }}>
            <Search sx={{ fontSize: 16, color: colors.textHint }} />
            <Typography sx={{ fontSize: '0.88rem', color: colors.textPrimary, fontWeight: 600 }}>"{query}" 전체 검색하기</Typography>
            <NorthEast sx={{ fontSize: 14, color: colors.textHint, ml: 'auto' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

const ResultTabBtn = ({ icon, label, active, onClick, count, colors }) => (
  <Button
    startIcon={icon}
    onClick={onClick}
    sx={{
      fontWeight: active ? 800 : 500, fontSize: '0.82rem',
      color: active ? colors.textPrimary : colors.textHint,
      borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
      borderRadius: 0, px: 2, py: 1.5,
      '&:hover': { color: colors.textPrimary, backgroundColor: 'transparent' },
      transition: 'all 0.15s',
    }}
  >
    {label}
    {count != null && (
      <Box component="span" sx={{
        ml: 0.5, px: 0.8, py: 0.1,
        backgroundColor: active ? colors.textPrimary : colors.border,
        color: active ? colors.paper : colors.textMuted,
        borderRadius: 10, fontSize: '0.65rem', fontWeight: 800, lineHeight: 1.6,
      }}>
        {count}
      </Box>
    )}
  </Button>
);

const PostCard = ({ post, idx, colors }) => {
  const navigate = useNavigate();
  const likeCount = Number(post.likes) || 0;
  const commentCount = Number(post.commentCount) || 0;
  const viewCount = Number(post.views || post.viewCount) || 0;
  const imgSrc = resolvePostImage(post.firstImage) || 'https://via.placeholder.com/300?text=No+Image';

  return (
    <Box
      onClick={() => navigate(`/post/${post.id}`)}
      sx={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1',
        backgroundColor: colors.border,
        overflow: 'hidden',
        cursor: 'pointer',
        animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
        '&:hover .hover-overlay': { opacity: 1 },
      }}
    >
      <Box component="img" src={imgSrc} alt="post" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />

      <Box sx={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          <Visibility sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: '0.8rem', fontWeight: 700 }}>{formatCount(viewCount)}</Typography>
        </Box>
        {post.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            <LocationOn sx={{ fontSize: 13 }} />
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 600 }}>{post.location}</Typography>
          </Box>
        )}
      </Box>

      <Box className="hover-overlay" sx={{
        position: 'absolute', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        opacity: 0, transition: 'opacity 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.5,
        color: '#fff'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <Favorite sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCount(likeCount)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
          <ChatBubbleOutline sx={{ fontSize: 20 }} />
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 800 }}>{formatCount(commentCount)}</Typography>
        </Box>
      </Box>
    </Box>
  );
};

const UserCard = ({ user, idx, token, colors }) => {
  const userId = user.USER_ID || user.id || user.userId;
  const nickname = user.NICKNAME || user.nickname || user.name;
  const avatar = user.AVATAR || user.avatar;
  const bio = user.BIO || user.bio || '소개가 없습니다.';
  const isFollowingRaw = user.IS_FOLLOWING !== undefined ? user.IS_FOLLOWING : user.isFollowing;
  const initialFollowing = isFollowingRaw === 'Y' || isFollowingRaw === 'ACCEPTED' || isFollowingRaw === true;
  const followerCountVal = Number(user.FOLLOWER_COUNT || user.followerCount || 0);

  const [following, setFollowing] = useState(initialFollowing);
  const [followerCount, setFollowerCount] = useState(followerCountVal);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    const willFollow = !following;
    setFollowing(willFollow);
    setFollowerCount(c => c + (willFollow ? 1 : -1));
    setLoading(true);
    try {
      const res = await fetch(`${API}/user/follow/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!data.success) {
        setFollowing(!willFollow);
        setFollowerCount(c => c + (willFollow ? -1 : 1));
      }
    } catch {
      setFollowing(!willFollow);
      setFollowerCount(c => c + (willFollow ? -1 : 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2,
      p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
      animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
      transition: 'all 0.2s',
      '&:hover': { borderColor: colors.borderFocus, boxShadow: '0 4px 16px rgba(15,23,42,0.06)' },
    }}>
      <Avatar src={resolveAvatarSrc(avatar)} sx={{ width: 48, height: 48, fontSize: '1rem', fontWeight: 800, backgroundColor: colors.textPrimary }}>
        {getInitial(nickname)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: colors.textPrimary, lineHeight: 1.2 }}>{nickname}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, fontWeight: 500, mt: 0.3 }}>{bio}</Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.72rem', color: colors.textHint, mb: 0.8 }}>팔로워 {followerCount.toLocaleString()}</Typography>
        <Button
          size="small" disabled={loading}
          startIcon={loading ? <CircularProgress size={11} /> : following ? <PersonRemove sx={{ fontSize: 13 }} /> : <PersonAdd sx={{ fontSize: 13 }} />}
          onClick={toggleFollow}
          sx={{
            fontSize: '0.75rem', fontWeight: 700, px: 1.8, py: 0.5,
            borderRadius: 1.2, minWidth: 0, boxShadow: 'none',
            ...(following
              ? { border: `1px solid ${colors.border}`, color: colors.textMuted, backgroundColor: 'transparent', '&:hover': { borderColor: '#EF4444', color: '#EF4444', backgroundColor: '#FEF2F2' } }
              : { backgroundColor: colors.textPrimary, color: colors.paper, '&:hover': { backgroundColor: '#2563EB' } }
            ),
            transition: 'all 0.18s',
          }}
        >
          {following ? '팔로잉' : '팔로우'}
        </Button>
      </Box>
    </Box>
  );
};

const TagCard = ({ tag, idx, onTagClick, colors }) => {
  const m = getTagColor(tag.TAG_NAME);
  return (
    <Box
      onClick={() => onTagClick(tag.TAG_NAME)}
      sx={{
        backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2,
        p: 2.5, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
        animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
        transition: 'all 0.2s',
        '&:hover': { borderColor: m.color, boxShadow: `0 4px 16px ${m.color}14`, transform: 'translateY(-1px)' },
      }}
    >
      <Box sx={{ width: 44, height: 44, borderRadius: 1.5, backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: m.color, border: `1px solid ${m.color}22` }}>
        <Tag sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: colors.textPrimary }}>#{tag.TAG_NAME}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: colors.textHint, mt: 0.2 }}>{formatCount(tag.POST_COUNT)} 게시물</Typography>
      </Box>
    </Box>
  );
};

const PostSkeleton = ({ colors }) => (
  <Skeleton variant="rectangular" width="100%" sx={{ aspectRatio: '1/1', borderRadius: 0, backgroundColor: colors.border }} />
);

const UserSkeleton = ({ colors }) => (
  <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2, p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Skeleton variant="circular" width={48} height={48} />
    <Box sx={{ flex: 1 }}>
      <Skeleton width={120} height={18} />
      <Skeleton width={80} height={14} sx={{ mt: 0.5 }} />
    </Box>
    <Skeleton width={70} height={32} sx={{ borderRadius: 1 }} />
  </Box>
);

const FollowersModal = ({ open, onClose, users, token, colors }) => (
  <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }} slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' } } }}>
    <Fade in={open}>
      <Box sx={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: { xs: '90vw', sm: 440 }, maxHeight: '80vh', display: 'flex', flexDirection: 'column',
        backgroundColor: colors.paper, borderRadius: 3, boxShadow: '0 20px 60px rgba(15,23,42,0.16)', outline: 'none'
      }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary }}>팔로우 추천</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: colors.textHint }}><Close sx={{ fontSize: 18 }} /></IconButton>
        </Box>
        <Box sx={{ p: 2.5, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {users.map((u, i) => <UserCard key={u.USER_ID || u.id || u.userId} user={u} idx={i} token={token} colors={colors} />)}
        </Box>
      </Box>
    </Fade>
  </Modal>
);

const DefaultView = ({ trendingTags, recommendedUsers, explorePosts, loadingDefault, onTagClick, token, colors }) => {
  const [modalOpen, setModalOpen] = useState(false);

  if (loadingDefault) {
    return (
      <Stack spacing={1.5}>
        {[...Array(5)].map((_, i) => <UserSkeleton key={i} colors={colors} />)}
      </Stack>
    );
  }

  const displayedUsers = recommendedUsers.slice(0, 5);

  return (
    <Box sx={{ animation: 'fadeUp 0.3s ease both' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LocalFireDepartment sx={{ color: '#F87171', fontSize: 18, opacity: 0.75 }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: colors.textPrimary, letterSpacing: '-0.01em' }}>지금 뜨는 태그</Typography>
      </Box>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {trendingTags.map((t, i) => {
          const m = getTagColor(t.TAG_NAME);
          return (
            <Box key={t.TAG_NAME} onClick={() => onTagClick(t.TAG_NAME)} sx={{
              display: 'flex', alignItems: 'center',
              backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2,
              px: 2, py: 1.6, cursor: 'pointer',
              animation: `fadeUp 0.35s ease ${i * 0.05}s both`,
              transition: 'all 0.18s',
              '&:hover': { borderColor: '#2563EB', boxShadow: '0 4px 16px rgba(37,99,235,0.08)', transform: 'translateX(3px)' },
            }}>
              <Typography sx={{ color: colors.textHint, fontWeight: 800, fontSize: '0.78rem', width: 20, mr: 1.5 }}>{i + 1}</Typography>
              <Tag sx={{ fontSize: 15, color: colors.textHint, mr: 1 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: colors.textPrimary, flex: 1 }}>#{t.TAG_NAME}</Typography>
              <Typography sx={{ fontSize: '0.75rem', color: colors.textHint, mr: 1 }}>{formatCount(t.POST_COUNT)} 게시물</Typography>
              {i < 3 && <EmojiEvents sx={{ fontSize: 15, color: i === 0 ? '#D4A843' : i === 1 ? '#B0B8C4' : '#A07850', opacity: 0.7 }} />}
            </Box>
          );
        })}
      </Stack>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <GroupAdd sx={{ color: '#93B4E0', fontSize: 18, opacity: 0.85 }} />
          <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: colors.textPrimary, letterSpacing: '-0.01em' }}>팔로우 추천</Typography>
        </Box>
        {recommendedUsers.length > 5 && (
          <Typography onClick={() => setModalOpen(true)} sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
            더보기
          </Typography>
        )}
      </Box>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {displayedUsers.map((u, i) => <UserCard key={u.USER_ID || u.id || u.userId} user={u} idx={i} token={token} colors={colors} />)}
      </Stack>
      <FollowersModal open={modalOpen} onClose={() => setModalOpen(false)} users={recommendedUsers} token={token} colors={colors} />

      {explorePosts.length > 0 && (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AutoAwesome sx={{ color: '#F59E0B', fontSize: 18, opacity: 0.85 }} />
            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: colors.textPrimary, letterSpacing: '-0.01em' }}>추천 게시물</Typography>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: { xs: 0.5, md: 1 } }}>
            {explorePosts.map((p, i) => <PostCard key={p.id} post={p} idx={i} colors={colors} />)}
          </Box>
        </>
      )}
    </Box>
  );
};

const EmptyState = ({ label, query, colors }) => (
  <Box sx={{ textAlign: 'center', py: 8, animation: 'fadeUp 0.3s ease both' }}>
    <Box sx={{ mb: 1.5 }}>
      <Search sx={{ fontSize: 40, color: colors.border }} />
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: colors.textPrimary, mb: 0.5 }}>"{query}"에 해당하는 {label}이 없습니다</Typography>
    <Typography sx={{ fontSize: '0.82rem', color: colors.textHint }}>다른 키워드로 검색해보세요</Typography>
  </Box>
);

export default function Explore() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useColorMode();
  const token = localStorage.getItem('accessToken');

  const colors = {
    bg: mode === 'dark' ? '#0F1117' : '#F8FAFC',
    paper: mode === 'dark' ? '#1A1D27' : '#FFFFFF',
    border: mode === 'dark' ? '#2D3148' : '#E2E8F0',
    borderFocus: mode === 'dark' ? '#4B5280' : '#CBD5E1',
    textPrimary: mode === 'dark' ? '#F1F5F9' : '#0F172A',
    textMuted: mode === 'dark' ? '#94A3B8' : '#64748B',
    textHint: mode === 'dark' ? '#64748B' : '#94A3B8',
    hover: mode === 'dark' ? '#22253A' : '#F8FAFC',
  };

  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('posts');
  const [activeTagFilter, setActiveTagFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('explore_recent') || '[]'); } catch { return []; }
  });

  const [trendingTags, setTrendingTags] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [explorePosts, setExplorePosts] = useState([]);
  const [loadingDefault, setLoadingDefault] = useState(true);

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);

  const inputRef = useRef(null);

  const loadDefault = useCallback(async () => {
    setLoadingDefault(true);
    try {
      const [tRes, uRes, pRes] = await Promise.all([
        fetch(`${API}/explore/trending-tags`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/explore/recommended-users`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/explore/posts`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [tData, uData, pData] = await Promise.all([tRes.json(), uRes.json(), pRes.json()]);

      if (tData.success) setTrendingTags(tData.tags);
      if (uData.success) setRecommendedUsers(uData.users);
      if (pData.success) setExplorePosts(pData.posts);
    } catch (err) {
    } finally {
      setLoadingDefault(false);
    }
  }, [token]);

  const doSearch = useCallback(async (q) => {
    if (!q?.trim()) return;
    setLoadingSearch(true);
    try {
      const res = await fetch(`${API}/explore/search?q=${encodeURIComponent(q)}&type=all&limit=30`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
        setUsers(data.users || []);
        setTags(data.tags || []);
        const tagSet = new Set();
        (data.posts || []).forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
        setAvailableTags([...tagSet]);
      }
    } catch (err) {
    } finally {
      setLoadingSearch(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/'); return; }

    const params = new URLSearchParams(location.search);
    const tagParam = params.get('tag');
    const locationParam = params.get('location');
    const searchParam = tagParam || locationParam;

    if (searchParam) {
      setInputValue(searchParam);
      setQuery(searchParam);
      setActiveResultTab('posts');
      setActiveTagFilter('all');
      doSearch(searchParam);
    } else {
      setQuery('');
      setInputValue('');
      loadDefault();
    }
  }, [location.search, token, navigate, doSearch, loadDefault]);

  const handleSearch = (val) => {
    const v = (val ?? inputValue).trim();
    if (!v) return;

    setQuery(v);
    setInputValue(v);
    setFocused(false);
    setActiveResultTab('posts');
    setActiveTagFilter('all');
    setRecentSearches(prev => {
      const updated = [v, ...prev.filter(s => s !== v)].slice(0, 5);
      localStorage.setItem('explore_recent', JSON.stringify(updated));
      return updated;
    });
    doSearch(v);
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    setActiveTagFilter('all');
    navigate('/explore', { replace: true });
    inputRef.current?.focus();
  };

  const filteredPosts = activeTagFilter === 'all' ? posts : posts.filter(p => (p.tags || []).includes(activeTagFilter));

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg }}>
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 100,
        backgroundColor: mode === 'dark' ? 'rgba(15,17,23,0.9)' : 'rgba(248,250,252,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton size="small" onClick={() => navigate('/feed')} sx={{ color: colors.textMuted, flexShrink: 0 }}>
            <ArrowBack sx={{ fontSize: 20 }} />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1, flexShrink: 0 }}>
            <Box sx={{ width: 26, height: 26, borderRadius: 1, backgroundColor: colors.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: colors.paper, fontWeight: 900, fontSize: '0.68rem' }}>{'<>'}</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: colors.textPrimary }}>탐색</Typography>
          </Box>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <SearchBar
              value={inputValue} onChange={setInputValue} onClear={handleClear}
              onFocus={() => setFocused(true)} onBlur={() => setTimeout(() => setFocused(false), 150)}
              onEnter={handleSearch} inputRef={inputRef} colors={colors}
            />
            {focused && (
              <SearchDropdown
                query={inputValue} recentSearches={recentSearches} trendingTags={trendingTags}
                onSelect={handleSearch} token={token} colors={colors}
                onClearRecent={() => { setRecentSearches([]); localStorage.removeItem('explore_recent'); }}
                onDeleteRecent={(s) => setRecentSearches(prev => {
                  const updated = prev.filter(x => x !== s);
                  localStorage.setItem('explore_recent', JSON.stringify(updated));
                  return updated;
                })}
              />
            )}
          </Box>
          <Button
            variant="contained" onClick={() => handleSearch()}
            sx={{
              backgroundColor: colors.textPrimary, color: colors.paper, fontSize: '0.82rem',
              px: 2.2, py: 1, borderRadius: 1.5, boxShadow: 'none', flexShrink: 0,
              '&:hover': { backgroundColor: '#2563EB' }, transition: 'background 0.18s',
            }}
          >
            검색
          </Button>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 1000, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
        {!query ? (
          <DefaultView
            trendingTags={trendingTags} recommendedUsers={recommendedUsers} explorePosts={explorePosts}
            loadingDefault={loadingDefault} onTagClick={(tag) => handleSearch(tag)}
            token={token} colors={colors}
          />
        ) : (
          <Box sx={{ animation: 'fadeIn 0.25s ease both' }}>
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: colors.textPrimary, letterSpacing: '-0.02em' }}>
                <Box component="span" sx={{ color: '#2563EB' }}>"{query}"</Box> 검색 결과
              </Typography>
              {!loadingSearch && (
                <Typography sx={{ color: colors.textHint, fontSize: '0.82rem', mt: 0.3 }}>
                  게시물 {posts.length}개 · 개발자 {users.length}명 · 태그 {tags.length}개
                </Typography>
              )}
            </Box>

            <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
              <Box sx={{ display: 'flex', borderBottom: `1px solid ${colors.border}`, px: 1 }}>
                <ResultTabBtn icon={<Article sx={{ fontSize: 15 }} />} label="게시물" active={activeResultTab === 'posts'} onClick={() => setActiveResultTab('posts')} count={posts.length} colors={colors} />
                <ResultTabBtn icon={<People sx={{ fontSize: 15 }} />} label="개발자" active={activeResultTab === 'users'} onClick={() => setActiveResultTab('users')} count={users.length} colors={colors} />
                <ResultTabBtn icon={<Tag sx={{ fontSize: 15 }} />} label="태그" active={activeResultTab === 'tags'} onClick={() => setActiveResultTab('tags')} count={tags.length} colors={colors} />
              </Box>

              {activeResultTab === 'posts' && availableTags.length > 0 && (
                <Box sx={{ display: 'flex', gap: 0.8, px: 2, py: 1.5, overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' }, borderBottom: `1px solid ${colors.border}` }}>
                  {['all', ...availableTags].map(ct => {
                    const active = activeTagFilter === ct;
                    const m = ct !== 'all' ? getTagColor(ct) : null;
                    return (
                      <Chip key={ct} label={ct === 'all' ? '전체' : ct} size="small"
                        onClick={() => setActiveTagFilter(ct)}
                        sx={{
                          fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0,
                          backgroundColor: active ? (m ? m.bg : colors.textPrimary) : colors.hover,
                          color: active ? (m ? m.color : colors.paper) : colors.textHint,
                          border: active ? `1px solid ${m ? m.color + '44' : 'transparent'}` : `1px solid ${colors.border}`,
                          '&:hover': { opacity: 0.85 }, transition: 'all 0.15s',
                        }}
                      />
                    );
                  })}
                </Box>
              )}
            </Box>

            {loadingSearch ? (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: { xs: 0.5, md: 1 } }}>
                {[...Array(6)].map((_, i) => <PostSkeleton key={i} colors={colors} />)}
              </Box>
            ) : (
              <>
                {activeResultTab === 'posts' && (
                  filteredPosts.length === 0
                    ? <EmptyState label="게시물" query={query} colors={colors} />
                    : (
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: { xs: 0.5, md: 1 } }}>
                        {filteredPosts.map((p, i) => <PostCard key={p.id} post={p} idx={i} colors={colors} />)}
                      </Box>
                    )
                )}
                {activeResultTab === 'users' && (
                  users.length === 0
                    ? <EmptyState label="개발자" query={query} colors={colors} />
                    : <Stack spacing={1.5}>{users.map((u, i) => <UserCard key={u.USER_ID || u.id || u.userId} user={u} idx={i} token={token} colors={colors} />)}</Stack>
                )}
                {activeResultTab === 'tags' && (
                  tags.length === 0
                    ? <EmptyState label="태그" query={query} colors={colors} />
                    : <Stack spacing={1.5}>{tags.map((t, i) => <TagCard key={t.TAG_NAME} tag={t} idx={i} onTagClick={(tag) => handleSearch(tag)} colors={colors} />)}</Stack>
                )}
              </>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}