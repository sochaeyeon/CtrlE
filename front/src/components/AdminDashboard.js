import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Avatar, Stack, Chip, Button, IconButton,
  CircularProgress, Tooltip, Badge, Menu, MenuItem,
  Modal, Backdrop, Fade, TextField, RadioGroup, FormControlLabel,
  Radio, Alert, Snackbar,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People, Article, ChatBubble, Flag, Block,
  Tag, Category, NotificationsNone, QuestionAnswer,
  ErrorOutline, AutoAwesome, Leaderboard,
  MoreHoriz, Close, Edit, Delete, Check,
  Search, Refresh, KeyboardArrowUp,
  ChevronRight, TrendingUp, AccessTime,
  PersonOff, LockOpen, VisibilityOff, Restore,
  Terminal, Logout, Menu as MenuIcon,
} from '@mui/icons-material';

// ─── API 설정 ─────────────────────────────────────────────
const API = 'http://localhost:3010/admin'; // 백엔드 라우터 경로

// ─── 검정 계열 테마로 업데이트 ─────────────────────────────
const C = {
  bg: '#F8FAFC',
  paper: '#FFFFFF',
  border: '#E2E8F0',
  borderFocus: '#94A3B8',
  textPrimary: '#0F172A',
  textMuted: '#475569',
  textHint: '#94A3B8',
  inputBg: '#F1F5F9',
  hover: '#F1F5F9',
  accent: '#0F172A', // 파란색 -> 검정색(다크 슬레이트)으로 변경
  accentHover: '#334155', // 마우스 오버 시 약간 밝은 검정
  green: '#10B981',
  red: '#EF4444',
  orange: '#F97316',
  purple: '#8B5CF6',
  yellow: '#F59E0B',
};

// 날짜 포맷팅 함수
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ko-KR') : '-';
const fmtDT = (d) => d ? new Date(d).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-';

// ─── 공통 컴포넌트 (크기 확대 반영) ──────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE: [C.green, 'rgba(16,185,129,0.12)'],
    SUSPENDED: [C.red, 'rgba(239,68,68,0.12)'],
    WITHDRAWN: [C.textHint, 'rgba(100,116,139,0.12)'],
    HIDDEN: [C.orange, 'rgba(249,115,22,0.12)'],
    DELETED: [C.red, 'rgba(239,68,68,0.12)'],
    PENDING: [C.orange, 'rgba(249,115,22,0.12)'],
    RESOLVED: [C.green, 'rgba(16,185,129,0.12)'],
    DISMISSED: [C.textHint, 'rgba(100,116,139,0.12)'],
    ANSWERED: [C.green, 'rgba(16,185,129,0.12)'],
    CLOSED: [C.textHint, 'rgba(100,116,139,0.12)'],
    LOCAL: [C.textHint, 'rgba(100,116,139,0.1)'],
    GOOGLE: [C.red, 'rgba(239,68,68,0.1)'],
    KAKAO: [C.yellow, 'rgba(245,158,11,0.1)'],
    GITHUB: [C.textPrimary, 'rgba(241,245,249,0.1)'],
    GENERAL: [C.textHint, 'rgba(100,116,139,0.1)'],
    QUESTION: [C.accent, 'rgba(15,23,42,0.08)'],
    SHOWCASE: [C.purple, 'rgba(139,92,246,0.1)'],
    DISCUSSION: [C.green, 'rgba(16,185,129,0.1)'],
    POST: [C.accent, 'rgba(15,23,42,0.08)'],
    COMMENT: [C.purple, 'rgba(139,92,246,0.1)'],
    USER: [C.orange, 'rgba(249,115,22,0.1)'],
  };
  const [color, bg] = map[status?.toUpperCase()] || [C.textHint, 'rgba(100,116,139,0.1)'];
  return (
    <Box component="span" sx={{
      display: 'inline-block', px: '10px', py: '4px',
      borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
      color, backgroundColor: bg,
      border: `1px solid ${color}33`,
      whiteSpace: 'nowrap',
    }}>{status}</Box>
  );
};

const StatCard = ({ label, value, delta, deltaUp, accentColor, icon }) => (
  <Box sx={{
    backgroundColor: C.paper,
    border: `1px solid ${C.border}`,
    borderLeft: `4px solid ${accentColor}`,
    borderRadius: 3, p: 3,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    '&:hover': { borderColor: C.borderFocus, borderLeftColor: accentColor, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' },
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
      <Typography sx={{ fontSize: '0.85rem', color: C.textHint, fontWeight: 700, letterSpacing: '0.5px' }}>
        {label}
      </Typography>
      <Box sx={{ color: accentColor, opacity: 0.8, transform: 'scale(1.2)' }}>{icon}</Box>
    </Box>
    <Typography sx={{ fontSize: '2.4rem', fontWeight: 800, color: C.textPrimary, lineHeight: 1, mb: 1 }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </Typography>
    {delta && (
      <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: deltaUp ? C.green : C.red }}>
        {deltaUp ? '▲' : '▼'} {delta}
      </Typography>
    )}
  </Box>
);

const TableToolbar = ({ title, count, searchVal, onSearch, filterOptions, filterVal, onFilter, extraBtn, placeholder = '검색...' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.5, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 2 }}>
    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: C.textPrimary }}>
      {title} {count !== undefined && <Box component="span" sx={{ fontSize: '0.85rem', color: C.textHint, ml: 1, fontWeight: 600 }}>({count})</Box>}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
      {onSearch !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 2, px: 1.5, py: 1 }}>
          <Search sx={{ fontSize: 18, color: C.textHint }} />
          <Box component="input" value={searchVal} onChange={e => onSearch(e.target.value)}
            placeholder={placeholder}
            sx={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.9rem', color: C.textPrimary, width: 200, '&::placeholder': { color: C.textHint } }}
          />
        </Box>
      )}
      {filterOptions && (
        <Box component="select" value={filterVal} onChange={e => onFilter(e.target.value)}
          sx={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 2, px: 1.5, py: '9px', fontSize: '0.9rem', color: C.textMuted, fontWeight: 600, outline: 'none', cursor: 'pointer', appearance: 'none' }}>
          {filterOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Box>
      )}
      {extraBtn}
    </Box>
  </Box>
);

