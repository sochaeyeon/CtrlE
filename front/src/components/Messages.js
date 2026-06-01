import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Typography, createTheme, ThemeProvider, CssBaseline,
  InputBase, IconButton, List, ListItem, ListItemAvatar, ListItemText,
  CircularProgress, Paper, Badge, Stack, Menu, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Switch,
  FormControlLabel, AvatarGroup, Grid, Checkbox, Popover, Select,
  Collapse, Snackbar, Alert
} from '@mui/material';
import {
  Search, Close, MailOutline, SendRounded, ImageOutlined, GroupOutlined,
  ArrowBack, SentimentSatisfiedAlt, MoreVert, InfoOutlined, ExitToApp,
  ReportGmailerrorred, DeleteOutline, EditOutlined, AddCircleOutline,
  AttachFile, ExpandMore, ExpandLess, PeopleOutline, NotificationsOff
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
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes stickerBounce {
          0% { transform: scale(0.5); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `
    }
  }
});

const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');
const getAvatarColor = () => '#0F172A';
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday = date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  if (isToday) return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

const formatActivity = (lastActiveAt) => {
  if (!lastActiveAt) return null;
  const diff = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 1000);
  if (diff < 60) return '방금 전 활동';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전 활동`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전 활동`;
  // 7일 이상이면 null 대신 날짜 표시
  return new Date(lastActiveAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' 활동';
};

const GroupAvatar = ({ avatars, nicknames = [], size = 42, roomImage }) => {
  if (roomImage) {
    return <Avatar src={roomImage.startsWith('http') ? roomImage : `${API}${roomImage}`} sx={{ width: size, height: size }} />;
  }
  const list = (avatars || []).slice(0, 4);
  const nameList = (nicknames || []).slice(0, 4);
  const count = Math.max(list.length, nameList.length);

  if (count === 0) {
    return (
      <Avatar sx={{ width: size, height: size, backgroundColor: '#E2E8F0', color: '#94A3B8' }}>
        <GroupOutlined fontSize="small" />
      </Avatar>
    );
  }

  if (count === 1) {
    return list[0] ? (
      <Avatar src={`${API}${list[0]}`} sx={{ width: size, height: size }} />
    ) : (
      <Avatar sx={{ width: size, height: size, backgroundColor: getAvatarColor(nameList[0]), fontSize: size * 0.4, fontWeight: 800 }}>
        {getInitial(nameList[0])}
      </Avatar>
    );
  }

  return (
    <Box sx={{
      width: size, height: size,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: count > 2 ? '1fr 1fr' : '1fr',
      borderRadius: '50%',
      overflow: 'hidden',
      flexShrink: 0
    }}>
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        list[i] ? (
          <Box key={i} component="img" src={`${API}${list[i]}`}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Box key={i} sx={{
            width: '100%', height: '100%',
            backgroundColor: getAvatarColor(nameList[i]),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: size * 0.22, fontWeight: 800
          }}>
            {getInitial(nameList[i])}
          </Box>
        )
      ))}
    </Box>
  );
};

const MESSAGE_REPORT_REASONS = [
  { value: 'SPAM', label: '스팸 / 광고성 메시지' },
  { value: 'HATE', label: '혐오 발언 / 차별' },
  { value: 'ADULT', label: '성인 / 음란물' },
  { value: 'HARASSMENT', label: '괴롭힘 / 위협' },
  { value: 'OTHER', label: '기타' },
];

const MessageReportModal = ({ open, onClose, onSuccess }) => {
  const [reason, setReason] = useState('');
  const [detail, setDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason || submitting) return;
    setSubmitting(true);
    try {
      await new Promise(r => setTimeout(r, 400));
      setReason(''); setDetail('');
      onClose();
      onSuccess();
    } catch {
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 3,
          minWidth: 340,
          maxWidth: 440,
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(15,23,42,0.18)',
        }
      }}
    >
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, backgroundColor: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ReportGmailerrorred sx={{ fontSize: 17, color: '#DC2626' }} />
          </Box>
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>메시지 신고</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        <Typography sx={{ fontSize: '0.82rem', color: '#64748B', mb: 2 }}>신고 사유를 선택해주세요.</Typography>
        <Stack spacing={0.5}>
          {MESSAGE_REPORT_REASONS.map(r => (
            <Box
              key={r.value}
              onClick={() => setReason(r.value)}
              sx={{
                px: 1.5, py: 1.1, borderRadius: 1.5, cursor: 'pointer',
                border: reason === r.value ? '1px solid #BFDBFE' : '1px solid #F1F5F9',
                backgroundColor: reason === r.value ? '#EFF6FF' : '#FAFAFA',
                display: 'flex', alignItems: 'center', gap: 1,
                transition: 'all 0.15s',
                '&:hover': { backgroundColor: reason === r.value ? '#EFF6FF' : '#F1F5F9' }
              }}
            >
              <Box sx={{
                width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
                border: reason === r.value ? '5px solid #2563EB' : '2px solid #CBD5E1',
                transition: 'all 0.15s'
              }} />
              <Typography sx={{
                fontSize: '0.88rem',
                fontWeight: reason === r.value ? 600 : 400,
                color: reason === r.value ? '#2563EB' : '#0F172A'
              }}>
                {r.label}
              </Typography>
            </Box>
          ))}
        </Stack>

        {reason === 'OTHER' && (
          <InputBase
            fullWidth multiline rows={2}
            placeholder="기타 사유를 입력해주세요"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            sx={{
              mt: 1.5, backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0', borderRadius: 1.5,
              px: 2, py: 1, fontSize: '0.85rem',
              '&:focus-within': { borderColor: '#2563EB' }
            }}
          />
        )}

        <Button
          fullWidth variant="contained"
          disabled={!reason || submitting}
          onClick={handleSubmit}
          sx={{
            mt: 2.5, py: 1.1, borderRadius: 1.5,
            textTransform: 'none', fontWeight: 700, fontSize: '0.88rem',
            backgroundColor: '#DC2626', boxShadow: 'none',
            '&:hover': { backgroundColor: '#B91C1C' },
            '&.Mui-disabled': { backgroundColor: '#F1F5F9', color: '#94A3B8' }
          }}
        >
          {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : '신고 제출'}
        </Button>
      </Box>
    </Dialog>
  );
};

const STICKER_LIST = [
  { id: 's1', emoji: '😂', label: '웃음' },
  { id: 's2', emoji: '😍', label: '사랑' },
  { id: 's3', emoji: '🥺', label: '슬픔' },
  { id: 's4', emoji: '😡', label: '화남' },
  { id: 's5', emoji: '🎉', label: '파티' },
  { id: 's6', emoji: '👍', label: '좋아요' },
  { id: 's7', emoji: '🙏', label: '감사' },
  { id: 's8', emoji: '💀', label: '죽음' },
  { id: 's9', emoji: '🔥', label: '불' },
  { id: 's10', emoji: '🫶', label: '하트손' },
  { id: 's11', emoji: '🤣', label: '구르는웃음' },
  { id: 's12', emoji: '😎', label: '쿨' },
  { id: 's13', emoji: '🥳', label: '파티얼굴' },
  { id: 's14', emoji: '😭', label: '엉엉' },
  { id: 's15', emoji: '🫠', label: '녹음' },
  { id: 's16', emoji: '🤩', label: '눈별' },
];

const isStickerMessage = (msg) => msg?.IS_DELETED !== 'Y' && (msg?.IS_STICKER === true || (typeof msg?.MESSAGE === 'string' && msg.MESSAGE.startsWith('__STICKER__')));
const getStickerEmoji = (msg) => {
  if (msg?.IS_STICKER && msg?.MESSAGE) return msg.MESSAGE;
  if (typeof msg?.MESSAGE === 'string' && msg.MESSAGE.startsWith('__STICKER__')) return msg.MESSAGE.replace('__STICKER__', '');
  return null;
};

// ────────────────────────────────────────────────
// [FIX 2] 참여자 목록 - 검색 가능한 모달
// ────────────────────────────────────────────────
const ParticipantsModal = ({ open, onClose, participants, loading, onClickUser }) => {
  const [query, setQuery] = useState('');

  const filtered = participants.filter(p =>
    p.NICKNAME?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, minHeight: 400, maxHeight: '70vh', display: 'flex', flexDirection: 'column' } }}
    >
      <Box sx={{ px: 3, py: 2.5, borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleOutline sx={{ fontSize: 20, color: '#64748B' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A' }}>
            참여자 {participants.length}명
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* 검색창 */}
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 2, px: 1.5, py: 0.8 }}>
          <Search sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} />
          <InputBase
            fullWidth
            placeholder="참여자 검색..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ fontSize: '0.88rem', color: '#0F172A' }}
          />
          {query && (
            <IconButton size="small" onClick={() => setQuery('')} sx={{ color: '#94A3B8', p: 0.2 }}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          )}
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ fontSize: '0.82rem', color: '#94A3B8' }}>
              {query ? '검색 결과가 없습니다.' : '참여자가 없습니다.'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filtered.map((p, idx) => (
              <ListItem
                button
                key={p.USER_ID}
                onClick={() => { onClickUser(p.NICKNAME); onClose(); }}
                sx={{
                  py: 1.2, px: 2.5,
                  borderBottom: idx < filtered.length - 1 ? '1px solid #F8FAFC' : 'none',
                  '&:hover': { backgroundColor: '#F8FAFC' }
                }}
              >
                <ListItemAvatar sx={{ minWidth: 46 }}>
                  <Avatar
                    src={p.AVATAR ? `${API}${p.AVATAR}` : null}
                    sx={{ width: 36, height: 36, fontSize: '0.8rem', backgroundColor: '#0F172A', fontWeight: 800 }}
                  >
                    {getInitial(p.NICKNAME)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A' }}>{p.NICKNAME}</Typography>}
                  secondary={
                    p.LAST_ACTIVE
                      ? <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>{formatActivity(p.LAST_ACTIVE) || ''}</Typography>
                      : null
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Dialog>
  );
};

export default function Messages() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('accessToken');

  const myNickname = (() => {
    try {
      const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))));
      return payload.nickname;
    } catch { return ''; }
  })();

  const [chatRooms, setChatRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChat, setLoadingChat] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);

  const [createChatOpen, setCreateChatOpen] = useState(false);
  const [newChatSearchQuery, setNewChatSearchQuery] = useState('');
  const [newChatSearchResults, setNewChatSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatBgColor, setChatBgColor] = useState('#F8FAFC');
  const [bubbleStyle, setBubbleStyle] = useState('rounded');
  const [mutedRooms, setMutedRooms] = useState({});

  const [anchorElMessage, setAnchorElMessage] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);

  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', desc: '', onConfirm: null });

  const [typingUsers, setTypingUsers] = useState([]);
  const [stickerAnchorEl, setStickerAnchorEl] = useState(null);

  // [FIX 2] 참여자 모달 상태
  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const [readAtMap, setReadAtMap] = useState({});

  const fileInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const debounceRef = useRef(null);
  const newChatDebounceRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);

  const [reportModal, setReportModal] = useState({ open: false, messageId: null });
  const [reportReason, setReportReason] = useState('');
  const [reportDetail, setReportDetail] = useState('');

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSuccessOpen, setReportSuccessOpen] = useState(false);

  const [roomNameEdit, setRoomNameEdit] = useState('');
  const [roomImageFile, setRoomImageFile] = useState(null);
  const roomImageRef = useRef(null);

  const [roomNameSavedOpen, setRoomNameSavedOpen] = useState(false);
  const [deleteRoomImage, setDeleteRoomImage] = useState(false);

  useEffect(() => {
    if (settingsOpen && isGroup) setRoomNameEdit(roomInfo?.ROOM_NAME || '');
  }, [settingsOpen]);

  // ────────────────────────────────────────────────
  // [FIX 3] 시스템 메시지 전송 헬퍼
  // ────────────────────────────────────────────────
  const sendSystemMessage = async (text) => {
    if (!roomId || !token) return;
    try {
      await fetch(`${API}/messages/${roomId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: text, IS_SYSTEM: true })
      });
    } catch { }
  };

  const handleSaveRoomInfo = async () => {
    const prevName = roomInfo?.ROOM_NAME || '';
    try {
      const formData = new FormData();
      formData.append('roomName', roomNameEdit);
      if (roomImageFile) formData.append('roomImage', roomImageFile);

      // 이미지 삭제 플래그
      if (deleteRoomImage) formData.append('deleteImage', 'true');

      const res = await fetch(`${API}/messages/${roomId}/room-info`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setRoomInfo(prev => ({
          ...prev,
          ROOM_NAME: data.roomName,
          ROOM_IMAGE: data.imageUrl ?? (deleteRoomImage ? null : prev.ROOM_IMAGE)
        }));
        setRoomNameSavedOpen(true); // 토스트
        if (roomNameEdit && roomNameEdit !== prevName) {
          await sendSystemMessage(`${myNickname}님이 채팅방 이름을 "${roomNameEdit}"(으)로 변경했습니다.`);
        }
        if (roomImageFile) {
          await sendSystemMessage(`${myNickname}님이 채팅방 사진을 변경했습니다.`);
          setRoomImageFile(null);
        }
        if (deleteRoomImage) {
          setDeleteRoomImage(false);
        }
      }
    } catch { }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers]);

  useEffect(() => {
    if (!token) return navigate('/');
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API}/messages/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setChatRooms(data.rooms || []);
      } catch (err) { } finally {
        setLoadingRooms(false);
      }
    };
    fetchRooms();
    const interval = setInterval(fetchRooms, 3000);
    return () => clearInterval(interval);
  }, [token, navigate]);

  useEffect(() => {
    if (!roomId || !token) {
      setRoomInfo(null);
      setMessages([]);
      return;
    }
    setLoadingChat(true);
    setDeleteMode(false);
    setSelectedDeleteIds([]);
    setEditingMessageId(null);
    setNewMessage('');
    setParticipantsModalOpen(false);

    const fetchChatData = async () => {
      try {
        const res = await fetch(`${API}/messages/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRoomInfo(data.room);

          // ────────────────────────────────────────────────
          // [FIX 1] 삭제된 메시지 보존: polling 결과 merge 시
          // 기존 IS_DELETED:'Y' 상태를 서버 결과로 덮어쓰되,
          // 서버에서도 IS_DELETED:'Y'로 내려오므로 그대로 반영.
          // 단, optimistic으로 삭제 처리한 메시지가
          // 다음 polling에서 IS_DELETED:'N'으로 오버라이트되지 않도록
          // 로컬 삭제 상태를 우선 적용.
          // ────────────────────────────────────────────────
          setMessages(prev => {
            const localDeletedIds = new Set(
              prev.filter(m => m.IS_DELETED === 'Y').map(m => m.MESSAGE_ID)
            );
            const incoming = data.messages || [];
            return incoming.map(serverMsg => {
              if (localDeletedIds.has(serverMsg.MESSAGE_ID)) {
                return { ...serverMsg, IS_DELETED: 'Y', MESSAGE: '', IMAGE_URL: null, FILE_URL: null, IS_STICKER: false };
              }
              return serverMsg;
            });
          });

          if (data.readAtMap) setReadAtMap(data.readAtMap);
          setChatRooms(prev => prev.map(r => r.ROOM_ID === parseInt(roomId) ? { ...r, UNREAD_COUNT: 0 } : r));
        } else {
          navigate('/messages');
        }
      } catch (err) { } finally {
        setLoadingChat(false);
      }
    };
    fetchChatData();
    const interval = setInterval(fetchChatData, 3000);

    const typingInterval = setInterval(async () => {
      try {
        const res = await fetch(`${API}/messages/${roomId}/typing`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setTypingUsers((data.typingUsers || []).filter(n => n !== myNickname));
        }
      } catch { }
    }, 1500);
    const participantInterval = setInterval(() => {
      fetchParticipants();
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(typingInterval);
      clearInterval(participantInterval);
    };
  }, [roomId, token, navigate, myNickname]);

  // [FIX 2] 참여자 목록 불러오기
  const fetchParticipants = async () => {
    if (!roomId || !token) return;
    setParticipantsLoading(true);
    try {
      const res = await fetch(`${API}/messages/${roomId}/participants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setParticipants(data.participants || []);
    } catch { } finally {
      setParticipantsLoading(false);
    }
  };

  const handleOpenParticipantsModal = () => {
    fetchParticipants();
    setParticipantsModalOpen(true);
  };

  const handleTypingInput = (val) => {
    setNewMessage(val);
    clearTimeout(typingTimerRef.current);
    fetch(`${API}/messages/${roomId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isTyping: true, nickname: myNickname }) // 닉네임 포함
    }).catch(() => { });

    typingTimerRef.current = setTimeout(() => {
      fetch(`${API}/messages/${roomId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isTyping: false })
      }).catch(() => { });
    }, 1500);
  };
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchOpen(true);
      try {
        const res = await fetch(`${API}/user/search/public?q=${encodeURIComponent(val.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setSearchResults(data.users || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleNewChatSearch = (val) => {
    setNewChatSearchQuery(val);
    clearTimeout(newChatDebounceRef.current);
    newChatDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/user/search/public?q=${encodeURIComponent(val.trim())}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setNewChatSearchResults(data.users || []);
      } catch (err) {
        setNewChatSearchResults([]);
      }
    }, 350);
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.USER_ID === user.USER_ID);
      if (exists) return prev.filter(u => u.USER_ID !== user.USER_ID);
      return [...prev, user];
    });
  };

  const handleStartNewChat = async () => {
    if (selectedUsers.length === 0) return;
    try {
      const targetNicknames = selectedUsers.map(u => u.NICKNAME);
      const res = await fetch(`${API}/messages/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetNicknames })
      });
      const data = await res.json();
      if (data.success) {
        setCreateChatOpen(false);
        setSelectedUsers([]);
        setNewChatSearchQuery('');
        navigate(`/messages/room/${data.roomId}`);
      }
    } catch (err) { }
  };

  const handleSend = async (e, customMessage = null, extraFields = {}) => {
    if (e) e.preventDefault();
    const msgToSend = customMessage || newMessage;
    if (!msgToSend?.trim() || !roomId) return;

    if (editingMessageId && !customMessage) {
      const currentEditId = editingMessageId;
      setMessages(prev => prev.map(m =>
        m.MESSAGE_ID === currentEditId
          ? { ...m, MESSAGE: msgToSend, IS_EDITED: 'Y' }
          : m
      ));
      setNewMessage('');
      setEditingMessageId(null);
      try {
        await fetch(`${API}/messages/${roomId}/edit`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messageId: currentEditId, newMessage: msgToSend })
        });
      } catch (err) { }
      return;
    }

    const optimisticMsg = {
      MESSAGE_ID: Date.now(),
      SENDER_NICKNAME: myNickname,
      MESSAGE: msgToSend,
      SENT_AT: new Date().toISOString(),
      IS_READ: 'N',
      READ_BY: [],
      ...extraFields
    };
    setMessages(prev => [...prev, optimisticMsg]);
    if (!customMessage) setNewMessage('');

    try {
      await fetch(`${API}/messages/${roomId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: optimisticMsg.MESSAGE, ...extraFields })
      });
    } catch (err) { }
  };

  const handleStickerSelect = (sticker) => {
    setStickerAnchorEl(null);
    handleSend(null, `__STICKER__${sticker.emoji}`, { IS_STICKER: true });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const isImage = file.type.startsWith('image/');

    const localUrl = URL.createObjectURL(file);
    const optimisticMsg = {
      MESSAGE_ID: Date.now(),
      SENDER_NICKNAME: myNickname,
      MESSAGE: '',
      IMAGE_URL: isImage ? localUrl : null,
      FILE_NAME: !isImage ? file.name : null,
      FILE_URL: !isImage ? localUrl : null,
      SENT_AT: new Date().toISOString(),
      IS_READ: 'N',
      READ_BY: []
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API}/messages/${roomId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setMessages(prev => prev.map(m =>
          m.MESSAGE_ID === optimisticMsg.MESSAGE_ID
            ? { ...m, IMAGE_URL: data.imageUrl || null, FILE_URL: data.fileUrl || null, FILE_NAME: data.fileName || null, MESSAGE: data.message || '' }
            : m
        ));
      }
    } catch { }
    e.target.value = '';
  };

  const handlePaste = async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        const localUrl = URL.createObjectURL(file);
        const optimisticMsg = {
          MESSAGE_ID: Date.now(),
          SENDER_NICKNAME: myNickname,
          MESSAGE: '',
          IMAGE_URL: localUrl,
          SENT_AT: new Date().toISOString(),
          IS_READ: 'N',
          READ_BY: []
        };
        setMessages(prev => [...prev, optimisticMsg]);
        try {
          const formData = new FormData();
          formData.append('file', file, 'paste.png');
          const res = await fetch(`${API}/messages/${roomId}/upload`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData
          });
          const data = await res.json();
          if (data.success) {
            setMessages(prev => prev.map(m =>
              m.MESSAGE_ID === optimisticMsg.MESSAGE_ID ? { ...m, IMAGE_URL: data.imageUrl } : m
            ));
          }
        } catch { }
      }
    }
  };

  const openConfirm = (title, desc, onConfirm) => {
    setConfirmModal({ open: true, title, desc, onConfirm });
  };

  const handleMessageOptionClick = (event, msg) => {
    event.stopPropagation();
    setAnchorElMessage(event.currentTarget);
    setSelectedMessage(msg);
  };

  const handleCloseMessageOption = () => {
    setAnchorElMessage(null);
    setSelectedMessage(null);
  };

  const handleDeleteMessageForAll = () => {
    const targetId = selectedMessage?.MESSAGE_ID;
    handleCloseMessageOption();
    openConfirm('모든 사람에게서 삭제', '이 메시지를 모든 사람의 화면에서 삭제하시겠습니까?', async () => {
      if (!targetId) return;
      // [FIX 1] optimistic 삭제 — polling이 덮어써도 localDeletedIds로 보존됨
      setMessages(prev => prev.map(m =>
        m.MESSAGE_ID === targetId ? { ...m, IS_DELETED: 'Y', MESSAGE: '', IMAGE_URL: null, FILE_URL: null, IS_STICKER: false } : m
      ));
      setConfirmModal({ open: false });
      try {
        await fetch(`${API}/messages/${roomId}/delete-all`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messageIds: [targetId] })
        });
      } catch { }
    });
  };

  const handleDeleteMessageForMe = () => {
    const targetId = selectedMessage?.MESSAGE_ID;
    handleCloseMessageOption();
    setDeleteMode(true);
    setSelectedDeleteIds([targetId]);
  };

  const executeBulkDelete = () => {
    if (selectedDeleteIds.length === 0) return;
    openConfirm('메시지 삭제', `${selectedDeleteIds.length}개의 메시지를 나에게서만 삭제하시겠습니까?`, async () => {
      const ids = [...selectedDeleteIds];
      setMessages(prev => prev.filter(m => !ids.includes(m.MESSAGE_ID)));
      setDeleteMode(false);
      setSelectedDeleteIds([]);
      setConfirmModal({ open: false });
      try {
        await fetch(`${API}/messages/${roomId}/delete-me`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ messageIds: ids })
        });
      } catch { }
    });
  };

  const handleEditMessageClick = () => {
    setEditingMessageId(selectedMessage.MESSAGE_ID);
    setNewMessage(selectedMessage.MESSAGE);
    handleCloseMessageOption();
  };

  const handleReportMessage = () => {
    handleCloseMessageOption();
    setReportModalOpen(true);
  };

  const handleLeaveRoom = () => {
    openConfirm('채팅방 나가기', '채팅방을 나가면 대화 내용이 모두 삭제됩니다. 계속하시겠습니까?', async () => {
      try {
        await fetch(`${API}/messages/${roomId}/leave`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setSettingsOpen(false);
        setConfirmModal({ open: false });
        navigate('/messages');
      } catch (err) { }
    });
  };

  const toggleSelectDelete = (id) => {
    setSelectedDeleteIds(prev => prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]);
  };

  const handleRowClick = (id) => {
    if (deleteMode) toggleSelectDelete(id);
  };

  const getBubbleBorderRadius = (isMe) => {
    if (bubbleStyle === 'sharp') return isMe ? '8px 0px 8px 8px' : '0px 8px 8px 8px';
    if (bubbleStyle === 'outlined') return '16px';
    return isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
  };

  const getBubbleColors = (isMe) => {
    if (bubbleStyle === 'outlined') {
      return isMe ? { bg: 'transparent', text: '#2563EB', border: '1px solid #2563EB' } : { bg: 'transparent', text: '#0F172A', border: '1px solid #E2E8F0' };
    }
    return isMe ? { bg: '#2563EB', text: '#fff', border: 'none' } : { bg: '#fff', text: '#0F172A', border: '1px solid #E2E8F0' };
  };

  useEffect(() => {
    if (!roomId || !token) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API}/messages/${roomId}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setChatBgColor(data.settings.BG_COLOR || '#F8FAFC');
          setBubbleStyle(data.settings.BUBBLE_STYLE || 'rounded');
        }
      } catch { }
    };
    fetchSettings();

  }, [roomId, token, navigate, myNickname]);

  const settingsSaveTimer = useRef(null);

  const saveSettings = (bgColor, bubble) => {
    clearTimeout(settingsSaveTimer.current);
    settingsSaveTimer.current = setTimeout(async () => {
      try {
        await fetch(`${API}/messages/${roomId}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ bgColor, bubbleStyle: bubble })
        });
      } catch { }
    }, 500);
  };

  // [FIX 3] 설정 변경 시 시스템 메시지 전송
  const handleBgColorChange = async (color) => {
    setChatBgColor(color);
    saveSettings(color, bubbleStyle);
    // 배경색 변경 알림 (색상 이름 매핑)
    const colorNames = {
      '#F8FAFC': '기본',
      '#EFF6FF': '파란색',
      '#FEF2F2': '빨간색',
      '#F0FDF4': '초록색',
      '#FFFBEB': '노란색',
      '#F5F3FF': '보라색',
      '#FAFAFA': '흰색',
      '#18181B': '어두운 색',
    };
    const colorLabel = colorNames[color] || color;
    await sendSystemMessage(`${myNickname}님이 채팅방 배경색을 ${colorLabel}으로 변경했습니다.`);
  };

  const handleBubbleStyleChange = async (style) => {
    setBubbleStyle(style);
    saveSettings(chatBgColor, style);
    const styleNames = { rounded: '둥근 모서리', sharp: '각진 모서리', outlined: '테두리형' };
    await sendSystemMessage(`${myNickname}님이 말풍선 스타일을 "${styleNames[style] || style}"(으)로 변경했습니다.`);
  };

  const isGroup = roomInfo?.ROOM_TYPE === 'GROUP';
  const displayTitle = isGroup ? (roomInfo.ROOM_NAME || roomInfo.TARGET_NICKNAME || '그룹 채팅방') : roomInfo?.TARGET_NICKNAME;
  const displayAvatar = isGroup ? null : roomInfo?.TARGET_AVATAR;

  const myMessages = messages.filter(m => m.SENDER_NICKNAME === myNickname);
  const lastReadMsg = myMessages.slice().reverse().find(m => m.IS_READ === 'Y');
  const lastReadMsgId = lastReadMsg ? lastReadMsg.MESSAGE_ID : null;

  const activityLabel = !isGroup && roomInfo?.TARGET_LAST_ACTIVE ? formatActivity(roomInfo.TARGET_LAST_ACTIVE) : null;

  useEffect(() => {
    if (roomId && isGroup) {
      fetchParticipants();
    }
  }, [roomId, isGroup]);

  const processedMessages = messages.map(m => ({ ...m, READ_BY: [] }));

  if (isGroup && participants.length > 0) {
    participants.forEach(p => {
      if (p.NICKNAME === myNickname) return;
      // 해당 유저가 마지막으로 본 메시지 찾기 (값이 없으면 0으로 처리)
      const revIdx = processedMessages.slice().reverse().findIndex(m => new Date(m.SENT_AT) <= new Date(p.LAST_ACTIVE || 0));
      if (revIdx !== -1) {
        const realIdx = processedMessages.length - 1 - revIdx;
        // 이미 들어간 사람인지 중복 체크 후 아바타 추가
        if (!processedMessages[realIdx].READ_BY.find(r => r.nickname === p.NICKNAME)) {
          processedMessages[realIdx].READ_BY.push({ nickname: p.NICKNAME, avatar: p.AVATAR ? `${API}${p.AVATAR}` : null });
        }
      }
    });
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: 'calc(100vh - 48px)', backgroundColor: '#fff', borderRadius: 3, border: '1px solid #E2E8F0', overflow: 'hidden' }}>

        {/* 채팅방 목록 */}
        <Box sx={{ width: { xs: '100%', md: 360 }, borderRight: { md: '1px solid #E2E8F0' }, display: { xs: roomId ? 'none' : 'flex', md: 'flex' }, flexDirection: 'column', backgroundColor: '#fff' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: '#0F172A' }}>메시지</Typography>
              <IconButton onClick={() => { setCreateChatOpen(true); handleNewChatSearch(''); }} sx={{ color: '#0F172A', backgroundColor: '#F1F5F9' }}>
                <AddCircleOutline fontSize="small" />
              </IconButton>
            </Box>
            <Box ref={searchWrapRef} sx={{ position: 'relative' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 2.5, px: 1.5, py: 1 }}>
                <Search sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} />
                <InputBase fullWidth placeholder="검색..." value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} onFocus={() => { setSearchOpen(true); if (searchResults.length === 0) handleSearchChange(searchQuery); }} sx={{ fontSize: '0.9rem', color: '#0F172A' }} />
                {isSearching ? <CircularProgress size={16} sx={{ color: '#94A3B8', ml: 1 }} /> : searchQuery && <IconButton size="small" onClick={() => handleSearchChange('')} sx={{ color: '#94A3B8', p: 0.2 }}><Close sx={{ fontSize: 16 }} /></IconButton>}
              </Box>
              {searchOpen && (
                <Paper elevation={4} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, mt: 1, zIndex: 10, borderRadius: 2, overflow: 'hidden' }}>
                  <List disablePadding>
                    {searchResults.length > 0 ? searchResults.map((user, idx) => (
                      <ListItem button key={user.USER_ID} onClick={() => { setSearchOpen(false); navigate(`/messages/room/${user.ROOM_ID || 'new'}`); }} sx={{ py: 1.2, px: 2, borderBottom: idx < searchResults.length - 1 ? '1px solid #F1F5F9' : 'none' }}>
                        <ListItemAvatar sx={{ minWidth: 46 }}>
                          <Avatar src={user.AVATAR ? `${API}${user.AVATAR}` : null} sx={{ width: 34, height: 34, backgroundColor: '#0F172A', fontSize: '0.8rem' }}>{getInitial(user.NICKNAME)}</Avatar>
                        </ListItemAvatar>
                        <ListItemText primary={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.NICKNAME}</Typography>} secondary={<Typography sx={{ fontSize: '0.7rem', color: '#64748B' }}>{user.BIO_SHORT || `@${user.NICKNAME}`}</Typography>} sx={{ m: 0 }} />
                      </ListItem>
                    )) : <Box sx={{ py: 3, textAlign: 'center' }}><Typography sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>결과 없음</Typography></Box>}
                  </List>
                </Paper>
              )}
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loadingRooms ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
            ) : chatRooms.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}><Typography sx={{ fontSize: '0.85rem', color: '#64748B' }}>대화가 없습니다.</Typography></Box>
            ) : (
              <List disablePadding>
                {chatRooms.map((room) => {
                  const isActive = parseInt(roomId) === room.ROOM_ID;
                  const isMuted = mutedRooms[room.ROOM_ID];
                  let lastMsgPreview = room.LAST_MESSAGE || '';
                  if (!lastMsgPreview) lastMsgPreview = room.LAST_HAS_IMAGE ? '📷 사진' : room.LAST_HAS_FILE ? '📎 파일' : '';

                  return (
                    <ListItem button key={room.ROOM_ID} onClick={() => navigate(`/messages/room/${room.ROOM_ID}`)} sx={{ py: 1.8, px: 2.5, backgroundColor: isActive ? '#F1F5F9' : 'transparent', transition: 'all 0.15s', '&:hover': { backgroundColor: '#F8FAFC' } }}>
                      <ListItemAvatar sx={{ minWidth: 54 }}>
                        <Badge color="error" variant="dot" invisible={!room.UNREAD_COUNT} sx={{ '& .MuiBadge-badge': { right: 4, top: 4 } }}>
                          {room.ROOM_TYPE === 'GROUP' ? (
                            <GroupAvatar avatars={room.PARTICIPANT_AVATARS} nicknames={room.PARTICIPANT_NICKNAMES} size={36} />
                          ) : (
                            <Avatar src={room.TARGET_AVATAR ? `${API}${room.TARGET_AVATAR}` : null} sx={{ width: 42, height: 42, backgroundColor: getAvatarColor(room.TARGET_NICKNAME), fontWeight: 800 }}>
                              {getInitial(room.TARGET_NICKNAME)}
                            </Avatar>
                          )}
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                            <Typography sx={{ fontWeight: isActive ? 800 : 700, fontSize: '0.9rem', color: '#0F172A', display: 'flex', alignItems: 'center' }}>
                              {room.TARGET_NICKNAME || (room.ROOM_TYPE === 'GROUP' ? '그룹 채팅방' : '')}
                              {isMuted && <NotificationsOff sx={{ fontSize: 13, color: '#94A3B8', ml: 0.5 }} />}
                            </Typography>
                            <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}>{formatTime(room.LAST_MESSAGE_AT)}</Typography>
                          </Box>
                        }
                        // 기존 lastMsgPreview 문자열 방식 대신 별도 렌더링
                        // ListItemText secondary 부분을 아래로 교체

                        secondary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: '70%' }}>
                              {room.LAST_IS_STICKER && <SentimentSatisfiedAlt sx={{ fontSize: 13, color: '#94A3B8', flexShrink: 0 }} />}
                              {room.LAST_HAS_IMAGE && !room.LAST_IS_STICKER && <ImageOutlined sx={{ fontSize: 13, color: '#94A3B8', flexShrink: 0 }} />}
                              {room.LAST_HAS_FILE && !room.LAST_IS_STICKER && !room.LAST_HAS_IMAGE && <AttachFile sx={{ fontSize: 13, color: '#94A3B8', flexShrink: 0 }} />}
                              <Typography sx={{
                                fontSize: '0.8rem',
                                color: room.UNREAD_COUNT ? '#0F172A' : '#64748B',
                                fontWeight: room.UNREAD_COUNT ? 700 : 400,
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                              }}>
                                {room.LAST_IS_STICKER ? '이모티콘을 보냈습니다.'
                                  : room.LAST_HAS_IMAGE ? '사진을 보냈습니다.'
                                    : room.LAST_HAS_FILE ? '파일을 보냈습니다.'
                                      : room.LAST_MESSAGE || ''}
                              </Typography>
                            </Box>
                            {room.UNREAD_COUNT > 0 && (
                              <Box sx={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '0.6rem', fontWeight: 800, px: 0.6, py: 0.1, borderRadius: 10 }}>
                                {room.UNREAD_COUNT}
                              </Box>
                            )}
                          </Box>
                        }
                        sx={{ m: 0 }}
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Box>
        </Box>

        {/* 채팅 영역 */}
        <Box
          sx={{ flex: 1, display: { xs: roomId ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column', transition: 'background-color 0.3s', position: 'relative' }}
          style={{ backgroundColor: chatBgColor }}
        >
          {!roomId ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', border: '2px solid #0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}><MailOutline sx={{ fontSize: 40, color: '#0F172A' }} /></Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: '#0F172A', mb: 1 }}>내 메시지</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#64748B' }}>친구나 그룹에게 비공개 사진과 메시지를 보내보세요.</Typography>
            </Box>
          ) : loadingChat ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
          ) : (
            <>
              {deleteMode ? (
                <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, backgroundColor: '#0F172A', color: '#fff', animation: 'slideIn 0.2s ease' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size="small" onClick={() => { setDeleteMode(false); setSelectedDeleteIds([]); }} sx={{ color: '#fff' }}><Close /></IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{selectedDeleteIds.length}개 선택됨</Typography>
                  </Box>
                  <Button variant="contained" color="error" onClick={executeBulkDelete} disabled={selectedDeleteIds.length === 0} sx={{ fontWeight: 800, borderRadius: 2 }}>삭제</Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #E2E8F0', zIndex: 10 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => navigate('/messages')} sx={{ color: '#64748B', display: { md: 'none' }, mr: 1 }}><ArrowBack /></IconButton>
                      {isGroup ? (
                        <Box sx={{ mr: 1.5 }}>
                          <GroupAvatar avatars={roomInfo?.PARTICIPANT_AVATARS} nicknames={roomInfo?.PARTICIPANT_NICKNAMES} />
                        </Box>
                      ) : (
                        <Avatar
                          src={displayAvatar ? `${API}${displayAvatar}` : undefined}
                          onClick={() => navigate(`/user/${displayTitle}`)}
                          sx={{ width: 36, height: 36, backgroundColor: '#0F172A', color: '#fff', fontWeight: 800, mr: 1.5, cursor: 'pointer' }}
                        >
                          {getInitial(displayTitle)}
                        </Avatar>
                      )}
                      <Box>
                        <Typography
                          sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', cursor: 'pointer' }}
                          onClick={() => isGroup ? setSettingsOpen(true) : navigate(`/user/${displayTitle}`)}
                        >
                          {displayTitle}
                        </Typography>
                        {activityLabel && (
                          <Typography sx={{ fontSize: '0.7rem', color: '#22C55E', fontWeight: 600 }}>{activityLabel}</Typography>
                        )}
                        {/* [FIX 2] 그룹 참여자 수 — 클릭하면 모달 오픈 */}
                        {isGroup && (
                          <Box
                            onClick={handleOpenParticipantsModal}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                          >
                            <PeopleOutline sx={{ fontSize: 13, color: '#64748B' }} />
                            <Typography sx={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 600 }}>
                              참여자 {roomInfo?.MEMBER_COUNT}명
                            </Typography>
                            <ExpandMore sx={{ fontSize: 13, color: '#64748B' }} />
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <IconButton onClick={() => setSettingsOpen(true)} sx={{ color: '#0F172A' }}><InfoOutlined /></IconButton>
                  </Box>
                </Box>
              )}

              <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 0.8, mt: deleteMode ? 7 : 0 }}>
                {processedMessages.map((msg, idx) => {
                  // [FIX 3] 시스템 메시지 렌더링
                  if (msg.IS_SYSTEM === true || msg.IS_SYSTEM === 'Y') {
                    return (
                      <Box key={msg.MESSAGE_ID || idx} sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                        <Box sx={{
                          px: 2, py: 0.6,
                          backgroundColor: 'rgba(0,0,0,0.06)',
                          borderRadius: 10,
                          backdropFilter: 'blur(4px)',
                        }}>
                          <Typography sx={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500, textAlign: 'center' }}>
                            {msg.MESSAGE}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  }

                  const isMe = msg.SENDER_NICKNAME === myNickname;
                  const currentMin = new Date(msg.SENT_AT).setSeconds(0, 0);
                  const nextMsg = messages[idx + 1];
                  const prevMsg = messages[idx - 1];
                  const nextMin = nextMsg ? new Date(nextMsg.SENT_AT).setSeconds(0, 0) : null;
                  const isFirstInGroup = !prevMsg || prevMsg.SENDER_NICKNAME !== msg.SENDER_NICKNAME || prevMsg.IS_SYSTEM === true || prevMsg.IS_SYSTEM === 'Y';
                  const isLastInGroup = !nextMsg || nextMsg.SENDER_NICKNAME !== msg.SENDER_NICKNAME || nextMsg.IS_SYSTEM === true || nextMsg.IS_SYSTEM === 'Y' || currentMin !== nextMin;
                  const showAvatar = !isMe && isFirstInGroup;
                  const colors = getBubbleColors(isMe);

                  const isSticker = isStickerMessage(msg);
                  const stickerEmoji = isSticker ? getStickerEmoji(msg) : null;

                  const readAt = readAtMap[msg.MESSAGE_ID];

                  return (
                    <Box key={msg.MESSAGE_ID || idx} onClick={() => handleRowClick(msg.MESSAGE_ID)} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 1, '&:hover .msg-options': { opacity: deleteMode ? 0 : 1 }, cursor: deleteMode ? 'pointer' : 'default', width: '100%', mb: isLastInGroup ? 1.5 : 0 }}>
                      {deleteMode && (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, flexShrink: 0 }}>
                          <Checkbox
                            checked={selectedDeleteIds.includes(msg.MESSAGE_ID)}
                            onChange={() => toggleSelectDelete(msg.MESSAGE_ID)}
                            onClick={(e) => e.stopPropagation()}
                            sx={{ p: 0 }}
                          />
                        </Box>
                      )}
                      <Box sx={{ flex: 1, display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 1 }}>
                        <Box sx={{ width: 36, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                          {showAvatar && !isMe && (
                            <Avatar
                              src={msg.SENDER_AVATAR ? `${API}${msg.SENDER_AVATAR}` : undefined}
                              onClick={(e) => { e.stopPropagation(); navigate(`/user/${msg.SENDER_NICKNAME}`); }}
                              sx={{ width: 32, height: 32, backgroundColor: getAvatarColor(msg.SENDER_NICKNAME), fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                            >
                              {getInitial(msg.SENDER_NICKNAME)}
                            </Avatar>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: isSticker ? 120 : '70%' }}>
                          {showAvatar && !isMe && <Typography sx={{ fontSize: '0.75rem', color: '#64748B', mb: 0.5, ml: 0.5, fontWeight: 600 }}>{msg.SENDER_NICKNAME}</Typography>}
                          <Stack direction={isMe ? 'row-reverse' : 'row'} alignItems="flex-end" spacing={0.5}>
                            {isSticker ? (
                              <Box sx={{ fontSize: '4rem', lineHeight: 1, animation: 'stickerBounce 0.4s ease', userSelect: 'none', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
                                {stickerEmoji}
                              </Box>
                            ) : (
                              <Box sx={{ px: 2, py: 1.2, backgroundColor: colors.bg, color: colors.text, border: colors.border, borderRadius: getBubbleBorderRadius(isMe), boxShadow: bubbleStyle === 'outlined' ? 'none' : '0 2px 8px rgba(0,0,0,0.02)', wordBreak: 'break-word', position: 'relative' }}>
                                {msg.IS_DELETED === 'Y' ? (
                                  <Typography sx={{ fontSize: '0.85rem', color: isMe ? 'rgba(255,255,255,0.5)' : '#94A3B8', fontStyle: 'italic' }}>
                                    삭제된 메시지입니다.
                                  </Typography>
                                ) : (
                                  <>
                                    {msg.IMAGE_URL && (
                                      <Box
                                        component="img"
                                        src={msg.IMAGE_URL.startsWith('blob:') || msg.IMAGE_URL.startsWith('http') ? msg.IMAGE_URL : `${API}${msg.IMAGE_URL}`}
                                        sx={{ maxWidth: 240, maxHeight: 240, borderRadius: 1.5, display: 'block', mb: msg.MESSAGE ? 1 : 0, cursor: 'pointer' }}
                                        onClick={() => window.open(msg.IMAGE_URL.startsWith('blob:') || msg.IMAGE_URL.startsWith('http') ? msg.IMAGE_URL : `${API}${msg.IMAGE_URL}`, '_blank')}
                                      />
                                    )}
                                    {msg.FILE_URL && !msg.IMAGE_URL && (
                                      <Box
                                        component="a"
                                        href={msg.FILE_URL.startsWith('blob:') || msg.FILE_URL.startsWith('http') ? msg.FILE_URL : `${API}${msg.FILE_URL}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isMe ? '#fff' : '#2563EB', textDecoration: 'none', mb: msg.MESSAGE ? 1 : 0 }}
                                      >
                                        <AttachFile fontSize="small" />
                                        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{msg.FILE_NAME || '파일'}</Typography>
                                      </Box>
                                    )}
                                    {msg.MESSAGE && msg.MESSAGE.trim() && (
                                      <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.5 }}>{msg.MESSAGE}</Typography>
                                    )}
                                    {msg.IS_EDITED === 'Y' && (
                                      <Typography sx={{ fontSize: '0.62rem', color: isMe ? 'rgba(255,255,255,0.6)' : '#94A3B8', mt: 0.3 }}>
                                        수정됨
                                      </Typography>
                                    )}
                                  </>
                                )}
                              </Box>
                            )}
                            {!deleteMode && (
                              <IconButton className="msg-options" size="small" onClick={(e) => handleMessageOptionClick(e, msg)} sx={{ opacity: 0, transition: 'opacity 0.2s', color: '#94A3B8' }}><MoreVert fontSize="small" /></IconButton>
                            )}
                            {isLastInGroup && (
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', mb: 0.5 }}>
                                {isMe && !isGroup && msg.MESSAGE_ID === lastReadMsgId && (
                                  <Typography sx={{ fontSize: '0.65rem', color: '#2563EB', fontWeight: 700, mb: 0.2 }}>
                                    읽음{readAt ? ` ${formatTime(readAt)}` : ''}
                                  </Typography>
                                )}
                                {isMe && isGroup && msg.READ_BY && msg.READ_BY.length > 0 && (
                                  <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 14, height: 14, fontSize: '0.5rem', border: '1px solid #fff' }, mb: 0.2 }}>
                                    {msg.READ_BY.map((r, i) => <Avatar key={i} src={r.avatar} />)}
                                  </AvatarGroup>
                                )}
                                <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', minWidth: 40, textAlign: isMe ? 'right' : 'left' }}>{formatTime(msg.SENT_AT)}</Typography>
                              </Box>
                            )}
                          </Stack>
                        </Box>
                      </Box>
                    </Box>
                  );
                })}

                {/* 타이핑 인디케이터 */}
                {typingUsers.length > 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 1, width: '100%' }}>
                    {deleteMode && <Box sx={{ width: 40, flexShrink: 0 }} />}
                    <Box sx={{ width: 36, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                      <Avatar sx={{ width: 32, height: 32, backgroundColor: '#E2E8F0' }} />
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      {isGroup && typingUsers.length > 0 && (
                        <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8', mb: 0.3, ml: 0.5 }}>
                          {typingUsers.join(', ')}
                        </Typography>
                      )}
                      <Box sx={{ px: 2, py: 1.8, backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '0px 16px 16px 16px', display: 'flex', gap: 0.5 }}>
                        {['-0.32s', '-0.16s', '0s'].map((delay, i) => (
                          <Box key={i} sx={{ width: 6, height: 6, backgroundColor: '#94A3B8', borderRadius: '50%', animation: 'typingBounce 1.4s infinite ease-in-out both', animationDelay: delay }} />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {editingMessageId && (
                <Box sx={{ px: 2, py: 1, backgroundColor: '#EFF6FF', borderTop: '1px solid #BFDBFE', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 700 }}>메시지 수정 중...</Typography>
                  <IconButton size="small" onClick={() => { setEditingMessageId(null); setNewMessage(''); }} sx={{ color: '#2563EB' }}><Close fontSize="small" /></IconButton>
                </Box>
              )}

              <Box component="form" onSubmit={handleSend} sx={{ p: 2, backgroundColor: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1 }}>
                <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*,*/*" onChange={handleFileUpload} />
                <IconButton sx={{ color: '#94A3B8' }} onClick={() => fileInputRef.current?.click()}>
                  <ImageOutlined />
                </IconButton>
                <IconButton sx={{ color: '#94A3B8' }} onClick={(e) => setStickerAnchorEl(e.currentTarget)}><SentimentSatisfiedAlt /></IconButton>
                <Popover
                  open={Boolean(stickerAnchorEl)}
                  anchorEl={stickerAnchorEl}
                  onClose={() => setStickerAnchorEl(null)}
                  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                  transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                  PaperProps={{ sx: { p: 1.5, borderRadius: 3, mb: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #E2E8F0' } }}
                >
                  <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, mb: 1, px: 0.5 }}>이모티콘</Typography>
                  <Grid container spacing={0.5} sx={{ width: 280 }}>
                    {STICKER_LIST.map(sticker => (
                      <Grid item xs={3} key={sticker.id}>
                        <Box
                          onClick={() => handleStickerSelect(sticker)}
                          sx={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            p: 1, borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
                            '&:hover': { backgroundColor: '#F1F5F9', transform: 'scale(1.15)' }
                          }}
                        >
                          <Box sx={{ fontSize: '2.2rem', lineHeight: 1 }}>{sticker.emoji}</Box>
                          <Typography sx={{ fontSize: '0.6rem', color: '#94A3B8', mt: 0.3 }}>{sticker.label}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Popover>
                <InputBase
                  fullWidth
                  placeholder="메시지 입력..."
                  value={newMessage}
                  onChange={(e) => handleTypingInput(e.target.value)}
                  onPaste={handlePaste}
                  sx={{ backgroundColor: '#F1F5F9', px: 2, py: 1.2, borderRadius: 3, fontSize: '0.95rem', color: '#0F172A' }}
                />
                <IconButton type="submit" disabled={!newMessage.trim()} sx={{ backgroundColor: newMessage.trim() ? '#2563EB' : '#E2E8F0', color: '#fff', '&:hover': { backgroundColor: '#1D4ED8' }, transition: 'all 0.2s', p: 1.2 }}>
                  <SendRounded sx={{ fontSize: 20 }} />
                </IconButton>
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* 메시지 옵션 메뉴 */}
      <Menu anchorEl={anchorElMessage} open={Boolean(anchorElMessage)} onClose={handleCloseMessageOption} PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 150 } }}>
        {selectedMessage && selectedMessage.SENDER_NICKNAME === myNickname && <MenuItem onClick={handleEditMessageClick} sx={{ fontSize: '0.85rem' }}><EditOutlined fontSize="small" sx={{ mr: 1, color: '#64748B' }} /> 수정</MenuItem>}
        {selectedMessage && selectedMessage.SENDER_NICKNAME === myNickname && <MenuItem onClick={handleDeleteMessageForAll} sx={{ fontSize: '0.85rem' }}><DeleteOutline fontSize="small" sx={{ mr: 1, color: '#64748B' }} /> 모든 사람에게서 삭제</MenuItem>}
        {selectedMessage && <MenuItem onClick={handleDeleteMessageForMe} sx={{ fontSize: '0.85rem' }}><DeleteOutline fontSize="small" sx={{ mr: 1, color: '#64748B' }} /> 나에게서만 삭제</MenuItem>}
        {selectedMessage && selectedMessage.SENDER_NICKNAME !== myNickname && (
          <MenuItem onClick={handleReportMessage} sx={{ fontSize: '0.85rem', color: '#EF4444' }}>
            <ReportGmailerrorred fontSize="small" sx={{ mr: 1 }} /> 신고
          </MenuItem>
        )}
      </Menu>

      {/* 새 채팅 다이얼로그 */}
      <Dialog open={createChatOpen} onClose={() => setCreateChatOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, minHeight: 400 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', textAlign: 'center', borderBottom: '1px solid #E2E8F0', pb: 1.5 }}>새 채팅</DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0' }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: selectedUsers.length > 0 ? 1 : 0 }}>
              {selectedUsers.map(u => (
                <Box key={u.USER_ID} onClick={() => toggleUserSelection(u)} sx={{ backgroundColor: '#EFF6FF', color: '#2563EB', fontSize: '0.75rem', fontWeight: 700, px: 1.2, py: 0.5, borderRadius: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {u.NICKNAME} <Close sx={{ fontSize: 14 }} />
                </Box>
              ))}
            </Box>
            <InputBase fullWidth placeholder="사용자 검색" value={newChatSearchQuery} onChange={(e) => handleNewChatSearch(e.target.value)} sx={{ fontSize: '0.9rem' }} />
          </Box>
          <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
            {newChatSearchResults.map(user => (
              <ListItem button key={user.USER_ID} onClick={() => toggleUserSelection(user)} sx={{ py: 1 }}>
                <Checkbox checked={!!selectedUsers.find(u => u.USER_ID === user.USER_ID)} sx={{ p: 0, mr: 2 }} />
                <ListItemAvatar sx={{ minWidth: 40 }}><Avatar src={user.AVATAR ? `${API}${user.AVATAR}` : null} sx={{ width: 32, height: 32, backgroundColor: '#0F172A', fontSize: '0.75rem', fontWeight: 800 }}>{getInitial(user.NICKNAME)}</Avatar></ListItemAvatar>
                <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.NICKNAME}</Typography>} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #E2E8F0' }}>
          <Button fullWidth variant="contained" disabled={selectedUsers.length === 0} onClick={handleStartNewChat} sx={{ borderRadius: 2, fontWeight: 700, py: 1.2, boxShadow: 'none' }}>{selectedUsers.length > 1 ? '단체 채팅 시작' : '개인 채팅 시작'}</Button>
        </DialogActions>
      </Dialog>

      {/* 채팅방 설정 */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, backgroundColor: '#F8FAFC' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '1.2rem', borderBottom: '1px solid #E2E8F0', backgroundColor: '#fff', py: 2 }}>
          채팅방 설정 <IconButton onClick={() => setSettingsOpen(false)} size="small" sx={{ backgroundColor: '#F1F5F9' }}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {isGroup && (
            <Box sx={{ backgroundColor: '#fff', p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>채팅방 정보 수정</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box onClick={() => roomImageRef.current?.click()} sx={{ cursor: 'pointer', position: 'relative' }}>
                  <GroupAvatar avatars={roomInfo?.PARTICIPANT_AVATARS} nicknames={roomInfo?.PARTICIPANT_NICKNAMES} roomImage={roomInfo?.ROOM_IMAGE} size={64} />
                  <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                    <EditOutlined sx={{ fontSize: 13, color: '#fff' }} />
                  </Box>
                </Box>
                <input type="file" ref={roomImageRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => setRoomImageFile(e.target.files[0])} />
                <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8' }}>사진을 클릭해서 변경</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Box onClick={() => roomImageRef.current?.click()} sx={{ cursor: 'pointer', position: 'relative' }}>
                  <GroupAvatar avatars={roomInfo?.PARTICIPANT_AVATARS} nicknames={roomInfo?.PARTICIPANT_NICKNAMES} size={56} />
                  <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 20, height: 20, backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <EditOutlined sx={{ fontSize: 12, color: '#fff' }} />
                  </Box>
                </Box>
                <input type="file" ref={roomImageRef} style={{ display: 'none' }} accept="image/*"
                  onChange={(e) => setRoomImageFile(e.target.files[0])} />
                <Typography sx={{ fontSize: '0.78rem', color: '#94A3B8' }}>사진을 클릭해서 변경</Typography>
              </Box>
              <InputBase
                fullWidth
                value={roomNameEdit}
                onChange={(e) => setRoomNameEdit(e.target.value)}
                placeholder="채팅방 이름"
                sx={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 2, px: 2, py: 1, fontSize: '0.9rem', mb: 1.5 }}
              />
              <Button fullWidth variant="contained" onClick={handleSaveRoomInfo}
                sx={{ borderRadius: 2, fontWeight: 700, boxShadow: 'none', py: 1 }}>
                저장
              </Button>
            </Box>
          )}
          <Box sx={{ backgroundColor: '#fff', p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
            <FormControlLabel control={<Switch
              checked={mutedRooms[roomId] || false}
              onChange={(e) => setMutedRooms(prev => ({ ...prev, [roomId]: e.target.checked }))}
              color="primary"
            />} label={<Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>알림 끄기</Typography>} sx={{ m: 0, width: '100%', justifyContent: 'space-between' }} labelPlacement="start" />
          </Box>
          <Box sx={{ backgroundColor: '#fff', p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>배경색 변경</Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {['#F8FAFC', '#EFF6FF', '#FEF2F2', '#F0FDF4', '#FFFBEB', '#F5F3FF', '#FAFAFA', '#18181B'].map(color => (
                <Box
                  key={color}
                  onClick={() => handleBgColorChange(color)}
                  sx={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: color, border: chatBgColor === color ? '3px solid #2563EB' : '1px solid #CBD5E1', cursor: 'pointer', transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.1)' } }}
                />
              ))}
            </Stack>
          </Box>
          <Box sx={{ backgroundColor: '#fff', p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>말풍선 스타일</Typography>
            <Select fullWidth size="small" value={bubbleStyle} onChange={(e) => handleBubbleStyleChange(e.target.value)} sx={{ borderRadius: 2, backgroundColor: '#F8FAFC' }}>
              <MenuItem value="rounded">둥근 모서리 (기본)</MenuItem>
              <MenuItem value="sharp">각진 모서리</MenuItem>
              <MenuItem value="outlined">테두리형</MenuItem>
            </Select>
          </Box>
          <Box sx={{ backgroundColor: '#fff', p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>모든 첨부파일</Typography>
            <Grid container spacing={1}>
              <Grid item xs={3}><Box sx={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#F1F5F9', borderRadius: 2 }} /></Grid>
              <Grid item xs={3}><Box sx={{ width: '100%', aspectRatio: '1/1', backgroundColor: '#F1F5F9', borderRadius: 2 }} /></Grid>
            </Grid>
          </Box>
          <Button fullWidth variant="outlined" color="error" startIcon={<ExitToApp />} onClick={handleLeaveRoom} sx={{ fontWeight: 800, borderRadius: 2, py: 1.2, backgroundColor: '#fff' }}>채팅방 나가기</Button>
        </DialogContent>
      </Dialog>

      {/* 확인 모달 */}
      <Dialog open={confirmModal.open} onClose={() => setConfirmModal({ open: false })} PaperProps={{ sx: { borderRadius: 3, px: 1, py: 1, minWidth: 320 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>{confirmModal.title}</DialogTitle>
        <DialogContent><Typography sx={{ color: '#475569', fontSize: '0.9rem', mt: 0.5 }}>{confirmModal.desc}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmModal({ open: false })} sx={{ color: '#64748B', fontWeight: 700, fontSize: '0.85rem' }}>취소</Button>
          <Button onClick={confirmModal.onConfirm} variant="contained" sx={{ backgroundColor: '#EF4444', color: '#fff', fontWeight: 800, fontSize: '0.85rem', borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#DC2626' } }}>확인</Button>
        </DialogActions>
      </Dialog>

      {/* [FIX 2] 참여자 목록 모달 */}
      <ParticipantsModal
        open={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        participants={participants}
        loading={participantsLoading}
        onClickUser={(nickname) => navigate(`/user/${nickname}`)}
      />

      <MessageReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={() => setReportSuccessOpen(true)}
      />

      {/* 신고 성공 토스트 */}
      <Snackbar
        open={reportSuccessOpen}
        autoHideDuration={2500}
        onClose={() => setReportSuccessOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>
          신고가 접수되었습니다.
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}