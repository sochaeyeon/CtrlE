import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Button, Chip, Stack, Typography,
  createTheme, ThemeProvider, CssBaseline, InputBase,
  CircularProgress, IconButton, Divider, Skeleton,
} from '@mui/material';
import {
  Search, Close, TrendingUp, Code, BugReport, Rocket, Lightbulb,
  Favorite, FavoriteBorder, ChatBubbleOutline, BookmarkBorderOutlined,
  Bookmark, PersonAdd, PersonRemove, ArrowBack, Tag, People, Article,
  History, NorthEast, LocalFireDepartment, GroupAdd, AutoAwesome,
  WorkspacePremium, EmojiEvents,
} from '@mui/icons-material';

const API = 'http://localhost:3010';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text: { primary: '#0F172A', secondary: '#64748B' },
  },
  typography: { fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif' },
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
    MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 700 } } },
  },
});

// 태그 → 색상 매핑 (동적으로 할당)
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

const timeAgo = (dateStr) => {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return `${Math.floor(day / 7)}주 전`;
};

// ──────────────────────────────────────────
//  SearchBar
// ──────────────────────────────────────────
const SearchBar = ({ value, onChange, onClear, onFocus, onBlur, inputRef, onEnter }) => (
  <Box sx={{
    display: 'flex', alignItems: 'center', gap: 1,
    backgroundColor: '#fff', border: '1.5px solid #E2E8F0',
    borderRadius: 2, px: 2, py: 1.2, transition: 'all 0.2s',
    '&:focus-within': { borderColor: '#2563EB', boxShadow: '0 0 0 3px rgba(37,99,235,0.08)' },
  }}>
    <Search sx={{ color: '#94A3B8', fontSize: 20, flexShrink: 0 }} />
    <InputBase
      inputRef={inputRef}
      placeholder="게시물, 개발자, 태그 검색..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={(e) => { if (e.key === 'Enter') onEnter(); }}
      fullWidth
      sx={{ fontSize: '0.92rem', color: '#0F172A', fontWeight: 500, '& input::placeholder': { color: '#94A3B8' } }}
    />
    {value && (
      <IconButton size="small" onClick={onClear} sx={{ color: '#94A3B8', p: 0.3 }}>
        <Close sx={{ fontSize: 16 }} />
      </IconButton>
    )}
  </Box>
);

