export type PortalType = string; // can be 'naver_jisinin' | 'daum_tip' | 'naver_cafe' | 'daum_cafe' | 'dcinside' | 'fmkorea' | 'inven' | 'bobae_dream' | or any custom added portal ID

export interface ScrapedQuestion {
  id: string;
  portal: PortalType;
  title: string;
  content: string;
  author: string;
  url: string;
  scrapedAt: string;
  category: '설치 문의' | '고장/불만' | '요금/효율' | '이용 방법' | '글로벌/트렌드' | '안전/사고' | '기타';
  keywords: string[];
  anomalyScore: number; // 0 - 100
  anomalyReason?: string;
  isAnomaly: boolean;
  aiResponse?: string;
  aiTone?: 'friendly' | 'expert' | 'direct_pr';
  promoStatus: 'none' | 'draft' | 'posted';
  views: number;
}

export interface KeywordTrend {
  word: string;
  count: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  trendRate: number; // percentage change or rate
}

export interface SchedulerConfig {
  isRunning: boolean;
  intervalMinutes: number;
  lastRun: string | null;
  nextRun: string | null;
  targetKws: string[];
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  user: string;
  role: 'admin' | 'manager' | 'viewer';
  action: string;
  details: string;
  ip: string;
}

export interface AnomalyRule {
  id: string;
  keyword: string;
  level: 'critical' | 'warning';
  description: string;
  isActive: boolean;
}

export interface SystemAlert {
  id: string;
  timestamp: string;
  level: 'critical' | 'warning' | 'info';
  message: string;
  isRead: boolean;
  relatedQuestionId?: string;
}

export interface PortalItem {
  id: string;
  name: string;
  badge: string;
  color: string;
}
