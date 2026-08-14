// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { AppState, Swimmer } from '../types';
import { getLottoColor } from '../App';

interface UIOverlayProps {
  appState: AppState;
  count: number;
  isLottoMode: boolean;
  swimmerNames: string[];
  onUpdateName: (index: number, name: string) => void;
  onUpdateAllNames: (names: string[]) => void;
  onCountChange: (n: number) => void;
  onSelectLottoMode: () => void;
  onStartSetup: () => void;
  onBeginRace: () => void;
  onSkipGreeting: () => void;
  results: Swimmer[];
  onReset: () => void;
}

const SAMPLE_NAMES = [
  '불꽃물개', '바다표범', '심해괴물', '샤크킹', '인어공주', '돌고래',
  '포세이돈', '쓰나미', '황금송어', '파도타기', '아쿠아맨', '물수제비',
  '폭풍헤엄', '번개호흡', '마린보이', '물안경요정', '잠수왕', '워터드래곤'
];

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  appState, 
  count, 
  isLottoMode,
  swimmerNames,
  onUpdateName,
  onUpdateAllNames,
  onCountChange,
  onSelectLottoMode,
  onStartSetup, 
  onBeginRace,
  onSkipGreeting,
  results,
  onReset 
}) => {
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [showNameModal, setShowNameModal] = useState(false);
  const [modalTab, setModalTab] = useState<'individual' | 'batch'>('individual');
  const [batchText, setBatchText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (appState === AppState.GREETING) {
      let idx = 0;
      const intervalTime = count > 10 ? 1000 : 2500;
      const interval = setInterval(() => {
        if (idx < count && (count <= 10 || idx < 6)) {
          setCurrentIdx(idx);
          idx++;
        } else {
          clearInterval(interval);
        }
      }, intervalTime);
      return () => clearInterval(interval);
    } else {
      setCurrentIdx(-1);
    }
  }, [appState, count]);

  useEffect(() => {
    if (appState === AppState.FINISHED) {
      if (typeof window !== 'undefined' && (window as any).confetti) {
        (window as any).confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          (window as any).confetti({
            particleCount: 80,
            angle: 60,
            spread: 55,
            origin: { x: 0 }
          });
          (window as any).confetti({
            particleCount: 80,
            angle: 120,
            spread: 55,
            origin: { x: 1 }
          });
        }, 400);
      }
    }
  }, [appState]);

  const handleOpenNameModal = () => {
    setBatchText(swimmerNames.slice(0, count).map((n, i) => n || `${i + 1}번`).join(', '));
    setShowNameModal(true);
  };

  const handleApplyBatchText = () => {
    const rawNames = batchText
      .split(/[\n,;]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (rawNames.length > 0) {
      const newNames = Array(count).fill('').map((_, i) => rawNames[i] || `${i + 1}번`);
      onUpdateAllNames(newNames);
    }
    setShowNameModal(false);
  };

  const handleAutoFillNumbers = () => {
    const names = Array(count).fill('').map((_, i) => `${i + 1}번`);
    onUpdateAllNames(names);
  };

  const handleRandomizeNames = () => {
    const shuffled = [...SAMPLE_NAMES].sort(() => 0.5 - Math.random());
    const names = Array(count).fill('').map((_, i) => shuffled[i % shuffled.length] + ` ${i + 1}`);
    onUpdateAllNames(names);
  };

  const sortedWinningNumbers = [...results.slice(0, 6)].map(s => s.id).sort((a, b) => a - b);

  const handleCopyNumbers = () => {
    navigator.clipboard.writeText(sortedWinningNumbers.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4 md:p-6 z-10 overflow-hidden font-sans">
      
      {/* Header Bar */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-cyan-500/40 px-5 py-3.5 rounded-3xl shadow-2xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-cyan-500/30">
            🏊
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
              <span className="text-cyan-400">AQUA</span> {isLottoMode || count === 45 ? 'LOTTO 6/45' : 'RACE'}
            </h1>
            <p className="text-[10px] font-bold text-cyan-300 tracking-[0.25em] uppercase mt-0.5 opacity-90">
              {isLottoMode || count === 45 ? '45인 레이스 & 6인 생존 추첨' : '실시간 3D 수영 토너먼트'}
            </p>
          </div>
        </div>

        {appState === AppState.RACING && (
          <div className="bg-gradient-to-r from-red-600 to-rose-700 px-5 py-2.5 rounded-2xl animate-pulse flex items-center gap-2.5 border border-white/30 shadow-2xl backdrop-blur-md">
             <div className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></div>
             <span className="text-white font-black text-xs uppercase italic tracking-widest">
               {isLottoMode || count === 45 ? '6명 골인 시 나머지 즉시 탈락!' : 'LIVE RACING'}
             </span>
          </div>
        )}
      </div>

      {/* Intro / Greeting Stage Overlay (Clean transparent, no black screen overlay!) */}
      {appState === AppState.GREETING && (
        <div className="fixed bottom-12 inset-x-0 flex flex-col items-center justify-center pointer-events-auto z-20">
          <div className="text-center max-w-xl px-6">
            {count <= 10 && currentIdx !== -1 && (
              <div className="bg-slate-950/85 backdrop-blur-2xl border border-cyan-400/40 px-10 py-5 rounded-[2.5rem] shadow-[0_0_80px_rgba(6,182,212,0.4)]">
                <p className="text-cyan-400 font-black text-xs uppercase tracking-[0.5em] mb-1 animate-pulse">
                  Lane #{currentIdx + 1}
                </p>
                <h2 className="text-white text-3xl md:text-5xl font-black italic tracking-tight drop-shadow-md">
                  {swimmerNames[currentIdx] || `${currentIdx + 1}번 선수`}
                </h2>
              </div>
            )}

            {count > 10 && (
              <div className="bg-slate-950/85 backdrop-blur-2xl border border-amber-400/40 px-10 py-6 rounded-[2.5rem] shadow-[0_0_80px_rgba(245,158,11,0.4)]">
                <span className="px-4 py-1.5 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full font-black text-xs uppercase tracking-widest">
                  🔥 45인 초대형 로또 레이스
                </span>
                <h2 className="text-white text-3xl md:text-5xl font-black italic tracking-tight mt-2 mb-1">
                  45인의 전사들 입장!
                </h2>
                <p className="text-cyan-300 font-semibold text-xs">
                  1위부터 6위까지만 완주 인정! 39명은 현장에서 쓰러집니다.
                </p>
              </div>
            )}

            <button
              onClick={onSkipGreeting}
              className="mt-4 px-7 py-3 bg-white/20 hover:bg-white/30 text-white font-black text-xs uppercase tracking-[0.25em] rounded-full backdrop-blur-md border border-white/40 shadow-xl transition-all active:scale-95"
            >
              ⏩ 바로 출발대로 가기 (스킵)
            </button>
          </div>
        </div>
      )}

      {/* Main UI Cards */}
      <div className="pointer-events-auto w-full max-w-md">
        
        {/* IDLE: Main Setup Card */}
        {appState === AppState.IDLE && (
          <div className="bg-slate-900/95 backdrop-blur-3xl p-6 md:p-7 rounded-[2.5rem] shadow-2xl border border-cyan-500/30 border-t-[8px] border-t-cyan-500 animate-in slide-in-from-bottom duration-500">
            
            <div className="flex justify-between items-center mb-5">
              <div>
                <h2 className="text-white text-xl font-black uppercase italic tracking-tight">선수 등록 & 모드 선택</h2>
                <p className="text-xs text-slate-400 font-medium">참가자 수를 정하고 이름을 입력하세요</p>
              </div>

              <button 
                onClick={onSelectLottoMode}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 shadow-lg ${
                  isLottoMode || count === 45
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300 scale-105'
                    : 'bg-slate-800 text-amber-400 hover:bg-amber-500/20 border border-amber-500/40'
                }`}
              >
                <span>🎱</span>
                <span>로또 (45인)</span>
              </button>
            </div>

            {/* Lane Count & "이름쓰기" Trigger */}
            <div className="mb-5 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => onCountChange(Math.max(2, count - 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 text-2xl font-black border border-slate-700 active:scale-90 transition-all hover:bg-slate-700 flex items-center justify-center"
                >-</button>
                <div className="text-center min-w-[50px]">
                   <span className="text-3xl font-black text-white">{count}</span>
                   <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">명 참가</p>
                </div>
                <button 
                  onClick={() => onCountChange(Math.min(45, count + 1))}
                  className="w-10 h-10 rounded-xl bg-slate-800 text-cyan-400 text-2xl font-black border border-slate-700 active:scale-90 transition-all hover:bg-slate-700 flex items-center justify-center"
                >+</button>
              </div>

              <button
                onClick={handleOpenNameModal}
                className="px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-black rounded-xl shadow-lg shadow-cyan-500/30 active:scale-95 transition-all flex items-center gap-2 border border-cyan-300/40"
              >
                <span>✍️</span>
                <span>이름쓰기 ({count}명)</span>
              </button>
            </div>

            {/* Quick Name Preview Bar */}
            <div className="mb-5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">선수 명단 미리보기</span>
                <span className="text-[10px] text-cyan-400 font-bold">클릭하여 바로 수정</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-[90px] overflow-y-auto pr-1 custom-scrollbar">
                {swimmerNames.slice(0, count).map((name, idx) => (
                  <span 
                    key={idx} 
                    onClick={handleOpenNameModal}
                    className="cursor-pointer px-2.5 py-1 bg-slate-800/90 hover:bg-cyan-900/60 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-all"
                  >
                    <span className="text-cyan-400 mr-1">#{idx + 1}</span>
                    {name || `${idx + 1}번`}
                  </span>
                ))}
              </div>
            </div>

            {/* Lotto Mode Explanatory Banner */}
            {(isLottoMode || count === 45) && (
              <div className="mb-5 p-3.5 bg-gradient-to-r from-amber-950/80 to-slate-900 border border-amber-500/40 rounded-2xl flex items-center gap-3">
                <div className="text-2xl">⚡</div>
                <div className="text-xs">
                  <p className="text-amber-300 font-bold">로또 6/45 번호 추첨 규칙 적용</p>
                  <p className="text-slate-300 text-[11px] mt-0.5">상위 6명이 터치패드를 찍는 순간, 39명은 제자리에서 즉시 쓰러집니다!</p>
                </div>
              </div>
            )}

            {/* Start Race Button */}
            <button 
              onClick={onStartSetup}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 hover:from-cyan-400 hover:to-blue-500 text-white font-black rounded-2xl shadow-xl shadow-cyan-600/30 uppercase tracking-[0.2em] text-sm transition-all active:scale-95 border-b-[4px] border-indigo-950 flex items-center justify-center gap-2"
            >
              <span>🚀</span>
              <span>{isLottoMode || count === 45 ? '로또 레이스 개막식 시작' : '대회 시작하기'}</span>
            </button>
          </div>
        )}

        {/* PREPARING */}
        {appState === AppState.PREPARING && (
          <div className="flex flex-col items-center animate-in fade-in duration-700">
             <div className="bg-slate-900/90 backdrop-blur-xl px-8 py-3.5 rounded-full border border-cyan-500/40 shadow-2xl mb-2">
                <span className="text-cyan-300 font-black text-sm tracking-[0.3em] uppercase">WARM-UP IN PROGRESS...</span>
             </div>
             <p className="text-white/80 font-bold uppercase tracking-widest text-[11px]">선수들이 출발대 위에서 몸을 푸는 중입니다</p>
          </div>
        )}

        {/* READY */}
        {appState === AppState.READY && (
          <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-500">
            <div className="text-white font-black text-xl tracking-widest bg-slate-950/80 border border-cyan-500/30 px-8 py-2.5 rounded-full shadow-2xl">
              차렷... TAKE YOUR MARK
            </div>
            <button 
              onClick={onBeginRace}
              className="group relative px-20 py-8 bg-gradient-to-br from-cyan-400 via-blue-600 to-indigo-700 text-white font-black text-5xl rounded-[3rem] shadow-[0_0_60px_rgba(6,182,212,0.6)] border-4 border-white transform hover:scale-105 active:scale-95 transition-all uppercase italic tracking-tighter"
            >
              출발! (GO)
            </button>
          </div>
        )}

        {/* FINISHED */}
        {appState === AppState.FINISHED && (
          <div className="bg-slate-900/95 backdrop-blur-3xl p-6 md:p-7 rounded-[2.5rem] shadow-2xl border border-cyan-500/30 border-t-[8px] border-t-cyan-500 w-full animate-in slide-in-from-bottom duration-500 max-h-[85vh] flex flex-col">
             
             <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800 shrink-0">
                <div>
                  <h2 className="text-white text-xl font-black italic uppercase leading-none">
                    {isLottoMode || count === 45 ? '🎉 로또 6/45 당첨 번호' : '🏆 공식 경기 결과'}
                  </h2>
                  <p className="text-xs text-cyan-400 font-bold mt-1">
                    {isLottoMode || count === 45 ? '완주 성공 6인 (행운의 번호)' : `총 ${results.length}명 완주 기록`}
                  </p>
                </div>
                <div className="bg-cyan-500 text-slate-950 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
                  {isLottoMode || count === 45 ? '6 WINNERS' : 'PODIUM'}
                </div>
             </div>

             {(isLottoMode || count === 45) && (
               <div className="mb-4 bg-slate-950 p-3.5 rounded-2xl border border-amber-500/30 shrink-0">
                 <div className="flex justify-between items-center mb-2">
                   <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider">행운의 로또 번호 6개 (오름차순)</span>
                   <button 
                     onClick={handleCopyNumbers}
                     className="text-[10px] bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold px-2 py-1 rounded-md transition-all"
                   >
                     {copied ? '✅ 복사 완료' : '📋 번호 복사'}
                   </button>
                 </div>
                 <div className="flex justify-center gap-2">
                   {sortedWinningNumbers.map((num, i) => {
                     const lotto = getLottoColor(num);
                     return (
                       <div 
                         key={i} 
                         style={{ backgroundColor: lotto.bg }}
                         className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-base shadow-lg shadow-black/50 border-2 border-white/40 animate-in zoom-in"
                       >
                         {num}
                       </div>
                     );
                   })}
                 </div>
               </div>
             )}

             <div className="space-y-2.5 overflow-y-auto pr-1 custom-scrollbar flex-1 max-h-[260px]">
                {results.map((s, idx) => {
                  const lotto = getLottoColor(s.id);
                  return (
                    <div 
                      key={s.id} 
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                        idx === 0 
                          ? 'bg-amber-500/10 border-amber-500/50' 
                          : idx < 6 
                            ? 'bg-slate-800/80 border-slate-700' 
                            : 'bg-slate-950/50 border-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                         <div 
                           style={{ backgroundColor: lotto.bg }}
                           className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-base shadow-md border border-white/30 shrink-0"
                         >
                           {s.id}
                         </div>
                         <div>
                            <p className="text-white font-black text-sm leading-tight">{s.name}</p>
                            <p className="text-cyan-400 text-[11px] font-bold mt-0.5">
                              {idx + 1}위 골인 • {s.id}번 레인
                            </p>
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                           {idx === 0 ? '🥇 1등' : idx === 1 ? '🥈 2등' : idx === 2 ? '🥉 3등' : `${idx + 1}등`}
                         </span>
                      </div>
                    </div>
                  );
                })}

                {(isLottoMode || count === 45) && (
                  <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-2xl text-center">
                    <p className="text-xs font-bold text-red-400">
                      💀 나머지 39명의 선수는 코스 위에서 쓰러졌습니다.
                    </p>
                  </div>
                )}
             </div>

             <button 
              onClick={onReset}
              className="w-full mt-4 py-4 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl transition-all uppercase tracking-[0.3em] text-xs active:scale-95 border border-slate-700 shadow-xl shrink-0"
            >
              새 경기 준비하기 (Next)
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full text-center py-2">
        <p className="text-white/30 text-[9px] font-black tracking-[1.2em] uppercase">AQUA-LOTTO 3D ENGINE</p>
      </div>

      {/* MODAL */}
      {showNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md pointer-events-auto animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-lg rounded-[2.5rem] shadow-2xl p-6 md:p-7 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-white font-black text-xl flex items-center gap-2">
                  <span>✍️</span>
                  <span>선수 이름 쓰기 (총 {count}명)</span>
                </h3>
                <p className="text-slate-400 text-xs font-medium mt-1">
                  선수들의 이름을 직접 입력하거나 명단을 한 번에 붙여넣으세요.
                </p>
              </div>
              <button 
                onClick={() => setShowNameModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-4 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
              <button
                onClick={() => setModalTab('individual')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                  modalTab === 'individual' 
                    ? 'bg-cyan-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                직접 하나씩 입력
              </button>
              <button
                onClick={() => setModalTab('batch')}
                className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                  modalTab === 'batch' 
                    ? 'bg-cyan-500 text-slate-950 shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                일괄 붙여넣기 (쉼표/엔터)
              </button>
            </div>

            {modalTab === 'individual' && (
              <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 custom-scrollbar min-h-[220px]">
                {swimmerNames.slice(0, count).map((name, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 bg-slate-950/80 p-2 rounded-2xl border border-slate-800">
                    <div className="w-9 h-9 rounded-xl bg-cyan-900/60 text-cyan-300 font-black text-xs flex items-center justify-center border border-cyan-700/50 shrink-0">
                      {idx + 1}
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => onUpdateName(idx, e.target.value)}
                      placeholder={`${idx + 1}번 선수 이름 입력...`}
                      className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 rounded-xl text-white text-xs font-bold outline-none transition-all placeholder:text-slate-500"
                    />
                  </div>
                ))}
              </div>
            )}

            {modalTab === 'batch' && (
              <div className="flex-1 flex flex-col min-h-[220px]">
                <p className="text-slate-400 text-xs mb-2">
                  쉼표(,), 줄바꿈, 세미콜론 등으로 구분된 이름을 붙여넣으세요:
                </p>
                <textarea
                  value={batchText}
                  onChange={(e) => setBatchText(e.target.value)}
                  placeholder="예: 홍길동, 이순신, 강감찬, 유관순, 김유신, 장보고..."
                  rows={7}
                  className="w-full flex-1 bg-slate-950 border border-slate-700 focus:border-cyan-400 p-3.5 rounded-2xl text-white text-xs font-medium outline-none transition-all placeholder:text-slate-600 resize-none"
                />
                <button
                  onClick={handleApplyBatchText}
                  className="mt-3 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black rounded-xl transition-all shadow-md"
                >
                  명단 파싱하여 적용하기
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap justify-between items-center gap-2">
              <div className="flex gap-2">
                <button
                  onClick={handleAutoFillNumbers}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-all"
                >
                  1~{count}번 번호채우기
                </button>
                <button
                  onClick={handleRandomizeNames}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold rounded-lg transition-all"
                >
                  🎲 랜덤 닉네임
                </button>
              </div>

              <button
                onClick={() => setShowNameModal(false)}
                className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                저장 및 닫기
              </button>
            </div>

          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.6); border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #06b6d4; border-radius: 12px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0891b2; }
      `}</style>
    </div>
  );
};

export default UIOverlay;
