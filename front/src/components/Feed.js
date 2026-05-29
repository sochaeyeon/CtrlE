import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Button,
  Chip,
  Divider,
  IconButton,
  InputBase,
  Stack,
  Typography,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Tooltip,
  Menu,
  MenuItem,
  Badge,
  Dialog,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  InputAdornment,
  CircularProgress,
} from '@mui/material';
import {
  FavoriteBorderOutlined,
  Favorite,
  ChatBubbleOutline,
  BookmarkBorderOutlined,
  Bookmark,
  MoreHoriz,
  Add,
  Search,
  NotificationsNoneOutlined,
  Code,
  BugReport,
  Rocket,
  Lightbulb,
  TrendingUp,
  Close,
  Send,
  ArrowUpward,
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
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.18); }
        }
      `,
    },
  },
});

// ──────────────────────────────────────────
//  Constants
// ──────────────────────────────────────────
const TAG_FILTERS = [
  { label: '전체', icon: null },
  { label: 'Bug Fix', icon: <BugReport sx={{ fontSize: 13 }} /> },
  { label: 'React', icon: <Code sx={{ fontSize: 13 }} /> },
  { label: 'TypeScript', icon: <Code sx={{ fontSize: 13 }} /> },
  { label: 'Architecture', icon: <Rocket sx={{ fontSize: 13 }} /> },
  { label: 'Tip', icon: <Lightbulb sx={{ fontSize: 13 }} /> },
  { label: 'DevOps', icon: <TrendingUp sx={{ fontSize: 13 }} /> },
];

const TRENDING = [
  { tag: '#ReactHooks', count: '1.2k 게시물' },
  { tag: '#TypeScript5', count: '847 게시물' },
  { tag: '#NextJS15', count: '634 게시물' },
  { tag: '#PrismaORM', count: '412 게시물' },
  { tag: '#DockerCompose', count: '389 게시물' },
];

const SUGGESTIONS = [
  { name: 'Taehun Oh', handle: '@taehun', avatar: 'https://i.pravatar.cc/150?img=15', role: 'Rust · Backend' },
  { name: 'Minji Kwon', handle: '@minji.fe', avatar: 'https://i.pravatar.cc/150?img=25', role: 'Vue · Frontend' },
  { name: 'Seungho Lim', handle: '@seungho', avatar: 'https://i.pravatar.cc/150?img=52', role: 'ML · Data' },
];

// ──────────────────────────────────────────
//  Helpers
// ──────────────────────────────────────────
const resolveImageSrc = (src) =>
  src ? src.replace(/src="\/uploads/g, 'src="http://localhost:3010/uploads') : '';

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

// ──────────────────────────────────────────
//  NavBar
// ──────────────────────────────────────────
const NavBar = ({ onNewPost, onLogout }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <Box sx={{
      position: 'sticky', top: 0, zIndex: 100,
      backgroundColor: 'rgba(248,250,252,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid #E2E8F0',
    }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>

        {/* Logo */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2, cursor: 'pointer' }}
          onClick={() => navigate('/feed')}
        >
          <Box sx={{
            width: 28, height: 28, borderRadius: 1,
            backgroundColor: '#0F172A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.75rem', lineHeight: 1 }}>{'<>'}</Typography>
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em', color: '#0F172A' }}>CtrlE</Typography>
        </Box>

        {/* Search */}
        <Box sx={{
          flex: 1, maxWidth: 380,
          display: 'flex', alignItems: 'center', gap: 1,
          backgroundColor: '#F1F5F9',
          border: '1px solid #E2E8F0',
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

        {/* Actions */}
        <Stack direction="row" alignItems="center" spacing={1}>
          <Tooltip title="알림">
            <IconButton size="small">
              <Badge badgeContent={3} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.6rem', minWidth: 16, height: 16 } }}>
                <NotificationsNoneOutlined sx={{ fontSize: 20, color: '#64748B' }} />
              </Badge>
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={() => navigate('/register')} // 💡 모달 대신 페이지 이동으로 직행
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

        <Menu
          anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { mt: 1, boxShadow: '0 8px 30px rgba(0,0,0,0.08)', borderRadius: 2, border: '1px solid #E2E8F0', minWidth: 140 } }}
        >
          <MenuItem sx={{ fontSize: '0.83rem', fontWeight: 600, color: '#0F172A' }}>내 프로필</MenuItem>
          <MenuItem sx={{ fontSize: '0.83rem', color: '#64748B' }}>설정</MenuItem>
          <Divider />
          <MenuItem sx={{ fontSize: '0.83rem', color: '#EF4444' }} onClick={onLogout}>로그아웃</MenuItem>
        </Menu>
      </Box>
    </Box>
  );
};

// ──────────────────────────────────────────
//  CodeBlock
// ──────────────────────────────────────────
const CodeBlock = ({ code }) => (
  <Box sx={{
    mt: 2,
    backgroundColor: '#0F172A',
    borderRadius: 1.5,
    p: 2,
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
      background: 'linear-gradient(90deg, #2563EB, #7C3AED)',
    },
  }}>
    <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5 }}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
        <Box key={c} sx={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: c }} />
      ))}
    </Box>
    <Typography component="pre" sx={{
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: '0.78rem',
      lineHeight: 1.7,
      color: '#E2E8F0',
      margin: 0,
      overflowX: 'auto',
      whiteSpace: 'pre',
    }}>
      {code}
    </Typography>
  </Box>
);

// ──────────────────────────────────────────
//  PostCard
// ──────────────────────────────────────────
const PostCard = ({ feed, token, onOpenDetail }) => {
  const [liked, setLiked] = useState(feed.liked ?? false);
  const [likeCount, setLikeCount] = useState(feed.likes ?? 0);
  const [bookmarked, setBookmarked] = useState(feed.bookmarked ?? false);
  const [anchorEl, setAnchorEl] = useState(null);

  const imageList = feed.images ? feed.images.split(',') : [];

  const handleLike = async () => {
    const next = !liked;
    setLiked(next);
    setLikeCount(c => c + (next ? 1 : -1));
    try {
      await fetch(`http://localhost:3010/feed/${feed.id}/like`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (err) {
      // optimistic rollback
      setLiked(!next);
      setLikeCount(c => c + (next ? -1 : 1));
    }
  };

  const handleBookmark = async () => {
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await fetch(`http://localhost:3010/feed/${feed.id}/bookmark`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch (err) {
      setBookmarked(!next);
    }
  };

  // tag 필드가 없을 때 fallback
  const tag = feed.tag || 'General';
  const tagColor = feed.tagColor || '#2563EB';
  const tagBg = feed.tagBg || '#EFF6FF';

  return (
    <Box
      onClick={() => onOpenDetail(feed)} // 카드 전체를 클릭 가능하게 변경
      sx={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 2,
        p: 3,
        cursor: 'pointer', // 클릭 가능하다는 표시 추가
        animation: 'fadeUp 0.4s ease both',
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 20px rgba(15,23,42,0.06)' },
      }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            src={feed.avatar || undefined}
            sx={{ width: 36, height: 36, backgroundColor: '#0F172A', fontWeight: 800, fontSize: '0.9rem' }}
          >
            {getInitial(feed.writer)}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', lineHeight: 1 }}>
                {feed.writer || 'Unknown'}
              </Typography>
            </Box>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 0.2 }}>
              {feed.role || ''}{feed.role && feed.createdAt ? ' · ' : ''}{feed.createdAt || ''}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={tag}
            size="small"
            sx={{
              backgroundColor: tagBg,
              color: tagColor,
              fontWeight: 700,
              fontSize: '0.7rem',
              height: 22,
              border: `1px solid ${tagColor}22`,
            }}
          />
          <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <MoreHoriz sx={{ fontSize: 18, color: '#94A3B8' }} />
          </IconButton>
          <Menu
            anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            PaperProps={{ sx: { boxShadow: '0 8px 30px rgba(0,0,0,0.08)', borderRadius: 2, border: '1px solid #E2E8F0', minWidth: 120 } }}
          >
            <MenuItem sx={{ fontSize: '0.8rem', color: '#64748B' }}>공유하기</MenuItem>
            <MenuItem sx={{ fontSize: '0.8rem', color: '#64748B' }}>신고하기</MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Image */}
      {imageList.length > 0 && (
        <Box
          sx={{ width: '100%', paddingTop: '56.25%', position: 'relative', borderRadius: 1.5, overflow: 'hidden', mb: 2, cursor: 'pointer' }}
          onClick={() => onOpenDetail(feed)}
        >
          <Box
            component="img"
            src={resolveImageSrc(imageList[0])}
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
          color: '#475569', fontSize: '0.85rem', lineHeight: 1.75,
          display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}
        dangerouslySetInnerHTML={{ __html: resolveImageSrc(feed.description || '') }}
      />

      {/* Code block (if present) */}
      {feed.code && <CodeBlock code={feed.code} />}

      {/* Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2.5, pt: 2, borderTop: '1px solid #F1F5F9' }}>
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            startIcon={
              liked
                ? <Favorite sx={{ fontSize: 16, color: '#EF4444' }} />
                : <FavoriteBorderOutlined sx={{ fontSize: 16 }} />
            }
            onClick={handleLike}
            sx={{
              color: liked ? '#EF4444' : '#64748B',
              fontWeight: 600, fontSize: '0.8rem', textTransform: 'none',
              px: 1.2, borderRadius: 1.5,
              '&:hover': { backgroundColor: '#FEF2F2', color: '#EF4444' },
            }}
          >
            {likeCount}
          </Button>

          <Button
            size="small"
            startIcon={<ChatBubbleOutline sx={{ fontSize: 16 }} />}
            onClick={() => onOpenDetail(feed)}
            sx={{
              color: '#64748B', fontWeight: 600, fontSize: '0.8rem', textTransform: 'none',
              px: 1.2, borderRadius: 1.5,
              '&:hover': { backgroundColor: '#EFF6FF', color: '#2563EB' },
            }}
          >
            {feed.commentCount ?? 0}
          </Button>
        </Stack>

        <IconButton size="small" onClick={handleBookmark}>
          {bookmarked
            ? <Bookmark sx={{ fontSize: 18, color: '#2563EB' }} />
            : <BookmarkBorderOutlined sx={{ fontSize: 18, color: '#94A3B8' }} />
          }
        </IconButton>
      </Box>

      {/* 댓글 more link */}
      {(feed.commentCount ?? 0) > 0 && (
        <Typography
          onClick={() => onOpenDetail(feed)}
          sx={{
            color: '#94A3B8', fontSize: '0.82rem', mt: 1, cursor: 'pointer', fontWeight: 500,
            '&:hover': { color: '#2563EB' }, transition: 'color 0.15s'
          }}
        >
          댓글 {feed.commentCount}개 모두 보기
        </Typography>
      )}
    </Box>
  );
};

