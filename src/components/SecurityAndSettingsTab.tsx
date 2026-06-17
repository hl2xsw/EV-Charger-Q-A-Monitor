import React, { useState } from 'react';
import { SecurityLog, AnomalyRule, ScrapedQuestion } from '../types';
import { Shield, Lock, FileText, Download, ToggleLeft, ToggleRight, Plus, Eye, AlertOctagon, Printer, Activity } from 'lucide-react';

interface SecurityAndSettingsTabProps {
  logs: SecurityLog[];
  rules: AnomalyRule[];
  questions: ScrapedQuestion[];
  userRole: 'admin' | 'manager' | 'viewer';
  onChangeRole: (role: 'admin' | 'manager' | 'viewer') => void;
  onAddRule: (rule: Partial<AnomalyRule>) => Promise<any>;
  onToggleRule: (id: string) => Promise<any>;
  onAddLog: (action: string, details: string) => void;
}

export const SecurityAndSettingsTab: React.FC<SecurityAndSettingsTabProps> = ({
  logs,
  rules,
  questions,
  userRole,
  onChangeRole,
  onAddRule,
  onToggleRule,
  onAddLog
}) => {
  // New rule state
  const [newKeyword, setNewKeyword] = useState('');
  const [newLevel, setNewLevel] = useState<'critical' | 'warning'>('warning');
  const [newDesc, setNewDesc] = useState('');

  // Report generator state
  const [reportData, setReportData] = useState<any | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyword || userRole === 'viewer') return;

    try {
      await onAddRule({
        keyword: newKeyword.trim(),
        level: newLevel,
        description: newDesc || `${newKeyword} 키워드 감지 시 실시간 푸시 이상 징후 노티 피드백 자동 발송`
      });
      setNewKeyword('');
      setNewDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      const res = await fetch('/api/reports/detailed');
      const data = await res.json();
      setReportData(data);
      onAddLog("고급 업무 보고서 작성 다운로드", "전체 매체 실적 수집 누적 종합 보고서 빌드");
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="security-settings-grid" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* 1. Authority / Active Role Switcher Panel (4 cols) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Role Controller Card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Lock className="h-4.5 w-4.5 text-indigo-500" />
              보안 지침 역할 및 권한 관리 (RBAC)
            </h3>
            <p className="text-[10px] text-gray-400 mt-0.5">매체 조작, 규칙 제어, 로그 파괴 가능 범위 분할</p>
          </div>

          <div className="space-y-2">
            {[
              { role: 'admin' as const, name: '최고 관리자 (Administrator)', desc: 'AI 답변 전송, 이상 감지 룰 및 스케줄러 수정, 수집 질문 삭제 등 전체 접근권한 획득' },
              { role: 'manager' as const, name: '충전소 운영 매니저 (Manager)', desc: 'AI 모니터링 통계 분석, 상세 PDF 보고서 열람 및 AI 임시 답변 검토 초안 생성 가능' },
              { role: 'viewer' as const, name: '일반 뷰어 (Viewer / Read-only)', desc: '데이터 수정이 완전히 금지된 모니터링 읽기 전용 계정 지위 부여' }
            ].map(item => {
              const isActive = userRole === item.role;
              return (
                <div
                  key={item.role}
                  onClick={() => onChangeRole(item.role)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isActive 
                      ? 'border-indigo-500 bg-indigo-50/50 shadow-xs' 
                      : 'border-slate-100 bg-slate-50/30 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-slate-800">{item.name}</span>
                    {isActive && <span className="h-2 w-2 rounded-full bg-indigo-600 animate-ping"></span>}
                  </div>
                  <p className="text-[10px] text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-50 text-indigo-800 rounded-xl text-[10px] leading-relaxed border border-indigo-150">
            <strong>보안 공지:</strong> 플랫폼의 모든 권한 격리는 엄연한 데이터 보안 정책에 따라 관리자 로그 감사 일지(Audit Trail)에 IP 주소와 연계되어 초 단위 누적 감시됩니다.
          </div>
        </div>

        {/* Anomaly Alarm Rules List */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
          <div className="pb-1 border-b border-gray-150">
            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <AlertOctagon className="h-4.5 w-4.5 text-rose-500" />
              이상 징후 의심 분석 규칙 풀인
            </h4>
            <p className="text-[10px] text-gray-400">포스트 필터링 시 위험 가중치를 인상할 매개변수 규칙</p>
          </div>

          {/* Add rule inline form */}
          {userRole !== 'viewer' && (
            <form onSubmit={handleCreateRule} className="p-3 bg-slate-50 rounded-xl space-y-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">감시 필터 *</label>
                  <input
                    type="text"
                    required
                    placeholder="예: 결함, 폭발"
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    className="w-full text-xs p-1 bg-white border border-gray-200 rounded"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500">의심 수준등급 *</label>
                  <select
                    value={newLevel}
                    onChange={e => setNewLevel(e.target.value as any)}
                    className="w-full text-xs p-1 bg-white border border-gray-200 rounded"
                  >
                    <option value="warning">주의 (Warning)</option>
                    <option value="critical">긴급 (Critical)</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500">설명문구</label>
                <input
                  type="text"
                  placeholder="예: 충전 중 발화 위험성 의심 배터리 분석"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full text-xs p-1 bg-white border border-gray-200 rounded"
                />
              </div>
              <button
                type="submit"
                className="w-full py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] rounded"
              >
                신규 이상징후 룰 추가 등록
              </button>
            </form>
          )}

          {/* Active rules list */}
          <div className="space-y-2 max-h-[220px] overflow-y-auto">
            {rules.map(rule => (
              <div key={rule.id} className="p-2 border border-slate-100 rounded-lg text-xs space-y-1 bg-white">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${rule.level === 'critical' ? 'bg-rose-500' : 'bg-amber-400'}`}></span>
                    {rule.keyword}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-gray-400">
                      {rule.level === 'critical' ? '🔴 위기' : '🟡 주의'}
                    </span>
                    <button
                      onClick={() => userRole !== 'viewer' && onToggleRule(rule.id)}
                      disabled={userRole === 'viewer'}
                      className="text-slate-400 hover:text-indigo-600 disabled:opacity-50"
                    >
                      {rule.isActive ? <ToggleRight className="h-5 w-5 text-indigo-500" /> : <ToggleLeft className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-gray-400">{rule.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 2. Detailed Report Generation & Audit log Trail (8 cols) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Report Generation Module */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <FileText className="h-4.5 w-4.5 text-indigo-500" />
                모니터링 실적 분석 및 정형 통합 보고서 빌더
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">홍보 진행 실적, 위기 탐지 로그를 취합하여 실시간으로 보고용 데이터를 구축합니다.</p>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              {isGeneratingReport ? '보고서 수집 취합 중...' : '원클릭 릴리즈 상세 보고서 생성'}
            </button>
          </div>

          {/* Report Viewer Container */}
          {reportData ? (
            <div id="printable-report" className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-6 max-h-[450px] overflow-y-auto font-sans text-slate-800 relative">
              
              {/* Report Header */}
              <div className="flex border-b-2 border-slate-300 pb-4 justify-between items-start">
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900">[실적보고] 전기차 충전기 Q&A 수집 및 홍보 성과 보고서</h2>
                  <p className="text-[11px] text-slate-500 mt-1 font-mono">발행시간: {new Date(reportData.generatedAt).toLocaleString('ko-KR')}</p>
                </div>
                <button
                  onClick={handlePrintReport}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                >
                  <Printer className="h-3.5 w-3.5" />
                  보고서 인쇄 (PDF 내보내기 가능)
                </button>
              </div>

              {/* Aggregated statistics row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">통합 수집 누적건</span>
                  <span className="text-xl font-bold font-mono text-slate-800 block mt-1">{reportData.metrics.totalCollected}건</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">소방/위간 이상감지</span>
                  <span className="text-xl font-bold font-mono text-rose-600 block mt-1">{reportData.metrics.totalAnomaly}건</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">온라인 홍보 완료건</span>
                  <span className="text-xl font-bold font-mono text-indigo-600 block mt-1">{reportData.metrics.answered}건</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">설비 전체 보완 안정율</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 block mt-1">{reportData.metrics.safetyRatio}%</span>
                </div>
              </div>

              {/* Details table grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* distribution list */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-800 border-b border-dashed border-slate-200 pb-2 mb-2">● 매체 포털별 수집 밀도</h4>
                  <ul className="space-y-1.5">
                    {Object.entries(reportData.portalBreakdown).map(([k, v]: any) => (
                      <li key={k} className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-slate-600">{k}</span>
                        <span className="font-bold font-mono text-slate-700">{v}건</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs">
                  <h4 className="font-bold text-slate-800 border-b border-dashed border-slate-200 pb-2 mb-2">● 주요 관심사 카테고리 수 분포</h4>
                  <ul className="space-y-1.5">
                    {Object.entries(reportData.categoryBreakdown).map(([k, v]: any) => (
                      <li key={k} className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-slate-600">{k}</span>
                        <span className="font-bold font-mono text-slate-700">{v}건</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* High risk warning questions list */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                <h4 className="text-xs font-bold text-slate-800 border-b border-dashed border-slate-200 pb-2">🚨 긴급 소방설비 및 고장 민원 대응 조치 목록</h4>
                {reportData.criticalQuestions.length === 0 ? (
                  <p className="text-[10.5px] text-slate-500">현재 대웅 조치가 필요한 긴급 이상징후 Q&A 포스트가 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {reportData.criticalQuestions.map((q: any) => (
                      <div key={q.id} className="p-2.5 bg-rose-50/50 rounded-lg text-xs flex justify-between items-start">
                        <div>
                          <strong className="text-rose-700 block text-[10px]">{q.portal} | 검출스코어: {q.anomalyScore}%</strong>
                          <span className="font-semibold text-slate-800 mt-1 block">{q.title}</span>
                          <span className="text-[10px] text-slate-500 mt-0.5 block">진단원인: {q.anomalyReason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Corporate footprint signature */}
              <div className="pt-4 border-t-2 border-slate-300 text-center text-[10px] text-slate-400">
                <p>본 보고서는 VoltCharge Pro 매니저 마케팅 보완 관리에 따른 증빙 데이터입니다.</p>
                <p className="mt-0.5">© 2026 VoltCharge Inc. All Rights Reserved. Confidential.</p>
              </div>

            </div>
          ) : (
            <div className="h-[220px] bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-gray-400 relative">
              <FileText className="h-8 w-8 text-indigo-300 mb-2" />
              <span className="text-xs font-bold text-slate-600">품격 있는 월간/실시간 보고서 생성 시스템</span>
              <p className="text-[10px] text-gray-400 mt-1 max-w-sm">상단 우측의 생성 버튼을 클릭하면, 수집 완료 정보와 이상 징후 분석율을 단숨에 통합하여 보고용 고선명 템플릿을 생성합니다.</p>
            </div>
          )}
        </div>

        {/* Security / Action Audit Logs card */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
              실시간 감사 로그 (Security Audit Trail / 무진성 증적)
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
              누적 {logs.length}건
            </span>
          </div>

          {/* Logs scrollable container */}
          <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
            {logs.map(log => {
              const roleBadgeColor = 
                log.role === 'admin' ? 'bg-indigo-100 text-indigo-800 border-indigo-200' :
                log.role === 'manager' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-100 text-gray-700';

              return (
                <div key={log.id} className="p-2.5 rounded-lg border border-slate-50 hover:bg-slate-50 text-[11px] leading-snug flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`px-1.5 py-0.2 rounded-md font-bold text-[9px] border ${roleBadgeColor}`}>
                        {log.role.toUpperCase()}
                      </span>
                      <span className="font-bold text-slate-700">{log.action}</span>
                      <span className="text-[10px] text-gray-400 font-mono">({log.ip})</span>
                    </div>
                    <p className="text-gray-500 text-[10px]">{log.details}</p>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400 text-right whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString('ko-KR')}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
