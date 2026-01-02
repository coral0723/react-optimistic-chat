export type VoiceRecognition = {
  start: () => void;
  stop: () => void;
  isRecording: boolean;

  // useVoiceChat: 필수
  // ChatInput: 불필요(내부에서 자동으로 처리)
  onTranscript?: (text: string) => void;
};
