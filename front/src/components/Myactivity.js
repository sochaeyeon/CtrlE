import { useState, useEffect, useContext } from "react";
import { ColorModeContext } from "../App";
import {
  ArticleOutlined,
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  VisibilityOutlined,
  PersonOutlined,
  PersonAddOutlined,
  BarChartOutlined,
  LabelOutlined,
  AutoAwesomeOutlined,
  BookmarkBorderOutlined,
  RefreshOutlined,
  WarningAmberOutlined,
  TipsAndUpdatesOutlined,
  TrendingUpOutlined,
  EmojiEventsOutlined,
  ShowChartOutlined,
  InsightsOutlined,
} from "@mui/icons-material";

const THEME = {
  light: { bg: '#F8FAFC', paper: '#FFFFFF', border: '#E2E8F0', textPrimary: '#0F172A', textSecondary: '#64748B', hover: '#F1F5F9', tab: '#F1F5F9', tabActive: '#FFFFFF' },
  dark: { bg: '#0F1117', paper: '#1A1D27', border: '#2D3148', textPrimary: '#F1F5F9', textSecondary: '#94A3B8', hover: '#22253A', tab: '#22253A', tabActive: '#1A1D27' },
};

const COLORS = {
  purple: {
    light: { bg: "#EEEDFE", border: "#AFA9EC", text: "#3C3489", strong: "#534AB7", track: "#D8D5FB" },
    dark: { bg: "#2D2B4E", border: "#534AB7", text: "#C4C0F7", strong: "#9B96EF", track: "#3D3A6A" },
  },
  teal: {
    light: { bg: "#E1F5EE", border: "#5DCAA5", text: "#085041", strong: "#0F6E56" },
    dark: { bg: "#0F2E27", border: "#0F6E56", text: "#6DD5B3", strong: "#3DB897" },
  },
  coral: {
    light: { bg: "#FAECE7", border: "#F0997B", text: "#4A1B0C", strong: "#993C1D" },
    dark: { bg: "#2E1A14", border: "#993C1D", text: "#F0997B", strong: "#D85A30" },
  },
  amber: {
    light: { bg: "#FAEEDA", border: "#EF9F27", text: "#412402", strong: "#854F0B" },
    dark: { bg: "#2A1E0A", border: "#854F0B", text: "#FAC775", strong: "#EF9F27" },
  },
  blue: {
    light: { bg: "#E6F1FB", border: "#85B7EB", text: "#042C53", strong: "#185FA5" },
    dark: { bg: "#0C1E33", border: "#185FA5", text: "#85B7EB", strong: "#378ADD" },
  },
};

const getC = (key, mode) => COLORS[key]?.[mode] || COLORS[key]?.light;

async function analyzePostsWithAI(posts) {
  const response = await fetch("http://localhost:3010/activity/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("accessToken")}` },
    body: JSON.stringify({ posts }),
  });
  const resData = await response.json();
  if (!response.ok || !resData.success) throw new Error(resData.message || "서버 응답 오류");
  return resData.data;
}

function StatCard({ label, value, Icon, color, mode }) {
  const c = getC(color, mode);
  return (
    <div style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6, flex: "1 1 140px", minWidth: 0 }}>
      <Icon sx={{ fontSize: 22, color: c.strong }} />
      <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 26, fontWeight: 700, color: c.strong, letterSpacing: -1 }}>{value?.toLocaleString() ?? "-"}</span>
    </div>
  );
}

function MiniStatBox({ value, label, Icon, t }) {
  return (
    <div style={{ flex: 1, minWidth: 100, background: t.paper, borderRadius: 12, padding: "14px 20px", textAlign: "center", border: `1px solid ${t.border}` }}>
      <Icon sx={{ fontSize: 20, color: t.textSecondary, mb: 0.5 }} />
      <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -1, color: t.textPrimary }}>{value?.toLocaleString() ?? "-"}</div>
      <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 2 }}>{label}</div>
    </div>
  );
}

// X축 레이블을 granularity에 따라 다르게 표시
function getXLabel(d, granularity) {
  if (granularity === "yearly") return `${d.year}년`;
  if (granularity === "daily") return `${d.day}일`;
  return `${d.month?.slice(5)}월`;
}

