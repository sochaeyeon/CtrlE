import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Tabs,
  Tab,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputBase,
  CircularProgress,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  CameraAlt,
  Edit,
  Code,
  BugReport,
  Rocket,
  Lightbulb,
  TrendingUp,
  Bookmark,
  Favorite,
  ChatBubbleOutline,
  GridOn,
  ViewList,
  Close,
  Check,
  GitHub,
  Language,
  ArrowBack,
} from '@mui/icons-material';

// ──────────────────────────────────────────
//  Theme  (동일 테마)
// ──────────────────────────────────────────
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    secondary: { main: '#0F172A' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
  },
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
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `,
    },
  },
});



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

// ──────────────────────────────────────────
//  AvatarUpload
// ──────────────────────────────────────────
const AvatarUpload = ({ avatarSrc, name, onUpload, size = 96 }) => {
  const fileRef = useRef(null);
  const [hover, setHover] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onUpload(ev.target.result, file);
    reader.readAsDataURL(file);
  };

  return (
    <Box
      sx={{ position: 'relative', width: size, height: size, cursor: 'pointer' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => fileRef.current?.click()}
    >
      <Avatar
        src={avatarSrc || undefined}
        sx={{
          width: size, height: size,
          backgroundColor: '#0F172A',
          fontSize: size * 0.35,
          fontWeight: 800,
          border: '3px solid #FFFFFF',
          boxShadow: '0 4px 20px rgba(15,23,42,0.12)',
          transition: 'all 0.2s',
          filter: hover ? 'brightness(0.75)' : 'brightness(1)',
        }}
      >
        {getInitial(name)}
      </Avatar>

      {/* Overlay */}
      <Box sx={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        backgroundColor: 'rgba(15,23,42,0.5)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.3,
        opacity: hover ? 1 : 0,
        transition: 'opacity 0.2s',
      }}>
        <CameraAlt sx={{ color: '#fff', fontSize: size * 0.26 }} />
        <Typography sx={{ color: '#fff', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em' }}>
          변경
        </Typography>
      </Box>

      {/* Badge dot */}
      <Box sx={{
        position: 'absolute', bottom: 4, right: 4,
        width: 22, height: 22, borderRadius: '50%',
        backgroundColor: '#2563EB',
        border: '2px solid #fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
      }}>
        <CameraAlt sx={{ color: '#fff', fontSize: 11 }} />
      </Box>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFile}
      />
    </Box>
  );
};

// ──────────────────────────────────────────
//  EditProfileDialog
// ──────────────────────────────────────────
const EditProfileDialog = ({ open, user, onClose, onSave }) => {
  const [form, setForm] = useState({ ...user });
  const [avatarSrc, setAvatarSrc] = useState(user.avatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...user });
      setAvatarSrc(user.avatar);
      setAvatarFile(null);
    }
  }, [open, user]);

  const handleSave = async () => {
    setSaving(true);
    // TODO: API 연동
    // const formData = new FormData();
    // if (avatarFile) formData.append('avatar', avatarFile);
    // formData.append('name', form.name);
    // formData.append('bio', form.bio);
    // await fetch('http://localhost:3010/user/profile', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: formData });
    await new Promise(r => setTimeout(r, 800)); // 목업 딜레이
    setSaving(false);
    onSave({ ...form, avatar: avatarSrc });
    onClose();
  };

  const field = (label, key, multiline = false) => (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', mb: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        {label}
      </Typography>
      <InputBase
        fullWidth
        multiline={multiline}
        rows={multiline ? 3 : 1}
        value={form[key] || ''}
        onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        sx={{
          fontSize: '0.88rem', color: '#0F172A', fontWeight: 500,
          backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
          borderRadius: 1.5, px: 1.5, py: 0.9,
          alignItems: multiline ? 'flex-start' : 'center',
          '&:focus-within': { borderColor: '#2563EB', backgroundColor: '#fff' },
          transition: 'all 0.2s',
        }}
      />
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 24px 64px rgba(15,23,42,0.15)',
        }
      }}
    >
      <DialogTitle sx={{
        fontWeight: 800, fontSize: '1rem', color: '#0F172A',
        borderBottom: '1px solid #F1F5F9', py: 2, px: 3,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        프로필 편집
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ px: 3, py: 3 }}>
        {/* Avatar upload */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <AvatarUpload
              avatarSrc={avatarSrc}
              name={form.name}
              onUpload={(src, file) => { setAvatarSrc(src); setAvatarFile(file); }}
              size={88}
            />
            <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 1 }}>
              클릭해서 프로필 사진 변경
            </Typography>
          </Box>
        </Box>

        {field('이름', 'name')}
        {field('한 줄 소개', 'role')}
        {field('소개', 'bio', true)}
        {field('GitHub', 'github')}
        {field('웹사이트', 'website')}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F1F5F9', gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600, fontSize: '0.83rem' }}
        >
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          endIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Check sx={{ fontSize: 15 }} />}
          sx={{
            backgroundColor: '#0F172A', color: '#fff', textTransform: 'none',
            fontWeight: 700, fontSize: '0.83rem', px: 2.5, boxShadow: 'none', borderRadius: 1.5,
            '&:hover': { backgroundColor: '#2563EB' },
            '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' },
          }}
        >
          저장하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ──────────────────────────────────────────
//  PostGrid  (그리드 뷰) - 수정
// ──────────────────────────────────────────
const PostGrid = ({ posts }) => (
  <Grid container spacing={1.5}>
    {posts.map((post, i) => {
      const meta = tagMeta(post.tag);
      return (
        <Grid item xs={12} sm={6} md={4} key={post.id}>
          <Box sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: '1px solid #E2E8F0',
            backgroundColor: '#fff',
            cursor: 'pointer',
            animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
            transition: 'all 0.2s',
            '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', transform: 'translateY(-2px)' },
          }}>
            {post.image ? (
              <Box
                component="img"
                src={post.image} // 여기를 post.image로 명시
                alt={post.title}
                sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <Box sx={{ height: 100, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ color: meta.color }}>{meta.icon}</Box>
              </Box>
            )}

            <Box sx={{ p: 1.8 }}>
              <Chip
                label={post.tag}
                size="small"
                sx={{
                  backgroundColor: meta.bg, color: meta.color,
                  fontWeight: 700, fontSize: '0.65rem', height: 18,
                  border: `1px solid ${meta.color}22`, mb: 0.8,
                }}
              />
              <Typography sx={{
                fontWeight: 700, fontSize: '0.82rem', color: '#0F172A',
                lineHeight: 1.4, mb: 1,
                display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {post.title}
              </Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <Favorite sx={{ fontSize: 12, color: '#EF4444' }} />
                  <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{post.likes}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  <ChatBubbleOutline sx={{ fontSize: 12, color: '#94A3B8' }} />
                  <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>{post.commentCount}</Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        </Grid>
      );
    })}
  </Grid>
);

// Stack spacing={2} → Box로 교체
const PostList = ({ posts }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {posts.map((post, i) => {
      const meta = tagMeta(post.tag);
      const firstImage = post.image;  // 이미 formattedPosts에서 정제됨
      return (
        <Box key={post.id} sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: '#fff', border: '1px solid #E2E8F0',
          borderRadius: 2, p: 2.5, gap: 2,
          cursor: 'pointer',
          animation: `fadeUp 0.4s ease ${i * 0.05}s both`,
          transition: 'all 0.2s',
          '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' },
        }}>
          {/* 텍스트 (왼쪽) */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 1 }}>
              <Chip label={post.tag} size="small" sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.62rem', height: 16 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', mb: 1 }}>
              {post.title}
            </Typography>
            <Typography sx={{
              fontSize: '0.82rem', color: '#64748B', lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
            }}
              dangerouslySetInnerHTML={{ __html: post.description }} />
          </Box>

          {/* 이미지 (오른쪽, 있을 때만) */}
          {firstImage && (
            <Box component="img"
              src={firstImage}
              alt={post.title}
              sx={{
                width: 90, height: 90,
                borderRadius: 1.5,
                flexShrink: 0,
                objectFit: 'cover',
                border: '1px solid #E2E8F0',
                display: 'block',        // ← inline 기본값 방지
              }}
            />
          )}
        </Box>
      );
    })}
  </Box>
);
// ──────────────────────────────────────────
//  StatBadge
// ──────────────────────────────────────────
const StatBadge = ({ value, label }) => (
  <Box sx={{ textAlign: 'center', cursor: 'pointer', px: 2, '&:hover .stat-value': { color: '#2563EB' } }}>
    <Typography
      className="stat-value"
      sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F172A', lineHeight: 1, transition: 'color 0.15s' }}
    >
      {value}
    </Typography>
    <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 0.2, fontWeight: 500 }}>
      {label}
    </Typography>
  </Box>
);

// ──────────────────────────────────────────
//  Main Mypage
// ──────────────────────────────────────────
export default function Mypage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');

  const token = localStorage.getItem('accessToken');

  const getSortedPosts = useCallback(() => {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.CREATED_AT || 0);
      const dateB = new Date(b.CREATED_AT || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [posts, sortOrder]);

  const currentPosts = activeTab === 0 ? getSortedPosts() : bookmarks;

  const handleSaveProfile = (updated) => {
    setUser(updated);
  };
  useEffect(() => {
    const fetchMypageData = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:3010/user/mypage/data', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) throw new Error('서버 응답 오류');

        const data = await res.json();
        if (data.success) {
          setUser({
            name: data.user.NICKNAME || '사용자',
            handle: `@${data.user.NICKNAME || 'user'}`,
            role: 'Developer',
            bio: data.user.BIO || '',
            github: data.user.GITHUB || '',
            website: data.user.WEBSITE || '',
            avatar: null,
            postCount: data.posts.length,
            followers: 0,
            following: 0
          });

          const formattedPosts = data.posts.map(p => ({
            ...p,
            id: p.id || p.POST_ID,
            title: p.title || p.TITLE || '',
            description: p.description || p.CONTENT || '',
            tag: p.tag || 'General',
            likes: p.likes ?? 0,
            commentCount: p.commentCount ?? 0,
            image: (p.images && p.images.trim()) ? p.images.split(',')[0].trim() : null,
          }));
          setPosts(formattedPosts);
        }
      } catch (err) {
        console.error('데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchMypageData();
    else navigate('/');
  }, [token, navigate]);

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

        {/* ── Top bar ── */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: 'rgba(248,250,252,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E2E8F0',
        }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => navigate('/feed')} sx={{ color: '#64748B' }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
              {user.name}
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem' }}>
              게시물 {user.postCount}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

          {/* ── Profile section ── */}
          <Box sx={{
            backgroundColor: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 2.5,
            p: { xs: 2.5, md: 3.5 },
            mb: 3,
            animation: 'scaleIn 0.3s ease both',
          }}>

            {/* Cover band */}
            <Box sx={{
              height: 80,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #0F172A 0%, #2563EB 60%, #7C3AED 100%)',
              mb: -4,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute', inset: 0,
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
              },
            }} />

            {/* Avatar row */}
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
              <AvatarUpload
                avatarSrc={user.avatar}
                name={user.name}
                onUpload={(src, file) => {
                  setUser(u => ({ ...u, avatar: src }));
                  // TODO: 실제 업로드
                  // const fd = new FormData(); fd.append('avatar', file);
                  // fetch('http://localhost:3010/user/avatar', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                }}
                size={88}
              />
              <Button
                startIcon={<Edit sx={{ fontSize: 14 }} />}
                onClick={() => setEditOpen(true)}
                sx={{
                  border: '1px solid #E2E8F0',
                  color: '#0F172A',
                  backgroundColor: '#fff',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  px: 2, py: 0.8,
                  borderRadius: 1.5,
                  boxShadow: 'none',
                  '&:hover': { borderColor: '#0F172A', backgroundColor: '#F8FAFC' },
                  transition: 'all 0.2s',
                }}
              >
                프로필 편집
              </Button>
            </Box>

            {/* Info */}
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', lineHeight: 1.2 }}>
                {user.name}
              </Typography>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mt: 0.2 }}>
                {user.handle}
              </Typography>
              <Chip
                label={user.role}
                size="small"
                sx={{
                  mt: 1,
                  backgroundColor: '#F1F5F9', color: '#475569',
                  fontWeight: 700, fontSize: '0.7rem', height: 22,
                  border: '1px solid #E2E8F0',
                }}
              />
            </Box>

            {/* Bio */}
            <Typography sx={{ color: '#475569', fontSize: '0.88rem', lineHeight: 1.75, mb: 2, whiteSpace: 'pre-line' }}>
              {user.bio}
            </Typography>

            {/* Links */}
            <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
              {user.github && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover .link-text': { color: '#2563EB' } }}>
                  <GitHub sx={{ fontSize: 14, color: '#94A3B8' }} />
                  <Typography className="link-text" sx={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, transition: 'color 0.15s' }}>
                    {user.github}
                  </Typography>
                </Box>
              )}
              {user.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover .link-text': { color: '#2563EB' } }}>
                  <Language sx={{ fontSize: 14, color: '#94A3B8' }} />
                  <Typography className="link-text" sx={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600, transition: 'color 0.15s' }}>
                    {user.website}
                  </Typography>
                </Box>
              )}
            </Stack>

            <Divider sx={{ borderColor: '#F1F5F9', mb: 2.5 }} />

            {/* Stats */}
            <Stack direction="row" divider={<Divider orientation="vertical" flexItem sx={{ borderColor: '#F1F5F9' }} />}>
              <StatBadge value={user.postCount} label="게시물" />
              <StatBadge value={user.followers} label="팔로워" />
              <StatBadge value={user.following} label="팔로잉" />
            </Stack>
          </Box>

          {/* ── Tabs ── */}
          <Box sx={{
            backgroundColor: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 2.5,
            overflow: 'hidden',
            animation: 'fadeUp 0.4s ease 0.1s both',
          }}>
            {/* ── Tabs 영역 (정렬 버튼 포함) ── */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between', // 왼쪽은 탭, 오른쪽은 버튼으로 밀어냄
              borderBottom: '1px solid #E2E8F0',
              px: 2
            }}>
              {/* 탭 영역 */}
              <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                sx={{
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: '#94A3B8',
                    minHeight: 48,
                    px: 1.5,
                    '&.Mui-selected': { color: '#0F172A', fontWeight: 800 },
                  },
                  '& .MuiTabs-indicator': { backgroundColor: '#2563EB', height: 2 },
                }}
              >
                <Tab label={`내 게시물 ${posts.length}`} />
                <Tab label={`북마크 ${bookmarks.length}`} />
              </Tabs>

              <Stack direction="row" spacing={1} alignItems="center">

                {/* 정렬 버튼 */}
                <Button
                  size="small"
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  sx={{ fontSize: '0.75rem', color: '#64748B', textTransform: 'none' }}
                >
                  {sortOrder === 'desc' ? '최신순' : '과거순'}
                </Button>

                {/* 뷰 모드 아이콘들 */}
                <IconButton
                  size="small"
                  onClick={() => setViewMode('grid')}
                  sx={{
                    color: viewMode === 'grid' ? '#0F172A' : '#CBD5E1',
                    backgroundColor: viewMode === 'grid' ? '#F1F5F9' : 'transparent',
                    borderRadius: 1,
                  }}
                >
                  <GridOn sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => setViewMode('list')}
                  sx={{
                    color: viewMode === 'list' ? '#0F172A' : '#CBD5E1',
                    backgroundColor: viewMode === 'list' ? '#F1F5F9' : 'transparent',
                    borderRadius: 1,
                  }}
                >
                  <ViewList sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Box>

            {/* Post list */}
            <Box sx={{ p: 2.5 }}>
              {currentPosts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.88rem' }}>
                    {activeTab === 0 ? '아직 게시물이 없습니다.' : '북마크한 게시물이 없습니다.'}
                  </Typography>
                </Box>
              ) : viewMode === 'grid' ? (
                <PostGrid posts={currentPosts} />
              ) : (
                <PostList posts={currentPosts} />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Edit dialog */}
      <EditProfileDialog
        open={editOpen}
        user={user}
        onClose={() => setEditOpen(false)}
        onSave={handleSaveProfile}
      />
    </ThemeProvider>
  );
}