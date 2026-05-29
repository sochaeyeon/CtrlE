import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Avatar,
  Button,
  Chip,
  Stack,
  Typography,
  createTheme,
  ThemeProvider,
  CssBaseline,
  InputBase,
  CircularProgress,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Search,
  Close,
  TrendingUp,
  Code,
  BugReport,
  Rocket,
  Lightbulb,
  Favorite,
  ChatBubbleOutline,
  BookmarkBorderOutlined,
  Bookmark,
  PersonAdd,
  ArrowBack,
  Tag,
  People,
  Article,
  History,
  NorthEast,
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
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `,
    },
  },
});

// ──────────────────────────────────────────
//  Constants — 하드코딩 목업
// ──────────────────────────────────────────
const TAG_META = {
  'Bug Fix':      { color: '#DC2626', bg: '#FEF2F2', icon: <BugReport sx={{ fontSize: 13 }} /> },
  'React':        { color: '#2563EB', bg: '#EFF6FF', icon: <Code sx={{ fontSize: 13 }} /> },
  'TypeScript':   { color: '#7C3AED', bg: '#F5F3FF', icon: <Code sx={{ fontSize: 13 }} /> },
  'Architecture': { color: '#D97706', bg: '#FFFBEB', icon: <Rocket sx={{ fontSize: 13 }} /> },
  'Tip':          { color: '#059669', bg: '#ECFDF5', icon: <Lightbulb sx={{ fontSize: 13 }} /> },
  'DevOps':       { color: '#0891B2', bg: '#ECFEFF', icon: <TrendingUp sx={{ fontSize: 13 }} /> },
};

const CATEGORY_TAGS = [
  { label: '전체', value: 'all' },
  { label: 'Bug Fix', value: 'Bug Fix' },
  { label: 'React', value: 'React' },
  { label: 'TypeScript', value: 'TypeScript' },
  { label: 'Architecture', value: 'Architecture' },
  { label: 'Tip', value: 'Tip' },
  { label: 'DevOps', value: 'DevOps' },
];

const TRENDING_TAGS = [
  { tag: '#ReactHooks', count: '1.2k', growth: '+18%' },
  { tag: '#TypeScript5', count: '847', growth: '+12%' },
  { tag: '#NextJS15', count: '634', growth: '+9%' },
  { tag: '#PrismaORM', count: '412', growth: '+22%' },
  { tag: '#DockerCompose', count: '389', growth: '+7%' },
  { tag: '#TailwindCSS', count: '356', growth: '+15%' },
];

const MOCK_POSTS = [
  {
    id: 1, tag: 'React',
    title: 'useCallback 제대로 쓰는 법 — deps 배열 완전 정복',
    description: 'deps 배열을 잘못 관리하면 오히려 성능이 악화됩니다. 실제 사례와 함께 정리했어요.',
    writer: 'Jiyeon Park', handle: '@jiyeon.dev', avatar: 'https://i.pravatar.cc/150?img=5',
    likes: 84, commentCount: 12, bookmarked: false,
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80',
    createdAt: '2시간 전',
  },
  {
    id: 2, tag: 'TypeScript',
    title: 'Discriminated Union 패턴으로 타입 안전성 높이기',
    description: '상태 관리에서 타입 가드 대신 Discriminated Union을 활용하면 훨씬 깔끔합니다.',
    writer: 'Minjun Lee', handle: '@minjun', avatar: 'https://i.pravatar.cc/150?img=12',
    likes: 61, commentCount: 7, bookmarked: false,
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80',
    createdAt: '5시간 전',
  },
  {
    id: 3, tag: 'Bug Fix',
    title: 'Safari에서 position:sticky 안 먹는 이슈 해결',
    description: 'overflow: hidden 때문이었습니다. 2시간 삽질 끝에 찾은 원인 공유합니다.',
    writer: 'Sunho Kim', handle: '@sunho.dev', avatar: 'https://i.pravatar.cc/150?img=33',
    likes: 132, commentCount: 23, bookmarked: true,
    image: null,
    createdAt: '1일 전',
  },
  {
    id: 4, tag: 'Tip',
    title: 'VSCode 단축키 모음 — 생산성 3배로 올리는 20가지',
    description: '매일 쓰는 단축키 20개만 알아도 코딩 속도가 체감상 달라집니다.',
    writer: 'Haerin Yoon', handle: '@haerin', avatar: 'https://i.pravatar.cc/150?img=47',
    likes: 210, commentCount: 34, bookmarked: false,
    image: 'https://images.unsplash.com/photo-1607799279861-4dd421887fb3?w=600&q=80',
    createdAt: '2일 전',
  },
  {
    id: 5, tag: 'Architecture',
    title: 'Feature-Sliced Design 1달 사용 후기',
    description: '폴더 구조 때문에 고민하던 분들에게 적극 추천합니다. 장단점 솔직하게 정리했어요.',
    writer: 'Taehun Oh', handle: '@taehun', avatar: 'https://i.pravatar.cc/150?img=15',
    likes: 98, commentCount: 15, bookmarked: false,
    image: 'https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=600&q=80',
    createdAt: '3일 전',
  },
  {
    id: 6, tag: 'DevOps',
    title: 'Docker Compose로 로컬 개발 환경 완전 정복',
    description: '팀원 온보딩 시간 90% 단축한 Compose 구성을 공유합니다.',
    writer: 'Seungho Lim', handle: '@seungho', avatar: 'https://i.pravatar.cc/150?img=52',
    likes: 74, commentCount: 9, bookmarked: false,
    image: null,
    createdAt: '4일 전',
  },
  {
    id: 7, tag: 'React',
    title: 'Zustand vs Jotai — 2024 상태관리 라이브러리 비교',
    description: '프로젝트 규모별로 어떤 걸 선택해야 할지 실제 코드와 함께 비교했습니다.',
    writer: 'Minji Kwon', handle: '@minji.fe', avatar: 'https://i.pravatar.cc/150?img=25',
    likes: 156, commentCount: 28, bookmarked: true,
    image: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=600&q=80',
    createdAt: '5일 전',
  },
  {
    id: 8, tag: 'TypeScript',
    title: 'satisfies 연산자 — TypeScript 4.9 숨겨진 보석',
    description: 'as const의 대안으로 훨씬 유연하게 타입을 좁힐 수 있습니다.',
    writer: 'Jiyeon Park', handle: '@jiyeon.dev', avatar: 'https://i.pravatar.cc/150?img=5',
    likes: 89, commentCount: 11, bookmarked: false,
    image: null,
    createdAt: '1주 전',
  },
];

const MOCK_USERS = [
  { id: 1, name: 'Jiyeon Park', handle: '@jiyeon.dev', avatar: 'https://i.pravatar.cc/150?img=5', role: 'React · TypeScript', followers: 342, following: false },
  { id: 2, name: 'Minjun Lee', handle: '@minjun', avatar: 'https://i.pravatar.cc/150?img=12', role: 'Node.js · Golang', followers: 218, following: false },
  { id: 3, name: 'Haerin Yoon', handle: '@haerin', avatar: 'https://i.pravatar.cc/150?img=47', role: 'UI/UX · Figma', followers: 504, following: true },
  { id: 4, name: 'Taehun Oh', handle: '@taehun', avatar: 'https://i.pravatar.cc/150?img=15', role: 'Rust · Backend', followers: 189, following: false },
  { id: 5, name: 'Minji Kwon', handle: '@minji.fe', avatar: 'https://i.pravatar.cc/150?img=25', role: 'Vue · Frontend', followers: 276, following: false },
];

const RECENT_SEARCHES = ['useCallback', 'Docker Compose', 'TypeScript satisfies', 'Zustand'];

const getInitial = (name) => name?.charAt(0).toUpperCase() ?? '?';
const tagMeta = (tag) => TAG_META[tag] ?? { color: '#64748B', bg: '#F1F5F9', icon: null };

// ──────────────────────────────────────────
//  SearchBar
// ──────────────────────────────────────────
const SearchBar = ({ value, onChange, onClear, onFocus, onBlur, inputRef }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 1,
    backgroundColor: '#fff',
    border: '1.5px solid #E2E8F0',
    borderRadius: 2,
    px: 2, py: 1.2,
    transition: 'all 0.2s',
    '&:focus-within': {
      borderColor: '#2563EB',
      boxShadow: '0 0 0 3px rgba(37,99,235,0.08)',
    },
  }}>
    <Search sx={{ color: '#94A3B8', fontSize: 20, flexShrink: 0 }} />
    <InputBase
      inputRef={inputRef}
      placeholder="게시물, 개발자, 태그 검색..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      fullWidth
      sx={{
        fontSize: '0.92rem', color: '#0F172A', fontWeight: 500,
        '& input::placeholder': { color: '#94A3B8' },
      }}
    />
    {value && (
      <IconButton size="small" onClick={onClear} sx={{ color: '#94A3B8', p: 0.3 }}>
        <Close sx={{ fontSize: 16 }} />
      </IconButton>
    )}
  </Box>
);

// ──────────────────────────────────────────
//  SearchDropdown  (포커스 시 표시)
// ──────────────────────────────────────────
const SearchDropdown = ({ query, onSelect }) => (
  <Box sx={{
    position: 'absolute', top: '100%', left: 0, right: 0,
    mt: 1,
    backgroundColor: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: 2,
    boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
    zIndex: 200,
    overflow: 'hidden',
    animation: 'slideDown 0.18s ease both',
  }}>
    {!query ? (
      <>
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            최근 검색
          </Typography>
        </Box>
        {RECENT_SEARCHES.map((s) => (
          <Box
            key={s}
            onMouseDown={() => onSelect(s)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 2, py: 1.2, cursor: 'pointer',
              '&:hover': { backgroundColor: '#F8FAFC' },
              transition: 'background 0.12s',
            }}
          >
            <History sx={{ fontSize: 15, color: '#CBD5E1' }} />
            <Typography sx={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500 }}>{s}</Typography>
          </Box>
        ))}
        <Divider sx={{ borderColor: '#F1F5F9', mx: 2 }} />
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
            인기 태그
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.8}>
            {Object.keys(TAG_META).map(t => {
              const m = TAG_META[t];
              return (
                <Chip
                  key={t}
                  label={`#${t}`}
                  size="small"
                  onMouseDown={() => onSelect(t)}
                  sx={{
                    backgroundColor: m.bg, color: m.color,
                    fontWeight: 700, fontSize: '0.7rem', cursor: 'pointer',
                    border: `1px solid ${m.color}22`,
                    '&:hover': { opacity: 0.8 },
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </>
    ) : (
      <>
        {/* 게시물 결과 */}
        <Box sx={{ px: 2, pt: 2, pb: 0.5 }}>
          <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            게시물
          </Typography>
        </Box>
        {MOCK_POSTS.filter(p =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.tag.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 3).map(p => {
          const m = tagMeta(p.tag);
          return (
            <Box
              key={p.id}
              onMouseDown={() => onSelect(p.title)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                px: 2, py: 1.3, cursor: 'pointer',
                '&:hover': { backgroundColor: '#F8FAFC' },
              }}
            >
              <Box sx={{ width: 32, height: 32, borderRadius: 1, backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: m.color }}>
                {m.icon}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.title}
                </Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>{p.writer}</Typography>
              </Box>
              <NorthEast sx={{ fontSize: 14, color: '#CBD5E1' }} />
            </Box>
          );
        })}

        {/* 개발자 결과 */}
        {MOCK_USERS.filter(u => u.name.toLowerCase().includes(query.toLowerCase()) || u.handle.toLowerCase().includes(query.toLowerCase())).slice(0, 2).map(u => (
          <Box
            key={u.id}
            onMouseDown={() => onSelect(u.name)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.5,
              px: 2, py: 1.2, cursor: 'pointer',
              '&:hover': { backgroundColor: '#F8FAFC' },
            }}
          >
            <Avatar src={u.avatar} sx={{ width: 32, height: 32, fontSize: '0.75rem', fontWeight: 800 }}>
              {getInitial(u.name)}
            </Avatar>
            <Box>
              <Typography sx={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 600 }}>{u.name}</Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>{u.handle}</Typography>
            </Box>
          </Box>
        ))}
      </>
    )}
  </Box>
);