function LineChart({ data, series, t, granularity }) {
  if (!data || data.length === 0) return <p style={{ color: t.textSecondary, fontSize: 13 }}>데이터가 없습니다.</p>;

  const W = 620, H = 160, PL = 32, PR = 12, PT = 12, PB = 28;
  const innerW = W - PL - PR;
  const innerH = H - PT - PB;

  const allVals = data.flatMap(d => series.map(s => d[s.key] ?? 0));
  const maxVal = Math.max(...allVals, 1);
  const xStep = innerW / Math.max(data.length - 1, 1);

  const getPath = (key) =>
    data.map((d, i) => {
      const x = PL + i * xStep;
      const y = PT + innerH - (d[key] / maxVal) * innerH;
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    }).join(" ");

  const getArea = (key) => {
    const line = data.map((d, i) => {
      const x = PL + i * xStep;
      const y = PT + innerH - (d[key] / maxVal) * innerH;
      return `${x},${y}`;
    }).join(" L");
    const firstX = PL, lastX = PL + (data.length - 1) * xStep;
    const baseY = PT + innerH;
    return `M${firstX},${baseY} L${line} L${lastX},${baseY} Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(r => ({ val: Math.round(maxVal * r), y: PT + innerH - r * innerH }));

  // 데이터 포인트가 많으면 일부만 레이블 표시
  const showLabelStep = data.length > 20 ? Math.ceil(data.length / 10) : 1;

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", minWidth: 320, display: "block" }}>
        <defs>
          {series.map(s => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0.01" />
            </linearGradient>
          ))}
        </defs>
        {yTicks.map(tick => (
          <g key={tick.val}>
            <line x1={PL} y1={tick.y} x2={W - PR} y2={tick.y} stroke={t.border} strokeWidth={0.8} strokeDasharray="4,3" />
            <text x={PL - 4} y={tick.y + 4} fontSize={9} textAnchor="end" fill={t.textSecondary}>{tick.val}</text>
          </g>
        ))}
        {series.map(s => (
          <path key={`area-${s.key}`} d={getArea(s.key)} fill={`url(#grad-${s.key})`} />
        ))}
        {series.map(s => (
          <path key={`line-${s.key}`} d={getPath(s.key)} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {series.map(s =>
          data.map((d, i) => (
            <circle key={`dot-${s.key}-${i}`} cx={PL + i * xStep} cy={PT + innerH - (d[s.key] / maxVal) * innerH} r={3} fill={s.color} />
          ))
        )}
        {data.map((d, i) => i % showLabelStep === 0 && (
          <text key={`x-${i}`} x={PL + i * xStep} y={H - 4} fontSize={9} textAnchor="middle" fill={t.textSecondary}>
            {getXLabel(d, granularity)}
          </text>
        ))}
      </svg>
      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: t.textSecondary }}>
        {series.map(s => (
          <span key={s.key} style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 12, height: 3, borderRadius: 2, background: s.color, display: "inline-block" }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function TagBar({ tags, mode, t }) {
  if (!tags || tags.length === 0) return <p style={{ color: t.textSecondary, fontSize: 13 }}>태그 사용 내역이 없습니다.</p>;
  const max = tags[0].count;
  const c = getC("purple", mode);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {tags.map((tag, i) => (
        <div key={tag.tag} style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: t.textSecondary, width: 16, textAlign: "right" }}>{i + 1}</span>
          <span style={{ fontSize: 12, background: c.bg, color: c.strong, borderRadius: 99, padding: "2px 10px", fontWeight: 500, whiteSpace: "nowrap", minWidth: 60, textAlign: "center", border: `1px solid ${c.border}` }}>#{tag.tag}</span>
          <div style={{ flex: 1, background: c.track || c.bg, borderRadius: 4, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${Math.round((tag.count / max) * 100)}%`, height: "100%", background: c.strong, borderRadius: 4, transition: "width 0.6s ease" }} />
          </div>
          <span style={{ fontSize: 12, color: t.textSecondary, minWidth: 28, textAlign: "right" }}>{tag.count}회</span>
        </div>
      ))}
    </div>
  );
}

function TopPostList({ posts, metric, metricLabel, Icon, color, mode, t }) {
  if (!posts || posts.length === 0)
    return <p style={{ color: t.textSecondary, fontSize: 13 }}>데이터가 없습니다.</p>;
  const c = getC(color, mode);
  const max = posts[0]?.[metric] || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {posts.map((post, i) => (
        <div key={post.postId ?? i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: i === 0 ? c.bg : t.paper, border: `1px solid ${i === 0 ? c.border : t.border}`, borderRadius: 10, transition: "background 0.2s" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: i === 0 ? c.strong : t.textSecondary, width: 18, textAlign: "center" }}>{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: t.textPrimary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</p>
            <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, background: t.border, borderRadius: 4, height: 4, overflow: "hidden" }}>
                <div style={{ width: `${Math.round((post[metric] / max) * 100)}%`, height: "100%", background: c.strong, borderRadius: 4 }} />
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: c.strong, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>
            <Icon sx={{ fontSize: 14 }} />
            {post[metric]?.toLocaleString()}
            <span style={{ fontWeight: 400, fontSize: 11, color: t.textSecondary }}>{metricLabel}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function Tabs({ tabs, active, onChange, t }) {
  return (
    <div style={{ display: "flex", background: t.tab, borderRadius: 10, padding: 4, gap: 2 }}>
      {tabs.map(tab => (
        <button key={tab.key} onClick={() => onChange(tab.key)}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            background: active === tab.key ? t.tabActive : "transparent",
            border: active === tab.key ? `1px solid ${t.border}` : "1px solid transparent",
            borderRadius: 8, padding: "7px 10px", fontSize: 12, fontWeight: active === tab.key ? 600 : 400,
            color: active === tab.key ? t.textPrimary : t.textSecondary, cursor: "pointer", transition: "all 0.15s",
          }}>
          <tab.Icon sx={{ fontSize: 14 }} />
          {tab.label}
        </button>
      ))}
    </div>
  );
}

// ─── 핵심: GranularityFilter — activity 탭에서만 보임 ──────
function GranularityFilter({ granularity, setGranularity, selectedYear, setSelectedYear, selectedMonth, setSelectedMonth, t }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);

  const selectStyle = {
    padding: "5px 10px", borderRadius: 8, fontSize: 12,
    border: `1px solid ${t.border}`, background: t.paper,
    color: t.textPrimary, cursor: "pointer", outline: "none",
  };

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", padding: "10px 0" }}>
      {["yearly", "monthly", "daily"].map(g => (
        <button key={g} onClick={() => setGranularity(g)}
          style={{
            padding: "6px 14px", borderRadius: 99, fontSize: 12,
            fontWeight: granularity === g ? 600 : 400, cursor: "pointer",
            border: `1px solid ${granularity === g ? "#7B75E8" : t.border}`,
            background: granularity === g ? "#7B75E8" : t.paper,
            color: granularity === g ? "#fff" : t.textSecondary,
            transition: "all 0.15s",
          }}>
          {g === "yearly" ? "연별" : g === "monthly" ? "월별" : "일별"}
        </button>
      ))}

      <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} style={selectStyle}>
        {years.map(y => <option key={y} value={y}>{y}년</option>)}
      </select>

      {granularity === "daily" && (
        <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} style={selectStyle}>
          {months.map(m => <option key={m} value={m}>{m}월</option>)}
        </select>
      )}
    </div>
  );
}

function AIAnalysisCard({ posts, mode, t }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    setLoading(true); setError(null);
    try { setAnalysis(await analyzePostsWithAI(posts)); }
    catch { setError("AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."); }
    finally { setLoading(false); }
  };

  const cp = getC("purple", mode);
  const ct = getC("teal", mode);
  const cc = getC("coral", mode);
  const ca = getC("amber", mode);
  const cb = getC("blue", mode);

  if (!posts || posts.length === 0)
    return <p style={{ color: t.textSecondary, fontSize: 13 }}>분석할 게시글이 없습니다. 글을 작성하면 AI가 패턴을 분석해줘요.</p>;

  return (
    <div>
      {!analysis && !loading && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ color: t.textSecondary, fontSize: 14, marginBottom: 16 }}>최근 게시글 {posts.length}개를 AI가 분석해 주제, 독자 반응 패턴, 성장 인사이트를 알려드려요.</p>
          <button onClick={runAnalysis} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cp.strong, color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            <AutoAwesomeOutlined sx={{ fontSize: 16 }} /> AI 분석 시작
          </button>
        </div>
      )}
      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0", color: t.textSecondary, fontSize: 14 }}>
          <div style={{ width: 32, height: 32, border: `3px solid ${t.border}`, borderTopColor: cp.strong, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          게시글을 분석하고 있어요...
        </div>
      )}
      {error && <p style={{ color: "#E24B4A", fontSize: 13 }}>{error}</p>}
      {analysis && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>주요 주제</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {analysis.mainTopics?.map(topic => (
                <span key={topic} style={{ background: cb.bg, color: cb.strong, border: `1px solid ${cb.border}`, borderRadius: 99, padding: "4px 12px", fontSize: 13, fontWeight: 500 }}>{topic}</span>
              ))}
            </div>
          </div>
          {analysis.engagementPattern && (
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: ct.bg, border: `1px solid ${ct.border}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: ct.text }}>
              <TrendingUpOutlined sx={{ fontSize: 16, mt: "1px", flexShrink: 0 }} />
              <span><strong>독자 반응 패턴 · </strong>{analysis.engagementPattern}</span>
            </div>
          )}
          {analysis.commonErrors?.length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: t.textSecondary, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>자주 다룬 오류 / 문제</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {analysis.commonErrors.map(err => (
                  <div key={err} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: cc.bg, border: `1px solid ${cc.border}`, borderRadius: 8, padding: "8px 12px", fontSize: 13, color: cc.text }}>
                    <WarningAmberOutlined sx={{ fontSize: 16, mt: "1px", flexShrink: 0 }} /><span>{err}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ borderLeft: `3px solid ${cp.strong}`, paddingLeft: 14 }}>
            <p style={{ fontSize: 13, color: t.textPrimary, lineHeight: 1.7, margin: 0 }}>{analysis.insight}</p>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: ca.bg, border: `1px solid ${ca.border}`, borderRadius: 8, padding: "12px 16px", fontSize: 13, color: ca.text }}>
            <TipsAndUpdatesOutlined sx={{ fontSize: 16, mt: "1px", flexShrink: 0 }} />
            <span><strong>성장 제안 · </strong>{analysis.suggestion}</span>
          </div>
          <button onClick={runAnalysis} style={{ alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, background: "transparent", border: `1px solid ${cp.border}`, borderRadius: 8, padding: "7px 16px", fontSize: 12, color: cp.strong, cursor: "pointer", fontWeight: 500 }}>
            <RefreshOutlined sx={{ fontSize: 14 }} /> 다시 분석
          </button>
        </div>
      )}
    </div>
  );
}