// ──────────────────────────────────────────
//  SearchDropdown  (실시간 유저 검색 포함)
// ──────────────────────────────────────────
const SearchDropdown = ({ query, recentSearches, trendingTags, onSelect, onClearRecent, onDeleteRecent, token }) => {
  const [liveUsers, setLiveUsers] = useState([]);
  const [liveTags, setLiveTags] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length < 1) {
      setLiveUsers([]);
      setLiveTags([]);
      return;
    }
    // 디바운스 150ms
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API}/explore/search?q=${encodeURIComponent(query)}&type=all&limit=5`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) {
          setLiveUsers(data.users?.slice(0, 4) || []);
          setLiveTags(data.tags?.slice(0, 4) || []);
        }
      } catch { /* ignore */ }
    }, 150);
    return () => clearTimeout(timerRef.current);
  }, [query, token]);

  return (
    <Box sx={{
      position: 'absolute', top: '100%', left: 0, right: 0, mt: 1,
      backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2,
      boxShadow: '0 16px 40px rgba(15,23,42,0.12)', zIndex: 200,
      overflow: 'hidden', animation: 'slideDown 0.18s ease both',
    }}>
      {!query ? (
        /* ── 입력 전: 최근 검색 + 인기 태그 ── */
        <>
          {recentSearches.length > 0 && (
            <>
              <Box sx={{ px: 2, pt: 2, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  최근 검색
                </Typography>
                <Typography onClick={onClearRecent} sx={{ fontSize: '0.7rem', color: '#CBD5E1', cursor: 'pointer', '&:hover': { color: '#94A3B8' } }}>
                  전체삭제
                </Typography>
              </Box>
              {recentSearches.map((s) => (
                <Box key={s} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1.2,
                  '&:hover': { backgroundColor: '#F8FAFC' },
                  '&:hover .delete-btn': { opacity: 1 },
                  transition: 'background 0.12s',
                }}>
                  <History sx={{ fontSize: 15, color: '#CBD5E1', flexShrink: 0 }} />
                  <Typography
                    onMouseDown={() => onSelect(s)}
                    sx={{ fontSize: '0.88rem', color: '#475569', fontWeight: 500, flex: 1, cursor: 'pointer' }}
                  >
                    {s}
                  </Typography>
                  <IconButton
                    className="delete-btn"
                    size="small"
                    onMouseDown={(e) => { e.stopPropagation(); onDeleteRecent(s); }}
                    sx={{ opacity: 0, transition: 'opacity 0.15s', p: 0.3, color: '#CBD5E1', '&:hover': { color: '#94A3B8', backgroundColor: 'transparent' } }}
                  >
                    <Close sx={{ fontSize: 13 }} />
                  </IconButton>
                </Box>
              ))}
              <Divider sx={{ borderColor: '#F1F5F9', mx: 2 }} />
            </>
          )}
          {trendingTags.length > 0 && (
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}>
                인기 태그
              </Typography>
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
        /* ── 입력 중: 실시간 유저 + 태그 + "검색하기" ── */
        <Box sx={{ py: 0.5 }}>
          {/* 유저 결과 */}
          {liveUsers.length > 0 && (
            <>
              <Typography sx={{ px: 2, pt: 1.5, pb: 0.5, fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                개발자
              </Typography>
              {liveUsers.map(u => (
                <Box key={u.USER_ID} onMouseDown={() => onSelect(u.NICKNAME)} sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5,
                  px: 2, py: 1, cursor: 'pointer',
                  '&:hover': { backgroundColor: '#F8FAFC' }, transition: 'background 0.1s',
                }}>
                  <Avatar src={u.AVATAR} sx={{ width: 28, height: 28, fontSize: '0.7rem', fontWeight: 800, backgroundColor: '#0F172A' }}>
                    {getInitial(u.NICKNAME)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700, lineHeight: 1.2 }}>
                      {u.NICKNAME}
                    </Typography>
                    {u.BIO && (
                      <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {u.BIO}
                      </Typography>
                    )}
                  </Box>
                  <NorthEast sx={{ fontSize: 13, color: '#CBD5E1', flexShrink: 0 }} />
                </Box>
              ))}
            </>
          )}

          {/* 태그 결과 */}
          {liveTags.length > 0 && (
            <>
              {liveUsers.length > 0 && <Divider sx={{ borderColor: '#F1F5F9', mx: 2, my: 0.5 }} />}
              <Typography sx={{ px: 2, pt: 1, pb: 0.5, fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                태그
              </Typography>
              {liveTags.map(t => {
                const m = getTagColor(t.TAG_NAME);
                return (
                  <Box key={t.TAG_NAME} onMouseDown={() => onSelect(t.TAG_NAME)} sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5,
                    px: 2, py: 0.9, cursor: 'pointer',
                    '&:hover': { backgroundColor: '#F8FAFC' }, transition: 'background 0.1s',
                  }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: 1, backgroundColor: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: m.color }}>
                      <Tag sx={{ fontSize: 14 }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.85rem', color: '#0F172A', fontWeight: 700, flex: 1 }}>
                      #{t.TAG_NAME}
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                      {formatCount(t.POST_COUNT)}개
                    </Typography>
                  </Box>
                );
              })}
            </>
          )}

          {/* 검색하기 */}
          {(liveUsers.length > 0 || liveTags.length > 0) && <Divider sx={{ borderColor: '#F1F5F9', mx: 2, my: 0.5 }} />}
          <Box onMouseDown={() => onSelect(query)} sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 2, py: 1.2, cursor: 'pointer',
            '&:hover': { backgroundColor: '#F8FAFC' },
          }}>
            <Search sx={{ fontSize: 16, color: '#94A3B8' }} />
            <Typography sx={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 600 }}>
              "{query}" 전체 검색하기
            </Typography>
            <NorthEast sx={{ fontSize: 14, color: '#CBD5E1', ml: 'auto' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

// ──────────────────────────────────────────
//  ResultTab
// ──────────────────────────────────────────
const ResultTabBtn = ({ icon, label, active, onClick, count }) => (
  <Button
    startIcon={icon}
    onClick={onClick}
    sx={{
      fontWeight: active ? 800 : 500, fontSize: '0.82rem',
      color: active ? '#0F172A' : '#94A3B8',
      borderBottom: active ? '2px solid #2563EB' : '2px solid transparent',
      borderRadius: 0, px: 2, py: 1.5,
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
//  PostCard
// ──────────────────────────────────────────
const PostCard = ({ post, idx, token }) => {
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(post.bookmarked);
  const [liked, setLiked] = useState(post.liked);
  const [likeCount, setLikeCount] = useState(Number(post.likes) || 0);
  const m = getTagColor(post.tags?.[0] || '');

  const toggleLike = async (e) => {
    e.stopPropagation();
    setLiked(l => !l);
    setLikeCount(c => c + (liked ? -1 : 1));
    await fetch(`${API}/feed/${post.id}/like`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
  };

  const toggleBookmark = async (e) => {
    e.stopPropagation();
    setBookmarked(b => !b);
    await fetch(`${API}/feed/${post.id}/bookmark`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
  };

  return (
    <Box
      onClick={() => navigate(`/post/${post.id}`)}
      sx={{
        backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2,
        overflow: 'hidden', cursor: 'pointer',
        animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
        transition: 'all 0.2s',
        '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 20px rgba(15,23,42,0.07)', transform: 'translateY(-1px)' },
      }}
    >
      {post.firstImage && (
        <Box component="img" src={post.firstImage} alt={post.title}
          sx={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
        />
      )}
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Avatar src={post.avatar} sx={{ width: 26, height: 26, fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#0F172A' }}>
            {getInitial(post.writer)}
          </Avatar>
          <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>{post.writer}</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#CBD5E1' }}>·</Typography>
          <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8' }}>{timeAgo(post.createdAt)}</Typography>
          <Box sx={{ flex: 1 }} />
          {post.tags?.[0] && (
            <Chip label={post.tags[0]} size="small" sx={{
              backgroundColor: m.bg, color: m.color,
              fontWeight: 700, fontSize: '0.65rem', height: 18,
              border: `1px solid ${m.color}22`,
            }} />
          )}
        </Box>
        <Typography sx={{
          fontWeight: 700, fontSize: '0.95rem', color: '#0F172A',
          mb: 0.8, lineHeight: 1.45, letterSpacing: '-0.01em',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.title}
        </Typography>
        <Typography sx={{
          fontSize: '0.82rem', color: '#64748B', lineHeight: 1.7, mb: 2,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.description}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={0.5}>
            <Button size="small" onClick={toggleLike}
              startIcon={liked
                ? <Favorite sx={{ fontSize: 14, color: '#EF4444' }} />
                : <FavoriteBorder sx={{ fontSize: 14 }} />
              }
              sx={{
                color: liked ? '#EF4444' : '#94A3B8', fontSize: '0.78rem', fontWeight: 600,
                px: 1, borderRadius: 1.5, minWidth: 0,
                '&:hover': { backgroundColor: '#FEF2F2', color: '#EF4444' },
              }}
            >
              {likeCount}
            </Button>
            <Button size="small"
              startIcon={<ChatBubbleOutline sx={{ fontSize: 14 }} />}
              sx={{ color: '#94A3B8', fontSize: '0.78rem', fontWeight: 600, px: 1, borderRadius: 1.5, minWidth: 0, '&:hover': { backgroundColor: '#EFF6FF', color: '#2563EB' } }}
            >
              {post.commentCount}
            </Button>
          </Stack>
          <IconButton size="small" onClick={toggleBookmark}>
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
const UserCard = ({ user, idx, token }) => {
  const [following, setFollowing] = useState(user.IS_FOLLOWING);
  const [followerCount, setFollowerCount] = useState(Number(user.FOLLOWER_COUNT) || 0);
  const [loading, setLoading] = useState(false);

  const toggleFollow = async () => {
    // 낙관적 업데이트: API 응답 기다리지 않고 즉시 UI 반영
    const willFollow = !following;
    setFollowing(willFollow);
    setFollowerCount(c => c + (willFollow ? 1 : -1));
    setLoading(true);
    try {
      const res = await fetch(`${API}/explore/follow/${user.USER_ID}`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      // 서버 응답이 다르면 롤백
      if (!data.success || data.following !== willFollow) {
        setFollowing(!willFollow);
        setFollowerCount(c => c + (willFollow ? -1 : 1));
      }
    } catch {
      // 실패 시 롤백
      setFollowing(!willFollow);
      setFollowerCount(c => c + (willFollow ? -1 : 1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2,
      p: 2.5, display: 'flex', alignItems: 'center', gap: 2,
      animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
      transition: 'all 0.2s',
      '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' },
    }}>
      <Avatar src={user.AVATAR} sx={{ width: 48, height: 48, fontSize: '1rem', fontWeight: 800, backgroundColor: '#0F172A' }}>
        {getInitial(user.NICKNAME)}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.2 }}>
          {user.NICKNAME}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, mt: 0.3 }}>
          {user.BIO || '소개가 없습니다.'}
        </Typography>
      </Box>
      <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', mb: 0.8 }}>
          팔로워 {followerCount.toLocaleString()}
        </Typography>
        <Button
          size="small"
          disabled={loading}
          startIcon={loading
            ? <CircularProgress size={11} />
            : following
              ? <PersonRemove sx={{ fontSize: 13 }} />
              : <PersonAdd sx={{ fontSize: 13 }} />
          }
          onClick={toggleFollow}
          sx={{
            fontSize: '0.75rem', fontWeight: 700, px: 1.8, py: 0.5,
            borderRadius: 1.2, minWidth: 0, boxShadow: 'none',
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
const TagCard = ({ tag, idx, onTagClick }) => {
  const m = getTagColor(tag.TAG_NAME);
  return (
    <Box
      onClick={() => onTagClick(tag.TAG_NAME)}
      sx={{
        backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2,
        p: 2.5, display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer',
        animation: `fadeUp 0.35s ease ${idx * 0.05}s both`,
        transition: 'all 0.2s',
        '&:hover': { borderColor: m.color, boxShadow: `0 4px 16px ${m.color}14`, transform: 'translateY(-1px)' },
      }}
    >
      <Box sx={{
        width: 44, height: 44, borderRadius: 1.5, backgroundColor: m.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, color: m.color, border: `1px solid ${m.color}22`,
      }}>
        <Tag sx={{ fontSize: 22 }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#0F172A' }}>#{tag.TAG_NAME}</Typography>
        <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.2 }}>
          {formatCount(tag.POST_COUNT)} 게시물
        </Typography>
      </Box>
    </Box>
  );
};

// ──────────────────────────────────────────
//  Skeleton loaders
// ──────────────────────────────────────────
const PostSkeleton = () => (
  <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      <Skeleton variant="circular" width={26} height={26} />
      <Skeleton width={80} height={16} />
    </Box>
    <Skeleton width="90%" height={20} sx={{ mb: 0.8 }} />
    <Skeleton width="70%" height={20} sx={{ mb: 1.5 }} />
    <Skeleton width="100%" height={14} />
    <Skeleton width="80%" height={14} />
  </Box>
);

const UserSkeleton = () => (
  <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
    <Skeleton variant="circular" width={48} height={48} />
    <Box sx={{ flex: 1 }}>
      <Skeleton width={120} height={18} />
      <Skeleton width={80} height={14} sx={{ mt: 0.5 }} />
    </Box>
    <Skeleton width={70} height={32} sx={{ borderRadius: 1 }} />
  </Box>
);

// ──────────────────────────────────────────
//  DefaultView
// ──────────────────────────────────────────
const DefaultView = ({ trendingTags, recommendedUsers, loadingDefault, onTagClick, token }) => {
  if (loadingDefault) {
    return (
      <Stack spacing={1.5}>
        {[...Array(5)].map((_, i) => <UserSkeleton key={i} />)}
      </Stack>
    );
  }

  return (
    <Box sx={{ animation: 'fadeUp 0.3s ease both' }}>
      {/* 트렌딩 태그 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LocalFireDepartment sx={{ color: '#F87171', fontSize: 18, opacity: 0.75 }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', letterSpacing: '-0.01em' }}>
          지금 뜨는 태그
        </Typography>
      </Box>
      <Stack spacing={1.5} sx={{ mb: 4 }}>
        {trendingTags.map((t, i) => {
          const m = getTagColor(t.TAG_NAME);
          return (
            <Box
              key={t.TAG_NAME}
              onClick={() => onTagClick(t.TAG_NAME)}
              sx={{
                display: 'flex', alignItems: 'center',
                backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2,
                px: 2, py: 1.6, cursor: 'pointer',
                animation: `fadeUp 0.35s ease ${i * 0.05}s both`,
                transition: 'all 0.18s',
                '&:hover': { borderColor: '#2563EB', boxShadow: '0 4px 16px rgba(37,99,235,0.08)', transform: 'translateX(3px)' },
              }}
            >
              <Typography sx={{ color: '#CBD5E1', fontWeight: 800, fontSize: '0.78rem', width: 20, mr: 1.5 }}>
                {i + 1}
              </Typography>
              <Tag sx={{ fontSize: 15, color: '#94A3B8', mr: 1 }} />
              <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A', flex: 1 }}>
                #{t.TAG_NAME}
              </Typography>
              <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mr: 1 }}>
                {formatCount(t.POST_COUNT)} 게시물
              </Typography>
              {i < 3 && (
                <EmojiEvents sx={{ fontSize: 15, color: i === 0 ? '#D4A843' : i === 1 ? '#B0B8C4' : '#A07850', opacity: 0.7 }} />
              )}
            </Box>
          );
        })}
      </Stack>

      {/* 추천 개발자 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <GroupAdd sx={{ color: '#93B4E0', fontSize: 18, opacity: 0.85 }} />
        <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A', letterSpacing: '-0.01em' }}>
          팔로우 추천
        </Typography>
      </Box>
      <Stack spacing={1.5}>
        {recommendedUsers.map((u, i) => (
          <UserCard key={u.USER_ID} user={u} idx={i} token={token} />
        ))}
      </Stack>
    </Box>
  );
};

// ──────────────────────────────────────────
//  EmptyState
// ──────────────────────────────────────────
const EmptyState = ({ label, query }) => (
  <Box sx={{ textAlign: 'center', py: 8, animation: 'fadeUp 0.3s ease both' }}>
    <Box sx={{ mb: 1.5 }}>
      <Search sx={{ fontSize: 40, color: '#E2E8F0' }} />
    </Box>
    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', mb: 0.5 }}>
      "{query}"에 해당하는 {label}이 없습니다
    </Typography>
    <Typography sx={{ fontSize: '0.82rem', color: '#94A3B8' }}>
      다른 키워드로 검색해보세요
    </Typography>
  </Box>
);

// ──────────────────────────────────────────
//  Main Explore
// ──────────────────────────────────────────
export default function Explore() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const [inputValue, setInputValue] = useState('');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('posts');
  const [activeTagFilter, setActiveTagFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('explore_recent') || '[]'); } catch { return []; }
  });

  // 기본 화면 데이터
  const [trendingTags, setTrendingTags] = useState([]);
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loadingDefault, setLoadingDefault] = useState(true);

  // 검색 결과
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [availableTags, setAvailableTags] = useState([]); // 필터 칩용 태그 목록

  const inputRef = useRef(null);

  // 기본 화면 데이터 로드
  const loadDefault = useCallback(async () => {
    setLoadingDefault(true);
    try {
      const [tRes, uRes] = await Promise.all([
        fetch(`${API}/explore/trending-tags`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/explore/recommended-users`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [tData, uData] = await Promise.all([tRes.json(), uRes.json()]);
      if (tData.success) setTrendingTags(tData.tags);
      if (uData.success) setRecommendedUsers(uData.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDefault(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    loadDefault();
  }, [token, navigate, loadDefault]);

  // 검색 실행
  const doSearch = useCallback(async (q) => {
    if (!q?.trim()) return;
    setLoadingSearch(true);
    try {
      const res = await fetch(
        `${API}/explore/search?q=${encodeURIComponent(q)}&type=all&limit=30`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
        setUsers(data.users || []);
        setTags(data.tags || []);
        // 필터 칩 목록 = 결과 posts에 있는 태그들
        const tagSet = new Set();
        (data.posts || []).forEach(p => (p.tags || []).forEach(t => tagSet.add(t)));
        setAvailableTags([...tagSet]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSearch(false);
    }
  }, [token]);

  const handleSearch = (val) => {
    const v = (val ?? inputValue).trim();
    if (!v) return;
    setQuery(v);
    setInputValue(v);
    setFocused(false);
    setActiveResultTab('posts');
    setActiveTagFilter('all');

    // 최근 검색 저장
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
    inputRef.current?.focus();
  };

  // 태그 필터 적용한 posts
  const filteredPosts = activeTagFilter === 'all'
    ? posts
    : posts.filter(p => (p.tags || []).includes(activeTagFilter));

  const showDropdown = focused;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

        {/* Top bar */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #E2E8F0',
        }}>
          <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => navigate('/feed')} sx={{ color: '#64748B', flexShrink: 0 }}>
              <ArrowBack sx={{ fontSize: 20 }} />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 1, flexShrink: 0 }}>
              <Box sx={{ width: 26, height: 26, borderRadius: 1, backgroundColor: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.68rem' }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: '#0F172A' }}>탐색</Typography>
            </Box>
            <Box sx={{ flex: 1, position: 'relative' }}>
              <SearchBar
                value={inputValue}
                onChange={setInputValue}
                onClear={handleClear}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => setFocused(false), 150)}
                onEnter={handleSearch}
                inputRef={inputRef}
              />
              {showDropdown && (
                <SearchDropdown
                  query={inputValue}
                  recentSearches={recentSearches}
                  trendingTags={trendingTags}
                  onSelect={handleSearch}
                  token={token}
                  onClearRecent={() => {
                    setRecentSearches([]);
                    localStorage.removeItem('explore_recent');
                  }}
                  onDeleteRecent={(s) => {
                    setRecentSearches(prev => {
                      const updated = prev.filter(x => x !== s);
                      localStorage.setItem('explore_recent', JSON.stringify(updated));
                      return updated;
                    });
                  }}
                />
              )}
            </Box>
            <Button
              variant="contained"
              onClick={() => handleSearch()}
              sx={{
                backgroundColor: '#0F172A', color: '#fff', fontSize: '0.82rem',
                px: 2.2, py: 1, borderRadius: 1.5, boxShadow: 'none', flexShrink: 0,
                '&:hover': { backgroundColor: '#2563EB' }, transition: 'background 0.18s',
              }}
            >
              검색
            </Button>
          </Box>
        </Box>

        {/* Body */}
        <Box sx={{ maxWidth: 860, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
          {!query ? (
            <DefaultView
              trendingTags={trendingTags}
              recommendedUsers={recommendedUsers}
              loadingDefault={loadingDefault}
              onTagClick={(tag) => handleSearch(tag)}
              token={token}
            />
          ) : (
            <Box sx={{ animation: 'fadeIn 0.25s ease both' }}>
              {/* 결과 헤더 */}
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
                  <Box component="span" sx={{ color: '#2563EB' }}>"{query}"</Box> 검색 결과
                </Typography>
                {!loadingSearch && (
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem', mt: 0.3 }}>
                    게시물 {posts.length}개 · 개발자 {users.length}명 · 태그 {tags.length}개
                  </Typography>
                )}
              </Box>

              {/* 결과 탭 */}
              <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', mb: 2.5 }}>
                <Box sx={{ display: 'flex', borderBottom: '1px solid #E2E8F0', px: 1 }}>
                  <ResultTabBtn icon={<Article sx={{ fontSize: 15 }} />} label="게시물" active={activeResultTab === 'posts'} onClick={() => setActiveResultTab('posts')} count={posts.length} />
                  <ResultTabBtn icon={<People sx={{ fontSize: 15 }} />} label="개발자" active={activeResultTab === 'users'} onClick={() => setActiveResultTab('users')} count={users.length} />
                  <ResultTabBtn icon={<Tag sx={{ fontSize: 15 }} />} label="태그" active={activeResultTab === 'tags'} onClick={() => setActiveResultTab('tags')} count={tags.length} />
                </Box>

                {/* 태그 필터 (posts 탭) */}
                {activeResultTab === 'posts' && availableTags.length > 0 && (
                  <Box sx={{
                    display: 'flex', gap: 0.8, px: 2, py: 1.5,
                    overflowX: 'auto', '&::-webkit-scrollbar': { display: 'none' },
                    borderBottom: '1px solid #F1F5F9',
                  }}>
                    {['all', ...availableTags].map(ct => {
                      const active = activeTagFilter === ct;
                      const m = ct !== 'all' ? getTagColor(ct) : null;
                      return (
                        <Chip key={ct} label={ct === 'all' ? '전체' : ct} size="small"
                          onClick={() => setActiveTagFilter(ct)}
                          sx={{
                            fontWeight: 700, fontSize: '0.72rem', cursor: 'pointer', flexShrink: 0,
                            backgroundColor: active ? (m ? m.bg : '#0F172A') : '#F8FAFC',
                            color: active ? (m ? m.color : '#fff') : '#94A3B8',
                            border: active ? `1px solid ${m ? m.color + '44' : 'transparent'}` : '1px solid #E2E8F0',
                            '&:hover': { opacity: 0.85 }, transition: 'all 0.15s',
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* 결과 리스트 */}
              {loadingSearch ? (
                <Stack spacing={2}>
                  {[...Array(4)].map((_, i) => <PostSkeleton key={i} />)}
                </Stack>
              ) : (
                <>
                  {activeResultTab === 'posts' && (
                    filteredPosts.length === 0
                      ? <EmptyState label="게시물" query={query} />
                      : <Stack spacing={2}>{filteredPosts.map((p, i) => <PostCard key={p.id} post={p} idx={i} token={token} />)}</Stack>
                  )}
                  {activeResultTab === 'users' && (
                    users.length === 0
                      ? <EmptyState label="개발자" query={query} />
                      : <Stack spacing={1.5}>{users.map((u, i) => <UserCard key={u.USER_ID} user={u} idx={i} token={token} />)}</Stack>
                  )}
                  {activeResultTab === 'tags' && (
                    tags.length === 0
                      ? <EmptyState label="태그" query={query} />
                      : <Stack spacing={1.5}>{tags.map((t, i) => <TagCard key={t.TAG_NAME} tag={t} idx={i} onTagClick={(tag) => handleSearch(tag)} />)}</Stack>
                  )}
                </>
              )}
            </Box>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}