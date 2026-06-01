import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer, List, ListItem, ListItemText, ListItemIcon, Box, Typography,
  createTheme, ThemeProvider, CssBaseline, Avatar, Tooltip, Badge, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import {
  HomeOutlined, Home, AddBoxOutlined, AddBox, LogoutOutlined, NotificationsNoneOutlined, Notifications,
  SearchOutlined, SettingsOutlined, Settings, MailOutlined, Mail, Menu as MenuIcon, ChevronLeft
} from '@mui/icons-material';
import NotificationSidebar from './NotificationSidebar';

const API = 'http://localhost:3010';

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
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `,
    },
  },
});

const DRAWER_WIDTH = 260;

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

// 설정(Settings)을 메인 메뉴로 올렸습니다.
const MENU_ITEMS = [
  {
    text: '피드',
    icon: <HomeOutlined sx={{ fontSize: 24 }} />,
    activeIcon: <Home sx={{ fontSize: 24 }} />,
    path: '/feed',
  },
  {
    text: '탐색',
    icon: <SearchOutlined sx={{ fontSize: 24 }} />,
    activeIcon: <SearchOutlined sx={{ fontSize: 24 }} />,
    path: '/explore',
  },
  {
    text: '메시지',
    icon: <MailOutlined sx={{ fontSize: 24 }} />,
    activeIcon: <Mail sx={{ fontSize: 24 }} />,
    path: '/messages',
  },
  {
    id: 'noti',
    text: '알림',
    icon: <NotificationsNoneOutlined sx={{ fontSize: 24 }} />,
    activeIcon: <Notifications sx={{ fontSize: 24 }} />,
  },
  {
    text: '새 게시물',
    icon: <AddBoxOutlined sx={{ fontSize: 24 }} />,
    activeIcon: <AddBox sx={{ fontSize: 24 }} />,
    path: '/register',
  },
  {
    text: '설정',
    icon: <SettingsOutlined sx={{ fontSize: 24 }} />,
    activeIcon: <Settings sx={{ fontSize: 24 }} />,
    path: '/settings',
  },
];

const NavItem = ({ item, isActive, isOpen, onClick }) => (
  <Tooltip title={!isOpen ? item.text : ''} placement="right" arrow>
    <ListItem
      button
      component={item.path ? Link : 'div'}
      to={item.path || undefined}
      onClick={onClick}
      sx={{
        borderRadius: 2.5,
        py: 1.4,
        px: isOpen ? 2 : 1,
        mb: 0.8,
        justifyContent: isOpen ? 'flex-start' : 'center',
        position: 'relative',
        backgroundColor: isActive ? '#F1F5F9' : 'transparent',
        color: isActive ? '#0F172A' : '#64748B',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        animation: 'fadeIn 0.3s ease both',
        '&:hover': {
          backgroundColor: '#F8FAFC',
          color: '#0F172A',
          transform: 'translateX(2px)',
          '& .nav-icon': { transform: 'scale(1.08)' },
        },
        '&::before': isActive ? {
          content: '""',
          position: 'absolute',
          left: 0, top: '20%', bottom: '20%',
          width: 4,
          borderRadius: '0 4px 4px 0',
          backgroundColor: '#0F172A',
        } : {},
      }}
    >
      <ListItemIcon
        className="nav-icon"
        sx={{
          minWidth: 42,
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          color: 'inherit',
          mr: isOpen ? 1.5 : 0,
        }}
      >
        {item.badge ? (
          <Badge badgeContent={item.badge} color="error">
            {isActive ? item.activeIcon : item.icon}
          </Badge>
        ) : (
          isActive ? item.activeIcon : item.icon
        )}
      </ListItemIcon>

      <ListItemText
        primary={item.text}
        sx={{
          opacity: isOpen ? 1 : 0,
          width: isOpen ? 'auto' : 0,
          transition: 'opacity 0.2s ease, width 0.2s ease',
          m: 0,
        }}
        primaryTypographyProps={{
          fontSize: '0.95rem',
          fontWeight: isActive ? 800 : 500,
        }}
      />
    </ListItem>
  </Tooltip>
);

export default function Menu() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const token = localStorage.getItem('accessToken');

  const [isOpen, setIsOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [user, setUser] = useState({ name: '사용자', handle: '@user', avatar: null });
  const drawerWidth = isOpen ? DRAWER_WIDTH : 80;

  const handleMenuClick = (item) => {
    if (item.id === 'noti') {
      setNotiOpen(true);
    }
  };

  useEffect(() => {
    if (!token) return;
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API}/user/mypage/data`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser({
            name: data.user.NICKNAME || '사용자',
            handle: `@${data.user.NICKNAME || 'user'}`,
            avatar: data.user.AVATAR ? `${API}${data.user.AVATAR}` : null,
          });
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [token]);

  const handleLogoutClick = (e) => {
    e.stopPropagation();
    setLogoutOpen(true);
  };

  const confirmLogout = () => {
    setLogoutOpen(false);
    localStorage.removeItem('accessToken');
    navigate('/');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            boxSizing: 'border-box',
            borderRight: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            px: isOpen ? 1.5 : 0.5,
            py: 3,
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
          },
        }}
      >
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          mb: 5,
          px: 1.5,
        }}>
          {isOpen && (
            <Box
              component={Link}
              to="/feed"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.2, textDecoration: 'none' }}
            >
              <Box sx={{
                width: 32, height: 32, borderRadius: 1.2,
                backgroundColor: '#0F172A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.85rem' }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.3rem' }}>CtrlE</Typography>
            </Box>
          )}
          <IconButton onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
        </Box>

        <List disablePadding sx={{ px: 0.5 }}>
          {MENU_ITEMS.map(item => (
            <NavItem
              key={item.text}
              item={item}
              isActive={currentPath === item.path || (item.id === 'noti' && notiOpen)}
              isOpen={isOpen}
              onClick={() => handleMenuClick(item)}
            />
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {isOpen ? (
          <Box
            sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1.2, py: 1.2,
              borderRadius: 2.5,
              border: '1px solid #E2E8F0',
              backgroundColor: '#F8FAFC',
              mb: 1,
              transition: 'all 0.2s',
              '&:hover': { backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
            }}
          >
            <Avatar 
              onClick={() => navigate('/mypage')} 
              src={user.avatar} 
              sx={{ width: 38, height: 38, backgroundColor: '#0F172A', fontSize: '0.9rem', cursor: 'pointer' }}
            >
              {getInitial(user.name)}
            </Avatar>
            
            <Box onClick={() => navigate('/mypage')} sx={{ flex: 1, minWidth: 0, cursor: 'pointer', ml: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '0.85rem', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.name}
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.handle}
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Tooltip title="로그아웃" placement="bottom" arrow>
                <IconButton size="small" onClick={handleLogoutClick} sx={{ p: 0.5, color: '#94A3B8', '&:hover': { color: '#EF4444', backgroundColor: '#FEF2F2' } }}>
                  <LogoutOutlined sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Tooltip title="프로필" placement="right" arrow>
              <IconButton onClick={() => navigate('/mypage')}>
                <Avatar src={user.avatar} sx={{ width: 36, height: 36, backgroundColor: '#0F172A', fontSize: '0.85rem' }}>
                  {getInitial(user.name)}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Tooltip title="로그아웃" placement="right" arrow>
              <IconButton size="small" onClick={handleLogoutClick} sx={{ color: '#94A3B8', '&:hover': { color: '#EF4444' } }}>
                <LogoutOutlined sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Drawer>

      <NotificationSidebar open={notiOpen} onClose={() => setNotiOpen(false)} />

      <Dialog
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            px: 1,
            py: 1,
            boxShadow: '0 24px 64px rgba(15,23,42,0.1)',
            minWidth: 320
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A' }}>
          로그아웃
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#475569', fontSize: '0.92rem', mt: 0.5 }}>
            정말 로그아웃 하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLogoutOpen(false)} sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.88rem' }}>
            취소
          </Button>
          <Button onClick={confirmLogout} variant="contained" sx={{ backgroundColor: '#EF4444', color: '#fff', fontWeight: 800, fontSize: '0.88rem', borderRadius: 1.5, boxShadow: 'none', px: 2.5, '&:hover': { backgroundColor: '#DC2626' } }}>
            로그아웃
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}