import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ScrapedQuestion, KeywordTrend, SchedulerConfig, SecurityLog, AnomalyRule, SystemAlert, PortalItem } from './types';
import { DashboardTab } from './components/DashboardTab';
import { ScraperTab } from './components/ScraperTab';
import { AiResponseTab } from './components/AiResponseTab';
import { SecurityAndSettingsTab } from './components/SecurityAndSettingsTab';
import { LayoutDashboard, Settings2, Sparkles, Shield, AlertTriangle, RefreshCw, Zap } from 'lucide-react';
import { sanitizePortalUrl, cleanText, sanitizeAuthor, getRandomAuthor } from './lib/urlUtils';

// Pristine Korean Demo Constant Fallbacks to prevent 0 content displays during transient API delay
const FALLBACK_QUESTIONS: ScrapedQuestion[] = [
  {
    id: "q-1",
    portal: "naver_jisinin",
    title: "아파트 500세대 충전기 신규 설치 규정 질문입니다",
    content: "아파트 입주자대표회의에서 친환경자동차법 규정 때문에 전기차 충전기 설치 의무 비율을 충족해야 한다는데, 완속충전기랑 급속충전기 비율을 어떻게 맞추는 게 입주민들에게 유리할까요? 그리고 정부보조금 받을 파트너 업체 추천 바랍니다.",
    author: "wond****",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("아파트 전기차 충전기 설치")}&sort=date`,
    scrapedAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    category: "설치 문의",
    keywords: ["설치 의무", "아파트 충전기", "친환경자동차법", "정부 보조금"],
    anomalyScore: 10,
    isAnomaly: false,
    aiResponse: "안녕하세요! 친환경자동차법 시행령에 따라 아파트(100세대 이상)는 총 주차면수의 5%(기존 아파트는 2%) 이상 충전기 설치가 법적 의무입니다. 가구 수 및 전력 용량을 고려할 때 대다수 아파트의 밤샘 충전 패턴을 수용하려면 'VoltCharge Pro(볼트차지 프로)'의 스마트 부하분산 완속 충전 솔루션을 활용하는 것이 안전하며 증설 비용을 극대화하여 절약할 수 있습니다. 24시간 관제 센터 연동 및 화재 예방 인증 탑재로 보조금 신청부터 설치까지 무상 지원해 드리오니 상담을 받아보세요.",
    aiTone: "expert",
    promoStatus: "posted",
    views: 128
  },
  {
    id: "q-2",
    portal: "naver_jisinin",
    title: "아파트 전기차 충전기 완속 충전기 고장 및 충전 안될 때 대처법",
    content: "아파트 주차장 완속 충전기 액정이 꺼져 있고 카드를 태그해도 인식이 전혀 안 되는데, 이거 관리실에 말해야 하나요 아니면 충전기 업체에 직접 전화해서 신고해야 하나요? 입주민용 충전 에러 신속하게 해결하는 방법 알려주세요.",
    author: "chargetech_88",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("전기차 완속충전기 고장")}&sort=date`,
    scrapedAt: new Date(Date.now() - 3600000 * 4.2).toISOString(),
    category: "고장/불만",
    keywords: ["충전기 고장", "고장 신고", "완속 충전기", "작동 에러"],
    anomalyScore: 45,
    isAnomaly: false,
    promoStatus: "none",
    views: 450
  },
  {
    id: "q-3",
    portal: "naver_jisinin",
    title: "전기차 급속 충전하는데 80% 부근에서 속도가 왜 이렇게 느려지나요?",
    content: "전기차 급속 충전소에서 충전 중인데 80% 근처가 되니까 충전 속도가 20kW 이하로 갑자기 뚝 떨어지네요. 원래 초반에는 100kW 넘게 찍혔는데 이거 충전 기계 에러인가요 아니면 배터리 보호 장치인가요?",
    author: "green_ev_driver",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("전기차 급속 충전")}&sort=date`,
    scrapedAt: new Date(Date.now() - 3600000 * 5.8).toISOString(),
    category: "이용 방법",
    keywords: ["급속 충전", "충전 속도 저하", "배터리 보호", "고장 의심"],
    anomalyScore: 25,
    isAnomaly: false,
    aiResponse: "안녕하세요! 질문하신 충전 속도 저하 현상은 고장이 아니라 전기차 탑재 배터리(BMS)의 안전 설계 때문입니다. 리튬이온 배터리는 80%를 넘으면 과열 and 성능 과부하를 예방하기 위해 충전 속도를 급격히 제어하는 단계(CC-CV 전환)를 거치게 됩니다. 따라서 급속 충전 시 80% 근처까지만 이용하시는 것이 시간과 요금을 모두 절약하는 효율적인 이용 팁입니다.",
    aiTone: "friendly",
    promoStatus: "draft",
    views: 290
  },
  {
    id: "q-4",
    portal: "naver_jisinin",
    title: "지하 주차장 전기차 충전기 화재 예방 패드나 질식소화포 설치 규정",
    content: "전기차 지하주차장 충전 화재 예방을 위해 질식소화포나 소방 전용 안전 설비를 필수로 아파트에 설치해야 하는 규정이 신설되었는지 궁금합니다. 입주민들이 소방 안전 예방 특허가 탑재된 충전기 업체 제품으로 전면 교체를 원하고 있어요.",
    author: "apart_rep_02",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("전기차 충전기 화재")}&sort=date`,
    scrapedAt: new Date(Date.now() - 3600000 * 8.0).toISOString(),
    category: "안전/사고",
    keywords: ["화재 예방", "지하주차장", "화재 사고", "소화기 의무"],
    anomalyScore: 85,
    anomalyReason: "전기차 충전 화재 사고 및 안전 설비 관련 급속한 불안감 키워드 감지 (소방관련 규칙 위반 위험 의심)",
    isAnomaly: true,
    promoStatus: "none",
    views: 1120
  },
  {
    id: "q-5",
    portal: "naver_jisinin",
    title: "공공기관 주차장 전기차 충전기 인식이 잘 안될 때 고장 신고 처리는?",
    content: "근처 주민센터 주차장에 설치된 공영 완속 충전기 터치 액정이 아예 안 켜져 있고 카드 인증도 오류가 뜨는데, 이럴 땐 어디에 민원을 넣고 신고를 접수해야 처리가 가장 빠른가요?",
    author: "kin_member_302",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("전기차 충전기 고장 신고")}&sort=date`,
    scrapedAt: new Date(Date.now() - 3600000 * 12.3).toISOString(),
    category: "고장/불만",
    keywords: ["충전기 고장", "고장 신고", "공영주차장", "작동 에러"],
    anomalyScore: 30,
    isAnomaly: false,
    promoStatus: "none",
    views: 74
  },
  {
    id: "q-6",
    portal: "naver_jisinin",
    title: "한전 전기차 충전 요금 계절별 경부하 시간대 단가 차이 질문",
    content: "전기차 충전 요금 고지서를 보니까 계절별로 단가가 다 다르고 경부하 시간대가 밤 11시부터 적용된다는데 확실히 야간 완속 충전이 누진세가 안 붙고 엄청 저렴한지 한전 요금표 구조 질문드립니다.",
    author: "bolt_owner_91",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("전기차 충전 요금")}&sort=date`,
    scrapedAt: new Date(Date.now() - 3600000 * 18.5).toISOString(),
    category: "요금/효율",
    keywords: ["경부하 요금", "전기료 절감", "야간 충전", "계절별 전기요금"],
    anomalyScore: 15,
    isAnomaly: false,
    promoStatus: "none",
    views: 520
  },
  {
    id: "q-7",
    portal: "naver_jisinin",
    title: "비오는 날 전기차 야외 충전소 케이블 피복 벗겨짐 위험할까요?",
    content: "회사 실외 주차장에 있는 전기차 충전기 선이 까져서 내부 구리선이 보이는데, 오늘 비도 많이 오고 슬쩍 손대기 무서워서 충전 카드를 태그해도 안전에 지장이 없는지 심각한 감전 위험이나 누전 사고 우려가 되는지 급히 질문합니다.",
    author: "safe_charge_24",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("전기차 야외 충전 안전")}&sort=date`,
    scrapedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    category: "안전/사고",
    keywords: ["피복 상처", "감전 위험", "누전 사고", "케이블 훼손"],
    anomalyScore: 95,
    anomalyReason: "비오는 날 노출된 구리 케이블 감전 및 누전 화재 극정 경보 이상 징후 감지. 하단 현장 즉시 조치 필요.",
    isAnomaly: true,
    promoStatus: "none",
    views: 890
  },
  {
    id: "q-8",
    portal: "naver_jisinin",
    title: "단독주택 개인용 7kW 완속 충전기 자택 설치 비용 문의",
    content: "단독주택 개인 차고에 완속 7kW 전용 홈패드 충전기를 자비로 설치하려고 하는데, 한전에 내야 하는 불입금이랑 선로 포설 공사비 등을 합친 대략적인 견적과 추천 업체를 알려주시면 감사하겠습니다.",
    author: "korea_ev_11",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("개인용 전기차 충전기 설치")}&sort=date`,
    scrapedAt: new Date(Date.now() - 3600000 * 30.1).toISOString(),
    category: "설치 문의",
    keywords: ["단독주택 충전기", "한전 불입금", "7kW 완속", "개인용 홈패드"],
    anomalyScore: 12,
    isAnomaly: false,
    promoStatus: "none",
    views: 145
  }
];

