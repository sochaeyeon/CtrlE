import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Avatar,
  Divider,
  Tooltip,
  Badge,
  IconButton
} from '@mui/material';
import {
  HomeOutlined,
  Home,
  AddBoxOutlined,
  AddBox,
  PersonOutline,
  Person,
  LogoutOutlined,
  NotificationsNoneOutlined,
  Notifications,
  BookmarkBorderOutlined,
  Bookmark,
  SearchOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { Menu as MenuIcon, ChevronLeft } from '@mui/icons-material';

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

// ──────────────────────────────────────────
//  Menu items config
// ──────────────────────────────────────────
const MENU_ITEMS = [
  {
    text: '피드',
    icon: <HomeOutlined sx={{ fontSize: 22 }} />,
    activeIcon: <Home sx={{ fontSize: 22 }} />,
    path: '/feed',
  },
  {
    text: '탐색',
    icon: <SearchOutlined sx={{ fontSize: 22 }} />,
    activeIcon: <SearchOutlined sx={{ fontSize: 22 }} />,
    path: '/explore',
  },
  {
    text: '트렌드',
    icon: <TrendingUpOutlined sx={{ fontSize: 22 }} />,
    activeIcon: <TrendingUpOutlined sx={{ fontSize: 22 }} />,
    path: '/trending',
  },
  {
    text: '알림',
    icon: <NotificationsNoneOutlined sx={{ fontSize: 22 }} />,
    activeIcon: <Notifications sx={{ fontSize: 22 }} />,
    path: '/notifications',
    badge: 3,
  },
  {
    text: '북마크',
    icon: <BookmarkBorderOutlined sx={{ fontSize: 22 }} />,
    activeIcon: <Bookmark sx={{ fontSize: 22 }} />,
    path: '/bookmarks',
  },
  {
    text: '프로필',
    icon: <PersonOutline sx={{ fontSize: 22 }} />,
    activeIcon: <Person sx={{ fontSize: 22 }} />,
    path: '/mypage',
  },
];

// ──────────────────────────────────────────
//  NavItem row
// ──────────────────────────────────────────
// ✅ Fix 1: isOpen prop 추가
const NavItem = ({ item, isActive, isOpen }) => (
  <Tooltip title={!isOpen ? item.text : ''} placement="right" arrow>
    <ListItem
      button
      component={Link}
      to={item.path}
      sx={{
        borderRadius: 2,
        py: 1.1,
        px: isOpen ? 1.8 : 1,
        mb: 0.3,
        justifyContent: isOpen ? 'initial' : 'center',
        position: 'relative',
        backgroundColor: isActive
          ? item.highlight ? 'rgba(37,99,235,0.08)' : '#F1F5F9'
          : 'transparent',
        color: isActive
          ? item.highlight ? '#2563EB' : '#0F172A'
          : '#64748B',
        transition: 'all 0.18s ease',
        animation: 'fadeIn 0.3s ease both',
        '&:hover': {
          backgroundColor: item.highlight ? 'rgba(37,99,235,0.08)' : '#F8FAFC',
          color: item.highlight ? '#2563EB' : '#0F172A',
          transform: 'translateX(2px)',
          '& .nav-icon': { transform: 'scale(1.08)' },
        },
        '&::before': isActive ? {
          content: '""',
          position: 'absolute',
          left: 0, top: '20%', bottom: '20%',
          width: 3,
          borderRadius: '0 2px 2px 0',
          backgroundColor: item.highlight ? '#2563EB' : '#0F172A',
        } : {},
      }}
    >
      {/* ✅ Fix 2: sx에서 ... 제거하고 올바른 문법으로 수정 */}
      <ListItemIcon
        className="nav-icon"
        sx={{
          minWidth: isOpen ? 38 : 0,
          mr: isOpen ? 2 : 0,
          justifyContent: 'center',
          transition: 'all 0.18s ease',
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

      {isOpen && (
        <ListItemText
          primary={item.text}
          primaryTypographyProps={{
            fontSize: '0.92rem',
            fontWeight: isActive ? 800 : 500,
          }}
        />
      )}
    </ListItem>
  </Tooltip>
);

export default function Menu() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const [isOpen, setIsOpen] = useState(true);
  const drawerWidth = isOpen ? DRAWER_WIDTH : 70;

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/');
  };

  const user = { name: '개발자', handle: '@dev', avatar: null };
  const mainItems = MENU_ITEMS.filter(i => i.path !== '/register' && i.path !== '/mypage');
  const bottomItems = MENU_ITEMS.filter(i => i.path === '/register' || i.path === '/mypage');

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
            transition: 'width 0.2s ease',
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
        {/* ── Logo & Toggle Button ── */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isOpen ? 'space-between' : 'center',
          mb: 4,
          px: 1.5,
        }}>
          {isOpen && (
            <Box
              component={Link}
              to="/feed"
              sx={{ display: 'flex', alignItems: 'center', gap: 1.2, textDecoration: 'none' }}
            >
              <Box sx={{
                width: 30, height: 30, borderRadius: 1.2,
                backgroundColor: '#0F172A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.8rem' }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.25rem' }}>CtrlE</Typography>
            </Box>
          )}
          <IconButton onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
        </Box>

        {/* ── Main nav ── */}
        {/* ✅ Fix 3: isOpen prop 전달 */}
        <List disablePadding>
          {mainItems.map(item => (
            <NavItem
              key={item.path}
              item={item}
              isActive={currentPath === item.path}
              isOpen={isOpen}
            />
          ))}
        </List>

        <Divider sx={{ my: 2, borderColor: '#F1F5F9' }} />

        {/* ── Bottom nav ── */}
        {/* ✅ Fix 3: isOpen prop 전달 */}
        <List disablePadding>
          {bottomItems.map(item => (
            <NavItem
              key={item.path}
              item={item}
              isActive={currentPath === item.path}
              isOpen={isOpen}
            />
          ))}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* ── User profile ── */}
        {isOpen && (
          // ✅ Fix 4: onClick을 sx 밖으로 꺼냄
          <Box
            onClick={() => navigate('/mypage')}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1.2,
              px: 1.8, py: 1.4,
              borderRadius: 2,
              border: '1px solid #F1F5F9',
              backgroundColor: '#F8FAFC',
              mb: 1,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              '&:hover': { backgroundColor: '#F1F5F9' },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, backgroundColor: '#0F172A', fontSize: '0.78rem' }}>
              {user.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                {user.name}
              </Typography>
              <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>
                {user.handle}
              </Typography>
            </Box>
          </Box>
        )}

        {/* ── Logout ── */}
        <Tooltip title="로그아웃" placement="right" arrow>
          <IconButton
            onClick={handleLogout}
            sx={{ alignSelf: 'center', mt: 1, color: '#94A3B8' }}
          >
            <LogoutOutlined />
          </IconButton>
        </Tooltip>

      </Drawer>
    </ThemeProvider>
  );
}