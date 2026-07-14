export type AudioFormat = 'audio/webm' | 'audio/ogg' | 'audio/mp4' | 'audio/wav';

export type RecorderState = 'inactive' | 'recording' | 'paused';

export interface AudioRecording {
  blob: Blob;
  url: string;
  duration: number;
  size: number;
  format: string;
  timestamp: number;
}

export interface SniceAudioRecorderElement extends HTMLElement {
  autoStart: boolean;
  format: AudioFormat;
  bitrate: number;
  showControls: boolean;
  showVisualizer: boolean;
  maxDuration: number;
  showTimer: boolean;
  showPlayback: boolean;

  start(): Promise<void>;
  stop(): Promise<AudioRecording>;
  pause(): void;
  resume(): void;
  cancel(): void;
  reset(): void;
  getState(): RecorderState;
  getDuration(): number;
  isRecording(): boolean;
  download(filename?: string): void;
}