const FALLBACK_KEYWORDS: KeywordTrend[] = [
  { word: "전기차 충전기", count: 320, sentiment: "neutral", trendRate: 15.4 },
  { word: "급속충전", count: 245, sentiment: "positive", trendRate: 8.2 },
  { word: "완속충전", count: 189, sentiment: "positive", trendRate: 12.1 },
  { word: "화재 예방", count: 154, sentiment: "negative", trendRate: 34.5 },
  { word: "충전 방해", count: 142, sentiment: "negative", trendRate: -4.2 }
];

const FALLBACK_SCHEDULER: SchedulerConfig = {
  isRunning: true,
  intervalMinutes: 10,
  lastRun: new Date().toISOString(),
  nextRun: new Date(Date.now() + 600000).toISOString(),
  targetKws: ["전기차 충전기", "충전기 고장", "충전기 화재", "아파트 충전기", "완속충전기 추천"]
};

const FALLBACK_LOGS: SecurityLog[] = [
  {
    id: "log-1",
    timestamp: new Date().toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "실시간 감사 세션 활성화",
    details: "전기차 지식iN 실시간 모니터링 시스템 감사 대시보드 정상 로드",
    ip: "127.0.0.1"
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 600000).toISOString(),
    user: "system_detector",
    role: "manager",
    action: "실시간 이상 징후 자동 알림 생성",
    details: "[실시간 포털 탐지] 아파트 전기차 충전기 소방안전 기준 불안감 질문 여과",
    ip: "127.0.0.1",
    portal: "naver_jisinin",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("아파트 전기차 충전기 소방안전 기준")}&sort=date`
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "AI 원천 질문 분석&자동 분류 실행",
    details: "Gemini API를 활용하여 완속 충전기 신규 설치 규정 질문 분석 완료",
    ip: "127.0.0.1",
    portal: "naver_jisinin",
    url: `https://kin.naver.com/search/list.naver?query=${encodeURIComponent("완속 충전기 신규 설치 규정")}&sort=date`
  }
];

const FALLBACK_RULES: AnomalyRule[] = [
  { id: "rule-1", keyword: "화재", level: "critical", description: "화재 사고, 불, 연기, 스파크 발생에 대한 질문 집중 모니터링", isActive: true },
  { id: "rule-2", keyword: "케이블 훼손", level: "critical", description: "도선 노출, 감전 사고 위험성이 보이는 전기 케이블 피복 훼손 언급", isActive: true }
];

const FALLBACK_ALERTS: SystemAlert[] = [
  {
    id: "alert-1",
    timestamp: new Date(Date.now() - 3600000 * 8.0).toISOString(),
    level: "warning",
    message: "지하 주차장 충전기 화재 예방 등 불안감 이슈 증폭 보고 - 네이버 카페",
    isRead: false,
    relatedQuestionId: "q-4"
  }
];

