import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemText, ListItemIcon, Box, Typography,
  CssBaseline, Avatar, Tooltip, Badge, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
  HomeOutlined, Home, AddBoxOutlined, AddBox, LogoutOutlined,
  NotificationsNoneOutlined, Notifications,
  SearchOutlined, SettingsOutlined, Settings,
  ForumOutlined, Forum,
  Menu as MenuIcon, ChevronLeft,
  BarChartOutlined, BarChart,
} from '@mui/icons-material';
import NotificationSidebar from './NotificationSidebar';
import { useColorMode } from '../App';
// ✅ 1. RegisterModal import 추가
import RegisterModal from './RegisterModal';

const API = 'http://localhost:3010';
const DRAWER_WIDTH = 260;
const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const MENU_ITEMS = [
  { text: '피드', icon: <HomeOutlined sx={{ fontSize: 24 }} />, activeIcon: <Home sx={{ fontSize: 24 }} />, path: '/feed' },
  { text: '탐색', icon: <SearchOutlined sx={{ fontSize: 24 }} />, activeIcon: <SearchOutlined sx={{ fontSize: 24 }} />, path: '/explore' },
  { text: '메시지', icon: <ForumOutlined sx={{ fontSize: 22 }} />, activeIcon: <Forum sx={{ fontSize: 22 }} />, path: '/messages' },
  { id: 'noti', text: '알림', icon: <NotificationsNoneOutlined sx={{ fontSize: 24 }} />, activeIcon: <Notifications sx={{ fontSize: 24 }} /> },
  // ✅ 2. path 제거하고 id 추가 — path가 있으면 Link로 렌더돼서 모달 대신 페이지 이동함
  { id: 'register', text: '새 게시물', icon: <AddBoxOutlined sx={{ fontSize: 24 }} />, activeIcon: <AddBox sx={{ fontSize: 24 }} /> },
  { text: '내 활동', icon: <BarChartOutlined sx={{ fontSize: 24 }} />, activeIcon: <BarChart sx={{ fontSize: 24 }} />, path: '/myactivity' },
  { text: '설정', icon: <SettingsOutlined sx={{ fontSize: 24 }} />, activeIcon: <Settings sx={{ fontSize: 24 }} />, path: '/settings' },
];

const DarkModeToggle = ({ mode, toggleColorMode, isOpen, colors }) => {
  const isDark = mode === 'dark';

  const switchEl = (
    <Box
      onClick={toggleColorMode}
      role="switch"
      aria-checked={isDark}
      sx={{
        position: 'relative',
        width: 42,
        height: 24,
        borderRadius: 12,
        backgroundColor: isDark ? '#FFFFFF' : '#CBD5E1',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'background-color 0.25s ease',
        '&:hover': { backgroundColor: isDark ? '#E5E7EB' : '#94A3B8' },
      }}
    >
      <Box sx={{
        position: 'absolute',
        top: 3,
        left: isDark ? 21 : 3,
        width: 18,
        height: 18,
        borderRadius: '50%',
        backgroundColor: isDark ? '#000000' : '#FFFFFF',
        transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
      }} />
    </Box>
  );

  if (isOpen) {
    return (
      <Box
        onClick={toggleColorMode}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.4, borderRadius: 2.5,
          border: `1px solid ${colors.border}`,
          backgroundColor: colors.bg,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { borderColor: colors.borderFocus },
        }}
      >
        <Typography sx={{ fontSize: '0.87rem', fontWeight: 600, color: colors.textSecondary }}>
          다크 모드
        </Typography>
        {switchEl}
      </Box>
    );
  }

  return (
    <Tooltip title="다크 모드" placement="right" arrow>
      <Box sx={{ display: 'flex', justifyContent: 'center', cursor: 'pointer' }}>
        {switchEl}
      </Box>
    </Tooltip>
  );
};

