export type VoiceRecognition = {
  start: () => void;
  stop: () => void;
  isRecording: boolean;
  onTranscript?: (text: string) => void;
};
