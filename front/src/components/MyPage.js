import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Button, Chip, Divider, IconButton, Stack,
  Typography, createTheme, ThemeProvider, CssBaseline,
  Tabs, Tab, Grid, Dialog, DialogTitle, DialogContent, DialogActions,
  InputBase, CircularProgress, Snackbar, Alert, Paper, List,
  ListItem, ListItemAvatar, ListItemText,
} from '@mui/material';
import {
  CameraAlt, Edit, Code, BugReport, Rocket, Lightbulb,
  TrendingUp, Favorite, ChatBubbleOutline,
  GridOn, ViewList, Close, Check, GitHub, Language, ArrowBack,
  Search,
} from '@mui/icons-material';

const API = 'http://localhost:3010';

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

const TAG_META = {
  'Bug Fix':      { color: '#DC2626', bg: '#FEF2F2', icon: <BugReport sx={{ fontSize: 11 }} /> },
  'React':        { color: '#2563EB', bg: '#EFF6FF', icon: <Code sx={{ fontSize: 11 }} /> },
  'TypeScript':   { color: '#7C3AED', bg: '#F5F3FF', icon: <Code sx={{ fontSize: 11 }} /> },
  'Architecture': { color: '#D97706', bg: '#FFFBEB', icon: <Rocket sx={{ fontSize: 11 }} /> },
  'Tip':          { color: '#059669', bg: '#ECFDF5', icon: <Lightbulb sx={{ fontSize: 11 }} /> },
  'DevOps':       { color: '#0891B2', bg: '#ECFEFF', icon: <TrendingUp sx={{ fontSize: 11 }} /> },
  'General':      { color: '#64748B', bg: '#F1F5F9', icon: null },
  'ERROR':        { color: '#DC2626', bg: '#FEF2F2', icon: <BugReport sx={{ fontSize: 11 }} /> },
  'QUESTION':     { color: '#2563EB', bg: '#EFF6FF', icon: <Code sx={{ fontSize: 11 }} /> },
  'FREE':         { color: '#059669', bg: '#ECFDF5', icon: <Lightbulb sx={{ fontSize: 11 }} /> },
};

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');
const tagMeta = (tag) => TAG_META[tag] || TAG_META['General'];
const stripHtml = (html) => { if (!html) return ''; return html.replace(/<[^>]*>/g, '').trim(); };

