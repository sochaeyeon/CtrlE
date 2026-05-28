import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Card,
  CardHeader,
  CardMedia,
  CardContent,
  Dialog,
  IconButton,
  Button,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  createTheme,
  ThemeProvider,
  CssBaseline,
  Stack,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SendIcon from '@mui/icons-material/Send';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

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
  shape: { borderRadius: 12 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#F1F5F9',
            borderRadius: 24,
            '& fieldset': { borderColor: 'transparent' },
            '&:hover fieldset': { borderColor: '#E2E8F0' },
            '&.Mui-focused fieldset': {
              borderColor: '#2563EB',
              borderWidth: 1,
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 700,
          borderRadius: 8,
          transition: 'all 0.2s',
        },
      },
    },
  },
});

export default function Feed() {
  const navigate = useNavigate();
  const [feeds, setFeeds] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const token = localStorage.getItem('accessToken');

  const loadFeeds = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3010/feed/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setFeeds(data.feeds);
      } else {
        setFeeds([
          {
            id: 1,
            title: '테라포밍 오라클 아키텍처 가이드',
            description: 'CtrlE 인프라 큐 시스템 동기화 가이드 백서 초안입니다. 오라클 커넥션 풀 자원 회수 최적화 설정에 관련된 트랙 리포트를 공유합니다.',
            image: 'https://images.unsplash.com/photo-1551963831-b3b1ca40c98e',
            writer: 'ChaeYeon',
          },
          {
            id: 2,
            title: '리액트 가상 돔 메모이제이션 트랩',
            description: 'useEffect 내부 컨텍스트 디펜던시 배열이 꼬였을 때 발생하는 메모리 누수 버그 분석 아카이빙입니다. 무한 루프 렌더링 검출용 모듈 피드입니다.',
            image: 'https://images.unsplash.com/photo-1521747116042-5a810fda9664',
            writer: 'DevMaster',
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    const oauthToken = sessionStorage.getItem('oauthToken');

    if (oauthToken) {
      localStorage.setItem('accessToken', oauthToken);
      sessionStorage.removeItem('oauthToken');
      loadFeeds();
    } else if (!token) {
      navigate('/');
    } else {
      loadFeeds();
    }
  }, [token, navigate, loadFeeds]);

  const handleClickOpen = async (feed) => {
    setSelectedFeed(feed);
    setOpen(true);
    setNewComment('');
    
    try {
      const response = await fetch(`http://localhost:3010/feed/${feed.id}/comments`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setComments(data.comments);
      } else {
        setComments([
          { id: 1, writer: 'SystemArchitect', text: '오라클 커넥션 드라이버 정보 공유 감사합니다.' },
          { id: 2, writer: 'BugHunter', text: '이거 에러 로그 아카이브 패치 버전에 수록되나요?' }
        ]);
      }
    } catch (err) {
      setComments([
        { id: 1, writer: 'SystemArchitect', text: '오라클 커넥션 드라이버 정보 공유 감사합니다.' },
        { id: 2, writer: 'BugHunter', text: '이거 에러 로그 아카이브 패치 버전에 수록되나요?' }
      ]);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedFeed(null);
    setComments([]);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`http://localhost:3010/feed/${selectedFeed.id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newComment })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setComments([...comments, data.comment]);
        setNewComment('');
      } else {
        setComments([...comments, { id: Date.now(), writer: '나(Current)', text: newComment }]);
        setNewComment('');
      }
    } catch (err) {
      setComments([...comments, { id: Date.now(), writer: '나(Current)', text: newComment }]);
      setNewComment('');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    navigate('/');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <AppBar position="sticky" elevation={0} sx={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: '0 !important', height: 64 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, cursor: 'pointer' }} onClick={() => navigate('/feed')}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.2, backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '0.9rem', lineHeight: 1 }}>{'<>'}</Typography>
              </Box>
              <Typography sx={{ color: '#0F172A', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>
                CtrlE
              </Typography>
            </Box>
            <Button 
              onClick={handleLogout} 
              sx={{ color: '#0F172A', fontWeight: 700, '&:hover': { backgroundColor: '#F1F5F9' } }}
            >
              로그아웃
            </Button>
          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', pt: 4, pb: 10 }}>
        <Stack spacing={4} sx={{ width: '100%', maxWidth: 470 }}>
          {feeds.map((feed) => (
            <Card 
              key={feed.id}
              elevation={0} 
              sx={{ 
                border: '1px solid #E2E8F0', 
                borderRadius: 2,
                backgroundColor: '#FFFFFF',
              }}
            >
              <CardHeader
                avatar={
                  <Avatar sx={{ backgroundColor: '#0F172A', width: 36, height: 36, fontSize: '0.9rem', fontWeight: 800 }}>
                    {feed.writer?.charAt(0).toUpperCase()}
                  </Avatar>
                }
                action={
                  <IconButton sx={{ color: '#0F172A' }}>
                    <MoreHorizIcon />
                  </IconButton>
                }
                title={feed.writer || 'Unknown'}
                titleTypographyProps={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}
                sx={{ p: 1.5 }}
              />
              
              <Box 
                sx={{ width: '100%', paddingTop: '100%', position: 'relative', backgroundColor: '#F8FAFC', cursor: 'pointer' }}
                onClick={() => handleClickOpen(feed)}
              >
                <CardMedia
                  component="img"
                  image={feed.image}
                  alt={feed.title}
                  sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
              
              <CardContent sx={{ p: 2, pb: '16px !important' }}>
                <Stack direction="row" spacing={1} sx={{ mb: 1, ml: -1 }}>
                  <IconButton size="small" sx={{ color: '#0F172A', '&:hover': { color: '#EF4444' } }}>
                    <FavoriteBorderIcon sx={{ fontSize: 26 }} />
                  </IconButton>
                  <IconButton size="small" sx={{ color: '#0F172A' }} onClick={() => handleClickOpen(feed)}>
                    <ChatBubbleOutlineIcon sx={{ fontSize: 24 }} />
                  </IconButton>
                </Stack>

                <Box sx={{ mb: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A', display: 'inline', mr: 1 }}>
                    {feed.writer}
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', color: '#0F172A', display: 'inline' }}>
                    {feed.title}
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: '0.88rem', color: '#64748B', lineHeight: 1.5, mb: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {feed.description}
                </Typography>

                <Typography 
                  onClick={() => handleClickOpen(feed)}
                  sx={{ fontSize: '0.88rem', color: '#94A3B8', cursor: 'pointer', fontWeight: 500 }}
                >
                  댓글 모두 보기
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Stack>
      </Box>

      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md" PaperProps={{ sx: { borderRadius: { xs: 0, md: 2 }, overflow: 'hidden', height: { xs: '100%', md: '600px' }, maxHeight: '100%', m: { xs: 0, md: 4 } } }}>
        <Box sx={{ display: 'flex', height: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
          
          <Box sx={{ flex: 1.4, backgroundColor: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: { xs: '40vh', md: '100%' } }}>
            {selectedFeed?.image && (
              <img src={selectedFeed.image} alt={selectedFeed.title} style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute' }} />
            )}
            <IconButton onClick={handleClose} sx={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(15,23,42,0.6)', color: '#FFFFFF', '&:hover': { backgroundColor: 'rgba(15,23,42,0.8)' }, display: { xs: 'flex', md: 'none' } }}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', width: { md: '380px', xs: '100%' }, backgroundColor: '#FFFFFF', borderLeft: { md: '1px solid #E2E8F0', xs: 'none' } }}>
            <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ backgroundColor: '#0F172A', width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800 }}>{selectedFeed?.writer?.charAt(0).toUpperCase()}</Avatar>
                <Typography sx={{ fontWeight: 800, fontSize: '0.9rem', color: '#0F172A' }}>{selectedFeed?.writer || 'Unknown'}</Typography>
              </Stack>
              <IconButton onClick={handleClose} sx={{ color: '#64748B', display: { xs: 'none', md: 'flex' } }}><CloseIcon /></IconButton>
            </Box>

            <Box sx={{ flex: 1, overflowY: 'auto', p: 0, backgroundColor: '#FFFFFF' }}>
              <Box sx={{ p: 2, display: 'flex', gap: 1.5, borderBottom: '1px solid #F1F5F9' }}>
                <Avatar sx={{ backgroundColor: '#0F172A', width: 32, height: 32, fontSize: '0.8rem', fontWeight: 800 }}>{selectedFeed?.writer?.charAt(0).toUpperCase()}</Avatar>
                <Box>
                  <Typography sx={{ fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.5 }}>
                    <Box component="span" sx={{ fontWeight: 800, mr: 1 }}>{selectedFeed?.writer}</Box>
                    {selectedFeed?.title}
                  </Typography>
                  <Typography sx={{ fontSize: '0.88rem', color: '#334155', mt: 0.5, lineHeight: 1.5 }}>{selectedFeed?.description}</Typography>
                </Box>
              </Box>

              <List sx={{ p: 0 }}>
                {comments.map((comment) => (
                  <ListItem key={comment.id} sx={{ px: 2, py: 1.5, alignItems: 'flex-start' }}>
                    <ListItemAvatar sx={{ minWidth: 44 }}>
                      <Avatar sx={{ width: 32, height: 32, backgroundColor: '#2563EB', fontSize: '0.8rem', fontWeight: 800 }}>{comment.writer?.charAt(0).toUpperCase()}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: '0.9rem', color: '#0F172A', lineHeight: 1.4 }}>
                          <Box component="span" sx={{ fontWeight: 800, mr: 1 }}>{comment.writer}</Box>
                          {comment.text}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
              <Stack direction="row" spacing={1.5} sx={{ mb: 2, ml: -1 }}>
                <IconButton size="small" sx={{ color: '#0F172A', '&:hover': { color: '#EF4444' } }}>
                  <FavoriteBorderIcon sx={{ fontSize: 26 }} />
                </IconButton>
                <IconButton size="small" sx={{ color: '#0F172A' }}>
                  <ChatBubbleOutlineIcon sx={{ fontSize: 24 }} />
                </IconButton>
              </Stack>
              <TextField
                placeholder="댓글 달기..."
                variant="outlined"
                size="small"
                fullWidth
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
                inputProps={{ style: { fontSize: '0.9rem' } }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button 
                        onClick={handleAddComment} 
                        disabled={!newComment.trim()}
                        sx={{ color: '#2563EB', fontWeight: 800, minWidth: 'auto', p: 0, '&:disabled': { color: '#94A3B8' } }}
                      >
                        게시
                      </Button>
                    </InputAdornment>
                  )
                }}
              />
            </Box>

          </Box>
        </Box>
      </Dialog>
    </ThemeProvider>
  );
}