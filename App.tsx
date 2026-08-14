// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { AppState, Swimmer } from './types';
import World from './components/World';
import UIOverlay from './components/UIOverlay';

const COLORS = [
  '#FF3D00', '#00E676', '#2979FF', '#D500F9', '#FFEA00', 
  '#00E5FF', '#FF9100', '#AA00FF', '#76FF03', '#F50057',
  '#3D5AFE', '#00B0FF', '#00E676', '#1DE9B6', '#FFD600',
  '#FF6D00', '#DD2C00', '#C51162', '#651FFF', '#00BFA5'
];

export const getLottoColor = (num: number) => {
  if (num <= 10) return { bg: '#f59e0b', text: '#ffffff', border: '#d97706', label: '1~10 (노랑)' };
  if (num <= 20) return { bg: '#2563eb', text: '#ffffff', border: '#1d4ed8', label: '11~20 (파랑)' };
  if (num <= 30) return { bg: '#dc2626', text: '#ffffff', border: '#b91c1c', label: '21~30 (빨강)' };
  if (num <= 40) return { bg: '#4b5563', text: '#ffffff', border: '#374151', label: '31~40 (회색)' };
  return { bg: '#16a34a', text: '#ffffff', border: '#15803d', label: '41~45 (초록)' };
};

const App: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [count, setCount] = useState<number>(5);
  const [isLottoMode, setIsLottoMode] = useState<boolean>(false);
  const [swimmerNames, setSwimmerNames] = useState<string[]>(Array(5).fill(""));
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [results, setResults] = useState<Swimmer[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpdateName = (index: number, name: string) => {
    const newNames = [...swimmerNames];
    newNames[index] = name;
    setSwimmerNames(newNames);
  };

  const handleUpdateAllNames = (names: string[]) => {
    setSwimmerNames(names);
    setCount(names.length);
  };

  const handleLaneChange = (newCount: number) => {
    const clamped = Math.max(2, Math.min(45, newCount));
    setCount(clamped);
    if (clamped !== 45) {
      setIsLottoMode(false);
    }
    setSwimmerNames(prev => {
      const next = [...prev];
      if (clamped > prev.length) {
        return [...next, ...Array(clamped - prev.length).fill("")];
      }
      return next.slice(0, clamped);
    });
  };

  const handleSelectLottoMode = () => {
    setIsLottoMode(true);
    setCount(45);
    setSwimmerNames(prev => {
      const names = Array(45).fill("").map((_, i) => prev[i] || `${i + 1}번`);
      return names;
    });
  };

  const handleStartSetup = useCallback(() => {
    const initialSwimmers: Swimmer[] = swimmerNames.slice(0, count).map((name, i) => {
      const style = Math.random();
      let speed, surge, spurtStrength, spurtThreshold;

      if (style < 0.35) { 
        speed = 0.046 + Math.random() * 0.007;
        surge = 0.015 + Math.random() * 0.015;
        spurtStrength = 0.006 + Math.random() * 0.006;
        spurtThreshold = 0.86;
      } else if (style < 0.75) {
        speed = 0.040 + Math.random() * 0.008;
        surge = 0.03 + Math.random() * 0.03;
        spurtStrength = 0.014 + Math.random() * 0.012;
        spurtThreshold = 0.78;
      } else {
        speed = 0.036 + Math.random() * 0.007;
        surge = 0.04 + Math.random() * 0.04;
        spurtStrength = 0.035 + Math.random() * 0.02;
        spurtThreshold = 0.70;
      }

      let color = COLORS[i % COLORS.length];
      let capColor = COLORS[(i + 3) % COLORS.length];

      if (isLottoMode || count === 45) {
        const lotto = getLottoColor(i + 1);
        color = lotto.bg;
        capColor = lotto.border;
      }

      return {
        id: i + 1,
        name: name.trim() || `${i + 1}번 선수`,
        lane: i,
        speed: speed * 0.95,
        surge,
        frequency: 1.5 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2,
        spurtStrength,
        spurtThreshold,
        progress: 0,
        color,
        capColor,
        isCollapsed: false
      };
    });

    setSwimmers(initialSwimmers);
    setResults([]);
    setAppState(AppState.GREETING);
  }, [count, swimmerNames, isLottoMode]);

  const handleFinish = useCallback((swimmer: Swimmer) => {
    setResults(prev => {
      if (prev.some(r => r.id === swimmer.id)) return prev;
      const newResults = [...prev, { ...swimmer, rank: prev.length + 1 }];
      
      const targetWinners = (isLottoMode || count === 45) ? 6 : count;

      if (newResults.length >= targetWinners) {
        setSwimmers(curSwimmers =>
          curSwimmers.map(s => {
            const isWinner = newResults.some(w => w.id === s.id);
            return isWinner ? s : { ...s, isCollapsed: true };
          })
        );
        setAppState(AppState.FINISHED);
      }
      return newResults;
    });
  }, [count, isLottoMode]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-screen bg-slate-950 select-none">
      <Canvas shadows gl={{ antialias: true }}>
        <color attach="background" args={["#0c1a2e"]} />
        <PerspectiveCamera makeDefault position={[35, 25, 35]} fov={42} />
        <ambientLight intensity={0.8} />
        <directionalLight position={[20, 40, 20]} intensity={1.4} castShadow />
        
        <World 
          appState={appState} 
          swimmers={swimmers} 
          onFinish={handleFinish}
          onStateTransition={(nextState) => setAppState(nextState)}
        />

        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2.05} 
          enabled={appState === AppState.IDLE || appState === AppState.FINISHED}
        />
        <Environment preset="city" />
      </Canvas>

      <UIOverlay 
        appState={appState} 
        count={count} 
        isLottoMode={isLottoMode}
        swimmerNames={swimmerNames}
        onUpdateName={handleUpdateName}
        onUpdateAllNames={handleUpdateAllNames}
        onCountChange={handleLaneChange}
        onSelectLottoMode={handleSelectLottoMode}
        onStartSetup={handleStartSetup} 
        onBeginRace={() => setAppState(AppState.RACING)}
        onSkipGreeting={() => setAppState(AppState.READY)}
        results={results}
        onReset={() => setAppState(AppState.IDLE)}
      />
    </div>
  );
};

export default App;