const TextPreviewCard = ({ text, color, bg, height = 140 }) => {
  const plain = stripHtml(text);
  return (
    <Box sx={{ height, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', px: 2, py: 1.5, overflow: 'hidden', position: 'relative' }}>
      <Box sx={{ position: 'absolute', top: -10, right: -10, width: 80, height: 80, borderRadius: '50%', backgroundColor: color, opacity: 0.06 }} />
      <Box sx={{ position: 'absolute', bottom: -20, left: -10, width: 60, height: 60, borderRadius: '50%', backgroundColor: color, opacity: 0.04 }} />
      <Typography sx={{ fontSize: '0.75rem', color, fontWeight: 600, lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: height > 100 ? 5 : 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textAlign: 'center', opacity: 0.85, fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif', position: 'relative', zIndex: 1 }}>
        {plain || '내용 없음'}
      </Typography>
    </Box>
  );
};

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
    <Box sx={{ position: 'relative', width: size, height: size, cursor: 'pointer' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={() => fileRef.current?.click()}>
      <Avatar src={avatarSrc || undefined} sx={{ width: size, height: size, backgroundColor: '#0F172A', fontSize: size * 0.35, fontWeight: 800, border: '3px solid #FFFFFF', boxShadow: '0 4px 20px rgba(15,23,42,0.12)', transition: 'all 0.2s', filter: hover ? 'brightness(0.75)' : 'brightness(1)' }}>
        {getInitial(name)}
      </Avatar>
      <Box sx={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundColor: 'rgba(15,23,42,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.3, opacity: hover ? 1 : 0, transition: 'opacity 0.2s' }}>
        <CameraAlt sx={{ color: '#fff', fontSize: size * 0.26 }} />
        <Typography sx={{ color: '#fff', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em' }}>변경</Typography>
      </Box>
      <Box sx={{ position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: '50%', backgroundColor: '#2563EB', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(37,99,235,0.4)' }}>
        <CameraAlt sx={{ color: '#fff', fontSize: 11 }} />
      </Box>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </Box>
  );
};

const GitHubInput = ({ value, onChange }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const handleChange = (val) => {
    onChange(val);
    clearTimeout(debounceRef.current);
    const query = val.replace(/^@/, '').trim();
    if (!query || query.length < 2) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=5`, { headers: { Accept: 'application/vnd.github+json' } });
        const data = await res.json();
        setSuggestions(data.items || []);
        setOpen((data.items || []).length > 0);
      } catch { setSuggestions([]); setOpen(false); } finally { setLoading(false); }
    }, 350);
  };
  const handleSelect = (login) => { onChange(login); setSuggestions([]); setOpen(false); };
  return (
    <Box ref={wrapRef} sx={{ position: 'relative', mb: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', mb: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>GitHub</Typography>
      <Box sx={{ position: 'relative' }}>
        <InputBase fullWidth value={value || ''} placeholder="GitHub 아이디 입력" onChange={(e) => handleChange(e.target.value)} onFocus={() => suggestions.length > 0 && setOpen(true)}
          startAdornment={<Box sx={{ display: 'flex', alignItems: 'center', pr: 1, color: '#94A3B8' }}><GitHub sx={{ fontSize: 15 }} /></Box>}
          endAdornment={loading ? <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}><CircularProgress size={12} sx={{ color: '#94A3B8' }} /></Box> : null}
          sx={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 500, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 1.5, py: 0.9, '&:focus-within': { borderColor: '#2563EB', backgroundColor: '#fff' }, transition: 'all 0.2s' }}
        />
      </Box>
      {open && suggestions.length > 0 && (
        <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1400, mt: 0.5, borderRadius: 1.5, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 8px 32px rgba(15,23,42,0.12)' }}>
          <List disablePadding>
            {suggestions.map((u, idx) => (
              <ListItem key={u.login} button onClick={() => handleSelect(u.login)} sx={{ py: 1, px: 1.5, borderBottom: idx < suggestions.length - 1 ? '1px solid #F1F5F9' : 'none', cursor: 'pointer', '&:hover': { backgroundColor: '#F8FAFC' }, transition: 'background 0.15s' }}>
                <ListItemAvatar sx={{ minWidth: 40 }}><Avatar src={u.avatar_url} sx={{ width: 28, height: 28, border: '1px solid #E2E8F0' }} /></ListItemAvatar>
                <ListItemText primary={<Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0F172A' }}>{u.login}</Typography>} secondary={<Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>github.com/{u.login}</Typography>} sx={{ my: 0 }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

// ──────────────────────────────────────────
//  FollowModal
// ──────────────────────────────────────────
const FollowModal = ({ open, initialTab, token, onClose }) => {
  const [tab, setTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingF, setLoadingF] = useState(false);

  useEffect(() => { if (!open) return; setTab(initialTab); setSearch(''); }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const fetchData = async () => {
      setLoadingF(true);
      try {
        const [fersRes, fingRes] = await Promise.all([
          fetch(`${API}/user/followers`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API}/user/following`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const fersData = await fersRes.json();
        const fingData = await fingRes.json();
        setFollowers(fersData.success ? fersData.list : []);
        setFollowing(fingData.success ? fingData.list : []);
      } catch { } finally { setLoadingF(false); }
    };
    fetchData();
  }, [open, token]);

  const list = tab === 0 ? followers : following;
  const filtered = list.filter(u => u.nickname?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" scroll="paper"
      sx={{ '& .MuiDialog-container': { alignItems: 'center' } }}
      PaperProps={{ sx: { borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 24px 64px rgba(15,23,42,0.15)', mx: 2, my: 'auto', maxHeight: '80vh' } }}
    >
      <DialogTitle sx={{ p: 0, borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
            {tab === 0 ? '팔로워' : '팔로잉'}
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}><Close sx={{ fontSize: 18 }} /></IconButton>
        </Box>
        <Tabs value={tab} onChange={(_, v) => { setTab(v); setSearch(''); }}
          sx={{ px: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', color: '#94A3B8', minHeight: 44, flex: 1, '&.Mui-selected': { color: '#0F172A', fontWeight: 800 } }, '& .MuiTabs-indicator': { backgroundColor: '#2563EB', height: 2 } }}>
          <Tab label={`팔로워 ${followers.length}`} />
          <Tab label={`팔로잉 ${following.length}`} />
        </Tabs>
      </DialogTitle>
      <DialogContent sx={{ px: 2, pt: 2, pb: 1, overflowY: 'auto' }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 1.5, py: 0.8 }}>
          <Search sx={{ fontSize: 16, color: '#94A3B8', flexShrink: 0 }} />
          <InputBase fullWidth placeholder="검색" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: '0.85rem', color: '#0F172A' }} />
        </Box>
        {loadingF ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} sx={{ color: '#CBD5E1' }} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <Typography sx={{ color: '#94A3B8', fontSize: '0.85rem' }}>
              {search ? '검색 결과가 없습니다.' : (tab === 0 ? '팔로워가 없습니다.' : '팔로잉이 없습니다.')}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((u, idx) => (
              <ListItem key={u.userId} sx={{ px: 0, py: 1.2, borderBottom: idx < filtered.length - 1 ? '1px solid #F8FAFC' : 'none', alignItems: 'center' }}>
                <ListItemAvatar sx={{ minWidth: 46 }}>
                  <Avatar src={u.avatar ? `${API}${u.avatar}` : undefined} sx={{ width: 36, height: 36, backgroundColor: '#0F172A', fontSize: '0.9rem', fontWeight: 800, border: '1.5px solid #E2E8F0' }}>
                    {getInitial(u.nickname)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.3 }}>{u.nickname}</Typography>}
                  secondary={u.bioShort ? <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', mt: 0.2 }}>{u.bioShort}</Typography> : null}
                  sx={{ my: 0 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ──────────────────────────────────────────
//  EditProfileDialog
// ──────────────────────────────────────────
const EditProfileDialog = ({ open, user, token, onClose, onSave }) => {
  const [form, setForm] = useState({ ...user });
  const [avatarSrc, setAvatarSrc] = useState(user.avatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (open) { setForm({ ...user }); setAvatarSrc(user.avatar); setAvatarFile(null); setError(''); } }, [open, user]);
  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      let newAvatarUrl = avatarSrc;
      if (avatarFile) {
        const fd = new FormData(); fd.append('avatar', avatarFile);
        const imgRes = await fetch(`${API}/user/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
        const imgData = await imgRes.json();
        if (imgData.success) newAvatarUrl = `${API}${imgData.imageUrl}`;
      }
      const res = await fetch(`${API}/user/profile`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ nickname: form.name, bio: form.bio, bio_short: form.role, github: form.github, website: form.website }) });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message || '저장에 실패했습니다.'); return; }
      onSave({ ...form, avatar: newAvatarUrl });
      onClose();
    } catch { setError('서버와 연결할 수 없습니다.'); } finally { setSaving(false); }
  };
  const field = (label, key, multiline = false) => (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', mb: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</Typography>
      <InputBase fullWidth multiline={multiline} rows={multiline ? 3 : 1} value={form[key] || ''} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        sx={{ fontSize: '0.88rem', color: '#0F172A', fontWeight: 500, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 1.5, py: 0.9, alignItems: multiline ? 'flex-start' : 'center', '&:focus-within': { borderColor: '#2563EB', backgroundColor: '#fff' }, transition: 'all 0.2s' }}
      />
    </Box>
  );
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper" sx={{ '& .MuiDialog-container': { alignItems: 'center', justifyContent: 'center' } }} PaperProps={{ sx: { borderRadius: 2.5, border: '1px solid #E2E8F0', boxShadow: '0 24px 64px rgba(15,23,42,0.15)', mx: 2, my: 'auto', maxHeight: '90vh' } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', borderBottom: '1px solid #F1F5F9', py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        프로필 편집
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}><Close sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 3, overflowY: 'auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <AvatarUpload avatarSrc={avatarSrc} name={form.name} onUpload={(src, file) => { setAvatarSrc(src); setAvatarFile(file); }} size={88} />
            <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 1 }}>클릭해서 프로필 사진 변경</Typography>
          </Box>
        </Box>
        {field('이름 / 닉네임', 'name')}
        {field('한 줄 소개', 'role')}
        {field('소개', 'bio', true)}
        <GitHubInput value={form.github} onChange={(val) => setForm(f => ({ ...f, github: val }))} />
        {field('웹사이트', 'website')}
        {error && <Typography sx={{ color: '#EF4444', fontSize: '0.8rem', mt: 1, fontWeight: 600 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #F1F5F9', gap: 1, flexShrink: 0 }}>
        <Button onClick={onClose} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600, fontSize: '0.83rem' }}>취소</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving} endIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Check sx={{ fontSize: 15 }} />}
          sx={{ backgroundColor: '#0F172A', color: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '0.83rem', px: 2.5, boxShadow: 'none', borderRadius: 1.5, '&:hover': { backgroundColor: '#2563EB' }, '&.Mui-disabled': { backgroundColor: '#E2E8F0', color: '#94A3B8' } }}>
          저장하기
        </Button>
      </DialogActions>
    </Dialog>
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
        <Box key={post.id} onClick={() => onPostClick(post.id)} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, p: 2.5, gap: 2, cursor: 'pointer', animation: `fadeUp 0.4s ease ${i * 0.05}s both`, transition: 'all 0.2s', '&:hover': { borderColor: '#CBD5E1', boxShadow: '0 4px 16px rgba(15,23,42,0.06)' } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ mb: 1 }}><Chip label={post.tag} size="small" sx={{ backgroundColor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.62rem', height: 16 }} /></Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', mb: 1 }}>{post.title}</Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: post.description }} />
          </Box>
          {post.image ? <Box component="img" src={post.image} alt={post.title} sx={{ width: 90, height: 90, borderRadius: 1.5, flexShrink: 0, objectFit: 'cover', border: '1px solid #E2E8F0', display: 'block' }} />
            : <Box sx={{ width: 90, height: 90, borderRadius: 1.5, flexShrink: 0, overflow: 'hidden', border: `1px solid ${meta.color}22` }}><TextPreviewCard text={post.description} color={meta.color} bg={meta.bg} height={90} /></Box>}
        </Box>
      );
    })}
  </Box>
);

const StatBadge = ({ value, label, onClick }) => (
  <Box onClick={onClick} sx={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default', px: 2, '&:hover .stat-value': { color: onClick ? '#2563EB' : '#0F172A' } }}>
    <Typography className="stat-value" sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F172A', lineHeight: 1, transition: 'color 0.15s' }}>{value}</Typography>
    <Typography sx={{ color: '#94A3B8', fontSize: '0.72rem', mt: 0.2, fontWeight: 500 }}>{label}</Typography>
  </Box>
);

// ──────────────────────────────────────────
//  Main Mypage
// ──────────────────────────────────────────
export default function Mypage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [followModal, setFollowModal] = useState({ open: false, tab: 0 });
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const getSortedPosts = useCallback(() => {
    return [...posts].sort((a, b) => {
      const dateA = new Date(a.CREATED_AT || 0);
      const dateB = new Date(b.CREATED_AT || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [posts, sortOrder]);

  const currentPosts = activeTab === 0 ? getSortedPosts() : bookmarks;
  const handleSaveProfile = (updated) => { setUser(updated); setToast({ open: true, message: '프로필이 저장되었습니다.', severity: 'success' }); };
  const handlePostClick = (postId) => { navigate(`/post/${postId}`); };

  useEffect(() => {
    const fetchMypageData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/user/mypage/data`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('서버 응답 오류');
        const data = await res.json();
        if (data.success) {
          setUser({
            name:      data.user.NICKNAME    || '사용자',
            handle:    `@${data.user.NICKNAME || 'user'}`,
            role:      data.user.BIO_SHORT    || '',
            bio:       data.user.BIO          || '',
            github:    data.user.GITHUB       || '',
            website:   data.user.WEBSITE      || '',
            avatar:    data.user.AVATAR ? `${API}${data.user.AVATAR}` : null,
            postCount: data.posts.length,
            followers: data.user.FOLLOWER_CNT  ?? 0,
            following: data.user.FOLLOWING_CNT ?? 0,
          });
          const formattedPosts = data.posts.map(p => ({
            ...p,
            id:           p.id || p.POST_ID,
            title:        p.title || p.TITLE || '',
            description:  p.description || p.CONTENT || '',
            tag:          p.tag || 'General',
            likes:        p.likes ?? 0,
            commentCount: p.commentCount ?? 0,
            image:        (p.images && p.images.trim()) ? p.images.split(',')[0].trim() : null,
          }));
          setPosts(formattedPosts);
        }
      } catch (err) { console.error('데이터 로드 실패:', err); } finally { setLoading(false); }
    };
    if (token) fetchMypageData();
    else navigate('/');
  }, [token, navigate]);

  if (!user) {
    return (
      <ThemeProvider theme={theme}><CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><CircularProgress /></Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
        <Box sx={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: 'rgba(248,250,252,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0' }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => navigate('/feed')} sx={{ color: '#64748B' }}><ArrowBack sx={{ fontSize: 20 }} /></IconButton>
            <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>{user.name}</Typography>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ color: '#94A3B8', fontSize: '0.78rem' }}>게시물 {user.postCount}</Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>
          <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2.5, p: { xs: 2.5, md: 3.5 }, mb: 3, animation: 'scaleIn 0.3s ease both' }}>
            <Box sx={{ height: 80, borderRadius: 1.5, background: 'linear-gradient(135deg, #0F172A 0%, #2563EB 60%, #7C3AED 100%)', mb: -4, position: 'relative', overflow: 'hidden', '&::after': { content: '""', position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)' } }} />
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
              <AvatarUpload avatarSrc={user.avatar} name={user.name} size={88}
                onUpload={(src, file) => {
                  setUser(u => ({ ...u, avatar: src }));
                  const fd = new FormData(); fd.append('avatar', file);
                  fetch(`${API}/user/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd })
                    .then(r => r.json()).then(data => {
                      if (data.success) setToast({ open: true, message: '프로필 사진이 변경되었습니다.', severity: 'success' });
                      else { setUser(u => ({ ...u, avatar: null })); setToast({ open: true, message: '이미지 업로드에 실패했습니다.', severity: 'error' }); }
                    }).catch(() => { setUser(u => ({ ...u, avatar: null })); setToast({ open: true, message: '서버와 연결할 수 없습니다.', severity: 'error' }); });
                }}
              />
              <Button startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={() => setEditOpen(true)}
                sx={{ border: '1px solid #E2E8F0', color: '#0F172A', backgroundColor: '#fff', textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', px: 2, py: 0.8, borderRadius: 1.5, boxShadow: 'none', '&:hover': { borderColor: '#0F172A', backgroundColor: '#F8FAFC' }, transition: 'all 0.2s' }}>
                프로필 편집
              </Button>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', lineHeight: 1.2 }}>{user.name}</Typography>
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
              <StatBadge value={user.followers} label="팔로워" onClick={() => setFollowModal({ open: true, tab: 0 })} />
              <StatBadge value={user.following} label="팔로잉" onClick={() => setFollowModal({ open: true, tab: 1 })} />
            </Stack>
          </Box>

          <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2.5, overflow: 'hidden', animation: 'fadeUp 0.4s ease 0.1s both' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', px: 2 }}>
              <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}
                sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.85rem', color: '#94A3B8', minHeight: 48, px: 1.5, '&.Mui-selected': { color: '#0F172A', fontWeight: 800 } }, '& .MuiTabs-indicator': { backgroundColor: '#2563EB', height: 2 } }}>
                <Tab label={`내 게시물 ${posts.length}`} />
                <Tab label={`북마크 ${bookmarks.length}`} />
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
              {currentPosts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ color: '#94A3B8', fontSize: '0.88rem' }}>{activeTab === 0 ? '아직 게시물이 없습니다.' : '북마크한 게시물이 없습니다.'}</Typography>
                </Box>
              ) : viewMode === 'grid' ? (
                <PostGrid posts={currentPosts} onPostClick={handlePostClick} />
              ) : (
                <PostList posts={currentPosts} onPostClick={handlePostClick} />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <EditProfileDialog open={editOpen} user={user} token={token} onClose={() => setEditOpen(false)} onSave={handleSaveProfile} />
      <FollowModal open={followModal.open} initialTab={followModal.tab} token={token} onClose={() => setFollowModal(m => ({ ...m, open: false }))} />

      <Snackbar open={toast.open} autoHideDuration={2500} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}