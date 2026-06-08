import React, { useState, useCallback, useEffect } from 'react';
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

// ─── API ─────────────────────────────────────────────
const API = 'http://localhost:3010';

// ─── 색상 시스템 (Feed.jsx와 동일) ─────────────────────
const C = {
  bg:          '#0F1117',
  paper:       '#1A1D27',
  border:      '#2D3148',
  borderFocus: '#4B5280',
  textPrimary: '#F1F5F9',
  textMuted:   '#94A3B8',
  textHint:    '#64748B',
  inputBg:     '#22253A',
  hover:       '#22253A',
  accent:      '#2563EB',
  accentHover: '#1D4ED8',
  green:       '#10B981',
  red:         '#EF4444',
  orange:      '#F97316',
  purple:      '#8B5CF6',
  yellow:      '#F59E0B',
};

// ─── 모의 데이터 생성 ──────────────────────────────────
const rnd  = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (...arr) => arr[Math.floor(Math.random() * arr.length)];
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - rnd(0, n)); return d; };
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ko-KR') : '-';
const fmtDT   = (d) => d ? new Date(d).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-';
const fmtRel  = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  if (m < 1440) return `${Math.floor(m/60)}시간 전`;
  return `${Math.floor(m/1440)}일 전`;
};

const NICKNAMES = ['개발자김씨','코딩고수','프론트엔드장인','백엔드달인','풀스택마스터','JS최강자','파이썬도사','알고리즘천재','DB전문가','클라우드전도사','리눅스유저','VIM마스터','깃허브스타','오픈소스기여자','스택오버플로우','도커고수','쿠버네티스전문가'];
const TITLES = ['JWT 토큰 인증 구현하기','React 18 새 기능 정리','MySQL 성능 최적화','Docker 컨테이너 배포','Next.js App Router 가이드','TypeScript 제네릭 완벽 이해','Redis 캐싱 전략','GraphQL vs REST API','쿠버네티스 입문','CI/CD 파이프라인 구축','NestJS 아키텍처 설계','Prisma ORM 실전 사용법'];
const RANKS  = ['ROOKIE','BRONZE','SILVER','GOLD','PLATINUM','DIAMOND'];
const REPORT_REASONS = ['스팸/광고','혐오 발언','성인 콘텐츠','허위 정보','저작권 위반','기타'];

const makeUsers = (n) => Array.from({length: n}, (_, i) => ({
  user_id: i + 1,
  nickname: NICKNAMES[i % NICKNAMES.length] + (i > 16 ? i : ''),
  email: `user${i+1}@${pick('gmail.com','naver.com','kakao.com','outlook.com')}`,
  status: pick('ACTIVE','ACTIVE','ACTIVE','ACTIVE','SUSPENDED','WITHDRAWN'),
  is_private: pick('Y','N','N','N'),
  oauth_type: pick('LOCAL','LOCAL','LOCAL','GOOGLE','KAKAO','GITHUB'),
  created_at: daysAgo(365),
  last_active: daysAgo(7),
  post_count: rnd(0, 80),
  follower_count: rnd(0, 500),
  bio_short: pick('풀스택 개발자','백엔드 엔지니어','오픈소스 기여자',null,null),
}));

const makePosts = (n) => Array.from({length: n}, (_, i) => ({
  post_id: i + 1,
  user_id: rnd(1, 60),
  nickname: NICKNAMES[rnd(0, NICKNAMES.length-1)],
  title: TITLES[i % TITLES.length] + (i > 11 ? ` #${i}` : ''),
  post_type: pick('GENERAL','QUESTION','SHOWCASE','DISCUSSION'),
  category: pick('자유게시판','질문과답변','프론트엔드','백엔드','DevOps','알고리즘'),
  status: pick('ACTIVE','ACTIVE','ACTIVE','HIDDEN','DELETED'),
  view_count: rnd(10, 8000),
  like_count: rnd(0, 400),
  comment_count: rnd(0, 120),
  created_at: daysAgo(180),
}));

const makeReports = (n) => Array.from({length: n}, (_, i) => ({
  report_id: i + 1,
  target_type: pick('POST','COMMENT','USER'),
  target_id: rnd(1, 300),
  reporter_nickname: NICKNAMES[rnd(0, NICKNAMES.length-1)],
  reason: pick(...REPORT_REASONS),
  status: pick('PENDING','PENDING','PENDING','RESOLVED','DISMISSED'),
  created_at: daysAgo(14),
}));

const makeComments = (n) => Array.from({length: n}, (_, i) => ({
  comment_id: i + 1,
  post_id: rnd(1, 200),
  nickname: NICKNAMES[rnd(0, NICKNAMES.length-1)],
  content: pick('좋은 글 감사합니다!','도움이 많이 됐어요.','이 부분 잘못된 것 같은데요?','저도 같은 문제 겪었어요!','질문이 있습니다...','정말 유용하네요.','코드 예제 더 부탁드려요.'),
  status: pick('ACTIVE','ACTIVE','ACTIVE','DELETED','HIDDEN'),
  created_at: daysAgo(90),
  like_count: rnd(0, 60),
}));

const makeInquiries = (n) => Array.from({length: n}, (_, i) => ({
  inquiry_id: i + 1,
  user_id: rnd(1, 60),
  nickname: NICKNAMES[rnd(0, NICKNAMES.length-1)],
  inquiry_type: pick('계정문제','결제문의','버그신고','기능요청','기타'),
  title: pick('로그인이 안돼요','게시글이 삭제됐어요','알림이 오지 않아요','회원탈퇴 하고 싶어요','개인정보 삭제 요청','비밀번호 변경 문의'),
  status: pick('PENDING','PENDING','ANSWERED','CLOSED'),
  created_at: daysAgo(30),
}));

const makeBadwords = (n) => Array.from({length: n}, (_, i) => ({
  word_id: i + 1,
  banned_word: `금지어_${i+1}`,
  replace_word: pick('***','####','[삭제됨]','[차단]'),
  created_at: daysAgo(180),
}));

const makeCategories = () => [
  '자유게시판','질문과답변','프론트엔드','백엔드','DevOps','알고리즘','CS지식','프로젝트 쇼케이스',
].map((name, i) => ({ category_id: i+1, category_name: name, display_order: i+1, post_count: rnd(20, 600) }));

const makeRanks = (n) => Array.from({length: n}, (_, i) => ({
  rank_id: i+1, user_id: i+1,
  nickname: NICKNAMES[i % NICKNAMES.length],
  exp_point: rnd(0, 15000),
  current_rank: RANKS[Math.min(Math.floor(rnd(0,12)/2), 5)],
})).sort((a, b) => b.exp_point - a.exp_point);

// 전역 데이터 (실제 환경에선 API fetch로 교체)
const DB = {
  users:      makeUsers(120),
  posts:      makePosts(340),
  reports:    makeReports(28),
  comments:   makeComments(890),
  inquiries:  makeInquiries(18),
  badwords:   makeBadwords(22),
  categories: makeCategories(),
  ranks:      makeRanks(120),
};

// ─── 공통 컴포넌트 ─────────────────────────────────────

