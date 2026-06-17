import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { ScrapedQuestion, KeywordTrend, SchedulerConfig, SecurityLog, AnomalyRule, SystemAlert, PortalType } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Database State
let scrapedQuestions: ScrapedQuestion[] = [
  {
    id: "q-1",
    portal: "naver_jisinin",
    title: "아파트 500세대 충전기 신규 설치 규정 질문입니다",
    content: "아파트 입주자대표회의에서 친환경자동차법 규정 때문에 전기차 충전기 설치 의무 비율을 충족해야 한다는데, 완속충전기랑 급속충전기 비율을 어떻게 맞추는 게 입주민들에게 유리할까요? 그리고 정부보조금 받을 파트너 업체 추천 바랍니다.",
    author: "지식인초보",
    url: "https://kin.naver.com/qna/detail.naver?d1id=8&dirId=811&docId=469382103",
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
    portal: "bobae_dream",
    title: "아파트 주차장 충전 완료됐는데 차 안 빼는 차주 참교육",
    content: "완충된 지 벌써 15시간 넘었는데 차지 제자리에 그대로 꽂아두고 방치 중이네요. 경고 문자 보냈는데도 씹어서 아파트 차량 방해 벌금 신고 진행하려 합니다. 요즘 전기차 몰상식한 사람들 왜 이리 많은가요?",
    author: "마력상승1",
    url: "https://www.bobaedream.co.kr/view?code=freeb&No=202619",
    scrapedAt: new Date(Date.now() - 3600000 * 4.2).toISOString(),
    category: "고장/불만",
    keywords: ["충전 방해", "주차 매너", "충전 완료 방치", "벌금 신고"],
    anomalyScore: 45,
    isAnomaly: false,
    promoStatus: "none",
    views: 450
  },
  {
    id: "q-3",
    portal: "dcinside",
    title: "전기차 급속 충전하는데 80% 근처에서 속도 왜 갑자기 똥망하냐?",
    content: "원래 100kW 넘게 찍히다가 80퍼 가까이 차니까 속도가 20kW 이하로 급격하게 떨어지는데 이거 충전 기계 고장인가요 아니면 내 배터리가 하자 있는 건가요? 충전소 사장님 물어보고 싶은데 연락 안 됨.",
    author: "배터리빌런",
    url: "https://gall.dcinside.com/board/view/?id=ev&no=88721",
    scrapedAt: new Date(Date.now() - 3600000 * 5.8).toISOString(),
    category: "이용 방법",
    keywords: ["급속 충전", "충전 속도 저하", "배터리 보호", "고장 의심"],
    anomalyScore: 25,
    isAnomaly: false,
    aiResponse: "안녕하세요! 질문하신 충전 속도 저하 현상은 고장이 아니라 전기차 탑재 배터리(BMS)의 안전 설계 때문입니다. 리튬이온 배터리는 80%를 넘으면 과열과 성능 과부하를 예방하기 위해 충전 속도를 급격히 제어하는 단계(CC-CV 전환)를 거치게 됩니다. 따라서 급속 충전 시 80% 근처까지만 이용하시는 것이 시간과 요금을 모두 절약하는 효율적인 이용 팁입니다.",
    aiTone: "friendly",
    promoStatus: "draft",
    views: 290
  },
  {
    id: "q-4",
    portal: "naver_cafe",
    title: "지하 주차장 충전기 화재 예방 패드나 소화기 의무 설치 대상인가요?",
    content: "최근에 전기차 화재 사고 뉴스 보고 너무 무서워졌습니다. 저희 아파트 입주민 단톡방에서도 난리가 났는데, 지하주차장 충전기에 질식소화포나 소화 설비를 필수로 달아야 하는지 법제화가 이미 끝났는지 궁금해요. 화재 예방 특허 있는 충전기 회사 제품으로 변경 요청을 해야 하나 걱정입니다.",
    author: "EV안전제일",
    url: "https://cafe.naver.com/electriccar/90382",
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
    portal: "daum_tip",
    title: "공공기관 전기차 충전기 고장 나면 어디 고장신고 하나요?",
    content: "근처 주민센터 공영주차장 완속 충전기 액정이 꺼져 있고 카드를 태그해도 인식이 전혀 안 되더라고요. 주민센터 직원한테 물어보니 자기 관할 아니라고 하는데 신속하게 해결하는 곳이 어디인가요?",
    author: "민원왕",
    url: "https://tip.daum.net/question/109827",
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
    portal: "fmkorea",
    title: "야간 아파트 충전소 요금이 주간보다 확실히 싼가요? 전기세 한전 요금표 정리된 거 있냐?",
    content: "전기차 뽑은 지 일주일 차 뉴비인데 밤 11시 이후 경부하 시간대에 충전하면 정말 누진세 안 붙고 싸게 먹히는 건지요? 아파트 공용 요금 고지서 보니까 봄철 가을철 여름철 요금이 다 다르고 복잡해서 이해가 안 가네요.",
    author: "충전비절약맨",
    url: "https://m.fmkorea.com/best/6792348",
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
    portal: "inven",
    title: "전기차 충전케이블 피복 벗겨져 구리선 보이는데 꽂아도 됨?",
    content: "회사 야외 주차장 구석에 있는 충전기 케이블 선이 보도블럭에 여러 번 쓸려서 그런지 내부 주황색 피복에 상처나서 구리선 같은 금속선이 좀 보이네요. 오늘 비가 부슬부슬 내리는데 충전 켜도 안전사고 문제없을까요?",
    author: "게임하다왔음",
    url: "https://www.inven.co.kr/board/ev/5391/1042",
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
    portal: "daum_cafe",
    title: "전기 트럭 탑차 산 다음에 완속 충전기 전용 단독주택 설치 견적 조언",
    content: "시골 주택 마당 구석에 개인용 홈패드 7kW 충전기 설치하려면 한전에 내야 하는 불입금이랑 계량기 별도로 파는 견적 비용이 대략 얼마 정도 드는지 선배님들의 자택 설치 경험담 좀 부탁드립니다.",
    author: "익명트럭맨",
    url: "https://cafe.daum.net/ev-truck/3982",
    scrapedAt: new Date(Date.now() - 3600000 * 30.1).toISOString(),
    category: "설치 문의",
    keywords: ["단독주택 충전기", "한전 불입금", "7kW 완속", "개인용 홈패드"],
    anomalyScore: 12,
    isAnomaly: false,
    promoStatus: "none",
    views: 145
  }
];

