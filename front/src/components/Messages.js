import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Avatar, Typography,
  InputBase, IconButton, List, ListItem, ListItemAvatar, ListItemText,
  CircularProgress, Paper, Badge, Stack, Menu, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Button, Switch,
  FormControlLabel, AvatarGroup, Grid, Checkbox, Popover, Select,
  Collapse, Snackbar, Alert,
} from '@mui/material';
import {
  Search, Close, MailOutline, SendRounded, ImageOutlined, GroupOutlined,
  ArrowBack, SentimentSatisfiedAlt, MoreVert, InfoOutlined, ExitToApp,
  ReportGmailerrorred, DeleteOutline, EditOutlined, AddCircleOutline,
  AttachFile, ExpandMore, ExpandLess, PeopleOutline, NotificationsOff,
  ArrowBackIos, ArrowForwardIos, BookmarkOutlined
} from '@mui/icons-material';
import { useColorMode } from '../App';

const API = 'http://localhost:3010';


const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
};

const formatDateLabel = (dateStr) => {
  if (!dateStr) return '';

  const date = new Date(dateStr);
  const now = new Date();

  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffDays = Math.round((startOfNow - startOfDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays === 2) return '그저께'; // 필요 시 추가

  return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
};

const isSameDay = (a, b) => {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
};

const formatActivity = (lastActiveAt) => {
  if (!lastActiveAt) return null;
  const diff = Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 1000);
  if (diff < 60) return '방금 전 활동';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전 활동`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전 활동`;
  return new Date(lastActiveAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' 활동';
};

const GroupAvatar = ({ avatars, nicknames = [], size = 42, roomImage, onClick, avatarBg = '#0F172A' }) => {
  if (roomImage) {
    return (
      <Avatar
        src={roomImage.startsWith('http') ? roomImage : `${API}${roomImage}`}
        sx={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      />
    );
  }
  const list = (avatars || []).slice(0, 4);
  const nameList = (nicknames || []).slice(0, 4);
  const count = Math.max(list.length, nameList.length);

  // FIX 4: null 사진일 때 채팅방 목록의 그룹 아이콘과 동일한 스타일
  if (count === 0) {
    return (
      <Avatar
        sx={{
          width: size, height: size,
          backgroundColor: 'var(--text-primary)',
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
      >
        <GroupOutlined fontSize="small" sx={{ color: '#fff' }} />
      </Avatar>
    );
  }

  if (count === 1) {
    return list[0] ? (
      <Avatar src={`${API}${list[0]}`} sx={{ width: size, height: size, cursor: onClick ? 'pointer' : 'default' }} onClick={onClick} />
    ) : (
      <Avatar
        sx={{ width: size, height: size, backgroundColor: 'var(--text-primary)', fontSize: size * 0.4, fontWeight: 800, color: '#fff', cursor: onClick ? 'pointer' : 'default' }}
        onClick={onClick}
      >
        {getInitial(nameList[0])}
      </Avatar>
    );
  }

  return (
    <Box
      onClick={onClick}
      sx={{
        width: size, height: size,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: count > 2 ? '1fr 1fr' : '1fr',
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
        list[i] ? (
          <Box key={i} component="img" src={`${API}${list[i]}`}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <Box key={i} sx={{
            width: '100%', height: '100%',
            backgroundColor: avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: avatarBg === '#F1F5F9' ? '#0F172A' : '#fff',
            fontSize: size * 0.22, fontWeight: 800
          }}>

            {getInitial(nameList[i])}
          </Box>
        )
      ))}
    </Box>
  );
};

// ── FIX 1 & 2: 이미지 뷰어 모달 (확대 + 갤러리 탐색) ──
const ImageViewerModal = ({ open, onClose, imageUrl, allImages = [], initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (open) setCurrentIndex(initialIndex);
  }, [open, initialIndex]);

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === 'ArrowLeft') setCurrentIndex(prev => (prev > 0 ? prev - 1 : allImages.length - 1));
      if (e.key === 'ArrowRight') setCurrentIndex(prev => (prev < allImages.length - 1 ? prev + 1 : 0));
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, allImages.length, onClose]);

  const currentSrc = allImages.length > 0
    ? allImages[currentIndex]
    : imageUrl;

  const resolvedSrc = currentSrc
    ? (currentSrc.startsWith('blob:') || currentSrc.startsWith('http') ? currentSrc : `${API}${currentSrc}`)
    : '';

  if (!open) return null;

  return (
    <Box
      onClick={onClose}
      sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(0,0,0,0.92)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.18s ease',
      }}
    >
      {/* 닫기 버튼 */}
      <IconButton
        onClick={onClose}
        sx={{ position: 'absolute', top: 16, right: 16, color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' } }}
      >
        <Close />
      </IconButton>

      {/* 이전 버튼 */}
      {allImages.length > 1 && (
        <IconButton
          onClick={handlePrev}
          sx={{ position: 'absolute', left: 16, color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }, zIndex: 1 }}
        >
        </IconButton>
      )}

      {/* 이미지 */}
      <Box
        component="img"
        src={resolvedSrc}
        onClick={(e) => e.stopPropagation()}
        sx={{
          maxWidth: '90vw', maxHeight: '90vh',
          objectFit: 'contain',
          borderRadius: 2,
          boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
          userSelect: 'none',
        }}
      />

      {/* 다음 버튼 */}
      {allImages.length > 1 && (
        <IconButton
          onClick={handleNext}
          sx={{ position: 'absolute', right: 16, color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }, zIndex: 1 }}
        >
          <ArrowForwardIos />
        </IconButton>
      )}

      {/* 인디케이터 */}
      {allImages.length > 1 && (
        <Box sx={{ position: 'absolute', bottom: 20, display: 'flex', gap: 0.8 }}>
          {allImages.map((_, i) => (
            <Box
              key={i}
              onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
              sx={{
                width: i === currentIndex ? 20 : 6, height: 6,
                borderRadius: 3,
                backgroundColor: i === currentIndex ? '#fff' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.2s', cursor: 'pointer',
              }}
            />
          ))}
        </Box>
      )}

      {/* 카운터 */}
      {allImages.length > 1 && (
        <Typography sx={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600 }}>
          {currentIndex + 1} / {allImages.length}
        </Typography>
      )}
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
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>메시지 신고</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-secondary)', mb: 2 }}>신고 사유를 선택해주세요.</Typography>
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
              mt: 1.5, backgroundColor: 'var(--bg-default)',
              border: '1px solid var(--border-color)', borderRadius: 1.5,
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
            '&.Mui-disabled': { backgroundColor: 'var(--hover-bg)', color: '#94A3B8' }
          }}
        >
          {submitting ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : '신고 제출'}
        </Button>
      </Box>
    </Dialog>
  );
};

const EMOTICON_LIST = Array.from({ length: 16 }, (_, i) => {
  const row = Math.floor(i / 4);
  const col = i % 4;
  return { id: `e${i}`, src: `/uploads/emoticon/split_${row}_${col}.png` };
});

const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

const isStickerMessage = (msg) =>
  msg?.IS_DELETED !== 'Y' &&
  (msg?.IS_STICKER === true || (typeof msg?.MESSAGE === 'string' && msg.MESSAGE.startsWith('__STICKER__')));

const getStickerEmoji = (msg) => {
  if (msg?.IS_STICKER && msg?.MESSAGE) return msg.MESSAGE;
  if (typeof msg?.MESSAGE === 'string' && msg.MESSAGE.startsWith('__STICKER__'))
    return msg.MESSAGE.replace('__STICKER__', '');
  return null;
};

