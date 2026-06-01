import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Typography, createTheme, ThemeProvider, CssBaseline,
  InputBase, IconButton, CircularProgress, Stack
} from '@mui/material';
import {
  ArrowBack, SendRounded, ImageOutlined, GroupOutlined
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
});

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const formatChatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
};

export default function ChatRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');
  
  const myNickname = (() => {
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
      return payload.nickname;
    } catch { return ''; }
  })();

  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);

  // 자동 스크롤
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 데이터 로드
  useEffect(() => {
    if (!token) return navigate('/');
    
    const fetchChatData = async () => {
      try {
        const res = await fetch(`${API}/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRoomInfo(data.room);
          setMessages(data.messages || []);
        } else {
          navigate('/messages'); // 방 접근 권한이 없거나 방이 없으면 튕겨냄
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchChatData();
    
    // (선택) 웹소켓이 없다면 3초마다 폴링(Polling)해서 새 메시지 가져오기
    const interval = setInterval(fetchChatData, 3000);
    return () => clearInterval(interval);
  }, [roomId, token, navigate]);

  // 메시지 전송
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // Optimistic UI (화면에 먼저 반영)
    const optimisticMsg = {
      MESSAGE_ID: Date.now(),
      SENDER_NICKNAME: myNickname,
      MESSAGE: newMessage,
      SENT_AT: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');

    try {
      await fetch(`${API}/messages/${roomId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: optimisticMsg.MESSAGE })
      });
      // 성공 시 다음 폴링에서 정확한 DB 데이터로 덮어씌워짐
    } catch (err) {
      console.error('메시지 전송 실패:', err);
    }
  };

  if (loading || !roomInfo) {
    return (
      <ThemeProvider theme={theme}><CssBaseline />
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#F8FAFC' }}>
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  const isGroup = roomInfo.ROOM_TYPE === 'GROUP';
  const displayTitle = isGroup ? (roomInfo.ROOM_NAME || '그룹 채팅방') : roomInfo.TARGET_NICKNAME;
  const displayAvatar = isGroup ? null : roomInfo.TARGET_AVATAR;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#F8FAFC', maxWidth: 800, mx: 'auto', borderLeft: '1px solid #E2E8F0', borderRight: '1px solid #E2E8F0' }}>
        
        {/* 상단 헤더 */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0', zIndex: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => navigate('/messages')} sx={{ color: '#64748B' }}>
              <ArrowBack />
            </IconButton>
            <Avatar src={displayAvatar ? `${API}${displayAvatar}` : undefined} sx={{ width: 38, height: 38, backgroundColor: isGroup ? '#E2E8F0' : '#0F172A', color: isGroup ? '#64748B' : '#fff', fontWeight: 800 }}>
              {isGroup ? <GroupOutlined fontSize="small" /> : getInitial(displayTitle)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>{displayTitle}</Typography>
              {isGroup && <Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>멤버 {roomInfo.MEMBER_COUNT}명</Typography>}
            </Box>
          </Box>
        </Box>

        {/* 메시지 리스트 영역 */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {messages.map((msg, idx) => {
            const isMe = msg.SENDER_NICKNAME === myNickname;
            const showAvatar = !isMe && (idx === 0 || messages[idx - 1].SENDER_NICKNAME !== msg.SENDER_NICKNAME);

            return (
              <Box key={msg.MESSAGE_ID || idx} sx={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 1 }}>
                
                {/* 상대방 프로필 (연속된 메시지면 첫 번째에만 표시) */}
                {!isMe && (
                  <Box sx={{ width: 32, flexShrink: 0 }}>
                    {showAvatar && (
                      <Avatar src={msg.SENDER_AVATAR ? `${API}${msg.SENDER_AVATAR}` : undefined} sx={{ width: 32, height: 32, backgroundColor: '#0F172A', fontSize: '0.7rem', fontWeight: 800 }}>
                        {getInitial(msg.SENDER_NICKNAME)}
                      </Avatar>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                  {!isMe && showAvatar && isGroup && (
                    <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mb: 0.5, ml: 0.5 }}>{msg.SENDER_NICKNAME}</Typography>
                  )}
                  
                  <Stack direction={isMe ? 'row-reverse' : 'row'} alignItems="flex-end" spacing={0.8}>
                    {/* 말풍선 */}
                    <Box sx={{
                      px: 2, py: 1.2,
                      backgroundColor: isMe ? '#2563EB' : '#fff',
                      color: isMe ? '#fff' : '#0F172A',
                      border: isMe ? 'none' : '1px solid #E2E8F0',
                      borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                      wordBreak: 'break-word'
                    }}>
                      <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                        {msg.MESSAGE}
                      </Typography>
                    </Box>
                    
                    {/* 시간 */}
                    <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', minWidth: 40, textAlign: isMe ? 'right' : 'left' }}>
                      {formatChatTime(msg.SENT_AT)}
                    </Typography>
                  </Stack>
                </Box>
              </Box>
            );
          })}
          <div ref={messagesEndRef} />
        </Box>

        {/* 입력 영역 */}
        <Box component="form" onSubmit={handleSend} sx={{ p: 2, backgroundColor: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton sx={{ color: '#94A3B8' }}>
            <ImageOutlined />
          </IconButton>
          <InputBase
            fullWidth
            placeholder="메시지 입력..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            sx={{
              backgroundColor: '#F1F5F9', px: 2, py: 1.2, borderRadius: 3,
              fontSize: '0.95rem', color: '#0F172A'
            }}
          />
          <IconButton type="submit" disabled={!newMessage.trim()} sx={{ backgroundColor: newMessage.trim() ? '#2563EB' : '#E2E8F0', color: '#fff', '&:hover': { backgroundColor: '#1D4ED8' }, transition: 'all 0.2s', p: 1.2 }}>
            <SendRounded sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

      </Box>
    </ThemeProvider>
  );
}