const NavItem = ({ item, isActive, isOpen, onClick, colors }) => {
  return (
    <Tooltip title={!isOpen ? item.text : ''} placement="right" arrow>
      <ListItem
        button
        component={item.path ? Link : 'div'}
        to={item.path || undefined}
        onClick={onClick}
        sx={{
          borderRadius: 2.5,
          py: 1.8,
          px: isOpen ? 2 : 1,
          mb: 1.2,
          justifyContent: isOpen ? 'flex-start' : 'center',
          position: 'relative',
          backgroundColor: isActive ? colors.hover : 'transparent',
          color: isActive ? colors.textPrimary : colors.textSecondary,
          whiteSpace: 'nowrap', overflow: 'hidden',
          transition: 'all 0.18s ease',
          '&:hover': {
            backgroundColor: isActive ? colors.hover : colors.hover,
            color: colors.textPrimary,
            transform: 'translateX(2px)',
            '& .nav-icon': { transform: 'scale(1.08)' },
          },
          '&::before': isActive ? {
            content: '""',
            position: 'absolute',
            left: 0, top: '22%', bottom: '22%',
            width: 3,
            borderRadius: '0 3px 3px 0',
            backgroundColor: colors.textPrimary,
          } : {},
        }}
      >
        <ListItemIcon
          className="nav-icon"
          sx={{
            minWidth: 42,
            justifyContent: 'center',
            transition: 'all 0.18s ease',
            color: 'inherit',
            mr: isOpen ? 1.5 : 0,
          }}
        >
          {item.badge
            ? <Badge badgeContent={item.badge} color="error">{isActive ? item.activeIcon : item.icon}</Badge>
            : (isActive ? item.activeIcon : item.icon)}
        </ListItemIcon>
        <ListItemText
          primary={item.text}
          sx={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0, transition: 'opacity 0.18s ease', m: 0 }}
          primaryTypographyProps={{ fontSize: '0.93rem', fontWeight: isActive ? 800 : 500 }}
        />
      </ListItem>
    </Tooltip>
  );
};

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
    hover: mode === 'dark' ? '#22253A' : '#F8FAFC',
  };

  const [isOpen, setIsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(
    () => localStorage.getItem('notiSidebarOpen') === 'true'
  );
  const [registerOpen, setRegisterOpen] = useState(false);
  const [user, setUser] = useState({ name: '사용자', handle: '@user', avatar: null });

  const drawerWidth = isOpen ? DRAWER_WIDTH : 80;

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

  const handleMenuClick = (item) => {
    if (item.id === 'noti') {
      setNotiOpen(true);
      localStorage.setItem('notiSidebarOpen', 'true');
    }
    if (item.id === 'register') setRegisterOpen(true);
  };

  const handleLogoutClick = (e) => { e.stopPropagation(); setLogoutOpen(true); };
  const confirmLogout = () => { setLogoutOpen(false); localStorage.removeItem('accessToken'); navigate('/'); };

  return (
    <>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth, flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxSizing: 'border-box',
            borderRight: `1px solid ${colors.border}`,
            backgroundColor: `${colors.paper} !important`,
            px: isOpen ? 1.5 : 0.5,
            py: 2,
            display: 'flex', flexDirection: 'column',
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: isOpen ? 'space-between' : 'center', mb: 3, px: 1.5 }}>
          {isOpen && (
            <Box component={Link} to="/feed" sx={{ display: 'flex', alignItems: 'center', gap: 1.2, textDecoration: 'none' }}>
              <Box sx={{
                width: 32, height: 32, borderRadius: 1.2,
                backgroundColor: colors.textPrimary,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ color: colors.paper, fontWeight: 900, fontSize: '0.85rem' }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ color: colors.textPrimary, fontWeight: 800, fontSize: '1.3rem' }}>CtrlE</Typography>
            </Box>
          )}
          <IconButton onClick={() => setIsOpen(!isOpen)} sx={{ color: colors.textSecondary }}>
            {isOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
        </Box>

        <Box sx={{ flex: 1, px: 0.5 }}>
          <List disablePadding>
            {MENU_ITEMS.map(item => (
              <NavItem
                key={item.text}
                item={item}
                isActive={
                  (item.path && location.pathname === item.path) ||
                  (item.id === 'noti' && notiOpen) ||
                  // ✅ register 모달 열려있을 때 활성 표시
                  (item.id === 'register' && registerOpen)
                }
                isOpen={isOpen}
                onClick={() => handleMenuClick(item)}
                colors={colors}
                mode={mode}
              />
            ))}
          </List>
        </Box>

        <Box sx={{ px: isOpen ? 1 : 0, mb: 2, display: 'flex', justifyContent: isOpen ? 'stretch' : 'center' }}>
          <DarkModeToggle
            mode={mode}
            toggleColorMode={toggleColorMode}
            isOpen={isOpen}
            colors={colors}
          />
        </Box>

        {isOpen ? (
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            px: 1.2, py: 1.2, borderRadius: 2.5,
            border: `1px solid ${colors.border}`,
            backgroundColor: colors.bg,
            transition: 'all 0.2s',
            '&:hover': { borderColor: colors.borderFocus },
          }}>
            <Avatar
              onClick={() => navigate('/mypage')}
              src={user.avatar}
              sx={{
                width: 44, height: 44,
                backgroundColor: colors.textPrimary,
                fontSize: '1rem', fontWeight: 800, cursor: 'pointer',
                border: `2px solid ${colors.border}`,
              }}
            >
              {getInitial(user.name)}
            </Avatar>
            <Box onClick={() => navigate('/mypage')} sx={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: colors.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: colors.textSecondary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.handle}
              </Typography>
            </Box>
            <Tooltip title="로그아웃" placement="top" arrow>
              <IconButton
                size="small"
                onClick={handleLogoutClick}
                sx={{ p: 0.5, color: colors.textSecondary, '&:hover': { color: '#EF4444' } }}
              >
                <LogoutOutlined sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
            <Tooltip title="프로필" placement="right" arrow>
              <IconButton onClick={() => navigate('/mypage')} sx={{ p: 0 }}>
                <Avatar
                  src={user.avatar}
                  sx={{
                    width: 44, height: 44,
                    backgroundColor: colors.textPrimary,
                    fontSize: '1rem', fontWeight: 800,
                    border: `2px solid ${colors.border}`,
                  }}
                >
                  {getInitial(user.name)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Tooltip title="로그아웃" placement="right" arrow>
              <IconButton size="small" onClick={handleLogoutClick} sx={{ color: colors.textSecondary, '&:hover': { color: '#EF4444' } }}>
                <LogoutOutlined sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Drawer>

      <NotificationSidebar
        open={notiOpen}
        onClose={() => {
          setNotiOpen(false);
          localStorage.setItem('notiSidebarOpen', 'false');
        }}
      />

      <RegisterModal open={registerOpen} onClose={() => setRegisterOpen(false)} />

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3, px: 1, py: 1,
            boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
            minWidth: 320,
            backgroundColor: colors.paper,
            border: `1px solid ${colors.border}`,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.15rem', color: colors.textPrimary }}>로그아웃</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: colors.textSecondary, fontSize: '0.92rem', mt: 0.5 }}>
            정말 로그아웃 하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutOpen(false)} sx={{ color: colors.textSecondary, fontWeight: 700, fontSize: '0.88rem' }}>취소</Button>
          <Button
            onClick={confirmLogout}
            variant="contained"
            sx={{ backgroundColor: '#EF4444', color: '#fff', fontWeight: 800, fontSize: '0.88rem', borderRadius: 1.5, boxShadow: 'none', px: 2.5, '&:hover': { backgroundColor: '#DC2626' } }}
          >
            로그아웃
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}