// ────────────────────────────────────────────────
// 참여자 목록 모달
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
          <PeopleOutline sx={{ fontSize: 20, color: 'var(--text-secondary)' }} />
          <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
            참여자 {participants.length}명
          </Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <Close sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
      <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid #F1F5F9' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--hover-bg)', borderRadius: 2, px: 1.5, py: 0.8 }}>
          <Search sx={{ color: '#94A3B8', fontSize: 18, mr: 1 }} />
          <InputBase
            fullWidth placeholder="참여자 검색..." value={query}
            onChange={(e) => setQuery(e.target.value)}
            sx={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}
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
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
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
                button key={p.USER_ID}
                onClick={() => { onClickUser(p.NICKNAME); onClose(); }}
                sx={{
                  py: 1.2, px: 2.5, borderBottom: idx < filtered.length - 1 ? '1px solid var(--border-color)' : 'none'
                  , '&:hover': { backgroundColor: 'var(--bg-default)' }
                }}
              >
                <ListItemAvatar sx={{ minWidth: 46 }}>
                  {/* FIX 6: 사용자 아바타 올바르게 표시 */}
                  <Avatar
                    src={p.AVATAR ? (p.AVATAR.startsWith('http') ? p.AVATAR : `${API}${p.AVATAR}`) : undefined}
                    sx={{ width: 36, height: 36, fontSize: '0.8rem', backgroundColor: 'var(--text-primary)', fontWeight: 800 }}
                  >
                    {getInitial(p.NICKNAME)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.NICKNAME}</Typography>}
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
  const { mode } = useColorMode();
  const token = localStorage.getItem('accessToken');

  const avatarBg = mode === 'dark' ? '#4B5563' : '#0F172A';

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
  const [chatBgColor, setChatBgColor] = useState('');
  const [isCustomBgColor, setIsCustomBgColor] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState('rounded');
  const [mutedRooms, setMutedRooms] = useState({});

  const [anchorElMessage, setAnchorElMessage] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);

  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', desc: '', onConfirm: null });

  const [typingUsers, setTypingUsers] = useState([]);
  const [stickerAnchorEl, setStickerAnchorEl] = useState(null);

  const [participantsModalOpen, setParticipantsModalOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const [readAtMap, setReadAtMap] = useState({});

  const [imageViewer, setImageViewer] = useState({ open: false, url: null, allImages: [], index: 0, isGallery: false });

  const fileInputRef = useRef(null);
  const searchWrapRef = useRef(null);
  const debounceRef = useRef(null);
  const newChatDebounceRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const typingTimerRef = useRef(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportSuccessOpen, setReportSuccessOpen] = useState(false);

  const [roomNameEdit, setRoomNameEdit] = useState('');
  const [roomImageFile, setRoomImageFile] = useState(null);
  const [roomImagePreview, setRoomImagePreview] = useState(null);
  const roomImageRef = useRef(null);

  const [roomNameSavedOpen, setRoomNameSavedOpen] = useState(false);
  const [deleteRoomImage, setDeleteRoomImage] = useState(false);

  const [peerProfile, setPeerProfile] = useState(null);
  const [peerProfileDismissed, setPeerProfileDismissed] = useState(false);

  const [blockModalOpen, setBlockModalOpen] = useState(false);

  const settingsChangedByMeRef = useRef(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
  const [mentionFilter, setMentionFilter] = useState('');

  const inputWrapperRef = useRef(null);
  const overlayRef = useRef(null);
  const [reactions, setReactions] = useState({});
  const isCustomBgColorRef = useRef(false);

  const mentionReadRoomsRef = useRef(
    JSON.parse(sessionStorage.getItem('mentionReadRooms') || '{}')
  );
  useEffect(() => {
    if (roomInfo?.BLOCK_STATUS) {
      setBlockModalOpen(true);
    }
  }, [roomInfo?.BLOCK_STATUS]);

  const isOnline = roomInfo?.TARGET_LAST_ACTIVE && (Date.now() - new Date(roomInfo.TARGET_LAST_ACTIVE).getTime() < 60000);
  const blockStatus = roomInfo?.BLOCK_STATUS;
  const isBlocked = !!blockStatus;
  const blockText = blockStatus === 'ME'
    ? '당신이 차단한 사용자입니다. 차단을 해제하기 전까지 메시지를 보낼 수 없습니다.'
    : '해당 사용자가 당신을 차단했습니다. 메시지를 주고받을 수 없습니다.';

  useEffect(() => {
    if (settingsOpen && isGroup) {
      setRoomNameEdit(roomInfo?.ROOM_NAME || '');
      setRoomImageFile(null);
      setRoomImagePreview(null);
      setDeleteRoomImage(false);
    }
  }, [settingsOpen]);

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

  const handleRoomImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRoomImageFile(file);
    setRoomImagePreview(URL.createObjectURL(file));
    setDeleteRoomImage(false);
    e.target.value = '';
  };

  const handleSaveRoomInfo = async () => {
    const trimmedName = roomNameEdit.trim();
    if (!trimmedName && !roomImageFile && !deleteRoomImage) {
      return;
    }
    if (!trimmedName) {
      return;
    }

    const prevName = roomInfo?.ROOM_NAME || '';
    try {
      const formData = new FormData();
      formData.append('roomName', trimmedName);
      if (roomImageFile) formData.append('roomImage', roomImageFile);
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
        setRoomImageFile(null);
        setRoomImagePreview(null);
        setRoomNameSavedOpen(true);
        if (trimmedName && trimmedName !== prevName) {
          await sendSystemMessage(`${myNickname}님이 채팅방 이름을 "${trimmedName}"(으)로 변경했습니다.`);
        }
        if (roomImageFile) {
          await sendSystemMessage(`${myNickname}님이 채팅방 사진을 변경했습니다.`);
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
    const container = chatContainerRef.current;
    if (!container) return;

    const savedScroll = sessionStorage.getItem(`scroll_${roomId}`);

    if (savedScroll && container.scrollTop === 0 && messages.length > 0) {
      container.scrollTop = Number(savedScroll);
    }
  }, [messages, roomId]);


  useEffect(() => {
    if (!token) return navigate('/');
    const fetchRooms = async () => {
      try {
        const res = await fetch(`${API}/messages/rooms`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setChatRooms(data.rooms || []);
          const initialMuted = {};
          (data.rooms || []).forEach(r => {
            if (r.IS_MUTED) initialMuted[r.ROOM_ID] = true;
          });
          setMutedRooms(initialMuted);
        }
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

    mentionReadRoomsRef.current[roomId] = true;
    sessionStorage.setItem('mentionReadRooms', JSON.stringify(mentionReadRoomsRef.current));
    window.dispatchEvent(new Event('messagesRead'));
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
          setMessages(prev => {
            const localDeletedIds = new Set(
              prev.filter(m => m.IS_DELETED === 'Y').map(m => m.MESSAGE_ID)
            );
            const incoming = data.messages || [];

            const updated = incoming.map(serverMsg => {
              // 로컬에서 삭제 처리된 메시지는 덮어쓰지 않음
              if (localDeletedIds.has(serverMsg.MESSAGE_ID)) {
                return {
                  ...serverMsg,
                  IS_DELETED: 'Y',
                  MESSAGE: '',
                  IMAGE_URL: null,
                  FILE_URL: null,
                  IS_STICKER: false
                };
              }
              return serverMsg;
            });

            const optimisticMessages = prev.filter(m => {
              if (typeof m.MESSAGE_ID !== 'number' || m.MESSAGE_ID <= Date.now() - 15000) return false;
              if (m.IMAGE_URL || m.FILE_URL) {
                return !incoming.some(s => s.SENDER_NICKNAME === myNickname && (s.IMAGE_URL || s.FILE_URL) && new Date(s.SENT_AT).getTime() > Date.now() - 20000);
              }
              return !incoming.find(s =>
                s.SENDER_NICKNAME === m.SENDER_NICKNAME &&
                (s.MESSAGE === m.MESSAGE ||
                  (m.IS_EMOTICON && s.MESSAGE?.startsWith('__EMOTICON__') && new Date(s.SENT_AT).getTime() > Date.now() - 20000))
                && !s.IMAGE_URL
              );
            });

            return [...updated, ...optimisticMessages];
          });

          fetch(`${API}/messages/${roomId}/reactions`, {
            headers: { Authorization: `Bearer ${token}` }
          }).then(r => r.json()).then(d => {
            if (d.success) setReactions(d.reactions || {});
          }).catch(() => { });
          if (data.readAtMap) setReadAtMap(data.readAtMap);

          setChatRooms(prev => prev.map(r => r.ROOM_ID === parseInt(roomId) ? { ...r, UNREAD_COUNT: 0 } : r));
        } else {
          navigate('/messages');
        }
      } catch (err) { } finally {
        setLoadingChat(false);
      }
    };

    if (!isGroup) {  // roomInfo가 없을 수 있으니 아래처럼 별도 fetch
      setPeerProfile(null);
      setPeerProfileDismissed(false);
      fetch(`${API}/messages/${roomId}/peer-profile`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).then(d => {
        if (d.success) setPeerProfile(d.peer);
      }).catch(() => { });
    }

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

    const participantInterval = setInterval(() => { fetchParticipants(); }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(typingInterval);
      clearInterval(participantInterval);
    };
  }, [roomId, token, navigate, myNickname]);

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

  const handleSelectMention = (nickname) => {
    const words = newMessage.split(' ');
    words[words.length - 1] = `@${nickname} `;
    setNewMessage(words.join(' '));
    setMentionAnchorEl(null);

    document.getElementById('chat-input-base')?.focus();
  };
  const handleTypingInput = (val) => {
    setNewMessage(val);

    const words = val.split(' ');
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionFilter(lastWord.replace('@', '').toLowerCase());
      setMentionAnchorEl(document.getElementById('chat-input-wrapper'));
      setMentionIndex(0);
    } else {
      setMentionAnchorEl(null);
    }

    clearTimeout(typingTimerRef.current);
    fetch(`${API}/messages/${roomId}/typing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isTyping: true, nickname: myNickname })
    }).catch(() => { });
    typingTimerRef.current = setTimeout(() => {
      fetch(`${API}/messages/${roomId}/typing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isTyping: false })
      }).catch(() => { });
    }, 1500);
  };
  const [mentionIndex, setMentionIndex] = useState(0);
  const handleInputKeyDown = (e) => {
    if (mentionAnchorEl) {
      const mentionableFiltered = (isGroup ? participants : (roomInfo?.TARGET_NICKNAME ? [{ NICKNAME: roomInfo.TARGET_NICKNAME, USER_ID: 'peer', AVATAR: roomInfo.TARGET_AVATAR }] : []))
        .filter(p => p.NICKNAME !== myNickname && p.NICKNAME.toLowerCase().includes(mentionFilter));

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % mentionableFiltered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + mentionableFiltered.length) % mentionableFiltered.length);
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (mentionableFiltered[mentionIndex]) {
          handleSelectMention(mentionableFiltered[mentionIndex].NICKNAME);
        }
      } else if (e.key === 'Escape') {
        setMentionAnchorEl(null);
      }
    } else {
      if (e.key === 'Enter' && !e.shiftKey) {
        handleSend(e);
      }
    }
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
        setNewChatSearchResults([]);
        navigate(`/messages/room/${data.roomId}`);
      }
    } catch (err) { }
  };

  const handleStartChatFromSearch = async (user) => {
    setSearchOpen(false);
    setSearchQuery('');
    try {
      const res = await fetch(`${API}/messages/room`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetNicknames: [user.NICKNAME] })
      });
      const data = await res.json();
      if (data.success) {
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
        m.MESSAGE_ID === currentEditId ? { ...m, MESSAGE: msgToSend, IS_EDITED: 'Y' } : m
      ));
      setPeerProfileDismissed(true);
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

    setChatRooms(prev => prev.map(r => r.ROOM_ID === parseInt(roomId) ? {
      ...r,
      LAST_MESSAGE: msgToSend,
      LAST_MESSAGE_AT: new Date().toISOString(),
      LAST_IS_STICKER: extraFields.IS_STICKER || false,
      LAST_HAS_IMAGE: false,
      LAST_HAS_FILE: false
    } : r));

    try {
      await fetch(`${API}/messages/${roomId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: optimisticMsg.MESSAGE, ...extraFields })
      });
    } catch (err) { }

    setTimeout(scrollToBottom, 50);
  };

  const handleStickerSelect = (sticker) => {
    setStickerAnchorEl(null);
    handleSend(null, `__STICKER__${sticker.emoji}`, { IS_STICKER: true });
  };

  const handleReaction = async (messageId, emoji) => {
    const mid = messageId;
    setReactions(prev => {
      const current = prev[mid]?.[emoji];
      const alreadyReacted = current?.myReaction;
      const updated = { ...prev };
      if (!updated[mid]) updated[mid] = {};
      if (alreadyReacted) {
        const newCount = (updated[mid][emoji]?.count || 1) - 1;
        if (newCount <= 0) {
          const { [emoji]: _, ...rest } = updated[mid];
          updated[mid] = rest;
        } else {
          updated[mid][emoji] = { ...updated[mid][emoji], count: newCount, myReaction: false };
        }
      } else {
        updated[mid][emoji] = {
          count: (updated[mid][emoji]?.count || 0) + 1,
          myReaction: true,
          users: [...(updated[mid][emoji]?.users || []), myNickname]
        };
      }
      return updated;
    });
    handleCloseMessageOption();
    try {
      await fetch(`${API}/messages/${roomId}/messages/${messageId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ emoji })
      });
    } catch { }
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

    setTimeout(scrollToBottom, 50);

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

        setTimeout(scrollToBottom, 50);
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

      if (ids.includes(editingMessageId)) {
        setEditingMessageId(null);
        setNewMessage('');
      }

      setMessages(prev => {
        const updated = prev.filter(m => !ids.includes(m.MESSAGE_ID));

        setChatRooms(rooms => rooms.map(r => {
          if (r.ROOM_ID === parseInt(roomId)) {
            const lastValidMsg = updated.length > 0 ? updated[updated.length - 1] : null;
            return {
              ...r,
              LAST_MESSAGE: lastValidMsg ? lastValidMsg.MESSAGE : '',
              LAST_MESSAGE_AT: lastValidMsg ? lastValidMsg.SENT_AT : r.LAST_MESSAGE_AT,
              LAST_IS_STICKER: lastValidMsg ? isStickerMessage(lastValidMsg) : false,
              LAST_HAS_IMAGE: lastValidMsg ? !!lastValidMsg.IMAGE_URL : false,
              LAST_HAS_FILE: lastValidMsg ? !!lastValidMsg.FILE_URL : false
            };
          }
          return r;
        }));

        return updated;
      });

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

  const handleDeleteMessageForAll = () => {
    const targetId = selectedMessage?.MESSAGE_ID;
    handleCloseMessageOption();
    openConfirm('모든 사람에게서 삭제', '이 메시지를 모든 사람의 화면에서 삭제하시겠습니까?', async () => {
      if (!targetId) return;

      if (editingMessageId === targetId) {
        setEditingMessageId(null);
        setNewMessage('');
      }

      setMessages(prev => {
        const updated = prev.map(m =>
          m.MESSAGE_ID === targetId
            ? { ...m, IS_DELETED: 'Y', MESSAGE: '', IMAGE_URL: null, FILE_URL: null, IS_STICKER: false }
            : m
        );

        setChatRooms(rooms => rooms.map(r => {
          if (r.ROOM_ID === parseInt(roomId)) {
            const lastValidMsg = updated.length > 0 ? updated[updated.length - 1] : null;
            return {
              ...r,
              LAST_MESSAGE: lastValidMsg ? lastValidMsg.MESSAGE : '',
              LAST_MESSAGE_AT: lastValidMsg ? lastValidMsg.SENT_AT : r.LAST_MESSAGE_AT,
              LAST_IS_STICKER: lastValidMsg ? isStickerMessage(lastValidMsg) : false,
              LAST_HAS_IMAGE: lastValidMsg ? !!lastValidMsg.IMAGE_URL : false,
              LAST_HAS_FILE: lastValidMsg ? !!lastValidMsg.FILE_URL : false
            };
          }
          return r;
        }));

        return updated;
      });

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
        if (isGroup) {
          await sendSystemMessage(`${myNickname}님이 채팅방을 나갔습니다.`);
        }
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
      return isMe
        ? { bg: 'transparent', text: '#2563EB', border: '1px solid #2563EB' }
        : {
          bg: 'transparent', text: mode === 'dark' ? '#F1F5F9' : '#0F172A'
          , border: '1px solid var(--border-color)'
        };
    }
    return isMe
      ? { bg: '#2563EB', text: '#fff', border: 'none' }
      : { bg: mode === 'dark' ? '#22253A' : '#fff', text: mode === 'dark' ? '#F1F5F9' : '#0F172A', border: '1px solid var(--border-color)' };
  };

  useEffect(() => {
    if (!roomId || !token) return;
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${API}/messages/${roomId}/settings?t=${Date.now()}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache'
          }
        });
        const data = await res.json();
        if (data.success) {
          const savedColor = data.settings.BG_COLOR;
          const DEFAULT_LIGHT = '#F8FAFC';
          const DEFAULT_DARK = '#0F1117';
          const isDefault = !savedColor || savedColor === DEFAULT_LIGHT || savedColor === DEFAULT_DARK;
          if (isDefault) {
            if (!isCustomBgColorRef.current) {
              setChatBgColor(mode === 'dark' ? DEFAULT_DARK : DEFAULT_LIGHT);
            }
          } else {
            isCustomBgColorRef.current = true;
            setIsCustomBgColor(true);
            setChatBgColor(savedColor);
          }
          setBubbleStyle(data.settings.BUBBLE_STYLE || 'rounded');
        }
      } catch { }
    };

    fetchSettings();
    const interval = setInterval(fetchSettings, 3000);
    return () => clearInterval(interval);
  }, [roomId, token, mode]);

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

  const handleBgColorChange = async (color) => {
    if (color === chatBgColor) return;
    const DEFAULT_LIGHT = '#F8FAFC';
    const DEFAULT_DARK = '#0F1117';
    const isDefault = color === DEFAULT_LIGHT || color === DEFAULT_DARK;
    setIsCustomBgColor(!isDefault);
    isCustomBgColorRef.current = !isDefault;
    setChatBgColor(color);
    saveSettings(color, bubbleStyle);
    const colorNames = {
      '#F8FAFC': '기본', '#0F1117': '기본',
      '#EFF6FF': '파란색', '#FEF2F2': '빨간색',
      '#F0FDF4': '초록색', '#FFFBEB': '노란색', '#F5F3FF': '보라색',
      '#FAFAFA': '흰색', '#18181B': '어두운 색',
    };
    await sendSystemMessage(`${myNickname}님이 채팅방 배경색을 ${colorNames[color] || color}으로 변경했습니다.`);
    settingsChangedByMeRef.current = true;
    setTimeout(() => { settingsChangedByMeRef.current = false; }, 4000);
  };
  useEffect(() => {
    if (!isCustomBgColor) {
      setChatBgColor(mode === 'dark' ? '#0F1117' : '#F8FAFC');
    }
  }, [mode]);
  const handleBubbleStyleChange = async (style) => {
    setBubbleStyle(style);
    saveSettings(chatBgColor, style);
    const styleNames = { rounded: '둥근 모서리', sharp: '각진 모서리', outlined: '테두리형' };
    await sendSystemMessage(`${myNickname}님이 말풍선 스타일을 "${styleNames[style] || style}"(으)로 변경했습니다.`);
    settingsChangedByMeRef.current = true;
    setTimeout(() => { settingsChangedByMeRef.current = false; }, 4000);
  };

  const isGroup = roomInfo?.ROOM_TYPE === 'GROUP';
  const getDisplayTitle = () => {
    if (!roomInfo) return '';
    if (isGroup) {
      if (roomInfo.ROOM_NAME && roomInfo.ROOM_NAME.trim() !== '') return roomInfo.ROOM_NAME;
      return participants.map(p => p.NICKNAME).filter(n => n !== myNickname).join(', ');
    }
    return roomInfo.TARGET_NICKNAME;
  };
  const displayTitle = getDisplayTitle();
  const displayAvatar = isGroup ? null : roomInfo?.TARGET_AVATAR;

  const myMessages = messages.filter(m => m.SENDER_NICKNAME === myNickname);
  const lastReadMsg = myMessages.slice().reverse().find(m => m.IS_READ === 'Y');
  const lastReadMsgId = lastReadMsg ? lastReadMsg.MESSAGE_ID : null;

  const activityLabel = !isGroup && roomInfo?.TARGET_LAST_ACTIVE
    ? formatActivity(roomInfo.TARGET_LAST_ACTIVE)
    : null;

  useEffect(() => {
    if (roomId && isGroup) fetchParticipants();
  }, [roomId, isGroup]);
  const mentionableFiltered = participants.filter(p => p.NICKNAME !== myNickname && p.NICKNAME.toLowerCase().includes(mentionFilter));

  const processedMessages = messages.map(m => ({ ...m, READ_BY: [] }));
  if (isGroup && participants.length > 0) {
    participants.forEach(p => {
      if (p.NICKNAME === myNickname) return;
      if (!p.LAST_READ_AT) return;
      const readTime = new Date(p.LAST_READ_AT).getTime();
      // 이 참여자가 읽은 마지막 메시지 찾기
      let lastReadIdx = -1;
      for (let i = processedMessages.length - 1; i >= 0; i--) {
        if (new Date(processedMessages[i].SENT_AT).getTime() <= readTime) {
          lastReadIdx = i;
          break;
        }
      }
      if (lastReadIdx !== -1) {
        if (!processedMessages[lastReadIdx].READ_BY.find(r => r.nickname === p.NICKNAME)) {
          processedMessages[lastReadIdx].READ_BY.push({
            nickname: p.NICKNAME,
            avatar: p.AVATAR ? (p.AVATAR.startsWith('http') ? p.AVATAR : `${API}${p.AVATAR}`) : null
          });
        }
      }
    });
  }
  // 💡 추가: 채팅 목록의 메시지 미리보기 우측 전용 상대 시간 변환 함수
  const formatListTimeRelative = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return '방금 전';

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}주 전`;

    const diffInMonths = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
    if (diffInMonths < 12 && diffInMonths >= 1) return `${diffInMonths}달 전`;
    if (diffInMonths < 1 && diffInDays >= 28) return '1달 전';

    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };
  const validNicknames = isGroup
    ? participants.map(p => p.NICKNAME)
    : [roomInfo?.TARGET_NICKNAME, peerProfile?.NICKNAME].filter(Boolean);

  const renderMessageContent = (text, isMe, bubbleStyle, navigate, validUsers) => {
    if (!text) return '';
    const mentionRegex = /(@[a-zA-Z0-9가-힣_-]+)/g;
    const parts = text.split(mentionRegex);

    const mentionColor = isMe && bubbleStyle !== 'outlined' ? '#ffffff' : '#2563EB';

    return parts.map((part, index) => {
      if (part.startsWith('@') && part.length > 1) {
        const nickname = part.replace('@', '');

        if (validUsers.includes(nickname)) {
          return (
            <span
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/user/${nickname}`);
              }}
              style={{
                color: mentionColor,
                textDecoration: 'underline',
                textUnderlineOffset: '3px',
                cursor: 'pointer',
                transition: 'opacity 0.2s ease',
              }}
              onMouseEnter={(e) => e.target.style.opacity = '0.6'}
              onMouseLeave={(e) => e.target.style.opacity = '1'}
            >
              {part}
            </span>
          );
        }
      }
      return part;
    });
  };

  const isValidMention = (nick) => validNicknames.includes(nick);

  const mentionableUsers = isGroup
    ? participants.filter(p => p.NICKNAME !== myNickname)
    : roomInfo?.TARGET_NICKNAME ? [{ NICKNAME: roomInfo.TARGET_NICKNAME, USER_ID: 'peer', AVATAR: roomInfo.TARGET_AVATAR }] : [];


  const currentRoomImageSrc = roomImagePreview
    ? roomImagePreview
    : (roomInfo?.ROOM_IMAGE
      ? (roomInfo.ROOM_IMAGE.startsWith('http') ? roomInfo.ROOM_IMAGE : `${API}${roomInfo.ROOM_IMAGE}`)
      : null);

  // FIX 2: 설정 패널의 이미지 갤러리용 URL 목록
  const allAttachmentImages = messages
    .filter(m => m.IMAGE_URL && m.IS_DELETED !== 'Y')
    .map(m => m.IMAGE_URL.startsWith('blob:') || m.IMAGE_URL.startsWith('http') ? m.IMAGE_URL : `${API}${m.IMAGE_URL}`);

  // FIX 1: 채팅 내 이미지 클릭 핸들러
  const handleChatImageClick = (imageUrl) => {
    const resolved = imageUrl.startsWith('blob:') || imageUrl.startsWith('http') ? imageUrl : `${API}${imageUrl}`;
    setImageViewer({ open: true, url: resolved, allImages: [], index: 0, isGallery: false });
  };

  // FIX 2: 설정 갤러리 이미지 클릭 핸들러
  const handleGalleryImageClick = (index) => {
    setImageViewer({ open: true, url: allAttachmentImages[index], allImages: allAttachmentImages, index, isGallery: true });
  };

  const handleMuteToggle = async (roomId, isMuted) => {
    try {
      setMutedRooms(prev => ({
        ...prev,
        [roomId]: isMuted
      }));
      setChatRooms(prev => prev.map(r =>
        r.ROOM_ID === parseInt(roomId) ? { ...r, IS_MUTED: isMuted } : r
      ));
      await fetch(`${API}/messages/${roomId}/mute`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isMuted })
      });
    } catch (err) {
      console.error("알림 설정 변경 실패:", err);
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'var(--bg-paper)', overflow: 'hidden' }}>

        <Box sx={{
          width: { xs: '100%', md: 360 },
          flexShrink: 0,
          overflow: 'hidden',
          borderRight: '1px solid var(--border-color)',
          display: { xs: roomId ? 'none' : 'flex', md: 'flex' },
          flexDirection: 'column',
          backgroundColor: 'var(--bg-paper)'
        }}>
          <Box sx={{ width: { xs: '100vw', md: 360 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* 헤더 타이틀 영역 (기존 접기 아이콘 제거됨) */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2, pt: 2, flexShrink: 0 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>메시지</Typography>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton onClick={() => { setCreateChatOpen(true); handleNewChatSearch(''); }} sx={{ color: 'var(--text-primary)', backgroundColor: 'var(--hover-bg)' }}>
                  <AddCircleOutline fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box ref={searchWrapRef} sx={{ position: 'relative', px: 2, mb: 1, flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--hover-bg)', borderRadius: 2.5, px: 1.5, py: 1 }}>
                <Search sx={{ color: '#94A3B8', fontSize: 20, mr: 1 }} />
                <InputBase
                  fullWidth placeholder="검색..." value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => { setSearchOpen(true); if (searchResults.length === 0) handleSearchChange(searchQuery); }}
                  sx={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}
                />
                {isSearching
                  ? <CircularProgress size={16} sx={{ color: '#94A3B8', ml: 1 }} />
                  : searchQuery && (
                    <IconButton size="small" onClick={() => handleSearchChange('')} sx={{ color: '#94A3B8', p: 0.2 }}>
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  )
                }
              </Box>
              {searchOpen && (
                <Paper elevation={4} sx={{ position: 'absolute', top: '100%', left: 0, right: 0, mt: 1, zIndex: 10, borderRadius: 2, overflow: 'hidden' }}>
                  <List disablePadding>
                    {searchResults.length > 0 ? searchResults.map((user, idx) => (
                      <ListItem
                        button key={user.USER_ID}
                        onClick={() => handleStartChatFromSearch(user)}
                        sx={{
                          py: 1.2, px: 2, borderBottom: idx < searchResults.length - 1 ? '1px solid var(--border-color)' : 'none'
                        }}
                      >
                        <ListItemAvatar sx={{ minWidth: 46 }}>
                          <Avatar src={user.AVATAR ? `${API}${user.AVATAR}` : null} sx={{ width: 34, height: 34, backgroundColor: 'var(--text-primary)', fontSize: '0.8rem' }}>
                            {getInitial(user.NICKNAME)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={<Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{user.NICKNAME}</Typography>}
                          secondary={<Typography sx={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{user.BIO_SHORT || `@${user.NICKNAME}`}</Typography>}
                          sx={{ m: 0 }}
                        />
                      </ListItem>
                    )) : (
                      <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography sx={{ color: '#94A3B8', fontSize: '0.8rem' }}>결과 없음</Typography>
                      </Box>
                    )}
                  </List>
                </Paper>
              )}
            </Box>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              {loadingRooms ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={24} /></Box>
              ) : chatRooms.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>대화가 없습니다.</Typography>
                </Box>
              ) : (
                <List disablePadding>
                  {chatRooms.map((room) => {
                    const isActive = parseInt(roomId) === room.ROOM_ID;
                    const isMuted = mutedRooms[room.ROOM_ID];
                    const hasMyMention = !mentionReadRoomsRef.current[room.ROOM_ID] &&
                      typeof room.LAST_MESSAGE === 'string' &&
                      room.LAST_MESSAGE.includes(`@${myNickname}`);

                    return (
                      <ListItem
                        key={room.ROOM_ID}
                        onClick={() => navigate(`/messages/room/${room.ROOM_ID}`)}
                        sx={{ cursor: 'pointer', py: 1.8, px: 2.5, backgroundColor: isActive ? (mode === 'dark' ? '#22253A' : '#F1F5F9') : 'transparent', transition: 'all 0.15s', '&:hover': { backgroundColor: 'var(--bg-default)' } }}
                      >
                        <ListItemAvatar sx={{ minWidth: 54 }}>
                          <Badge
                            badgeContent={hasMyMention ? '@' : undefined}
                            color="error"
                            variant={hasMyMention ? 'standard' : 'dot'}
                            invisible={!room.UNREAD_COUNT && !hasMyMention}
                            sx={{
                              '& .MuiBadge-badge': {
                                right: 4, top: 4,
                                fontSize: '0.55rem', fontWeight: 900,
                                minWidth: hasMyMention ? 16 : 8,
                                height: hasMyMention ? 16 : 8,
                                padding: hasMyMention ? '0 3px' : 0,
                                backgroundColor: '#EF4444',
                              }
                            }}
                          >
                            {room.ROOM_TYPE === 'GROUP' ? (
                              <GroupAvatar avatarBg={mode === 'dark' ? '#F1F5F9' : '#0F172A'} avatars={room.PARTICIPANT_AVATARS} nicknames={room.PARTICIPANT_NICKNAMES} roomImage={room.ROOM_IMAGE} size={42} />
                            ) : (
                              <Avatar src={room.TARGET_AVATAR ? `${API}${room.TARGET_AVATAR}` : null} sx={{ width: 42, height: 42, backgroundColor: mode === 'dark' ? '#F1F5F9' : '#0F172A', color: mode === 'dark' ? '#0F172A' : '#fff', fontWeight: 800 }}>
                                {getInitial(room.TARGET_NICKNAME)}
                              </Avatar>
                            )}
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.2 }}>
                              <Typography sx={{ fontWeight: isActive ? 800 : 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                                {room.TARGET_NICKNAME || (room.ROOM_TYPE === 'GROUP' ? (room.ROOM_NAME || '그룹 채팅방') : '')}
                                {isMuted && <NotificationsOff sx={{ fontSize: 13, color: '#94A3B8', ml: 0.5 }} />}
                              </Typography>
                              <Typography sx={{ fontSize: '0.7rem', color: '#94A3B8' }}></Typography>
                            </Box>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, maxWidth: '85%', overflow: 'hidden' }}>
                                {room.TYPING_USERS?.length > 0 ? (
                                  <Typography sx={{
                                    fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600, fontStyle: 'italic'
                                    , whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                                  }}>
                                    {room.TYPING_USERS[0]}님이 입력 중...
                                  </Typography>
                                ) : (
                                  <>
                                    {room.LAST_IS_STICKER && <SentimentSatisfiedAlt sx={{ fontSize: 13, color: '#94A3B8', flexShrink: 0 }} />}
                                    {room.LAST_HAS_IMAGE && !room.LAST_IS_STICKER && <ImageOutlined sx={{ fontSize: 13, color: '#94A3B8', flexShrink: 0 }} />}
                                    {room.LAST_HAS_FILE && !room.LAST_IS_STICKER && !room.LAST_HAS_IMAGE && <AttachFile sx={{ fontSize: 13, color: '#94A3B8', flexShrink: 0 }} />}
                                    <Typography sx={{ fontSize: '0.8rem', color: room.UNREAD_COUNT ? (mode === 'dark' ? '#F1F5F9' : '#0F172A') : '#64748B', fontWeight: room.UNREAD_COUNT ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {room.LAST_IS_STICKER ? '이모티콘을 보냈습니다.'
                                        : room.LAST_HAS_IMAGE ? '사진을 보냈습니다.'
                                          : room.LAST_HAS_FILE ? '파일을 보냈습니다.'
                                            : room.LAST_MESSAGE?.startsWith('__SHARE__') ? (() => {
                                              try {
                                                const d = JSON.parse(room.LAST_MESSAGE.replace('__SHARE__', ''));
                                                return d.isReel ? '릴스를 공유했습니다.' : '게시글을 공유했습니다.';
                                              } catch { return '게시글을 공유했습니다.'; }
                                            })() : room.LAST_MESSAGE || ''}                                    </Typography>
                                    <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8', flexShrink: 0, ml: 0.5 }}>
                                      · {formatListTimeRelative(room.LAST_MESSAGE_AT)}
                                    </Typography>
                                  </>
                                )}
                              </Box>
                              {room.UNREAD_COUNT > 0 && (
                                <Box sx={{ backgroundColor: '#EF4444', color: '#fff', fontSize: '0.6rem', fontWeight: 800, px: 0.6, py: 0.1, borderRadius: 10, flexShrink: 0 }}>
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
        </Box>

        <Box
          sx={{ flex: 1, display: { xs: roomId ? 'flex' : 'none', md: 'flex' }, flexDirection: 'column', transition: 'background-color 0.3s', position: 'relative', minWidth: 0 }}
          style={{ backgroundColor: chatBgColor }}
        >

          {!roomId ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', border: `2px solid ${mode === 'dark' ? '#F1F5F9' : '#0F172A'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <MailOutline sx={{ fontSize: 40, color: 'var(--text-primary)' }} />
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)', mb: 1 }}>내 메시지</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>친구나 그룹에게 비공개 사진과 메시지를 보내보세요.</Typography>
            </Box>
          ) : (loadingChat || !roomInfo) ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>
          ) : (
            <>
              {deleteMode ? (
                <Box sx={{
                  position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, backgroundColor: mode === 'dark' ? '#22253A' : '#0F172A', color: '#fff'
                  , animation: 'slideIn 0.2s ease'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size="small" onClick={() => { setDeleteMode(false); setSelectedDeleteIds([]); }} sx={{ color: '#fff' }}><Close /></IconButton>
                    <Typography sx={{ fontWeight: 700, fontSize: '1rem' }}>{selectedDeleteIds.length}개 선택됨</Typography>
                  </Box>
                  <Button variant="contained" color="error" onClick={executeBulkDelete} disabled={selectedDeleteIds.length === 0} sx={{ fontWeight: 800, borderRadius: 2 }}>삭제</Button>
                </Box>
              ) : (
                <Box sx={{
                  display: 'flex', flexDirection: 'column', borderBottom: '1px solid var(--border-color)',
                  backdropFilter: 'blur(12px)', zIndex: 10,
                  backgroundColor: 'var(--bg-paper)',
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => navigate('/messages')} sx={{ color: 'var(--text-secondary)', display: { md: 'none' }, mr: 1 }}><ArrowBack /></IconButton>

                      {isGroup ? (
                        <Box sx={{ mr: 1, cursor: 'pointer' }} onClick={() => setSettingsOpen(true)}>
                          <GroupAvatar
                            avatarBg={mode === 'dark' ? '#F1F5F9' : '#0F172A'}
                            avatars={roomInfo?.PARTICIPANT_AVATARS}
                            nicknames={roomInfo?.PARTICIPANT_NICKNAMES}
                            roomImage={roomInfo?.ROOM_IMAGE}
                            onClick={() => setSettingsOpen(true)}
                          />
                        </Box>
                      ) : (
                        <Box sx={{ mr: 1 }}>
                          <Badge
                            color="success"
                            variant="dot"
                            invisible={!isOnline}
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            sx={{ '& .MuiBadge-badge': { backgroundColor: '#22C55E', border: '2px solid #fff', width: 12, height: 12, borderRadius: '50%' } }}
                          >
                            <Avatar
                              src={displayAvatar ? (displayAvatar.startsWith('http') ? displayAvatar : `${API}${displayAvatar}`) : undefined}
                              onClick={() => navigate(`/user/${displayTitle}`)}
                              sx={{
                                width: 36, height: 36,
                                backgroundColor: mode === 'dark' ? '#F1F5F9' : '#0F172A',
                                color: mode === 'dark' ? '#0F172A' : '#fff',
                                fontWeight: 800, cursor: 'pointer'
                              }}
                            >
                              {getInitial(displayTitle)}
                            </Avatar>
                          </Badge>
                        </Box>
                      )}

                      <Box sx={{ ml: 0.5 }}>
                        <Typography
                          sx={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', cursor: 'pointer' }}
                          onClick={() => isGroup ? setSettingsOpen(true) : navigate(`/user/${displayTitle}`)}
                        >
                          {displayTitle}{isGroup && roomInfo?.MEMBER_COUNT ? ` (${roomInfo.MEMBER_COUNT})` : ''}
                        </Typography>

                        {(isOnline || activityLabel) && !isGroup && (
                          <Typography sx={{ fontSize: '0.7rem', color: isOnline ? '#22C55E' : '#64748B', fontWeight: 600 }}>
                            {isOnline ? '현재 접속 중' : activityLabel}
                          </Typography>
                        )}

                        {isGroup && (
                          <Box
                            onClick={handleOpenParticipantsModal}
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.3, cursor: 'pointer', '&:hover': { opacity: 0.7 } }}
                          >
                            <PeopleOutline sx={{ fontSize: 13, color: 'var(--text-secondary)' }} />
                            <Typography sx={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                              참여자 {roomInfo?.MEMBER_COUNT}명
                            </Typography>
                            <ExpandMore sx={{ fontSize: 13, color: 'var(--text-secondary)' }} />
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <IconButton onClick={() => setSettingsOpen(true)} sx={{ color: 'var(--text-primary)' }}><InfoOutlined /></IconButton>
                  </Box>
                </Box>
              )}

              <Box
                ref={chatContainerRef}
                onScroll={(e) => {
                  sessionStorage.setItem(`scroll_${roomId}`, e.target.scrollTop);
                  const el = e.target;
                  setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 200);
                }}
                sx={{
                  flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 0.8, mt: deleteMode ? 7 : 0,
                  '&::-webkit-scrollbar': { display: 'none' },
                  scrollbarWidth: 'none',
                }}
              >
                {!isGroup && peerProfile && !peerProfileDismissed && messages.length === 0 && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 1.5 }}>
                    {/* 프로필 이미지 (클릭 시 이동) */}
                    <Avatar
                      src={peerProfile.AVATAR ? (peerProfile.AVATAR.startsWith('http') ? peerProfile.AVATAR : `${API}${peerProfile.AVATAR}`) : undefined}
                      onClick={() => navigate(`/user/${peerProfile.NICKNAME}`)}
                      sx={{ width: 80, height: 80, fontSize: '2rem', backgroundColor: 'var(--text-primary)', fontWeight: 800, cursor: 'pointer', transition: 'opacity 0.2s', '&:hover': { opacity: 0.8 } }}
                    >
                      {getInitial(peerProfile.NICKNAME)}
                    </Avatar>

                    {/* 닉네임 (클릭 시 이동) */}
                    <Typography
                      onClick={() => navigate(`/user/${peerProfile.NICKNAME}`)}
                      sx={{
                        fontWeight: 800,
                        fontSize: '1.15rem',
                        cursor: 'pointer',
                        transition: 'color 0.2s ease',
                        '&:hover': { color: '#2563EB' }
                      }}
                    >
                      {peerProfile.NICKNAME}
                    </Typography>

                    {/* 몇 분 전 활동 추가 */}
                    {peerProfile.LAST_ACTIVE && (
                      <Typography sx={{ fontSize: '0.75rem', color: '#22C55E', fontWeight: 600, mt: -1 }}>
                        {formatActivity(peerProfile.LAST_ACTIVE)}
                      </Typography>
                    )}

                    {peerProfile.BIO_SHORT && (
                      <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{peerProfile.BIO_SHORT}</Typography>
                    )}

                    <Stack direction="row" spacing={3} sx={{ my: 1 }}>
                      {[['게시물', peerProfile.POST_CNT], ['팔로워', peerProfile.FOLLOWER_CNT], ['팔로잉', peerProfile.FOLLOWING_CNT]].map(([label, val]) => (
                        <Box key={label} sx={{ textAlign: 'center' }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '1rem' }}>{val ?? 0}</Typography>
                          <Typography sx={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{label}</Typography>
                        </Box>
                      ))}
                    </Stack>

                    {/* 문구 변경 및 '대화를 시작해보세요!' 추가 */}
                    <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center', mt: 1, lineHeight: 1.6 }}>
                      {peerProfile.I_FOLLOW === 'ACCEPTED' && peerProfile.THEY_FOLLOW === 'ACCEPTED'
                        ? '서로 팔로우하고 있습니다.'
                        : peerProfile.I_FOLLOW === 'ACCEPTED'
                          ? '내가 팔로우하고 있습니다.'
                          : peerProfile.THEY_FOLLOW === 'ACCEPTED'
                            ? '상대방이 팔로우하고 있습니다.'
                            : '서로 팔로우하고 있지 않습니다.'}
                      <br />
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>대화를 시작해보세요!</span>
                    </Typography>
                  </Box>
                )}
                {processedMessages.map((msg, idx) => {
                  const prevMsg = idx > 0 ? processedMessages[idx - 1] : null;
                  const showDateDivider = !prevMsg || !isSameDay(prevMsg.SENT_AT, msg.SENT_AT);
                  const isSystem = msg.IS_SYSTEM === true || msg.IS_SYSTEM === 'Y';
                  const isMe = msg.SENDER_NICKNAME === myNickname;
                  const currentMin = new Date(msg.SENT_AT).setSeconds(0, 0);
                  const nextMsg = processedMessages[idx + 1];
                  const nextMin = nextMsg ? new Date(nextMsg.SENT_AT).setSeconds(0, 0) : null;
                  const isFirstInGroup = !prevMsg || prevMsg.SENDER_NICKNAME !== msg.SENDER_NICKNAME || prevMsg.IS_SYSTEM === true || prevMsg.IS_SYSTEM === 'Y' || showDateDivider;
                  const isLastInGroup = !nextMsg || nextMsg.SENDER_NICKNAME !== msg.SENDER_NICKNAME || nextMsg.IS_SYSTEM === true || nextMsg.IS_SYSTEM === 'Y' || currentMin !== nextMin;
                  const showAvatar = !isMe && isFirstInGroup;
                  const colors = getBubbleColors(isMe);
                  const isSticker = isStickerMessage(msg);
                  const stickerEmoji = isSticker ? getStickerEmoji(msg) : null;
                  const isEmoticon = msg.IS_EMOTICON === true || msg.IS_EMOTICON === 'Y' ||
                    (typeof msg.MESSAGE === 'string' && msg.MESSAGE.startsWith('__EMOTICON__'));

                  const rawEmoticonPath = isEmoticon
                    ? (msg.EMOTICON_URL || msg.MESSAGE?.replace('__EMOTICON__', ''))
                    : null;

                  const emoticonSrc = rawEmoticonPath
                    ? (rawEmoticonPath.startsWith('http') || rawEmoticonPath.startsWith('blob:')
                      ? rawEmoticonPath
                      : `${API}${rawEmoticonPath}`)
                    : null;
                  const readAt = readAtMap[msg.MESSAGE_ID];

                  return (
                    <React.Fragment key={msg.MESSAGE_ID || idx}>
                      {showDateDivider && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.5 }}>
                          <Box sx={{ flex: 1, height: '1px', backgroundColor: mode === 'dark' ? '#2D3148' : '#E2E8F0' }} />
                          <Typography sx={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {formatDateLabel(msg.SENT_AT)}
                          </Typography>
                          <Box sx={{ flex: 1, height: '1px', backgroundColor: mode === 'dark' ? '#2D3148' : '#E2E8F0' }} />
                        </Box>
                      )}

                      {isSystem ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', my: 0.5 }}>
                          <Box sx={{
                            px: 2, py: 0.6, backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            borderRadius: 10, backdropFilter: 'blur(4px)'
                          }}>
                            <Typography sx={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 500, textAlign: 'center' }}>
                              {msg.MESSAGE}
                            </Typography>
                          </Box>
                        </Box>
                      ) : (
                        <Box
                          onClick={() => handleRowClick(msg.MESSAGE_ID)}
                          sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 1, '&:hover .msg-options': { opacity: deleteMode ? 0 : 1 }, cursor: deleteMode ? 'pointer' : 'default', width: '100%', mb: isLastInGroup ? 1.5 : 0 }}
                        >
                          {deleteMode && (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, flexShrink: 0 }}>
                              <Checkbox
                                checked={selectedDeleteIds.includes(msg.MESSAGE_ID)}
                                onChange={() => toggleSelectDelete(msg.MESSAGE_ID)}
                                onClick={(e) => e.stopPropagation()}
                                sx={{
                                  p: 0,
                                  color: 'var(--text-secondary)',
                                  '&.Mui-checked': { color: '#2563EB' },
                                }}
                              />
                            </Box>
                          )}
                          <Box sx={{ flex: 1, display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 1 }}>
                            {/* 보낸 사람 아바타 */}
                            <Box sx={{ width: 36, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                              {showAvatar && !isMe && (
                                <Avatar
                                  src={msg.SENDER_AVATAR ? (msg.SENDER_AVATAR.startsWith('http') ? msg.SENDER_AVATAR : `${API}${msg.SENDER_AVATAR}`) : undefined}
                                  onClick={(e) => { e.stopPropagation(); navigate(`/user/${msg.SENDER_NICKNAME}`); }}
                                  sx={{ width: 32, height: 32, backgroundColor: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  {getInitial(msg.SENDER_NICKNAME)}
                                </Avatar>
                              )}
                            </Box>

                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: isSticker ? 120 : '70%' }}>
                              {showAvatar && !isMe && (
                                <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-secondary)', mb: 0.5, ml: 0.5, fontWeight: 600 }}>
                                  {msg.SENDER_NICKNAME}
                                </Typography>
                              )}
                              <Stack direction={isMe ? 'row-reverse' : 'row'} alignItems="flex-end" spacing={0.5}>
                                {isSticker ? (
                                  <Box sx={{ fontSize: '4rem', lineHeight: 1, animation: 'stickerBounce 0.4s ease', userSelect: 'none', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}>
                                    {stickerEmoji}
                                  </Box>
                                ) : isEmoticon ? (
                                  <Box
                                    component="img"
                                    src={emoticonSrc}
                                    sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 2, cursor: 'zoom-in', display: 'block' }}
                                    onClick={(e) => { e.stopPropagation(); handleChatImageClick(emoticonSrc); }}
                                  />
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
                                            sx={{ maxWidth: 240, maxHeight: 240, borderRadius: 1.5, display: 'block', mb: msg.MESSAGE ? 1 : 0, cursor: 'zoom-in', transition: 'opacity 0.15s', '&:hover': { opacity: 0.9 } }}
                                            onClick={(e) => { e.stopPropagation(); handleChatImageClick(msg.IMAGE_URL); }}
                                          />
                                        )}
                                        {msg.FILE_URL && !msg.IMAGE_URL && (
                                          <Box
                                            component="a"
                                            href={msg.FILE_URL.startsWith('blob:') || msg.FILE_URL.startsWith('http') ? msg.FILE_URL : `${API}${msg.FILE_URL}`}
                                            target="_blank" rel="noreferrer"
                                            sx={{ display: 'flex', alignItems: 'center', gap: 1, color: isMe ? '#fff' : '#2563EB', textDecoration: 'none', mb: msg.MESSAGE ? 1 : 0 }}
                                          >
                                            <AttachFile fontSize="small" />
                                            <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{msg.FILE_NAME || '파일'}</Typography>
                                          </Box>
                                        )}
                                        {msg.MESSAGE?.startsWith('__SHARE__') ? (() => {
                                          try {
                                            const data = JSON.parse(msg.MESSAGE.replace('__SHARE__', ''));
                                            const thumb = data.image
                                              ? (data.image.startsWith('http') ? data.image : `${API}${data.image}`)
                                              : null;
                                            return (
                                              <Box
                                                onClick={(e) => { e.stopPropagation(); navigate(`/post/${data.postId}`); }}
                                                sx={{ cursor: 'pointer', borderRadius: 1.5, overflow: 'hidden', border: `1px solid ${isMe && bubbleStyle !== 'outlined' ? 'rgba(255,255,255,0.25)' : 'var(--border-color)'}`, minWidth: 350, maxWidth: 400, mt: 0.5 }}
                                              >
                                                {thumb && !data.isReel && (
                                                  <Box component="img" src={thumb}
                                                    sx={{ width: '100%', height: 260, objectFit: 'cover', display: 'block' }}
                                                  />
                                                )}
                                                {data.isReel && (
                                                  <Box sx={{ width: '100%', height: 360, backgroundColor: '#000', position: 'relative', overflow: 'hidden' }}>
                                                    <video
                                                      src={(() => {
                                                        if (data.image) {
                                                          return data.image.startsWith('http') ? data.image : `${API}${data.image}`;
                                                        }
                                                        const match = (data.description || '').match(/src="([^"]+)"/);
                                                        const url = match ? match[1] : null;
                                                        if (!url) return null;
                                                        return url.startsWith('http') ? url : `${API}${url}`;
                                                      })()}
                                                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                      muted
                                                      playsInline
                                                      preload="metadata"
                                                    />
                                                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' }}>
                                                      <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Box sx={{ width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '14px solid #fff', ml: '3px' }} />
                                                      </Box>
                                                    </Box>
                                                  </Box>
                                                )}
                                                <Box sx={{ p: 1.2, backgroundColor: isMe && bubbleStyle !== 'outlined' ? 'rgba(0,0,0,0.15)' : (mode === 'dark' ? '#1A1D27' : '#F8FAFC') }}>
                                                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: isMe && bubbleStyle !== 'outlined' ? '#fff' : 'var(--text-primary)', lineHeight: 1.4, mb: 0.3 }}>
                                                    {data.title}
                                                  </Typography>
                                                  <Typography sx={{ fontSize: '0.7rem', color: isMe && bubbleStyle !== 'outlined' ? 'rgba(255,255,255,0.6)' : '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {data.isReel ? '릴스 보기 →' : '게시글 보기 →'}
                                                  </Typography>
                                                  {data.text && (
                                                    <Typography sx={{ fontSize: '0.78rem', color: isMe && bubbleStyle !== 'outlined' ? 'rgba(255,255,255,0.85)' : 'var(--text-primary)', mt: 0.8, fontStyle: 'italic' }}>
                                                      {data.text}
                                                    </Typography>
                                                  )}
                                                </Box>
                                              </Box>
                                            );
                                          } catch { return null; }
                                        })() : msg.MESSAGE && msg.MESSAGE.trim() && (
                                          <Typography sx={{ fontSize: '0.92rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                                            {renderMessageContent(msg.MESSAGE, isMe, bubbleStyle, navigate, validNicknames)}
                                          </Typography>
                                        )}
                                        {msg.IS_EDITED === 'Y' && (
                                          <Typography sx={{ fontSize: '0.62rem', color: isMe ? 'rgba(255,255,255,0.6)' : '#94A3B8', mt: 0.3 }}>수정됨</Typography>
                                        )}
                                      </>
                                    )}
                                  </Box>
                                )}

                                {/* 2. 시간 및 읽음 표시 (말풍선 바로 옆으로 이동) */}
                                {isLastInGroup && (
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', mb: 0.5 }}>
                                    {isMe && !isGroup && msg.MESSAGE_ID === lastReadMsgId && (
                                      <Typography sx={{ fontSize: '0.65rem', color: '#2563EB', fontWeight: 700, mb: 0.2 }}>
                                        읽음{readAt ? ` ${formatTime(readAt)}` : ''}
                                      </Typography>
                                    )}
                                    <Typography sx={{ fontSize: '0.65rem', color: '#94A3B8', minWidth: 40, textAlign: isMe ? 'right' : 'left' }}>
                                      {formatTime(msg.SENT_AT)}
                                    </Typography>
                                  </Box>
                                )}

                                {/* 3. 점 세개 옵션 메뉴 (가장 바깥쪽, 호버 시 나타남) */}
                                {!deleteMode && (
                                  <IconButton className="msg-options" size="small" onClick={(e) => handleMessageOptionClick(e, msg)} sx={{ opacity: 0, transition: 'opacity 0.2s', color: '#94A3B8', mb: 0.5 }}>
                                    <MoreVert fontSize="small" />
                                  </IconButton>
                                )}
                              </Stack>
                              {/* 읽음 아바타 + 리액션 한 줄로 */}
                              <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 0.5, mt: 0.5, justifyContent: isMe ? 'flex-end' : 'flex-start', flexWrap: 'wrap' }}>
                                {/* 그룹 읽음 아바타 */}
                                {isMe && isGroup && msg.READ_BY && msg.READ_BY.length > 0 &&
                                  msg.READ_BY.slice(0, 5).map((r, i) => (
                                    <Avatar
                                      key={i}
                                      src={r.avatar || undefined}
                                      sx={{
                                        width: 20, height: 20,
                                        fontSize: '0.55rem', fontWeight: 800,
                                        border: `1.5px solid ${mode === 'dark' ? '#1A1D27' : '#fff'}`,
                                        backgroundColor: 'var(--text-primary)',
                                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                                      }}
                                    >
                                      {getInitial(r.nickname)}
                                    </Avatar>
                                  ))
                                }

                                {reactions[msg.MESSAGE_ID] && Object.entries(reactions[msg.MESSAGE_ID]).map(([emoji, data]) => (
                                  <Box
                                    key={emoji}
                                    onClick={(e) => { e.stopPropagation(); handleReaction(msg.MESSAGE_ID, emoji); }}
                                    title={data.users?.join(', ')}
                                    sx={{
                                      display: 'flex', alignItems: 'center', gap: 0.3,
                                      backgroundColor: data.myReaction ? '#EFF6FF' : (mode === 'dark' ? '#22253A' : '#F1F5F9'),
                                      border: data.myReaction ? '1px solid #2563EB' : '1px solid var(--border-color)',
                                      borderRadius: 10, px: 0.8, py: 0.2, cursor: 'pointer',
                                      transition: 'all 0.15s', '&:hover': { opacity: 0.8 },
                                    }}
                                  >
                                    <Typography sx={{ fontSize: '0.82rem', lineHeight: 1 }}>{emoji}</Typography>
                                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: data.myReaction ? '#2563EB' : 'var(--text-secondary)' }}>
                                      {data.count}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* 타이핑 인디케이터 */}
                {typingUsers.map((nickname) => {
                  const typingParticipant = participants.find(p => p.NICKNAME === nickname);
                  const avatarSrc = typingParticipant?.AVATAR ? (typingParticipant.AVATAR.startsWith('http') ? typingParticipant.AVATAR : `${API}${typingParticipant.AVATAR}`) : undefined;
                  return (
                    <Box key={nickname} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 1, width: '100%' }}>
                      {deleteMode && <Box sx={{ width: 40, flexShrink: 0 }} />}
                      <Box sx={{ width: 36, flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
                        <Avatar
                          src={avatarSrc}
                          sx={{ width: 32, height: 32, backgroundColor: 'var(--text-primary)', fontSize: '0.7rem', fontWeight: 800 }}
                        >
                          {getInitial(nickname)}
                        </Avatar>
                      </Box>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        {isGroup && (
                          <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8', mb: 0.3, ml: 0.5, fontWeight: 600 }}>
                            {nickname}
                          </Typography>
                        )}
                        <Box sx={{ px: 2, py: 1.8, backgroundColor: 'var(--bg-paper)', border: '1px solid var(--border-color)', borderRadius: '0px 16px 16px 16px', display: 'flex', gap: 0.5 }}>
                          {['-0.32s', '-0.16s', '0s'].map((delay, i) => (
                            <Box key={i} sx={{ width: 6, height: 6, backgroundColor: '#94A3B8', borderRadius: '50%', animation: 'typingBounce 1.4s infinite ease-in-out both', animationDelay: delay }} />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
                {showScrollBtn && (
                  <Box
                    onClick={scrollToBottom}
                    sx={{
                      position: 'absolute',
                      bottom: editingMessageId ? 135 : 90,
                      right: 24,
                      zIndex: 30,
                      width: 40, height: 40, borderRadius: '50%',
                      backgroundColor: mode === 'dark' ? 'rgba(26,29,39,0.9)' : 'rgba(255,255,255,0.9)',
                      color: 'var(--text-primary)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      animation: 'fadeIn 0.2s ease',
                      '&:hover': { backgroundColor: 'var(--hover-bg)' }
                    }}
                  >
                    <ExpandMore sx={{ fontSize: 24 }} />
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </Box>

              {editingMessageId && (
                <Box sx={{
                  px: 2, py: 1, backgroundColor: mode === 'dark' ? '#1E2D4A' : '#EFF6FF',
                  borderTop: `1px solid ${mode === 'dark' ? '#2D4A7A' : '#BFDBFE'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#2563EB', fontWeight: 700 }}>메시지 수정 중...</Typography>
                  <IconButton size="small" onClick={() => { setEditingMessageId(null); setNewMessage(''); }} sx={{ color: '#2563EB' }}><Close fontSize="small" /></IconButton>
                </Box>
              )}

              {isBlocked ? (
                <Box sx={{ p: 2, backgroundColor: 'var(--bg-default)', borderTop: `1px solid ${mode === 'dark' ? '#2D3148' : '#E2E8F0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', flexShrink: 0, minHeight: 74 }}>
                  <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {blockText}
                  </Typography>
                </Box>
              ) : (
                <Box component="form" onSubmit={handleSend} sx={{
                  p: 2, borderTop: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0,
                  backgroundColor: 'var(--bg-paper)',
                }}>
                  <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*,video/*,*/*" onChange={handleFileUpload} />
                  <IconButton sx={{ color: '#94A3B8' }} onClick={() => fileInputRef.current?.click()}><ImageOutlined /></IconButton>
                  <IconButton sx={{ color: '#94A3B8' }} onClick={(e) => setStickerAnchorEl(e.currentTarget)}><SentimentSatisfiedAlt /></IconButton>

                  <Box
                    id="chat-input-wrapper"
                    ref={inputWrapperRef}
                    sx={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden' }}
                  >
                    <Box
                      ref={overlayRef}
                      sx={{
                        position: 'absolute',
                        left: 0, top: 0, width: '100%', height: '100%',
                        px: 2, py: 1.2, borderRadius: 3,
                        backgroundColor: 'var(--hover-bg)',
                        fontSize: '0.95rem',
                        color: 'var(--text-primary)',
                        pointerEvents: 'none',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        whiteSpace: 'pre',
                        display: 'flex', alignItems: 'center',
                        '&::-webkit-scrollbar': { display: 'none' } // 스크롤바 숨김
                      }}
                    >
                      {!newMessage ? (
                        <Typography sx={{ color: '#94A3B8', fontSize: '0.95rem' }}>메시지 입력... (Ctrl+Space로 멘션)</Typography>
                      ) : (
                        newMessage.split(/(@[a-zA-Z0-9가-힣_-]+)/g).map((part, index) => (
                          part.startsWith('@') && part.length > 1 ? (
                            <span
                              key={index}
                              style={{
                                color: '#2563EB',
                                backgroundColor: '#EFF6FF',
                                borderRadius: '4px',
                                padding: '1px 4px',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                              }}
                            >
                              {part}
                            </span>
                          ) : (
                            <span key={index}>{part}</span>
                          )
                        ))
                      )}
                    </Box>

                    <InputBase
                      fullWidth
                      value={newMessage}
                      onChange={(e) => handleTypingInput(e.target.value)}
                      onKeyDown={handleInputKeyDown}
                      onPaste={handlePaste}
                      onScroll={(e) => {
                        if (overlayRef.current) overlayRef.current.scrollLeft = e.target.scrollLeft;
                      }}
                      autoComplete="off"
                      sx={{
                        px: 2, py: 1.2, fontSize: '0.95rem',
                        color: 'transparent', // 입력 글자 자체는 숨김
                        caretColor: 'var(--text-primary)', // 커서는 까맣게 유지
                        zIndex: 1, // 최상단으로 올림
                        '& input': {
                          backgroundColor: 'transparent',
                          '&::placeholder': { color: 'transparent' }
                        }
                      }}
                    />
                  </Box>
                  <IconButton type="submit" disabled={!newMessage.trim()} sx={{
                    backgroundColor: newMessage.trim() ? '#2563EB' : (mode === 'dark' ? '#2D3148' : '#E2E8F0')
                    , color: '#fff', '&:hover': { backgroundColor: '#1D4ED8' }, transition: 'all 0.2s', p: 1.2
                  }}>
                    <SendRounded sx={{ fontSize: 20 }} />
                  </IconButton>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box >

      {/* 메시지 옵션 메뉴 */}
      < Menu anchorEl={anchorElMessage} open={Boolean(anchorElMessage)} onClose={handleCloseMessageOption} PaperProps={{ sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', minWidth: 150 } }
      }>
        {/* 리액션 선택 바 */}
        {selectedMessage && selectedMessage.IS_DELETED !== 'Y' && (
          <Box sx={{ display: 'flex', gap: 0.5, px: 1.5, py: 1, borderBottom: '1px solid var(--border-color)' }}>
            {REACTION_EMOJIS.map(emoji => (
              <Box
                key={emoji}
                onClick={() => handleReaction(selectedMessage.MESSAGE_ID, emoji)}
                sx={{
                  fontSize: '1.4rem', cursor: 'pointer', borderRadius: '50%',
                  width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: reactions[selectedMessage.MESSAGE_ID]?.[emoji]?.myReaction ? '2px solid #2563EB' : '2px solid transparent',
                  transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.2)' }
                }}
              >
                {emoji}
              </Box>
            ))}
          </Box>
        )}
        {selectedMessage?.SENDER_NICKNAME === myNickname &&
          !isStickerMessage(selectedMessage) &&
          !selectedMessage?.IMAGE_URL &&
          !selectedMessage?.FILE_URL &&
          !selectedMessage?.MESSAGE?.startsWith('__SHARE__') && (
            <MenuItem onClick={handleEditMessageClick} sx={{ fontSize: '0.85rem' }}>
              <EditOutlined fontSize="small" sx={{ mr: 1, color: 'var(--text-secondary)' }} /> 수정
            </MenuItem>
          )}
        {
          selectedMessage?.SENDER_NICKNAME === myNickname && (
            <MenuItem onClick={handleDeleteMessageForAll} sx={{ fontSize: '0.85rem' }}>
              <DeleteOutline fontSize="small" sx={{ mr: 1, color: 'var(--text-secondary)' }} /> 모든 사람에게서 삭제
            </MenuItem>
          )
        }
        {
          selectedMessage && (
            <MenuItem onClick={handleDeleteMessageForMe} sx={{ fontSize: '0.85rem' }}>
              <DeleteOutline fontSize="small" sx={{ mr: 1, color: 'var(--text-secondary)' }} /> 나에게서만 삭제
            </MenuItem>
          )
        }
        {
          selectedMessage?.SENDER_NICKNAME !== myNickname && (
            <MenuItem onClick={handleReportMessage} sx={{ fontSize: '0.85rem', color: '#EF4444' }}>
              <ReportGmailerrorred fontSize="small" sx={{ mr: 1 }} /> 신고
            </MenuItem>
          )
        }
      </Menu >

      {/* 새 채팅 다이얼로그 */}
      < Dialog open={createChatOpen} onClose={() => { setCreateChatOpen(false); setSelectedUsers([]); setNewChatSearchQuery(''); setNewChatSearchResults([]); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, minHeight: 400 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', textAlign: 'center', borderBottom: `1px solid ${mode === 'dark' ? '#2D3148' : '#E2E8F0'}`, pb: 1.5 }}>새 채팅</DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: `1px solid ${mode === 'dark' ? '#2D3148' : '#E2E8F0'}` }}>
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
                <Checkbox
                  checked={!!selectedUsers.find(u => u.USER_ID === user.USER_ID)}
                  sx={{
                    p: 0, mr: 2,
                    color: 'var(--text-secondary)',
                    '&.Mui-checked': { color: '#2563EB' },
                  }}
                />
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar src={user.AVATAR ? `${API}${user.AVATAR}` : null} sx={{ width: 32, height: 32, backgroundColor: 'var(--text-primary)', fontSize: '0.75rem', fontWeight: 800 }}>
                    {getInitial(user.NICKNAME)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontWeight: 700 }}>{user.NICKNAME}</Typography>} />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${mode === 'dark' ? '#2D3148' : '#E2E8F0'}` }}>
          <Button fullWidth variant="contained" disabled={selectedUsers.length === 0} onClick={handleStartNewChat} sx={{ borderRadius: 2, fontWeight: 700, py: 1.2, boxShadow: 'none' }}>
            {selectedUsers.length > 1 ? '단체 채팅 시작' : '개인 채팅 시작'}
          </Button>
        </DialogActions>
      </Dialog >

      {/* 채팅방 설정 */}
      < Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4, backgroundColor: 'var(--bg-default)' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 800, fontSize: '1.2rem', borderBottom: `1px solid ${mode === 'dark' ? '#2D3148' : '#E2E8F0'}`, backgroundColor: 'var(--bg-paper)', py: 2 }}>
          채팅방 설정
          <IconButton onClick={() => setSettingsOpen(false)} size="small" sx={{ backgroundColor: 'var(--hover-bg)' }}><Close fontSize="small" /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {isGroup && (
            <Box sx={{ backgroundColor: 'var(--bg-paper)', p: 2.5, borderRadius: 3, border: '1px solid var(--border-color)', mb: 2 }}>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>채팅방 정보 수정</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 2.5 }}>
                <Box onClick={() => roomImageRef.current?.click()} sx={{ cursor: 'pointer', position: 'relative' }}>
                  {deleteRoomImage ? (
                    <GroupAvatar
                      avatarBg={mode === 'dark' ? '#F1F5F9' : '#0F172A'}
                      avatars={roomInfo?.PARTICIPANT_AVATARS}
                      nicknames={roomInfo?.PARTICIPANT_NICKNAMES}
                      roomImage={null}
                      size={72}
                    />
                  ) : roomImagePreview ? (
                    <Avatar src={roomImagePreview} sx={{ width: 72, height: 72 }} />
                  ) : (
                    <GroupAvatar
                      avatarBg={mode === 'dark' ? '#F1F5F9' : '#0F172A'}
                      avatars={roomInfo?.PARTICIPANT_AVATARS}
                      nicknames={roomInfo?.PARTICIPANT_NICKNAMES}
                      roomImage={roomInfo?.ROOM_IMAGE}
                      size={72}
                    />
                  )}
                  <Box sx={{ position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, backgroundColor: '#2563EB', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                    <EditOutlined sx={{ fontSize: 13, color: '#fff' }} />
                  </Box>
                </Box>
                <input type="file" ref={roomImageRef} style={{ display: 'none' }} accept="image/*" onChange={handleRoomImageChange} />
                <Typography sx={{ fontSize: '0.75rem', color: '#94A3B8' }}>사진을 클릭해서 변경</Typography>
                {(roomInfo?.ROOM_IMAGE || roomImagePreview) && !deleteRoomImage && (
                  <Button
                    size="small"
                    onClick={() => { setDeleteRoomImage(true); setRoomImagePreview(null); setRoomImageFile(null); }}
                    sx={{ fontSize: '0.72rem', color: '#EF4444', textTransform: 'none', p: 0 }}
                  >
                    사진 삭제
                  </Button>
                )}
              </Box>
              {/* FIX 5: 빈 이름일 때 저장 버튼 비활성화 + 경고 */}
              <InputBase
                fullWidth
                value={roomNameEdit}
                onChange={(e) => setRoomNameEdit(e.target.value)}
                placeholder="채팅방 이름을 입력해주세요"
                sx={{
                  backgroundColor: 'var(--bg-default)',
                  border: `1px solid ${!roomNameEdit.trim() ? '#FCA5A5' : (mode === 'dark' ? '#2D3148' : '#E2E8F0')}`,
                  borderRadius: 2, px: 2, py: 1, fontSize: '0.9rem', mb: 0.5
                }}
              />
              {!roomNameEdit.trim() && (
                <Typography sx={{ fontSize: '0.72rem', color: '#EF4444', mb: 1, ml: 0.5 }}>
                  채팅방 이름은 필수입니다.
                </Typography>
              )}
              <Button
                fullWidth variant="contained"
                onClick={handleSaveRoomInfo}
                disabled={!roomNameEdit.trim()}
                sx={{
                  mt: 1, borderRadius: 2, fontWeight: 700, boxShadow: 'none', py: 1,
                  '&.Mui-disabled': { backgroundColor: mode === 'dark' ? '#2D3148' : '#E2E8F0', color: '#94A3B8' }
                }}
              >
                저장
              </Button>
            </Box>
          )}

          <Box sx={{ backgroundColor: 'var(--bg-paper)', p: 2.5, borderRadius: 3, border: '1px solid var(--border-color)', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={!!mutedRooms[roomId]}
                  onChange={(e) => handleMuteToggle(roomId, e.target.checked)}
                  color="primary"
                />
              }
              label={<Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>알림 끄기</Typography>}
              sx={{ m: 0, width: '100%', justifyContent: 'space-between' }}
              labelPlacement="start"
            />
          </Box>

          <Box sx={{ backgroundColor: 'var(--bg-paper)', p: 2.5, borderRadius: 3, border: '1px solid var(--border-color)', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>배경색 변경</Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {[
                { color: mode === 'dark' ? '#0F1117' : '#F8FAFC' },
                { color: '#EFF6FF' }, { color: '#FEF2F2' }, { color: '#F0FDF4' },
                { color: '#FFFBEB' }, { color: '#F5F3FF' }, { color: '#FAFAFA' },
                { color: '#18181B' },
              ].map(({ color }) => (
                <Box key={color} onClick={() => handleBgColorChange(color)}
                  sx={{
                    width: 44, height: 44, borderRadius: '50%', backgroundColor: color, border: chatBgColor === color ? '3px solid #2563EB' : `1px solid ${mode === 'dark' ? '#2D3148' : '#CBD5E1'}`
                    , cursor: 'pointer', transition: 'transform 0.1s', '&:hover': { transform: 'scale(1.1)' }
                  }}
                />
              ))}
            </Stack>
          </Box>

          <Box sx={{ backgroundColor: 'var(--bg-paper)', p: 2.5, borderRadius: 3, border: '1px solid var(--border-color)', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 2 }}>말풍선 스타일</Typography>
            <Select fullWidth size="small" value={bubbleStyle} onChange={(e) => handleBubbleStyleChange(e.target.value)} sx={{ borderRadius: 2, backgroundColor: 'var(--bg-default)' }}>
              <MenuItem value="rounded">둥근 모서리 (기본)</MenuItem>
              <MenuItem value="sharp">각진 모서리</MenuItem>
              <MenuItem value="outlined">테두리형</MenuItem>
            </Select>
          </Box>

          {/* FIX 2: 첨부파일 갤러리 — 클릭 시 좌우 화살표로 탐색 */}
          <Box sx={{ backgroundColor: 'var(--bg-paper)', p: 2.5, borderRadius: 3, border: '1px solid var(--border-color)', mb: 2, boxShadow: '0 2px 12px rgba(0,0,0,0.02)' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', mb: 1.5 }}>모든 첨부파일</Typography>
            {allAttachmentImages.length === 0 ? (
              <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>첨부된 이미지가 없습니다.</Typography>
            ) : (
              <Grid container spacing={1}>
                {allAttachmentImages.map((imgUrl, i) => (
                  <Grid item xs={3} key={i}>
                    <Box
                      component="img"
                      src={imgUrl}
                      sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', borderRadius: 2, cursor: 'zoom-in', transition: 'opacity 0.15s', '&:hover': { opacity: 0.8 } }}
                      onClick={() => handleGalleryImageClick(i)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>

          <Button fullWidth variant="outlined" color="error" startIcon={<ExitToApp />} onClick={handleLeaveRoom} sx={{ fontWeight: 800, borderRadius: 2, py: 1.2, backgroundColor: 'var(--bg-paper)' }}>
            채팅방 나가기
          </Button>
        </DialogContent>
      </Dialog >

      {/* 확인 모달 */}
      < Dialog open={confirmModal.open} onClose={() => setConfirmModal({ open: false })} PaperProps={{ sx: { borderRadius: 3, px: 1, py: 1, minWidth: 320 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{confirmModal.title}</DialogTitle>
        <DialogContent><Typography sx={{ color: mode === 'dark' ? '#94A3B8' : '#475569', fontSize: '0.9rem', mt: 0.5 }}>{confirmModal.desc}</Typography></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmModal({ open: false })} sx={{ color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.85rem' }}>취소</Button>
          <Button onClick={confirmModal.onConfirm} variant="contained" sx={{ backgroundColor: '#EF4444', color: '#fff', fontWeight: 800, fontSize: '0.85rem', borderRadius: 1.5, boxShadow: 'none', '&:hover': { backgroundColor: '#DC2626' } }}>확인</Button>
        </DialogActions>
      </Dialog >

      {/* 참여자 목록 모달 */}
      < ParticipantsModal
        open={participantsModalOpen}
        onClose={() => setParticipantsModalOpen(false)}
        participants={participants}
        loading={participantsLoading}
        onClickUser={(nickname) => navigate(`/user/${nickname}`)}
      />

      < MessageReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        onSuccess={() => setReportSuccessOpen(true)}
      />

      {/* FIX 1 & 2: 이미지 뷰어 모달 */}
      <ImageViewerModal
        open={imageViewer.open}
        onClose={() => setImageViewer(prev => ({ ...prev, open: false }))}
        imageUrl={imageViewer.url}
        allImages={imageViewer.allImages}
        initialIndex={imageViewer.index}
      />

      <Snackbar open={reportSuccessOpen} autoHideDuration={2500} onClose={() => setReportSuccessOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>신고가 접수되었습니다.</Alert>
      </Snackbar>

      <Snackbar open={roomNameSavedOpen} autoHideDuration={2000} onClose={() => setRoomNameSavedOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" sx={{ fontWeight: 600, fontSize: '0.85rem', borderRadius: 2 }}>저장되었습니다.</Alert>
      </Snackbar>
      <Popover
        open={Boolean(stickerAnchorEl)}
        anchorEl={stickerAnchorEl}
        onClose={() => setStickerAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{ sx: { borderRadius: 3, p: 1.5, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' } }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, width: 240 }}>
          {EMOTICON_LIST.map((em) => (
            <Box
              key={em.id}
              onClick={() => {
                setStickerAnchorEl(null);
                const optimisticMsg = {
                  MESSAGE_ID: Date.now(),
                  SENDER_NICKNAME: myNickname,
                  MESSAGE: '',
                  IMAGE_URL: null,
                  EMOTICON_URL: `${API}${em.src}`,
                  IS_EMOTICON: true,
                  SENT_AT: new Date().toISOString(),
                  IS_READ: 'N', READ_BY: []
                };
                setMessages(prev => [...prev, optimisticMsg]);
                setTimeout(scrollToBottom, 50);
                fetch(`${API}/messages/${roomId}/send`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                  body: JSON.stringify({ message: `__EMOTICON__${em.src}`, IS_EMOTICON: true })
                }).catch(() => { });
              }}
              sx={{ cursor: 'pointer', borderRadius: 2, overflow: 'hidden', transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.1)' } }}
            >
              <Box component="img" src={`${API}${em.src}`} sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
            </Box>
          ))}
        </Box>
      </Popover>
      <Popover
        open={Boolean(mentionAnchorEl)}
        anchorEl={mentionAnchorEl}
        onClose={() => setMentionAnchorEl(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        disableAutoFocus
        disableEnforceFocus
        PaperProps={{ sx: { borderRadius: 2, mt: -1, mb: 1, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' } }}
      >
        {(() => {
          const mentionableFiltered = (isGroup ? participants : (roomInfo?.TARGET_NICKNAME ? [{ NICKNAME: roomInfo.TARGET_NICKNAME, USER_ID: 'peer', AVATAR: roomInfo.TARGET_AVATAR }] : []))
            .filter(p => p.NICKNAME !== myNickname && p.NICKNAME.toLowerCase().includes(mentionFilter));
          return (
            <List sx={{ maxHeight: 200, overflowY: 'auto', minWidth: 200, p: 1 }}>
              {mentionableFiltered.length === 0 ? (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '0.8rem', color: '#94A3B8' }}>일치하는 사용자가 없습니다.</Typography>
                </Box>
              ) : mentionableFiltered.map((p, idx) => (
                <ListItem
                  button
                  key={p.USER_ID}
                  onClick={() => handleSelectMention(p.NICKNAME)}
                  sx={{
                    borderRadius: 1.5, mb: 0.5,
                    backgroundColor: idx === mentionIndex ? '#EFF6FF' : 'transparent',
                    '&:hover': { backgroundColor: 'var(--bg-default)' }
                  }}
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar
                      src={p.AVATAR ? (p.AVATAR.startsWith('http') ? p.AVATAR : `${API}${p.AVATAR}`) : undefined}
                      sx={{ width: 28, height: 28, fontSize: '0.75rem', backgroundColor: 'var(--text-primary)', fontWeight: 800 }}
                    >
                      {getInitial(p.NICKNAME)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={<Typography sx={{ fontSize: '0.85rem', fontWeight: idx === mentionIndex ? 800 : 700, color: idx === mentionIndex ? '#2563EB' : 'var(--text-primary)' }}>{p.NICKNAME}</Typography>} />
                </ListItem>
              ))}
            </List>
          );
        })()}
      </Popover>
    </>
  );
}