// ──────────────────────────────────────────
//  ResultTab 버튼
// ──────────────────────────────────────────
const ResultTabBtn = ({ icon, label, active, onClick, count }) => (
  <Button
    startIcon={icon}
    onClick={onClick}
    sx={{
      textTransform: 'none',
      fontWeight: active ? 800 : 500,
      fontSize: '0.82rem',
      color: active ? '#0F172A' : '#94A3B8',
      borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
      borderRadius: 0,
      px: 2, py: 1.5,
      gap: 0.5,
      '&:hover': { color: '#0F172A', backgroundColor: 'transparent' },
      transition: 'all 0.15s',
    }}
  >
    {label}
    {count != null && (
      <Box component="span" sx={{
        ml: 0.5, px: 0.8, py: 0.1,
        backgroundColor: active ? '#0F172A' : '#E2E8F0',
        color: active ? '#fff' : '#64748B',
        borderRadius: 10, fontSize: '0.65rem', fontWeight: 800, lineHeight: 1.6,
      }}>
        {count}
      </Box>
    )}
  </Button>
);

// ──────────────────────────────────────────
//  PostCard (compact)
// ──────────────────────────────────────────
const PostCard = ({ post, idx }) => {
  const [bookmarked, setBookmarked] = useState(post.bookmarked);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const m = tagMeta(post.tag);

  return (
    <Box sx={{
      backgroundColor: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 2,
      overflow: 'hidden',
      animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
      transition: 'all 0.2s',
      '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 20px rgba(15,23,42,0.07)', transform: 'translateY(-1px)' },
    }}>
      {post.image && (
        <Box
          component="img"
          src={post.image}
          alt={post.title}
          sx={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
        />
      )}
      <Box sx={{ p: 2.5 }}>
        {/* Author */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Avatar src={post.avatar} sx={{ width: 26, height: 26, fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#0F172A' }}>
            {getInitial(post.writer)}
          </Avatar>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>{post.writer}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#CBD5E1' }}>·</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>{post.createdAt}</Typography>
          <Box sx={{ flex: 1 }} />
          <Chip
            label={post.tag}
            size="small"
            sx={{
              backgroundColor: m.bg, color: m.color,
              fontWeight: 700, fontSize: '0.65rem', height: 18,
              border: `1px solid ${m.color}22`,
            }}
          />
        </Box>

        {/* Title */}
        <Typography sx={{
          fontWeight: 700, fontSize: '0.95rem', color: '#0F172A',
          mb: 0.8, lineHeight: 1.45, letterSpacing: '-0.01em',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.title}
        </Typography>

        {/* Description */}
        <Typography sx={{
          fontSize: '0.82rem', color: '#64748B', lineHeight: 1.7, mb: 2,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.description}
        </Typography>

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={0.5}>
            <Button
              size="small"
              startIcon={liked ? <Favorite sx={{ fontSize: 14, color: '#EF4444' }} /> : <Favorite sx={{ fontSize: 14 }} />}
              onClick={() => { setLiked(l => !l); setLikeCount(c => c + (liked ? -1 : 1)); }}
              sx={{
                color: liked ? '#EF4444' : '#94A3B8', fontSize: '0.78rem', fontWeight: 600,
                textTransform: 'none', px: 1, borderRadius: 1.5, minWidth: 0,
                '&:hover': { backgroundColor: '#FEF2F2', color: '#EF4444' },
              }}
            >
              {likeCount}
            </Button>
            <Button
              size="small"
              startIcon={<ChatBubbleOutline sx={{ fontSize: 14 }} />}
              sx={{
                color: '#94A3B8', fontSize: '0.78rem', fontWeight: 600,
                textTransform: 'none', px: 1, borderRadius: 1.5, minWidth: 0,
                '&:hover': { backgroundColor: '#EFF6FF', color: '#2563EB' },
              }}
            >
              {post.commentCount}
            </Button>
          </Stack>
          <IconButton size="small" onClick={() => setBookmarked(b => !b)}>
            {bookmarked
              ? <Bookmark sx={{ fontSize: 16, color: '#2563EB' }} />
              : <BookmarkBorderOutlined sx={{ fontSize: 16, color: '#CBD5E1' }} />
            }
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

// ──────────────────────────────────────────
//  UserCard
// ──────────────────────────────────────────
const UserCard = ({ user, idx }) => {
  const [following, setFollowing] = useState(user.following);

  return (
    <Box sx={{
      backgroundColor: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 2,
      p: 2.5,
      display: 'flex', alignItems: 'center', gap: 2,
      animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
      transition: 'all 0.2s',
      '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' },
    }}>
      <Avatar
        src={user.avatar}
        sx={{ width: 48, height: 48, fontSize: '1rem', fontWeight: 800, backgroundColor: '#0F172A' }}
      >
        {getInitial(user.name)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.2 }}>
          {user.name}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mb: 0.3 }}>{user.handle}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>{user.role}</Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', mb: 0.8 }}>
          팔로워 {user.followers.toLocaleString()}
        </Typography>
        <Button
          size="small"
          startIcon={following ? null : <PersonAdd sx={{ fontSize: 13 }} />}
          onClick={() => setFollowing(f => !f)}
          sx={{
            fontSize: '0.75rem', fontWeight: 700, textTransform: 'none',
            px: 1.8, py: 0.5, borderRadius: 1.2, minWidth: 0,
            boxShadow: 'none',
            ...(following
              ? { border: '1px solid #E2E8F0', color: '#64748B', backgroundColor: 'transparent', '&:hover': { borderColor: '#EF4444', color: '#EF4444', backgroundColor: '#FEF2F2' } }
              : { backgroundColor: '#0F172A', color: '#fff', '&:hover': { backgroundColor: '#2563EB' } }
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

// ──────────────────────────────────────────
//  TagCard
// ──────────────────────────────────────────
const TagCard = ({ tag, idx }) => {
  const m = TAG_META[tag.label] ?? { color: '#64748B', bg: '#F1F5F9', icon: null };
  return (
    <Box sx={{
      backgroundColor: '#fff',
      border: '1px solid #E2E8F0',
      borderRadius: 2,
      p: 2.5,
      display: 'flex', alignItems: 'center', gap: 2,
      cursor: 'pointer',
      animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
      transition: 'all 0.2s',
      '&:hover': { borderColor: m.color, boxShadow: `0 4px 16px ${m.color}14`, transform: 'translateY(-1px)' },
    }}>
      <Box sx={{
        width: 44, height: 44, borderRadius: 1.5,
        backgroundColor: m.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        color: m.color,
        border: `1px solid ${m.color}22`,
      }}>
        <Box sx={{ transform: 'scale(1.6)' }}>{m.icon}</Box>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>#{tag.label}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.2 }}>{tag.count} 게시물</Typography>
      </Box>
      <Box sx={{
        px: 1.2, py: 0.4,
        backgroundColor: '#ECFDF5', borderRadius: 10,
        color: '#059669', fontSize: '0.7rem', fontWeight: 700,
      }}>
        {tag.growth}
      </Box>
    </Box>
  );
};

// ──────────────────────────────────────────
//  DefaultView — 검색 전 화면
// ──────────────────────────────────────────
const DefaultView = ({ onTagClick }) => (
  <Box sx={{ animation: 'fadeUp 0.3s ease both' }}>
    {/* 트렌딩 태그 섹션 */}
    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', mb: 2, letterSpacing: '-0.01em' }}>
      🔥 지금 뜨는 태그
    </Typography>
    <Stack spacing={1.5} sx={{ mb: 4 }}>
      {TRENDING_TAGS.map((t, i) => (
        <Box
          key={t.tag}
          onClick={() => onTagClick(t.tag.replace('#', ''))}
          sx={{
            display: 'flex', alignItems: 'center',
            backgroundColor: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 2,
            px: 2, py: 1.6,
            cursor: 'pointer',
            animation: `fadeUp 0.35s ease ${i * 0.05}s both`,
            transition: 'all 0.18s',
            '&:hover': { borderColor: '#2563EB', boxShadow: '0 4px 16px rgba(37,99,235,0.08)', transform: 'translateX(3px)' },
          }}
        >
          <Typography sx={{ color: '#CBD5E1', fontWeight: 800, fontSize: '0.78rem', width: 20, mr: 1.5 }}>
            {i + 1}
          </Typography>
          <Tag sx={{ fontSize: 16, color: '#94A3B8', mr: 1 }} />
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', flex: 1 }}>
            {t.tag}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mr: 2 }}>{t.count} 게시물</Typography>
          <Box sx={{
            px: 1, py: 0.3,
            backgroundColor: '#ECFDF5', borderRadius: 10,
            color: '#059669', fontSize: '0.68rem', fontWeight: 800,
          }}>
            {t.growth}
          </Box>
        </Box>
      ))}
    </Stack>

    {/* 추천 개발자 */}
    <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', mb: 2, letterSpacing: '-0.01em' }}>
      👥 팔로우 추천
    </Typography>
    <Stack spacing={1.5}>
      {MOCK_USERS.slice(0, 4).map((u, i) => (
        <UserCard key={u.id} user={u} idx={i} />
      ))}
    </Stack>
  </Box>
);

// ──────────────────────────────────────────
//  Main Explore
// ──────────────────────────────────────────
export default function Explore() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const [query, setQuery] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('posts'); // posts | users | tags
  const [activeTagFilter, setActiveTagFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // 검색 실행
  const handleSearch = (val) => {
    const v = val ?? inputValue;
    if (!v.trim()) return;
    setQuery(v);
    setInputValue(v);
    setFocused(false);
    setActiveResultTab('posts');
    setActiveTagFilter('all');
  };

  const handleClear = () => {
    setInputValue('');
    setQuery('');
    setActiveTagFilter('all');
    inputRef.current?.focus();
  };

  // 필터링
  const filteredPosts = MOCK_POSTS.filter(p => {
    const matchQuery = !query ||
      p.title.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.tag.toLowerCase().includes(query.toLowerCase()) ||
      p.writer.toLowerCase().includes(query.toLowerCase());
    const matchTag = activeTagFilter === 'all' || p.tag === activeTagFilter;
    return matchQuery && matchTag;
  });

  const filteredUsers = MOCK_USERS.filter(u =>
    !query ||
    u.name.toLowerCase().includes(query.toLowerCase()) ||
    u.handle.toLowerCase().includes(query.toLowerCase()) ||
    u.role.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTags = TRENDING_TAGS.filter(t =>
    !query || t.tag.toLowerCase().includes(query.toLowerCase())
  ).map(t => ({
    label: t.tag.replace('#', ''),
    count: t.count,
    growth: t.growth,
  }));

  const showDropdown = focused && !query || focused && query.length > 0;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

        {/* ── Top bar ── */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: 'rgba(248,250,252,0.9)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E2E8F0',
        }}>
          <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => navigate('/feed')} sx={{ color: '#64748B', flexShrink: 0 }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            {/* 로고 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1, flexShrink: 0 }}>
              <Box sx={{
                width: 26, height: 26, borderRadius: 1,
                backgroundColor: '#0F172A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.68rem' }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: '#0F172A' }}>탐색</Typography>
            </Box>

            {/* Search bar */}
            <Box sx={{ flex: 1, position: 'relative' }}>
              <SearchBar
                value={inputValue}
                onChange={setInputValue}
                onClear={handleClear}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                inputRef={inputRef}
              />
              {/* Enter 키 처리 */}
              <Box
                component="input"
                sx={{ display: 'none' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              />
              {showDropdown && (
                <SearchDropdown query={inputValue} onSelect={handleSearch} />
              )}
            </Box>

            <Button
              variant="contained"
              onClick={() => handleSearch()}
              sx={{
                backgroundColor: '#0F172A', color: '#fff',
                textTransform: 'none', fontWeight: 700, fontSize: '0.82rem',
                px: 2.2, py: 1, borderRadius: 1.5, boxShadow: 'none', flexShrink: 0,
                '&:hover': { backgroundColor: '#2563EB' },
                transition: 'background 0.18s',
              }}
            >
              검색
            </Button>
          </Box>
        </Box>

        {/* ── Body ── */}
        <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

          {!query ? (
            // ── 기본 화면 ──
            <DefaultView onTagClick={(tag) => { setInputValue(tag); handleSearch(tag); }} />
          ) : (
            // ── 검색 결과 화면 ──
            <Box sx={{ animation: 'fadeIn 0.25s ease both' }}>

              {/* 결과 헤더 */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
                  <Box component="span" sx={{ color: '#2563EB' }}>"{query}"</Box> 검색 결과
                </Typography>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mt: 0.3 }}>
                  게시물 {filteredPosts.length}개 · 개발자 {filteredUsers.length}명 · 태그 {filteredTags.length}개
                </Typography>
              </Box>

              {/* 결과 탭 */}
              <Box sx={{
                backgroundColor: '#fff',
                border: '1px solid #E2E8F0',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2.5,
              }}>
                <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0', px: 1 }}>
                  <ResultTabBtn
                    icon={<Article sx={{ fontSize: 15 }} />}
                    label="게시물"
                    active={activeResultTab === 'posts'}
                    onClick={() => setActiveResultTab('posts')}
                    count={filteredPosts.length}
                  />
                  <ResultTabBtn
                    icon={<People sx={{ fontSize: 15 }} />}
                    label="개발자"
                    active={activeResultTab === 'users'}
                    onClick={() => setActiveResultTab('users')}
                    count={filteredUsers.length}
                  />
                  <ResultTabBtn
                    icon={<Tag sx={{ fontSize: 15 }} />}
                    label="태그"
                    active={activeResultTab === 'tags'}
                    onClick={() => setActiveResultTab('tags')}
                    count={filteredTags.length}
                  />
                </Box>

                {/* 태그 필터 (posts 탭일 때만) */}
                {activeResultTab === 'posts' && (
                  <Box sx={{
                    display: 'flex', gap: 0.8, px: 2, py: 1.5,
                    overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' },
                    borderBottom: '1px solid #F1F5F9',
                  }}>
                    {CATEGORY_TAGS.map(ct => {
                      const m = ct.value !== 'all' ? TAG_META[ct.value] : null;
                      const active = activeTagFilter === ct.value;
                      return (
                        <Chip
                          key={ct.value}
                          label={ct.label}
                          size="small"
                          onClick={() => setActiveTagFilter(ct.value)}
                          sx={{
                            fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0,
                            backgroundColor: active
                              ? (m ? m.bg : '#0F172A')
                              : '#F8FAFC',
                            color: active
                              ? (m ? m.color : '#fff')
                              : '#94A3B8',
                            border: active
                              ? `1px solid ${m ? m.color + '44' : 'transparent'}`
                              : '1px solid #E2E8F0',
                            '&:hover': { opacity: 0.85 },
                            transition: 'all 0.15s',
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* 결과 리스트 */}
              {activeResultTab === 'posts' && (
                filteredPosts.length === 0 ? (
                  <EmptyState label="게시물" query={query} />
                ) : (
                  <Stack spacing={2}>
                    {filteredPosts.map((p, i) => <PostCard key={p.id} post={p} idx={i} />)}
                  </Stack>
                )
              )}

              {activeResultTab === 'users' && (
                filteredUsers.length === 0 ? (
                  <EmptyState label="개발자" query={query} />
                ) : (
                  <Stack spacing={1.5}>
                    {filteredUsers.map((u, i) => <UserCard key={u.id} user={u} idx={i} />)}
                  </Stack>
                )
              )}

              {activeResultTab === 'tags' && (
                filteredTags.length === 0 ? (
                  <EmptyState label="태그" query={query} />
                ) : (
                  <Stack spacing={1.5}>
                    {filteredTags.map((t, i) => <TagCard key={t.label} tag={t} idx={i} />)}
                  </Stack>
                )
              )}
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

// ──────────────────────────────────────────
//  EmptyState
// ──────────────────────────────────────────
const EmptyState = ({ label, query }) => (
  <Box sx={{ textAlign: 'center', py: 8, animation: 'fadeUp 0.3s ease both' }}>
    <Typography sx={{ fontSize: '2rem', mb: 1 }}>🔍</Typography>
    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', mb: 0.5 }}>
      "{query}"에 해당하는 {label}이 없습니다
    </Typography>
    <Typography sx={{ fontSize: '0.82rem', color: '#94A3B8' }}>
      다른 키워드로 검색해보세요
    </Typography>
  </Box>
);