import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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
  CssBaseline 
} from '@mui/material';
import { 
  HomeOutlined, 
  AddBoxOutlined, 
  PersonOutline, 
  LogoutOutlined 
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#2563EB' },
    secondary: { main: '#0F172A' },
  },
  typography: {
    fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif',
  },
});

const drawerWidth = 260; // 인스타그램처럼 약간 더 여유 있는 너비

export default function Menu() {
  const location = useLocation(); // 현재 주소를 감지하여 메뉴 하이라이팅에 사용
  const currentPath = location.pathname;

  const menuItems = [
    { text: '피드', icon: <HomeOutlined sx={{ fontSize: 28 }} />, path: '/feed' },
    { text: '새 게시물', icon: <AddBoxOutlined sx={{ fontSize: 28 }} />, path: '/register' },
    { text: '프로필', icon: <PersonOutline sx={{ fontSize: 28 }} />, path: '/mypage' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    window.location.href = '/';
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
            boxSizing: 'border-box',
            borderRight: '1px solid #E2E8F0', // 부드러운 경계선
            backgroundColor: '#FFFFFF',
            px: 2, // 좌우 여백
            py: 4, // 상하 여백
          },
        }}
      >
        {/* 상단 로고 영역 */}
        <Box 
          component={Link} 
          to="/feed" 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.2, 
            mb: 5, 
            px: 1.5, 
            textDecoration: 'none',
            cursor: 'pointer' 
          }}
        >
          <Box sx={{ width: 32, height: 32, borderRadius: 1.2, backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>{'<>'}</Typography>
          </Box>
          <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
            CtrlE
          </Typography>
        </Box>

        {/* 메인 메뉴 리스트 */}
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {menuItems.map((item) => {
            const isActive = currentPath === item.path; // 현재 경로와 일치하는지 확인
            
            return (
              <ListItem
                button
                key={item.text}
                component={Link}
                to={item.path}
                sx={{
                  borderRadius: 2.5,
                  py: 1.2,
                  px: 2,
                  backgroundColor: isActive ? '#F1F5F9' : 'transparent',
                  color: isActive ? '#0F172A' : '#64748B',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: '#F8FAFC',
                    color: '#0F172A',
                    transform: 'translateY(-1px)',
                    '& .MuiListItemIcon-root': { color: '#0F172A', transform: 'scale(1.05)' }
                  },
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    minWidth: 44, 
                    color: isActive ? '#0F172A' : '#94A3B8', 
                    transition: 'all 0.2s ease' 
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '1.05rem',
                    fontWeight: isActive ? 800 : 500, // 선택된 메뉴는 폰트 굵기 강화
                    letterSpacing: '-0.01em',
                  }}
                />
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} /> {/* 빈 공간을 채워 하단 메뉴를 아래로 밀어냄 */}

        {/* 하단 로그아웃 버튼 */}
        <List>
          <ListItem
            button
            onClick={handleLogout}
            sx={{
              borderRadius: 2.5,
              py: 1.2,
              px: 2,
              color: '#64748B',
              '&:hover': { backgroundColor: '#FEF2F2', color: '#EF4444', '& .MuiListItemIcon-root': { color: '#EF4444' } },
            }}
          >
            <ListItemIcon sx={{ minWidth: 44, color: '#94A3B8', transition: 'color 0.2s ease' }}>
              <LogoutOutlined sx={{ fontSize: 26 }} />
            </ListItemIcon>
            <ListItemText
              primary="로그아웃"
              primaryTypographyProps={{ fontSize: '1rem', fontWeight: 600 }}
            />
          </ListItem>
        </List>
      </Drawer>
    </ThemeProvider>
  );
}