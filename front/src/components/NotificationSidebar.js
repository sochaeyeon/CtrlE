import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer, Box, Typography, Avatar, IconButton, Button, CircularProgress
} from '@mui/material';
import { Close, Check, PersonOff } from '@mui/icons-material';
import { useColorMode } from '../App';

const API = 'http://localhost:3010';
const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMin = Math.floor((now - date) / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분`;
  if (diffHour < 24) return `${diffHour}시간`;
  if (diffDay < 7) return `${diffDay}일`;
  const m = date.getMonth() + 1;
  const d = date.getDate().toString().padStart(2, '0');
  return `${m}월 ${d}일`;
};

const getCategory = (dateStr) => {
  const diffDay = Math.floor((new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24));
  if (diffDay < 7) return '이번 주';
  if (diffDay < 30) return '이번 달';
  return '이전 활동';
};

const getNotiMessage = (notiType) => {
  switch (notiType) {
    case 'LIKE': return '님이 회원님의 게시물을 좋아합니다.';
    case 'FOLLOW': return '님이 회원님을 팔로우하기 시작했습니다.';
    case 'FOLLOW_REQUEST': return '님이 팔로우를 요청했습니다.';
    case 'FOLLOW_ACCEPTED': return '님이 팔로우 요청을 수락했습니다.';
    case 'COMMENT': return '님이 회원님의 게시물에 댓글을 남겼습니다.';
    case 'MENTION': return '님이 프로필에서 회원님을 언급했습니다.';
    default: return '님이 새로운 활동을 했습니다.';
  }
};

const FILTERS = ['모두', '팔로우', '댓글', '좋아요', '태그 및 언급'];
const TOKEN = () => localStorage.getItem('accessToken');

export default function NotificationSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { mode } = useColorMode();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('모두');
  const [pendingId, setPendingId] = useState(null);
  const filterRef = useRef(null);

  // 필터 가로 휠 스크롤
  useEffect(() => {
    const el = filterRef.current;
    if (!el) return;
    const handler = (e) => { e.preventDefault(); el.scrollLeft += e.deltaY; };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // 알림 불러오기
  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API}/notifications`, {
          headers: { Authorization: `Bearer ${TOKEN()}` }
        });
        const data = await res.json();
        if (data.success) setNotifications(data.notifications || []);
      } catch { } finally { setLoading(false); }
    })();
  }, [open]);

  // 읽음 처리 (사이드바 열릴 때)
  useEffect(() => {
    if (!open) return;
    fetch(`${API}/notifications/read`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${TOKEN()}` }
    }).catch(() => { });
  }, [open]);

  // 팔로우 토글
  const toggleFollow = async (notif) => {
    setPendingId(notif.NOTI_ID);
    try {
      const res = await fetch(`${API}/user/follow/${notif.SENDER_ID}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN()}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n =>
          n.SENDER_ID === notif.SENDER_ID
            ? { ...n, IS_FOLLOWING: data.status === 'ACCEPTED' ? 'Y' : 'N' }
            : n
        ));
      }
    } catch { } finally { setPendingId(null); }
  };

  // 팔로우 요청 수락
  const acceptRequest = async (notif) => {
    setPendingId(notif.NOTI_ID);
    try {
      const res = await fetch(`${API}/user/follow/${notif.SENDER_ID}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${TOKEN()}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.map(n =>
          n.NOTI_ID === notif.NOTI_ID ? { ...n, NOTI_TYPE: 'FOLLOW', IS_FOLLOWING: 'N' } : n
        ));
      }
    } catch { } finally { setPendingId(null); }
  };

  // 팔로우 요청 거절
  const rejectRequest = async (notif) => {
    setPendingId(notif.NOTI_ID);
    try {
      const res = await fetch(`${API}/user/follow/${notif.SENDER_ID}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${TOKEN()}` }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(prev => prev.filter(n => n.NOTI_ID !== notif.NOTI_ID));
      }
    } catch { } finally { setPendingId(null); }
  };

  const handleNotiClick = (notif) => {
    onClose();
    if (notif.NOTI_TYPE === 'FOLLOW_REQUEST') {
      navigate(`/user/${notif.SENDER_NICKNAME}`, {
        state: { openFollowBanner: true, notiId: notif.NOTI_ID }
      });
      return;
    }
    onClose();
    if (notif.NOTI_TYPE === 'FOLLOW' || notif.NOTI_TYPE === 'FOLLOW_ACCEPTED') {
      navigate(`/user/${notif.SENDER_NICKNAME}`);
    } else if (notif.NOTI_TYPE === 'MENTION') {
      navigate(`/user/${notif.SENDER_NICKNAME}`);
    } else if (notif.NOTI_TYPE === 'LIKE') {
      if (notif.TARGET_TYPE === 'POST' && notif.TARGET_ID) navigate(`/post/${notif.TARGET_ID}`);
    } else if (notif.NOTI_TYPE === 'COMMENT') {
      if (notif.TARGET_TYPE === 'POST' && notif.TARGET_ID) {
        navigate(`/post/${notif.TARGET_ID}`, {
          state: { highlightComment: true, highlightNickname: notif.SENDER_NICKNAME, highlightNotiId: notif.NOTI_ID }
        });
      }
    }
  };

  // 필터링
  const filteredNotifs = notifications.filter(n => {
    if (activeFilter === '모두') return true;
    if (activeFilter === '팔로우') return ['FOLLOW', 'FOLLOW_REQUEST', 'FOLLOW_ACCEPTED'].includes(n.NOTI_TYPE);
    if (activeFilter === '댓글') return n.NOTI_TYPE === 'COMMENT';
    if (activeFilter === '좋아요') return n.NOTI_TYPE === 'LIKE';
    if (activeFilter === '태그 및 언급') return n.NOTI_TYPE === 'MENTION';
    return false;
  });

  const groupedNotifs = filteredNotifs.reduce((acc, notif) => {
    const cat = getCategory(notif.CREATED_AT);
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(notif);
    return acc;
  }, {});

  return (
    <Drawer anchor="left" open={open} onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400 },
          backgroundColor: 'var(--bg-paper)',
          borderRight: '1px solid var(--border-color)'
        }
      }}>
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--bg-paper)' }}>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>알림</Typography>
          <IconButton onClick={onClose} sx={{ color: 'var(--text-secondary)' }}><Close /></IconButton>
        </Box>

        {/* 필터 */}
        <Box ref={filterRef} sx={{
          display: 'flex', gap: 0.6, overflowX: 'auto', pb: 1, mb: 2,
          mx: -2, px: 2,
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}>
          {FILTERS.map(f => (
            <Box key={f} onClick={() => setActiveFilter(f)} sx={{
              px: 1.4, py: 0.6,
              borderRadius: 5,
              fontSize: '0.78rem',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              flexShrink: 0,
              border: '1px solid transparent',
              backgroundColor: activeFilter === f ? 'var(--text-primary)' : 'var(--hover-bg)',
              color: activeFilter === f ? 'var(--bg-paper)' : 'var(--text-primary)',
              borderColor: activeFilter === f ? 'var(--text-primary)' : 'var(--border-color)',
              transition: 'background-color 0.15s, color 0.15s, border-color 0.15s',
              '&:last-child': { mr: 2 },
            }}>
              {f}
            </Box>
          ))}
        </Box>

        {/* 알림 목록 */}
        <Box sx={{ flex: 1, overflowY: 'auto', '&::-webkit-scrollbar': { display: 'none' } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress sx={{ color: '#2563EB' }} />
            </Box>
          ) : filteredNotifs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography sx={{ fontSize: '0.9rem', color: '#94A3B8' }}>알림이 없습니다.</Typography>
            </Box>
          ) : (
            ['이번 주', '이번 달', '이전 활동'].map(group => {
              const items = groupedNotifs[group];
              if (!items?.length) return null;
              return (
                <Box key={group} sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, mb: 1.5, px: 1, color: 'var(--text-primary)' }}>                    {group}
                  </Typography>
                  {items.map(notif => (
                    <Box key={notif.NOTI_ID}
                      onClick={() => handleNotiClick(notif)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 1.5,
                        mb: 0.5, p: 1.2, borderRadius: 3,
                        cursor: 'pointer',
                        backgroundColor: notif.IS_READ === 'N' ? (mode === 'dark' ? '#1E2D4A' : '#F0F7FF') : 'transparent',
                        '&:hover': { backgroundColor: 'var(--hover-bg)' },
                        transition: 'background-color 0.15s',
                      }}>
                      <Avatar
                        src={notif.SENDER_AVATAR ? `${API}${notif.SENDER_AVATAR}` : undefined}
                        onClick={(e) => { e.stopPropagation(); onClose(); navigate(`/user/${notif.SENDER_NICKNAME}`); }}
                        sx={{ width: 44, height: 44, backgroundColor: 'var(--text-primary)', color: 'var(--bg-paper)', fontWeight: 800, cursor: 'pointer', flexShrink: 0 }}>
                        {!notif.SENDER_AVATAR && getInitial(notif.SENDER_NICKNAME)}
                      </Avatar>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography sx={{ fontSize: '0.88rem', lineHeight: 1.4, color: 'var(--text-primary)' }}>
                          <Box component="span" sx={{ fontWeight: 800 }}>{notif.SENDER_NICKNAME}</Box>
                          {getNotiMessage(notif.NOTI_TYPE)}
                          <Box component="span" sx={{ color: 'var(--text-secondary)', ml: 0.6, fontSize: '0.78rem' }}>
                            {formatTime(notif.CREATED_AT)}
                          </Box>
                        </Typography>
                      </Box>

                      {notif.NOTI_TYPE === 'FOLLOW_REQUEST' && (
                        <Box sx={{ display: 'flex', gap: 0.8, flexShrink: 0 }}>
                          <Button size="small" onClick={(e) => { e.stopPropagation(); acceptRequest(notif); }}
                            disabled={pendingId === notif.NOTI_ID}
                            sx={{ backgroundColor: '#2563EB', color: '#fff', fontSize: '0.78rem', fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 52, textTransform: 'none', boxShadow: 'none', '&:hover': { backgroundColor: '#1D4ED8' } }}>
                            {pendingId === notif.NOTI_ID ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : '수락'}
                          </Button>
                          <Button size="small" onClick={(e) => { e.stopPropagation(); rejectRequest(notif); }}
                            disabled={pendingId === notif.NOTI_ID}
                            sx={{
                              backgroundColor: 'var(--hover-bg)', color: 'var(--text-primary)', fontSize: '0.78rem', fontWeight: 700, borderRadius: 1.5, px: 1.5, py: 0.5, minWidth: 52, textTransform: 'none', border: '1px solid var(--border-color)', '&:hover': { backgroundColor: 'var(--border-color)' }
                            }}>
                            거절
                          </Button>
                        </Box>
                      )}

                      {notif.NOTI_TYPE === 'FOLLOW' && (
                        <Button size="small" onClick={(e) => { e.stopPropagation(); toggleFollow(notif); }}
                          disabled={pendingId === notif.NOTI_ID}
                          sx={{
                            flexShrink: 0,
                            backgroundColor: notif.IS_FOLLOWING === 'Y' ? 'var(--hover-bg)' : 'var(--text-primary)',
                            color: notif.IS_FOLLOWING === 'Y' ? 'var(--text-primary)' : 'var(--bg-paper)',
                            border: notif.IS_FOLLOWING === 'Y' ? '1px solid var(--border-color)' : 'none',
                            '&:hover': {
                              backgroundColor: notif.IS_FOLLOWING === 'Y'
                                ? (mode === 'dark' ? '#3D4258' : '#E2E8F0')
                                : (mode === 'dark' ? '#CBD5E1' : '#334155'),
                            },
                            fontSize: '0.78rem', fontWeight: 700, borderRadius: 1.5,
                            px: 1.5, py: 0.5, minWidth: 64, textTransform: 'none', boxShadow: 'none',
                          }}>
                          {pendingId === notif.NOTI_ID
                            ? <CircularProgress size={12} sx={{ color: notif.IS_FOLLOWING === 'Y' ? 'var(--text-primary)' : 'var(--bg-paper)' }}
                            />
                            : notif.IS_FOLLOWING === 'Y' ? '팔로잉' : '팔로우'}
                        </Button>
                      )}

                      {['LIKE', 'COMMENT'].includes(notif.NOTI_TYPE) && notif.TARGET_IMAGE && (
                        <Box component="img" src={notif.TARGET_IMAGE}
                          sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }} />
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