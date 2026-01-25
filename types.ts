
export enum AppState {
  IDLE = 'IDLE',
  GREETING = 'GREETING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  RACING = 'RACING',
  FINISHED = 'FINISHED'
}

export interface Swimmer {
  id: number;
  name: string;
  lane: number;
  speed: number;
  surge: number;
  frequency: number;
  phase: number;
  spurtStrength: number;
  spurtThreshold: number;
  progress: number;
  rank?: number;
  color: string;
  capColor: string;
}