// ──────────────────────────────────────────
//  Detail Dialog  (이미지 + 댓글)
// ──────────────────────────────────────────
const DetailDialog = ({ open, feed, token, onClose }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !feed) return;
    setNewComment('');
    setLoading(true);

    fetch(`http://localhost:3010/feed/${feed.id}/comments`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.success) setComments(data.comments ?? []);
        else setComments([]);
      })
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [open, feed, token]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const optimistic = { id: Date.now(), writer: '나', text: newComment };
    setComments(c => [...c, optimistic]);
    setNewComment('');

    try {
      const response = await fetch(`http://localhost:3010/feed/${feed.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setComments(c => c.map(cm => cm.id === optimistic.id ? data.comment : cm));
      }
    } catch (err) {
      // optimistic comment stays
    }
  };

  const imageList = feed?.images ? feed.images.split(',') : [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: { xs: 0, md: 2 },
          overflow: 'hidden',
          height: { xs: '100%', md: '620px' },
          maxHeight: '100%',
          m: { xs: 0, md: 4 },
          border: '1px solid #E2E8F0',
          boxShadow: '0 24px 64px rgba(15,23,42,0.15)',
        }
      }}
    >
      <Box sx={{ display: 'flex', height: '100%', flexDirection: { xs: 'column', md: 'row' } }}>

        {/* Left — image */}
        <Box sx={{
          flex: 1.4,
          backgroundColor: '#0F172A',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          minHeight: { xs: '40vh', md: '100%' },
        }}>
          {imageList.length > 0 ? (
            <Box
              component="img"
              src={resolveImageSrc(imageList[0])}
              alt={feed?.title}
              sx={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute' }}
            />
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, opacity: 0.3 }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '2rem' }}>{'<>'}</Typography>
              <Typography sx={{ color: '#fff', fontSize: '0.78rem' }}>이미지 없음</Typography>
            </Box>
          )}
          {/* Close btn (mobile) */}
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute', top: 12, left: 12,
              backgroundColor: 'rgba(15,23,42,0.6)', color: '#FFFFFF',
              '&:hover': { backgroundColor: 'rgba(15,23,42,0.8)' },
              display: { xs: 'flex', md: 'none' },
            }}
          >
            <Close />
          </IconButton>
        </Box>

        {/* Right — comments */}
        <Box sx={{
          flex: 1,
          display: 'flex', flexDirection: 'column',
          width: { md: '380px', xs: '100%' },
          backgroundColor: '#FFFFFF',
          borderLeft: { md: '1px solid #E2E8F0', xs: 'none' },
        }}>

          {/* Header */}
          <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ backgroundColor: '#0F172A', width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800 }}>
                {getInitial(feed?.writer)}
              </Avatar>
              <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>
                {feed?.writer || 'Unknown'}
              </Typography>
            </Stack>
            <IconButton onClick={onClose} sx={{ color: '#64748B', display: { xs: 'none', md: 'flex' } }}>
              <Close />
            </IconButton>
          </Box>

          {/* Original post content */}
          <Box sx={{ p: 2, display: 'flex', gap: 1.5, borderBottom: '1px solid #F1F5F9' }}>
            <Avatar sx={{ backgroundColor: '#0F172A', width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800, flexShrink: 0 }}>
              {getInitial(feed?.writer)}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '0.88rem', color: '#0F172A', lineHeight: 1.5 }}>
                <Box component="span" sx={{ fontWeight: 800, mr: 1 }}>{feed?.writer}</Box>
                {feed?.title}
              </Typography>
              <Typography
                sx={{ fontSize: '0.83rem', color: '#475569', mt: 0.5, lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: resolveImageSrc(feed?.description || '') }}
              />
            </Box>
          </Box>

          {/* Comments list */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={22} sx={{ color: '#2563EB' }} />
              </Box>
            ) : (
              <List sx={{ p: 0 }}>
                {comments.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>첫 댓글을 남겨보세요!</Typography>
                  </Box>
                )}
                {comments.map((comment) => (
                  <ListItem key={comment.id} sx={{ px: 2, py: 1.5, alignItems: 'flex-start' }}>
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar sx={{ width: 30, height: 30, backgroundColor: '#2563EB', fontSize: '0.75rem', fontWeight: 800 }}>
                        {getInitial(comment.writer)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: '0.85rem', color: '#0F172A', lineHeight: 1.5 }}>
                          <Box component="span" sx={{ fontWeight: 700, mr: 0.8 }}>{comment.writer}</Box>
                          {comment.text}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>

          {/* Comment input */}
          <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
              borderRadius: 1.5, px: 1.5, py: 0.8,
              '&:focus-within': { borderColor: '#2563EB', backgroundColor: '#fff' },
              transition: 'all 0.2s',
            }}>
              <Avatar sx={{ width: 24, height: 24, fontSize: '0.6rem', backgroundColor: '#2563EB', flexShrink: 0 }}>나</Avatar>
              <InputBase
                placeholder="댓글 달기..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                sx={{ flex: 1, fontSize: '0.85rem', color: '#0F172A' }}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                sx={{
                  color: '#2563EB', fontWeight: 800, fontSize: '0.8rem',
                  minWidth: 'auto', p: 0, textTransform: 'none',
                  '&:disabled': { color: '#94A3B8' },
                }}
              >
                게시
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
};

// ──────────────────────────────────────────
//  Sidebar
// ──────────────────────────────────────────
const Sidebar = () => {
  const [followed, setFollowed] = useState({});

  return (
    <Stack spacing={2.5}>
      {/* Trending */}
      <Box sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', mb: 2, letterSpacing: '-0.01em' }}>
          🔥 트렌딩 태그
        </Typography>
        <Stack spacing={1.5}>
          {TRENDING.map((t, i) => (
            <Box key={t.tag} sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer',
              '&:hover .tag-label': { color: '#2563EB' },
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ color: '#CBD5E1', fontWeight: 700, fontSize: '0.72rem', width: 16 }}>{i + 1}</Typography>
                <Typography className="tag-label" sx={{ fontWeight: 600, fontSize: '0.83rem', color: '#0F172A', transition: 'color 0.15s' }}>
                  {t.tag}
                </Typography>
              </Box>
              <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>{t.count}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Suggestions */}
      <Box sx={{ backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', mb: 2, letterSpacing: '-0.01em' }}>
          👥 팔로우 추천
        </Typography>
        <Stack spacing={2}>
          {SUGGESTIONS.map(s => (
            <Box key={s.handle} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Avatar src={s.avatar} sx={{ width: 32, height: 32 }} />
                <Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', lineHeight: 1.2 }}>{s.name}</Typography>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem' }}>{s.role}</Typography>
                </Box>
              </Box>
              <Button
                size="small"
                onClick={() => setFollowed(f => ({ ...f, [s.handle]: !f[s.handle] }))}
                sx={{
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'none',
                  minWidth: 0, px: 1.5, py: 0.4, borderRadius: 1,
                  ...(followed[s.handle]
                    ? { backgroundColor: '#0F172A', color: '#fff', boxShadow: 'none', '&:hover': { backgroundColor: '#2563EB' } }
                    : { border: '1px solid #E2E8F0', color: '#0F172A', backgroundColor: 'transparent', '&:hover': { borderColor: '#0F172A' } }
                  ),
                }}
              >
                {followed[s.handle] ? '팔로잉' : '팔로우'}
              </Button>
            </Box>
          ))}
        </Stack>
      </Box>

      <Typography sx={{ color: '#CBD5E1', fontSize: '0.68rem', lineHeight: 1.8, px: 0.5 }}>
        CtrlE · 이용약관 · 개인정보처리방침<br />
        © 2025 CtrlE Inc. All rights reserved.
      </Typography>
    </Stack>
  );
};

// ──────────────────────────────────────────
//  NewPostModal
// ──────────────────────────────────────────
const NewPostModal = ({ token, onClose, onSuccess }) => {
  let navigate = useNavigate();
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [selectedTag, setSelectedTag] = useState('Bug Fix');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3010/feed/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description: text, tag: selectedTag }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        onSuccess?.();
        onClose();
      } else {
        // 실패해도 일단 닫기
        onClose();
      }
    } catch (err) {
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'rgba(15,23,42,0.5)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        p: 2,
        animation: 'fadeUp 0.2s ease',
      }}
      onClick={onClose}
    >
      <Box
        sx={{
          backgroundColor: '#fff', borderRadius: 2.5,
          border: '1px solid #E2E8F0',
          boxShadow: '0 24px 64px rgba(15,23,42,0.15)',
          width: '100%', maxWidth: 560, p: 3,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="contained"
          startIcon={<Add sx={{ fontSize: 16 }} />}
          onClick={() => navigate('/register')} // 💡 페이지 이동으로 변경
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

        {/* Tag chips */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          {TAG_FILTERS.slice(1).map(t => (
            <Chip
              key={t.label}
              label={t.label}
              size="small"
              onClick={() => setSelectedTag(t.label)}
              sx={{
                fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer',
                backgroundColor: selectedTag === t.label ? '#0F172A' : '#F1F5F9',
                color: selectedTag === t.label ? '#fff' : '#64748B',
                border: 'none',
                '&:hover': { backgroundColor: selectedTag === t.label ? '#2563EB' : '#E2E8F0' },
              }}
            />
          ))}
        </Box>

        {/* Title */}
        <InputBase
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          sx={{
            fontWeight: 700, fontSize: '0.95rem', color: '#0F172A',
            backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
            borderRadius: 1.5, px: 1.5, py: 1, mb: 1.5,
            '&:focus-within': { borderColor: '#2563EB', backgroundColor: '#fff' },
            transition: 'all 0.2s',
          }}
        />

        {/* Body */}
        <InputBase
          multiline
          rows={5}
          fullWidth
          placeholder="버그 상황, 해결 방법, 인사이트를 공유하세요..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          sx={{
            fontSize: '0.88rem', color: '#0F172A', lineHeight: 1.75,
            backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0',
            borderRadius: 1.5, p: 1.5, mb: 2,
            '&:focus-within': { borderColor: '#2563EB', backgroundColor: '#fff' },
            transition: 'all 0.2s',
            alignItems: 'flex-start',
          }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: '#94A3B8', fontSize: '0.75rem' }}>
            {text.length} / 1000자
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              size="small" onClick={onClose}
              sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600, fontSize: '0.83rem' }}
            >
              취소
            </Button>
            <Button
              size="small"
              variant="contained"
              endIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <ArrowUpward sx={{ fontSize: 15 }} />}
              disabled={!text.trim() || loading}
              onClick={handleSubmit}
              sx={{
                backgroundColor: '#0F172A', color: '#fff', textTransform: 'none',
                fontWeight: 700, fontSize: '0.83rem', px: 2, boxShadow: 'none', borderRadius: 1.5,
                '&:hover': { backgroundColor: '#2563EB' },
                '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' },
              }}
            >
              게시하기
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
};

// ──────────────────────────────────────────
//  Main Feed
// ──────────────────────────────────────────
export default function Feed() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const [feeds, setFeeds] = useState([]);
  const [activeTag, setActiveTag] = useState('전체');
  const [loadingFeeds, setLoadingFeeds] = useState(true);

  // Detail dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);

  // New post modal state
  const [showNewPost, setShowNewPost] = useState(false);

  // ── loadFeeds ──────────────────────────
  const loadFeeds = useCallback(async () => {
    setLoadingFeeds(true);
    try {
      const response = await fetch('http://localhost:3010/feed/list', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFeeds(data.feeds ?? []);
      }
    } catch (err) {
      console.error('피드 로드 실패:', err);
    } finally {
      setLoadingFeeds(false);
    }
  }, [token]);

  // ── Auth + OAuth handling ──────────────
  useEffect(() => {
    const oauthToken = sessionStorage.getItem('oauthToken');

    if (oauthToken) {
      localStorage.setItem('accessToken', oauthToken);
      sessionStorage.removeItem('oauthToken');
      loadFeeds();
    } else if (!token) {
      navigate('/');
    } else {
      loadFeeds();
    }
  }, [token, navigate, loadFeeds]);

  // ── Handlers ──────────────────────────
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/');
  };
  const handleOpenDetail = (feed) => {
    navigate(`/post/${feed.id}`);
  };
  const handleCloseDetail = () => {
    setDialogOpen(false);
    setSelectedFeed(null);
  };

  const filteredFeeds = activeTag === '전체'
    ? feeds
    : feeds.filter(f => f.tag === activeTag);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

        <NavBar onNewPost={() => setShowNewPost(true)} onLogout={handleLogout} />

        {/* Tag filter bar */}
        <Box sx={{
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: 'rgba(248,250,252,0.9)',
          backdropFilter: 'blur(8px)',
          position: 'sticky', top: 57, zIndex: 90,
        }}>
          <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 4 } }}>
            <Stack direction="row" spacing={0} sx={{ overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
              {TAG_FILTERS.map(t => (
                <Button
                  key={t.label}
                  size="small"
                  startIcon={t.icon}
                  onClick={() => setActiveTag(t.label)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: activeTag === t.label ? 700 : 500,
                    fontSize: '0.82rem',
                    whiteSpace: 'nowrap',
                    px: 2, py: 1.8,
                    borderRadius: 0,
                    color: activeTag === t.label ? '#0F172A' : '#94A3B8',
                    borderBottom: activeTag === t.label ? '2px solid #2563EB' : '2px solid transparent',
                    '&:hover': { color: '#0F172A', backgroundColor: 'transparent' },
                    transition: 'all 0.15s',
                    minWidth: 'fit-content',
                  }}
                >
                  {t.label}
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>

        {/* Main layout */}
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
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.88rem' }}>
                    {activeTag === '전체' ? '아직 게시물이 없습니다.' : `'${activeTag}' 태그의 게시물이 없습니다.`}
                  </Typography>
                </Box>
              ) : (
                <Stack spacing={2}>
                  {filteredFeeds.map((feed, i) => (
                    <Box key={feed.id} sx={{ animationDelay: `${i * 0.05}s` }}>
                      <PostCard
                        feed={feed}
                        token={token}
                        onOpenDetail={handleOpenDetail}
                      />
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            {/* Sidebar */}
            <Box sx={{
              width: 280, flexShrink: 0,
              display: { xs: 'none', lg: 'block' },
              position: 'sticky', top: 120,
            }}>
              <Sidebar />
            </Box>

          </Box>
        </Box>
      </Box>

      {/* Detail dialog */}
      <DetailDialog
        open={dialogOpen}
        feed={selectedFeed}
        token={token}
        onClose={handleCloseDetail}
      />

      {/* New post modal */}
      {showNewPost && (
        <NewPostModal
          token={token}
          onClose={() => setShowNewPost(false)}
          onSuccess={loadFeeds}
        />
      )}
    </ThemeProvider>
  );
}