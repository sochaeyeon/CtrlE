import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Avatar, Button, Chip, Divider, IconButton, Stack,
  Typography, createTheme, ThemeProvider, CssBaseline,
  Grid, CircularProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, Menu, MenuItem, List, ListItem, ListItemAvatar,
  ListItemText, InputBase
} from '@mui/material';
import {
  GitHub, Language, ArrowBack, GridOn, ViewList,
  BugReport, Code, Rocket, Lightbulb, TrendingUp, Favorite, ChatBubbleOutline,
  Lock, PersonAdd, Check, AccessTime, MailOutlined, PersonPin,
  SortRounded, Search, Close
} from '@mui/icons-material';
import { useColorMode } from '../App';

const API = 'http://localhost:3010';

const TAG_META = {
  'Bug Fix': { color: '#DC2626', bg: '#FEF2F2', icon: <BugReport sx={{ fontSize: 11 }} /> },
  'React': { color: '#2563EB', bg: '#EFF6FF', icon: <Code sx={{ fontSize: 11 }} /> },
  'TypeScript': { color: '#7C3AED', bg: '#F5F3FF', icon: <Code sx={{ fontSize: 11 }} /> },
  'Architecture': { color: '#D97706', bg: '#FFFBEB', icon: <Rocket sx={{ fontSize: 11 }} /> },
  'Tip': { color: '#059669', bg: '#ECFDF5', icon: <Lightbulb sx={{ fontSize: 11 }} /> },
  'DevOps': { color: '#0891B2', bg: '#ECFEFF', icon: <TrendingUp sx={{ fontSize: 11 }} /> },
  'General': { color: '#64748B', bg: '#F1F5F9', icon: null },
};

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const extractDominantColor = (imgSrc) => new Promise((resolve) => {
  if (!imgSrc) { resolve(null); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 50; canvas.height = 50;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 50, 50);
      const data = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;
      for (let i = 0; i < data.length; i += 16) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
      r = Math.round(r / count); g = Math.round(g / count); b = Math.round(b / count);
      resolve(`rgb(${r},${g},${b})`);
    } catch { resolve(null); }
  };
  img.onerror = () => resolve(null);
  img.src = imgSrc;
});

const tagMeta = (tag) => TAG_META[tag] || TAG_META['General'];
const stripHtml = (html) => { if (!html) return ''; return html.replace(/<[^>]*>/g, '').trim(); };

