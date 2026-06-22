import React, { useState } from 'react';
import { ScrapedQuestion, PortalItem } from '../types';
import { PORTAL_MAP } from '../lib/constants';
import { Sparkles, MessageSquare, Tag, Copy, Upload, ArrowRight, CornerDownRight, CheckCircle } from 'lucide-react';

interface AiResponseTabProps {
  questions: ScrapedQuestion[];
  selectedQuestionId: string | null;
  onSelectQuestionId: (id: string | null) => void;
  onGenerateAiResponse: (id: string, tone: 'friendly' | 'expert' | 'direct_pr', brand: string, coreMsg: string) => Promise<any>;
  onMarkPosted: (id: string, text: string) => Promise<any>;
  portals?: PortalItem[];
}

export const AiResponseTab: React.FC<AiResponseTabProps> = ({
  questions,
  selectedQuestionId,
  onSelectQuestionId,
  onGenerateAiResponse,
  onMarkPosted,
  portals
}) => {
  const selectedQuestion = questions.find(q => q.id === selectedQuestionId);

  // Marketing PR Preset parameters
  const [tone, setTone] = useState<'friendly' | 'expert' | 'direct_pr'>('expert');
  const [brand, setBrand] = useState('VoltCharge Pro (볼트차지 프로)');
  const [coreFeature, setCoreFeature] = useState(
    '특허 스마트 3부하 분산 제어로 충전기 증설 전기 기본요금 83% 대폭 절약, 자체 화재 열폭주 제어 예방 충전기 화재소화 장치 탑재, 전국 24H 전담 서비스 원격 관제망 구축'
  );
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingResponse, setEditingResponse] = useState('');
  const [generationNote, setGenerationNote] = useState('');

  const handleGenerate = async () => {
    if (!selectedQuestion) return;
    setIsGenerating(true);
    setGenerationNote('');
    try {
      const res = await onGenerateAiResponse(selectedQuestion.id, tone, brand, coreFeature);
      setEditingResponse(res.response);
      if (res.note) {
        setGenerationNote(res.note);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editingResponse);
    alert('답변이 클립보드에 복사되었습니다. 포털 답변란에 즉시 포스팅하여 매체 홍보를 게시하세요!');
  };

  const handlePost = async () => {
    if (!selectedQuestion) return;
    try {
      await onMarkPosted(selectedQuestion.id, editingResponse);
      alert('답변이 최종 등록 및 포스팅 완료 처리되었습니다.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div id="ai-response-tab-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Question Selector List (4 cols) */}
      <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col h-[650px]">
        <div className="pb-3 border-b border-gray-100 mb-3 text-xs">
          <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-indigo-500" />
            미응답 수집 목록 ({questions.filter(q => q.promoStatus !== 'posted').length}건)
          </h3>
          <p className="text-[10px] text-gray-400 mt-0.5">홍보 및 마케팅 답변이 필요한 전기차 Q&A</p>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {questions.map(q => {
            const isSelected = q.id === selectedQuestionId;
            const pInfo = portals?.find(p => p.id === q.portal) || PORTAL_MAP[q.portal];
            return (
              <div
                key={q.id}
                onClick={() => {
                  onSelectQuestionId(q.id);
                  setEditingResponse(q.aiResponse || '');
                }}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-indigo-400 bg-indigo-50/50 shadow-xs' 
                    : q.promoStatus === 'posted'
                    ? 'border-emerald-150 bg-emerald-50/20 opacity-80'
                    : 'border-slate-100 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${pInfo?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                    {pInfo?.name || q.portal}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(q.scrapedAt).toLocaleDateString('ko', { month: '2-digit', day: '2-digit' })}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 truncate">{q.title}</h4>
                <p className="text-gray-400 line-clamp-1 text-[11px] mt-0.5">{q.content}</p>

                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100/60 text-[10px]">
                  <span className="font-semibold text-slate-500">유형: {q.category}</span>
                  {q.promoStatus === 'posted' ? (
                    <span className="text-emerald-600 font-bold">✓ 홍보완료</span>
                  ) : q.promoStatus === 'draft' ? (
                    <span className="text-indigo-600 font-bold">✍ 초안임시</span>
                  ) : (
                    <span className="text-rose-500 font-bold">• 미대응</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main AI response panel (8 cols) */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {selectedQuestion ? (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
            
            {/* Top: selected Question overview */}
            <div className="p-4 bg-slate-50 rounded-2xl relative border border-slate-100">
              <span className="absolute top-3 right-3 text-[10px] text-gray-400 font-mono">작성자: {selectedQuestion.author}</span>
              <div className="flex items-center gap-2 mb-2">
                {(() => {
                  const pSelInfo = portals?.find(p => p.id === selectedQuestion.portal) || PORTAL_MAP[selectedQuestion.portal];
                  return (
                    <span className={`px-2 py-0.5 text-[10px] font-black rounded border ${pSelInfo?.color || 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {pSelInfo?.name || selectedQuestion.portal}
                    </span>
                  );
                })()}
                <span className="text-xs text-indigo-600 font-bold">{selectedQuestion.category}</span>
              </div>
              <h2 className="text-sm font-bold text-slate-800">{selectedQuestion.title}</h2>
              <p className="text-[11px] text-slate-500 leading-relaxed mt-2 select-all bg-white p-3 rounded-xl border border-slate-100/60 font-mono whitespace-pre-wrap">
                {selectedQuestion.content}
              </p>
              
              <div className="flex gap-1.5 mt-2">
                {selectedQuestion.keywords.map(kw => (
                  <span key={kw} className="text-[10px] bg-slate-200/50 text-slate-600 px-2 py-0.5 rounded">
                    #{kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Middle: Brand Promotion & Tone configuration inputs */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-indigo-50/30 p-4 rounded-xl border border-indigo-100/60 text-xs">
              
              {/* Product and Brand Input */}
              <div className="md:col-span-4 space-y-1">
                <label className="block font-bold text-indigo-900">홍보 추천 브랜드 제품명</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-400"
                />
              </div>

              {/* Tone Selection */}
              <div className="md:col-span-4 space-y-1">
                <label className="block font-bold text-indigo-900">답변 톤앤매너 설정</label>
                <select
                  value={tone}
                  onChange={e => setTone(e.target.value as any)}
                  className="w-full p-2 bg-white border border-gray-200 rounded text-xs"
                >
                  <option value="expert">전문가 컨설턴트 톤 (~입니다 체)</option>
                  <option value="friendly">친근한 지식iN 답변 블로그 톤 (~해요 체)</option>
                  <option value="direct_pr">즉각 무상 설치 홍보 유도 톤 (비즈니스 체)</option>
                </select>
              </div>

              {/* Action Button */}
              <div className="md:col-span-4 flex items-end">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full py-2 bg-indigo-600 hover:bg-slate-900 text-white rounded text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" />
                  {isGenerating ? 'AI가 홍보답변 창조 중...' : '홍보답변 자동 생성'}
                </button>
              </div>

              {/* Core promo messages */}
              <div className="md:col-span-12 space-y-1">
                <label className="block font-bold text-indigo-900">핵심 마케팅 단축 속성 (AI 주입 소스)</label>
                <textarea
                  rows={2}
                  value={coreFeature}
                  onChange={e => setCoreFeature(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-200 rounded text-xs focus:ring-1 focus:ring-indigo-400 font-sans"
                />
              </div>

            </div>

            {/* Bottom: result area */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <CornerDownRight className="h-4 w-4 text-indigo-600" />
                  AI 기반 자동 응대 템플릿 제안
                </span>
                {selectedQuestion.aiResponse && (
                  <span className="text-[10px] text-indigo-500 font-semibold bg-indigo-50 px-2 py-0.5 rounded">
                    포팅 준비중
                  </span>
                )}
              </div>

              <textarea
                value={editingResponse}
                onChange={e => setEditingResponse(e.target.value)}
                rows={12}
                placeholder="상단의 답변 자동 생성 버튼을 탭하면, Gemini 3.5 AI 크리에이터 모델이 질문자의 고민 해결과 당사 충전기 홍보를 자연스럽게 엮어 완벽한 온라인 침투 마케팅 답안을 출력합니다."
                className="w-full p-4 border border-gray-200 rounded-2xl text-xs font-sans leading-relaxed text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              {generationNote && (
                <div className="p-3 bg-amber-50 text-amber-700 rounded-xl text-[11px] leading-relaxed border border-amber-100 flex items-start gap-1.5">
                  <span className="font-bold">안내:</span>
                  <p>{generationNote}</p>
                </div>
              )}

              {/* AI Actions control */}
              {editingResponse && (
                <div className="flex flex-col sm:flex-row gap-2 justify-end pt-2">
                  <button
                    onClick={handleCopy}
                    className="px-4 py-2 border border-gray-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                    클립보드 복사 (실제 포스팅용)
                  </button>

                  <button
                    onClick={handlePost}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    답변 포스팅 완료 처리 (실적 저장)
                  </button>
                </div>
              )}
            </div>

          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm text-center h-[500px] flex flex-col justify-center items-center">
            <Sparkles className="h-12 w-12 text-indigo-300 animate-pulse mb-3" />
            <span className="text-sm font-semibold text-slate-700">인공지능 응대 자동화 작업실</span>
            <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed">
              왼쪽의 수집 Q&A 목록에서 개별 질문을 선택하면, AI 마케터 보드가 활성화되어 브랜드 가치 특화 포스팅 및 침투 영업 응대글을 원터치로 즉석 생성할 수 있습니다.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
