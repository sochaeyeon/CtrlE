import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemText, ListItemIcon, Box, Typography,
  CssBaseline, Avatar, Tooltip, Badge, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button,
  Popover, Switch,
} from '@mui/material';
import {
  HomeOutlined, Home, AddBoxOutlined, AddBox, LogoutOutlined,
  NotificationsNoneOutlined, Notifications,
  SearchOutlined, SettingsOutlined, Settings,
  ForumOutlined, Forum,
  Menu as MenuIcon,
  BarChartOutlined, BarChart,
  DarkModeOutlined, LightModeOutlined,
  SmartDisplayOutlined, SmartDisplay
} from '@mui/icons-material';
import NotificationSidebar from './NotificationSidebar';
import { useColorMode } from '../App';
import RegisterModal from './RegisterModal';

const API = 'http://localhost:3010';
const DRAWER_WIDTH = 245;
const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const MENU_ITEMS = [
  { text: '피드', icon: <HomeOutlined sx={{ fontSize: 28 }} />, activeIcon: <Home sx={{ fontSize: 28 }} />, path: '/feed' },
  { text: '탐색', icon: <SearchOutlined sx={{ fontSize: 28 }} />, activeIcon: <SearchOutlined sx={{ fontSize: 28 }} />, path: '/explore' },
  { text: '릴스', icon: <SmartDisplayOutlined sx={{ fontSize: 28 }} />, activeIcon: <SmartDisplay sx={{ fontSize: 28 }} />, path: '/reels' },
  { text: '메시지', icon: <ForumOutlined sx={{ fontSize: 26 }} />, activeIcon: <Forum sx={{ fontSize: 26 }} />, path: '/messages' },
  { id: 'noti', text: '알림', icon: <NotificationsNoneOutlined sx={{ fontSize: 28 }} />, activeIcon: <Notifications sx={{ fontSize: 28 }} /> },
  { id: 'register', text: '새 게시물', icon: <AddBoxOutlined sx={{ fontSize: 28 }} />, activeIcon: <AddBox sx={{ fontSize: 28 }} /> },
  { text: '내 활동', icon: <BarChartOutlined sx={{ fontSize: 28 }} />, activeIcon: <BarChart sx={{ fontSize: 28 }} />, path: '/myactivity' },
  { text: '설정', icon: <SettingsOutlined sx={{ fontSize: 28 }} />, activeIcon: <Settings sx={{ fontSize: 28 }} />, path: '/settings' },
];

// ─── NavItem ──────────────────────────────────────────────────────────────────
const NavItem = ({ item, isActive, isOpen, onClick, colors }) => {
  const baseIcon = isActive ? item.activeIcon : item.icon;

  // 1) 숫자 뱃지 (메시지 미확인 수)
  const iconWithBadge = item.badge
    ? <Badge badgeContent={item.badge} color="error">{baseIcon}</Badge>
    : baseIcon;

  // 2) 빨간 점 (알림 미확인)
  const iconFinal = item.hasDot
    ? (
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        {iconWithBadge}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: -2,
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#EF4444',
          border: '1.5px solid',
          borderColor: colors.paper,
        }} />
      </Box>
    )
    : iconWithBadge;

  return (
    <ListItem
      button
      component={item.path ? Link : 'div'}
      to={item.path || undefined}
      onClick={onClick}
      sx={{
        borderRadius: '12px',
        py: '10px',
        px: '12px',
        mb: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        color: colors.textPrimary,
        transition: 'background 0.12s ease',
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: colors.hover,
          '& .nav-icon': { transform: 'scale(1.05)' },
        },
        '&:active': { transform: 'scale(0.97)' },
      }}
    >
      <ListItemIcon
        className="nav-icon"
        sx={{
          minWidth: 0,
          width: 24,
          justifyContent: 'center',
          transition: 'transform 0.12s ease',
          color: 'inherit',
          flexShrink: 0,
        }}
      >
        {iconFinal}
      </ListItemIcon>

      <Typography sx={{
        ml: 2,
        fontSize: '0.9375rem',
        fontWeight: isActive ? 700 : 400,
        color: colors.textPrimary,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        opacity: isOpen ? 1 : 0,
        maxWidth: isOpen ? 160 : 0,
        transition: 'opacity 0.1s ease, max-width 0.18s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {item.text}
      </Typography>
    </ListItem>
  );
};

