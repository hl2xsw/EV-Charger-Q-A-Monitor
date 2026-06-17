import { useState, useEffect, useCallback } from 'react';
import { ScrapedQuestion, KeywordTrend, SchedulerConfig, SecurityLog, AnomalyRule, SystemAlert } from './types';
import { DashboardTab } from './components/DashboardTab';
import { ScraperTab } from './components/ScraperTab';
import { AiResponseTab } from './components/AiResponseTab';
import { SecurityAndSettingsTab } from './components/SecurityAndSettingsTab';
import { LayoutDashboard, Settings2, Sparkles, Shield, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scraper' | 'ai-response' | 'security'>('dashboard');
  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'viewer'>('admin');

  // Backend state payloads
  const [questions, setQuestions] = useState<ScrapedQuestion[]>([]);
  const [keywords, setKeywords] = useState<KeywordTrend[]>([]);
  const [scheduler, setScheduler] = useState<SchedulerConfig>({
    isRunning: false,
    intervalMinutes: 15,
    lastRun: null,
    nextRun: null,
    targetKws: []
  });
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [rules, setRules] = useState<AnomalyRule[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);

  // Selection states
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  
  // Loading & error trackers
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Fetch entire state from backend APIs
  const fetchAllStates = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [questionsRes, keywordsRes, schedulerRes, logsRes, rulesRes, alertsRes] = await Promise.all([
        fetch('/api/questions'),
        fetch('/api/keywords'),
        fetch('/api/scheduler'),
        fetch('/api/logs'),
        fetch('/api/anomalies/rules'),
        fetch('/api/alerts')
      ]);

      if (!questionsRes.ok || !keywordsRes.ok || !schedulerRes.ok || !logsRes.ok || !rulesRes.ok || !alertsRes.ok) {
        throw new Error('API server is boot-strapping, please retry in a moment');
      }

      const [questionsData, keywordsData, schedulerData, logsData, rulesData, alertsData] = await Promise.all([
        questionsRes.json(),
        keywordsRes.json(),
        schedulerRes.json(),
        logsRes.json(),
        rulesRes.json(),
        alertsRes.json()
      ]);

      setQuestions(questionsData);
      setKeywords(keywordsData);
      setScheduler(schedulerData);
      setLogs(logsData);
      setRules(rulesData);
      setAlerts(alertsData);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || '가동중인 백엔드 서비스 연동 지연');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStates();
    // Refresh alerts & questions every 12 seconds to simulate daemon crawler progress
    const timer = setInterval(() => {
      fetch('/api/questions').then(r => r.json()).then(data => setQuestions(data));
      fetch('/api/alerts').then(r => r.json()).then(data => setAlerts(data));
      fetch('/api/keywords').then(r => r.json()).then(data => setKeywords(data));
    }, 12000);
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
      const newLog = await res.json();
      setLogs(prev => [newLog, ...prev]);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Hand-logged crawler or manually simulation submit
  const handleAddQuestion = async (qData: Partial<ScrapedQuestion>) => {
    if (userRole === 'viewer') {
      alert('일반 뷰어 권한으로는 Q&A 수동 입력을 하실 수 없습니다.');
      return;
    }
    const res = await fetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(qData)
    });
    const item = await res.json();
    setQuestions(prev => [item, ...prev]);
    // Fetch newly compiled alerts
    const alertRes = await fetch('/api/alerts');
    const alertData = await alertRes.json();
    setAlerts(alertData);
    return item;
  };

  // 3. Delete Question
  const handleDeleteQuestion = async (id: string) => {
    if (userRole !== 'admin') {
      alert('최고 관리자 수위 이상의 권한을 획득해야 글 삭제가 반영됩니다.');
      return;
    }
    await fetch(`/api/questions/${id}`, { method: 'DELETE' });
    setQuestions(prev => prev.filter(q => q.id !== id));
    addSecurityAuditLog('크롤링 수집 Q&A 삭제', `질문 고유 아이디 ${id} 파기 제거`);
  };

  // 4. Update Crawling Scheduler
  const handleUpdateScheduler = async (cfg: Partial<SchedulerConfig>) => {
    if (userRole === 'viewer') {
      alert('뷰어 계정은 스케줄러 세팅을 변경할 수 없습니다.');
      return;
    }
    const res = await fetch('/api/scheduler', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    });
    const updated = await res.json();
    setScheduler(updated);
    // Refresh questions
    const qRes = await fetch('/api/questions');
    const qData = await qRes.json();
    setQuestions(qData);
  };

  // 5. Trigger Scrape Immediately
  const handleTriggerScrapeNow = async () => {
    if (userRole === 'viewer') return;
    try {
      // Force trigger scheduler
      await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRunning: true })
      });
      alert('매체 질문 수집이 스케줄러 데몬을 통해 즉시 실행되었습니다. 새 포스팅을 자동 취합합니다!');
      fetchAllStates();
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Generate PR Answer using Gemini SDK
  const handleGenerateAiResponse = async (id: string, tone: 'friendly' | 'expert' | 'direct_pr', brand: string, coreMsg: string) => {
    const res = await fetch(`/api/questions/${id}/generate-ai-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone, promotionBrand: brand, coreFeature: coreMsg })
    });
    const data = await res.json();
    
    // Refresh target question status
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, aiResponse: data.response, aiTone: tone, promoStatus: 'draft' } : q));
    return data;
  };

  // 7. Clear Anomaly alert lists or mark them as read
  const handleMarkAlertsRead = async () => {
    await fetch('/api/alerts/read', { method: 'POST' });
    setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
  };

  // 8. Add Anomaly detection Rules
  const handleAddRule = async (ruleData: Partial<AnomalyRule>) => {
    if (userRole === 'viewer') return;
    const res = await fetch('/api/anomalies/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleData)
    });
    const item = await res.json();
    setRules(prev => [...prev, item]);
    return item;
  };

  // 9. Toggle Anomaly detection Rules
  const handleToggleRule = async (id: string) => {
    if (userRole === 'viewer') return;
    const res = await fetch(`/api/anomalies/rules/${id}/toggle`, { method: 'POST' });
    const item = await res.json();
    setRules(prev => prev.map(r => r.id === id ? item : r));
    addSecurityAuditLog('이상 징후 룰 활성 여부 전환', `아이디 ${id} 상태를 ${item.isActive ? '룐칭' : '정지'}로 수정`);
  };

  // 10. Direct classification via Gemini
  const handleClassifyAi = async (id: string) => {
    try {
      const res = await fetch(`/api/questions/${id}/classify`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setQuestions(prev => prev.map(q => q.id === id ? data.updatedQuestion : q));
        alert('Gemini AI가 질문 유형, 포팅 적격도 및 실시간 안전 수위 심사를 보정 완료했습니다.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 11. Final Mark Response as Published / Posted to actual portals
  const handleMarkPosted = async (id: string, responseText: string) => {
    const res = await fetch(`/api/questions/${id}/post`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responseText })
    });
    const data = await res.json();
    if (data.success) {
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, aiResponse: responseText, promoStatus: 'posted' } : q));
    }
    return data;
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
                <h1 className="text-lg font-black tracking-tight font-sans text-white">VoltCharge Q&A</h1>
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
              onRefresh={fetchAllStates}
              onSelectQuestion={handleSelectQuestion}
            />
          )}

          {activeTab === 'scraper' && (
            <ScraperTab
              questions={questions}
              scheduler={scheduler}
              userRole={userRole}
              onAddQuestion={handleAddQuestion}
              onDeleteQuestion={handleDeleteQuestion}
              onUpdateScheduler={handleUpdateScheduler}
              onTriggerScrapeNow={handleTriggerScrapeNow}
              onSelectQuestion={handleSelectQuestion}
              onClassifyAi={handleClassifyAi}
            />
          )}

          {activeTab === 'ai-response' && (
            <AiResponseTab
              questions={questions}
              selectedQuestionId={selectedQuestionId}
              onSelectQuestionId={setSelectedQuestionId}
              onGenerateAiResponse={handleGenerateAiResponse}
              onMarkPosted={handleMarkPosted}
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
            />
          )}
        </div>
      </main>

      {/* Footer Branding Signature (Zero margin clutter, humble, literal label) */}
      <footer className="bg-white border-t border-gray-150 py-6 text-center text-xs text-slate-400 font-sans mt-12 bg-linear-to-b">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-slate-500">VoltCharge Pro 실시간 Q&A 관제 모니터링 시스템</p>
          <div className="flex gap-2 justify-center mt-2 text-[10px] text-gray-400 font-mono">
            <span>• 포털 감시 매체수: 8개 (디시인사이드, FM코리아, 보배드림 등 완비)</span>
            <span>• 인공지능 분류 시스템: Gemini 3.5 AI Core 연동</span>
            <span>• 실시간 접속 IP 감시: 작동중 (~192.168.*)</span>
          </div>
          <p className="mt-2 text-[9px] text-slate-300">본 대시보드의 실시간 시뮬레이터 및 API 프록싱은 Google AI Studio 환경에 최적화하여 렌더링되고 있습니다.</p>
        </div>
      </footer>

    </div>
  );
}