const Pagination = ({ page, total, size, onChange }) => {
  const totalPages = Math.ceil(total / size);
  const start = (page - 1) * size + 1;
  const end = Math.min(page * size, total);
  const pages = [];
  const from = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let i = from; i <= Math.min(from + 4, totalPages); i++) pages.push(i);

  if (totalPages <= 1) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderTop: `1px solid ${C.border}` }}>
      <Typography sx={{ fontSize: '0.85rem', color: C.textHint, fontWeight: 500 }}>
        {start}–{end} / 총 {total}건
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[{ label: '‹', p: page - 1, disabled: page <= 1 }, ...pages.map(p => ({ label: p, p, active: p === page })), { label: '›', p: page + 1, disabled: page >= totalPages }].map((btn, i) => (
          <Box key={i} component="button" onClick={() => !btn.disabled && onChange(btn.p)}
            disabled={btn.disabled}
            sx={{
              minWidth: '36px', height: '36px', borderRadius: 1.5, border: `1px solid ${btn.active ? C.accent : C.border}`,
              backgroundColor: btn.active ? C.accent : 'transparent',
              color: btn.active ? '#fff' : btn.disabled ? C.textHint : C.textMuted,
              fontSize: '0.9rem', fontWeight: btn.active ? 700 : 500,
              cursor: btn.disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              '&:hover:not(:disabled)': { backgroundColor: btn.active ? C.accentHover : C.hover, color: btn.active ? '#fff' : C.textPrimary },
            }}>{btn.label}</Box>
        ))}
      </Box>
    </Box>
  );
};

const TableCard = ({ children, sx }) => (
  <Box sx={{ backgroundColor: C.paper, border: `1px solid ${C.border}`, borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', ...sx }}>{children}</Box>
);

const Th = ({ children, w }) => (
  <Box component="th" sx={{ px: 3, py: 1.8, textAlign: 'left', fontSize: '0.8rem', fontWeight: 700, color: C.textHint, borderBottom: `2px solid ${C.border}`, whiteSpace: 'nowrap', width: w }}>{children}</Box>
);

const Td = ({ children, mono, primary, sx: sxProp }) => (
  <Box component="td" sx={{ px: 3, py: 2, color: primary ? C.textPrimary : C.textMuted, fontWeight: primary ? 600 : 400, fontSize: '0.95rem', borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle', ...sxProp }}>{children}</Box>
);

const ActionBtn = ({ label, color, onClick }) => (
  <Box component="button" onClick={onClick}
    sx={{
      px: '14px', py: '7px', borderRadius: 1.5,
      backgroundColor: color, // 투명도 제거
      color: '#FFFFFF',       // 글씨 흰색
      fontSize: '0.8rem', fontWeight: 800,
      cursor: 'pointer', transition: 'all 0.15s', mr: 1,
      border: 'none',
      '&:hover': { filter: 'brightness(1.1)' }, // 호버 시 살짝 밝게
    }}>{label}</Box>
);

// 확인 모달
const ConfirmModal = ({ open, title, message, confirmLabel, confirmColor = C.red, onConfirm, onClose }) => (
  <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }}
    slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' } } }}>
    <Fade in={open}>
      <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: { xs: '90vw', sm: 420 }, backgroundColor: C.paper, border: `1px solid ${C.border}`, borderRadius: 4, outline: 'none', p: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
        <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: C.textPrimary, mb: 1.5 }}>{title}</Typography>
        <Typography sx={{ fontSize: '0.95rem', color: C.textMuted, lineHeight: 1.6, mb: 4 }}>{message}</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
          <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', color: C.textMuted, px: 2.5, py: 1, border: `1px solid ${C.border}`, borderRadius: 2 }}>취소</Button>
          <Button onClick={onConfirm} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', color: '#fff', px: 3, py: 1, backgroundColor: confirmColor, borderRadius: 2, boxShadow: 'none', '&:hover': { filter: 'brightness(0.9)' } }}>{confirmLabel}</Button>
        </Box>
      </Box>
    </Fade>
  </Modal>
);

// 답변 입력 모달
const AnswerModal = ({ open, item, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  if (!item) return null;
  return (
    <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }}
      slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' } } }}>
      <Fade in={open}>
        <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: { xs: '90vw', sm: 540 }, backgroundColor: C.paper, border: `1px solid ${C.border}`, borderRadius: 4, outline: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
          <Box sx={{ px: 4, py: 3, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: C.textPrimary }}>문의 답변</Typography>
            <IconButton onClick={onClose} sx={{ color: C.textHint }}><Close sx={{ fontSize: 22 }} /></IconButton>
          </Box>
          <Box sx={{ p: 4 }}>
            <Box sx={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 2, p: 2.5, mb: 3 }}>
              <Typography sx={{ fontSize: '0.85rem', color: C.textHint, fontWeight: 600, mb: 1 }}>{item.inquiry_type || '기타'} · {item.nickname || 'USER'}</Typography>
              <Typography sx={{ fontSize: '1.05rem', color: C.textPrimary, fontWeight: 700 }}>{item.title}</Typography>
            </Box>
            <TextField multiline rows={6} fullWidth placeholder="답변 내용을 입력하세요..." value={text} onChange={e => setText(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { backgroundColor: C.inputBg, color: C.textPrimary, fontSize: '0.95rem', borderRadius: 2, '& fieldset': { borderColor: C.border }, '&:hover fieldset': { borderColor: C.borderFocus }, '&.Mui-focused fieldset': { borderColor: C.accent } } }}
            />
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button onClick={onClose} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', color: C.textMuted, px: 2.5, py: 1, border: `1px solid ${C.border}`, borderRadius: 2 }}>취소</Button>
              <Button disabled={!text.trim()} onClick={() => { onSubmit(text); onClose(); setText(''); }}
                sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', color: '#fff', px: 3, py: 1, backgroundColor: C.accent, borderRadius: 2, boxShadow: 'none', '&:hover': { backgroundColor: C.accentHover }, '&.Mui-disabled': { backgroundColor: C.inputBg, color: C.textHint } }}>
                답변 등록
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

