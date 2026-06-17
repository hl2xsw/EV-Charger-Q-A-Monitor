import React, { useState } from 'react';
import { ScrapedQuestion, SchedulerConfig, PortalType } from '../types';
import { PORTAL_MAP, CATEGORY_COLORS } from '../lib/constants';
import { Search, SlidersHorizontal, Calendar, Plus, Play, Pause, Save, Trash2, ShieldAlert, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface ScraperTabProps {
  questions: ScrapedQuestion[];
  scheduler: SchedulerConfig;
  userRole: 'admin' | 'manager' | 'viewer';
  onAddQuestion: (q: Partial<ScrapedQuestion>) => Promise<any>;
  onDeleteQuestion: (id: string) => Promise<any>;
  onUpdateScheduler: (cfg: Partial<SchedulerConfig>) => Promise<any>;
  onTriggerScrapeNow: () => void;
  onSelectQuestion: (id: string) => void;
  onClassifyAi: (id: string) => Promise<any>;
}

export const ScraperTab: React.FC<ScraperTabProps> = ({
  questions,
  scheduler,
  userRole,
  onAddQuestion,
  onDeleteQuestion,
  onUpdateScheduler,
  onTriggerScrapeNow,
  onSelectQuestion,
  onClassifyAi
}) => {
  // Local state for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPortal, setSelectedPortal] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [onlyAnomalies, setOnlyAnomalies] = useState(false);

  // Local state for Manual link import form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualPortal, setManualPortal] = useState<PortalType>('naver_jisinin');
  const [manualAuthor, setManualAuthor] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualCategory, setManualCategory] = useState<any>('설치 문의');
  const [manualKeywords, setManualKeywords] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local states for Scheduler adjustments
  const [intervalMin, setIntervalMin] = useState(scheduler.intervalMinutes);
  const [newKeyword, setNewKeyword] = useState('');
  const [isSavingSched, setIsSavingSched] = useState(false);

  // Filter logic
  const filteredQuestions = questions.filter(q => {
    const matchesSearch = 
      q.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.author.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPortal = !selectedPortal || q.portal === selectedPortal;
    const matchesCategory = !selectedCategory || q.category === selectedCategory;
    const matchesAnomaly = !onlyAnomalies || q.isAnomaly;

    return matchesSearch && matchesPortal && matchesCategory && matchesAnomaly;
  });

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualContent) return;

    setIsSubmitting(true);
    try {
      const kws = manualKeywords ? manualKeywords.split(',').map(x => x.trim()) : [];
      await onAddQuestion({
        portal: manualPortal,
        title: manualTitle,
        content: manualContent,
        author: manualAuthor || '운영팀수동',
        url: manualUrl || 'http://kin.naver.com',
        category: manualCategory,
        keywords: kws
      });
      // Reset form
      setManualTitle('');
      setManualContent('');
      setManualKeywords('');
      setManualAuthor('');
      setManualUrl('');
      setShowManualForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleScheduler = async () => {
    if (userRole === 'viewer') return;
    try {
      await onUpdateScheduler({ isRunning: !scheduler.isRunning });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSchedulerRange = async () => {
    if (userRole === 'viewer') return;
    setIsSavingSched(true);
    try {
      await onUpdateScheduler({ intervalMinutes: Number(intervalMin) });
      alert('스케줄러 수집 주기가 저장되었습니다.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingSched(false);
    }
  };

  const handleAddKeywordTag = async () => {
    if (!newKeyword.trim() || userRole === 'viewer') return;
    const cleanWord = newKeyword.trim();
    if (scheduler.targetKws.includes(cleanWord)) return;

    try {
      const updatedList = [...scheduler.targetKws, cleanWord];
      await onUpdateScheduler({ targetKws: updatedList });
      // update backend keyword analytics automatically
      await fetch('/api/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: cleanWord })
      });
      setNewKeyword('');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemoveKeywordTag = async (word: string) => {
    if (userRole === 'viewer') return;
    try {
      const updatedList = scheduler.targetKws.filter(w => w !== word);
      await onUpdateScheduler({ targetKws: updatedList });
      // Delete from analytic pool
      await fetch(`/api/keywords/${encodeURIComponent(word)}`, { method: 'DELETE' });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      
      {/* Sidebar: Scheduler Configurations */}
      <div className="xl:col-span-1 space-y-6">
        
        {/* Scheduler Dashboard Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Calendar className="h-4.5 w-4.5 text-indigo-500" />
              수집 스케줄러 설정
            </h3>
            <span className={`h-2.5 w-2.5 rounded-full ${scheduler.isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`}></span>
          </div>

          {/* Running Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
            <div>
              <span className="text-xs font-bold text-slate-700">시뮬레이션 스케줄러</span>
              <p className="text-[10px] text-gray-400 mt-0.5">{scheduler.isRunning ? '상시 작동 중' : '정지 상태'}</p>
            </div>
            <button
              onClick={handleToggleScheduler}
              disabled={userRole === 'viewer'}
              className={`p-2 rounded-lg transition-all ${
                scheduler.isRunning 
                  ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' 
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
              title={scheduler.isRunning ? "크롤러 멈추기" : "크롤러 구동하기"}
            >
              {scheduler.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>

          {/* Interval setting */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase">수집 주기 설정 (분 단위)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="5"
                max="1440"
                value={intervalMin}
                onChange={e => setIntervalMin(Number(e.target.value))}
                disabled={userRole === 'viewer'}
                className="w-full text-xs p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleSaveSchedulerRange}
                disabled={userRole === 'viewer' || intervalMin === scheduler.intervalMinutes}
                className="p-2 border border-gray-200 bg-gray-50 hover:bg-slate-100 rounded-lg transition-colors text-xs text-gray-700 font-medium"
              >
                <Save className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 space-y-1 bg-slate-50 p-2.5 rounded-lg font-mono">
            <div>• 최근 실행: {scheduler.lastRun ? new Date(scheduler.lastRun).toLocaleTimeString('ko-KR') : '내역 없음'}</div>
            <div>• 다음 실행: {scheduler.nextRun ? new Date(scheduler.nextRun).toLocaleTimeString('ko-KR') : '시간 없음'}</div>
          </div>

          {/* Trigger Now Button */}
          <button
            onClick={onTriggerScrapeNow}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            지금 즉시 매체 스크래핑
          </button>
        </div>

        {/* Target Keywords Config */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div>
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">관측 대상 키워드 관리</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed">이 설정 단어가 포함된 지식iN, 카페, 커뮤니티 전기차 본문을 기계적으로 자동 여과합니다.</p>
          </div>

          {/* Tag insertion input */}
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="추가할 단어"
              value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              disabled={userRole === 'viewer'}
              onKeyDown={e => { if (e.key === 'Enter') handleAddKeywordTag(); }}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleAddKeywordTag}
              disabled={userRole === 'viewer' || !newKeyword.trim()}
              className="px-2.5 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-bold hover:bg-slate-900 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Tag cloud layout */}
          <div className="flex flex-wrap gap-1.5">
            {scheduler.targetKws.map(word => (
              <span 
                key={word} 
                className="inline-flex items-center gap-1 text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium"
              >
                {word}
                {userRole !== 'viewer' && (
                  <button 
                    onClick={() => handleRemoveKeywordTag(word)} 
                    className="text-slate-400 hover:text-rose-500 font-bold ml-0.5 focus:outline-none text-[9px]"
                  >
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>

      </div>

      {/* Main Listing Area */}
      <div className="xl:col-span-3 space-y-4 flex flex-col">
        
        {/* Filter and Command Utilities */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row gap-2 justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="제목, 본문 내용, 작성자 명으로 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setOnlyAnomalies(!onlyAnomalies)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 ${
                  onlyAnomalies 
                    ? 'bg-rose-50 border-rose-200 text-rose-600 font-bold' 
                    : 'bg-white border-gray-200 text-gray-600'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                이상징후만 보기
              </button>
              
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="px-3 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                수동 질문 수집
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
            {/* Portal selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">포털 매체 필터</label>
              <select
                value={selectedPortal}
                onChange={e => setSelectedPortal(e.target.value)}
                className="w-full text-xs p-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
              >
                <option value="">전체 매체</option>
                {Object.entries(PORTAL_MAP).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400">질문 유형 대주제</label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full text-xs p-1.5 border border-gray-200 rounded-lg bg-gray-50 focus:outline-none"
              >
                <option value="">전체 카테고리</option>
                {Object.keys(CATEGORY_COLORS).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Counter display */}
            <div className="flex items-end justify-end text-xs font-semibold text-slate-500 pb-1.5">
              검색 조건 만족: Total <span className="text-indigo-600 font-bold ml-1">{filteredQuestions.length}</span> / {questions.length}건
            </div>
          </div>
        </div>

        {/* Manual Import Form Drawer (Collapse state) */}
        {showManualForm && (
          <form onSubmit={handleManualSubmit} className="bg-slate-50 p-5 rounded-xl border border-dashed border-indigo-200 space-y-4">
            <h4 className="text-xs font-bold text-indigo-700 flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              모니터링 전기차 충전 Q&A 등록기 (수집 시뮬레이터)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1">채널 포털 명 *</label>
                <select
                  value={manualPortal}
                  onChange={e => setManualPortal(e.target.value as PortalType)}
                  className="w-full text-xs p-2 border border-gray-200 rounded bg-white focus:outline-none"
                >
                  {Object.entries(PORTAL_MAP).map(([key, val]) => (
                    <option key={key} value={key}>{val.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1">수정 카테고리 *</label>
                <select
                  value={manualCategory}
                  onChange={e => setManualCategory(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded bg-white focus:outline-none"
                >
                  {Object.keys(CATEGORY_COLORS).map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1">닉네임</label>
                <input
                  type="text"
                  placeholder="예: 배터리프로"
                  value={manualAuthor}
                  onChange={e => setManualAuthor(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-gray-500 mb-1">원문 링크 주소</label>
                <input
                  type="text"
                  placeholder="https://kin.naver.com/..."
                  value={manualUrl}
                  onChange={e => setManualUrl(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-200 rounded bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray-500">질문 제목 *</label>
              <input
                type="text"
                placeholder="예: 충전 중 삐소리가 계속 나는데 이거 터지려나요?"
                required
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                className="w-full text-xs p-2 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray-500">질문 본문 내용 *</label>
              <textarea
                placeholder="상세 내용을 적어주세요. 만약 '화재', '불', '구리 피복 훼손' 문구가 들어가면 긴급 이상 징후 소방 감지 모듈이 즉각 작동합니다."
                required
                rows={3}
                value={manualContent}
                onChange={e => setManualContent(e.target.value)}
                className="w-full text-xs p-2 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
              ></textarea>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-semibold text-gray-500">지정 검색 키워드 (쉼표 구분)</label>
              <input
                type="text"
                placeholder="예: 완속충전기, 화재 예방, 소방의무"
                value={manualKeywords}
                onChange={e => setManualKeywords(e.target.value)}
                className="w-full text-xs p-2 border border-gray-200 rounded bg-white focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setShowManualForm(false)}
                className="px-3 py-1.5 border border-gray-200 bg-white rounded text-gray-600"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-sm disabled:opacity-40"
              >
                {isSubmitting ? '수집 처리 중...' : '매체 데이터베이스 강제 입력'}
              </button>
            </div>
          </form>
        )}

        {/* Data Listings Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex-1">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 border-b border-gray-100 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">매체 및 카테고리</th>
                  <th className="px-4 py-3 min-w-[200px] w-1/2">질문 제목 / 본문 요약</th>
                  <th className="px-4 py-3">이상 등급 점수</th>
                  <th className="px-4 py-3">답변 및 홍보</th>
                  <th className="px-4 py-3">수집 일시</th>
                  <th className="px-4 py-3 text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredQuestions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400 font-medium">
                      수집된 Q&A 질문이 존재하지 않습니다. 필터 조건 혹은 검색어를 확인해 주세요.
                    </td>
                  </tr>
                ) : (
                  filteredQuestions.map(q => {
                    const portalInfo = PORTAL_MAP[q.portal];
                    const categoryStyle = CATEGORY_COLORS[q.category] || 'bg-gray-100 text-gray-800';

                    // Anomaly styling
                    let anomalyStyle = 'text-emerald-600 font-semibold bg-emerald-50';
                    if (q.anomalyScore > 80) anomalyStyle = 'text-rose-700 bg-rose-50 font-black animate-pulse';
                    else if (q.anomalyScore > 40) anomalyStyle = 'text-amber-700 bg-amber-50 font-bold';

                    return (
                      <tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        {/* Portal / Category */}
                        <td className="px-4 py-3.5 space-y-1.5">
                          <span className={`inline-flex px-2 py-0.5 rounded border text-[10px] font-bold ${portalInfo?.color}`}>
                            {portalInfo?.name || q.portal}
                          </span>
                          <span className={`block text-[10px] font-semibold rounded px-1.5 py-0.5 max-w-max ${categoryStyle}`}>
                            {q.category}
                          </span>
                        </td>

                        {/* Title and body snippet */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-900 leading-snug cursor-pointer hover:text-indigo-600" onClick={() => onSelectQuestion(q.id)}>
                            {q.title}
                          </div>
                          <p className="text-gray-400 mt-1 line-clamp-1 text-[11px] leading-relaxed select-all">
                            {q.content}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {q.keywords.map(kw => (
                              <span key={kw} className="text-[10px] bg-slate-100 text-slate-500 rounded px-1 py-0.2">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Anomaly threat rating */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${anomalyStyle}`}>
                              {q.anomalyScore > 40 ? `⚠️ 위기 ${q.anomalyScore}%` : `🟢 안전 ${q.anomalyScore}%`}
                            </span>
                          </div>
                          {q.anomalyReason && (
                            <p className="text-[9px] text-rose-500 font-semibold max-w-[150px] leading-snug mt-1">
                              {q.anomalyReason}
                            </p>
                          )}
                        </td>

                        {/* Promotion and Reply Status */}
                        <td className="px-4 py-3.5">
                          {q.promoStatus === 'posted' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                              ✓ 답변 & 홍보 완료
                            </span>
                          ) : q.promoStatus === 'draft' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] bg-yellow-100 text-yellow-800 font-bold px-2 py-0.5 rounded animate-pulse">
                              ✍ AI 초안 작업중
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">대기 중</span>
                          )}
                        </td>

                        {/* Scraping timestamp */}
                        <td className="px-4 py-3.5 text-[11px] font-mono whitespace-nowrap text-gray-400">
                          {new Date(q.scrapedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>

                        {/* Operational elements */}
                        <td className="px-4 py-3.5 text-right space-y-1">
                          <button
                            onClick={() => onSelectQuestion(q.id)}
                            className="inline-block px-2.5 py-1 text-[10px] font-bold bg-slate-800 text-white rounded hover:bg-slate-900 mr-1"
                          >
                            AI 응대하기
                          </button>
                          
                          {/* AI classify correction */}
                          <button
                            onClick={() => onClassifyAi(q.id)}
                            className="inline-block px-1.5 py-1 text-[10px] border border-gray-200 bg-gray-50 text-indigo-600 rounded hover:bg-indigo-50"
                            title="AI 유형 재분류 적용"
                          >
                            AI 분류
                          </button>

                          {userRole === 'admin' && (
                            <button
                              onClick={() => { if (window.confirm('질문 내역을 제거하시겠습니까?')) onDeleteQuestion(q.id); }}
                              className="text-[10px] p-1 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded ml-1"
                            >
                              삭제
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
