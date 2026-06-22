import React from 'react';
import { ScrapedQuestion, KeywordTrend, SystemAlert, PortalItem } from '../types';
import { PORTAL_MAP, CATEGORY_COLORS } from '../lib/constants';
import { Shield, Sparkles, AlertTriangle, RefreshCw, Layers, TrendingUp, Calendar, ExternalLink } from 'lucide-react';

interface DashboardTabProps {
  questions: ScrapedQuestion[];
  keywords: KeywordTrend[];
  alerts: SystemAlert[];
  schedulerActive: boolean;
  schedulerInterval?: number;
  onRefresh: () => void;
  onSelectQuestion: (id: string) => void;
  portals?: PortalItem[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  questions,
  keywords,
  alerts,
  schedulerActive,
  schedulerInterval = 10,
  onRefresh,
  onSelectQuestion,
  portals
}) => {
  // Aggregate Stats
  const totalCount = questions.length;
  const anomalyCount = questions.filter(q => q.isAnomaly).length;
  const postedCount = questions.filter(q => q.promoStatus === 'posted').length;
  const draftCount = questions.filter(q => q.promoStatus === 'draft').length;
  const progressRatio = totalCount ? Math.round(((postedCount + draftCount) / totalCount) * 100) : 0;

  // Portal Distribution
  const portalCounts: Record<string, number> = {};
  questions.forEach(q => {
    portalCounts[q.portal] = (portalCounts[q.portal] || 0) + 1;
  });

  // Category Distribution
  const catCounts: Record<string, number> = {};
  questions.forEach(q => {
    catCounts[q.category] = (catCounts[q.category] || 0) + 1;
  });

  // Calculate Safe Status
  const criticalSafetyScore = totalCount 
    ? Math.max(0, 100 - Math.round((questions.filter(q => q.isAnomaly && q.anomalyScore > 80).length / totalCount) * 100))
    : 100;

  return (
    <div id="dashboard-container" className="space-y-6">
      {/* Real-time Status Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-xl border border-gray-100 shadow-xs gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3.5 w-3.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${schedulerActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${schedulerActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            <h2 className="text-sm font-semibold text-gray-800">
              {schedulerActive ? `실시간 스케줄러 수집 작동 중 (${schedulerInterval}분 주기)` : '수집 스케줄러 일시 정지됨'}
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">네이버, 다음, 디시, 펨코, 인벤, 보배드림 등 8대 매체 전기차 질문 상시 관측</p>
        </div>
        
        <div className="flex gap-2">
          <button
            id="refresh-dashboard-btn"
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-indigo-600 bg-gray-50 hover:bg-indigo-50 border border-gray-200 rounded-lg transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            수집 갱신
          </button>
        </div>
      </div>

      {/* Metric Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:border-gray-300">
          <div className="absolute top-0 right-0 p-3 text-indigo-100">
            <Layers className="h-20 w-20 transform translate-x-4 -translate-y-4" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">누적 수집 Q&A</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{totalCount}</span>
            <span className="text-xs font-semibold text-emerald-600">+{questions.filter(q => {
              const prevDay = Date.now() - 3600000 * 24;
              return new Date(q.scrapedAt).getTime() > prevDay;
            }).length} (오늘)</span>
          </div>
          <p className="text-xs text-slate-500 mt-3 font-medium">8대 주요 커뮤니티 통합 누적</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:border-gray-300">
          <div className="absolute top-0 right-0 p-3 text-rose-100">
            <AlertTriangle className="h-20 w-20 transform translate-x-4 -translate-y-4" />
          </div>
          <span className="text-xs font-semibold text-rose-500 uppercase tracking-wider">이상 징후 긴급 관측</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-rose-600 tracking-tight">{anomalyCount}</span>
            {anomalyCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold text-rose-700 bg-rose-100 rounded animate-pulse">조치 필요</span>
            )}
          </div>
          <p className="text-xs text-rose-500 mt-3 font-medium">화재 우려 · 훼손 감전 의심 키워드</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden transition-all hover:border-gray-300">
          <div className="absolute top-0 right-0 p-3 text-emerald-100">
            <Sparkles className="h-20 w-20 transform translate-x-4 -translate-y-4" />
          </div>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">AI 답변 완료 건수</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-extrabold text-slate-800 tracking-tight">{postedCount}</span>
            <span className="text-xs text-indigo-600">대기/임시 {draftCount}건</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressRatio}%` }}></div>
          </div>
          <p className="text-xs font-mono mt-1 text-right text-slate-500">{progressRatio}% 진행</p>
        </div>

        <div className="bg-slate-950 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute -bottom-6 -right-6 p-3 text-slate-800 opacity-40">
            <Shield className="h-32 w-32" />
          </div>
          <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">충전소 보건 안전율</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white tracking-tight">{criticalSafetyScore}%</span>
            <span className="text-xs text-teal-300">안정 지표</span>
          </div>
          <p className="text-xs text-slate-400 mt-4 leading-relaxed font-sans">
            안전사고 감전/화재 예방 대책을 탑재한 <br />
            VoltCharge 솔루션 효과 시각화
          </p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Portal Share Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-500" />
            포털별 수집 질문 분포 
          </h3>
          <div className="space-y-3.5">
            {(portals && portals.length > 0 
              ? portals 
              : Object.keys(PORTAL_MAP).map(k => ({ id: k, name: PORTAL_MAP[k as keyof typeof PORTAL_MAP]?.name || k, badge: PORTAL_MAP[k as keyof typeof PORTAL_MAP]?.badge || k, color: PORTAL_MAP[k as keyof typeof PORTAL_MAP]?.color }))
            ).map(p => {
              const count = portalCounts[p.id] || 0;
              const maxVal = Math.max(...Object.values(portalCounts), 1);
              const percentage = Math.round((count / (totalCount || 1)) * 100);
              
              return (
                <div key={p.id} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                      {p.badge}
                    </span>
                    <span className="font-mono text-gray-500">{count}건 ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-50 h-2.5 rounded-full overflow-hidden border border-gray-150">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        p.id.includes('naver') ? 'bg-emerald-500' :
                        p.id.includes('daum') ? 'bg-blue-500' :
                        p.id.includes('dcinside') ? 'bg-gray-600' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.round((count / maxVal) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real-time Keyword Frequency */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              급증 Q&A 키워드 분석 (실시간 API)
            </h3>
            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">인기순</span>
          </div>
          <div className="space-y-3">
            {keywords.slice(0, 7).map((kw, i) => {
              const maxCount = Math.max(...keywords.map(k => k.count), 1);
              const pct = Math.round((kw.count / maxCount) * 100);
              
              // Sentiment styling
              const sentimentBadge = 
                kw.sentiment === 'positive' ? '🟢 긍정' :
                kw.sentiment === 'negative' ? '🔴 화재/사정(부정)' : '🟡 정보(중립)';

              return (
                <div key={kw.word} className="p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <span className="text-[10px] text-gray-400 font-mono">#{i+1}</span>
                      {kw.word}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold text-gray-500">{sentimentBadge}</span>
                      <span className="font-mono font-bold text-indigo-600">{kw.count}회</span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        kw.sentiment === 'negative' ? 'bg-rose-500' :
                        kw.sentiment === 'positive' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`} 
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Anomaly Signal Log Monitoring Stream */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-rose-500 animate-pulse" />
            실시간 긴급 소방 안전 및 고장 경보
          </h3>

          <div className="space-y-3 overflow-y-auto flex-1 max-h-[300px]">
            {alerts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50 rounded-xl relative">
                <Shield className="h-8 w-8 text-emerald-500 mb-2" />
                <span className="text-xs font-semibold text-slate-700">안전 지형 맑음</span>
                <p className="text-[10px] text-gray-400 mt-1">지정된 위험 소방/감전 이상징후가 검출되지 상태입니다.</p>
              </div>
            ) : (
              alerts.map(alert => {
                const badgeStyle = 
                  alert.level === 'critical' 
                    ? 'bg-rose-100 text-rose-700 border-rose-300' 
                    : 'bg-amber-100 text-amber-700 border-amber-300';
                
                return (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-xl border text-xs cursor-pointer hover:scale-[1.01] transition-transform ${
                      alert.level === 'critical' ? 'bg-rose-50/50 border-rose-100' : 'bg-amber-50/50 border-amber-100'
                    }`}
                    onClick={() => alert.relatedQuestionId && onSelectQuestion(alert.relatedQuestionId)}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeStyle}`}>
                        {alert.level === 'critical' ? '🚨 긴급 경보' : '⚠️ 우려 알람'}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(alert.timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-800 mb-1">{alert.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-indigo-600 hover:underline">
                      <span>원문 포스팅 분석 및 조치하기</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Categories Bento Row */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">수집 질문 대주제 카테고리 (자동 인덱싱)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(CATEGORY_COLORS).map(([cat, val]) => {
            const count = catCounts[cat] || 0;
            return (
              <div key={cat} className={`p-4 rounded-xl text-center border border-gray-100 ${val.split(' ')[0]}`}>
                <span className="block text-xs font-bold truncate">{cat}</span>
                <span className="block text-2xl font-black mt-2 font-mono">{count}</span>
                <span className="text-[10px] text-gray-500">포스트</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