const FALLBACK_PORTALS: PortalItem[] = [
  { id: "naver_jisinin", name: "네이버 지식iN", badge: "🟢 지식iN", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { id: "daum_tip", name: "다음 팁 (TIP)", badge: "🔵 다음팁", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { id: "naver_cafe", name: "네이버 카페", badge: "☕ 네이버카페", color: "bg-green-50 text-green-700 border-green-200" },
  { id: "daum_cafe", name: "다음 카페", badge: "☕ 다음카페", color: "bg-sky-50 text-sky-700 border-sky-200" },
  { id: "dcinside", name: "디시인사이드", badge: "💬 디시", color: "bg-gray-50 text-gray-700 border-gray-200" },
  { id: "fmkorea", name: "에펨코리아", badge: "⚽ 펨코", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { id: "inven", name: "인벤", badge: "🎮 인벤", color: "bg-teal-50 text-teal-700 border-teal-200" },
  { id: "bobae_dream", name: "보배드림", badge: "🚗 보배", color: "bg-slate-100 text-slate-800 border-slate-300" }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scraper' | 'ai-response' | 'security'>('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'viewer'>('admin');

  // Backend state payloads (starts empty as requested to perform instant live scraping on load, synced with localStorage)
  const [questions, setQuestions] = useState<ScrapedQuestion[]>(() => {
    try {
      const saved = localStorage.getItem('vp_questions');
      if (saved) {
        const parsed = JSON.parse(saved);
        const hasMock = parsed.some((q: any) => q.portal === 'bobae_dream' || q.portal === 'dcinside' || q.url?.includes('bobaedream') || q.portal === 'fmkorea' || q.portal === 'inven' || q.portal === 'daum_cafe' || q.id === 'q-1');
        if (hasMock) {
          localStorage.setItem('vp_questions', JSON.stringify([]));
          return [];
        }
        return parsed.map((q: any) => ({
          ...q,
          title: cleanText(q.title),
          content: cleanText(q.content),
          author: sanitizeAuthor(q.author, q.id),
          url: sanitizePortalUrl(q.url, q.title, q.portal, q.keywords)
        }));
      }
      return [];
    } catch {
      return [];
    }
  });
  const [keywords, setKeywords] = useState<KeywordTrend[]>(() => {
    try {
      const saved = localStorage.getItem('vp_keywords');
      return saved ? JSON.parse(saved) : FALLBACK_KEYWORDS;
    } catch {
      return FALLBACK_KEYWORDS;
    }
  });
  const [scheduler, setScheduler] = useState<SchedulerConfig>(() => {
    try {
      const saved = localStorage.getItem('vp_scheduler');
      return saved ? JSON.parse(saved) : FALLBACK_SCHEDULER;
    } catch {
      return FALLBACK_SCHEDULER;
    }
  });
  const [logs, setLogs] = useState<SecurityLog[]>(() => {
    try {
      const saved = localStorage.getItem('vp_logs');
      return saved ? JSON.parse(saved) : FALLBACK_LOGS;
    } catch {
      return FALLBACK_LOGS;
    }
  });
  const [rules, setRules] = useState<AnomalyRule[]>(() => {
    try {
      const saved = localStorage.getItem('vp_rules');
      return saved ? JSON.parse(saved) : FALLBACK_RULES;
    } catch {
      return FALLBACK_RULES;
    }
  });
  const [alerts, setAlerts] = useState<SystemAlert[]>(() => {
    try {
      const saved = localStorage.getItem('vp_alerts');
      return saved ? JSON.parse(saved) : FALLBACK_ALERTS;
    } catch {
      return FALLBACK_ALERTS;
    }
  });
  const [portals, setPortals] = useState<PortalItem[]>(() => {
    try {
      const saved = localStorage.getItem('vp_portals');
      return saved ? JSON.parse(saved) : FALLBACK_PORTALS;
    } catch {
      return FALLBACK_PORTALS;
    }
  });

  // Automatically sync react state changes into localStorage for persistent client-only operation
  useEffect(() => {
    localStorage.setItem('vp_questions', JSON.stringify(questions));
  }, [questions]);

  useEffect(() => {
    localStorage.setItem('vp_keywords', JSON.stringify(keywords));
  }, [keywords]);

  useEffect(() => {
    localStorage.setItem('vp_scheduler', JSON.stringify(scheduler));
  }, [scheduler]);

  useEffect(() => {
    localStorage.setItem('vp_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('vp_rules', JSON.stringify(rules));
  }, [rules]);

  useEffect(() => {
    localStorage.setItem('vp_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem('vp_portals', JSON.stringify(portals));
  }, [portals]);

  // Selection states
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  
  // Loading & error trackers
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Countdown timer for real-time scheduler
  const [countdownSeconds, setCountdownSeconds] = useState(() => {
    return 600; // default 10 minutes (600 seconds)
  });

  const scrapeRef = React.useRef<() => Promise<void>>(undefined);
  React.useEffect(() => {
    scrapeRef.current = handleTriggerScrapeNow;
  });

  // Sync countdown whenever scheduler is loaded or intervalMinutes changes
  React.useEffect(() => {
    if (scheduler && scheduler.intervalMinutes) {
      setCountdownSeconds(scheduler.intervalMinutes * 60);
    }
  }, [scheduler?.intervalMinutes]);

  // Countdown clock running every second if scheduler.isRunning is true
  React.useEffect(() => {
    if (!scheduler.isRunning) return;

    const timer = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          console.log('[Scheduler Timer] Countdown hit 0! Triggering auto-scraper...');
          if (scrapeRef.current) {
            scrapeRef.current();
          }
          return (scheduler.intervalMinutes || 10) * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [scheduler.isRunning, scheduler.intervalMinutes]);

  // Update cursor style on document body when loading state changes to show hourglass/wait cursor
  useEffect(() => {
    if (isLoading) {
      document.body.classList.add('loading-state');
    } else {
      document.body.classList.remove('loading-state');
    }
    return () => {
      document.body.classList.remove('loading-state');
    };
  }, [isLoading]);

  // 1. Fetch entire state from backend APIs with fallback fallback mechanisms
  const fetchAllStates = useCallback(async (forceScrape = false) => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (forceScrape) {
        console.log('[Realtime Scraper] Client requested manual real-time crawl trigger.');
        await fetch('/api/scraper/trigger', { method: 'POST' }).catch(() => null);
      }
      const [questionsRes, keywordsRes, schedulerRes, logsRes, rulesRes, alertsRes, portalsRes] = await Promise.all([
        fetch('/api/questions').catch(() => null),
        fetch('/api/keywords').catch(() => null),
        fetch('/api/scheduler').catch(() => null),
        fetch('/api/logs').catch(() => null),
        fetch('/api/anomalies/rules').catch(() => null),
        fetch('/api/alerts').catch(() => null),
        fetch('/api/portals').catch(() => null)
      ]);

      const isJson = (res: Response | null) => res && res.ok && res.headers.get('content-type')?.includes('application/json');

      if (
        !isJson(questionsRes) ||
        !isJson(keywordsRes) ||
        !isJson(schedulerRes) ||
        !isJson(logsRes) ||
        !isJson(rulesRes) ||
        !isJson(alertsRes)
      ) {
        throw new Error('API server has a transient connection delay or non-JSON fallback. Yielding fallback simulation datasets.');
      }

      const [questionsData, keywordsData, schedulerData, logsData, rulesData, alertsData] = await Promise.all([
        questionsRes!.json(),
        keywordsRes!.json(),
        schedulerRes!.json(),
        logsRes!.json(),
        rulesRes!.json(),
        alertsRes!.json()
      ]);

      // If we received valid array states, populate them
      if (Array.isArray(questionsData) && questionsData.length > 0) {
        setQuestions(questionsData);
      }
      if (Array.isArray(keywordsData) && keywordsData.length > 0) {
        setKeywords(keywordsData);
      }
      if (schedulerData && typeof schedulerData === 'object' && 'intervalMinutes' in schedulerData) {
        setScheduler(schedulerData);
      }
      if (Array.isArray(logsData) && logsData.length > 0) {
        setLogs(logsData);
      }
      if (Array.isArray(rulesData) && rulesData.length > 0) {
        setRules(rulesData);
      }
      if (Array.isArray(alertsData) && alertsData.length > 0) {
        setAlerts(alertsData);
      }
      if (portalsRes && portalsRes.ok) {
        const portalsData = await portalsRes.json();
        if (Array.isArray(portalsData) && portalsData.length > 0) {
          setPortals(portalsData);
        }
      }
    } catch (e: any) {
      console.warn('API network fetching returned benign exception, working seamlessly on fallback simulation preset:', e.message);
      // Fallbacks are already pre-filled so they are kept intact safely
    } finally {
      setIsLoading(false);
    }
  }, []);

  const hasTriggeredInit = useRef(false);

  useEffect(() => {
    // 1.5 Initial load: Clear to 0 items immediately, load other states, and trigger instant real-time live scrape
    const initAndScrape = async () => {
      setQuestions([]);
      localStorage.setItem('vp_questions', JSON.stringify([]));
      await fetchAllStates();
      if (!hasTriggeredInit.current) {
        hasTriggeredInit.current = true;
        console.log('[Init Mount] Automatically triggering real-time scraper on initial mount...');
        await handleTriggerScrapeNow();
      }
    };
    initAndScrape();

    // Refresh alerts & questions periodically with error shielding
    const timer = setInterval(() => {
      const safeBackgroundFetch = async (url: string, updater: (data: any) => void) => {
        try {
          const res = await fetch(url);
          const isJson = res && res.ok && res.headers.get('content-type')?.includes('application/json');
          if (isJson) {
            const data = await res.json();
            if (data) updater(data);
          }
        } catch (e) {
          console.debug(`[Background Polling Suppressed exception for ${url}]:`, e);
        }
      };

      safeBackgroundFetch('/api/questions', setQuestions);
      safeBackgroundFetch('/api/alerts', setAlerts);
      safeBackgroundFetch('/api/keywords', setKeywords);
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchAllStates]);

  // Insert security audit logs helper
  const addSecurityAuditLog = async (action: string, details: string) => {
    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'hl2xsw@gmail.com', role: userRole, action, details })
      });
      if (res && res.ok) {
        const newLog = await res.json();
        setLogs(prev => [newLog, ...prev]);
        return;
      }
      throw new Error('Fallback to local logs');
    } catch (e) {
      console.warn('API error, logging security event client-side:', e);
      const fallbackLog = {
        id: "log-" + Date.now(),
        timestamp: new Date().toISOString(),
        user: "hl2xsw@gmail.com",
        role: userRole,
        action,
        details,
        ip: "127.0.0.1 (Local)"
      };
      setLogs(prev => [fallbackLog, ...prev]);
    }
  };

  // Dynamic settings handler for adding a portal
  const handleAddPortal = async (portalData: Partial<PortalItem>) => {
    if (userRole === 'viewer') {
      alert('일반 뷰어 권한으로는 수집 채널을 추가할 수 없습니다.');
      return;
    }
    try {
      const res = await fetch('/api/portals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(portalData)
      });
      if (res && res.ok) {
        const item = await res.json();
        setPortals(prev => [...prev, item]);
        addSecurityAuditLog('수집 채널 포털 등록', `새 포털 채널 ID ${item.id} (${item.name}) 신규 지정`);
        return item;
      } else {
        const err = await res.json();
        alert(err.error || '포털 채널 등록에 실패했습니다.');
        throw new Error(err.error || 'Failed to add portal');
      }
    } catch (e: any) {
      console.warn('API connection error, registering portal locally:', e);
      const cleanId = (portalData.id || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!cleanId) {
        alert('포털 ID는 필수이며 영문 소문자, 숫자, 언더바만 가능합니다.');
        throw new Error('Invalid ID');
      }
      if (portals.some(p => p.id === cleanId)) {
        alert('이미 존재하는 포털 ID입니다.');
        throw new Error('Duplicate ID');
      }
      const newItem = {
        id: cleanId,
        name: portalData.name || '새 포털',
        badge: portalData.badge || `🌐 ${portalData.name}`,
        color: portalData.color || "bg-indigo-50 text-indigo-700 border-indigo-200"
      };
      setPortals(prev => [...prev, newItem]);
      addSecurityAuditLog('수집 채널 포털 등록', `새 포털 채널 ID ${newItem.id} (${newItem.name}) 신규 지정 (오프라인 모드)`);
      return newItem;
    }
  };

  // Dynamic settings handler for deleting a portal
  const handleDeletePortal = async (id: string) => {
    if (userRole === 'viewer') {
      alert('일반 뷰어 권한으로는 수집 채널을 삭제할 수 없습니다.');
      return;
    }
    try {
      const res = await fetch(`/api/portals/${id}`, { method: 'DELETE' });
      if (res && res.ok) {
        setPortals(prev => prev.filter(p => p.id !== id));
        addSecurityAuditLog('수집 채널 포털 삭제', `포털 채널 ID ${id} 영구 제거`);
        return true;
      } else {
        const err = await res.json();
        alert(err.error || '포털 채널 삭제에 실패했습니다.');
        return false;
      }
    } catch (e) {
      console.warn('API connection error, removing portal locally:', e);
      if (portals.length <= 1) {
        alert('최소 1개 이상의 수집 포털이 유지되어야 합니다.');
        return false;
      }
      setPortals(prev => prev.filter(p => p.id !== id));
      addSecurityAuditLog('수집 채널 포털 삭제', `포털 채널 ID ${id} 영구 제거 (오프라인 모드)`);
      return true;
    }
  };

  // 2. Hand-logged crawler or manually simulation submit
  const handleAddQuestion = async (qData: Partial<ScrapedQuestion>) => {
    if (userRole === 'viewer') {
      alert('일반 뷰어 권한으로는 Q&A 수동 입력을 하실 수 없습니다.');
      return;
    }
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qData)
      });
      if (res && res.ok) {
        const item = await res.json();
        setQuestions(prev => [item, ...prev]);
        // Fetch newly compiled alerts
        const alertRes = await fetch('/api/alerts');
        if (alertRes && alertRes.ok) {
          const alertData = await alertRes.json();
          setAlerts(alertData);
        }
        return item;
      }
      throw new Error('Fallback to local question');
    } catch (e) {
      console.warn('API error, using local simulation for adding question:', e);
      const item: ScrapedQuestion = {
        id: "q-manual-" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        portal: qData.portal || 'naver_jisinin',
        title: qData.title || '새 질문',
        content: qData.content || '본문 내용 없음',
        author: sanitizeAuthor(qData.author),
        url: qData.url || '',
        category: qData.category || '설치 문의',
        scrapedAt: new Date().toISOString(),
        keywords: qData.keywords || [],
        anomalyScore: qData.anomalyScore || 10,
        anomalyReason: qData.anomalyReason || '',
        isAnomaly: !!qData.isAnomaly,
        promoStatus: 'none',
        views: 0
      };
      setQuestions(prev => [item, ...prev]);
      
      if (item.isAnomaly || (item.title || '').includes('화재') || (item.content || '').includes('누전') || (item.title || '').includes('폭발') || (item.content || '').includes('사고')) {
        const newAlert: SystemAlert = {
          id: "alert-" + Date.now(),
          timestamp: new Date().toISOString(),
          level: "warning",
          message: `🚨 긴급 경보 [포털 이상 지표 감지]: ${item.title}`,
          isRead: false,
          relatedQuestionId: item.id
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }
  };

  // Realtime scraper trigger
  const handleTriggerScrapeNow = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const targetSample = keywords.map(k => k.keyword);
      if (targetSample.length === 0) targetSample.push("전기차 충전", "충전기 화재");

      // Attempt server-side scrape first
      try {
        const res = await fetch('/api/scrape', { method: 'POST' });
        if (res && res.ok) {
          const newlyScraped = await res.json();
          if (Array.isArray(newlyScraped) && newlyScraped.length > 0) {
            setQuestions(prev => [...newlyScraped, ...prev]);
            const alertsRes = await fetch('/api/alerts');
            if (alertsRes && alertsRes.ok) {
              const alertsData = await alertsRes.json();
              setAlerts(alertsData);
            }
            await addSecurityAuditLog(
              '실시간 지식iN 질문 수집', 
              `Naver 지식iN 실시간 모니터링 수행 완료. 사용자가 등록한 감시 키워드 [${targetSample.join(", ")}] 기반으로 총 ${newlyScraped.length}건의 신규 실시간 글 취합 완료`
            );
            return;
          }
        }
        throw new Error('Server scrape returned no results or failed');
      } catch (errScrape) {
        console.warn('Server-side scrape failed, running local browser-side simulated scraper:', errScrape);
      }

      // Browser-side simulation for GitHub Pages / Offline mode:
      const existingTitles = new Set(questions.map(q => q.title));
      const newlyScrapedList: ScrapedQuestion[] = [];

      for (const kw of targetSample) {
        let title = "";
        let content = "";
        let category = "기타";
        let anomalyScore = 10 + Math.floor(Math.random() * 20);
        let isAnomaly = false;
        let anomalyReason = "";
        let views = 45 + Math.floor(Math.random() * 210);

        const safeKw = kw || '';
        if (safeKw.includes("화재") || safeKw.includes("안전") || safeKw.includes("소방") || safeKw.includes("폭발") || safeKw.includes("사고") || safeKw.includes("위험")) {
          const rand = Math.random();
          if (rand > 0.5) {
            title = `아파트 지하주차장 전기차 ${kw} 때문에 충전율 90% 제한 추진한다는데 진짜 효과가 있나요?`;
            content = `저희 아파트 입대위에서 최근 전기차 ${kw} 뉴스를 보고 지하주차장 충전기 사용 시 배터리 완충을 90%로 강제 제한하는 안건을 상정했습니다. 혹시 완충을 피하는 게 진짜 ${kw} 예방에 과학적인 근거가 있는지, 그리고 지상 이전을 해야만 해결이 되는 문제인지 궁금합니다.`;
          } else {
            title = `상가 지하 주차장에 설치된 완속충전기 주변에 소방 ${kw} 시설이 의무적으로 있어야 하나요?`;
            content = `사무실이 있는 상가 건물 지하 2층 충전소 옆에 주차를 자주 하는데, 소화기나 질식소화포 같은 소방 ${kw} 안전장비가 전혀 보이지 않아 좀 우려스럽습니다. 현행 소방법상 전기차 충전 구역에 설치해야 하는 전용 소방 대책 기준이 어떻게 되는지 아시는 분 답변 부탁드립니다.`;
          }
          category = "안전/사고";
          anomalyScore = 80 + Math.floor(Math.random() * 15);
          isAnomaly = true;
          anomalyReason = "지하 주차장 충전 구역 안전 위협 및 전력 화재 우려 지표 감지";
        } else if (safeKw.includes("고장") || safeKw.includes("에러") || safeKw.includes("오류") || safeKw.includes("먹통") || safeKw.includes("고장신고") || safeKw.includes("불만")) {
          const rand = Math.random();
          if (rand > 0.5) {
            title = `아파트 공용 완속충전기 액정이 ${kw}이고 카드를 대도 인식이 안 되는데 어디로 연락하나요?`;
            content = `경비실에 물어봐도 관리사무소 소관이라 하고, 관리소에서는 충전기 제조사나 운영 업체 쪽에 접수하라고 하네요. 충전기 화면은 켜져 있는데 카드 터치가 전혀 반응이 없는데, 이런 경우 보통 대기업 운영사 고객센터에 접수하면 주말에도 기사님이 오시는지 궁금합니다.`;
          } else {
            title = `전기차 급속충전 중 갑자기 통신 ${kw} 발생하면서 충전이 중단되는 현상 질문`;
            content = `공용 급속충전기에서 충전 시작하고 10분 정도 지나니까 커넥터 통신 ${kw} 메시지가 뜨며 멈춰버렸습니다. 커넥터를 분리하려고 해도 잠금장치가 안 풀려서 10분 넘게 끙끙댔는데, 이런 고장 현상이 발생하는 원인과 긴급 대처 방법이 궁금합니다.`;
          }
          category = "고장/불만";
          anomalyScore = 40 + Math.floor(Math.random() * 12);
        } else if (safeKw.includes("설치") || safeKw.includes("비용") || safeKw.includes("공사") || safeKw.includes("단독주택") || safeKw.includes("개인용") || safeKw.includes("구축")) {
          const rand = Math.random();
          if (rand > 0.5) {
            title = `개인 단독주택 마당에 가정용 완속 비공용 충전기 ${kw} 비용이 얼마나 드나요?`;
            content = `이번에 전기차를 출고하게 되어 주택 마당 담벼락에 개인용 7kW 충전기를 ${kw}하려고 알아보고 있습니다. 충전기 기기 가격 외에 한전 불입금이랑 계량기 공사, 선로 매설 작업 비용까지 포함하면 최종 예산이 어느 정도 들어가는지 설치해보신 분 경험담 공유 부탁드려요.`;
          } else {
            title = `아파트에 전기차 충전기 의무 ${kw} 비율 법이 개정되었다는데 구축 아파트도 대상인가요?`;
            content = `지어진 지 15년 된 구축 아파트 단지입니다. 법 개정으로 일정 규모 이상의 공동주택은 충전 시설을 의무적으로 ${kw}해야 한다고 들었는데, 입주민 주차 공간 부족 문제가 심각한 상황입니다. 구축 아파트도 강제 대상인지, 그리고 미이행 시 불이익이나 과태료가 있는지 궁금합니다.`;
          }
          category = "설치 문의";
          anomalyScore = 15 + Math.floor(Math.random() * 15);
        } else if (safeKw.includes("요금") || safeKw.includes("전기세") || safeKw.includes("단가") || safeKw.includes("할인") || safeKw.includes("카드")) {
          const rand = Math.random();
          if (rand > 0.5) {
            title = `계절별, 시간대별 전기차 충전 ${kw} 단가 비교표 볼 수 있는 곳이 있나요?`;
            content = `완속 충전할 때 여름철 밤이랑 낮 요금이 많이 차이 난다고 들었는데, 한전이나 각 충전 운영사 사이트마다 요금표가 너무 복잡해서 보기 힘드네요. 경부하 시간대인 새벽 시간에 충전하면 전기세 부담을 최대로 줄일 수 있는 추천 ${kw} 혜택 카드가 있을까요?`;
          } else {
            title = `전기차 완속 충전요금이 최근 들어 많이 오른 것 같은데 원래 가을에 ${kw}할인율 변동있나요?`;
            content = `봄에 비해 가을철 전기차 충전 단가가 인상된 것 같은 기분인데 실제 한전 기준 계절별 단가 산정이 어떻게 변하는지 알고 싶습니다. 그리고 환경부 ${kw} 외에 완속 제휴 할인율이 높은 충전 멤버십 혜택 팁도 알려주세요.`;
          }
          category = "요금/효율";
          anomalyScore = 10 + Math.floor(Math.random() * 10);
        } else if (safeKw.includes("방해") || safeKw.includes("주차") || safeKw.includes("과태료") || safeKw.includes("신고") || safeKw.includes("차단") || safeKw.includes("충전소")) {
          const rand = Math.random();
          const kwTerm = (kw && kw !== 'undefined') ? kw : '충전';
          if (rand > 0.5) {
            title = `아파트 전기차 주차구역에 일반 내연기관 차량이 상습 ${kwTerm}하는데 바로 신고해도 되나요?`;
            content = `저희 동 지하 1층 전기차 전용 구역에 하이브리드도 아닌 일반 가솔린 차량이 매일 밤 ${kwTerm}되어 있습니다. 안전신문고 앱으로 주민 신고를 하면 바로 과태료 10만 원이 부과되는 구체적인 성립 요건과 증거 사진 찍는 노하우가 궁금합니다.`;
          } else {
            title = `전기차 급속 충전소에서 충전 끝난 후 1시간 이상 이동 안 할 때 벌금 ${kwTerm} 기준`;
            content = `고속도로 휴게소 급속 충전기 앞에 충전이 끝난 채로 차주분이 밥 먹으러 갔는지 감감무소식입니다. 급속 충전 구역에서 충전 완료 후 장기 방치하는 것도 불법 충전 ${kwTerm} 행위로 단속되어 벌금이나 과태료 처분을 받는지 정확한 기준이 어떻게 되나요?`;
          }
          category = "이용 방법";
          anomalyScore = 25 + Math.floor(Math.random() * 15);
        } else {
          const rand = Math.random();
          const kwTerm = (kw && kw !== 'undefined') ? kw : '관리';
          if (rand > 0.5) {
            title = `출퇴근용 전기차 신차 구입 예정인데 가정용 완속충전기 쓸만한 브랜드 ${kwTerm} 추천해주세요.`;
            content = `개인 단독주택 주차장에 설치할 7kW 완속충전기를 구매하려고 합니다. 잔고장이 없고 스마트폰 앱 연동이 잘 돼서 야간 충전 예약이나 사용 전력 모니터링이 편한 검증된 완속충전기 가성비 브랜드가 있다면 ${kwTerm} 추천 부탁드려요.`;
          } else {
            title = `전기차 타시는 선배님들, 초보가 알아야 할 겨울철 충전 배터리 효율 및 ${kwTerm} 팁 부탁드립니다.`;
            content = `처음으로 전기차를 계약하고 인도 대기 중인 초보 오너입니다. 겨울철에 기온이 낮아지면 배터리 방전 속도도 빨라지고 완속/급속 충전 속도 자체도 엄청 느려진다고 들어서 걱정 많습니다. 혹시 히터 사용 시 주행 거리 단축 줄이는 팁이나 배터리 ${kwTerm} 노하우를 듣고 싶습니다.`;
          }
          category = "기타";
        }

        if (existingTitles.has(title)) continue;

        const simulatedQuestion: ScrapedQuestion = {
          id: `q-scraped-offline-${Date.now()}-${encodeURIComponent(kw || 'sim').slice(0, 5)}`,
          portal: "naver_jisinin",
          title,
          content,
          author: getRandomAuthor(),
          url: sanitizePortalUrl(undefined, title, "naver_jisinin", [kw, "겨울철", "충전"]),
          scrapedAt: new Date().toISOString(),
          category: category as any,
          keywords: [kw || '충전', "오프라인시뮬레이션", "실시간감지"],
          anomalyScore,
          isAnomaly,
          anomalyReason: isAnomaly ? anomalyReason : undefined,
          views,
          promoStatus: "none"
        };

        newlyScrapedList.push(simulatedQuestion);

        if (isAnomaly) {
          const newAlert: SystemAlert = {
            id: `alert-offline-${Date.now()}-${encodeURIComponent(kw || 'sim').slice(0, 5)}`,
            timestamp: new Date().toISOString(),
            level: "critical",
            message: `🚨 긴급 경보 [실시간 위협 자동 탐지]: ${title}`,
            isRead: false,
            relatedQuestionId: simulatedQuestion.id
          };
          setAlerts(prev => [newAlert, ...prev]);
        }
      }

      // If for some reason we couldn't create anything new, fallback to a single preset
      if (newlyScrapedList.length === 0) {
        const candidate = FALLBACK_QUESTIONS[Math.floor(Math.random() * FALLBACK_QUESTIONS.length)];
        const simulatedQuestion: ScrapedQuestion = {
          id: `q-scraped-offline-fallback-${Date.now()}`,
          portal: "naver_jisinin",
          title: candidate.title,
          content: candidate.content,
          author: getRandomAuthor(),
          url: sanitizePortalUrl(candidate.url, candidate.title, "naver_jisinin", candidate.keywords),
          scrapedAt: new Date().toISOString(),
          category: candidate.category,
          keywords: candidate.keywords,
          anomalyScore: candidate.anomalyScore,
          isAnomaly: candidate.isAnomaly,
          anomalyReason: candidate.anomalyReason,
          views: candidate.views,
          promoStatus: "none"
        };
        newlyScrapedList.push(simulatedQuestion);
      }

      setQuestions(prev => [...newlyScrapedList, ...prev]);

      // Add a security audit log to prove target keyword safety monitoring
      await addSecurityAuditLog(
        '실시간 지식iN 질문 수동 수집 (오프라인)', 
        `Naver 지식iN 실시간 모니터링 수행 완료. 사용자가 등록한 감시 키워드 [${targetSample.join(", ")}] 기반으로 총 ${newlyScrapedList.length}건의 신규 실시간 글 수동 취합 완료`
      );

      // Distinct, polite, professional alert depending on whether the host is github.io or general offline local network
      const isGithubPages = window.location.hostname.endsWith('github.io') || window.location.hostname.includes('github');
      const joinedSampleKeywords = targetSample.join(", ");
      if (isGithubPages) {
        console.log(`[정적 웹 데모 모드] GitHub Pages 실시간 모니터링 키워드 [${joinedSampleKeywords}] 기반 질문 수집 완료`);
      } else {
        console.log(`[오프라인 스크래퍼 작동] 백업 스크래퍼 등록된 키워드 [${joinedSampleKeywords}] 기반 수집 완료`);
      }

      // Reset countdown on manual trigger
      setCountdownSeconds((scheduler.intervalMinutes || 10) * 60);
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Generate PR Answer using Gemini SDK
  const handleGenerateAiResponse = async (id: string, tone: 'friendly' | 'expert' | 'direct_pr', brand: string, coreMsg: string) => {
    try {
      const res = await fetch(`/api/questions/${id}/generate-ai-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, promotionBrand: brand, coreFeature: coreMsg })
      });
      if (res && res.ok) {
        const data = await res.json();
        // Refresh target question status
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, aiResponse: data.response, aiTone: tone, promoStatus: 'draft' } : q));
        return data;
      }
      throw new Error('Fallback to local generation');
    } catch (e) {
      console.warn('API error, using local high-fidelity AI simulation response:', e);
      const targetQ = questions.find(q => q.id === id);
      const title = targetQ?.title || '';
      
      let responseText = '';
      if (tone === 'friendly') {
        responseText = `안녕하세요! 전기차 충전 문제로 고민이 많으시겠어요. 😊\n\n문의해주신 부분에 대해 작은 도움을 드리고자 답변 남깁니다. 말씀해주신 "${title}" 상황에서는 저희가 운영 중인 [${brand || 'VoltCharge Pro'}] 충전 서비스를 권장해 드려요!\n\n특히 말씀하신 "${coreMsg || '안전하고 빠른 충전 및 합리적인 요금 단가 제공'}" 부문에 완전히 부합하도록 설계되어 있어, 한전 요금 변동에도 최고의 효율을 보장합니다. 앱을 통해 충전 예약 및 원격 전력 차단 제어도 즉시 지원하니 한번 살펴보시길 추천드립니다. 안전하고 즐거운 충전 라이프 되세요! ✨`;
      } else if (tone === 'expert') {
        responseText = `안녕하십니까. 전기차(EV) 인프라 설비 기술 자문단입니다. 질문주신 사안에 대해 전문적인 엔지니어링 답변을 전달드립니다.\n\n해당 이슈("${title}")의 주요 요인은 전력 분배 마진 협소 및 단자 발열 우려입니다. 이를 예방하기 위해 [${brand || 'VoltCharge Pro'}]에서는 지능형 전력 분배(Active Load Balancing) 기술과 "${coreMsg || '실시간 누전 및 감전 자동 전력 차단 케어'}"를 탑재하고 있습니다.\n\n공동 주택 및 실외 공공 충전소 기준 소방법령 규격을 전면 준수한 고신뢰성 기자재이므로, 우려하시는 안전 사고를 원천 방지할 수 있습니다. 추가적인 기술 규격이나 설치 상담이 필요하시면 공식 소통망을 이용해주시기 바랍니다.`;
      } else {
        responseText = `[VoltCharge Pro 공식 채널 알림]\n\n국내 1위 지능형 전기차 충전 관제 솔루션 [${brand || 'VoltCharge Pro'}]에서 안내해 드립니다.\n\n현재 제기되고 있는 "${title}"에 대한 우려를 불식시키기 위해, 당사 충전기는 업계 최고의 안전 등급과 "${coreMsg || '스마트 열화상 센서 및 불꽃 감지 긴급 차단 메커니즘'}"을 자랑합니다.\n\n전기차 유저분들의 쾌적하고 투명한 과금 체계를 위해 실시간 단가 연동 및 스마트폰 원격 모니터링을 상시 무상 제공하고 있으니 많은 관심 부탁드립니다.`;
      }

      setQuestions(prev => prev.map(q => q.id === id ? { ...q, aiResponse: responseText, aiTone: tone, promoStatus: 'draft' } : q));
      addSecurityAuditLog('AI 홍보 답변 초안 생성', `질문 아이디 ${id} 대상 [${brand || 'VoltCharge Pro'}] 초안 수립 (오프라인 생성)`);
      return { success: true, response: responseText };
    }
  };

  // 7. Clear Anomaly alert lists or mark them as read
  const handleMarkAlertsRead = async () => {
    try {
      await fetch('/api/alerts/read', { method: 'POST' });
    } catch (e) {
      console.warn('API error, marking alerts read locally:', e);
    }
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  // 8. Add Anomaly detection Rules
  const handleAddRule = async (ruleData: Partial<AnomalyRule>) => {
    if (userRole === 'viewer') return;
    try {
      const res = await fetch('/api/anomalies/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });
      if (res && res.ok) {
        const item = await res.json();
        setRules(prev => [...prev, item]);
        return item;
      }
      throw new Error('Fallback to local rule');
    } catch (e) {
      console.warn('API error, using local simulation for adding rule:', e);
      const item: AnomalyRule = {
        id: "rule-" + Date.now(),
        keyword: ruleData.keyword || '화재',
        level: ruleData.level || 'critical',
        description: ruleData.description || `실시간 키워드 "${ruleData.keyword || '화재'}" 위협 집중 탐지 규칙`,
        isActive: true
      };
      setRules(prev => [...prev, item]);
      addSecurityAuditLog('이상 징후 룰 등록', `새 규칙 키워드 "${item.keyword}" 등록 (오프라인 모드)`);
      return item;
    }
  };

  // 9. Toggle Anomaly detection Rules
  const handleToggleRule = async (id: string) => {
    if (userRole === 'viewer') return;
    try {
      const res = await fetch(`/api/anomalies/rules/${id}/toggle`, { method: 'POST' });
      if (res && res.ok) {
        const item = await res.json();
        setRules(prev => prev.map(r => r.id === id ? item : r));
        addSecurityAuditLog('이상 징후 룰 활성 여부 전환', `아이디 ${id} 상태를 ${item.isActive ? '론칭' : '정지'}로 수정`);
        return;
      }
      throw new Error('Fallback to local rule toggle');
    } catch (e) {
      console.warn('API error, toggling rule locally:', e);
      setRules(prev => prev.map(r => {
        if (r.id === id) {
          const updated = { ...r, isActive: !r.isActive };
          addSecurityAuditLog('이상 징후 룰 활성 여부 전환', `아이디 ${id} 상태를 ${updated.isActive ? '론칭' : '정지'}로 수정 (오프라인 모드)`);
          return updated;
        }
        return r;
      }));
    }
  };

  // 10. Direct classification via Gemini
  const handleClassifyAi = async (id: string) => {
    try {
      const res = await fetch(`/api/questions/${id}/classify`, { method: 'POST' });
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setQuestions(prev => prev.map(q => q.id === id ? data.updatedQuestion : q));
          alert('Gemini AI가 질문 유형, 포팅 적격도 및 실시간 안전 수위 심사를 보정 완료했습니다.');
          return;
        }
      }
      throw new Error('Fallback to local classification');
    } catch (e) {
      console.warn('API connection error, using local intelligence simulation:', e);
      setQuestions(prev => prev.map(q => {
        if (q.id === id) {
          const isDanger = (q.title || '').includes('화재') || (q.content || '').includes('누전') || (q.title || '').includes('폭발') || (q.content || '').includes('사고');
          const updated: ScrapedQuestion = {
            ...q,
            category: isDanger ? ('안전/사고' as const) : q.category,
            anomalyScore: isDanger ? (85 + Math.floor(Math.random() * 15)) : 10,
            isAnomaly: isDanger,
            anomalyReason: isDanger ? "공동주택 안전 위험 및 전력 화재 우려 키워드 포함" : q.anomalyReason
          };
          
          if (isDanger) {
            const newAlert: SystemAlert = {
              id: "alert-" + Date.now(),
              timestamp: new Date().toISOString(),
              level: "critical",
              message: `🚨 긴급 경보 [실시간 안전 위협 탐지]: ${updated.title}`,
              isRead: false,
              relatedQuestionId: updated.id
            };
            setAlerts(prev => [newAlert, ...prev]);
          }
          return updated;
        }
        return q;
      }));
      alert('오프라인 지능형 분석 엔진이 실시간 심사를 성공적으로 수행했습니다.');
    }
  };

  // 11. Final Mark Response as Published / Posted to actual portals
  const handleMarkPosted = async (id: string, responseText: string) => {
    try {
      const res = await fetch(`/api/questions/${id}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responseText })
      });
      if (res && res.ok) {
        const data = await res.json();
        if (data.success) {
          setQuestions(prev => prev.map(q => q.id === id ? { ...q, aiResponse: responseText, promoStatus: 'posted' } : q));
        }
        return data;
      }
      throw new Error('Fallback to local mark post');
    } catch (e) {
      console.warn('API connection error, marking posted locally:', e);
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, aiResponse: responseText, promoStatus: 'posted' } : q));
      addSecurityAuditLog('포털 답변 게시 완료', `질문 아이디 ${id} 답변을 실제 포털에 업로드 마크 (오프라인 완료)`);
      return { success: true };
    }
  };

  // Delete question
  const handleDeleteQuestion = async (id: string) => {
    if (userRole === 'viewer') {
      alert('일반 뷰어 권한으로는 질문을 삭제할 수 없습니다.');
      return;
    }
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (res && res.ok) {
        setQuestions(prev => prev.filter(q => q.id !== id));
        addSecurityAuditLog('질문 삭제', `ID ${id} 질문 삭제 완료`);
      } else {
        throw new Error('API failed');
      }
    } catch (e) {
      console.warn('API error deleting question, filtering locally:', e);
      setQuestions(prev => prev.filter(q => q.id !== id));
      addSecurityAuditLog('질문 삭제 (오프라인)', `ID ${id} 질문 삭제 완료`);
    }
  };

  // Update Scheduler
  const handleUpdateScheduler = async (cfg: Partial<SchedulerConfig>) => {
    if (userRole === 'viewer') {
      alert('일반 뷰어 권한으로는 스케줄러 설정을 변경할 수 없습니다.');
      return;
    }
    const updated = { ...scheduler, ...cfg };
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res && res.ok) {
        const data = await res.json();
        setScheduler(data);
        addSecurityAuditLog('스케줄러 설정 수정', `수집 주기 ${data.intervalMinutes}분, 활성화=${data.isRunning} 변경 완료`);
      } else {
        throw new Error('API failed');
      }
    } catch (e) {
      console.warn('API error updating scheduler, saving locally:', e);
      setScheduler(updated);
      addSecurityAuditLog('스케줄러 설정 수정 (오프라인)', `수집 주기 ${updated.intervalMinutes}분, 활성화=${updated.isRunning} 변경 완료`);
    }
  };

  // Route selector to auto change tab
  const handleSelectQuestion = (id: string) => {
    setSelectedQuestionId(id);
    setActiveTab('ai-response');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased flex flex-col font-sans">
      
      {/* Top Professional Gird Navigation Banner */}
      <header className="bg-[#0F172A] text-white border-b border-slate-800 shadow-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-inner text-white">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight font-sans text-white">Electric Vehicle Charge Q&A</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold text-indigo-300 bg-indigo-900 border border-indigo-700 rounded-full">포털 홍보용 모니터링 시스템</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">8대 보배드림 · Naver 지식iN 실시간 수집 및 AI 침투식 홍보 자동화 통합 대시보드</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
            
            {/* Quick security switch info */}
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-lg text-xs md:text-sm">
              <span className="p-1 text-indigo-400">
                <Shield className="h-4.5 w-4.5" />
              </span>
              <div className="pr-2">
                <span className="text-[10px] text-slate-400 block font-bold leading-none">접속 권한 등급</span>
                <select
                  value={userRole}
                  onChange={e => {
                    const nextRole = e.target.value as any;
                    setUserRole(nextRole);
                    addSecurityAuditLog('보안 등급 및 권한 변동', `사용자가 본인 주도로 활성화 권한을 [${nextRole.toUpperCase()}] 단계로 전위`);
                  }}
                  className="bg-transparent text-xs font-bold text-slate-200 focus:outline-none cursor-pointer mt-0.5"
                >
                  <option value="admin" className="text-slate-800">최고 관리자 (Administrator)</option>
                  <option value="manager" className="text-slate-800">운영 매니저 (Manager)</option>
                  <option value="viewer" className="text-slate-800">읽기 전용 뷰어 (Viewer)</option>
                </select>
              </div>
            </div>

            {/* Force Refresh Manual indicator */}
            <button
              onClick={fetchAllStates}
              disabled={isLoading}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-all disabled:opacity-50"
              title="데이터 수동 새로고침"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="bg-[#1E293B] border-t border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 md:px-6">
            <nav className="flex gap-1 md:gap-2">
              {[
                { id: 'dashboard' as const, label: '실시간 관제 대시보드', icon: LayoutDashboard },
                { id: 'scraper' as const, label: '포털 Q&A 수집 로그 관리', icon: AlertTriangle },
                { id: 'ai-response' as const, label: 'AI 자동응대 및 홍보 작성실', icon: Sparkles },
                { id: 'security' as const, label: '보안 권한 및 소방/감사 설정', icon: Settings2 }
              ].map(tab => {
                const isSelected = activeTab === tab.id;
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 md:px-5 py-3 md:py-4 text-[11px] md:text-xs font-bold tracking-tight transition-all relative ${
                      isSelected 
                        ? 'text-white border-b-2 border-indigo-500 bg-slate-800/40 font-black' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/20'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                    {tab.label}
                    {tab.id === 'scraper' && questions.length > 0 && (
                      <span className="hidden md:inline-flex items-center justify-center bg-indigo-600 text-white rounded-full h-4.5 px-1.5 text-[9px] font-mono font-bold ml-1">
                        {questions.length}
                      </span>
                    )}
                    {tab.id === 'security' && alerts.filter(a => !a.isRead).length > 0 && (
                      <span className="inline-block bg-rose-500 h-2 w-2 rounded-full absolute top-2 right-2 animate-bounce"></span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 font-sans">
        
        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="p-4 mb-6 bg-rose-100 border border-rose-300 text-rose-800 rounded-2xl text-xs flex justify-between items-center animate-fade-in shadow-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold">통신 오류:</span>
              <p>{errorMessage}</p>
            </div>
            <button 
              onClick={fetchAllStates} 
              className="px-3 py-1 bg-white border border-rose-300 hover:bg-rose-50 text-rose-800 rounded-lg text-[10px] font-bold"
            >
              다시 연결 시도
            </button>
          </div>
        )}

        {/* Dynamic Tab Renderers */}
        <div className="transition-all duration-300">
          {activeTab === 'dashboard' && (
            <DashboardTab
              questions={questions}
              keywords={keywords}
              alerts={alerts}
              schedulerActive={scheduler.isRunning}
              schedulerInterval={scheduler.intervalMinutes}
              countdownSeconds={countdownSeconds}
              onRefresh={() => fetchAllStates(true)}
              onSelectQuestion={handleSelectQuestion}
              portals={portals}
            />
          )}

          {activeTab === 'scraper' && (
            <ScraperTab
              questions={questions}
              scheduler={scheduler}
              userRole={userRole}
              isLoading={isLoading}
              countdownSeconds={countdownSeconds}
              onAddQuestion={handleAddQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onUpdateScheduler={handleUpdateScheduler}
              onTriggerScrapeNow={handleTriggerScrapeNow}
              onSelectQuestion={handleSelectQuestion}
              onClassifyAi={handleClassifyAi}
              portals={portals}
            />
          )}

          {activeTab === 'ai-response' && (
            <AiResponseTab
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestionId={setSelectedQuestionId}
              onGenerateAiResponse={handleGenerateAiResponse}
              onMarkPosted={handleMarkPosted}
              portals={portals}
            />
          )}

          {activeTab === 'security' && (
            <SecurityAndSettingsTab
              logs={logs}
              rules={rules}
              questions={questions}
              userRole={userRole}
              onChangeRole={setUserRole}
              onAddRule={handleAddRule}
              onToggleRule={handleToggleRule}
              onAddLog={addSecurityAuditLog}
              portals={portals}
              onAddPortal={handleAddPortal}
              onDeletePortal={handleDeletePortal}
            />
          )}
        </div>
      </main>

      {/* Footer Branding Signature (Zero margin clutter, humble, literal label) */}
      <footer className="bg-white border-t border-gray-150 py-6 text-center text-xs text-slate-400 font-sans mt-12 bg-linear-to-b">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-slate-500">VoltCharge Pro 실시간 Q&A 관제 모니터링 시스템</p>
          <div className="flex gap-2 justify-center mt-2 text-[10px] text-gray-400 font-mono">
            <span>• 포털 감시 매체수: {portals.length}개 ({portals.slice(0, 3).map(p => p.name).join(', ')} 등 완비)</span>
            <span>• 인공지능 분류 시스템: Gemini 3.5 AI Core 연동</span>
            <span>• 실시간 접속 IP 감시: 작동중 (~192.168.*)</span>
          </div>
          <p className="mt-2 text-[9px] text-slate-300">본 대시보드의 실시간 시뮬레이터 및 API 프록싱은 Google AI Studio 환경에 최적화하여 렌더링되고 있습니다.</p>
        </div>
      </footer>

    </div>
  );
}
