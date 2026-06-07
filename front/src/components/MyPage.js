import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Button, Divider, IconButton, Stack,
  Typography, createTheme, ThemeProvider, CssBaseline,
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputBase, CircularProgress, Snackbar, Alert, Paper, List,
  ListItem, ListItemAvatar, ListItemText, Grid, MenuItem, Menu,
} from '@mui/material';
import {
  CameraAlt, Edit, Favorite, ChatBubbleOutline,
  Close, Check, GitHub, Language, ArrowBack,
  Search, GridOn, Bookmarks, PersonPin, Lock,
  ViewList, SortRounded, ZoomIn, Videocam, Visibility
} from '@mui/icons-material';
import { useColorMode } from '../App';

const API = 'http://localhost:3010';

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');
const stripHtml = (html) => { if (!html) return ''; return html.replace(/<[^>]*>/g, '').trim(); };

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

// ── 멘션 렌더러 ───────────────────────────────────────────────
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

// ── 아바타 확대 모달 ──────────────────────────────────────────
const AvatarZoomModal = ({ open, src, name, onClose, colors }) => (
  <Dialog open={open} onClose={onClose} maxWidth="sm"
    PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', backgroundColor: 'transparent', boxShadow: '0 32px 80px rgba(0,0,0,0.4)' } }}>
    <Box sx={{ position: 'relative', backgroundColor: '#0F172A' }}>
      <IconButton onClick={onClose} size="small"
        sx={{ position: 'absolute', top: 10, right: 10, zIndex: 2, color: '#fff', backgroundColor: 'rgba(0,0,0,0.4)', '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' } }}>
        <Close sx={{ fontSize: 18 }} />
      </IconButton>
      {src
        ? <Box component="img" src={src} alt={name} sx={{ width: 400, height: 400, objectFit: 'cover', display: 'block' }} />
        : <Box sx={{ width: 400, height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E293B' }}>
          <Typography sx={{ fontSize: '5rem', fontWeight: 800, color: '#fff' }}>{getInitial(name)}</Typography>
        </Box>
      }
    </Box>
  </Dialog>
);

// ── AvatarUpload (편집 모달 전용) ─────────────────────────────
const AvatarUploadEdit = ({ avatarSrc, name, onUpload, size = 88 }) => {
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
    <Box sx={{ position: 'relative', width: size, height: size, cursor: 'pointer' }}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onClick={() => fileRef.current?.click()}>
      <Avatar src={avatarSrc || undefined} sx={{
        width: size, height: size, backgroundColor: '#0F172A',
        fontSize: size * 0.35, fontWeight: 800, border: '3px solid #FFFFFF',
        boxShadow: '0 4px 20px rgba(15,23,42,0.12)', transition: 'all 0.2s',
        filter: hover ? 'brightness(0.75)' : 'brightness(1)',
      }}>
        {getInitial(name)}
      </Avatar>
      <Box sx={{
        position: 'absolute', inset: 0, borderRadius: '50%',
        backgroundColor: 'rgba(15,23,42,0.5)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.3,
        opacity: hover ? 1 : 0, transition: 'opacity 0.2s',
      }}>
        <CameraAlt sx={{ color: '#fff', fontSize: size * 0.26 }} />
        <Typography sx={{ color: '#fff', fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.04em' }}>변경</Typography>
      </Box>
      <Box sx={{
        position: 'absolute', bottom: 4, right: 4, width: 22, height: 22,
        borderRadius: '50%', backgroundColor: '#2563EB', border: '2px solid #fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
      }}>
        <CameraAlt sx={{ color: '#fff', fontSize: 11 }} />
      </Box>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </Box>
  );
};

// ── 메인페이지 아바타 (클릭시 확대) ──────────────────────────
const AvatarView = ({ avatarSrc, name, size = 88, colors }) => {
  const [zoomOpen, setZoomOpen] = useState(false);
  return (
    <>
      <Box sx={{ position: 'relative', width: size, height: size, cursor: 'pointer' }}
        onClick={() => setZoomOpen(true)}>
        <Avatar src={avatarSrc || undefined} sx={{
          width: size, height: size, backgroundColor: '#0F172A',
          fontSize: size * 0.35, fontWeight: 800, border: '3px solid #FFFFFF',
          boxShadow: '0 4px 20px rgba(15,23,42,0.12)',
        }}>
          {getInitial(name)}
        </Avatar>
        <Box sx={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: 0, transition: 'opacity 0.2s',
          '&:hover': { opacity: 1, backgroundColor: 'rgba(15,23,42,0.25)' },
        }}>
          <ZoomIn sx={{ color: '#fff', fontSize: size * 0.28 }} />
        </Box>
      </Box>
      <AvatarZoomModal open={zoomOpen} src={avatarSrc} name={name} onClose={() => setZoomOpen(false)} colors={colors} />
    </>
  );
};

// ── TaggableInput ─────────────────────────────────────────────
const TaggableInput = ({ label, value, onChange, multiline = false, token, onMentionAdded, colors }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [suggOpen, setSuggOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setSuggOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchUsers = useCallback(async (q) => {
    setLoading(true);
    try {
      const url = q ? `${API}/user/tag-search?q=${encodeURIComponent(q)}` : `${API}/user/tag-search`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.users || []);
        setSuggOpen(data.users?.length > 0);
        setActiveIdx(0);
      }
    } catch {
      setSuggestions([]); setSuggOpen(false);
    } finally { setLoading(false); }
  }, [token]);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const cursor = e.target.selectionStart;
    const textBefore = val.slice(0, cursor);
    const atIdx = textBefore.lastIndexOf('@');
    if (atIdx !== -1) {
      const query = textBefore.slice(atIdx + 1);
      if (!query.includes(' ') && !query.includes('\n')) {
        setMentionStart(atIdx); setMentionQuery(query);
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchUsers(query), query === '' ? 0 : 150);
        return;
      }
    }
    setMentionStart(-1); setSuggOpen(false);
  };

  const insertMention = useCallback((nickname) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice(mentionStart + 1 + mentionQuery.length);
    const newVal = `${before}@${nickname} ${after}`;
    onChange(newVal);
    setSuggOpen(false); setMentionStart(-1); setMentionQuery('');
    setTimeout(() => {
      const el = inputRef.current;
      if (el) {
        const pos = before.length + nickname.length + 2;
        el.setSelectionRange(pos, pos); el.focus();
      }
    }, 0);
    if (onMentionAdded) onMentionAdded(nickname);
  }, [value, mentionStart, mentionQuery, onChange, onMentionAdded]);

  const handleKeyDown = (e) => {
    if (!suggOpen || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Tab' || e.key === 'Enter') { if (suggestions[activeIdx]) { e.preventDefault(); insertMention(suggestions[activeIdx].NICKNAME); } }
    else if (e.key === 'Escape') { setSuggOpen(false); }
  };

  return (
    <Box ref={wrapRef} sx={{ mb: 2, position: 'relative' }}>
      {label && <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, mb: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</Typography>}
      <InputBase
        inputRef={inputRef} fullWidth multiline={multiline} rows={multiline ? 3 : 1}
        value={value || ''} onChange={handleChange} onKeyDown={handleKeyDown}
        sx={{
          fontSize: '0.88rem', color: colors.textPrimary, fontWeight: 500,
          backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`,
          borderRadius: 1.5, px: 1.5, py: 0.9,
          alignItems: multiline ? 'flex-start' : 'center',
          '&:focus-within': { borderColor: '#2563EB', backgroundColor: colors.paper },
          transition: 'all 0.2s', width: '100%',
        }}
      />
      {suggOpen && (
        <Box sx={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1500,
          mt: 0.5, borderRadius: 1.5, border: `1px solid ${colors.border}`,
          backgroundColor: colors.paper, boxShadow: '0 8px 24px rgba(15,23,42,0.12)', overflow: 'hidden',
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 1.5 }}><CircularProgress size={16} sx={{ color: '#CBD5E1' }} /></Box>
          ) : suggestions.map((u, idx) => (
            <Box key={u.USER_ID}
              onMouseDown={(e) => { e.preventDefault(); insertMention(u.NICKNAME); }}
              onMouseEnter={() => setActiveIdx(idx)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.2, px: 1.5, py: 0.9, cursor: 'pointer',
                backgroundColor: idx === activeIdx ? (colors.mode === 'dark' ? '#1E3A5F' : '#EFF6FF') : colors.paper,
                borderBottom: idx < suggestions.length - 1 ? `1px solid ${colors.border}` : 'none',
                transition: 'background 0.1s',
              }}>
              <Avatar src={u.AVATAR ? `${API}${u.AVATAR}` : undefined}
                sx={{ width: 28, height: 28, fontSize: '0.72rem', fontWeight: 800, backgroundColor: '#0F172A', border: `1.5px solid ${colors.border}` }}>
                {getInitial(u.NICKNAME)}
              </Avatar>
              <Typography sx={{ flex: 1, fontSize: '0.83rem', fontWeight: 700, color: colors.textPrimary }}>{u.NICKNAME}</Typography>
              <Typography sx={{ fontSize: '0.65rem', color: colors.textHint, fontWeight: 600, backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 0.5, px: 0.6, py: 0.2 }}>Tab</Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

// ── GitHubInput ───────────────────────────────────────────────
const GitHubInput = ({ value, onChange, colors }) => {
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
        setSuggestions(data.items || []); setOpen((data.items || []).length > 0);
      } catch { setSuggestions([]); setOpen(false); } finally { setLoading(false); }
    }, 350);
  };
  const handleSelect = (login) => { onChange(login); setSuggestions([]); setOpen(false); };
  return (
    <Box ref={wrapRef} sx={{ position: 'relative', mb: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, mb: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>GitHub</Typography>
      <Box sx={{ position: 'relative' }}>
        <InputBase fullWidth value={value || ''} placeholder="GitHub 아이디 입력" onChange={(e) => handleChange(e.target.value)} onFocus={() => suggestions.length > 0 && setOpen(true)}
          startAdornment={<Box sx={{ display: 'flex', alignItems: 'center', pr: 1, color: colors.textHint }}><GitHub sx={{ fontSize: 15 }} /></Box>}
          endAdornment={loading ? <Box sx={{ display: 'flex', alignItems: 'center', pl: 1 }}><CircularProgress size={12} sx={{ color: colors.textHint }} /></Box> : null}
          sx={{ fontSize: '0.88rem', color: colors.textPrimary, fontWeight: 500, backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 1.5, px: 1.5, py: 0.9, '&:focus-within': { borderColor: '#2563EB', backgroundColor: colors.paper }, transition: 'all 0.2s' }}
        />
      </Box>
      {open && suggestions.length > 0 && (
        <Paper elevation={8} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1400, mt: 0.5, borderRadius: 1.5, border: `1px solid ${colors.border}`, overflow: 'hidden', backgroundColor: colors.paper }}>
          <List disablePadding>
            {suggestions.map((u, idx) => (
              <ListItem key={u.login} button onClick={() => handleSelect(u.login)}
                sx={{ py: 1, px: 1.5, borderBottom: idx < suggestions.length - 1 ? `1px solid ${colors.border}` : 'none', cursor: 'pointer', '&:hover': { backgroundColor: colors.hover } }}>
                <ListItemAvatar sx={{ minWidth: 40 }}><Avatar src={u.avatar_url} sx={{ width: 28, height: 28 }} /></ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: colors.textPrimary }}>{u.login}</Typography>}
                  secondary={<Typography sx={{ fontSize: '0.7rem', color: colors.textHint }}>github.com/{u.login}</Typography>}
                  sx={{ my: 0 }} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

// ── FollowModal (마이페이지용) ─────────────────────────────────
const FollowModal = ({ open, initialTab, token, onClose, onFollowChange, colors }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [search, setSearch] = useState('');
  const [loadingF, setLoadingF] = useState(false);
  const [pendingId, setPendingId] = useState(null);

  const followerCount = followers.length;
  const followingCount = following.filter(u => !u.unfollowed).length;

  useEffect(() => { if (!open) return; setTab(initialTab); setSearch(''); }, [open, initialTab]);

  const fetchData = useCallback(async () => {
    if (!open) return;
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
  }, [open, token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUnfollow = async (userId) => {
    setPendingId(userId);
    try {
      const res = await fetch(`${API}/user/follow/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setFollowing(prev => prev.map(u => u.userId === userId ? { ...u, unfollowed: true } : u));
        if (onFollowChange) onFollowChange(-1);
      }
    } catch { } finally { setPendingId(null); }
  };

  const handleRefollow = async (u) => {
    setPendingId(u.userId);
    try {
      const res = await fetch(`${API}/user/follow/${u.userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setFollowing(prev => prev.map(f => f.userId === u.userId ? { ...f, unfollowed: false } : f));
        if (onFollowChange) onFollowChange(1);
      }
    } catch { } finally { setPendingId(null); }
  };

  const handleFollowToggle = async (u) => {
    setPendingId(u.userId);
    try {
      const res = await fetch(`${API}/user/follow/${u.userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        const newStatus = data.status;
        setFollowers(prev => prev.map(f => f.userId === u.userId ? { ...f, followStatus: newStatus } : f));
        if (newStatus === 'ACCEPTED' || newStatus === 'PENDING') {
          setFollowing(prev =>
            prev.find(f => f.userId === u.userId)
              ? prev.map(f => f.userId === u.userId ? { ...f, unfollowed: false } : f)
              : [...prev, { ...u, unfollowed: false }]
          );
        } else {
          setFollowing(prev => prev.map(f => f.userId === u.userId ? { ...f, unfollowed: true } : f));
        }
      }
    } catch { } finally { setPendingId(null); }
  };

  const FollowBtn = ({ u }) => {
    const isPending = pendingId === u.userId;
    const status = u.followStatus;
    if (status === 'ACCEPTED') return (
      <Button size="small" onClick={() => handleFollowToggle(u)} disabled={isPending}
        sx={{ ml: 1, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: colors.textPrimary, border: `1px solid ${colors.border}`, borderRadius: 1.5, px: 1.5, py: 0.5, textTransform: 'none', minWidth: 64, backgroundColor: colors.inputBg, '&:hover': { borderColor: colors.borderFocus, backgroundColor: colors.hover }, transition: 'all 0.15s' }}>
        {isPending ? <CircularProgress size={10} /> : '팔로잉'}
      </Button>
    );
    if (status === 'PENDING') return (
      <Button size="small" onClick={() => handleFollowToggle(u)} disabled={isPending}
        sx={{ ml: 1, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: colors.textMuted, border: `1px solid ${colors.border}`, borderRadius: 1.5, px: 1.5, py: 0.5, textTransform: 'none', minWidth: 64, '&:hover': { borderColor: colors.borderFocus, backgroundColor: colors.hover }, transition: 'all 0.15s' }}>
        {isPending ? <CircularProgress size={10} /> : '요청됨'}
      </Button>
    );
    return (
      <Button size="small" onClick={() => handleFollowToggle(u)} disabled={isPending}
        sx={{ ml: 1, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: '#fff', backgroundColor: '#2563EB', border: '1px solid #2563EB', borderRadius: 1.5, px: 1.5, py: 0.5, textTransform: 'none', minWidth: 64, '&:hover': { backgroundColor: '#1D4ED8' }, transition: 'all 0.15s' }}>
        {isPending ? <CircularProgress size={10} sx={{ color: '#fff' }} /> : '팔로우'}
      </Button>
    );
  };

  const list = tab === 0 ? followers : following;
  const filtered = list.filter(u => u.nickname?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" scroll="paper"
      PaperProps={{ sx: { borderRadius: 2.5, border: `1px solid ${colors.border}`, boxShadow: '0 24px 64px rgba(15,23,42,0.15)', mx: 2, my: 'auto', maxHeight: '80vh', backgroundColor: colors.paper } }}>
      <DialogTitle sx={{ p: 0, borderBottom: `1px solid ${colors.border}`, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 0 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>{tab === 0 ? '팔로워' : '팔로잉'}</Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: colors.textHint }}><Close sx={{ fontSize: 18 }} /></IconButton>
        </Box>
        <Box sx={{ position: 'relative', display: 'flex', px: 2, mt: 1, pb: 0 }}>
          {['팔로워', '팔로잉'].map((label, i) => (
            <Box key={i} onClick={() => { setTab(i); setSearch(''); }} sx={{ flex: 1, py: 1.2, textAlign: 'center', cursor: 'pointer' }}>
              <Typography sx={{ fontSize: '0.85rem', fontWeight: tab === i ? 800 : 600, color: tab === i ? colors.textPrimary : colors.textHint, transition: 'color 0.2s' }}>
                {label} {i === 0 ? followerCount : followingCount}
              </Typography>
            </Box>
          ))}
          <Box sx={{ position: 'absolute', bottom: 0, left: `calc(${tab * 50}% + 8px)`, width: 'calc(50% - 16px)', height: 2, backgroundColor: '#2563EB', borderRadius: 1, transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)' }} />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ px: 2, pt: 3, pb: 1, overflowY: 'auto', backgroundColor: colors.paper }}>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 1.5, px: 1.5, py: 0.8 }}>
          <Search sx={{ fontSize: 16, color: colors.textHint, flexShrink: 0 }} />
          <InputBase fullWidth placeholder="검색" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ fontSize: '0.85rem', color: colors.textPrimary }} />
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
                px: 0.5, py: 1, borderRadius: 1.5,
                borderBottom: idx < filtered.length - 1 ? `1px solid ${colors.border}` : 'none',
                alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s',
                '&:hover': { backgroundColor: colors.hover },
              }}>
                <ListItemAvatar sx={{ minWidth: 46 }} onClick={() => { onClose(); navigate(`/user/${u.nickname}`); }}>
                  <Avatar src={u.avatar ? `${API}${u.avatar}` : undefined}
                    sx={{ width: 36, height: 36, backgroundColor: '#0F172A', fontSize: '0.9rem', fontWeight: 800, border: `1.5px solid ${colors.border}` }}>
                    {getInitial(u.nickname)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText onClick={() => { onClose(); navigate(`/user/${u.nickname}`); }} sx={{ my: 0 }}
                  primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: colors.textPrimary }}>{u.nickname}</Typography>}
                  secondary={u.bioShort ? <Typography sx={{ fontSize: '0.75rem', color: colors.textHint, mt: 0.2 }}>{u.bioShort}</Typography> : null}
                />
                {tab === 0 && <FollowBtn u={u} />}
                {tab === 1 && (
                  u.unfollowed ? (
                    <Button size="small" onClick={() => handleRefollow(u)} disabled={pendingId === u.userId}
                      sx={{ ml: 1, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: '#fff', backgroundColor: '#2563EB', border: '1px solid #2563EB', borderRadius: 1.5, px: 1.5, py: 0.5, textTransform: 'none', minWidth: 64, '&:hover': { backgroundColor: '#1D4ED8' }, transition: 'all 0.15s' }}>
                      {pendingId === u.userId ? <CircularProgress size={10} sx={{ color: '#fff' }} /> : '팔로우'}
                    </Button>
                  ) : (
                    <Button size="small" onClick={() => handleUnfollow(u.userId)} disabled={pendingId === u.userId}
                      sx={{ ml: 1, flexShrink: 0, fontSize: '0.72rem', fontWeight: 700, color: colors.textPrimary, border: `1px solid ${colors.border}`, borderRadius: 1.5, px: 1.5, py: 0.5, textTransform: 'none', minWidth: 64, backgroundColor: colors.inputBg, '&:hover': { borderColor: colors.borderFocus, backgroundColor: colors.hover }, transition: 'all 0.15s' }}>
                      {pendingId === u.userId ? <CircularProgress size={10} /> : '팔로잉'}
                    </Button>
                  )
                )}
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── EditProfileDialog ─────────────────────────────────────────
const EditProfileDialog = ({ open, user, token, onClose, onSave, colors }) => {
  const [form, setForm] = useState({ ...user });
  const [avatarSrc, setAvatarSrc] = useState(user.avatar);
  const [avatarFile, setAvatarFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [mentionedNicknames, setMentionedNicknames] = useState([]);

  useEffect(() => {
    if (open) { setForm({ ...user }); setAvatarSrc(user.avatar); setAvatarFile(null); setError(''); setMentionedNicknames([]); }
  }, [open, user]);

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
      const res = await fetch(`${API}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nickname: form.name, bio: form.bio, bio_short: form.role, github: form.github, website: form.website }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.message || '저장에 실패했습니다.'); return; }
      onSave({ ...form, avatar: newAvatarUrl });
      if (mentionedNicknames.length > 0) {
        await fetch(`${API}/user/notify-mention`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ nicknames: [...new Set(mentionedNicknames)] }),
        });
      }
      onClose();
    } catch { setError('서버와 연결할 수 없습니다.'); } finally { setSaving(false); }
  };

  const simpleField = (label, key) => (
    <Box sx={{ mb: 2 }}>
      <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.textMuted, mb: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</Typography>
      <InputBase fullWidth value={form[key] || ''} onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
        sx={{ fontSize: '0.88rem', color: colors.textPrimary, fontWeight: 500, backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 1.5, px: 1.5, py: 0.9, '&:focus-within': { borderColor: '#2563EB', backgroundColor: colors.paper }, transition: 'all 0.2s' }}
      />
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" scroll="paper"
      disableScrollLock
      PaperProps={{ sx: { borderRadius: 2.5, border: `1px solid ${colors.border}`, boxShadow: '0 24px 64px rgba(15,23,42,0.15)', mx: 'auto', my: 'auto', maxHeight: '90vh', backgroundColor: colors.paper } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', color: colors.textPrimary, borderBottom: `1px solid ${colors.border}`, py: 2, px: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        프로필 편집
        <IconButton size="small" onClick={onClose} sx={{ color: colors.textHint }}><Close sx={{ fontSize: 18 }} /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ px: 3, py: 3, overflowY: 'auto', backgroundColor: colors.paper }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <AvatarUploadEdit avatarSrc={avatarSrc} name={form.name} onUpload={(src, file) => { setAvatarSrc(src); setAvatarFile(file); }} size={88} />
            <Typography sx={{ color: colors.textHint, fontSize: '0.72rem', mt: 1 }}>클릭해서 프로필 사진 변경</Typography>
          </Box>
        </Box>
        {simpleField('이름 / 닉네임', 'name')}
        <TaggableInput label="한 줄 소개" value={form.role} onChange={(val) => setForm(f => ({ ...f, role: val }))} token={token} onMentionAdded={(nick) => setMentionedNicknames(prev => [...prev, nick])} colors={colors} />
        <TaggableInput label="소개" value={form.bio} onChange={(val) => setForm(f => ({ ...f, bio: val }))} multiline token={token} onMentionAdded={(nick) => setMentionedNicknames(prev => [...prev, nick])} colors={colors} />
        <GitHubInput value={form.github} onChange={(val) => setForm(f => ({ ...f, github: val }))} colors={colors} />
        {simpleField('웹사이트', 'website')}
        {error && <Typography sx={{ color: '#EF4444', fontSize: '0.8rem', mt: 1, fontWeight: 600 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${colors.border}`, gap: 1, flexShrink: 0, backgroundColor: colors.paper }}>
        <Button onClick={onClose} sx={{ color: colors.textMuted, textTransform: 'none', fontWeight: 600, fontSize: '0.83rem' }}>취소</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}
          endIcon={saving ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <Check sx={{ fontSize: 15 }} />}
          sx={{ backgroundColor: colors.textPrimary, color: colors.paper, textTransform: 'none', fontWeight: 700, fontSize: '0.83rem', px: 2.5, boxShadow: 'none', borderRadius: 1.5, '&:hover': { backgroundColor: '#2563EB' }, '&.Mui-disabled': { backgroundColor: colors.border, color: colors.textHint } }}>
          저장하기
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ── CategoryFilterBar ─────────────────────────────────────────
const CategoryFilterBar = ({ posts, activeCategory, onChange, colors }) => {
  const categories = ['전체', ...new Set(posts.map(p => p.tag).filter(Boolean))];
  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', px: 2.5, py: 1.5, borderBottom: `1px solid ${colors.border}` }}>
      {categories.map(cat => (
        <Box key={cat} onClick={() => onChange(cat)}
          sx={{
            px: 1.5, py: 0.4, borderRadius: 10, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.15s',
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

const PostGrid = ({ posts, onPostClick }) => (
  <Grid container spacing={1.5}>
    {posts.map((post) => {
      const isReel = post.image && /\.(mp4|webm|mov)(\?|$)/i.test(post.image);
      const views = post.views ?? 0;
      return (
        <Grid item xs={4} key={post.id}>
          <Box onClick={() => onPostClick(post.id)}
            sx={{
              position: 'relative', cursor: 'pointer', overflow: 'hidden',
              borderRadius: 1.5, border: '1px solid #E2E8F0', aspectRatio: '1 / 1',
              '&:hover .overlay': { opacity: 1 },
              '&:hover img, &:hover .default-img, &:hover video': { filter: 'brightness(0.55)' },
            }}>

            {/* 썸네일 */}
            {isReel ? (
              <Box component="video" src={post.image} muted playsInline
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'filter 0.2s', pointerEvents: 'none' }} />
            ) : (
              <Box component={post.image ? 'img' : 'div'} src={post.image || undefined}
                className={post.image ? '' : 'default-img'}
                sx={{
                  width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'filter 0.2s',
                  ...(post.image ? {} : { backgroundImage: `url(${API}/uploads/post/defaultImg.png)`, backgroundSize: 'cover', backgroundPosition: 'center' })
                }}
              />
            )}

            {isReel && (
              <Box sx={{ position: 'absolute', top: 6, right: 6, color: '#fff', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7))' }}>
                <Videocam sx={{ fontSize: 18 }} />
              </Box>
            )}

            <Box className="overlay" sx={{ position: 'absolute', inset: 0, opacity: 0, transition: 'opacity 0.2s' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Favorite sx={{ fontSize: 22, color: '#fff' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{post.likes}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <ChatBubbleOutline sx={{ fontSize: 22, color: '#fff' }} />
                  <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{post.commentCount}</Typography>
                </Box>
              </Box>
              {views > 0 && (
                <Box sx={{ position: 'absolute', bottom: 6, left: 6, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                  {isReel
                    ? <Videocam sx={{ fontSize: 13, color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />
                    : <Visibility sx={{ fontSize: 13, color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }} />
                  }
                  <Typography sx={{ color: '#fff', fontSize: '0.72rem', fontWeight: 700, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))' }}>
                    {views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      );
    })}
  </Grid>
);

const PostList = ({ posts, onPostClick, colors }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
    {posts.map((post) => (
      <Box key={post.id} onClick={() => onPostClick(post.id)} sx={{
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2,
        overflow: 'hidden', cursor: 'pointer', gap: 0,
        transition: 'border-color 0.2s, box-shadow 0.2s',
        '&:hover': { borderColor: colors.borderFocus, boxShadow: '0 4px 16px rgba(15,23,42,0.06)' },
        '&:hover .list-thumb': { filter: 'brightness(0.55)' },
      }}>
        <Box sx={{ position: 'relative', width: 80, height: 80, flexShrink: 0, overflow: 'hidden' }}>
          {post.image
            ? <Box component="img" src={post.image} className="list-thumb" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'filter 0.2s' }} />
            : <Box className="list-thumb" sx={{ width: '100%', height: '100%', transition: 'filter 0.2s', backgroundImage: `url(${API}/uploads/post/defaultImg.png)`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          }
        </Box>
        <Box sx={{ flex: 1, px: 2, py: 1.5, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: colors.textPrimary, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {post.title}
          </Typography>
        </Box>
      </Box>
    ))}
  </Box>
);

// ── StatBadge / IconTabBar ────────────────────────────────────
const StatBadge = ({ value, label, onClick, colors }) => (
  <Box onClick={onClick} sx={{ textAlign: 'center', cursor: onClick ? 'pointer' : 'default', px: 2, '&:hover .sv': { color: onClick ? '#2563EB' : colors.textPrimary } }}>
    <Typography className="sv" sx={{ fontWeight: 800, fontSize: '1.2rem', color: colors.textPrimary, lineHeight: 1, transition: 'color 0.15s' }}>{value}</Typography>
    <Typography sx={{ color: colors.textHint, fontSize: '0.72rem', mt: 0.2, fontWeight: 500 }}>{label}</Typography>
  </Box>
);

const IconTabBar = ({ activeTab, onChange, colors }) => {
  const tabs = [
    { icon: <GridOn />, label: '게시물' },
    { icon: <Bookmarks />, label: '북마크' },
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
        left: `${(activeTab / 3) * 100}%`,
        width: '33.333%', height: 2,
        backgroundColor: colors.textPrimary, borderRadius: '2px 2px 0 0',
        transition: 'left 0.28s cubic-bezier(0.4,0,0.2,1)',
      }} />
    </Box>
  );
};

// ── Main Mypage ───────────────────────────────────────────────
export default function Mypage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
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
          @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `,
      },
    },
  });

  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [taggedPosts] = useState([]);
  const [editOpen, setEditOpen] = useState(false);
  const [followModal, setFollowModal] = useState({ open: false, tab: 0 });
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState('grid');
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [sortAnchor, setSortAnchor] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [headerBg, setHeaderBg] = useState('linear-gradient(135deg,#0F172A 0%,#2563EB 60%,#7C3AED 100%)');
  const [activeCategory, setActiveCategory] = useState('전체');

  const updateHeaderBg = useCallback(async (avatarSrc) => {
    if (!avatarSrc) { setHeaderBg('linear-gradient(135deg,#0F172A 0%,#2563EB 60%,#7C3AED 100%)'); return; }
    const color = await extractDominantColor(avatarSrc);
    if (color) setHeaderBg(`linear-gradient(135deg,#0F172A 0%,${color} 55%,#1E293B 100%)`);
  }, []);

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    setActiveCategory('전체');
    setActiveTab(newTab);
  };

  const getSortedPosts = useCallback((list) => {
    return [...list].sort((a, b) => {
      if (sortOrder === 'likes') return (b.likes ?? 0) - (a.likes ?? 0);
      const dateA = new Date(a.CREATED_AT || 0);
      const dateB = new Date(b.CREATED_AT || 0);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [sortOrder]);

  const currentPosts = (() => {
    const base = activeTab === 0 ? getSortedPosts(posts) : activeTab === 1 ? getSortedPosts(bookmarks) : taggedPosts;
    return activeCategory === '전체' ? base : base.filter(p => p.tag === activeCategory);
  })();

  const handleSaveProfile = (updated) => {
    setUser(updated);
    updateHeaderBg(updated.avatar);
    setToast({ open: true, message: '프로필이 저장되었습니다.', severity: 'success' });
  };

  const handlePostClick = (postId) => { navigate(`/post/${postId}`); };
  const handleFollowChange = (delta) => { setUser(u => u ? { ...u, following: Math.max(0, u.following + delta) } : u); };

  const fetchBookmarks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/user/bookmarks`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) {
        setBookmarks((data.list || []).map(p => ({
          ...p, id: p.id || p.POST_ID, title: p.title || p.TITLE || '',
          tag: p.tag || 'General', likes: p.likes ?? 0, commentCount: p.commentCount ?? 0,
          image: p.images?.trim() ? (p.images.trim().startsWith('http') ? p.images.trim() : `${API}${p.images.trim()}`) : null, views: p.views ?? 0,
        })));
      }
    } catch (err) { console.error('북마크 로드 실패:', err); }
  }, [token]);

  useEffect(() => {
    const fetchMypageData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API}/user/mypage/data`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error('서버 응답 오류');
        const data = await res.json();
        if (data.success) {
          const avatarUrl = data.user.AVATAR ? `${API}${data.user.AVATAR}` : null;
          setUser({
            name: data.user.NICKNAME || '사용자',
            handle: `@${data.user.NICKNAME || 'user'}`,
            role: data.user.BIO_SHORT || '',
            bio: data.user.BIO || '',
            github: data.user.GITHUB || '',
            website: data.user.WEBSITE || '',
            avatar: avatarUrl,
            postCount: data.posts.length,
            followers: data.user.FOLLOWER_CNT ?? 0,
            following: data.user.FOLLOWING_CNT ?? 0,
            isPrivate: data.user.IS_PRIVATE === 'Y',
          });
          updateHeaderBg(avatarUrl);
          setPosts((data.posts || []).map(p => ({
            ...p, id: p.id || p.POST_ID, title: p.title || p.TITLE || '',
            tag: p.tag || 'General', likes: p.likes ?? 0, commentCount: p.commentCount ?? 0,
            image: p.images?.trim() ? (p.images.trim().startsWith('http') ? p.images.trim() : `${API}${p.images.trim()}`) : null, views: p.views ?? 0,
          })));
        }
      } catch (err) { console.error('데이터 로드 실패:', err); } finally { setLoading(false); }
    };
    if (token) { fetchMypageData(); fetchBookmarks(); }
    else navigate('/');
  }, [token, navigate, fetchBookmarks, updateHeaderBg]);

  useEffect(() => {
    const handler = (e) => { setUser(prev => ({ ...prev, avatar: e.detail.avatar })); };
    window.addEventListener('avatarUpdated', handler);
    return () => window.removeEventListener('avatarUpdated', handler);
  }, []);

  if (loading || !user) {
    return (
      <ThemeProvider theme={theme}><CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: colors.bg }}><CircularProgress /></Box>
      </ThemeProvider>
    );
  }

  const sortLabel = sortOrder === 'desc' ? '최신순' : sortOrder === 'asc' ? '오래된순' : '좋아요순';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: colors.bg }}>

        {/* 상단 네비 */}
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 100,
          backgroundColor: mode === 'dark' ? 'rgba(15,17,23,0.9)' : 'rgba(248,250,252,0.9)',
          backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.border}`
        }}>
          <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 1.5, display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => navigate('/feed')} sx={{ color: colors.textMuted }}><ArrowBack sx={{ fontSize: 20 }} /></IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: colors.textPrimary }}>{user.name}</Typography>
              {user.isPrivate && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, backgroundColor: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 1, px: 0.7, py: 0.25 }}>
                  <Lock sx={{ fontSize: 10, color: colors.textMuted }} />
                  <Typography sx={{ fontSize: '0.62rem', color: colors.textMuted, fontWeight: 700 }}>비공개</Typography>
                </Box>
              )}
            </Box>
            <Box sx={{ flex: 1 }} />
            <Typography sx={{ color: colors.textHint, fontSize: '0.78rem' }}>게시물 {user.postCount}</Typography>
          </Box>
        </Box>

        <Box sx={{ maxWidth: 800, mx: 'auto', px: { xs: 2, md: 4 }, py: 4 }}>

          {/* 프로필 카드 */}
          <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2.5, p: { xs: 2.5, md: 3.5 }, mb: 3 }}>
            <Box sx={{
              height: 80, borderRadius: 1.5, background: headerBg, mb: -4, position: 'relative', overflow: 'hidden', transition: 'background 1s ease',
              '&::after': { content: '""', position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%,rgba(255,255,255,0.1) 0%,transparent 60%)' }
            }} />

            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', mb: 2 }}>
              <AvatarView avatarSrc={user.avatar} name={user.name} size={88} colors={colors} />
              <Button startIcon={<Edit sx={{ fontSize: 14 }} />} onClick={() => setEditOpen(true)}
                sx={{ border: `1px solid ${colors.border}`, color: colors.textPrimary, backgroundColor: colors.paper, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem', px: 2, py: 0.8, borderRadius: 1.5, boxShadow: 'none', '&:hover': { borderColor: colors.textPrimary, backgroundColor: colors.hover }, transition: 'all 0.2s' }}>
                프로필 편집
              </Button>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.2 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: colors.textPrimary, lineHeight: 1.2 }}>{user.name}</Typography>
                {user.isPrivate && <Lock sx={{ fontSize: 15, color: colors.textHint }} />}
              </Box>
              <Typography sx={{ color: colors.textHint, fontSize: '0.82rem' }}>{user.handle}</Typography>
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
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover .lt': { color: '#2563EB' } }} onClick={() => window.open(`https://github.com/${user.github.replace('@', '')}`, '_blank')}>
                  <GitHub sx={{ fontSize: 14, color: colors.textHint }} />
                  <Typography className="lt" sx={{ fontSize: '0.78rem', color: colors.textMuted, fontWeight: 600, transition: 'color 0.15s' }}>{user.github}</Typography>
                </Box>
              )}
              {user.website && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', '&:hover .lt': { color: '#2563EB' } }} onClick={() => window.open(user.website, '_blank')}>
                  <Language sx={{ fontSize: 14, color: colors.textHint }} />
                  <Typography className="lt" sx={{ fontSize: '0.78rem', color: colors.textMuted, fontWeight: 600, transition: 'color 0.15s' }}>{user.website}</Typography>
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

          {/* 게시물 탭 영역 */}
          <Box sx={{ backgroundColor: colors.paper, border: `1px solid ${colors.border}`, borderRadius: 2.5, overflow: 'hidden' }}>
            <IconTabBar activeTab={activeTab} onChange={handleTabChange} colors={colors} />
            <CategoryFilterBar
              posts={activeTab === 0 ? posts : activeTab === 1 ? bookmarks : taggedPosts}
              activeCategory={activeCategory}
              onChange={setActiveCategory}
              colors={colors}
            />

            {/* 정렬 + 뷰모드 */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: `1px solid ${colors.border}` }}>
              <Typography sx={{ fontSize: '0.73rem', color: colors.textHint, fontWeight: 600 }}>
                {activeTab === 0 ? `${posts.length}개` : activeTab === 1 ? `${bookmarks.length}개` : `${taggedPosts.length}개`}
              </Typography>
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Button size="small" startIcon={<SortRounded sx={{ fontSize: 15 }} />}
                  onClick={(e) => setSortAnchor(e.currentTarget)}
                  sx={{ fontSize: '0.72rem', color: colors.textMuted, textTransform: 'none', fontWeight: 600, px: 1.2, py: 0.5, borderRadius: 1.5, border: `1px solid ${colors.border}`, '&:hover': { borderColor: colors.borderFocus, backgroundColor: colors.hover } }}>
                  {sortLabel}
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
                <IconButton size="small" onClick={() => setViewMode('grid')} sx={{ color: viewMode === 'grid' ? colors.textPrimary : colors.border, backgroundColor: viewMode === 'grid' ? colors.inputBg : 'transparent', borderRadius: 1 }}>
                  <GridOn sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton size="small" onClick={() => setViewMode('list')} sx={{ color: viewMode === 'list' ? colors.textPrimary : colors.border, backgroundColor: viewMode === 'list' ? colors.inputBg : 'transparent', borderRadius: 1 }}>
                  <ViewList sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>
            </Box>

            <Box sx={{ p: 2.5 }}>
              {currentPosts.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography sx={{ color: colors.textHint, fontSize: '0.88rem' }}>
                    {activeTab === 0 ? '아직 게시물이 없습니다.' : activeTab === 1 ? '북마크한 게시물이 없습니다.' : '태그된 게시물이 없습니다.'}
                  </Typography>
                </Box>
              ) : viewMode === 'grid' ? (
                <PostGrid posts={currentPosts} onPostClick={handlePostClick} />
              ) : (
                <PostList posts={currentPosts} onPostClick={handlePostClick} colors={colors} />
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      <EditProfileDialog open={editOpen} user={user} token={token} onClose={() => setEditOpen(false)} onSave={handleSaveProfile} colors={colors} />
      <FollowModal open={followModal.open} initialTab={followModal.tab} token={token}
        onClose={() => setFollowModal(m => ({ ...m, open: false }))} onFollowChange={handleFollowChange} colors={colors} />

      <Snackbar open={toast.open} autoHideDuration={2500} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} icon={<Check fontSize="inherit" />} sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}