// ─── Menu (main) ──────────────────────────────────────────────────────────────
export default function Menu() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  const { mode, toggleColorMode } = useColorMode();
  const colors = {
    bg: mode === 'dark' ? '#0F1117' : '#F8FAFC',
    paper: mode === 'dark' ? '#1A1D27' : '#FFFFFF',
    border: mode === 'dark' ? '#2D3148' : '#E2E8F0',
    borderFocus: mode === 'dark' ? '#4B5280' : '#CBD5E1',
    textPrimary: mode === 'dark' ? '#F1F5F9' : '#0F172A',
    textSecondary: mode === 'dark' ? '#94A3B8' : '#64748B',
    hover: mode === 'dark' ? '#22253A' : '#F1F5F9',
  };

  const [isHovered, setIsHovered] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(
    () => localStorage.getItem('notiSidebarOpen') === 'true'
  );
  const [registerOpen, setRegisterOpen] = useState(false);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const [user, setUser] = useState({ name: '사용자', handle: '@user', avatar: null });

  // ─── 미확인 카운트 state ───────────────────────────────────────────────────
  const [unreadMsg, setUnreadMsg] = useState(0);       // 메시지 미확인 총합
  const [hasUnreadNoti, setHasUnreadNoti] = useState(false); // 알림 미확인 존재 여부

  const drawerOpen = isHovered && !notiOpen && !registerOpen;
  const drawerWidth = drawerOpen ? DRAWER_WIDTH : 72;

  // ─── 유저 정보 fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await fetch(`${API}/user/mypage/data`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success && data.user) {
          setUser({
            name: data.user.NICKNAME || '사용자',
            handle: `@${data.user.NICKNAME || 'user'}`,
            avatar: data.user.AVATAR ? `${API}${data.user.AVATAR}` : null,
          });
        }
      } catch (err) { console.error(err); }
    })();
  }, [token]);

  useEffect(() => {
    const handler = (e) => {
      setUser(prev => ({ ...prev, avatar: e.detail.avatar }));
    };
    window.addEventListener('avatarUpdated', handler);
    return () => window.removeEventListener('avatarUpdated', handler);
  }, []);

  // ─── 미확인 수 fetch (30초 폴링) ──────────────────────────────────────────
  const fetchUnreadCounts = useCallback(async () => {
    if (!token) return;
    try {
      // 메시지 미확인 수: 모든 방의 UNREAD_COUNT 합산
      const msgRes = await fetch(`${API}/messages/rooms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const msgData = await msgRes.json();
      if (msgData.success) {
        const total = msgData.rooms.reduce(
          (sum, r) => sum + (Number(r.UNREAD_COUNT) || 0), 0
        );
        setUnreadMsg(total);
      }

      // 알림 미확인 여부
      const notiRes = await fetch(`${API}/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const notiData = await notiRes.json();
      if (notiData.success) {
        setHasUnreadNoti(notiData.unread_count > 0);
      }
    } catch (err) {
      console.error('[fetchUnreadCounts]', err);
    }
  }, [token]);

  useEffect(() => {
    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 5000);
    return () => clearInterval(interval);
  }, [fetchUnreadCounts]);

  // ─── 채팅 페이지 진입 시 메시지 뱃지 즉시 제거 ──────────────────────────
  useEffect(() => {
    const handler = () => setUnreadMsg(0);
    window.addEventListener('messagesRead', handler);
    return () => window.removeEventListener('messagesRead', handler);
  }, []);

  // ─── 메뉴 클릭 ───────────────────────────────────────────────────────────
  const handleMenuClick = (item) => {
    if (item.id === 'noti') {
      setNotiOpen(true);
      localStorage.setItem('notiSidebarOpen', 'true');
      // 즉시 점 제거 후 서버 읽음 처리
      setHasUnreadNoti(false);
      fetch(`${API}/notifications/read`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(console.error);
    }
    if (item.id === 'register') setRegisterOpen(true);
  };

  const handleLogoutClick = (e) => { e.stopPropagation(); setMoreAnchorEl(null); setLogoutOpen(true); };
  const confirmLogout = () => { setLogoutOpen(false); localStorage.removeItem('accessToken'); navigate('/'); };

  // ─── MENU_ITEMS에 badge/hasDot 주입 ──────────────────────────────────────
  const menuItemsWithBadge = MENU_ITEMS.map(item => {
    if (item.path === '/messages') {
      return { ...item, badge: unreadMsg > 0 ? unreadMsg : null };
    }
    if (item.id === 'noti') {
      return { ...item, hasDot: hasUnreadNoti };
    }
    return item;
  });

  return (
    <>
      <CssBaseline />
      <Drawer
        variant="permanent"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        sx={{
          width: 72,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? DRAWER_WIDTH : 72,
            boxSizing: 'border-box',
            borderRight: `1px solid ${colors.border}`,
            backgroundColor: `${colors.paper} !important`,
            px: '12px',
            py: '8px',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
            overflow: 'hidden',
            transition: 'width 0.18s cubic-bezier(0.4,0,0.2,1)',
          },
        }}
      >
        {/* 로고 */}
        <Box sx={{ px: '12px', py: '24px', mb: '4px', display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <Box
            component={Link}
            to="/feed"
            sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: 2 }}
          >
            <Box sx={{
              width: 32, height: 32, borderRadius: 1.2,
              backgroundColor: colors.textPrimary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Typography sx={{ color: colors.paper, fontWeight: 900, fontSize: '0.75rem' }}>{'<>'}</Typography>
            </Box>
            <Typography sx={{
              color: colors.textPrimary, fontWeight: 800, fontSize: '1.3rem',
              whiteSpace: 'nowrap',
              opacity: drawerOpen ? 1 : 0,
              maxWidth: drawerOpen ? 120 : 0,
              overflow: 'hidden',
              transition: 'opacity 0.1s ease, max-width 0.18s cubic-bezier(0.4,0,0.2,1)',
            }}>CtrlE</Typography>
          </Box>
        </Box>

        {/* 메뉴 리스트 */}
        <Box sx={{ flex: 1 }}>
          <List disablePadding>
            {menuItemsWithBadge.map(item => (
              <NavItem
                key={item.text}
                item={item}
                isActive={
                  (item.path && location.pathname === item.path) ||
                  (item.id === 'noti' && notiOpen) ||
                  (item.id === 'register' && registerOpen)
                }
                isOpen={drawerOpen}
                onClick={() => handleMenuClick(item)}
                colors={colors}
                mode={mode}
              />
            ))}
          </List>
        </Box>

        {/* 더 보기 */}
        <ListItem
          button
          onClick={(e) => setMoreAnchorEl(e.currentTarget)}
          sx={{
            borderRadius: '12px',
            py: '10px',
            px: '12px',
            mb: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            color: colors.textPrimary,
            transition: 'background 0.12s ease',
            backgroundColor: Boolean(moreAnchorEl) ? colors.hover : 'transparent',
            '&:hover': { backgroundColor: colors.hover },
          }}
        >
          <ListItemIcon sx={{ minWidth: 0, width: 24, justifyContent: 'center', color: 'inherit', flexShrink: 0 }}>
            <MenuIcon sx={{ fontSize: 24 }} />
          </ListItemIcon>
          <Typography sx={{
            ml: 2, fontSize: '0.9375rem', fontWeight: 400,
            color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden',
            opacity: drawerOpen ? 1 : 0,
            maxWidth: drawerOpen ? 160 : 0,
            transition: 'opacity 0.1s ease, max-width 0.18s cubic-bezier(0.4,0,0.2,1)',
          }}>
            더 보기
          </Typography>
        </ListItem>

        {/* 더 보기 팝오버 */}
        <Popover
          open={Boolean(moreAnchorEl)}
          anchorEl={moreAnchorEl}
          onClose={() => setMoreAnchorEl(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          PaperProps={{
            sx: {
              backgroundColor: colors.paper,
              border: `1px solid ${colors.border}`,
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              minWidth: 220,
              py: 1,
              overflow: 'hidden',
            },
          }}
        >
          <Box
            onClick={toggleColorMode}
            sx={{
              display: 'flex', alignItems: 'center',
              px: 2, py: 1.2, cursor: 'pointer',
              transition: 'background 0.12s ease',
              '&:hover': { backgroundColor: colors.hover },
            }}
          >
            {mode === 'dark'
              ? <LightModeOutlined sx={{ fontSize: 22, color: colors.textPrimary }} />
              : <DarkModeOutlined sx={{ fontSize: 22, color: colors.textPrimary }} />
            }
            <Typography sx={{ ml: 1.5, fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary, flex: 1 }}>
              {mode === 'dark' ? '라이트 모드' : '다크 모드'}
            </Typography>
            <Switch
              checked={mode === 'dark'}
              size="small"
              onClick={(e) => e.stopPropagation()}
              onChange={toggleColorMode}
              sx={{ ml: 1 }}
            />
          </Box>

          <Box sx={{ height: '1px', backgroundColor: colors.border, my: 0.5 }} />

          <Box
            onClick={handleLogoutClick}
            sx={{
              display: 'flex', alignItems: 'center',
              px: 2, py: 1.2, cursor: 'pointer',
              transition: 'background 0.12s ease',
              '&:hover': { backgroundColor: colors.hover },
            }}
          >
            <LogoutOutlined sx={{ fontSize: 22, color: '#EF4444' }} />
            <Typography sx={{ ml: 1.5, fontSize: '0.9rem', fontWeight: 500, color: '#EF4444' }}>
              로그아웃
            </Typography>
          </Box>
        </Popover>

        {/* 프로필 */}
        <Box
          onClick={() => navigate('/mypage')}
          sx={{
            display: 'flex', alignItems: 'center',
            px: '12px', py: '10px', borderRadius: '12px',
            cursor: 'pointer',
            transition: 'background 0.12s ease',
            '&:hover': { backgroundColor: colors.hover },
          }}
        >
          <Box sx={{ width: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Avatar
              src={user.avatar}
              sx={{
                width: 36, height: 36, flexShrink: 0,
                backgroundColor: colors.textPrimary,
                fontSize: '0.95rem', fontWeight: 800,
                border: `2px solid ${colors.border}`,
              }}
            >
              {getInitial(user.name)}
            </Avatar>
          </Box>
          <Box sx={{
            ml: 2, minWidth: 0,
            opacity: drawerOpen ? 1 : 0,
            maxWidth: drawerOpen ? 160 : 0,
            overflow: 'hidden',
            transition: 'opacity 0.1s ease, max-width 0.18s cubic-bezier(0.4,0,0.2,1)',
          }}>
            <Typography sx={{ fontWeight: 600, fontSize: '0.875rem', color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.name}
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user.handle}
            </Typography>
          </Box>
        </Box>
      </Drawer>

      <NotificationSidebar
        open={notiOpen}
        onClose={() => {
          setNotiOpen(false);
          localStorage.setItem('notiSidebarOpen', 'false');
        }}
      />

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />

      {/* 로그아웃 다이얼로그 */}
      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px', px: 0, py: 0,
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            minWidth: 320,
            backgroundColor: colors.paper,
            border: `1px solid ${colors.border}`,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{
          fontWeight: 700, fontSize: '1rem',
          color: colors.textPrimary, textAlign: 'center',
          borderBottom: `1px solid ${colors.border}`,
          pb: 2,
        }}>
          로그아웃
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', textAlign: 'center' }}>
            정말 로그아웃 하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: 'column', p: 0, borderTop: `1px solid ${colors.border}` }}>
          <Button
            onClick={confirmLogout}
            fullWidth
            sx={{
              py: 1.5, fontWeight: 700, fontSize: '0.875rem',
              color: '#EF4444',
              borderBottom: `1px solid ${colors.border}`,
              borderRadius: 0,
            }}
          >
            로그아웃
          </Button>
          <Button
            onClick={() => setLogoutOpen(false)}
            fullWidth
            sx={{ py: 1.5, fontWeight: 400, fontSize: '0.875rem', color: colors.textPrimary, borderRadius: 0 }}
          >
            취소
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}