const StatusBadge = ({ status }) => {
  const map = {
    ACTIVE:    [C.green,  'rgba(16,185,129,0.12)'],
    SUSPENDED: [C.red,    'rgba(239,68,68,0.12)'],
    WITHDRAWN: [C.textHint,'rgba(100,116,139,0.12)'],
    HIDDEN:    [C.orange, 'rgba(249,115,22,0.12)'],
    DELETED:   [C.red,    'rgba(239,68,68,0.12)'],
    PENDING:   [C.orange, 'rgba(249,115,22,0.12)'],
    RESOLVED:  [C.green,  'rgba(16,185,129,0.12)'],
    DISMISSED: [C.textHint,'rgba(100,116,139,0.12)'],
    ANSWERED:  [C.green,  'rgba(16,185,129,0.12)'],
    CLOSED:    [C.textHint,'rgba(100,116,139,0.12)'],
    ROOKIE:    [C.textHint,'rgba(100,116,139,0.12)'],
    BRONZE:    [C.yellow, 'rgba(245,158,11,0.12)'],
    SILVER:    [C.textMuted,'rgba(148,163,184,0.12)'],
    GOLD:      [C.yellow, 'rgba(245,158,11,0.15)'],
    PLATINUM:  ['#06B6D4','rgba(6,182,212,0.12)'],
    DIAMOND:   [C.purple, 'rgba(139,92,246,0.15)'],
    LOCAL:     [C.textHint,'rgba(100,116,139,0.1)'],
    GOOGLE:    [C.red,    'rgba(239,68,68,0.1)'],
    KAKAO:     [C.yellow, 'rgba(245,158,11,0.1)'],
    GITHUB:    [C.textPrimary,'rgba(241,245,249,0.1)'],
    GENERAL:   [C.textHint,'rgba(100,116,139,0.1)'],
    QUESTION:  [C.accent, 'rgba(37,99,235,0.1)'],
    SHOWCASE:  [C.purple, 'rgba(139,92,246,0.1)'],
    DISCUSSION:[C.green,  'rgba(16,185,129,0.1)'],
    POST:      [C.accent, 'rgba(37,99,235,0.1)'],
    COMMENT:   [C.purple, 'rgba(139,92,246,0.1)'],
    USER:      [C.orange, 'rgba(249,115,22,0.1)'],
  };
  const [color, bg] = map[status] || [C.textHint, 'rgba(100,116,139,0.1)'];
  return (
    <Box component="span" sx={{
      display: 'inline-block', px: '8px', py: '2px',
      borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700,
      fontFamily: '"JetBrains Mono", monospace',
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
    borderLeft: `3px solid ${accentColor}`,
    borderRadius: 2, p: 2.5,
    transition: 'border-color 0.2s',
    '&:hover': { borderColor: C.borderFocus, borderLeftColor: accentColor },
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
      <Typography sx={{ fontSize: '0.72rem', fontFamily: '"JetBrains Mono", monospace', color: C.textHint, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        {label}
      </Typography>
      <Box sx={{ color: accentColor, opacity: 0.6 }}>{icon}</Box>
    </Box>
    <Typography sx={{ fontSize: '2rem', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700, color: C.textPrimary, lineHeight: 1, mb: 0.6 }}>
      {typeof value === 'number' ? value.toLocaleString() : value}
    </Typography>
    {delta && (
      <Typography sx={{ fontSize: '0.72rem', fontFamily: '"JetBrains Mono", monospace', color: deltaUp ? C.green : C.red }}>
        {deltaUp ? '▲' : '▼'} {delta}
      </Typography>
    )}
  </Box>
);

// 검색 + 필터 헤더
const TableToolbar = ({ title, count, searchVal, onSearch, filterOptions, filterVal, onFilter, extraBtn, placeholder = '검색...' }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.8, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 1 }}>
    <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: C.textPrimary }}>
      {title} {count !== undefined && <Box component="span" sx={{ fontSize: '0.72rem', color: C.textHint, fontFamily: '"JetBrains Mono", monospace', ml: 0.5 }}>({count})</Box>}
    </Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
      {onSearch !== undefined && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 1.5, px: 1.2, py: 0.6 }}>
          <Search sx={{ fontSize: 14, color: C.textHint }} />
          <Box component="input" value={searchVal} onChange={e => onSearch(e.target.value)}
            placeholder={placeholder}
            sx={{ border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '0.82rem', color: C.textPrimary, width: 160, '&::placeholder': { color: C.textHint } }}
          />
        </Box>
      )}
      {filterOptions && (
        <Box component="select" value={filterVal} onChange={e => onFilter(e.target.value)}
          sx={{ backgroundColor: C.inputBg, border: `1px solid ${C.border}`, borderRadius: 1.5, px: 1, py: '7px', fontSize: '0.82rem', color: C.textMuted, outline: 'none', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none' }}>
          {filterOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
        </Box>
      )}
      {extraBtn}
    </Box>
  </Box>
);

// 페이지네이션
const Pagination = ({ page, total, size, onChange }) => {
  const totalPages = Math.ceil(total / size);
  const start = (page - 1) * size + 1;
  const end   = Math.min(page * size, total);
  const pages = [];
  const from = Math.max(1, Math.min(page - 2, totalPages - 4));
  for (let i = from; i <= Math.min(from + 4, totalPages); i++) pages.push(i);

  if (totalPages <= 1) return null;
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, borderTop: `1px solid ${C.border}` }}>
      <Typography sx={{ fontSize: '0.72rem', fontFamily: '"JetBrains Mono", monospace', color: C.textHint }}>
        {start}–{end} / {total}건
      </Typography>
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {[{ label:'‹', p:page-1, disabled:page<=1 }, ...pages.map(p=>({ label:p, p, active:p===page })), { label:'›', p:page+1, disabled:page>=totalPages }].map((btn, i) => (
          <Box key={i} component="button" onClick={() => !btn.disabled && onChange(btn.p)}
            disabled={btn.disabled}
            sx={{
              px: '10px', py: '5px', borderRadius: 1, border: `1px solid ${btn.active ? C.accent : C.border}`,
              backgroundColor: btn.active ? 'rgba(37,99,235,0.15)' : 'transparent',
              color: btn.active ? C.accent : btn.disabled ? C.textHint : C.textMuted,
              fontSize: '0.75rem', fontFamily: '"JetBrains Mono", monospace',
              cursor: btn.disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
              '&:hover:not(:disabled)': { backgroundColor: C.hover, color: C.textPrimary },
            }}>{btn.label}</Box>
        ))}
      </Box>
    </Box>
  );
};

// 테이블 공통 래퍼
const TableCard = ({ children, sx }) => (
  <Box sx={{ backgroundColor: C.paper, border: `1px solid ${C.border}`, borderRadius: 2, overflow: 'hidden', ...sx }}>
    {children}
  </Box>
);

