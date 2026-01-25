
// @ts-nocheck
import React, { useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Stars, Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { AppState, Swimmer } from './types';
import World from './components/World';
import UIOverlay from './components/UIOverlay';

const COLORS = [
  '#FF3D00', '#00E676', '#2979FF', '#D500F9', '#FFEA00', 
  '#00E5FF', '#FF9100', '#AA00FF', '#76FF03', '#F50057'
];

const App: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [count, setCount] = useState<number>(5);
  const [swimmerNames, setSwimmerNames] = useState<string[]>(Array(5).fill(""));
  const [swimmers, setSwimmers] = useState<Swimmer[]>([]);
  const [results, setResults] = useState<Swimmer[]>([]);

  // Vercel/Next.js 환경에서의 Hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleUpdateName = (index: number, name: string) => {
    const newNames = [...swimmerNames];
    newNames[index] = name;
    setSwimmerNames(newNames);
  };

  const handleLaneChange = (newCount: number) => {
    setCount(newCount);
    setSwimmerNames(prev => {
      const next = [...prev];
      if (newCount > prev.length) {
        return [...next, ...Array(newCount - prev.length).fill("")];
      }
      return next.slice(0, newCount);
    });
  };

  const handleStartSetup = useCallback(() => {
    const initialSwimmers: Swimmer[] = swimmerNames.slice(0, count).map((name, i) => {
      const style = Math.random();
      let speed, surge, spurtStrength, spurtThreshold;

      if (style < 0.35) { 
        speed = 0.048 + Math.random() * 0.004;
        surge = 0.015 + Math.random() * 0.015;
        spurtStrength = 0.004 + Math.random() * 0.004;
        spurtThreshold = 0.88;
      } else if (style < 0.75) {
        speed = 0.042 + Math.random() * 0.005;
        surge = 0.03 + Math.random() * 0.03;
        spurtStrength = 0.012 + Math.random() * 0.01;
        spurtThreshold = 0.80;
      } else {
        speed = 0.038 + Math.random() * 0.003;
        surge = 0.04 + Math.random() * 0.04;
        spurtStrength = 0.032 + Math.random() * 0.015;
        spurtThreshold = 0.72;
      }

      return {
        id: i + 1,
        name: name.trim() || `Champion ${i + 1}`,
        lane: i - (count - 1) / 2,
        speed: speed * 0.95,
        surge,
        frequency: 1.5 + Math.random() * 2.0,
        phase: Math.random() * Math.PI * 2,
        spurtStrength,
        spurtThreshold,
        progress: 0,
        color: COLORS[i % COLORS.length],
        capColor: COLORS[(i + 3) % COLORS.length]
      };
    });
    setSwimmers(initialSwimmers);
    setResults([]);
    setAppState(AppState.GREETING);
  }, [count, swimmerNames]);

  const handleFinish = useCallback((swimmer: Swimmer) => {
    setResults(prev => {
      const newResults = [...prev, { ...swimmer, rank: prev.length + 1 }];
      if (newResults.length === swimmers.length) {
        setAppState(AppState.FINISHED);
      }
      return newResults;
    });
  }, [swimmers.length]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-screen bg-slate-950">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[35, 25, 35]} fov={42} />
        <Sky sunPosition={[100, 30, 100]} turbidity={0.05} rayleigh={0.5} />
        <Stars radius={150} depth={50} count={3000} factor={5} />
        <ambientLight intensity={0.6} />
        
        <World 
          appState={appState} 
          swimmers={swimmers} 
          onFinish={handleFinish}
          onStateTransition={(nextState) => setAppState(nextState)}
        />

        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2.1} 
          enabled={appState === AppState.IDLE || appState === AppState.FINISHED}
        />
        <Environment preset="night" />
      </Canvas>

      <UIOverlay 
        appState={appState} 
        count={count} 
        swimmerNames={swimmerNames}
        onUpdateName={handleUpdateName}
        onCountChange={handleLaneChange}
        onStartSetup={handleStartSetup} 
        onBeginRace={() => setAppState(AppState.RACING)}
        results={results}
        onReset={() => setAppState(AppState.IDLE)}
      />
    </div>
  );
};

export default App;
