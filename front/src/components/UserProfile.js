import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Avatar, Button, Chip, Divider, IconButton, Stack,
  Typography, createTheme, ThemeProvider, CssBaseline,
  Tabs, Tab, Grid, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  GitHub, Language, ArrowBack, GridOn, ViewList,
  BugReport, Code, Rocket, Lightbulb, TrendingUp, Favorite, ChatBubbleOutline,
  Lock, PersonAdd, Check, AccessTime, MailOutlined
} from '@mui/icons-material';

const API = 'http://localhost:3010';

// 마이페이지와 동일한 테마 설정
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
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `,
    },
  },
});

// 공통 상수 및 헬퍼 함수
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
const tagMeta = (tag) => TAG_META[tag] || TAG_META['General'];
const stripHtml = (html) => { if (!html) return ''; return html.replace(/<[^>]*>/g, '').trim(); };

// 공통 컴포넌트
const StatBadge = ({ value, label }) => (
  <Box sx={{ textAlign: 'center', px: 2 }}>
    <Typography className="stat-value" sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F172A', lineHeight: 1 }}>{value}</Typography>
    <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 0.2, fontWeight: 500 }}>{label}</Typography>
  </Box>
);

const TextPreviewCard = ({ text, color, bg, height = 140 }) => {
  const plain = stripHtml(text);
  return (
    <Box sx={{ height, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 1.5, overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', backgroundColor: color, opacity: 0.06 }} />
      <Box sx={{ position: 'absolute', bottom: -20, left: -10, width: 60, height: 60, borderRadius: '50%', backgroundColor: color, opacity: 0.04 }} />
      <Typography sx={{ fontSize: '0.75rem', color, fontWeight: 600, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: height > 100 ? 5 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: 'center', opacity: 0.85, position: 'relative', zIndex: 1 }}>
        {plain || '내용 없음'}
      </Typography>
    </Box>
  );
};

const PostGrid = ({ posts, onPostClick }) => (
  <Grid container spacing={1.5}>
    {posts.map((post, i) => {
      const meta = tagMeta(post.tag);
      return (
        <Grid item xs={12} sm={6} md={4} key={post.id}>
          <Box onClick={() => onPostClick(post.id)} sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #E2E8F0', backgroundColor: '#fff', cursor: 'pointer', animation: `fadeUp 0.4s ease ${i * 0.05}s both`, transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', transform: 'translateY(-2px)' } }}>
            {post.image ? <Box component="img" src={post.image} alt={post.title} sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
              : <TextPreviewCard text={post.description} color={meta.color} bg={meta.bg} height={140} />}
            <Box sx={{ p: 1.8 }}>
              <Chip label={post.tag} size="small" sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.65rem', height: 18, border: `1px solid ${meta.color}22`, mb: 0.8 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.4, mb: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.title}</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}><Favorite sx={{ fontSize: 12, color: '#EF4444' }} /><Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{post.likes}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}><ChatBubbleOutline sx={{ fontSize: 12, color: '#94A3B8' }} /><Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{post.commentCount}</Typography></Box>
              </Stack>
            </Box>
          </Box>
        </Grid>
      );
    })}
  </Grid>
);

const PostList = ({ posts, onPostClick }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {posts.map((post, i) => {
      const meta = tagMeta(post.tag);
      return (
        <Box key={post.id} onClick={() => onPostClick(post.id)}
          sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5, gap: 2, cursor: 'pointer', animation: `fadeUp 0.4s ease ${i * 0.05}s both`, transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 1 }}><Chip label={post.tag} size="small" sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.62rem', height: 16 }} /></Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', mb: 1 }}>{post.title}</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: post.description }} />
          </Box>
          <Box sx={{ width: 90, height: 90, flexShrink: 0, borderRadius: 1.5, overflow: 'hidden', border: `1px solid ${post.image ? '#E2E8F0' : meta.color + '22'}` }}>
            {post.image ? <Box component="img" src={post.image} sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              : <TextPreviewCard text={post.description} color={meta.color} bg={meta.bg} height={90} />}
          </Box>
        </Box>
      );
    })}
  </Box>
);

export default function UserProfile() {
  const { nickname } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const location = useLocation();

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

  useEffect(() => {
    if (location.state?.openFollowModal && location.state?.notiId) {
      setCurrentNotiId(location.state.notiId);
      setRequestModalOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location]);

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
  }, [token, nickname, navigate]);

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
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.CREATED_AT || 0);
      const dateB = new Date(b.CREATED_AT || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [posts, sortOrder]);

  const handlePostClick = (postId) => { navigate(`/post/${postId}`); };
  const handleAccept = async () => {
    setRequestModalOpen(false);
    try {
      const res = await fetch(`${API}/notifications/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notiId: currentNotiId, action: 'ACCEPT' })
      });
      const data = await res.json();
      if (data.success) {
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (err) { }
  };

  const handleReject = async () => {
    setRequestModalOpen(false);
    try {
      await fetch(`${API}/notifications/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notiId: currentNotiId, action: 'REJECT' })
      });
      setRefreshTrigger(prev => prev + 1);
    } catch (err) { }
  };
  // 메시지 버튼 클릭 이벤트
  const handleMessageClick = () => {
    // DM 방 경로로 이동 (DM 라우터 설정에 맞게 수정 필요)
    navigate(`/messages/${user.name}`);
  };

  if (loading || !user) {
    return (
      <ThemeProvider theme={theme}><CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <Box sx={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0' }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: '#64748B' }}><ArrowBack sx={{ fontSize: 20 }} /></IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>{user.name}</Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
          {/* 프로필 정보 영역 */}
          <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2.5, p: { xs: 2.5, md: 3.5 }, mb: 3, animation: 'scaleIn 0.3s ease both' }}>
            <Box sx={{ height: 80, borderRadius: 1.5, background: 'linear-gradient(135deg, #0F172A 0%, #2563EB 60%, #7C3AED 100%)', mb: -4, position: 'relative', overflow: 'hidden', '&::after': { content: '""', position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)' } }} />

            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
              <Avatar src={user.avatar || undefined} sx={{ width: 88, height: 88, backgroundColor: '#0F172A', fontSize: 30, fontWeight: 800, border: '3px solid #FFFFFF', boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
                {getInitial(user.name)}
              </Avatar>

              {/* 내 계정이 아닐 때 버튼 그룹 표시 */}
              {!isMe && (
                <Stack direction="row" spacing={1}>
                  {/* 팔로우 버튼 */}
                  <Button variant="contained" onClick={toggleFollow} disabled={followLoading}
                    startIcon={followStatus === 'ACCEPTED' ? <Check sx={{ fontSize: 16 }} /> : followStatus === 'PENDING' ? <AccessTime sx={{ fontSize: 16 }} /> : <PersonAdd sx={{ fontSize: 16 }} />}
                    sx={{
                      textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', px: 2, py: 0.8, borderRadius: 1.5, boxShadow: 'none',
                      ...(followStatus === 'ACCEPTED'
                        ? { backgroundColor: '#F1F5F9', color: '#0F172A', border: '1px solid #E2E8F0', '&:hover': { backgroundColor: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' } }
                        : followStatus === 'PENDING'
                          ? { backgroundColor: '#F1F5F9', color: '#64748B', border: '1px solid #E2E8F0' }
                          : { backgroundColor: '#0F172A', color: '#FFFFFF', '&:hover': { backgroundColor: '#2563EB' } })
                    }}>
                    {followStatus === 'ACCEPTED' ? '팔로잉' : followStatus === 'PENDING' ? '요청됨' : '팔로우'}
                  </Button>

                  {/* 메시지(DM) 버튼: 비공개가 아니거나 이미 팔로우(canView) 중일 때 표시 */}
                  {canView && (
                    <Button variant="outlined" onClick={handleMessageClick}
                      startIcon={<MailOutlined sx={{ fontSize: 16 }} />}
                      sx={{
                        textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', px: 2, py: 0.8, borderRadius: 1.5,
                        borderColor: '#E2E8F0', color: '#0F172A', backgroundColor: '#fff',
                        '&:hover': { backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }
                      }}>
                      메시지
                    </Button>
                  )}
                </Stack>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', lineHeight: 1.2 }}>{user.name}</Typography>
                {user.isPrivate && <Lock sx={{ fontSize: 16, color: '#94A3B8' }} />}
              </Box>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mt: 0.2 }}>{user.handle}</Typography>
              {user.role && <Chip label={user.role} size="small" sx={{ mt: 1, backgroundColor: '#F1F5F9', color: '#475569', fontWeight: 700, fontSize: '0.7rem', height: 22, border: '1px solid #E2E8F0' }} />}
            </Box>

            {user.bio && <Typography sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.75, mb: 2, whiteSpace: 'pre-line' }}>{user.bio}</Typography>}

            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              {user.github && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover .link-text': { color: '#2563EB' } }} onClick={() => window.open(`https://github.com/${user.github.replace('@', '')}`, '_blank')}>
                  <GitHub sx={{ fontSize: 14, color: '#94A3B8' }} />
                  <Typography className="link-text" sx={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, transition: 'color 0.15s' }}>{user.github}</Typography>
                </Box>
              )}
              {user.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover .link-text': { color: '#2563EB' } }} onClick={() => window.open(user.website, '_blank')}>
                  <Language sx={{ fontSize: 14, color: '#94A3B8' }} />
                  <Typography className="link-text" sx={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, transition: 'color 0.15s' }}>{user.website}</Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ borderColor: '#F1F5F9', mb: 2.5 }} />
            <Stack direction="row" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: '#F1F5F9' }} />}>
              <StatBadge value={user.postCount} label="게시물" />
              <StatBadge value={user.followers} label="팔로워" />
              <StatBadge value={user.following} label="팔로잉" />
            </Stack>
          </Box>

          {/* 게시물 영역 */}
          {!canView ? (
            <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2.5, p: 8, textAlign: 'center', mb: 3 }}>
              <Lock sx={{ fontSize: 40, color: '#CBD5E1', mb: 2 }} />
              <Typography sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A', mb: 1 }}>비공개 계정입니다</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#64748B' }}>게시물을 보려면 팔로우 요청을 보내주세요.</Typography>
            </Box>
          ) : (
            <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2.5, overflow: 'hidden', animation: 'fadeUp 0.4s ease 0.1s both' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', px: 2 }}>
                <Tabs value={0} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', minHeight: 48, px: 1.5 }, '& .MuiTabs-indicator': { backgroundColor: '#2563EB', height: 2 } }}>
                  <Tab label={`작성한 게시물 ${posts.length}`} />
                </Tabs>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Button size="small" onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')} sx={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'none' }}>
                    {sortOrder === 'desc' ? '최신순' : '과거순'}
                  </Button>
                  <IconButton size="small" onClick={() => setViewMode('grid')} sx={{ color: viewMode === 'grid' ? '#0F172A' : '#CBD5E1', backgroundColor: viewMode === 'grid' ? '#F1F5F9' : 'transparent', borderRadius: 1 }}><GridOn sx={{ fontSize: 18 }} /></IconButton>
                  <IconButton size="small" onClick={() => setViewMode('list')} sx={{ color: viewMode === 'list' ? '#0F172A' : '#CBD5E1', backgroundColor: viewMode === 'list' ? '#F1F5F9' : 'transparent', borderRadius: 1 }}><ViewList sx={{ fontSize: 18 }} /></IconButton>
                </Stack>
              </Box>
              <Box sx={{ p: 2.5 }}>
                {posts.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 8 }}>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.88rem' }}>아직 게시물이 없습니다.</Typography>
                  </Box>
                ) : viewMode === 'grid' ? (
                  <PostGrid posts={getSortedPosts()} onPostClick={handlePostClick} />
                ) : (
                  <PostList posts={getSortedPosts()} onPostClick={handlePostClick} />
                )}
              </Box>
            </Box>
          )}
          <Dialog
            open={requestModalOpen}
            onClose={() => setRequestModalOpen(false)}
            PaperProps={{ sx: { borderRadius: 3, minWidth: 320 } }}
          >
            <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem' }}>팔로우 요청</DialogTitle>
            <DialogContent>
              <Typography sx={{ fontSize: '0.9rem', color: '#475569' }}>
                이 사용자의 팔로우 요청을 수락하시겠습니까?
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={handleReject} sx={{ color: '#64748B', fontWeight: 700 }}>거절</Button>
              <Button onClick={handleAccept} variant="contained" sx={{ backgroundColor: '#0F172A', color: '#fff', fontWeight: 800, borderRadius: 2 }}>수락</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>
    </ThemeProvider>
  );
}