let keywordTrends: KeywordTrend[] = [
  { word: "전기차 충전기", count: 320, sentiment: "neutral", trendRate: 15.4 },
  { word: "급속충전", count: 245, sentiment: "positive", trendRate: 8.2 },
  { word: "완속충전", count: 189, sentiment: "positive", trendRate: 12.1 },
  { word: "화재 예방", count: 154, sentiment: "negative", trendRate: 34.5 },
  { word: "충전 방해", count: 142, sentiment: "negative", trendRate: -4.2 },
  { word: "설치 의무", count: 98, sentiment: "positive", trendRate: 5.8 },
  { word: "충전 비용", count: 87, sentiment: "neutral", trendRate: 18.0 },
  { word: "고장 신고", count: 72, sentiment: "negative", trendRate: 2.1 }
];

let schedulerConfig: SchedulerConfig = {
  isRunning: true,
  intervalMinutes: 15,
  lastRun: new Date(Date.now() - 600000).toISOString(),
  nextRun: new Date(Date.now() + 300000).toISOString(),
  targetKws: ["전기차 충전기", "충전기 고장", "충전기 화재", "아파트 충전기", "완속충전기 추천"]
};

let securityLogs: SecurityLog[] = [
  {
    id: "log-1",
    timestamp: new Date(Date.now() - 3600000 * 0.2).toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "시스템 로그인 및 활동 시작",
    details: "관리자 ID로 웹 대시보드 브라우저 접속 완료",
    ip: "192.168.1.10"
  },
  {
    id: "log-2",
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "실시간 스크래핑 스케줄 수정",
    details: "수집 검색어 설정 업데이트 및 수집 주기 변경 (30분 -> 15분)",
    ip: "192.168.1.10"
  },
  {
    id: "log-3",
    timestamp: new Date(Date.now() - 3600000 * 5.0).toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "권한 변경 성공",
    details: "데이터 보안에 따른 관리 수준 및 접근 권한 설정",
    ip: "192.168.1.10"
  },
  {
    id: "log-4",
    timestamp: new Date(Date.now() - 3600000 * 12.0).toISOString(),
    user: "managerKey",
    role: "manager",
    action: "상세 보고서 생성 완료",
    details: "전기차 Q&A 및 이상징후 보고 데이터 엑셀/PDF 포맷 다운로드 트리거",
    ip: "192.168.2.45"
  }
];

