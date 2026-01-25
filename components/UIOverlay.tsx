
import React from 'react';
import { AppState, Swimmer } from '../types';

interface UIOverlayProps {
  appState: AppState;
  count: number;
  swimmerNames: string[];
  onUpdateName: (index: number, name: string) => void;
  onCountChange: (n: number) => void;
  onStartSetup: () => void;
  onBeginRace: () => void;
  results: Swimmer[];
  onReset: () => void;
}

const UIOverlay: React.FC<UIOverlayProps> = ({ 
  appState, 
  count, 
  swimmerNames,
  onUpdateName,
  onCountChange,
  onStartSetup, 
  onBeginRace, 
  results,
  onReset 
}) => {
  // 현재 소개 중인 선수를 찾기 위한 로직 (World.tsx의 타이머와 동기화)
  // 실제 프로덕션에선 World에서 현재 index를 state로 받아오는 게 정확하지만 간단히 구현
  const [currentIdx, setCurrentIdx] = React.useState(-1);

  React.useEffect(() => {
    if (appState === AppState.GREETING) {
      let idx = 0;
      const interval = setInterval(() => {
        if (idx < count) {
          setCurrentIdx(idx);
          idx++;
        } else {
          clearInterval(interval);
        }
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setCurrentIdx(-1);
    }
  }, [appState, count]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-6 z-10 overflow-hidden">
      {/* Header */}
      <div className="w-full flex justify-between items-start pointer-events-auto">
        <div className="bg-cyan-950/90 backdrop-blur-2xl border border-cyan-400/40 px-6 py-4 rounded-3xl shadow-2xl">
          <h1 className="text-3xl font-black italic tracking-tighter text-white uppercase leading-none">
            <span className="text-cyan-400">AQUA</span> LOTTO
          </h1>
          <p className="text-[10px] font-bold text-cyan-300 tracking-[0.4em] uppercase mt-1 opacity-90">Elite Swimming Tournament</p>
        </div>

        {appState === AppState.RACING && (
          <div className="bg-cyan-600 px-6 py-3 rounded-2xl animate-pulse flex items-center gap-3 border border-white/40 shadow-2xl backdrop-blur-md">
             <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
             <span className="text-white font-black text-xs uppercase italic tracking-widest">LIVE RACE TRACKING</span>
          </div>
        )}
      </div>

      {/* Intro Overlay for Greeting Stage */}
      {appState === AppState.GREETING && currentIdx !== -1 && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none animate-in fade-in zoom-in duration-500">
           <div className="text-center">
              <div className="bg-black/40 backdrop-blur-lg border border-white/20 px-16 py-8 rounded-[4rem] shadow-[0_0_80px_rgba(0,0,0,0.5)]">
                 <p className="text-cyan-400 font-black text-lg uppercase tracking-[0.6em] mb-4 animate-pulse">Lane {currentIdx + 1}</p>
                 <h2 className="text-white text-8xl font-black italic tracking-tighter uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">
                    {swimmerNames[currentIdx] || `CHAMPION ${currentIdx + 1}`}
                 </h2>
              </div>
           </div>
        </div>
      )}

      {/* Main UI */}
      <div className="pointer-events-auto w-full max-w-sm">
        {appState === AppState.IDLE && (
          <div className="bg-white/95 backdrop-blur-3xl p-8 rounded-[3rem] shadow-2xl border-t-[10px] border-cyan-600 animate-in slide-in-from-bottom duration-500">
            <h2 className="text-slate-900 text-2xl font-black mb-6 uppercase italic text-center tracking-tight">Swimmer Entry</h2>
            
            <div className="mb-8 flex flex-col items-center bg-cyan-50 p-5 rounded-[2rem] border border-cyan-100 shadow-inner">
              <div className="flex items-center gap-10">
                <button 
                  onClick={() => onCountChange(Math.max(1, count - 1))}
                  className="w-14 h-14 rounded-2xl bg-white text-cyan-900 text-3xl font-black border border-cyan-200 shadow-md active:scale-90 transition-all hover:bg-cyan-50"
                >-</button>
                <div className="text-center">
                   <span className="text-5xl font-black text-slate-900">{count}</span>
                   <p className="text-[11px] text-cyan-600 font-bold uppercase tracking-widest mt-1">Lanes</p>
                </div>
                <button 
                  onClick={() => onCountChange(Math.min(10, count + 1))}
                  className="w-14 h-14 rounded-2xl bg-white text-cyan-900 text-3xl font-black border border-cyan-200 shadow-md active:scale-90 transition-all hover:bg-cyan-50"
                >+</button>
              </div>
            </div>

            <div className="mb-8 space-y-3 max-h-[220px] overflow-y-auto px-2 custom-scrollbar">
               {swimmerNames.slice(0, count).map((name, idx) => (
                 <div key={idx} className="flex gap-4 items-center group">
                    <div className="w-10 h-10 rounded-2xl bg-cyan-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-lg">{idx+1}</div>
                    <input 
                      className="w-full bg-slate-50 border border-transparent focus:border-cyan-500 focus:bg-white px-5 py-3 rounded-2xl text-slate-900 font-bold text-sm outline-none transition-all placeholder:text-slate-300 shadow-sm"
                      placeholder={`Champion Name ${idx+1}`}
                      value={name}
                      onChange={(e) => onUpdateName(idx, e.target.value)}
                    />
                 </div>
               ))}
            </div>

            <button 
              onClick={onStartSetup}
              className="w-full py-5 bg-gradient-to-r from-cyan-600 to-blue-800 hover:from-cyan-500 hover:to-blue-700 text-white font-black rounded-2xl shadow-2xl uppercase tracking-[0.2em] text-sm transition-all active:scale-95 border-b-[6px] border-blue-950"
            >
              Start Official Ceremony
            </button>
          </div>
        )}

        {appState === AppState.PREPARING && (
          <div className="flex flex-col items-center animate-in fade-in duration-700">
             <div className="bg-white/10 backdrop-blur-xl px-10 py-4 rounded-full border border-white/20 shadow-2xl mb-4">
                <span className="text-white font-black text-lg tracking-[0.3em] uppercase">WARM-UP IN PROGRESS...</span>
             </div>
             <p className="text-cyan-400 font-bold animate-bounce uppercase tracking-widest text-xs">STRETCHING ON BLOCKS</p>
          </div>
        )}

        {appState === AppState.READY && (
          <div className="flex flex-col items-center gap-10 animate-in zoom-in duration-500">
            <div className="text-white font-black text-2xl tracking-widest bg-black/50 px-10 py-3 rounded-full mb-4">TAKE YOUR MARK...</div>
            <button 
              onClick={onBeginRace}
              className="group relative px-24 py-12 bg-gradient-to-br from-cyan-400 to-blue-700 text-white font-black text-6xl rounded-[4rem] shadow-[0_0_80px_rgba(34,211,238,0.7)] border-4 border-white transform hover:scale-110 active:scale-90 transition-all uppercase italic tracking-tighter"
            >
              GO!
            </button>
          </div>
        )}

        {appState === AppState.FINISHED && (
          <div className="bg-white/95 backdrop-blur-3xl p-8 rounded-[3rem] shadow-2xl border-t-[10px] border-cyan-600 w-full animate-in slide-in-from-bottom duration-500">
             <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-5">
                <h2 className="text-slate-900 text-2xl font-black italic tracking-tighter uppercase leading-none">Official Result</h2>
                <div className="bg-cyan-500 text-white px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl">PODIUM</div>
             </div>
             
             <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {results.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between bg-white border border-gray-100 p-5 rounded-[2rem] hover:bg-cyan-50 transition-all shadow-md">
                    <div className="flex items-center gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-3xl shadow-lg ${
                          idx === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 text-white' :
                          idx === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                          idx === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-700 text-white' : 'bg-slate-50 text-slate-500'
                       }`}>
                         {idx + 1}
                       </div>
                       <div>
                          <p className="text-slate-900 font-black text-lg leading-none">{s.name}</p>
                          <p className="text-cyan-600 text-xs font-bold uppercase mt-2">Lane {s.id}</p>
                       </div>
                    </div>
                    <div className="w-8 h-8 rounded-full border-4 border-white shadow-2xl" style={{ backgroundColor: s.color }}></div>
                  </div>
                ))}
             </div>

             <button 
              onClick={onReset}
              className="w-full mt-10 py-6 bg-slate-900 hover:bg-black text-white font-black rounded-[2rem] transition-all uppercase tracking-[0.5em] text-xs active:scale-95 border-b-[6px] border-black shadow-2xl"
            >
              Next Tournament
            </button>
          </div>
        )}
      </div>

      <div className="w-full text-center py-6">
        <p className="text-white/40 text-[9px] font-black tracking-[1.2em] uppercase">AQUA-TRACK v7.0 ELITE</p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #06b6d4; border-radius: 20px; border: 2px solid #f1f5f9; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #0891b2; }
      `}</style>
    </div>
  );
};

export default UIOverlay;