function MentionText({ text, onNavigate }) {
  if (!text) return null;
  const parts = text.split(/(@[\w가-힣]+)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const nickname = part.slice(1);
          return (
            <span key={i}
              onClick={(e) => { e.stopPropagation(); onNavigate && onNavigate(nickname); }}
              style={{ color: '#2563EB', fontWeight: 700, cursor: 'pointer', borderRadius: 4, padding: '0 2px', transition: 'background 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
              {nickname}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

const StatBadge = ({ value, label, onClick, colors }) => (
  <Box onClick={onClick} sx={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default', px: 2, '&:hover .sv': { color: onClick ? '#2563EB' : colors.textPrimary } }}>
    <Typography className="sv" sx={{ fontWeight: 800, fontSize: '1.2rem', color: colors.textPrimary, lineHeight: 1, transition: 'color 0.15s' }}>{value}</Typography>
    <Typography sx={{ color: colors.textHint, fontSize: '0.72rem', mt: 0.2, fontWeight: 500 }}>{label}</Typography>
  </Box>
);

const PostGrid = ({ posts, onPostClick }) => (
  <Grid container spacing={1.5}>
    {posts.map((post) => (
      <Grid item xs={4} key={post.id}>
        <Box onClick={() => onPostClick(post.id)}
          sx={{
            position: 'relative', cursor: 'pointer', overflow: 'hidden',
            borderRadius: 1.5, border: '1px solid #E2E8F0',
            aspectRatio: '1 / 1',
            '&:hover .overlay': { opacity: 1 },
            '&:hover img, &:hover .default-img': { filter: 'brightness(0.55)' },
          }}>
          <Box
            component={post.image ? 'img' : 'div'}
            src={post.image || undefined}
            className={post.image ? '' : 'default-img'}
            sx={{
              width: '100%', height: '100%', objectFit: 'cover', display: 'block',
              transition: 'filter 0.2s',
              ...(post.image ? {} : {
                backgroundImage: `url(${API}/uploads/post/defaultImg.png)`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }),
            }}
          />
          <Box className="overlay" sx={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
            opacity: 0, transition: 'opacity 0.2s',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Favorite sx={{ fontSize: 22, color: '#fff' }} />
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{post.likes}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <ChatBubbleOutline sx={{ fontSize: 22, color: '#fff' }} />
              <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{post.commentCount}</Typography>
            </Box>
          </Box>
        </Box>
      </Grid>
    ))}
  </Grid>
);

const PostList = ({ posts, onPostClick }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    {posts.map((post) => (
      <Box key={post.id} onClick={() => onPostClick(post.id)} sx={{
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2,
        overflow: 'hidden', cursor: 'pointer', gap: 0,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' },
      }}>
        <Box sx={{ position: 'relative', width: 80, height: 80, flexShrink: 0, overflow: 'hidden' }}>
          {post.image
            ? <Box component="img" src={post.image} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <Box sx={{ width: '100%', height: '100%', backgroundImage: `url(${API}/uploads/post/defaultImg.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          }
        </Box>
        <Box sx={{ flex: 1, px: 2, py: 1.5, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.title}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
);

// ── FollowModal (타 유저 프로필용) ─────────────────────────────────
// 팔로워/팔로잉 목록 + 팔로우/팔로잉 버튼 포함
const FollowModal = ({ open, initialTab, userId, token, onClose, colors }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingF, setLoadingF] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => { if (!open) return; setTab(initialTab); setSearch(''); }, [open, initialTab]);

  const fetchData = useCallback(async () => {
    if (!open || !userId) return;
    setLoadingF(true);
    try {
      const [fersRes, fingRes] = await Promise.all([
        fetch(`${API}/user/followers/by/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/user/following/by/${userId}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const fersData = await fersRes.json();
      const fingData = await fingRes.json();
      setFollowers(fersData.success ? fersData.list : []);
      setFollowing(fingData.success ? fingData.list : []);
    } catch { } finally { setLoadingF(false); }
  }, [open, userId, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // 팔로우 토글 핸들러
  const handleFollowToggle = async (u) => {
    setPendingId(u.userId);
    try {
      const res = await fetch(`${API}/user/follow/${u.userId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        const newStatus = data.status;
        // 팔로워 탭: followStatus 업데이트
        setFollowers(prev => prev.map(f => f.userId === u.userId ? { ...f, followStatus: newStatus } : f));
        // 팔로잉 탭: followStatus 업데이트
        setFollowing(prev => prev.map(f => f.userId === u.userId ? { ...f, followStatus: newStatus } : f));
      }
    } catch { } finally { setPendingId(null); }
  };

  // 팔로우 버튼 컴포넌트
  const FollowBtn = ({ u }) => {
    const isPending = pendingId === u.userId;
    const status = u.followStatus;
    if (status === 'ACCEPTED') return (
      <Button size="small" onClick={() => handleFollowToggle(u)} disabled={isPending}
        sx={{
          ml: 1, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700,
          color: colors.textPrimary, border: `1px solid ${colors.border}`,
          borderRadius: 1.5, px: 1.5, py: 0.5, textTransform: 'none', minWidth: 64,
          backgroundColor: colors.inputBg,
          '&:hover': { borderColor: colors.borderFocus, backgroundColor: colors.hover },
          transition: 'all 0.15s',
        }}>
        {isPending ? <CircularProgress size={10} /> : '팔로잉'}
      </Button>
    );
    if (status === 'PENDING') return (
      <Button size="small" onClick={() => handleFollowToggle(u)} disabled={isPending}
        sx={{
          ml: 1, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700,
          color: colors.textMuted, border: `1px solid ${colors.border}`,
          borderRadius: 1.5, px: 1.5, py: 0.5, textTransform: 'none', minWidth: 64,
          '&:hover': { borderColor: colors.borderFocus, backgroundColor: colors.hover },
          transition: 'all 0.15s',
        }}>
        {isPending ? <CircularProgress size={10} /> : '요청됨'}
      </Button>
    );
    return (
      <Button size="small" onClick={() => handleFollowToggle(u)} disabled={isPending}
        sx={{
          ml: 1, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700,
          color: '#fff', backgroundColor: '#2563EB',
          border: '1px solid #2563EB',
          borderRadius: 1.5, px: 1.5, py: 0.5, textTransform: 'none', minWidth: 64,
          '&:hover': { backgroundColor: '#1D4ED8' }, transition: 'all 0.15s',
        }}>
        {isPending ? <CircularProgress size={10} sx={{ color: '#fff' }} /> : '팔로우'}
      </Button>
    );
  };

  const list = tab === 0 ? followers : following;
  const filtered = list.filter(u => u.nickname?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          border: `1px solid ${colors.border}`,
          boxShadow: '0 24px 64px rgba(15,23,42,0.15)',
          mx: 2, my: 'auto', maxHeight: '80vh',
          backgroundColor: colors.paper,
        }
      }}>
      <DialogTitle sx={{ p: 0, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>
            {tab === 0 ? '팔로워' : '팔로잉'}
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: colors.textHint }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
        <Box sx={{ position: 'relative', display: 'flex', px: 2, mt: 1, pb: 0 }}>
          {['팔로워', '팔로잉'].map((label, i) => (
            <Box key={i} onClick={() => { setTab(i); setSearch(''); }}
              sx={{ flex: 1, py: 1.2, textAlign: 'center', cursor: 'pointer' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: tab === i ? 800 : 600, color: tab === i ? colors.textPrimary : colors.textHint, transition: 'color 0.2s' }}>
                {label} {i === 0 ? followers.length : following.length}
              </Typography>
            </Box>
          ))}
          <Box sx={{
            position: 'absolute', bottom: 0, left: `calc(${tab * 50}% + 8px)`,
            width: 'calc(50% - 16px)', height: 2,
            backgroundColor: '#2563EB', borderRadius: 1,
            transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </Box>
      </DialogTitle>
      <DialogContent sx={{ px: 2, pt: 2, pb: 1, overflowY: 'auto', backgroundColor: colors.paper }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 1.5, px: 1.5, py: 0.8 }}>
          <Search sx={{ fontSize: 16, color: colors.textHint, flexShrink: 0 }} />
          <InputBase fullWidth placeholder="검색" value={search} onChange={(e) => setSearch(e.target.value)}
            sx={{ fontSize: '0.85rem', color: colors.textPrimary }} />
        </Box>
        {loadingF ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#CBD5E1' }} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ color: colors.textHint, fontSize: '0.85rem' }}>
              {search ? '검색 결과가 없습니다.' : (tab === 0 ? '팔로워가 없습니다.' : '팔로잉이 없습니다.')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((u, idx) => (
              <ListItem key={u.userId} sx={{
                px: 0.5, py: 1, borderRadius: 1.5, cursor: 'pointer', transition: 'background 0.15s',
                '&:hover': { backgroundColor: colors.hover },
                borderBottom: idx < filtered.length - 1 ? `1px solid ${colors.border}` : 'none',
                alignItems: 'center',
              }}>
                <ListItemAvatar sx={{ minWidth: 46 }}
                  onClick={() => { onClose(); navigate(`/user/${u.nickname}`); }}>
                  <Avatar src={u.avatar ? `${API}${u.avatar}` : undefined}
                    sx={{ width: 36, height: 36, backgroundColor: colors.textPrimary, fontSize: '0.9rem', fontWeight: 800, border: `1.5px solid ${colors.border}` }}>
                    {getInitial(u.nickname)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  onClick={() => { onClose(); navigate(`/user/${u.nickname}`); }}
                  sx={{ my: 0 }}
                  primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: colors.textPrimary }}>{u.nickname}</Typography>}
                  secondary={u.bioShort ? <Typography sx={{ fontSize: '0.75rem', color: colors.textHint, mt: 0.2 }}>{u.bioShort}</Typography> : null}
                />
                {/* 팔로우/팔로잉 버튼 */}
                <FollowBtn u={u} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

const IconTabBar = ({ activeTab, onChange, colors }) => {
  const tabs = [
    { icon: <GridOn />, label: '게시물' },
    { icon: <PersonPin />, label: '태그됨' },
  ];
  return (
    <Box sx={{ position: 'relative', display: 'flex', borderBottom: `1px solid ${colors.border}` }}>
      {tabs.map((t, i) => (
        <Box key={i} onClick={() => onChange(i)} sx={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', py: 1.6, cursor: 'pointer',
          color: activeTab === i ? colors.textPrimary : colors.border,
          transition: 'color 0.2s',
          '&:hover': { color: activeTab === i ? colors.textPrimary : colors.textHint },
        }}>
          {React.cloneElement(t.icon, { sx: { fontSize: 20 } })}
        </Box>
      ))}
      <Box sx={{
        position: 'absolute', bottom: 0,
        left: `${(activeTab / 2) * 100}%`,
        width: '50%', height: 2,
        backgroundColor: colors.textPrimary, borderRadius: '2px 2px 0 0',
        transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </Box>
  );
};

const CategoryFilterBar = ({ posts, activeCategory, onChange, colors }) => {
  const categories = ['전체', ...new Set(posts.map(p => p.tag).filter(Boolean))];
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 2.5, py: 1.5, borderBottom: `1px solid ${colors.border}` }}>
      {categories.map(cat => (
        <Box key={cat} onClick={() => onChange(cat)}
          sx={{
            px: 1.5, py: 0.4, borderRadius: 10, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700,
            transition: 'all 0.15s',
            ...(activeCategory === cat
              ? { backgroundColor: colors.textPrimary, color: colors.paper }
              : { backgroundColor: colors.inputBg, color: colors.textMuted, '&:hover': { backgroundColor: colors.hover } }
            ),
          }}>
          {cat}
        </Box>
      ))}
    </Box>
  );
};

export default function UserProfile() {
  const { nickname } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const location = useLocation();

  // 다크모드
  const { mode } = useColorMode();
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

  const theme = createTheme({
    palette: {
      mode,
      primary: { main: '#2563EB' },
      secondary: { main: mode === 'dark' ? '#F1F5F9' : '#0F172A' },
      background: { default: colors.bg, paper: colors.paper },
      text: { primary: colors.textPrimary, secondary: colors.textMuted },
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
            from { opacity: 0; transform: scale(0.95); }
            to   { opacity: 1; transform: scale(1); }
          }
        `,
      },
      MuiButton: {
        styleOverrides: {
          root: { boxShadow: 'none', '&:hover': { boxShadow: 'none' }, '&:active': { boxShadow: 'none' } }
        }
      }
    },
  });

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [canView, setCanView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followStatus, setFollowStatus] = useState('NONE');
  const [isMe, setIsMe] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const [viewMode, setViewMode] = useState('grid');
  const [sortOrder, setSortOrder] = useState('desc');

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [currentNotiId, setCurrentNotiId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [requestBannerOpen, setRequestBannerOpen] = useState(false);

  const [activeTab, setActiveTab] = useState(0);
  const [headerBg, setHeaderBg] = useState('linear-gradient(135deg, #0F172A 0%, #2563EB 60%, #7C3AED 100%)');

  const [followModal, setFollowModal] = useState({ open: false, tab: 0 });
  const [sortAnchor, setSortAnchor] = useState(null);
  const [activeCategory, setActiveCategory] = useState('전체');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API}/user/profile/${encodeURIComponent(nickname)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setUser({
            id: data.user.USER_ID,
            name: data.user.NICKNAME,
            handle: `@${data.user.NICKNAME}`,
            role: data.user.BIO_SHORT || '',
            bio: data.user.BIO || '',
            github: data.user.GITHUB || '',
            website: data.user.WEBSITE || '',
            avatar: data.user.AVATAR ? `${API}${data.user.AVATAR}` : null,
            postCount: data.posts ? data.posts.length : 0,
            followers: data.user.FOLLOWER_CNT ?? 0,
            following: data.user.FOLLOWING_CNT ?? 0,
            isPrivate: data.user.IS_PRIVATE === 'Y',
          });

          const formattedPosts = (data.posts || []).map(p => ({
            ...p,
            id: p.id || p.POST_ID,
            title: p.title || p.TITLE || '',
            description: p.description || p.CONTENT || '',
            tag: p.tag || 'General',
            likes: p.likes ?? 0,
            commentCount: p.commentCount ?? 0,
            image: (p.images && p.images.trim()) ? (p.images.trim().startsWith('http') ? p.images.trim() : `${API}${p.images.trim()}`) : null,
          }));

          setPosts(formattedPosts);
          setCanView(data.canView);
          setIsMe(data.isMe);
          setFollowStatus(data.user.FOLLOW_STATUS || 'NONE');
          const avatarUrl = data.user.AVATAR ? `${API}${data.user.AVATAR}` : null;
          if (avatarUrl) {
            extractDominantColor(avatarUrl).then(color => {
              if (color) setHeaderBg(`linear-gradient(135deg, #0F172A 0%, ${color} 55%, #1E293B 100%)`);
            });
          }
          if (!data.isMe && data.user.FOLLOW_STATUS_FROM_THEM === 'PENDING') {
            setRequestBannerOpen(true);
          } else {
            setRequestBannerOpen(false);
          }
        } else {
          navigate('/feed');
        }
      } catch {
        navigate('/feed');
      } finally {
        setLoading(false);
      }
    };
    if (token && nickname) fetchProfile();
  }, [token, nickname, navigate, refreshTrigger]);

  const toggleFollow = async () => {
    setFollowLoading(true);
    try {
      const res = await fetch(`${API}/user/follow/${user.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setFollowStatus(data.status);
        setUser(u => ({
          ...u,
          followers: u.followers + (data.status === 'ACCEPTED' ? 1 : data.status === 'NONE' && followStatus === 'ACCEPTED' ? -1 : 0)
        }));
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const getSortedPosts = useCallback(() => {
    const filtered = activeCategory === '전체' ? posts : posts.filter(p => p.tag === activeCategory);
    return [...filtered].sort((a, b) => {
      if (sortOrder === 'likes') return (b.likes ?? 0) - (a.likes ?? 0);
      const dateA = new Date(a.CREATED_AT || 0);
      const dateB = new Date(b.CREATED_AT || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [posts, sortOrder, activeCategory]);

  const handlePostClick = (postId) => { navigate(`/post/${postId}`); };

  const handleAccept = async () => {
    setRequestBannerOpen(false);
    try {
      const res = await fetch(`${API}/user/follow/${user.id}/accept`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setRefreshTrigger(prev => prev + 1);
    } catch { }
  };

  const handleReject = async () => {
    setRequestBannerOpen(false);
    try {
      await fetch(`${API}/user/follow/${user.id}/reject`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setRefreshTrigger(prev => prev + 1);
    } catch { }
  };

  const handleMessageClick = async () => {
    try {
      const res = await fetch(`${API}/messages/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetNicknames: [user.name] })
      });
      const data = await res.json();
      if (data.success) navigate(`/messages/room/${data.roomId}`);
    } catch { }
  };

  if (loading || !user) {
    return (
      <ThemeProvider theme={theme}><CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: colors.bg }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg }}>
        {/* 상단 네비 */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: mode === 'dark' ? 'rgba(15,17,23,0.9)' : 'rgba(248,250,252,0.85)',
          backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}`
        }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: colors.textMuted }}><ArrowBack sx={{ fontSize: 20 }} /></IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>{user.name}</Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

          {/* 팔로우 요청 배너 */}
          {requestBannerOpen && (
            <Box sx={{
              position: 'relative', overflow: 'hidden',
              backgroundColor: mode === 'dark' ? '#1E2D4A' : '#EFF6FF',
              border: `1px solid ${mode === 'dark' ? '#2D4A7A' : '#BFDBFE'}`,
              borderRadius: 2.5, px: 3, py: 2, mb: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
              animation: 'fadeUp 0.4s ease both',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: '50%', backgroundColor: mode === 'dark' ? '#1E3A5F' : '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <PersonAdd sx={{ fontSize: 18, color: '#1E40AF' }} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: mode === 'dark' ? '#93C5FD' : '#1E40AF', lineHeight: 1.3 }}>팔로우 요청이 있어요</Typography>
                  <Typography sx={{ fontSize: '0.75rem', color: mode === 'dark' ? '#60A5FA' : '#3B82F6', mt: 0.2 }}>수락하면 상대방이 내 게시물을 볼 수 있어요</Typography>
                </Box>
              </Box>
              <Stack direction="row" spacing={1} sx={{ zIndex: 1, flexShrink: 0 }}>
                <Button size="small" onClick={handleAccept}
                  sx={{ backgroundColor: '#2563EB', color: '#fff', fontSize: '0.78rem', fontWeight: 800, borderRadius: 1.5, px: 1.8, py: 0.6, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#1D4ED8' } }}>
                  수락
                </Button>
                <Button size="small" onClick={handleReject}
                  sx={{ backgroundColor: colors.paper, color: colors.textMuted, border: `1px solid ${colors.border}`, fontSize: '0.78rem', fontWeight: 700, borderRadius: 1.5, px: 1.8, py: 0.6, textTransform: 'none', '&:hover': { backgroundColor: colors.hover } }}>
                  거절
                </Button>
              </Stack>
            </Box>
          )}

          {/* 프로필 카드 */}
          <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2.5, p: { xs: 2.5, md: 3.5 }, mb: 3, animation: 'scaleIn 0.3s ease both' }}>
            <Box sx={{
              height: 80, borderRadius: 1.5, background: headerBg,
              transition: 'background 1s ease', mb: -4, position: 'relative', overflow: 'hidden',
              '&::after': { content: '""', position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)' }
            }} />

            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
              <Avatar src={user.avatar || undefined} sx={{ width: 88, height: 88, backgroundColor: mode === 'dark' ? '#F1F5F9' : '#0F172A', color: mode === 'dark' ? '#0F172A' : '#fff', fontSize: 30, fontWeight: 800, border: '3px solid #FFFFFF', boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
                {getInitial(user.name)}
              </Avatar>

              {!isMe && (
                <Stack direction="row" spacing={1}>
                  <Button variant="contained" onClick={toggleFollow} disabled={followLoading}
                    startIcon={followStatus === 'ACCEPTED' ? <Check sx={{ fontSize: 16 }} /> : followStatus === 'PENDING' ? <AccessTime sx={{ fontSize: 16 }} /> : <PersonAdd sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', px: 2, py: 0.8, borderRadius: 1.5, boxShadow: 'none',
                      ...(followStatus === 'ACCEPTED'
                        ? { backgroundColor: colors.inputBg, color: colors.textPrimary, border: `1px solid ${colors.border}`, '&:hover': { backgroundColor: mode === 'dark' ? '#3A1A1A' : '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' } }
                        : followStatus === 'PENDING'
                          ? { backgroundColor: colors.inputBg, color: colors.textMuted, border: `1px solid ${colors.border}` }
                          : { backgroundColor: colors.textPrimary, color: colors.paper, '&:hover': { backgroundColor: '#2563EB' } })
                    }}>
                    {followStatus === 'ACCEPTED' ? '팔로잉' : followStatus === 'PENDING' ? '요청됨' : '팔로우'}
                  </Button>
                  {canView && (
                    <Button variant="outlined" onClick={handleMessageClick}
                      startIcon={<MailOutlined sx={{ fontSize: 16 }} />}
                      sx={{
                        textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', px: 2, py: 0.8, borderRadius: 1.5,
                        borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.paper,
                        '&:hover': { backgroundColor: colors.hover, borderColor: colors.borderFocus }
                      }}>
                      메시지
                    </Button>
                  )}
                </Stack>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: colors.textPrimary, lineHeight: 1.2 }}>{user.name}</Typography>
                {user.isPrivate && <Lock sx={{ fontSize: 16, color: colors.textHint }} />}
              </Box>
              <Typography sx={{ color: colors.textHint, fontSize: '0.82rem', mt: 0.2 }}>{user.handle}</Typography>
              {user.role && (
                <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, mt: 1.2, px: 1.2, py: 0.5, backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 2, maxWidth: '100%' }}>
                  <Box sx={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: '#2563EB', flexShrink: 0 }} />
                  <Typography sx={{ fontSize: '0.78rem', color: colors.textMuted, fontWeight: 600, lineHeight: 1 }}>
                    <MentionText text={user.role} onNavigate={(nick) => navigate(`/user/${nick}`)} />
                  </Typography>
                </Box>
              )}
            </Box>

            {user.bio && (
              <Typography sx={{ color: colors.textMuted, fontSize: '0.88rem', lineHeight: 1.75, mb: 2, whiteSpace: 'pre-line' }}>
                <MentionText text={user.bio} onNavigate={(nick) => navigate(`/user/${nick}`)} />
              </Typography>
            )}

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              {user.github && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover .link-text': { color: '#2563EB' } }} onClick={() => window.open(`https://github.com/${user.github.replace('@', '')}`, '_blank')}>
                  <GitHub sx={{ fontSize: 14, color: colors.textHint }} />
                  <Typography className="link-text" sx={{ fontSize: '0.78rem', color: colors.textMuted, fontWeight: 600, transition: 'color 0.15s' }}>{user.github}</Typography>
                </Box>
              )}
              {user.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover .link-text': { color: '#2563EB' } }} onClick={() => window.open(user.website, '_blank')}>
                  <Language sx={{ fontSize: 14, color: colors.textHint }} />
                  <Typography className="link-text" sx={{ fontSize: '0.78rem', color: colors.textMuted, fontWeight: 600, transition: 'color 0.15s' }}>{user.website}</Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ borderColor: colors.border, mb: 2.5 }} />
            <Stack direction="row" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: colors.border }} />}>
              <StatBadge value={user.postCount} label="게시물" colors={colors} />
              <StatBadge value={user.followers} label="팔로워" onClick={() => setFollowModal({ open: true, tab: 0 })} colors={colors} />
              <StatBadge value={user.following} label="팔로잉" onClick={() => setFollowModal({ open: true, tab: 1 })} colors={colors} />
            </Stack>
          </Box>

          {/* 게시물 영역 */}
          {!canView ? (
            <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2.5, p: 8, textAlign: 'center', mb: 3 }}>
              <Lock sx={{ fontSize: 40, color: colors.border, mb: 2 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: colors.textPrimary, mb: 1 }}>비공개 계정입니다</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>게시물을 보려면 팔로우 요청을 보내주세요.</Typography>
            </Box>
          ) : (
            <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2.5, overflow: 'hidden' }}>
              <IconTabBar activeTab={activeTab} onChange={(t) => { setActiveTab(t); setActiveCategory('전체'); }} colors={colors} />
              <CategoryFilterBar posts={posts} activeCategory={activeCategory} onChange={setActiveCategory} colors={colors} />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: `1px solid ${colors.border}` }}>
                <Typography sx={{ fontSize: '0.73rem', color: colors.textHint, fontWeight: 600 }}>
                  {getSortedPosts().length}개
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Button size="small" startIcon={<SortRounded sx={{ fontSize: 15 }} />}
                    onClick={(e) => setSortAnchor(e.currentTarget)}
                    sx={{ fontSize: '0.72rem', color: colors.textMuted, textTransform: 'none', fontWeight: 600, px: 1.2, py: 0.5, borderRadius: 1.5, border: `1px solid ${colors.border}`, '&:hover': { borderColor: colors.borderFocus, backgroundColor: colors.hover } }}>
                    {sortOrder === 'desc' ? '최신순' : sortOrder === 'asc' ? '오래된순' : '좋아요순'}
                  </Button>
                  <Menu anchorEl={sortAnchor} open={Boolean(sortAnchor)} onClose={() => setSortAnchor(null)}
                    PaperProps={{ sx: { borderRadius: 1.5, border: `1px solid ${colors.border}`, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', minWidth: 110, backgroundColor: colors.paper } }}>
                    {[['desc', '최신순'], ['asc', '오래된순'], ['likes', '좋아요순']].map(([val, label]) => (
                      <MenuItem key={val} onClick={() => { setSortOrder(val); setSortAnchor(null); }} selected={sortOrder === val}
                        sx={{ fontSize: '0.82rem', fontWeight: sortOrder === val ? 700 : 500, py: 0.9, color: colors.textPrimary }}>
                        {label}
                      </MenuItem>
                    ))}
                  </Menu>
                  <IconButton size="small" onClick={() => setViewMode('grid')}
                    sx={{ color: viewMode === 'grid' ? colors.textPrimary : colors.border, backgroundColor: viewMode === 'grid' ? colors.inputBg : 'transparent', borderRadius: 1 }}>
                    <GridOn sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setViewMode('list')}
                    sx={{ color: viewMode === 'list' ? colors.textPrimary : colors.border, backgroundColor: viewMode === 'list' ? colors.inputBg : 'transparent', borderRadius: 1 }}>
                    <ViewList sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
              </Box>

              <Box sx={{ p: 2.5 }}>
                {activeTab === 0 && (
                  getSortedPosts().length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <Typography sx={{ color: colors.textHint, fontSize: '0.88rem' }}>아직 게시물이 없습니다.</Typography>
                    </Box>
                  ) : viewMode === 'grid' ? (
                    <PostGrid posts={getSortedPosts()} onPostClick={handlePostClick} />
                  ) : (
                    <PostList posts={getSortedPosts()} onPostClick={handlePostClick} />
                  )
                )}
                {activeTab === 1 && (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography sx={{ color: colors.textHint, fontSize: '0.88rem' }}>태그된 게시물이 없습니다.</Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}

          {/* 팔로우 요청 다이얼로그 (미사용이지만 유지) */}
          <Dialog open={requestModalOpen} onClose={() => setRequestModalOpen(false)}
            PaperProps={{ sx: { borderRadius: 3, minWidth: 320, backgroundColor: colors.paper } }}>
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', color: colors.textPrimary }}>팔로우 요청</DialogTitle>
            <DialogContent>
              <Typography sx={{ fontSize: '0.9rem', color: colors.textMuted }}>이 사용자의 팔로우 요청을 수락하시겠습니까?</Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleReject} sx={{ color: colors.textMuted, fontWeight: 700 }}>거절</Button>
              <Button onClick={handleAccept} variant="contained" sx={{ backgroundColor: colors.textPrimary, color: colors.paper, fontWeight: 800, borderRadius: 2 }}>수락</Button>
            </DialogActions>
          </Dialog>

          <FollowModal
            open={followModal.open}
            initialTab={followModal.tab}
            userId={user.id}
            token={token}
            onClose={() => setFollowModal(m => ({ ...m, open: false }))}
            colors={colors}
          />
        </Box>
      </Box>
    </ThemeProvider>
  );
}