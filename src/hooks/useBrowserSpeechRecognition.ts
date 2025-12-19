import { useEffect, useRef, useState } from "react";
import type { SpeechRecognition as ISpeechRecognition } from "../types/Speech";

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

type Options = {
  /* 음성 인식 언어 */
  lang?: string;

  /* 음성 인식 시작 시 실행할 함수*/
  onStart?: () => void;

  /* 음성 인식 종료 시 실행할 함수*/
  onEnd?: () => void;

  /* 에러 */
  onError?: (error: unknown) => void;
}

export default function useBrowserSpeechRecognition({
  lang = "ko-KR",
  onStart,
  onEnd,
  onError,
}: Options = {}) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const onTranscriptRef = useRef<(text: string) => void | undefined>(undefined);

  const start = () => {
    // 브라우저마다 다른 SpeechRecognition 생성자 가져오기
    // Chrome: webkitSpeechRecognition
    // 다른 일부 브라우저: SpeechRecognition
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Speech) {
      onError?.(new Error("SpeechRecognition not supported"));
      return;
    }

    const recognition = new Speech();
    recognition.lang = lang;
    recognition.continuous = true;     // 끊기지 않고 연속해서 듣게 하는 설정
    recognition.interimResults = true; // 중간에 나오는 임시 텍스트도 받는 설정

    recognition.onstart = () => {
      setIsRecording(true);
      onStart?.();
    };

    recognition.onend = () => {
      setIsRecording(false);
      onEnd?.();
    }

    // 말하는 동안 녹음 내용 반영
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0]?.transcript)
        .join("");

      onTranscriptRef.current?.(transcript);
    }

    recognition.onerror = (e) => {
      onError?.(e);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stop = () => {
    recognitionRef.current?.stop();
  };

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  return {
    start,          // 음성 인식 시작
    stop,           // 음성 인식 종료
    isRecording,    // 음성 인식 상태
    // 외부에서 음성 인식 결과(transcript) 처리 로직을 주입하기 위한 setter
    // 음성 인식 이벤트는 React 생명주기와 무관하게 발생하므로 ref로 관리한다
    set onTranscript(fn: (text: string) => void) {
      onTranscriptRef.current = fn;
    },
  };
}