function Section({ title, Icon, children, t, action }) {
  return (
    <div style={{ background: t.paper, border: `1px solid ${t.border}`, borderRadius: 14, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: t.textPrimary, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 8 }}>
          <Icon sx={{ fontSize: 18, color: t.textSecondary }} />{title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── 메인 페이지 ───────────────────────────────────────────
export default function MyActivityPage() {
  const { mode } = useContext(ColorModeContext);
  const t = THEME[mode] || THEME.light;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("activity");
  const [topPostTab, setTopPostTab] = useState("likes");

  // ✅ 여기에 3개 상태 추가
  const [granularity, setGranularity] = useState("monthly");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // ✅ useEffect — granularity/year/month 바뀔 때마다 재요청
  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ granularity, year: selectedYear });
    if (granularity === "daily") params.append("month", selectedMonth);

    fetch(`http://localhost:3010/activity/stats?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
    })
      .then(r => r.json())
      .then(res => { if (res.success) setData(res.data); else setError("데이터를 불러오지 못했습니다."); })
      .catch(() => setError("서버와 연결할 수 없습니다."))
      .finally(() => setLoading(false));
  }, [granularity, selectedYear, selectedMonth]);

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 300, background: t.bg }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${t.border}`, borderTopColor: "#7B75E8", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ textAlign: "center", padding: 48, color: t.textSecondary, fontSize: 14, background: t.bg, minHeight: "100vh" }}>
      <p>{error}</p>
    </div>
  );

  const { summary, monthlyActivity, followMonthlyActivity, topTags, saveStats, followStats, recentPosts, topLikedPosts, topViewedPosts } = data;

  const mainTabs = [
    { key: "activity", label: "활동 추이", Icon: ShowChartOutlined },
    { key: "top", label: "인기 게시글", Icon: EmojiEventsOutlined },
    { key: "tags", label: "태그 분석", Icon: LabelOutlined },
    { key: "ai", label: "AI 분석", Icon: InsightsOutlined },
  ];

  const topPostTabs = [
    { key: "likes", label: "좋아요", Icon: FavoriteBorderOutlined },
    { key: "views", label: "조회수", Icon: VisibilityOutlined },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bg }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 16px 64px", display: "flex", flexDirection: "column", gap: 20, fontFamily: '"Plus Jakarta Sans", "Noto Sans KR", sans-serif' }}>

        <div style={{ marginBottom: 4 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, letterSpacing: -0.5, color: t.textPrimary }}>내 활동</h1>
          <p style={{ fontSize: 13, color: t.textSecondary, marginTop: 4 }}>지금까지의 활동을 한눈에 확인하세요</p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          <StatCard label="작성한 게시글" value={summary.postCount} Icon={ArticleOutlined} color="purple" mode={mode} />
          <StatCard label="작성한 댓글" value={summary.commentCount} Icon={ChatBubbleOutlineOutlined} color="teal" mode={mode} />
          <StatCard label="받은 좋아요" value={summary.receivedLikes} Icon={FavoriteBorderOutlined} color="coral" mode={mode} />
          <StatCard label="총 조회수" value={summary.totalViews} Icon={VisibilityOutlined} color="blue" mode={mode} />
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <MiniStatBox value={followStats.followerCount} label="팔로워" Icon={PersonOutlined} t={t} />
          <MiniStatBox value={followStats.followingCount} label="팔로잉" Icon={PersonAddOutlined} t={t} />
          <MiniStatBox value={saveStats.receivedCommentCount} label="받은 댓글" Icon={ChatBubbleOutlineOutlined} t={t} />
          <MiniStatBox value={saveStats.bookmarkCount} label="북마크" Icon={BookmarkBorderOutlined} t={t} />
        </div>

        <Tabs tabs={mainTabs} active={activeTab} onChange={setActiveTab} t={t} />

        {activeTab === "activity" && (
          <GranularityFilter
            granularity={granularity} setGranularity={setGranularity}
            selectedYear={selectedYear} setSelectedYear={setSelectedYear}
            selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
            t={t}
          />
        )}

        {activeTab === "activity" && (
          <>
            <Section title="게시글 · 댓글 추이" Icon={BarChartOutlined} t={t}>
              <LineChart
                data={monthlyActivity}
                series={[
                  { key: "posts", label: "게시글", color: "#7B75E8" },
                  { key: "comments", label: "댓글", color: "#1D9E75" },
                ]}
                t={t}
                granularity={granularity}
              />
            </Section>

            <Section title="팔로워 변동 추이" Icon={TrendingUpOutlined} t={t}>
              {followMonthlyActivity && followMonthlyActivity.length > 0
                ? <LineChart
                  data={followMonthlyActivity}
                  series={[
                    { key: "followers", label: "팔로워", color: "#7B75E8" },
                    { key: "following", label: "팔로잉", color: "#1D9E75" },
                  ]}
                  t={t}
                  granularity={granularity}
                />
                : <p style={{ color: t.textSecondary, fontSize: 13 }}>팔로워 변동 데이터가 없습니다.</p>
              }
            </Section>
          </>
        )}

        {activeTab === "top" && (
          <Section title="인기 게시글" Icon={EmojiEventsOutlined} t={t}>
            <Tabs tabs={topPostTabs} active={topPostTab} onChange={setTopPostTab} t={t} />
            {topPostTab === "likes" && <TopPostList posts={topLikedPosts} metric="likeCount" metricLabel="개" Icon={FavoriteBorderOutlined} color="coral" mode={mode} t={t} />}
            {topPostTab === "views" && <TopPostList posts={topViewedPosts} metric="viewCount" metricLabel="회" Icon={VisibilityOutlined} color="blue" mode={mode} t={t} />}
          </Section>
        )}

        {activeTab === "tags" && (
          <Section title="자주 쓴 태그 TOP 5" Icon={LabelOutlined} t={t}>
            <TagBar tags={topTags} mode={mode} t={t} />
          </Section>
        )}

        {activeTab === "ai" && (
          <Section title="AI 콘텐츠 분석" Icon={AutoAwesomeOutlined} t={t}>
            <AIAnalysisCard posts={recentPosts} mode={mode} t={t} />
          </Section>
        )}

      </div>
    </div>
  );
}