let anomalyRules: AnomalyRule[] = [
  { id: "rule-1", keyword: "화재", level: "critical", description: "화재 사고, 불, 연기, 스파크 발생에 대한 질문 집중 모니터링", isActive: true },
  { id: "rule-2", keyword: "케이블 훼손", level: "critical", description: "도선 노출, 감전 사고 위험성이 보이는 전기 케이블 피복 훼손 언급", isActive: true },
  { id: "rule-3", keyword: "침수", level: "warning", description: "빗물 유입, 지하주차장 누수 등으로 누전 우려 상황 감지", isActive: true },
  { id: "rule-4", keyword: "고장 방치", level: "warning", description: "특정 충전소 고장 신고 후 3일 이상 무반응 방치 불만 이슈화", isActive: true }
];

let systemAlerts: SystemAlert[] = [
  {
    id: "alert-1",
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    level: "critical",
    message: "구리선 노출 케이블 감전 위험 글 감지 - 인벤 (관리자 대응 요망)",
    isRead: false,
    relatedQuestionId: "q-7"
  },
  {
    id: "alert-2",
    timestamp: new Date(Date.now() - 3600000 * 8.0).toISOString(),
    level: "warning",
    message: "지하 주차장 충전기 화재 예방 등 불안감 이슈 증폭 보고 - 네이버 카페",
    isRead: false,
    relatedQuestionId: "q-4"
  }
];

// Lazy initialize Gemini API client securely
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      console.log("Gemini SDK initialized successfully via GEMINI_API_KEY.");
    } else {
      console.warn("No GEMINI_API_KEY found. Operating in local simulator mode.");
    }
  }
  return aiClient;
}

// REST API Endpoints

// 1. Get Questions
app.get("/api/questions", (req, res) => {
  const { portal, category, search, priority, isAnomaly } = req.query;
  let filtered = [...scrapedQuestions];

  if (portal) {
    filtered = filtered.filter(q => q.portal === portal);
  }
  if (category) {
    filtered = filtered.filter(q => q.category === category);
  }
  if (isAnomaly === "true") {
    filtered = filtered.filter(q => q.isAnomaly);
  }
  if (search) {
    const searchLow = (search as string).toLowerCase();
    filtered = filtered.filter(
      q => q.title.toLowerCase().includes(searchLow) ||
           q.content.toLowerCase().includes(searchLow) ||
           q.author.toLowerCase().includes(searchLow)
    );
  }

  // Sort: most recent first
  filtered.sort((a, b) => new Date(b.scrapedAt).getTime() - new Date(a.scrapedAt).getTime());
  res.json(filtered);
});

// 2. Add Hand-logged / Custom Crawled Q&A
app.post("/api/questions", (req, res) => {
  const { portal, title, content, author, url, category, keywords } = req.body;
  if (!portal || !title || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Evaluate default anomaly logic
  let isAnomaly = false;
  let anomalyReason = "";
  let anomalyScore = Math.floor(Math.random() * 25); // Baseline randomized safety coefficient

  const contentAndTitle = (title + " " + content).toLowerCase();
  
  // Rule checks
  if (contentAndTitle.includes("화재") || contentAndTitle.includes("불") || contentAndTitle.includes("연기") || contentAndTitle.includes("전쟁")) {
    isAnomaly = true;
    anomalyScore = 85;
    anomalyReason = "화재/안전 우려 키워드 발각에 다른 시스템 위기 경고";
  } else if (contentAndTitle.includes("구리") || contentAndTitle.includes("피복") || contentAndTitle.includes("감전") || contentAndTitle.includes("짜릿")) {
    isAnomaly = true;
    anomalyScore = 95;
    anomalyReason = "피복 노출 및 인체 감전 사망 위험 기여 키워드 자동 탐지";
  } else if (contentAndTitle.includes("고장") || contentAndTitle.includes("안됨") || contentAndTitle.includes("에러")) {
    anomalyScore = 50;
  }

  const newQ: ScrapedQuestion = {
    id: "q-" + (scrapedQuestions.length + 1) + "_" + Math.floor(Math.random() * 1000),
    portal: portal as PortalType,
    title,
    content,
    author: author || "수집봇",
    url: url || "https://example.com/mock-portal-question",
    scrapedAt: new Date().toISOString(),
    category: category || "기타",
    keywords: keywords || ["수동 수집", "전기차"],
    anomalyScore,
    isAnomaly,
    anomalyReason: isAnomaly ? anomalyReason : undefined,
    promoStatus: "none",
    views: Math.floor(Math.random() * 50) + 1
  };

  scrapedQuestions.unshift(newQ);

  if (isAnomaly) {
    const newAlert: SystemAlert = {
      id: "alert-" + Date.now(),
      timestamp: new Date().toISOString(),
      level: anomalyScore > 80 ? "critical" : "warning",
      message: `[이상징후 자동감지] ${portal}에서 긴급 이상 항목 포착: "${title}"`,
      isRead: false,
      relatedQuestionId: newQ.id
    };
    systemAlerts.unshift(newAlert);
  }

  // Log Security Activity
  const log: SecurityLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "실시간 강제 크롤링 트리거 Q&A 누적",
    details: `신규 Q&A 수동 수집: [${portal}] ${title}`,
    ip: "127.0.0.1"
  };
  securityLogs.unshift(log);

  res.status(201).json(newQ);
});

