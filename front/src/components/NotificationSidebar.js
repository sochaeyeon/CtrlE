import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer, Box, Typography, Avatar, IconButton, Button, CircularProgress
} from '@mui/material';
import { Close } from '@mui/icons-material';

const API = 'http://localhost:3010';

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분`;
  if (diffHour < 24) return `${diffHour}시간`;
  if (diffDay < 7) return `${diffDay}일`;
  
  const month = date.getMonth() + 1;
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}월 ${day}일`;
};

const getCategory = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDay = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  if (diffDay < 7) return '이번 주';
  if (diffDay < 30) return '이번 달';
  return '이전 활동';
};

const getNotiMessage = (notiType, message) => {
  if (message) return message;
  switch (notiType) {
    case 'LIKE': return '님이 회원님의 게시물을 좋아합니다.';
    case 'FOLLOW': return '님이 회원님을 팔로우하기 시작했습니다.';
    case 'COMMENT': return '님이 회원님의 게시물에 댓글을 남겼습니다.';
    case 'MENTION': return '님이 댓글에서 회원님을 언급했습니다.';
    default: return '님이 새로운 활동을 했습니다.';
  }
};

const FILTERS = ['모두', '내가 팔로우하는 사람', '댓글', '팔로우', '태그 및 언급'];

export default function NotificationSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('모두');
  const token = localStorage.getItem('accessToken');
  const filterRef = useRef(null);

  useEffect(() => {
    const container = filterRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        container.scrollLeft += e.deltaY;
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    if (!open) return;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
        }
      } catch (err) { } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [open, token]);

  const toggleFollow = async (id, currentStatus) => {
    try {
      setNotifications(prev => prev.map(n =>
        n.NOTI_ID === id ? { ...n, IS_FOLLOWING: currentStatus === 'Y' ? 'N' : 'Y' } : n
      ));

      await fetch(`${API}/user/follow`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ notiId: id, action: currentStatus === 'Y' ? 'unfollow' : 'follow' })
      });
    } catch (err) { }
  };

  const handleNotiClick = (notif) => {
    onClose();
    if (notif.NOTI_TYPE === 'FOLLOW' || notif.NOTI_TYPE === 'FOLLOW_REQUEST') {
      const isRequest = notif.MESSAGE?.includes('요청') || notif.NOTI_TYPE === 'FOLLOW_REQUEST';
      if (isRequest) {
        navigate(`/user/${notif.SENDER_NICKNAME}`, {
          state: { openFollowModal: true, notiId: notif.NOTI_ID }
        });
      } else {
        navigate(`/user/${notif.SENDER_NICKNAME}`);
      }
    } else if (notif.NOTI_TYPE === 'LIKE' || notif.NOTI_TYPE === 'COMMENT' || notif.NOTI_TYPE === 'MENTION') {
      if (notif.TARGET_TYPE === 'POST' && notif.TARGET_ID) {
        navigate(`/post/${notif.TARGET_ID}`);
      }
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === '모두') return true;
    if (activeFilter === '내가 팔로우하는 사람' && n.IS_FOLLOWING === 'Y') return true;
    if (activeFilter === '댓글' && n.NOTI_TYPE === 'COMMENT') return true;
    if (activeFilter === '팔로우' && (n.NOTI_TYPE === 'FOLLOW' || n.NOTI_TYPE === 'FOLLOW_REQUEST')) return true;
    if (activeFilter === '태그 및 언급' && n.NOTI_TYPE === 'MENTION') return true;
    return false;
  });

  const groupedNotifs = filteredNotifs.reduce((acc, notif) => {
    const category = getCategory(notif.CREATED_AT);
    if (!acc[category]) acc[category] = [];
    acc[category].push(notif);
    return acc;
  }, {});

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          backgroundColor: '#FFFFFF',
          color: '#0F172A',
          borderRight: '1px solid #E2E8F0',
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#0F172A' }}>알림</Typography>
          <IconButton onClick={onClose} sx={{ color: '#64748B' }}>
            <Close />
          </IconButton>
        </Box>

        <Box
          ref={filterRef}
          sx={{
            display: 'flex',
            gap: 1,
            overflowX: 'auto',
            pb: 1,
            mb: 2,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none'
          }}
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.preventDefault();
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
        >
          {FILTERS.map(filter => (
            <Box
              key={filter}
              onClick={() => setActiveFilter(filter)}
              sx={{
                px: 2, py: 0.8,
                borderRadius: 5,
                fontSize: '0.85rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                backgroundColor: activeFilter === filter ? '#0F172A' : '#F1F5F9',
                color: activeFilter === filter ? '#FFFFFF' : '#0F172A',
                border: activeFilter === filter ? 'none' : '1px solid #E2E8F0',
              }}
            >
              {filter}
            </Box>
          ))}
        </Box>

        <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress sx={{ color: '#2563EB' }} />
            </Box>
          ) : filteredNotifs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5, color: '#94A3B8' }}>
              <Typography sx={{ fontSize: '0.9rem' }}>알림이 없습니다.</Typography>
            </Box>
          ) : (
            ['이번 주', '이번 달', '이전 활동'].map(group => {
              if (!groupedNotifs[group] || groupedNotifs[group].length === 0) return null;

              return (
                <Box key={group} sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, mb: 1.5, px: 1, color: '#0F172A' }}>
                    {group}
                  </Typography>

                  {groupedNotifs[group].map(notif => (
                    <Box
                      key={notif.NOTI_ID}
                      onClick={() => handleNotiClick(notif)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        mb: 0.5,
                        p: 1.2,
                        borderRadius: 3,
                        cursor: 'pointer',
                        backgroundColor: 'transparent',
                        transition: 'background-color 0.15s',
                        '&:hover': { backgroundColor: '#F1F5F9' }
                      }}
                    >
                      <Avatar
                        src={notif.SENDER_AVATAR ? `${API}${notif.SENDER_AVATAR}` : undefined}
                        sx={{ width: 44, height: 44, backgroundColor: '#0F172A', color: '#FFFFFF', fontWeight: 800 }}
                      >
                        {!notif.SENDER_AVATAR && getInitial(notif.SENDER_NICKNAME)}
                      </Avatar>

                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.4, wordBreak: 'keep-all', color: '#0F172A' }}>
                          <Box component="span" sx={{ fontWeight: 800 }}>{notif.SENDER_NICKNAME}</Box>
                          {getNotiMessage(notif.NOTI_TYPE, notif.MESSAGE)}
                          <Box component="span" sx={{ color: '#64748B', ml: 0.6, fontSize: '0.8rem' }}>
                            {formatTime(notif.CREATED_AT)}
                          </Box>
                        </Typography>
                      </Box>

                      {notif.NOTI_TYPE === 'FOLLOW' && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(notif.NOTI_ID, notif.IS_FOLLOWING);
                          }}
                          sx={{
                            backgroundColor: notif.IS_FOLLOWING === 'Y' ? '#F1F5F9' : '#0F172A',
                            color: notif.IS_FOLLOWING === 'Y' ? '#0F172A' : '#FFFFFF',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            borderRadius: 2,
                            px: 2,
                            py: 0.6,
                            minWidth: 70,
                            boxShadow: 'none',
                            border: notif.IS_FOLLOWING === 'Y' ? '1px solid #E2E8F0' : 'none',
                            '&:hover': {
                              backgroundColor: notif.IS_FOLLOWING === 'Y' ? '#E2E8F0' : '#334155',
                              boxShadow: 'none',
                            }
                          }}
                        >
                          {notif.IS_FOLLOWING === 'Y' ? '팔로잉' : '팔로우'}
                        </Button>
                      )}

                      {(notif.NOTI_TYPE === 'LIKE' || notif.NOTI_TYPE === 'COMMENT') && notif.TARGET_IMAGE && (
                        <Box
                          component="img"
                          src={`${API}${notif.TARGET_IMAGE}`}
                          sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover' }}
                        />
                      )}
                    </Box>
                  ))}
                </Box>
              );
            })
          )}
        </Box>
      </Box>
    </Drawer>
  );
}