// 대시보드
const DashboardPage = ({ data }) => {
  const activeUsers = data.users.filter(u => u.status === 'ACTIVE' || u.STATUS === 'ACTIVE').length;
  const pendingReports = (data.reports || []).filter(r => (r.status || r.STATUS) === 'PENDING').length;
  const pendingInq = data.inquiries.filter(i => i.status === 'PENDING' || i.STATUS === 'PENDING').length;

  const oauthCounts = ['LOCAL', 'GOOGLE', 'KAKAO', 'GITHUB'].map(t => ({
    label: t,
    count: data.users.filter(u => (u.oauth_type || u.OAUTH_TYPE) === t).length,
    color: t === 'LOCAL' ? C.textHint : t === 'GOOGLE' ? C.red : t === 'KAKAO' ? C.yellow : C.textPrimary,
  }));

  const postTypes = ['GENERAL', 'QUESTION', 'SHOWCASE', 'DISCUSSION'];
  const typeColors = { GENERAL: C.textHint, QUESTION: C.accent, SHOWCASE: C.purple, DISCUSSION: C.green };
  const typeCounts = postTypes.map(pt => ({
    type: pt,
    count: data.posts.filter(p => (p.post_type || p.POST_TYPE) === pt).length,
    color: typeColors[pt]
  }));
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: C.textPrimary, mb: 0.5 }}>대시보드</Typography>
        <Typography sx={{ fontSize: '0.9rem', color: C.textHint, fontWeight: 500 }}>CtrlE 플랫폼 데이터 현황</Typography>
      </Box>

      {/* 스탯 카드 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 4 }}>
        <StatCard label="전체 사용자" value={data.users.length} delta={`활성 ${activeUsers}명`} deltaUp accentColor={C.green} icon={<People sx={{ fontSize: 24 }} />} />
        <StatCard label="전체 게시글" value={data.posts.length} accentColor={C.accent} icon={<Article sx={{ fontSize: 24 }} />} />
        <StatCard label="미처리 신고" value={pendingReports} delta="확인 필요" accentColor={C.red} icon={<Flag sx={{ fontSize: 24 }} />} />
        <StatCard label="미답변 문의" value={pendingInq} accentColor={C.orange} icon={<QuestionAnswer sx={{ fontSize: 24 }} />} />
        <StatCard label="전체 댓글" value={data.comments.length} accentColor={C.purple} icon={<ChatBubble sx={{ fontSize: 24 }} />} />
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
        <TableCard>
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.textPrimary }}>회원 가입 유형</Typography>
          </Box>
          <Box sx={{ p: 2.5 }}>
            {oauthCounts.map(o => (
              <Box key={o.label} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: `1px solid ${C.border}22` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: o.color }} />
                  <Typography sx={{ fontSize: '0.95rem', color: C.textMuted, fontWeight: 600 }}>{o.label}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.95rem', color: C.textPrimary, fontWeight: 800 }}>{o.count}</Typography>
              </Box>
            ))}
          </Box>
        </TableCard>

        <TableCard>
          <Box sx={{ px: 3, py: 2.5, borderBottom: `1px solid ${C.border}` }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: C.textPrimary }}>게시글 유형 분포 (POST_TYPE)</Typography>
          </Box>
          <Box sx={{ p: 2.5 }}>
            {typeCounts.map(t => (
              <Box key={t.type} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, borderBottom: `1px solid ${C.border}22` }}>
                <Typography sx={{ fontSize: '0.85rem', color: t.color, fontWeight: 700, width: 85 }}>{t.type}</Typography>
                <Box sx={{ flex: 1, height: 8, backgroundColor: C.inputBg, borderRadius: 4, overflow: 'hidden' }}>
                  <Box sx={{ width: `${Math.round((t.count / (data.posts.length || 1)) * 100)}%`, height: '100%', backgroundColor: t.color, borderRadius: 4 }} />
                </Box>
                <Typography sx={{ fontSize: '0.85rem', color: C.textHint, fontWeight: 700, width: 30, textAlign: 'right' }}>{t.count}</Typography>
              </Box>
            ))}
          </Box>
        </TableCard>
      </Box>
    </Box>
  );
};

// 사용자 관리
const UsersPage = ({ data, onToast }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState(data.users);
  const [confirmModal, setConfirmModal] = useState(null);
  const SIZE = 12; // 목록이 커졌으므로 페이지당 표시 수를 약간 조정

  const filtered = users
    .filter(u => filter === 'ALL' || (u.status || u.STATUS) === filter)
    .filter(u => {
      const target = search.toLowerCase();
      return !search || (u.nickname || u.NICKNAME)?.toLowerCase().includes(target) || (u.email || u.EMAIL)?.toLowerCase().includes(target);
    });

  const paged = filtered.slice((page - 1) * SIZE, page * SIZE);

  const suspend = (id) => {
    setUsers(prev => prev.map(u => (u.user_id || u.USER_ID) === id ? { ...u, status: 'SUSPENDED', STATUS: 'SUSPENDED' } : u));
    onToast(`회원 정지됨`, 'warn'); setConfirmModal(null);
  };
  const unsuspend = (id) => {
    setUsers(prev => prev.map(u => (u.user_id || u.USER_ID) === id ? { ...u, status: 'ACTIVE', STATUS: 'ACTIVE' } : u));
    onToast(`회원 복구됨`, 'success');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: C.textPrimary }}>사용자 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="사용자 목록" count={filtered.length}
          searchVal={search} onSearch={v => { setSearch(v); setPage(1); }} placeholder="닉네임 / 이메일"
          filterOptions={[{ value: 'ALL', label: '전체' }, { value: 'ACTIVE', label: '활성' }, { value: 'SUSPENDED', label: '정지' }, { value: 'WITHDRAWN', label: '탈퇴' }]}
          filterVal={filter} onFilter={v => { setFilter(v); setPage(1); }}
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <Box component="tr">
                {['ID', '닉네임', '이메일', '상태', '가입유형', '공개여부', '가입일', '관리'].map(h => <Th key={h}>{h}</Th>)}
              </Box>
            </thead>
            <tbody>
              {paged.map((u, idx) => {
                const uid = u.user_id || u.USER_ID;
                const nickname = u.nickname || u.NICKNAME || 'Unknown';
                const status = u.status || u.STATUS;
                return (
                  <Box component="tr" key={uid || idx} sx={{ '&:hover': { backgroundColor: C.hover } }}>
                    <Td>#{uid}</Td>
                    <Td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 36, height: 36, fontSize: '0.9rem', fontWeight: 800, backgroundColor: C.inputBg, color: C.textPrimary }}>
                          {nickname.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: C.textPrimary, lineHeight: 1.2 }}>{nickname}</Typography>
                          {(u.bio_short || u.BIO_SHORT) && <Typography sx={{ fontSize: '0.8rem', color: C.textHint, mt: 0.3 }}>{u.bio_short || u.BIO_SHORT}</Typography>}
                        </Box>
                      </Box>
                    </Td>
                    <Td sx={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email || u.EMAIL}</Td>
                    <Td><StatusBadge status={status} /></Td>
                    <Td><StatusBadge status={u.oauth_type || u.OAUTH_TYPE} /></Td>
                    <Td><StatusBadge status={(u.is_public || u.IS_PUBLIC) === 'N' ? '비공개' : '공개'} /></Td>
                    <Td>{fmtDate(u.created_at || u.CREATED_AT)}</Td>
                    <Td>
                      {status === 'ACTIVE'
                        ? <ActionBtn label="정지" color={C.red} onClick={() => setConfirmModal({ id: uid, name: nickname })} />
                        : status === 'SUSPENDED'
                          ? <ActionBtn label="복구" color={C.green} onClick={() => unsuspend(uid)} />
                          : null}
                    </Td>
                  </Box>
                )
              })}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>

      <ConfirmModal open={!!confirmModal} title="사용자 정지" message={`${confirmModal?.name}(ID: ${confirmModal?.id}) 사용자를 정지하시겠습니까?`} confirmLabel="정지" onConfirm={() => suspend(confirmModal.id)} onClose={() => setConfirmModal(null)} />
    </Box>
  );
};

// 게시글 관리
const PostsPage = ({ data, onToast }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [posts, setPosts] = useState(data.posts);
  const [confirmModal, setConfirmModal] = useState(null);
  const SIZE = 12;

  const filtered = posts
    .filter(p => filter === 'ALL' || (p.status || p.STATUS) === filter)
    .filter(p => {
      const target = search.toLowerCase();
      return !search || (p.title || p.TITLE)?.toLowerCase().includes(target);
    });
  const paged = filtered.slice((page - 1) * SIZE, page * SIZE);

  const hide = (id) => { setPosts(prev => prev.map(p => (p.post_id || p.POST_ID) === id ? { ...p, status: 'HIDDEN', STATUS: 'HIDDEN' } : p)); onToast(`게시글 숨김 처리됨`, 'warn'); setConfirmModal(null); };
  const remove = (id) => { setPosts(prev => prev.map(p => (p.post_id || p.POST_ID) === id ? { ...p, status: 'DELETED', STATUS: 'DELETED' } : p)); onToast(`게시글 삭제됨`, 'error'); setConfirmModal(null); };
  const restore = (id) => { setPosts(prev => prev.map(p => (p.post_id || p.POST_ID) === id ? { ...p, status: 'ACTIVE', STATUS: 'ACTIVE' } : p)); onToast(`게시글 복구됨`, 'success'); };

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: C.textPrimary }}>게시글 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="게시글 목록" count={filtered.length}
          searchVal={search} onSearch={v => { setSearch(v); setPage(1); }} placeholder="제목 검색"
          filterOptions={[{ value: 'ALL', label: '전체' }, { value: 'ACTIVE', label: '활성' }, { value: 'HIDDEN', label: '숨김' }, { value: 'DELETED', label: '삭제' }]}
          filterVal={filter} onFilter={v => { setFilter(v); setPage(1); }}
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><Box component="tr">{['ID', '제목', '유형', '상태', '조회수', '작성일', '관리'].map(h => <Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map((p, idx) => {
                const pid = p.post_id || p.POST_ID;
                const status = p.status || p.STATUS;
                return (
                  <Box component="tr" key={pid || idx} sx={{ '&:hover': { backgroundColor: C.hover } }}>
                    <Td>#{pid}</Td>
                    <Td sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} primary>{p.title || p.TITLE}</Td>
                    <Td><StatusBadge status={p.post_type || p.POST_TYPE} /></Td>
                    <Td><StatusBadge status={status} /></Td>
                    <Td>{(p.view_count || p.VIEW_COUNT || 0).toLocaleString()}</Td>
                    <Td>{fmtDate(p.created_at || p.CREATED_AT)}</Td>
                    <Td>
                      {status === 'ACTIVE' && <>
                        <ActionBtn label="숨김" color={C.orange} onClick={() => setConfirmModal({ id: pid, action: 'hide' })} />
                        <ActionBtn label="삭제" color={C.red} onClick={() => setConfirmModal({ id: pid, action: 'delete' })} />
                      </>}
                      {(status === 'HIDDEN' || status === 'DELETED') && <ActionBtn label="복구" color={C.green} onClick={() => restore(pid)} />}
                    </Td>
                  </Box>
                )
              })}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>

      <ConfirmModal open={!!confirmModal}
        title={confirmModal?.action === 'delete' ? '게시글 삭제' : '게시글 숨김'}
        message={confirmModal?.action === 'delete' ? `게시글을 삭제하시겠습니까? 복구할 수 없습니다.` : `게시글을 숨기겠습니까?`}
        confirmLabel={confirmModal?.action === 'delete' ? '삭제' : '숨김'}
        confirmColor={confirmModal?.action === 'delete' ? C.red : C.orange}
        onConfirm={() => { confirmModal?.action === 'delete' ? remove(confirmModal.id) : hide(confirmModal.id); }}
        onClose={() => setConfirmModal(null)}
      />
    </Box>
  );
};

const ReportsPage = ({ data, onToast }) => {
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [reports, setReports] = useState(data.reports);
  const [detailModal, setDetailModal] = useState(null);
  const SIZE = 12;

  const filtered = reports.filter(r => filter === 'ALL' || (r.status || r.STATUS) === filter);
  const paged = filtered.slice((page - 1) * SIZE, page * SIZE);

  const resolve = (id) => { setReports(prev => prev.map(r => (r.report_id || r.REPORT_ID) === id ? { ...r, status: 'RESOLVED', STATUS: 'RESOLVED' } : r)); onToast(`처리 완료`, 'success'); setDetailModal(null); };
  const dismiss = (id) => { setReports(prev => prev.map(r => (r.report_id || r.REPORT_ID) === id ? { ...r, status: 'DISMISSED', STATUS: 'DISMISSED' } : r)); onToast(`기각 처리됨`); setDetailModal(null); };

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: C.textPrimary }}>신고 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="신고 목록" count={filtered.length}
          filterOptions={[{ value: 'ALL', label: '전체' }, { value: 'PENDING', label: '미처리' }, { value: 'RESOLVED', label: '처리됨' }, { value: 'DISMISSED', label: '기각' }]}
          filterVal={filter} onFilter={v => { setFilter(v); setPage(1); }}
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <Box component="tr">
                {['ID', '대상', '사유', '상태', '상세보기'].map(h => <Th key={h}>{h}</Th>)}
              </Box>
            </thead>
            <tbody>
              {paged.map((r, idx) => {
                const rid = r.report_id || r.REPORT_ID;
                return (
                  <Box component="tr" key={rid || idx} sx={{ '&:hover': { backgroundColor: C.hover } }}>
                    <Td>#{rid}</Td>
                    <Td>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StatusBadge status={r.target_type || r.TARGET_TYPE} />
                        <Typography sx={{ fontSize: '0.9rem', fontWeight: 700 }}>#{r.target_id || r.TARGET_ID}</Typography>
                      </Box>
                    </Td>
                    <Td primary>{r.reason || r.REASON}</Td>
                    <Td><StatusBadge status={r.status || r.STATUS} /></Td>
                    <Td>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => setDetailModal(r)}
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 800,
                          borderRadius: 2,
                          backgroundColor: C.textPrimary,
                          color: '#fff',
                          '&:hover': { backgroundColor: C.accentHover }
                        }}
                      >
                        내용 확인
                      </Button>
                    </Td>
                  </Box>
                )
              })}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>

      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} BackdropComponent={Backdrop} slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' } } }}>
        <Fade in={!!detailModal}>
          <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 500, backgroundColor: C.paper, borderRadius: 4, p: 5, boxShadow: 24 }}>
            <Typography sx={{ fontWeight: 900, fontSize: '1.3rem', mb: 3 }}>신고 상세 정보</Typography>
            <Stack spacing={3}>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', color: C.textHint, fontWeight: 700, mb: 0.5 }}>신고된 게시글/대상</Typography>
                <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: C.accent }}>{detailModal?.target_content || detailModal?.DETAIL || '대상 데이터 없음'}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', color: C.textHint, fontWeight: 700, mb: 0.5 }}>신고 사유</Typography>
                <Typography sx={{ fontSize: '1rem' }}>{detailModal?.reason || detailModal?.REASON}</Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '0.8rem', color: C.textHint, fontWeight: 700, mb: 0.5 }}>접수 일시</Typography>
                <Typography sx={{ fontSize: '1rem' }}>{fmtDT(detailModal?.created_at || detailModal?.CREATED_AT)}</Typography>
              </Box>
            </Stack>
            <Box sx={{ mt: 5, display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button onClick={() => dismiss(detailModal?.report_id || detailModal?.REPORT_ID)}
                sx={{ color: C.textMuted, fontWeight: 800, border: `1px solid ${C.border}`, px: 2 }}>기각</Button>
              <Button variant="contained" onClick={() => resolve(detailModal?.report_id || detailModal?.REPORT_ID)}
                sx={{ backgroundColor: C.green, fontWeight: 800, color: '#fff', px: 3, borderRadius: 2 }}>처리 완료</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};
// 댓글 관리
const CommentsPage = ({ data, onToast }) => {
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [comments, setComments] = useState(data.comments);
  const SIZE = 12;

  const filtered = comments.filter(c => filter === 'ALL' || (c.status || c.STATUS) === filter);
  const paged = filtered.slice((page - 1) * SIZE, page * SIZE);

  const remove = (id) => { setComments(prev => prev.map(c => (c.comment_id || c.COMMENT_ID) === id ? { ...c, status: 'DELETED', STATUS: 'DELETED' } : c)); onToast(`댓글 삭제됨`, 'error'); };
  const restore = (id) => { setComments(prev => prev.map(c => (c.comment_id || c.COMMENT_ID) === id ? { ...c, status: 'ACTIVE', STATUS: 'ACTIVE' } : c)); onToast(`댓글 복구됨`, 'success'); };

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: C.textPrimary }}>댓글 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="댓글 목록" count={filtered.length}
          filterOptions={[{ value: 'ALL', label: '전체' }, { value: 'ACTIVE', label: '활성' }, { value: 'DELETED', label: '삭제' }, { value: 'HIDDEN', label: '숨김' }]}
          filterVal={filter} onFilter={v => { setFilter(v); setPage(1); }}
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><Box component="tr">{['ID', '내용', '게시글ID', '작성자ID', '상태', '작성일', '관리'].map(h => <Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map((c, idx) => {
                const cid = c.comment_id || c.COMMENT_ID;
                const status = c.status || c.STATUS;
                return (
                  <Box component="tr" key={cid || idx} sx={{ '&:hover': { backgroundColor: C.hover } }}>
                    <Td>#{cid}</Td>
                    <Td primary sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.content || c.CONTENT}</Td>
                    <Td>P#{c.post_id || c.POST_ID}</Td>
                    <Td>U#{c.user_id || c.USER_ID}</Td>
                    <Td><StatusBadge status={status} /></Td>
                    <Td>{fmtDate(c.created_at || c.CREATED_AT)}</Td>
                    <Td>
                      {status === 'ACTIVE' && <ActionBtn label="삭제" color={C.red} onClick={() => remove(cid)} />}
                      {status !== 'ACTIVE' && <ActionBtn label="복구" color={C.green} onClick={() => restore(cid)} />}
                    </Td>
                  </Box>
                )
              })}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>
    </Box>
  );
};

// 문의 관리
const InquiriesPage = ({ data, onToast }) => {
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [inquiries, setInquiries] = useState(data.inquiries || []);
  const [answerTarget, setAnswerTarget] = useState(null);
  const SIZE = 12;

  const filtered = inquiries.filter(i => filter === 'ALL' || (i.status || i.STATUS) === filter);
  const paged = filtered.slice((page - 1) * SIZE, page * SIZE);

  const submitAnswer = (id, text) => {
    setInquiries(prev => prev.map(i => (i.inquiry_id || i.INQUIRY_ID) === id ? { ...i, status: 'ANSWERED', STATUS: 'ANSWERED' } : i));
    onToast('답변이 등록됐습니다', 'success');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: C.textPrimary }}>문의 관리</Typography>
        <Typography sx={{ fontSize: '0.9rem', color: C.textHint, mt: 0.5 }}>미답변 {inquiries.filter(i => (i.status || i.STATUS) === 'PENDING').length}건</Typography>
      </Box>
      <TableCard>
        <TableToolbar title="문의 목록" count={filtered.length}
          filterOptions={[{ value: 'ALL', label: '전체' }, { value: 'PENDING', label: '미답변' }, { value: 'ANSWERED', label: '답변완료' }, { value: 'CLOSED', label: '종료' }]}
          filterVal={filter} onFilter={v => { setFilter(v); setPage(1); }}
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><Box component="tr">{['ID', '유형', '제목', '작성자', '상태', '접수일', '처리'].map(h => <Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map((i, idx) => {
                const iid = i.inquiry_id || i.INQUIRY_ID;
                const status = i.status || i.STATUS;
                return (
                  <Box component="tr" key={iid || idx} sx={{ '&:hover': { backgroundColor: C.hover } }}>
                    <Td>#{iid}</Td>
                    <Td><StatusBadge status={i.inquiry_type || i.INQUIRY_TYPE} /></Td>
                    <Td primary sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.title || i.TITLE}</Td>
                    <Td>@{i.nickname || i.NICKNAME}</Td>
                    <Td><StatusBadge status={status} /></Td>
                    <Td>{fmtDT(i.created_at || i.CREATED_AT)}</Td>
                    <Td>
                      {status === 'PENDING'
                        ? <ActionBtn label="답변" color={C.accent} onClick={() => setAnswerTarget(i)} />
                        : <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: C.textHint }}>완료</Typography>}
                    </Td>
                  </Box>
                )
              })}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>
      <AnswerModal open={!!answerTarget} item={answerTarget} onClose={() => setAnswerTarget(null)} onSubmit={text => submitAnswer((answerTarget?.inquiry_id || answerTarget?.INQUIRY_ID), text)} />
    </Box>
  );
};

// 금지어 관리
const BadwordsPage = ({ data, onToast }) => {
  const [page, setPage] = useState(1);
  const [words, setWords] = useState(data.badwords);
  const [addModal, setAddModal] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newReplace, setNewReplace] = useState('***');
  const SIZE = 15;

  const paged = words.slice((page - 1) * SIZE, page * SIZE);

  const remove = (id) => { setWords(prev => prev.filter(w => (w.word_id || w.WORD_ID) !== id)); onToast('금지어 삭제됨', 'error'); };
  const add = () => {
    if (!newWord.trim()) return;
    setWords(prev => [{ word_id: Date.now(), banned_word: newWord.trim(), replace_word: newReplace || '***', created_at: new Date() }, ...prev]);
    setNewWord(''); setNewReplace('***'); setAddModal(false); onToast('금지어 추가됨', 'success');
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: C.textPrimary }}>금지어 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="금지어 목록" count={words.length}
          extraBtn={
            <Button variant="contained" onClick={() => setAddModal(true)}
              sx={{ px: 2.5, py: 1, borderRadius: 2, backgroundColor: C.accent, color: '#fff', fontSize: '0.9rem', fontWeight: 700, boxShadow: 'none', '&:hover': { backgroundColor: C.accentHover, boxShadow: 'none' } }}>
              + 금지어 추가
            </Button>
          }
        />
        <Box sx={{ overflowX: 'auto' }}>
          <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><Box component="tr">{['ID', '금지어', '대체어', '등록일', '관리'].map(h => <Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map((w, idx) => {
                const wid = w.word_id || w.WORD_ID;
                return (
                  <Box component="tr" key={wid || idx} sx={{ '&:hover': { backgroundColor: C.hover } }}>
                    <Td>#{wid}</Td>
                    <Td primary>{w.banned_word || w.BANNED_WORD}</Td>
                    <Td sx={{ color: C.orange, fontWeight: 700 }}>{w.replace_word || w.REPLACE_WORD}</Td>
                    <Td>{fmtDate(w.created_at || w.CREATED_AT)}</Td>
                    <Td><ActionBtn label="삭제" color={C.red} onClick={() => remove(wid)} /></Td>
                  </Box>
                )
              })}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={words.length} size={SIZE} onChange={setPage} />
      </TableCard>

      <Modal open={addModal} onClose={() => setAddModal(false)} closeAfterTransition slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' } } }}>
        <Fade in={addModal}>
          <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: { xs: '90vw', sm: 440 }, backgroundColor: C.paper, border: `1px solid ${C.border}`, borderRadius: 4, outline: 'none', p: 4, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: C.textPrimary, mb: 3 }}>금지어 추가</Typography>
            {[['금지어', 'newWord', setNewWord, newWord, '금지할 단어'], ['대체어', 'newReplace', setNewReplace, newReplace, '대체 텍스트']].map(([label, , setter, val, ph]) => (
              <Box key={label} sx={{ mb: 2.5 }}>
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: C.textMuted, mb: 1, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</Typography>
                <Box component="input" value={val} onChange={e => setter(e.target.value)} placeholder={ph}
                  sx={{ width: '100%', backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 2, px: 2, py: 1.5, fontSize: '0.95rem', color: C.textPrimary, outline: 'none', '&::placeholder': { color: C.textHint }, '&:focus': { borderColor: C.accent } }} />
              </Box>
            ))}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 2 }}>
              <Button onClick={() => setAddModal(false)} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', color: C.textMuted, px: 2.5, py: 1, border: `1px solid ${C.border}`, borderRadius: 2 }}>취소</Button>
              <Button onClick={add} disabled={!newWord.trim()} sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', color: '#fff', px: 3, py: 1, backgroundColor: C.accent, borderRadius: 2, boxShadow: 'none', '&:hover': { backgroundColor: C.accentHover }, '&.Mui-disabled': { backgroundColor: C.inputBg, color: C.textHint } }}>추가</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

// 카테고리 관리
const CategoriesPage = ({ data, onToast }) => {
  const [categories, setCategories] = useState(data.categories);
  const remove = (id) => { setCategories(prev => prev.filter(c => (c.category_id || c.CATEGORY_ID) !== id)); onToast('카테고리 삭제됨', 'error'); };

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography sx={{ fontSize: '1.4rem', fontWeight: 900, color: C.textPrimary }}>카테고리 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="카테고리 목록" count={categories.length} />
        <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><Box component="tr">{['ID', '카테고리명', '표시순서', '관리'].map(h => <Th key={h}>{h}</Th>)}</Box></thead>
          <tbody>
            {categories.map((c, idx) => {
              const cid = c.category_id || c.CATEGORY_ID;
              return (
                <Box component="tr" key={cid || idx} sx={{ '&:hover': { backgroundColor: C.hover } }}>
                  <Td>#{cid}</Td>
                  <Td primary>{c.category_name || c.CATEGORY_NAME}</Td>
                  <Td>{c.display_order || c.DISPLAY_ORDER}</Td>
                  <Td><ActionBtn label="삭제" color={C.red} onClick={() => remove(cid)} /></Td>
                </Box>
              )
            })}
          </tbody>
        </Box>
      </TableCard>
    </Box>
  );
};

// ─── 사이드바 네비게이션 ───────────────────────────────

const NAV_ITEMS = [
  { section: 'Overview', items: [{ id: 'dashboard', label: '대시보드', icon: <DashboardIcon sx={{ fontSize: 20 }} /> }] },
  {
    section: 'Users', items: [
      { id: 'users', label: '사용자 관리', icon: <People sx={{ fontSize: 20 }} />, badge: null },
    ]
  },
  {
    section: 'Content', items: [
      { id: 'posts', label: '게시글 관리', icon: <Article sx={{ fontSize: 20 }} /> },
      { id: 'comments', label: '댓글 관리', icon: <ChatBubble sx={{ fontSize: 20 }} /> },
      { id: 'categories', label: '카테고리', icon: <Category sx={{ fontSize: 20 }} /> },
    ]
  },
  {
    section: 'Moderation', items: [
      { id: 'reports', label: '신고 관리', icon: <Flag sx={{ fontSize: 20 }} />, badgeKey: 'reports' },
      { id: 'badwords', label: '금지어 관리', icon: <Block sx={{ fontSize: 20 }} /> },
    ]
  },
  {
    section: 'Support', items: [
      { id: 'inquiries', label: '문의 관리', icon: <QuestionAnswer sx={{ fontSize: 20 }} />, badgeKey: 'inquiries' },
    ]
  },
];

const Sidebar = ({ active, onNav, open, data }) => {
  const pendingReports = data.reports.filter(r => (r.status || r.STATUS) === 'PENDING').length;
  const pendingInq = data.inquiries.filter(i => (i.status || i.STATUS) === 'PENDING').length;

  const getBadge = (key) => {
    if (key === 'reports') return pendingReports;
    if (key === 'inquiries') return pendingInq;
    return 0;
  };

  return (
    <Box sx={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, // 사이드바 약간 넓게
      backgroundColor: C.paper, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', zIndex: 100,
      transform: open ? 'translateX(0)' : { xs: 'translateX(-100%)', lg: 'translateX(0)' },
      transition: 'transform 0.25s ease',
    }}>
      {/* ─── 요청하신 제공 로고 (블랙 & 좌측정렬 버전) ─── */}
      <Box sx={{ px: 3, py: 3, borderBottom: `1px solid ${C.border}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: 1.5,
            backgroundColor: '#000000',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Typography sx={{ color: '#FFFFFF', fontWeight: 900, fontSize: '1.1rem', lineHeight: 1 }}>{'<>'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography sx={{ color: '#000000', fontWeight: 900, fontSize: '1.45rem', letterSpacing: '-0.02em', lineHeight: 1 }}>
              CtrlE
            </Typography>
            <Typography sx={{ color: C.textHint, fontWeight: 800, fontSize: '0.8rem', letterSpacing: '0.5px' }}>
              ADMIN
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', py: 2, '&::-webkit-scrollbar': { display: 'none' } }}>
        {NAV_ITEMS.map(section => (
          <Box key={section.section} sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: C.textHint, px: 3, pt: 1.5, pb: 1 }}>
              {section.section}
            </Typography>
            {section.items.map(item => {
              const badge = item.badgeKey ? getBadge(item.badgeKey) : 0;
              const isActive = active === item.id;
              return (
                <Box key={item.id} onClick={() => onNav(item.id)}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: '12px', cursor: 'pointer', color: isActive ? C.accent : C.textMuted, backgroundColor: isActive ? 'rgba(15,23,42,0.06)' : 'transparent', borderLeft: isActive ? `3px solid ${C.accent}` : '3px solid transparent', transition: 'all 0.15s', '&:hover': { backgroundColor: C.hover, color: C.textPrimary } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    {item.icon}
                    <Typography sx={{ fontSize: '0.95rem', fontWeight: isActive ? 800 : 600, color: 'inherit' }}>{item.label}</Typography>
                  </Box>
                  {badge > 0 && (
                    <Box sx={{ px: '8px', py: '2px', borderRadius: '12px', backgroundColor: 'rgba(239,68,68,0.12)', color: C.red, fontSize: '0.75rem', fontWeight: 800, border: `1px solid rgba(239,68,68,0.2)` }}>
                      {badge}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      <Box sx={{ px: 3, py: 2.5, borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 36, height: 36, fontSize: '0.9rem', fontWeight: 800, backgroundColor: 'rgba(15,23,42,0.1)', color: C.accent }}>A</Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: C.textPrimary }}>관리자</Typography>
          <Typography sx={{ fontSize: '0.75rem', color: C.textHint, fontWeight: 500 }}>Super Admin</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [page, setPage] = useState('dashboard');
  const [sidebarOpen, setSO] = useState(false);
  const [toast, setToast] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };

  const [dbData, setDbData] = useState({
    users: [], posts: [], reports: [], comments: [], inquiries: [], badwords: [], categories: []
  });

  const [isLoading, setIsLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

        const [usersRes, postsRes, reportsRes, commentsRes, inquiriesRes, badwordsRes, categoriesRes] = await Promise.all([
          fetch(`${API}/users`, { headers }),
          fetch(`${API}/posts`, { headers }),
          fetch(`${API}/reports`, { headers }),
          fetch(`${API}/comments`, { headers }),
          fetch(`${API}/inquiries`, { headers }).catch(() => ({ json: () => [] })),
          fetch(`${API}/badwords`, { headers }),
          fetch(`${API}/categories`, { headers })
        ]);

        const parse = async (res) => {
          const json = await res.json();
          return Array.isArray(json) ? json : [];
        };

        setDbData({
          users: await parse(usersRes),
          posts: await parse(postsRes),
          reports: await parse(reportsRes),
          comments: await parse(commentsRes),
          inquiries: await parse(inquiriesRes),
          badwords: await parse(badwordsRes),
          categories: await parse(categoriesRes)
        });
      } catch (error) {
        console.error("데이터 조회 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const el = document.getElementById('admin-scroll');
    if (!el) return;
    const h = () => setShowTop(el.scrollTop > 400);
    el.addEventListener('scroll', h);
    return () => el.removeEventListener('scroll', h);
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const renderPage = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress sx={{ color: C.accent }} size={40} />
        </Box>
      );
    }

    const props = { data: dbData, onToast: showToast };
    switch (page) {
      case 'dashboard': return <DashboardPage {...props} />;
      case 'users': return <UsersPage {...props} />;
      case 'posts': return <PostsPage {...props} />;
      case 'comments': return <CommentsPage {...props} />;
      case 'reports': return <ReportsPage {...props} />;
      case 'inquiries': return <InquiriesPage {...props} />;
      case 'badwords': return <BadwordsPage {...props} />;
      case 'categories': return <CategoriesPage {...props} />;
      default: return <DashboardPage {...props} />;
    }
  };

  const PAGE_LABELS = { dashboard: '대시보드', users: '사용자 관리', posts: '게시글 관리', comments: '댓글 관리', reports: '신고 관리', inquiries: '문의 관리', badwords: '금지어 관리', categories: '카테고리' };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex' }}>

      <Sidebar active={page} onNav={(p) => { setPage(p); setSO(false); document.getElementById('admin-scroll')?.scrollTo({ top: 0 }); }} open={sidebarOpen} data={dbData} />

      {sidebarOpen && (
        <Box onClick={() => setSO(false)} sx={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 99, display: { lg: 'none' } }} />
      )}

      <Box id="admin-scroll" sx={{ flex: 1, ml: { xs: 0, lg: '260px' }, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', position: 'relative', zIndex: 1 }}>
        <Box sx={{
          position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'rgba(255,255,255,0.92)'
          , backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, px: 4, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setSO(o => !o)} sx={{ color: C.textMuted, display: { lg: 'none' } }}>
              <MenuIcon sx={{ fontSize: 24 }} />
            </IconButton>
            <Typography sx={{ fontSize: '0.9rem', color: C.textHint, fontWeight: 500 }}>
              admin / <Box component="span" sx={{ color: C.textPrimary, fontWeight: 800 }}>{PAGE_LABELS[page]}</Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Typography sx={{ fontSize: '0.85rem', color: C.textHint, fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              {time.toLocaleTimeString('ko-KR')}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.green, animation: 'pulse 2s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
              <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: C.textMuted, display: { xs: 'none', sm: 'block' } }}>Oracle DB</Typography>
            </Box>
            <Tooltip title="로그아웃">
              <IconButton
                onClick={handleLogout}
                sx={{ color: C.textHint, '&:hover': { color: C.red, backgroundColor: 'rgba(239,68,68,0.1)' } }}
              >
                <Logout sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ flex: 1, p: { xs: 3, md: 5 }, maxWidth: 1400, width: '100%', mx: 'auto' }}>
          {renderPage()}
        </Box>
      </Box>

      <Fade in={showTop}>
        <Box onClick={() => document.getElementById('admin-scroll')?.scrollTo({ top: 0, behavior: 'smooth' })}
          sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 999, width: 48, height: 48, borderRadius: '50%', backgroundColor: C.paper, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 8px 30px rgba(0,0,0,0.12)', '&:hover': { borderColor: C.borderFocus, transform: 'translateY(-3px)' } }}>
          <KeyboardArrowUp sx={{ fontSize: 24, color: C.textPrimary }} />
        </Box>
      </Fade>

      <Snackbar open={!!toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.type === 'error' ? 'error' : toast?.type === 'warn' ? 'warning' : 'success'} icon={toast?.type === 'error' ? undefined : <Check fontSize="inherit" />}
          sx={{ fontWeight: 700, fontSize: '0.95rem', borderRadius: 2, py: 0.5, px: 2, backgroundColor: toast?.type === 'error' ? 'rgba(239,68,68,0.15)' : toast?.type === 'warn' ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)', color: toast?.type === 'error' ? '#EF4444' : toast?.type === 'warn' ? '#EA580C' : '#059669', border: `1px solid ${toast?.type === 'error' ? 'rgba(239,68,68,0.3)' : toast?.type === 'warn' ? 'rgba(249,115,22,0.3)' : 'rgba(16,185,129,0.3)'}` }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}