// 3. AI Generated Promotion Response via Gemini SDK
app.post("/api/questions/:id/generate-ai-reply", async (req, res) => {
  const { id } = req.params;
  const { tone, promotionBrand, coreFeature } = req.body;
  const question = scrapedQuestions.find(q => q.id === id);

  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  const brandName = promotionBrand || "VoltCharge Pro (볼트차지 프로)";
  const coreMsg = coreFeature || "스마트 부하분산 기술로 전기 증설 요금 80% 저감, 3초 화재 감출 감지 특허 탑재, 전국 24H 전담 서비스 센터 운영";

  const systemPrompt = `전기차 충전기 브랜드를 홍보하고 신뢰감 주는 Q&A 전문 응대 마케터 역할을 수행합니다.
질문자의 글을 바탕으로, 자연스럽고 진심으로 도움을 주면서 우리 브랜드인 '${brandName}' 제품을 부드럽게 홍보해 주세요.
반드시 한국어로 자연스럽게 작성하며 홍보를 과도하게 우겨넣지 않고 문제 해결책을 먼저 제시해야 합니다.

우리 브랜드 강점 핵심 팁: ${coreMsg}

톤 옵션:
- friendly: 친근하고 다정한 네이버 블로그/지식인 답변 분위기 (~해요 체)
- expert: 전문적이고 공신력 있는 프리미엄 컨설턴트 느낌 (~입니다 체)
- direct_pr: 질문의 니즈를 즉각 충족시키고 다이렉트 무상 견적 신청을 유도하는 비즈니스 홍보 분위기

출력은 오직 한국어로 쓰인 답변 텍스트 결과 본문만 나오게 하십시오. 인사말과 맺음말을 조화롭게 포함하세요.`;

  const userPrompt = `포털 사이트: ${question.portal}
제목: ${question.title}
본문 내용: ${question.content}

선택한 답변 톤: ${tone || 'expert'}`;

  const ai = getAiClient();
  if (ai) {
    try {
      console.log(`Sending query to Gemini for question [${id}] - Model: gemini-3.5-flash`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `${systemPrompt}\n\n[질문 및 가이드]\n${userPrompt}`,
      });
      
      const generatedText = response.text || "답변을 추출 중 오류가 발생했습니다.";
      question.aiResponse = generatedText;
      question.aiTone = tone;
      question.promoStatus = "draft";

      // Log security record
      const aclLog: SecurityLog = {
        id: "log-" + Date.now(),
        timestamp: new Date().toISOString(),
        user: "hl2xsw@gmail.com",
        role: "admin",
        action: "AI 응대 자동화 답변 초안 생산",
        details: `Gemini API 호출 성공: [${brandName}] 기반 Q&A 응대 초안 마련`,
        ip: "127.0.0.1"
      };
      securityLogs.unshift(aclLog);

      return res.json({ success: true, response: generatedText });
    } catch (err: any) {
      console.error("Gemini request failed: ", err);
      // Fallback response generator in case API key fails
      const fallbackText = getMockReply(question, tone, brandName, coreMsg);
      question.aiResponse = fallbackText;
      question.aiTone = tone;
      question.promoStatus = "draft";
      return res.json({ success: true, response: fallbackText, note: "Local simulator fallback triggered (No active paid key response)" });
    }
  } else {
    // Non-key fallback
    const fallbackText = getMockReply(question, tone, brandName, coreMsg);
    question.aiResponse = fallbackText;
    question.aiTone = tone;
    question.promoStatus = "draft";
    return res.json({ success: true, response: fallbackText, note: "Offline simulated mode generation successful" });
  }
});