const Th = ({ children, w }) => (
  <Box component="th" sx={{ px: 2, py: 1.2, textAlign: 'left', fontSize: '0.68rem', fontFamily: '"JetBrains Mono", monospace', textTransform: 'uppercase', letterSpacing: '0.8px', color: C.textHint, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap', width: w }}>
    {children}
  </Box>
);

const Td = ({ children, mono, primary, sx: sxProp }) => (
  <Box component="td" sx={{ px: 2, py: 1.4, fontSize: '0.82rem', color: primary ? C.textPrimary : C.textMuted, fontFamily: mono ? '"JetBrains Mono", monospace' : 'inherit', fontSize: mono ? '0.75rem' : '0.82rem', borderBottom: `1px solid ${C.border}22`, verticalAlign: 'middle', ...sxProp }}>
    {children}
  </Box>
);

const ActionBtn = ({ label, color, onClick }) => (
  <Box component="button" onClick={onClick}
    sx={{
      px: '8px', py: '3px', borderRadius: 1, border: `1px solid ${color}33`,
      backgroundColor: `${color}12`, color, fontSize: '0.72rem', fontWeight: 700,
      cursor: 'pointer', transition: 'all 0.15s', mr: 0.5,
      '&:hover': { backgroundColor: `${color}22` },
    }}>{label}</Box>
);

// 확인 모달
const ConfirmModal = ({ open, title, message, confirmLabel, confirmColor = C.red, onConfirm, onClose }) => (
  <Modal open={open} onClose={onClose} closeAfterTransition slots={{ backdrop: Backdrop }}
    slotProps={{ backdrop: { timeout: 200, sx: { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' } } }}>
    <Fade in={open}>
      <Box sx={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:{xs:'90vw',sm:380}, backgroundColor:C.paper, border:`1px solid ${C.border}`, borderRadius:3, outline:'none', p:3 }}>
        <Typography sx={{ fontWeight:800, fontSize:'1rem', color:C.textPrimary, mb:1 }}>{title}</Typography>
        <Typography sx={{ fontSize:'0.84rem', color:C.textMuted, lineHeight:1.7, mb:3 }}>{message}</Typography>
        <Box sx={{ display:'flex', gap:1, justifyContent:'flex-end' }}>
          <Button onClick={onClose} sx={{ textTransform:'none', fontWeight:600, fontSize:'0.85rem', color:C.textMuted, px:2, border:`1px solid ${C.border}`, borderRadius:1.5 }}>취소</Button>
          <Button onClick={onConfirm} sx={{ textTransform:'none', fontWeight:700, fontSize:'0.85rem', color:'#fff', px:2.5, backgroundColor:confirmColor, borderRadius:1.5, boxShadow:'none', '&:hover':{filter:'brightness(0.9)'} }}>{confirmLabel}</Button>
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
      slotProps={{ backdrop: { timeout:200, sx:{ backgroundColor:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' } } }}>
      <Fade in={open}>
        <Box sx={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:{xs:'90vw',sm:480}, backgroundColor:C.paper, border:`1px solid ${C.border}`, borderRadius:3, outline:'none' }}>
          <Box sx={{ px:3, py:2.5, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <Typography sx={{ fontWeight:800, fontSize:'1rem', color:C.textPrimary }}>문의 답변</Typography>
            <IconButton size="small" onClick={onClose} sx={{ color:C.textHint }}><Close sx={{ fontSize:18 }} /></IconButton>
          </Box>
          <Box sx={{ p:3 }}>
            <Box sx={{ backgroundColor:C.inputBg, border:`1px solid ${C.border}`, borderRadius:1.5, p:2, mb:2.5 }}>
              <Typography sx={{ fontSize:'0.72rem', color:C.textHint, fontFamily:'"JetBrains Mono", monospace', mb:0.5 }}>{item.inquiry_type} · {item.nickname}</Typography>
              <Typography sx={{ fontSize:'0.88rem', color:C.textPrimary, fontWeight:600 }}>{item.title}</Typography>
            </Box>
            <TextField multiline rows={5} fullWidth placeholder="답변 내용을 입력하세요..." value={text} onChange={e=>setText(e.target.value)}
              sx={{ mb:2.5, '& .MuiOutlinedInput-root':{ backgroundColor:C.inputBg, color:C.textPrimary, fontSize:'0.85rem', borderRadius:1.5, '& fieldset':{ borderColor:C.border }, '&:hover fieldset':{ borderColor:C.borderFocus }, '&.Mui-focused fieldset':{ borderColor:C.accent } } }}
            />
            <Box sx={{ display:'flex', gap:1, justifyContent:'flex-end' }}>
              <Button onClick={onClose} sx={{ textTransform:'none', fontWeight:600, fontSize:'0.85rem', color:C.textMuted, px:2, border:`1px solid ${C.border}`, borderRadius:1.5 }}>취소</Button>
              <Button disabled={!text.trim()} onClick={()=>{ onSubmit(text); onClose(); setText(''); }}
                sx={{ textTransform:'none', fontWeight:700, fontSize:'0.85rem', color:'#fff', px:2.5, backgroundColor:C.accent, borderRadius:1.5, boxShadow:'none', '&:hover':{backgroundColor:C.accentHover}, '&.Mui-disabled':{ backgroundColor:C.inputBg, color:C.textHint } }}>
                답변 등록
              </Button>
            </Box>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
};

// ─── 페이지별 콘텐츠 ───────────────────────────────────

// 대시보드
const DashboardPage = ({ data }) => {
  const activeUsers    = data.users.filter(u => u.status === 'ACTIVE').length;
  const pendingReports = data.reports.filter(r => r.status === 'PENDING').length;
  const pendingInq     = data.inquiries.filter(i => i.status === 'PENDING').length;

  const last7 = Array.from({length: 7}, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    return { label: `${d.getMonth()+1}/${d.getDate()}`, count: rnd(8, 50) };
  });
  const maxBar = Math.max(...last7.map(d => d.count));

  const oauthCounts = ['LOCAL','GOOGLE','KAKAO','GITHUB'].map(t => ({
    label: t, count: data.users.filter(u => u.oauth_type === t).length,
    color: t==='LOCAL'?C.textHint:t==='GOOGLE'?C.red:t==='KAKAO'?C.yellow:C.textPrimary,
  }));

  const rankColors = { ROOKIE:C.textHint, BRONZE:C.yellow, SILVER:C.textMuted, GOLD:C.yellow, PLATINUM:'#06B6D4', DIAMOND:C.purple };
  const rankCounts = RANKS.map(r => ({ rank:r, count: data.ranks.filter(x=>x.current_rank===r).length, color: rankColors[r] }));

  const activity = [
    { color:C.green,  text:'개발자김씨님이 새 게시글을 작성했습니다',      time:'방금 전' },
    { color:C.red,    text:'게시글 #284에 신고가 접수됐습니다',            time:'3분 전' },
    { color:C.accent, text:'코딩고수님이 회원가입했습니다',                time:'12분 전' },
    { color:C.orange, text:'문의 #14에 새 문의가 접수됐습니다',            time:'28분 전' },
    { color:C.purple, text:'백엔드달인님의 랭크가 GOLD로 승급했습니다',    time:'1시간 전' },
    { color:C.green,  text:'게시글 #301이 조회수 1,000을 달성했습니다',   time:'2시간 전' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary, mb:0.4 }}>대시보드</Typography>
        <Typography sx={{ fontSize:'0.78rem', color:C.textHint, fontFamily:'"JetBrains Mono", monospace' }}>CtrlE 플랫폼 현황 요약</Typography>
      </Box>

      {/* 스탯 카드 */}
      <Box sx={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(165px, 1fr))', gap:1.5, mb:3 }}>
        <StatCard label="전체 사용자" value={data.users.length} delta={`활성 ${activeUsers}명`} deltaUp accentColor={C.green} icon={<People sx={{fontSize:18}}/>} />
        <StatCard label="전체 게시글" value={data.posts.length} delta={`오늘 ${rnd(5,20)}건`} deltaUp accentColor={C.accent} icon={<Article sx={{fontSize:18}}/>} />
        <StatCard label="미처리 신고" value={pendingReports} delta="즉시 처리 필요" accentColor={C.red} icon={<Flag sx={{fontSize:18}}/>} />
        <StatCard label="미답변 문의" value={pendingInq} delta={`오늘 ${rnd(1,5)}건`} accentColor={C.orange} icon={<QuestionAnswer sx={{fontSize:18}}/>} />
        <StatCard label="전체 댓글" value={data.comments.length} delta={`오늘 ${rnd(20,80)}건`} deltaUp accentColor={C.purple} icon={<ChatBubble sx={{fontSize:18}}/>} />
      </Box>

      {/* 차트 + 활동 */}
      <Box sx={{ display:'grid', gridTemplateColumns:{xs:'1fr', md:'1fr 1fr'}, gap:2, mb:2 }}>
        {/* 바 차트 */}
        <TableCard>
          <Box sx={{ px:2.5, py:2, borderBottom:`1px solid ${C.border}` }}>
            <Typography sx={{ fontWeight:700, fontSize:'0.88rem', color:C.textPrimary }}>최근 7일 게시글</Typography>
          </Box>
          <Box sx={{ p:2.5 }}>
            <Box sx={{ display:'flex', alignItems:'flex-end', gap:'6px', height:110 }}>
              {last7.map(d => (
                <Box key={d.label} sx={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px', height:'100%', justifyContent:'flex-end' }}>
                  <Tooltip title={`${d.count}건`}>
                    <Box sx={{ width:'100%', borderRadius:'3px 3px 0 0', backgroundColor:'rgba(37,99,235,0.2)', border:`1px solid rgba(37,99,235,0.25)`, height:`${Math.round((d.count/maxBar)*100)}%`, minHeight:4, transition:'all 0.3s', '&:hover':{ backgroundColor:'rgba(37,99,235,0.4)' } }} />
                  </Tooltip>
                  <Typography sx={{ fontSize:'0.62rem', fontFamily:'"JetBrains Mono", monospace', color:C.textHint }}>{d.label}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </TableCard>

        {/* 실시간 로그 */}
        <TableCard>
          <Box sx={{ px:2.5, py:2, borderBottom:`1px solid ${C.border}` }}>
            <Typography sx={{ fontWeight:700, fontSize:'0.88rem', color:C.textPrimary }}>실시간 활동 로그</Typography>
          </Box>
          <Box>
            {activity.map((a, i) => (
              <Box key={i} sx={{ display:'flex', alignItems:'flex-start', gap:1.5, px:2.5, py:1.5, borderBottom:`1px solid ${C.border}22`, '&:last-child':{borderBottom:'none'}, transition:'background 0.1s', '&:hover':{backgroundColor:C.hover} }}>
                <Box sx={{ width:7, height:7, borderRadius:'50%', backgroundColor:a.color, mt:'5px', flexShrink:0 }} />
                <Box>
                  <Typography sx={{ fontSize:'0.8rem', color:C.textMuted, lineHeight:1.5 }}>{a.text}</Typography>
                  <Typography sx={{ fontSize:'0.68rem', color:C.textHint, fontFamily:'"JetBrains Mono", monospace', mt:0.2 }}>{a.time}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </TableCard>
      </Box>

      {/* 가입유형 + 랭크 분포 */}
      <Box sx={{ display:'grid', gridTemplateColumns:{xs:'1fr', md:'1fr 1fr'}, gap:2 }}>
        <TableCard>
          <Box sx={{ px:2.5, py:2, borderBottom:`1px solid ${C.border}` }}>
            <Typography sx={{ fontWeight:700, fontSize:'0.88rem', color:C.textPrimary }}>회원 가입 유형</Typography>
          </Box>
          <Box sx={{ p:2 }}>
            {oauthCounts.map(o => (
              <Box key={o.label} sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', py:1, borderBottom:`1px solid ${C.border}22` }}>
                <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                  <Box sx={{ width:7, height:7, borderRadius:'50%', backgroundColor:o.color }} />
                  <Typography sx={{ fontSize:'0.82rem', color:C.textMuted }}>{o.label}</Typography>
                </Box>
                <Typography sx={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'0.82rem', color:C.textPrimary }}>{o.count}</Typography>
              </Box>
            ))}
          </Box>
        </TableCard>
        <TableCard>
          <Box sx={{ px:2.5, py:2, borderBottom:`1px solid ${C.border}` }}>
            <Typography sx={{ fontWeight:700, fontSize:'0.88rem', color:C.textPrimary }}>랭크 분포</Typography>
          </Box>
          <Box sx={{ p:2 }}>
            {rankCounts.map(r => (
              <Box key={r.rank} sx={{ display:'flex', alignItems:'center', gap:1.5, py:0.9, borderBottom:`1px solid ${C.border}22` }}>
                <Typography sx={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'0.7rem', color:r.color, width:70 }}>{r.rank}</Typography>
                <Box sx={{ flex:1, height:5, backgroundColor:C.inputBg, borderRadius:3, overflow:'hidden' }}>
                  <Box sx={{ width:`${Math.round((r.count/data.ranks.length)*100)}%`, height:'100%', backgroundColor:r.color, borderRadius:3 }} />
                </Box>
                <Typography sx={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'0.7rem', color:C.textHint, width:20, textAlign:'right' }}>{r.count}</Typography>
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
  const [page,   setPage]   = useState(1);
  const [users,  setUsers]  = useState(data.users);
  const [confirmModal, setConfirmModal] = useState(null);
  const SIZE = 15;

  const filtered = users
    .filter(u => filter === 'ALL' || u.status === filter)
    .filter(u => !search || u.nickname.includes(search) || u.email.includes(search));

  const paged = filtered.slice((page-1)*SIZE, page*SIZE);

  const suspend  = (id) => { setUsers(prev => prev.map(u => u.user_id===id ? {...u, status:'SUSPENDED'} : u)); onToast(`U#${id} 정지됨`, 'warn'); setConfirmModal(null); };
  const unsuspend= (id) => { setUsers(prev => prev.map(u => u.user_id===id ? {...u, status:'ACTIVE'} : u)); onToast(`U#${id} 복구됨`, 'success'); };

  return (
    <Box>
      <Box sx={{ mb:2.5 }}><Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary }}>사용자 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="사용자 목록" count={filtered.length}
          searchVal={search} onSearch={v=>{setSearch(v);setPage(1);}} placeholder="닉네임 / 이메일"
          filterOptions={[{value:'ALL',label:'전체'},{value:'ACTIVE',label:'활성'},{value:'SUSPENDED',label:'정지'},{value:'WITHDRAWN',label:'탈퇴'}]}
          filterVal={filter} onFilter={v=>{setFilter(v);setPage(1);}}
        />
        <Box sx={{ overflowX:'auto' }}>
          <Box component="table" sx={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <Box component="tr">
                {['ID','닉네임','이메일','상태','가입유형','공개','게시글','가입일','관리'].map(h => <Th key={h}>{h}</Th>)}
              </Box>
            </thead>
            <tbody>
              {paged.map(u => (
                <Box component="tr" key={u.user_id} sx={{ '&:hover':{ backgroundColor:C.hover } }}>
                  <Td mono>#{u.user_id}</Td>
                  <Td>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
                      <Avatar sx={{ width:26, height:26, fontSize:'0.7rem', fontWeight:800, backgroundColor:C.inputBg, color:C.textPrimary }}>
                        {u.nickname.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize:'0.82rem', fontWeight:700, color:C.textPrimary, lineHeight:1.2 }}>{u.nickname}</Typography>
                        {u.bio_short && <Typography sx={{ fontSize:'0.68rem', color:C.textHint }}>{u.bio_short}</Typography>}
                      </Box>
                    </Box>
                  </Td>
                  <Td mono sx={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</Td>
                  <Td><StatusBadge status={u.status} /></Td>
                  <Td><StatusBadge status={u.oauth_type} /></Td>
                  <Td><StatusBadge status={u.is_private==='Y'?'비공개':'공개'} /></Td>
                  <Td mono>{u.post_count}</Td>
                  <Td mono>{fmtDate(u.created_at)}</Td>
                  <Td>
                    {u.status === 'ACTIVE'
                      ? <ActionBtn label="정지" color={C.red} onClick={() => setConfirmModal({ id:u.user_id, name:u.nickname })} />
                      : u.status === 'SUSPENDED'
                        ? <ActionBtn label="복구" color={C.green} onClick={() => unsuspend(u.user_id)} />
                        : null}
                  </Td>
                </Box>
              ))}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>

      <ConfirmModal open={!!confirmModal} title="사용자 정지" message={`${confirmModal?.name}(U#${confirmModal?.id}) 사용자를 정지하시겠습니까?`} confirmLabel="정지" onConfirm={() => suspend(confirmModal.id)} onClose={() => setConfirmModal(null)} />
    </Box>
  );
};

// 게시글 관리
const PostsPage = ({ data, onToast }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [page,   setPage]   = useState(1);
  const [posts,  setPosts]  = useState(data.posts);
  const [confirmModal, setConfirmModal] = useState(null);
  const SIZE = 15;

  const filtered = posts
    .filter(p => filter === 'ALL' || p.status === filter)
    .filter(p => !search || p.title.includes(search) || p.nickname.includes(search));
  const paged = filtered.slice((page-1)*SIZE, page*SIZE);

  const hide    = (id) => { setPosts(prev => prev.map(p => p.post_id===id ? {...p, status:'HIDDEN'} : p)); onToast(`P#${id} 숨김 처리됨`, 'warn'); setConfirmModal(null); };
  const remove  = (id) => { setPosts(prev => prev.map(p => p.post_id===id ? {...p, status:'DELETED'} : p)); onToast(`P#${id} 삭제됨`, 'error'); setConfirmModal(null); };
  const restore = (id) => { setPosts(prev => prev.map(p => p.post_id===id ? {...p, status:'ACTIVE'} : p)); onToast(`P#${id} 복구됨`, 'success'); };

  return (
    <Box>
      <Box sx={{ mb:2.5 }}><Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary }}>게시글 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="게시글 목록" count={filtered.length}
          searchVal={search} onSearch={v=>{setSearch(v);setPage(1);}} placeholder="제목 / 작성자"
          filterOptions={[{value:'ALL',label:'전체'},{value:'ACTIVE',label:'활성'},{value:'HIDDEN',label:'숨김'},{value:'DELETED',label:'삭제'}]}
          filterVal={filter} onFilter={v=>{setFilter(v);setPage(1);}}
        />
        <Box sx={{ overflowX:'auto' }}>
          <Box component="table" sx={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><Box component="tr">{['ID','제목','작성자','유형','카테고리','상태','조회','좋아요','작성일','관리'].map(h=><Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map(p => (
                <Box component="tr" key={p.post_id} sx={{ '&:hover':{ backgroundColor:C.hover } }}>
                  <Td mono>#{p.post_id}</Td>
                  <Td sx={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} primary>{p.title}</Td>
                  <Td mono>@{p.nickname}</Td>
                  <Td><StatusBadge status={p.post_type} /></Td>
                  <Td><Typography sx={{ fontSize:'0.75rem', color:C.textMuted }}>{p.category}</Typography></Td>
                  <Td><StatusBadge status={p.status} /></Td>
                  <Td mono>{p.view_count.toLocaleString()}</Td>
                  <Td mono>{p.like_count}</Td>
                  <Td mono>{fmtDate(p.created_at)}</Td>
                  <Td>
                    {p.status === 'ACTIVE' && <>
                      <ActionBtn label="숨김" color={C.orange} onClick={() => setConfirmModal({ id:p.post_id, action:'hide' })} />
                      <ActionBtn label="삭제" color={C.red} onClick={() => setConfirmModal({ id:p.post_id, action:'delete' })} />
                    </>}
                    {(p.status==='HIDDEN'||p.status==='DELETED') && <ActionBtn label="복구" color={C.green} onClick={() => restore(p.post_id)} />}
                  </Td>
                </Box>
              ))}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>

      <ConfirmModal open={!!confirmModal}
        title={confirmModal?.action==='delete' ? '게시글 삭제' : '게시글 숨김'}
        message={confirmModal?.action==='delete' ? `P#${confirmModal?.id}을 삭제하시겠습니까? 복구할 수 없습니다.` : `P#${confirmModal?.id}을 숨기겠습니까?`}
        confirmLabel={confirmModal?.action==='delete' ? '삭제' : '숨김'}
        confirmColor={confirmModal?.action==='delete' ? C.red : C.orange}
        onConfirm={() => { confirmModal?.action==='delete' ? remove(confirmModal.id) : hide(confirmModal.id); }}
        onClose={() => setConfirmModal(null)}
      />
    </Box>
  );
};

// 신고 관리
const ReportsPage = ({ data, onToast }) => {
  const [filter, setFilter] = useState('ALL');
  const [page,   setPage]   = useState(1);
  const [reports, setReports] = useState(data.reports);
  const SIZE = 15;

  const filtered = reports.filter(r => filter==='ALL' || r.status===filter).sort((a,b)=>b.created_at-a.created_at);
  const paged = filtered.slice((page-1)*SIZE, page*SIZE);

  const resolve = (id) => { setReports(prev=>prev.map(r=>r.report_id===id?{...r,status:'RESOLVED'}:r)); onToast(`신고 #${id} 처리됨`,'success'); };
  const dismiss = (id) => { setReports(prev=>prev.map(r=>r.report_id===id?{...r,status:'DISMISSED'}:r)); onToast(`신고 #${id} 기각됨`); };

  return (
    <Box>
      <Box sx={{ mb:2.5 }}>
        <Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary }}>신고 관리</Typography>
        <Typography sx={{ fontSize:'0.78rem', color:C.textHint, fontFamily:'"JetBrains Mono", monospace' }}>
          미처리 {reports.filter(r=>r.status==='PENDING').length}건
        </Typography>
      </Box>
      <TableCard>
        <TableToolbar title="신고 목록" count={filtered.length}
          filterOptions={[{value:'ALL',label:'전체'},{value:'PENDING',label:'미처리'},{value:'RESOLVED',label:'처리됨'},{value:'DISMISSED',label:'기각'}]}
          filterVal={filter} onFilter={v=>{setFilter(v);setPage(1);}}
        />
        <Box sx={{ overflowX:'auto' }}>
          <Box component="table" sx={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><Box component="tr">{['ID','대상유형','대상ID','신고자','사유','상태','접수일','처리'].map(h=><Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map(r => (
                <Box component="tr" key={r.report_id} sx={{ '&:hover':{backgroundColor:C.hover} }}>
                  <Td mono>#{r.report_id}</Td>
                  <Td><StatusBadge status={r.target_type} /></Td>
                  <Td mono>#{r.target_id}</Td>
                  <Td mono>@{r.reporter_nickname}</Td>
                  <Td primary>{r.reason}</Td>
                  <Td><StatusBadge status={r.status} /></Td>
                  <Td mono>{fmtDT(r.created_at)}</Td>
                  <Td>
                    {r.status==='PENDING' && <>
                      <ActionBtn label="처리" color={C.green} onClick={()=>resolve(r.report_id)} />
                      <ActionBtn label="기각" color={C.textHint} onClick={()=>dismiss(r.report_id)} />
                    </>}
                    {r.status!=='PENDING' && <Typography sx={{ fontSize:'0.72rem', color:C.textHint }}>완료</Typography>}
                  </Td>
                </Box>
              ))}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>
    </Box>
  );
};

// 댓글 관리
const CommentsPage = ({ data, onToast }) => {
  const [filter, setFilter] = useState('ALL');
  const [page,   setPage]   = useState(1);
  const [comments, setComments] = useState(data.comments);
  const SIZE = 15;

  const filtered = comments.filter(c => filter==='ALL' || c.status===filter);
  const paged = filtered.slice((page-1)*SIZE, page*SIZE);

  const remove  = (id) => { setComments(prev=>prev.map(c=>c.comment_id===id?{...c,status:'DELETED'}:c)); onToast(`댓글 #${id} 삭제됨`,'error'); };
  const restore = (id) => { setComments(prev=>prev.map(c=>c.comment_id===id?{...c,status:'ACTIVE'}:c)); onToast(`댓글 #${id} 복구됨`,'success'); };

  return (
    <Box>
      <Box sx={{ mb:2.5 }}><Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary }}>댓글 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="댓글 목록" count={filtered.length}
          filterOptions={[{value:'ALL',label:'전체'},{value:'ACTIVE',label:'활성'},{value:'DELETED',label:'삭제'},{value:'HIDDEN',label:'숨김'}]}
          filterVal={filter} onFilter={v=>{setFilter(v);setPage(1);}}
        />
        <Box sx={{ overflowX:'auto' }}>
          <Box component="table" sx={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><Box component="tr">{['ID','내용','게시글ID','작성자','상태','좋아요','작성일','관리'].map(h=><Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map(c => (
                <Box component="tr" key={c.comment_id} sx={{ '&:hover':{backgroundColor:C.hover} }}>
                  <Td mono>#{c.comment_id}</Td>
                  <Td primary sx={{ maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.content}</Td>
                  <Td mono>P#{c.post_id}</Td>
                  <Td mono>@{c.nickname}</Td>
                  <Td><StatusBadge status={c.status} /></Td>
                  <Td mono>{c.like_count}</Td>
                  <Td mono>{fmtDate(c.created_at)}</Td>
                  <Td>
                    {c.status==='ACTIVE' && <ActionBtn label="삭제" color={C.red} onClick={()=>remove(c.comment_id)} />}
                    {c.status!=='ACTIVE' && <ActionBtn label="복구" color={C.green} onClick={()=>restore(c.comment_id)} />}
                  </Td>
                </Box>
              ))}
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
  const [page,   setPage]   = useState(1);
  const [inquiries, setInquiries] = useState(data.inquiries);
  const [answerTarget, setAnswerTarget] = useState(null);
  const SIZE = 15;

  const filtered = inquiries.filter(i => filter==='ALL' || i.status===filter);
  const paged = filtered.slice((page-1)*SIZE, page*SIZE);

  const submitAnswer = (id, text) => {
    setInquiries(prev=>prev.map(i=>i.inquiry_id===id ? {...i, status:'ANSWERED'} : i));
    onToast('답변이 등록됐습니다', 'success');
  };

  return (
    <Box>
      <Box sx={{ mb:2.5 }}>
        <Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary }}>문의 관리</Typography>
        <Typography sx={{ fontSize:'0.78rem', color:C.textHint, fontFamily:'"JetBrains Mono", monospace' }}>미답변 {inquiries.filter(i=>i.status==='PENDING').length}건</Typography>
      </Box>
      <TableCard>
        <TableToolbar title="문의 목록" count={filtered.length}
          filterOptions={[{value:'ALL',label:'전체'},{value:'PENDING',label:'미답변'},{value:'ANSWERED',label:'답변완료'},{value:'CLOSED',label:'종료'}]}
          filterVal={filter} onFilter={v=>{setFilter(v);setPage(1);}}
        />
        <Box sx={{ overflowX:'auto' }}>
          <Box component="table" sx={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><Box component="tr">{['ID','유형','제목','작성자','상태','접수일','처리'].map(h=><Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map(i => (
                <Box component="tr" key={i.inquiry_id} sx={{ '&:hover':{backgroundColor:C.hover} }}>
                  <Td mono>#{i.inquiry_id}</Td>
                  <Td><StatusBadge status={i.inquiry_type} /></Td>
                  <Td primary sx={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{i.title}</Td>
                  <Td mono>@{i.nickname}</Td>
                  <Td><StatusBadge status={i.status} /></Td>
                  <Td mono>{fmtDT(i.created_at)}</Td>
                  <Td>
                    {i.status==='PENDING'
                      ? <ActionBtn label="답변" color={C.accent} onClick={()=>setAnswerTarget(i)} />
                      : <Typography sx={{ fontSize:'0.72rem', color:C.textHint }}>완료</Typography>}
                  </Td>
                </Box>
              ))}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={filtered.length} size={SIZE} onChange={setPage} />
      </TableCard>
      <AnswerModal open={!!answerTarget} item={answerTarget} onClose={()=>setAnswerTarget(null)} onSubmit={text=>submitAnswer(answerTarget.inquiry_id, text)} />
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
  const SIZE = 20;
  const paged = words.slice((page-1)*SIZE, page*SIZE);

  const remove = (id) => { setWords(prev=>prev.filter(w=>w.word_id!==id)); onToast('금지어 삭제됨','error'); };
  const add = () => {
    if (!newWord.trim()) return;
    setWords(prev=>[...prev, { word_id:Date.now(), banned_word:newWord.trim(), replace_word:newReplace||'***', created_at:new Date() }]);
    setNewWord(''); setNewReplace('***'); setAddModal(false); onToast('금지어 추가됨','success');
  };

  return (
    <Box>
      <Box sx={{ mb:2.5 }}><Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary }}>금지어 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="금지어 목록" count={words.length}
          extraBtn={
            <Box component="button" onClick={()=>setAddModal(true)}
              sx={{ px:'12px', py:'7px', borderRadius:1.5, border:`1px solid rgba(37,99,235,0.3)`, backgroundColor:'rgba(37,99,235,0.12)', color:C.accent, fontSize:'0.8rem', fontWeight:700, cursor:'pointer', transition:'all 0.15s', '&:hover':{backgroundColor:'rgba(37,99,235,0.2)'} }}>
              + 추가
            </Box>
          }
        />
        <Box sx={{ overflowX:'auto' }}>
          <Box component="table" sx={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><Box component="tr">{['ID','금지어','대체어','등록일','관리'].map(h=><Th key={h}>{h}</Th>)}</Box></thead>
            <tbody>
              {paged.map(w => (
                <Box component="tr" key={w.word_id} sx={{ '&:hover':{backgroundColor:C.hover} }}>
                  <Td mono>#{w.word_id}</Td>
                  <Td primary mono>{w.banned_word}</Td>
                  <Td mono sx={{ color:C.orange }}>{w.replace_word}</Td>
                  <Td mono>{fmtDate(w.created_at)}</Td>
                  <Td><ActionBtn label="삭제" color={C.red} onClick={()=>remove(w.word_id)} /></Td>
                </Box>
              ))}
            </tbody>
          </Box>
        </Box>
        <Pagination page={page} total={words.length} size={SIZE} onChange={setPage} />
      </TableCard>

      <Modal open={addModal} onClose={()=>setAddModal(false)} closeAfterTransition slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop:{ timeout:200, sx:{ backgroundColor:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' } } }}>
        <Fade in={addModal}>
          <Box sx={{ position:'fixed', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:{xs:'90vw',sm:400}, backgroundColor:C.paper, border:`1px solid ${C.border}`, borderRadius:3, outline:'none', p:3 }}>
            <Typography sx={{ fontWeight:800, fontSize:'1rem', color:C.textPrimary, mb:2.5 }}>금지어 추가</Typography>
            {[['금지어','newWord',setNewWord,newWord,'금지할 단어'],['대체어','newReplace',setNewReplace,newReplace,'대체 텍스트']].map(([label,,setter,val,ph])=>(
              <Box key={label} sx={{ mb:2 }}>
                <Typography sx={{ fontSize:'0.72rem', fontFamily:'"JetBrains Mono", monospace', color:C.textMuted, mb:0.8, textTransform:'uppercase', letterSpacing:'0.7px' }}>{label}</Typography>
                <Box component="input" value={val} onChange={e=>setter(e.target.value)} placeholder={ph}
                  sx={{ width:'100%', backgroundColor:C.inputBg, border:`1px solid ${C.border}`, borderRadius:1.5, px:'12px', py:'9px', fontSize:'0.85rem', color:C.textPrimary, outline:'none', fontFamily:'"JetBrains Mono", monospace', '&::placeholder':{color:C.textHint}, '&:focus':{borderColor:C.accent} }} />
              </Box>
            ))}
            <Box sx={{ display:'flex', gap:1, justifyContent:'flex-end', mt:1 }}>
              <Button onClick={()=>setAddModal(false)} sx={{ textTransform:'none', fontWeight:600, fontSize:'0.85rem', color:C.textMuted, px:2, border:`1px solid ${C.border}`, borderRadius:1.5 }}>취소</Button>
              <Button onClick={add} disabled={!newWord.trim()} sx={{ textTransform:'none', fontWeight:700, fontSize:'0.85rem', color:'#fff', px:2.5, backgroundColor:C.accent, borderRadius:1.5, boxShadow:'none', '&:hover':{backgroundColor:C.accentHover}, '&.Mui-disabled':{backgroundColor:C.inputBg, color:C.textHint} }}>추가</Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

// 카테고리
const CategoriesPage = ({ data, onToast }) => {
  const [categories, setCategories] = useState(data.categories);

  const remove = (id) => { setCategories(prev=>prev.filter(c=>c.category_id!==id)); onToast('카테고리 삭제됨','error'); };

  return (
    <Box>
      <Box sx={{ mb:2.5 }}><Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary }}>카테고리 관리</Typography></Box>
      <TableCard>
        <TableToolbar title="카테고리 목록" count={categories.length} />
        <Box component="table" sx={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><Box component="tr">{['ID','카테고리명','표시순서','게시글수','관리'].map(h=><Th key={h}>{h}</Th>)}</Box></thead>
          <tbody>
            {categories.map(c=>(
              <Box component="tr" key={c.category_id} sx={{ '&:hover':{backgroundColor:C.hover} }}>
                <Td mono>#{c.category_id}</Td>
                <Td primary>{c.category_name}</Td>
                <Td mono>{c.display_order}</Td>
                <Td mono>{c.post_count.toLocaleString()}</Td>
                <Td><ActionBtn label="삭제" color={C.red} onClick={()=>remove(c.category_id)} /></Td>
              </Box>
            ))}
          </tbody>
        </Box>
      </TableCard>
    </Box>
  );
};

// 랭크
const RanksPage = ({ data }) => {
  const [page, setPage] = useState(1);
  const SIZE = 20;
  const paged = data.ranks.slice((page-1)*SIZE, page*SIZE);
  return (
    <Box>
      <Box sx={{ mb:2.5 }}><Typography sx={{ fontSize:'1.15rem', fontWeight:800, color:C.textPrimary }}>랭크 / 경험치</Typography></Box>
      <TableCard>
        <TableToolbar title="랭크 목록" count={data.ranks.length} />
        <Box component="table" sx={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><Box component="tr">{['순위','닉네임','경험치','현재 랭크'].map(h=><Th key={h}>{h}</Th>)}</Box></thead>
          <tbody>
            {paged.map((r, i)=>(
              <Box component="tr" key={r.rank_id} sx={{ '&:hover':{backgroundColor:C.hover} }}>
                <Td mono sx={{ color:(page-1)*SIZE+i<3?C.yellow:C.textHint }}>#{(page-1)*SIZE+i+1}</Td>
                <Td primary>{r.nickname}</Td>
                <Td mono>{r.exp_point.toLocaleString()} EXP</Td>
                <Td><StatusBadge status={r.current_rank} /></Td>
              </Box>
            ))}
          </tbody>
        </Box>
        <Pagination page={page} total={data.ranks.length} size={SIZE} onChange={setPage} />
      </TableCard>
    </Box>
  );
};

// ─── 사이드바 네비게이션 ───────────────────────────────

const NAV_ITEMS = [
  { section: 'Overview', items: [{ id:'dashboard', label:'대시보드', icon:<DashboardIcon sx={{fontSize:16}}/> }] },
  { section: 'Users', items: [
    { id:'users',    label:'사용자 관리', icon:<People sx={{fontSize:16}}/>,    badge: null },
    { id:'ranks',    label:'랭크 / 경험치', icon:<Leaderboard sx={{fontSize:16}}/> },
  ]},
  { section: 'Content', items: [
    { id:'posts',      label:'게시글 관리', icon:<Article sx={{fontSize:16}}/> },
    { id:'comments',   label:'댓글 관리',   icon:<ChatBubble sx={{fontSize:16}}/> },
    { id:'categories', label:'카테고리',    icon:<Category sx={{fontSize:16}}/> },
  ]},
  { section: 'Moderation', items: [
    { id:'reports',  label:'신고 관리', icon:<Flag sx={{fontSize:16}}/>,  badgeKey:'reports' },
    { id:'badwords', label:'금지어 관리', icon:<Block sx={{fontSize:16}}/> },
  ]},
  { section: 'Support', items: [
    { id:'inquiries', label:'문의 관리', icon:<QuestionAnswer sx={{fontSize:16}}/>, badgeKey:'inquiries' },
  ]},
];

const Sidebar = ({ active, onNav, open, data }) => {
  const pendingReports  = data.reports.filter(r=>r.status==='PENDING').length;
  const pendingInq      = data.inquiries.filter(i=>i.status==='PENDING').length;

  const getBadge = (key) => {
    if (key==='reports')   return pendingReports;
    if (key==='inquiries') return pendingInq;
    return 0;
  };

  return (
    <Box sx={{
      position: 'fixed', top:0, left:0, bottom:0, width:220,
      backgroundColor: C.paper, borderRight:`1px solid ${C.border}`,
      display:'flex', flexDirection:'column', zIndex:100,
      transform: open ? 'translateX(0)' : { xs:'translateX(-100%)', lg:'translateX(0)' },
      transition: 'transform 0.25s ease',
    }}>
      {/* 로고 */}
      <Box sx={{ px:2.5, py:2.5, borderBottom:`1px solid ${C.border}` }}>
        <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
          <Terminal sx={{ fontSize:20, color:C.accent }} />
          <Box>
            <Typography sx={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'0.95rem', fontWeight:700, color:C.textPrimary, lineHeight:1.1, letterSpacing:'-0.3px' }}>
              CtrlE
            </Typography>
            <Typography sx={{ fontSize:'0.6rem', fontFamily:'"JetBrains Mono", monospace', color:C.accent, letterSpacing:'1px' }}>
              ADMIN PANEL
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 네비 */}
      <Box sx={{ flex:1, overflowY:'auto', py:1.5, '&::-webkit-scrollbar':{display:'none'} }}>
        {NAV_ITEMS.map(section => (
          <Box key={section.section} sx={{ mb:0.5 }}>
            <Typography sx={{ fontSize:'0.62rem', fontFamily:'"JetBrains Mono", monospace', textTransform:'uppercase', letterSpacing:'1.2px', color:C.textHint, px:2.5, pt:1.5, pb:0.5 }}>
              {section.section}
            </Typography>
            {section.items.map(item => {
              const badge = item.badgeKey ? getBadge(item.badgeKey) : 0;
              const isActive = active === item.id;
              return (
                <Box key={item.id} onClick={()=>onNav(item.id)}
                  sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', px:2.5, py:'8px', cursor:'pointer', color: isActive ? C.accent : C.textMuted, backgroundColor: isActive ? 'rgba(37,99,235,0.08)' : 'transparent', borderLeft: isActive ? `2px solid ${C.accent}` : '2px solid transparent', transition:'all 0.15s', '&:hover':{ backgroundColor:C.hover, color:C.textPrimary } }}>
                  <Box sx={{ display:'flex', alignItems:'center', gap:1.2 }}>
                    {item.icon}
                    <Typography sx={{ fontSize:'0.82rem', fontWeight: isActive ? 700 : 400, color:'inherit' }}>{item.label}</Typography>
                  </Box>
                  {badge > 0 && (
                    <Box sx={{ px:'6px', py:'1px', borderRadius:'10px', backgroundColor:'rgba(239,68,68,0.15)', color:C.red, fontSize:'0.65rem', fontFamily:'"JetBrains Mono", monospace', fontWeight:700, border:`1px solid rgba(239,68,68,0.25)` }}>
                      {badge}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>

      {/* 푸터 */}
      <Box sx={{ px:2.5, py:2, borderTop:`1px solid ${C.border}`, display:'flex', alignItems:'center', gap:1 }}>
        <Avatar sx={{ width:30, height:30, fontSize:'0.75rem', fontWeight:800, backgroundColor:'rgba(37,99,235,0.15)', color:C.accent }}>A</Avatar>
        <Box sx={{ flex:1, minWidth:0 }}>
          <Typography sx={{ fontSize:'0.78rem', fontWeight:700, color:C.textPrimary }}>관리자</Typography>
          <Typography sx={{ fontSize:'0.65rem', color:C.textHint, fontFamily:'"JetBrains Mono", monospace' }}>Super Admin</Typography>
        </Box>
      </Box>
    </Box>
  );
};

// ─── 메인 레이아웃 ─────────────────────────────────────

export default function AdminDashboard({ onLogout }) {
  const [page, setPage]       = useState('dashboard');
  const [sidebarOpen, setSO]  = useState(false);
  const [toast, setToast]     = useState(null);
  const [dbData] = useState(DB);
  const [time, setTime]       = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // 스크롤 탑 버튼
  const [showTop, setShowTop] = useState(false);
  useEffect(() => {
    const el = document.getElementById('admin-scroll');
    if (!el) return;
    const h = () => setShowTop(el.scrollTop > 400);
    el.addEventListener('scroll', h);
    return () => el.removeEventListener('scroll', h);
  }, []);

  const showToast = useCallback((msg, type='success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  }, []);

  const renderPage = () => {
    const props = { data: dbData, onToast: showToast };
    switch(page) {
      case 'dashboard':  return <DashboardPage {...props} />;
      case 'users':      return <UsersPage {...props} />;
      case 'posts':      return <PostsPage {...props} />;
      case 'comments':   return <CommentsPage {...props} />;
      case 'reports':    return <ReportsPage {...props} />;
      case 'inquiries':  return <InquiriesPage {...props} />;
      case 'badwords':   return <BadwordsPage {...props} />;
      case 'categories': return <CategoriesPage {...props} />;
      case 'ranks':      return <RanksPage {...props} />;
      default:           return <DashboardPage {...props} />;
    }
  };

  const PAGE_LABELS = { dashboard:'대시보드', users:'사용자 관리', posts:'게시글 관리', comments:'댓글 관리', reports:'신고 관리', inquiries:'문의 관리', badwords:'금지어 관리', categories:'카테고리', ranks:'랭크/경험치' };

  return (
    <Box sx={{ minHeight:'100vh', backgroundColor:C.bg, display:'flex' }}>
      {/* 격자 */}
      <Box sx={{ position:'fixed', inset:0, pointerEvents:'none', backgroundImage:`linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`, backgroundSize:'48px 48px', zIndex:0 }} />

      {/* 사이드바 */}
      <Sidebar active={page} onNav={(p)=>{ setPage(p); setSO(false); document.getElementById('admin-scroll')?.scrollTo({top:0}); }} open={sidebarOpen} data={dbData} />

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <Box onClick={()=>setSO(false)} sx={{ position:'fixed', inset:0, backgroundColor:'rgba(0,0,0,0.5)', zIndex:99, display:{lg:'none'} }} />
      )}

      {/* 메인 */}
      <Box id="admin-scroll" sx={{ flex:1, ml:{ xs:0, lg:'220px' }, display:'flex', flexDirection:'column', height:'100vh', overflowY:'auto', position:'relative', zIndex:1 }}>
        {/* 탑바 */}
        <Box sx={{ position:'sticky', top:0, zIndex:50, backgroundColor:'rgba(26,29,39,0.92)', backdropFilter:'blur(12px)', borderBottom:`1px solid ${C.border}`, px:3, height:52, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Box sx={{ display:'flex', alignItems:'center', gap:1.5 }}>
            <IconButton size="small" onClick={()=>setSO(o=>!o)} sx={{ color:C.textMuted, display:{lg:'none'} }}>
              <MenuIcon sx={{fontSize:20}} />
            </IconButton>
            <Typography sx={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'0.78rem', color:C.textHint }}>
              admin / <Box component="span" sx={{ color:C.textMuted }}>{PAGE_LABELS[page]}</Box>
            </Typography>
          </Box>
          <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
            <Typography sx={{ fontFamily:'"JetBrains Mono", monospace', fontSize:'0.72rem', color:C.textHint, display:{xs:'none',sm:'block'} }}>
              {time.toLocaleTimeString('ko-KR')}
            </Typography>
            <Box sx={{ display:'flex', alignItems:'center', gap:0.8 }}>
              <Box sx={{ width:6, height:6, borderRadius:'50%', backgroundColor:C.green, animation:'pulse 2s ease-in-out infinite', '@keyframes pulse':{ '0%,100%':{opacity:1}, '50%':{opacity:0.4} } }} />
              <Typography sx={{ fontSize:'0.72rem', fontFamily:'"JetBrains Mono", monospace', color:C.textMuted, display:{xs:'none',sm:'block'} }}>Oracle DB</Typography>
            </Box>
            <Tooltip title="로그아웃">
              <IconButton size="small" onClick={onLogout} sx={{ color:C.textHint, '&:hover':{color:C.red} }}>
                <Logout sx={{fontSize:17}} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 콘텐츠 */}
        <Box sx={{ flex:1, p:{ xs:2, md:3 }, maxWidth:1300, width:'100%', mx:'auto' }}>
          {renderPage()}
        </Box>
      </Box>

      {/* 맨 위로 버튼 (Feed.jsx 동일 패턴) */}
      <Fade in={showTop}>
        <Box onClick={()=>document.getElementById('admin-scroll')?.scrollTo({top:0,behavior:'smooth'})}
          sx={{ position:'fixed', bottom:28, right:28, zIndex:999, width:42, height:42, borderRadius:'50%', backgroundColor:C.paper, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'all 0.2s', boxShadow:'0 4px 20px rgba(0,0,0,0.5)', '&:hover':{ borderColor:C.borderFocus, transform:'translateY(-2px)' } }}>
          <KeyboardArrowUp sx={{ fontSize:20, color:C.textPrimary }} />
        </Box>
      </Fade>

      {/* 토스트 */}
      <Snackbar open={!!toast} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity={toast?.type==='error'?'error':toast?.type==='warn'?'warning':'success'} icon={toast?.type==='error'?undefined:<Check fontSize="inherit"/>}
          sx={{ fontWeight:700, fontSize:'0.85rem', borderRadius:2, backgroundColor: toast?.type==='error' ? 'rgba(239,68,68,0.15)' : toast?.type==='warn' ? 'rgba(249,115,22,0.15)' : 'rgba(16,185,129,0.15)', color: toast?.type==='error' ? '#FCA5A5' : toast?.type==='warn' ? '#FED7AA' : '#6EE7B7', border:`1px solid ${toast?.type==='error'?'rgba(239,68,68,0.3)':toast?.type==='warn'?'rgba(249,115,22,0.3)':'rgba(16,185,129,0.3)'}` }}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}