import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Switch, Avatar, Button, IconButton,
  CircularProgress, Snackbar, Alert, InputBase, Divider,
  createTheme, ThemeProvider, CssBaseline, List, ListItem,
  ListItemAvatar, ListItemText, ToggleButton, ToggleButtonGroup,
  Dialog, DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  Search, NotificationsNoneOutlined, LockOutlined,
  BlockOutlined, PeopleOutlined, TagOutlined, VisibilityOffOutlined,
  FavoriteBorderOutlined, HelpOutlineOutlined, ChevronRight,
  Check, Close, PersonOffOutlined, ArrowBack, MailOutlined,
  GroupOutlined,
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
  shape: { borderRadius: 8 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
      `,
    },
    MuiSwitch: {
      styleOverrides: {
        root: { width: 44, height: 24, padding: 0 },
        switchBase: {
          padding: 2,
          '&.Mui-checked': {
            transform: 'translateX(20px)', color: '#fff',
            '& + .MuiSwitch-track': { backgroundColor: '#0F172A', opacity: 1 },
          },
        },
        thumb: { width: 20, height: 20, boxShadow: 'none' },
        track: { borderRadius: 12, backgroundColor: '#CBD5E1', opacity: 1 },
      },
    },
  },
});

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

// ── 메뉴 구조 ─────────────────────────────────────────────────
const MENU = [
  {
    groupLabel: '내 콘텐츠를 볼 수 있는 사람',
    items: [
      { id: 'account_privacy', label: '계정 공개 범위', icon: <LockOutlined sx={{ fontSize: 20 }} /> },
      { id: 'blocked', label: '차단된 계정', icon: <BlockOutlined sx={{ fontSize: 20 }} /> },
    ],
  },
  {
    groupLabel: '알림 설정',
    items: [
      { id: 'notifications', label: '알림', icon: <NotificationsNoneOutlined sx={{ fontSize: 20 }} /> },
    ],
  },
  {
    groupLabel: '다른 사람이 나와 소통할 수 있는 방법',
    items: [
      { id: 'messaging', label: '메시지 및 그룹 채팅', icon: <MailOutlined sx={{ fontSize: 20 }} /> },
      { id: 'tagging', label: '태그 및 언급', icon: <TagOutlined sx={{ fontSize: 20 }} /> },
    ],
  },
  {
    groupLabel: '내가 볼 수 있는 내용',
    items: [
      { id: 'muted', label: '게시물을 숨긴 계정', icon: <VisibilityOffOutlined sx={{ fontSize: 20 }} /> },
      { id: 'likes', label: '좋아요 및 공유 수', icon: <FavoriteBorderOutlined sx={{ fontSize: 20 }} /> },
    ],
  },
  {
    groupLabel: '더 많은 정보 및 지원',
    items: [
      { id: 'help', label: '도움말', icon: <HelpOutlineOutlined sx={{ fontSize: 20 }} /> },
    ],
  },
];

// ── RangeSelect ───────────────────────────────────────────────
const RangeSelect = ({ label, desc, settingKey, value, onChange }) => (
  <Box sx={{ py: 2.5, borderBottom: '1px solid #F1F5F9' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2 }}>
      <Box>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', mb: 0.4 }}>{label}</Typography>
        {desc && <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>{desc}</Typography>}
      </Box>
    </Box>
    <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
      {[['EVERYONE', '모든 사람'], ['FOLLOWING', '팔로잉'], ['NONE', '없음']].map(([val, lbl]) => (
        <Box key={val} onClick={() => onChange(settingKey, val)}
          sx={{
            px: 2, py: 0.7, borderRadius: 10, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            transition: 'all 0.15s',
            border: '1.5px solid',
            ...(value === val
              ? { backgroundColor: '#0F172A', color: '#fff', borderColor: '#0F172A' }
              : { backgroundColor: '#fff', color: '#64748B', borderColor: '#E2E8F0', '&:hover': { borderColor: '#CBD5E1', backgroundColor: '#F8FAFC' } }
            ),
          }}>
          {lbl}
        </Box>
      ))}
    </Box>
  </Box>
);

// ── SwitchRow ─────────────────────────────────────────────────
const SwitchRow = ({ label, desc, settingKey, value, onChange, last }) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', py: 2.5, gap: 3, borderBottom: last ? 'none' : '1px solid #F1F5F9' }}>
    <Box>
      <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', mb: 0.3 }}>{label}</Typography>
      {desc && <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', lineHeight: 1.5 }}>{desc}</Typography>}
    </Box>
    <Switch checked={value === 'Y'} onChange={(e) => onChange(settingKey, e.target.checked ? 'Y' : 'N')} sx={{ flexShrink: 0, mt: 0.3 }} />
  </Box>
);

// ── 패널: 계정 공개 범위 ──────────────────────────────────────
const AccountPrivacyPanel = ({ settings, onChange }) => (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', mb: 3 }}>계정 공개 범위</Typography>
    <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
      <Box sx={{ px: 3, py: 2.5 }}>
        <SwitchRow label="비공개 계정" settingKey="is_private" value={settings.is_private} onChange={onChange} last />
      </Box>
    </Box>
    <Box sx={{ mt: 2.5, px: 0.5 }}>
      <Typography sx={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.75 }}>
        계정이 공개 상태인 경우 모든 사람이 프로필과 게시물을 볼 수 있습니다.
      </Typography>
      <Typography sx={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.75, mt: 1 }}>
        계정이 비공개 상태인 경우 승인한 팔로워만 공유하는 콘텐츠를 볼 수 있습니다. 프로필 사진, 사용자 이름 등 프로필의 특정 정보는 모든 사람에게 공개됩니다.
      </Typography>
    </Box>
  </Box>
);

// ── 패널: 알림 ───────────────────────────────────────────────
const NotificationsPanel = ({ settings, onChange }) => (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', mb: 3 }}>알림</Typography>
    <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', px: 3 }}>
      <SwitchRow label="댓글 알림" desc="내 게시물에 댓글이 달릴 때" settingKey="noti_comment" value={settings.noti_comment} onChange={onChange} />
      <SwitchRow label="좋아요 알림" desc="내 게시물에 좋아요가 눌릴 때" settingKey="noti_like" value={settings.noti_like} onChange={onChange} />
      <SwitchRow label="팔로우 알림" desc="새로운 팔로워가 생길 때" settingKey="noti_follow" value={settings.noti_follow} onChange={onChange} />
      <SwitchRow label="메시지 알림" desc="새 메시지를 받을 때" settingKey="noti_message" value={settings.noti_message} onChange={onChange} last />
    </Box>
  </Box>
);

// ── 패널: 메시지 및 그룹 채팅 ────────────────────────────────
const MessagingPanel = ({ settings, onChange }) => (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', mb: 3 }}>메시지 및 그룹 채팅</Typography>
    <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', px: 3 }}>
      <RangeSelect label="메시지를 보낼 수 있는 사람" desc="나에게 직접 메시지를 보낼 수 있는 범위를 설정합니다" settingKey="msg_allow" value={settings.msg_allow || 'EVERYONE'} onChange={onChange} />
      <RangeSelect label="그룹 채팅에 추가할 수 있는 사람" desc="나를 그룹 채팅에 초대할 수 있는 범위를 설정합니다" settingKey="group_allow" value={settings.group_allow || 'EVERYONE'} onChange={onChange} />
    </Box>
  </Box>
);

// ── 패널: 태그 및 언급 ───────────────────────────────────────
const TaggingPanel = ({ settings, onChange }) => (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', mb: 3 }}>태그 및 언급</Typography>
    <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', px: 3 }}>
      <RangeSelect label="나를 태그할 수 있는 사람" desc="게시물이나 댓글에서 나를 태그할 수 있는 범위입니다" settingKey="tag_allow" value={settings.tag_allow || 'EVERYONE'} onChange={onChange} />
      <RangeSelect label="나를 언급할 수 있는 사람" desc="@를 사용해 나를 언급할 수 있는 범위입니다" settingKey="mention_allow" value={settings.mention_allow || 'EVERYONE'} onChange={onChange} />
    </Box>
  </Box>
);

// ── 패널: 좋아요 및 공유 수 ──────────────────────────────────
const LikesPanel = ({ settings, onChange }) => (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', mb: 3 }}>좋아요 및 공유 수</Typography>
    <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden', px: 3 }}>
      <SwitchRow label="좋아요 및 공유 수 숨기기" desc="모든 게시물의 좋아요·공유 수가 표시되지 않습니다" settingKey="hide_like_count" value={settings.hide_like_count} onChange={onChange} last />
    </Box>
    <Box sx={{ mt: 2.5, px: 0.5 }}>
      <Typography sx={{ fontSize: '0.82rem', color: '#64748B', lineHeight: 1.75 }}>
        이 설정을 켜면 다른 사람들이 내 게시물의 좋아요 수를 볼 수 없습니다. 나는 여전히 확인할 수 있습니다.
      </Typography>
    </Box>
  </Box>
);

// ── 패널: 도움말 ─────────────────────────────────────────────
const HelpPanel = () => (
  <Box>
    <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', mb: 3 }}>도움말</Typography>
    <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
      {[
        { label: '도움말 센터', desc: '자주 묻는 질문과 가이드를 확인하세요', href: '#' },
        { label: '문의하기', desc: '문제가 있으신가요? 직접 문의해 주세요', href: '#' },
        { label: '이용 약관', href: '#' },
        { label: '개인정보 처리방침', href: '#' },
      ].map((item, idx, arr) => (
        <Box key={item.label} onClick={() => window.open(item.href, '_blank')}
          sx={{ px: 3, py: 2, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: idx < arr.length - 1 ? '1px solid #F1F5F9' : 'none', '&:hover': { backgroundColor: '#F8FAFC' }, transition: 'background 0.15s' }}>
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A' }}>{item.label}</Typography>
            {item.desc && <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8', mt: 0.2 }}>{item.desc}</Typography>}
          </Box>
          <ChevronRight sx={{ fontSize: 18, color: '#CBD5E1' }} />
        </Box>
      ))}
    </Box>
  </Box>
);

// ── 패널: 차단된 계정 ────────────────────────────────────────
const BlockedPanel = ({ token }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [search, setSearch] = useState('');
  const [confirmUser, setConfirmUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/user/blocked`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setList(data.list || []);
      } catch { } finally { setLoading(false); }
    })();
  }, [token]);

  const handleUnblock = async (userId) => {
    setPendingId(userId);
    try {
      const res = await fetch(`${API}/user/block/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setList(prev => prev.filter(u => u.userId !== userId));
    } catch { } finally { setPendingId(null); setConfirmUser(null); }
  };

  const filtered = list.filter(u => u.nickname?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', mb: 3 }}>차단된 계정</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 1.5, py: 0.9, mb: 2.5 }}>
        <Search sx={{ fontSize: 16, color: '#94A3B8' }} />
        <InputBase fullWidth placeholder="검색" value={search} onChange={e => setSearch(e.target.value)} sx={{ fontSize: '0.88rem', color: '#0F172A' }} />
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={28} sx={{ color: '#CBD5E1' }} /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <BlockOutlined sx={{ fontSize: 40, color: '#E2E8F0', mb: 1.5 }} />
          <Typography sx={{ color: '#94A3B8', fontSize: '0.88rem' }}>{search ? '검색 결과가 없습니다.' : '차단된 계정이 없습니다.'}</Typography>
        </Box>
      ) : (
        <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {filtered.map((u, idx) => (
              <ListItem key={u.userId} sx={{ px: 2.5, py: 1.5, borderBottom: idx < filtered.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar src={u.avatar ? `${API}${u.avatar}` : undefined} sx={{ width: 38, height: 38, backgroundColor: '#0F172A', fontSize: '0.9rem', fontWeight: 800, border: '1.5px solid #E2E8F0' }}>{getInitial(u.nickname)}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{u.nickname}</Typography>} secondary={u.bioShort ? <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>{u.bioShort}</Typography> : null} sx={{ my: 0 }} />
                <Button size="small" onClick={() => setConfirmUser(u)} disabled={pendingId === u.userId}
                  sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 2, py: 0.6, textTransform: 'none', '&:hover': { borderColor: '#0F172A', color: '#0F172A' } }}>
                  {pendingId === u.userId ? <CircularProgress size={10} /> : '차단 해제'}
                </Button>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
      <Dialog open={!!confirmUser} onClose={() => setConfirmUser(null)}
        PaperProps={{ sx: { borderRadius: 2.5, minWidth: 300, boxShadow: '0 24px 64px rgba(15,23,42,0.12)' } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>차단 해제</DialogTitle>
        <DialogContent sx={{ px: 3, pt: 0, pb: 1 }}><Typography sx={{ color: '#475569', fontSize: '0.88rem' }}><strong>{confirmUser?.nickname}</strong> 님의 차단을 해제하시겠습니까?</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmUser(null)} sx={{ color: '#64748B', fontWeight: 700, textTransform: 'none' }}>취소</Button>
          <Button onClick={() => handleUnblock(confirmUser?.userId)} variant="contained"
            sx={{ backgroundColor: '#0F172A', color: '#fff', fontWeight: 800, textTransform: 'none', borderRadius: 1.5, boxShadow: 'none', px: 2.5, '&:hover': { backgroundColor: '#2563EB' } }}>해제</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// ── 패널: 뮤트 ───────────────────────────────────────────────
const MutedPanel = ({ token }) => {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingId, setPendingId] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/user/muted`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setList(data.list || []);
      } catch { } finally { setLoading(false); }
    })();
  }, [token]);

  const handleUnmute = async (userId) => {
    setPendingId(userId);
    try {
      const res = await fetch(`${API}/user/mute/${userId}`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setList(prev => prev.filter(u => u.userId !== userId));
    } catch { } finally { setPendingId(null); }
  };

  const filtered = list.filter(u => u.nickname?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', color: '#0F172A', mb: 3 }}>게시물을 숨긴 계정</Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 1.5, py: 0.9, mb: 2.5 }}>
        <Search sx={{ fontSize: 16, color: '#94A3B8' }} />
        <InputBase fullWidth placeholder="검색" value={search} onChange={e => setSearch(e.target.value)} sx={{ fontSize: '0.88rem', color: '#0F172A' }} />
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress size={28} sx={{ color: '#CBD5E1' }} /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <PersonOffOutlined sx={{ fontSize: 40, color: '#E2E8F0', mb: 1.5 }} />
          <Typography sx={{ color: '#94A3B8', fontSize: '0.88rem' }}>{search ? '검색 결과가 없습니다.' : '숨김 처리한 계정이 없습니다.'}</Typography>
        </Box>
      ) : (
        <Box sx={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 2, overflow: 'hidden' }}>
          <List disablePadding>
            {filtered.map((u, idx) => (
              <ListItem key={u.userId} sx={{ px: 2.5, py: 1.5, borderBottom: idx < filtered.length - 1 ? '1px solid #F8FAFC' : 'none' }}>
                <ListItemAvatar sx={{ minWidth: 48 }}>
                  <Avatar src={u.avatar ? `${API}${u.avatar}` : undefined} sx={{ width: 38, height: 38, backgroundColor: '#0F172A', fontSize: '0.9rem', fontWeight: 800, border: '1.5px solid #E2E8F0' }}>{getInitial(u.nickname)}</Avatar>
                </ListItemAvatar>
                <ListItemText primary={<Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>{u.nickname}</Typography>} secondary={u.bioShort ? <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>{u.bioShort}</Typography> : null} sx={{ my: 0 }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button size="small" onClick={() => navigate(`/profile/${u.nickname}`)}
                    sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563EB', border: '1px solid #DBEAFE', borderRadius: 1.5, px: 2, py: 0.6, textTransform: 'none', '&:hover': { backgroundColor: '#EFF6FF' } }}>
                    프로필 보기
                  </Button>
                  <Button size="small" onClick={() => handleUnmute(u.userId)} disabled={pendingId === u.userId}
                    sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 2, py: 0.6, textTransform: 'none', '&:hover': { borderColor: '#0F172A', color: '#0F172A' } }}>
                    {pendingId === u.userId ? <CircularProgress size={10} /> : '해제'}
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
};

// ── Main Settings ─────────────────────────────────────────────
export default function Settings() {
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const [settings, setSettings] = useState({
    is_private: 'N',
    noti_comment: 'Y', noti_like: 'Y', noti_follow: 'Y', noti_message: 'Y',
    msg_allow: 'EVERYONE', group_allow: 'EVERYONE',
    tag_allow: 'EVERYONE', mention_allow: 'EVERYONE',
    hide_like_count: 'N',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState('account_privacy');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!token) { navigate('/'); return; }
    (async () => {
      try {
        const res = await fetch(`${API}/user/settings`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setSettings(prev => ({ ...prev, ...data.settings }));
      } catch { } finally { setLoading(false); }
    })();
  }, [token, navigate]);

  const handleChange = useCallback(async (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setSaving(true);
    try {
      const res = await fetch(`${API}/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      setToast({ open: true, message: '저장되었습니다.', severity: 'success' });
    } catch {
      setToast({ open: true, message: '저장에 실패했습니다.', severity: 'error' });
    } finally { setSaving(false); }
  }, [token]);

  const searchLower = search.toLowerCase();
  const filteredMenu = MENU.map(group => ({
    ...group,
    items: group.items.filter(item =>
      !search || item.label.toLowerCase().includes(searchLower) || group.groupLabel.toLowerCase().includes(searchLower)
    ),
  })).filter(g => g.items.length > 0);

  const renderPanel = () => {
    switch (activeId) {
      case 'account_privacy': return <AccountPrivacyPanel settings={settings} onChange={handleChange} />;
      case 'notifications':   return <NotificationsPanel settings={settings} onChange={handleChange} />;
      case 'messaging':       return <MessagingPanel settings={settings} onChange={handleChange} />;
      case 'tagging':         return <TaggingPanel settings={settings} onChange={handleChange} />;
      case 'likes':           return <LikesPanel settings={settings} onChange={handleChange} />;
      case 'blocked':         return <BlockedPanel token={token} />;
      case 'muted':           return <MutedPanel token={token} />;
      case 'help':            return <HelpPanel />;
      default:                return null;
    }
  };

  if (loading) return (
    <ThemeProvider theme={theme}><CssBaseline />
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    </ThemeProvider>
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>

        {/* ── 사이드바 ── */}
        <Box sx={{
          width: 300, flexShrink: 0, borderRight: '1px solid #E2E8F0',
          backgroundColor: '#fff', display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          {/* 사이드바 헤더 */}
          <Box sx={{ px: 2.5, pt: 4, pb: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
              <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: '#64748B', p: 0.5 }}>
                <ArrowBack sx={{ fontSize: 20 }} />
              </IconButton>
              <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A' }}>설정</Typography>
              {saving && <CircularProgress size={14} sx={{ color: '#CBD5E1', ml: 'auto' }} />}
            </Box>

            {/* 검색 */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 1.5, px: 1.5, py: 0.8 }}>
              <Search sx={{ fontSize: 15, color: '#94A3B8', flexShrink: 0 }} />
              <InputBase fullWidth placeholder="검색" value={search} onChange={e => setSearch(e.target.value)}
                sx={{ fontSize: '0.85rem', color: '#0F172A' }} />
              {search && (
                <IconButton size="small" onClick={() => setSearch('')} sx={{ p: 0.2, color: '#94A3B8' }}>
                  <Close sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: '#F1F5F9' }} />

          {/* 메뉴 */}
          <Box sx={{ flex: 1, px: 1.5, py: 1.5, overflowY: 'auto' }}>
            {filteredMenu.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Typography sx={{ color: '#94A3B8', fontSize: '0.82rem' }}>검색 결과가 없습니다.</Typography>
              </Box>
            ) : (
              filteredMenu.map((group) => (
                <Box key={group.groupLabel} sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.68rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', px: 1, mb: 0.5 }}>
                    {group.groupLabel}
                  </Typography>
                  {group.items.map((item) => {
                    const isActive = activeId === item.id;
                    return (
                      <Box key={item.id} onClick={() => setActiveId(item.id)}
                        sx={{
                          display: 'flex', alignItems: 'center', gap: 1.5,
                          px: 1.5, py: 1.6, borderRadius: 1.5, cursor: 'pointer',
                          backgroundColor: isActive ? '#F1F5F9' : 'transparent',
                          color: isActive ? '#0F172A' : '#475569',
                          fontWeight: isActive ? 700 : 500,
                          transition: 'all 0.15s',
                          position: 'relative',
                          '&:hover': { backgroundColor: isActive ? '#F1F5F9' : '#F8FAFC', color: '#0F172A' },
                          '&::before': isActive ? {
                            content: '""', position: 'absolute', left: 0, top: '18%', bottom: '18%',
                            width: 3, borderRadius: '0 3px 3px 0', backgroundColor: '#0F172A',
                          } : {},
                        }}>
                        <Box sx={{ color: 'inherit', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          {item.icon}
                        </Box>
                        <Typography sx={{ fontSize: '0.88rem', fontWeight: 'inherit', color: 'inherit', lineHeight: 1 }}>
                          {item.label}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* ── 오른쪽 콘텐츠 ── */}
        <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ width: '100%', maxWidth: 720, px: { xs: 3, md: 5 }, py: 5 }}>
          {renderPanel()}
        </Box>
        </Box>
      </Box>

      <Snackbar open={toast.open} autoHideDuration={2000} onClose={() => setToast(t => ({ ...t, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} icon={<Check fontSize="inherit" />}
          sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2, boxShadow: '0 4px 20px rgba(15,23,42,0.12)' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}