// Help generate offline simulated responses
function getMockReply(q: ScrapedQuestion, tone: string, brand: string, core: string): string {
  const bodyText = `안녕하세요! 친환경 이동수단의 스마트한 동반자, ${brand} 친환경 Q&A 도우미입니다.

질문해 주신 내용("${q.title.substring(0, 20)}...")에 관련해 상세한 답변 드립니다.

완속 및 급속 등 다양한 충전기 설치 인프라 환경에서 화재 예방 및 비용 부담을 획기적으로 줄이는 것이 무엇보다 중요합니다. 이에 적격인 제안을 드립니다.

당사 ${brand}는 "${core}"라는 압도적인 강점들로 무장하여 전국 아파트, 빌라, 상가 주차면 등에 최적의 스마트 인프라를 구축하고 있습니다. 보조금 대행 신청부터 시공, 그리고 A/S 정기 원격 모니터링 관리 서비스까지 논스톱 토탈로 무상 컨설팅 제공합니다.

궁금하신 점이 있거나 전문 견적 및 대행 절차가 필요하시면 언제나 부담 없이 저희 공식 프로모션 지원 센터로 상담 문의 남겨주세요. 감사합니다.`;
  return bodyText;
}

// 4. Trigger AI Question Classification / Keyword Extraction via Gemini SDK
app.post("/api/questions/:id/classify", async (req, res) => {
  const { id } = req.params;
  const question = scrapedQuestions.find(q => q.id === id);
  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `주어진 질문의 본문을 분석하고 JSON 형태로 최적의 카테고리 분류, 핵심 키워드 목록(최대 5개), 그리고 안전성 및 신뢰성 관점에서의 이상 징후 여부(isAnomaly: boolean), 이상 가중치 점수(anomalyScore: 0~100), 이상 징후 사유(anomalyReason: string)를 판단하여 출력하세요.

반드시 지킬 리턴 JSON 형식:
{
  "category": "설치 문의" | "고장/불만" | "요금/효율" | "이용 방법" | "안전/사고" | "기타",
  "keywords": ["단어1", "단어2", "단어3"],
  "isAnomaly": true 또는 false,
  "anomalyScore": 0에서 100 사이의 숫자,
  "anomalyReason": "이상 징후 판단 근거 요약"
}

[분석할 질문 정보]
제목: ${question.title}
본문: ${question.content}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
              isAnomaly: { type: Type.BOOLEAN },
              anomalyScore: { type: Type.INTEGER },
              anomalyReason: { type: Type.STRING }
            },
            required: ["category", "keywords", "isAnomaly", "anomalyScore"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      if (result.category) question.category = result.category;
      if (result.keywords) question.keywords = result.keywords;
      question.isAnomaly = !!result.isAnomaly;
      question.anomalyScore = Number(result.anomalyScore) || 0;
      if (result.anomalyReason) question.anomalyReason = result.anomalyReason;

      if (question.isAnomaly && question.anomalyScore > 65) {
        // Add dynamic system alert
        systemAlerts.unshift({
          id: "alert-" + Date.now(),
          timestamp: new Date().toISOString(),
          level: question.anomalyScore > 85 ? "critical" : "warning",
          message: `[AI 감지 긴급 상황] ${question.portal}에 위험도 ${question.anomalyScore}% 수준의 위기 의심 관측: ${question.anomalyReason}`,
          isRead: false,
          relatedQuestionId: question.id
        });
      }

      const clLog: SecurityLog = {
        id: "log-" + Date.now(),
        timestamp: new Date().toISOString(),
        user: "hl2xsw@gmail.com",
        role: "admin",
        action: "AI 원천 질문 분석&자동 분류 실행",
        details: `Gemini API를 통한 분류 분석 완료. 위험 스코어: ${question.anomalyScore}%`,
        ip: "127.0.0.1"
      };
      securityLogs.unshift(clLog);

      return res.json({ success: true, updatedQuestion: question });
    } catch (e) {
      console.error("Gemini classification failed, using normal rules", e);
    }
  }

  // Fallback if SDK fails or not configured
  question.category = question.title.includes("설치") ? "설치 문의" :
                      question.title.includes("고장") || question.title.includes("안됨") ? "고장/불만" :
                      question.title.includes("요금") || question.title.includes("가격") ? "요금/효율" : "기타";
  question.keywords = [...new Set([...question.keywords, "AI보정", "전기차분석"])];
  res.json({ success: true, updatedQuestion: question, note: "Offline local classifications computed" });
});

// Update promo status (Answers posted to portal simulator)
app.post("/api/questions/:id/post", (req, res) => {
  const { id } = req.params;
  const { responseText } = req.body;
  const question = scrapedQuestions.find(q => q.id === id);
  if (!question) {
    return res.status(404).json({ error: "Question not found" });
  }

  question.promoStatus = "posted";
  if (responseText) {
    question.aiResponse = responseText;
  }

  // Log activity
  const log: SecurityLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "질문 답변 포털 포스팅 업로드 상태 기록",
    details: `실제 포털(${question.portal}) 대응 포스팅을 완료로 변경 처리 마킹`,
    ip: "127.0.0.1"
  };
  securityLogs.unshift(log);

  res.json({ success: true, updatedQuestion: question });
});

// Delete mock question for maintenance convenience
app.delete("/api/questions/:id", (req, res) => {
  const { id } = req.params;
  const index = scrapedQuestions.findIndex(q => q.id === id);
  if (index !== -1) {
    const deleted = scrapedQuestions[index];
    scrapedQuestions.splice(index, 1);

    const log: SecurityLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "hl2xsw@gmail.com",
      role: "admin",
      action: "Q&A 수집 기록 격리/삭제",
      details: `데이터 백오프 정리 작업: [${deleted.portal}] ${deleted.title}`,
      ip: "127.0.0.1"
    };
    securityLogs.unshift(log);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Not found" });
});

// 5. Keyword analytic endpoints
app.get("/api/keywords", (req, res) => {
  res.json(keywordTrends);
});

app.post("/api/keywords", (req, res) => {
  const { word } = req.body;
  if (!word) {
    return res.status(400).json({ error: "Missing word parameter" });
  }
  const lowWord = word.trim();
  const exists = keywordTrends.find(kw => kw.word === lowWord);
  if (exists) {
    exists.count += 5;
    return res.json(exists);
  }

  const newKw: KeywordTrend = {
    word: lowWord,
    count: 1,
    sentiment: lowWord.includes("불안") || lowWord.includes("화재") || lowWord.includes("부족") ? "negative" : "positive",
    trendRate: +(Math.random() * 20).toFixed(1)
  };
  keywordTrends.push(newKw);

  // Sync scheduled crawl topics
  if (!schedulerConfig.targetKws.includes(lowWord)) {
    schedulerConfig.targetKws.push(lowWord);
  }

  const log: SecurityLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "분석용 표적 키워드 사전 등록 추가",
    details: `실시간 API 모니터링 키워드 단어 추가 등록: ${lowWord}`,
    ip: "127.0.0.1"
  };
  securityLogs.unshift(log);

  res.status(201).json(newKw);
});

app.delete("/api/keywords/:word", (req, res) => {
  const { word } = req.params;
  const index = keywordTrends.findIndex(kw => kw.word === word);
  if (index !== -1) {
    keywordTrends.splice(index, 1);
    schedulerConfig.targetKws = schedulerConfig.targetKws.filter(x => x !== word);

    const log: SecurityLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: "hl2xsw@gmail.com",
      role: "admin",
      action: "모니터링 표적 키워드 감시 해제",
      details: `실시간 키워드 해제 단어: ${word}`,
      ip: "127.0.0.1"
    };
    securityLogs.unshift(log);
    return res.json({ success: true });
  }
  res.status(404).json({ error: "Keyword not found" });
});

// 6. Scheduler Management
app.get("/api/scheduler", (req, res) => {
  res.json(schedulerConfig);
});

app.post("/api/scheduler", (req, res) => {
  const { isRunning, intervalMinutes, targetKws } = req.body;
  
  if (typeof isRunning === "boolean") schedulerConfig.isRunning = isRunning;
  if (intervalMinutes) schedulerConfig.intervalMinutes = Number(intervalMinutes);
  if (Array.isArray(targetKws)) schedulerConfig.targetKws = targetKws;

  schedulerConfig.lastRun = new Date().toISOString();
  schedulerConfig.nextRun = new Date(Date.now() + schedulerConfig.intervalMinutes * 60000).toISOString();

  // Handle auto generation of questions if scheduler is run
  if (schedulerConfig.isRunning) {
    simulateScraperTrigger();
  }

  const log: SecurityLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "크롤링 데몬 모니터링 스케줄링 설정 튜닝",
    details: `예약 수집 데몬 튜닝: 활성화=${schedulerConfig.isRunning}, 주기=${schedulerConfig.intervalMinutes}분, 키워드풀 크기=${schedulerConfig.targetKws.length}개`,
    ip: "127.0.0.1"
  };
  securityLogs.unshift(log);

  res.json(schedulerConfig);
});

// Simulation helper to gather newer posts when scheduler runs
function simulateScraperTrigger() {
  const portals: PortalType[] = ['naver_jisinin', 'naver_cafe', 'bobae_dream', 'dcinside', 'fmkorea', 'inven', 'daum_cafe', 'daum_tip'];
  const titles = [
    "급속 충전소 카드 결제 인식 안되는 버그 해결하신 분?",
    "VoltCharge 충전기 저희 상가건물에 설치하고 싶은데 수익배분 가능한가요?",
    "소형 충전기 화재소화 설비 비치해야 하나요? 입대위 의견 대립",
    "이동형 케이블 트렁크 상시 보관 및 아파트 도전 행위 법적 자문",
    "한전 파워풀 보조금 개인 주택 주거용 완속 설치비 견적 공유 받아요",
  ];
  const contents = [
    "카드 결제 단말기 터치가 먹통이고 오류 코드 E-03 뜨네요. 지난 주에도 이러더만 관리자 업체 어디인지 연락도 안되고 주차요금만 버리고 갑니다.",
    "상가 공용 주차공간에 자리가 남아서 설치하려 합니다. 입주민 단골 고객 마케팅용으로 스마트 부하분산이 지원되는 브랜드로 컨설팅 해 주실 회사 있을까요?",
    "지하 설치 규정이 한층 까다로워졌다는데 자체 열폭주 방지 제어기가 장착된 친환경 전용 충전기에 대한 지원을 우선 추진하는 것이 안전할까요?",
    "비상용 완속 충전케이블인데 피복 부분이 살짝 구부러지고 갈라졌습니다. 테이프로 칭칭 감아서 단독주택 기둥형 콘센트에 계속 충전해도 버텨줄지 검토 요청해요.",
    "화재 센서와 24H 전담 CS 서비스 콜 센터망이 잘 되어 있어 주민 분쟁 소지가 없는 스마트 홈 세트 전용 충전 솔루션을 찾아보고 있습니다. 추천 부탁 드립니다.",
  ];

  const categories = ["고장/불만", "설치 문의", "안전/사고", "안전/사고", "설치 문의"] as const;

  const rndIdx = Math.floor(Math.random() * titles.length);
  const portalIdx = Math.floor(Math.random() * portals.length);

  const randKw = schedulerConfig.targetKws[Math.floor(Math.random() * schedulerConfig.targetKws.length)] || "전기차";
  
  const p = portals[portalIdx];
  const title = titles[rndIdx];
  const content = contents[rndIdx];

  const textLower = (title + " " + content).toLowerCase();
  let isAnomaly = false;
  let anomalyScore = Math.floor(Math.random() * 25);
  let anomalyReason = "";

  if (textLower.includes("화재") || textLower.includes("의견 대립") || textLower.includes("소화")) {
    isAnomaly = true;
    anomalyScore = 78;
    anomalyReason = "아파트 입대위 소방 안전 분쟁 및 위기 우려";
  } else if (textLower.includes("피복") || textLower.includes("도전") || textLower.includes("갈라")) {
    isAnomaly = true;
    anomalyScore = 92;
    anomalyReason = "누전 화재 유발 위험 높은 훼손 케이블 방치 경고";
  }

  const newQ: ScrapedQuestion = {
    id: "q-auto-" + Date.now(),
    portal: p,
    title,
    content,
    author: "크롤링감지봇",
    url: "https://example.com/live-crawler-detected",
    scrapedAt: new Date().toISOString(),
    category: categories[rndIdx],
    keywords: [randKw, "스마트_수집", "실시간트렌드"],
    anomalyScore,
    isAnomaly,
    anomalyReason: isAnomaly ? anomalyReason : undefined,
    promoStatus: "none",
    views: 12
  };

  scrapedQuestions.unshift(newQ);

  if (isAnomaly) {
    systemAlerts.unshift({
      id: "alert-" + Date.now(),
      timestamp: new Date().toISOString(),
      level: anomalyScore > 85 ? "critical" : "warning",
      message: `[자동 스케줄 감지] ${p} 긴급 위기 징후 발견: ${newQ.title}`,
      isRead: false,
      relatedQuestionId: newQ.id
    });
  }

  // Update real-time keyword analytic values slightly
  const kwEntry = keywordTrends.find(k => k.word === randKw);
  if (kwEntry) {
    kwEntry.count += 1;
    kwEntry.trendRate = +(kwEntry.trendRate + Math.random() * 4).toFixed(1);
  }
}

// 7. Security Logs
app.get("/api/logs", (req, res) => {
  res.json(securityLogs);
});

app.post("/api/logs", (req, res) => {
  const { user, role, action, details } = req.body;
  const newLog: SecurityLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: user || "unknown",
    role: role || "viewer",
    action: action || "작업 수행",
    details: details || "",
    ip: req.ip || "unknown"
  };
  securityLogs.unshift(newLog);
  res.json(newLog);
});

// 8. Alerts
app.get("/api/alerts", (req, res) => {
  res.json(systemAlerts);
});

app.post("/api/alerts/read", (req, res) => {
  systemAlerts.forEach(a => a.isRead = true);
  res.json({ success: true });
});

// 9. Anomaly Rules
app.get("/api/anomalies/rules", (req, res) => {
  res.json(anomalyRules);
});

app.post("/api/anomalies/rules", (req, res) => {
  const { keyword, level, description } = req.body;
  if (!keyword || !level) {
    return res.status(400).json({ error: "Missing fields" });
  }
  const newRule: AnomalyRule = {
    id: "rule-" + Date.now(),
    keyword,
    level,
    description: description || "자동 생성된 이상 감지 룰",
    isActive: true
  };
  anomalyRules.push(newRule);

  const log: SecurityLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "실시간 이상 탐지 규칙 사전 설계",
    details: `이상 징후 대응 룰 신설: [키워드: ${keyword}] 위험 수준: [${level}]`,
    ip: "127.0.0.1"
  };
  securityLogs.unshift(log);

  res.status(201).json(newRule);
});

app.post("/api/anomalies/rules/:id/toggle", (req, res) => {
  const { id } = req.params;
  const rule = anomalyRules.find(r => r.id === id);
  if (!rule) return res.status(404).json({ error: "Rule not found" });

  rule.isActive = !rule.isActive;
  res.json(rule);
});

// 10. Analytical / Detailed Reports Generator
app.get("/api/reports/detailed", (req, res) => {
  // Compute aggregated numbers for comprehensive download reports
  const totalCollected = scrapedQuestions.length;
  const totalAnomaly = scrapedQuestions.filter(q => q.isAnomaly).length;
  const answered = scrapedQuestions.filter(q => q.promoStatus === "posted").length;
  const pending = scrapedQuestions.filter(q => q.promoStatus !== "posted").length;

  // Distribution by portal
  const portalBreakdown: Record<string, number> = {};
  scrapedQuestions.forEach(q => {
    portalBreakdown[q.portal] = (portalBreakdown[q.portal] || 0) + 1;
  });

  // Distribution by category
  const categoryBreakdown: Record<string, number> = {};
  scrapedQuestions.forEach(q => {
    categoryBreakdown[q.category] = (categoryBreakdown[q.category] || 0) + 1;
  });

  // Log report generation security audit trail
  const log: SecurityLog = {
    id: "log-" + Date.now(),
    timestamp: new Date().toISOString(),
    user: "hl2xsw@gmail.com",
    role: "admin",
    action: "Q&A 모니터링 상세 실적 보고서 생성",
    details: `다운로드용 통합 통계 보고서 취합 성공. 총 수집: ${totalCollected}건`,
    ip: "127.0.0.1"
  };
  securityLogs.unshift(log);

  res.json({
    generatedAt: new Date().toISOString(),
    metrics: {
      totalCollected,
      totalAnomaly,
      answered,
      pending,
      safetyRatio: +((1 - totalAnomaly / (totalCollected || 1)) * 100).toFixed(1)
    },
    portalBreakdown,
    categoryBreakdown,
    topKeywords: keywordTrends.slice(0, 5),
    criticalQuestions: scrapedQuestions.filter(q => q.isAnomaly).map(q => ({
      id: q.id,
      portal: q.portal,
      title: q.title,
      anomalyScore: q.anomalyScore,
      anomalyReason: q.anomalyReason
    }))
  });
});

// Vite Middleware & Static Assets Routing
async function startServer() {
  const isProductionMode = 
    process.env.NODE_ENV === "production" || 
    (typeof __filename !== "undefined" && (__filename.includes("server.cjs") || __filename.includes("dist"))) || 
    !process.env.npm_lifecycle_event?.includes("dev");

  let vite: any;
  if (!isProductionMode) {
    try {
      const { createServer: createViteServer } = await import("vite");
      vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (e) {
      console.error("Failed to load Vite dev server middleware, falling back to static serving:", e);
      // Fallback
      const distPath = path.join(process.cwd(), "dist");
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (isProductionMode: ${isProductionMode})`);
  });

  if (!isProductionMode && vite) {
    server.on("upgrade", (req, socket, head) => {
      vite.ws.handleUpgrade(req, socket, head);
    });
  }
}

startServer();
