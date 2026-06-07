import React, { useState, createContext, useContext, useMemo, useEffect, useRef } from 'react';
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { GlobalStyles } from '@mui/material';
import { Collapse, Box, CssBaseline, createTheme, ThemeProvider, Snackbar, Avatar, Typography, IconButton, Tooltip } from '@mui/material';
import { Close, NotificationsOff, Notifications } from '@mui/icons-material';
import Login from './components/Login';
import Join from './components/Join';
import Feed from './components/Feed';
import Register from './components/RegisterModal';
import MyPage from './components/MyPage';
import Menu from './components/Menu';
import Explore from './components/Explore';
import PostDetail from './components/PostDetail';
import UserProfile from './components/UserProfile';
import Messages from './components/Messages';
import NotificationSidebar from './components/NotificationSidebar';
import Settings from './components/Settings';
import Myactivity from './components/Myactivity';
import EditModal from './components/EditModal';

const API = 'http://localhost:3010';

export const ColorModeContext = createContext({
  mode: 'light',
  toggleColorMode: () => { },
});

export const useColorMode = () => useContext(ColorModeContext);

// 전역 카운터로 항상 고유한 id 보장
let notiCounter = 0;

function GlobalMessageToast({ notification, onClose, onMute, onUnmute }) {
  const [muted, setMuted] = useState(false);
  const navigate = useNavigate();
  const onCloseRef = useRef(onClose);

  const handleMuteToggle = (e) => {
    e.stopPropagation();
    if (muted) {
      setMuted(false);
      onUnmute(notification.roomId);
    } else {
      setMuted(true);
      onMute(notification.roomId);
    }
  };

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCloseRef.current();
    }, 5000);
    return () => clearTimeout(timer);
  }, []); // 마운트 시 딱 한 번만

  const handleNotificationClick = (e) => {
    if (e.target.closest('.action-btn')) return;
    onClose();
    navigate(`/messages/room/${notification.roomId}`);
  };

  return (
    <Box
      onClick={handleNotificationClick}
      sx={{
        display: 'flex', alignItems: 'center', gap: 2, px: 2, py: 1.5,
        backgroundColor: '#FFFFFF',
        borderRadius: 3, cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        border: '1px solid #E2E8F0',
        minWidth: 320, maxWidth: 420, transition: 'all 0.3s ease',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 24px rgba(0,0,0,0.2)' }
      }}
    >
      <Avatar
        src={notification?.avatar ? (notification.avatar.startsWith('http') ? notification.avatar : `${API}${notification.avatar}`) : undefined}
        sx={{ width: 44, height: 44, backgroundColor: '#F1F5F9', color: '#0F172A', fontWeight: 800, flexShrink: 0 }}
      >
        {notification?.nickname?.charAt(0)}
      </Avatar>

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {notification?.nickname}
          {notification?.isGroup && notification?.roomName && (
            <Typography component="span" sx={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
              · {notification.roomName}
            </Typography>
          )}
        </Typography>
        <Typography sx={{ color: '#64748B', fontSize: '0.85rem', mt: 0.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {notification?.message}
        </Typography>
      </Box>

      {notification?.previewImage && (
        <Box component="img" src={notification.previewImage.startsWith('http') ? notification.previewImage : `${API}${notification.previewImage}`} sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0, ml: 1 }} />
      )}
      {notification?.previewSticker && (
        <Box sx={{ fontSize: '2rem', flexShrink: 0, ml: 1, lineHeight: 1 }}>{notification.previewSticker}</Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, ml: 1 }}>
        <Tooltip title={muted ? "알림 다시 켜기" : "이 채팅방 알림 끄기"} placement="top">
          <IconButton className="action-btn" size="small" onClick={handleMuteToggle}
            sx={{ color: muted ? '#EF4444' : '#94A3B8', p: 0.2, '&:hover': { color: '#0F172A' } }}>
            {muted ? <NotificationsOff sx={{ fontSize: 16 }} /> : <Notifications sx={{ fontSize: 16 }} />}
          </IconButton>
        </Tooltip>
        <Tooltip title="닫기" placement="bottom">
          <IconButton className="action-btn" size="small" onClick={onClose} sx={{ color: '#94A3B8', p: 0.2, '&:hover': { color: '#0F172A' } }}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}

function AppContent() {
  const location = useLocation();
  const { mode } = useColorMode();
  const isAuthPage = location.pathname === '/' || location.pathname === '/join';

  const [notifications, setNotifications] = useState([]);
  const lastMessageState = useRef({});

  const handleMuteRoom = (roomId) => {
    const currentMuted = JSON.parse(localStorage.getItem('mutedRooms') || '{}');
    localStorage.setItem('mutedRooms', JSON.stringify({ ...currentMuted, [roomId]: true }));
  };

  const myNickname = (() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return '';
      const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
      return payload.nickname || '';
    } catch { return ''; }
  })();

  const handleUnmuteRoom = (roomId) => {
    const currentMuted = JSON.parse(localStorage.getItem('mutedRooms') || '{}');
    delete currentMuted[roomId];
    localStorage.setItem('mutedRooms', JSON.stringify(currentMuted));
  };

  // 채팅방 입장 시 해당 방 알림 제거
  useEffect(() => {
    const match = location.pathname.match(/\/messages\/room\/(\d+)/);
    if (match) {
      const roomId = parseInt(match[1]);
      setNotifications(prev => prev.filter(n => n.roomId !== roomId));
    }
  }, [location.pathname]);

  useEffect(() => {
    if (isAuthPage) return;

    const checkNewMessages = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const res = await fetch(`${API}/messages/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();

        if (data.success && data.rooms) {
          const currentPath = location.pathname;

          const newNotis = [];

          data.rooms.forEach(room => {
            const prevTime = lastMessageState.current[room.ROOM_ID];
            const newTime = room.LAST_MESSAGE_AT;

            if (prevTime && newTime && newTime !== prevTime && room.UNREAD_COUNT > 0) {
              const isMentioned = typeof room.LAST_MESSAGE === 'string' && room.LAST_MESSAGE.includes(`@${myNickname}`);
              const shouldNotify = currentPath !== `/messages/room/${room.ROOM_ID}` &&
                (!room.IS_MUTED || isMentioned);

              if (shouldNotify) {
                const isGroup = room.ROOM_TYPE === 'GROUP';
                const roomName = isGroup ? (room.ROOM_NAME || '그룹 채팅방') : null;
                const senderAvatar = isGroup ? room.LAST_SENDER_AVATAR : room.TARGET_AVATAR;

                const messages = room.UNREAD_MESSAGES?.length > 0
                  ? room.UNREAD_MESSAGES
                  : [{ MESSAGE: room.LAST_MESSAGE, SENDER_NICKNAME: isGroup ? room.LAST_SENDER_NICKNAME : room.TARGET_NICKNAME }];

                messages.forEach(msg => {
                  const senderName = isGroup
                    ? (msg.SENDER_NICKNAME || '알 수 없음')
                    : (room.TARGET_NICKNAME || '알 수 없음');

                  let displayMsg = msg.MESSAGE || '';
                  let previewSticker = null;
                  let previewImage = null;

                  if (displayMsg.startsWith('__STICKER__')) {
                    previewSticker = displayMsg.replace('__STICKER__', '');
                    displayMsg = '이모티콘을 보냈습니다.';
                  } else if (msg.IMAGE_URL && !displayMsg.trim()) {
                    displayMsg = '사진을 보냈습니다.';
                    previewImage = msg.IMAGE_URL;
                  }

                  // 멘션이 포함된 메시지면 메시지 앞에 표시
                  if (typeof displayMsg === 'string' && displayMsg.includes(`@${myNickname}`)) {
                    displayMsg = `💬 ${displayMsg}`;
                  }

                  notiCounter += 1;
                  newNotis.push({
                    roomId: room.ROOM_ID,
                    id: `noti-${notiCounter}`,
                    nickname: senderName,
                    avatar: senderAvatar,
                    isGroup,
                    roomName,
                    message: displayMsg,
                    previewSticker,
                    previewImage,
                    isMention: isMentioned,
                  });
                });
              }
            }
            lastMessageState.current[room.ROOM_ID] = newTime;
          });

          if (newNotis.length > 0) {
            setNotifications(prev => [...prev, ...newNotis].slice(-3));
          }
        }
      } catch (err) { }
    };

    const interval = setInterval(checkNewMessages, 3000);
    return () => clearInterval(interval);
  }, [isAuthPage, location.pathname]);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: mode === 'dark' ? '#0F1117' : '#F8FAFC' }}>
      <CssBaseline />
      {!isAuthPage && <Menu />}
      <Box sx={{ flexGrow: 1, p: 0, backgroundColor: mode === 'dark' ? '#0F1117' : '#F8FAFC', minHeight: '100vh' }}>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/join" element={<Join />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/user/:nickname" element={<UserProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/room/:roomId" element={<Messages />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/myactivity" element={<Myactivity />} />
        </Routes>
      </Box>

      <Box sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        zIndex: 9999
      }}>
        {notifications.map((noti) => (
          <Collapse key={noti.id} in={true} timeout={300}>
            <GlobalMessageToast
              notification={noti}
              onClose={() => setNotifications(prev => prev.filter(n => n.id !== noti.id))}
              onMute={handleMuteRoom}
              onUnmute={handleUnmuteRoom}
            />
          </Collapse>
        ))}
      </Box>
    </Box >
  );
}

function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('colorMode') || 'light');

  const toggleColorMode = () => {
    const next = mode === 'light' ? 'dark' : 'light';
    setMode(next);
    localStorage.setItem('colorMode', next);
  };

  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: { main: '#FFFFFF' },
      background: {
        default: mode === 'light' ? '#F8FAFC' : '#000000',
        paper: mode === 'light' ? '#FFFFFF' : '#111111',
      },
      text: {
        primary: mode === 'light' ? '#0F172A' : '#FFFFFF',
        secondary: mode === 'light' ? '#64748B' : '#A1A1AA',
      },
    },
    typography: { fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif' },
  }), [mode]);

  return (
    <ColorModeContext.Provider value={{ mode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <GlobalStyles styles={{
          ':root': {
            '--bg-default': mode === 'light' ? '#F8FAFC' : '#0F1117',   // ✅
            '--bg-paper': mode === 'light' ? '#FFFFFF' : '#1A1D27',   // ✅
            '--text-primary': mode === 'light' ? '#0F172A' : '#F1F5F9', // ✅
            '--text-secondary': mode === 'light' ? '#64748B' : '#94A3B8', // ✅
            '--border-color': mode === 'light' ? '#E2E8F0' : '#2D3148', // ✅
            '--hover-bg': mode === 'light' ? '#F1F5F9' : '#2D3148', // ✅
          },
          body: {
            backgroundColor: mode === 'light' ? '#F8FAFC' : '#0F1117',   // ✅
            color: mode === 'light' ? '#0F172A' : '#F1F5F9',
            transition: 'background-color 0.2s, color 0.2s',
          }
        }} />
        <AppContent />
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App;