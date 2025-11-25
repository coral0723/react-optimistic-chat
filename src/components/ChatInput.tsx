import { useState, useRef, useEffect } from "react";
import type { SpeechRecognition as ISpeechRecognition } from "../types/Speech";

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

type Props = {
  /* 전송 버튼 클릭(또는 Enter) 시 호출되는 콜백 */
  onSend: (value: string) => void | Promise<void>;

  /* 음성 모드 비활성화: true면 항상 send 버튼만 표시 */
  disableVoice?: boolean;

  /* placeholder 텍스트 */
  placeholder?: string;

  /* 전체 wrapper 커스텀 클래스 */
  className?: string;

  /* textarea 커스텀 클래스 */
  inputClassName?: string;

  /* button 커스텀 클래스 */
  buttonClassName?: string;

  /* textarea 최대 높이(px) */
  maxHeight?: number;

  /* 컨트롤드 모드 용 value */
  value?: string;

  /* 컨트롤드 모드 용 onChange */
  onChange?: (value: string) => void;
}

export default function ChatInput({
  onSend,
  disableVoice = false,
  placeholder = "메시지를 입력하세요...",
  className = "",
  inputClassName = "",
  buttonClassName = "",
  maxHeight = 150,
  value,
  onChange,
}: Props) {
  const [innerText, setInnerText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isControlled = value !== undefined;
  const text = isControlled ? value! : innerText;
  const recognition = useRef<ISpeechRecognition | null>(null);

  // 높이 자동 조절 + 최대 높이 설정
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;

    // 150px 이상이면 내부 스크롤 가능하도록
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [text, maxHeight]);

  const isEmpty = text.trim().length === 0;
  const isVoiceMode = !disableVoice && (isEmpty || isRecording);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (!isControlled) {
      setInnerText(next);
    }

    // onChange가 없다면(undefined) 실행 안 함
    onChange?.(next);
  }

  const handleSend = async () => {
    if (isVoiceMode || isEmpty || isSending) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSending(true); // 전송 시작 -> 버튼 비활성화

    try {
      const result = onSend(trimmed);
      if (result instanceof Promise) {
        await result; // 비동기 함수라면 기다림
      }
      // uncontrolled일 때만 값 비우기
      if (!isControlled)
        setInnerText("");
    } finally {
      setIsSending(false); // 전송 완료 -> 다시 활성화
    }
  }

  const handleRecord = () => {
    try {
      if(!isRecording) {
        /* 브라우저마다 다른 SpeechRecognition 생성자 가져오기
        Chrome: webkitSpeechRecognition
        다른 일부 브라우저: SpeechRecognition */
        const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!Speech) {
          console.error("Browser does not support SpeechRecognition");
          alert("현재 브라우저에서는 음성 인식 기능을 사용할 수 없습니다.");
          return;
        }

        recognition.current = new Speech();
        recognition.current.lang = "ko-KR";
        recognition.current.continuous = true; // 끊기지 않고 연속해서 듣게 하는 설정
        recognition.current.interimResults = true; // 중간에 나오는 임시 텍스트도 받는 설정

        recognition.current.onstart = () => {
          setIsRecording(true);
        };

        recognition.current.onend = () => {
          setIsRecording(false);
        };

        // 말하는 동안 녹음 내용 반영
        recognition.current.onresult = (event) => {
          const newTranscript = Array.from(event.results)
            .map((r) => r[0]?.transcript)
            .join("");
          
          setInnerText(newTranscript);
        }

        recognition.current?.start();
      } else {
        recognition.current?.stop();
      }
    } catch (e) {
      console.error("Speech Recognition error: ", e);
      alert("음성 입력을 사용할 수 없습니다. 텍스트로 입력해주세요.");
      setIsRecording(false);
    }
  }

  return (
    <>
      {/* 커스텀 스크롤바 스타일 */}
      <style>{`
        .chatinput-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .chatinput-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatinput-scroll::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .chatinput-scroll::-webkit-scrollbar-button {
          display: none; 
        }
      `}</style>

      <div 
        className={`
          flex border border-gray-300 p-2 rounded-3xl
          ${className}
        `}>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          className={`
            w-full px-3 py-2
            border-none
            text-sm resize-none
            focus:outline-none
            overflow-hidden chatinput-scroll
            ${inputClassName}
          `}
          placeholder={placeholder}
          rows={1}
        />
        <button
          type="button" // submit 방지
          onClick={isVoiceMode || isRecording ? handleRecord : handleSend}
          disabled={!isVoiceMode && isEmpty}
          className={`
            w-10 h-10 ml-2 mt-auto
            p-2 rounded-3xl flex items-center justify-center
            relative overflow-hidden flex-shrink-0
            ${buttonClassName}
          `}
        >
          {/* 마이크 svg */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              transition-opacity duration-100 ease-in
              ${isVoiceMode ? "opacity-100" : "opacity-0"}  
              ${isRecording ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}
            `}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 19v3" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <rect x="9" y="2" width="6" height="13" rx="3" />
            </svg>
          </div>
          {/* send svg */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              transition-opacity duration-100 ease-in
              bg-black text-white
              ${(isEmpty || isVoiceMode) ? "opacity-0" : "opacity-100"}  
              ${isSending ? "bg-gray-400" : ""}
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              stroke-width="2" 
              stroke-linecap="round" 
              stroke-linejoin="round" 
            >
              <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"/>
              <path d="M6 12h16"/>
            </svg>
          </div>
        </button>
      </div>
    </>
  );
}
