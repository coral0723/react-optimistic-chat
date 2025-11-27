import { useState, useRef, useEffect } from "react";
import type { SpeechRecognition as ISpeechRecognition } from "../types/Speech";

declare global {
  interface Window {
    SpeechRecognition: new () => ISpeechRecognition;
    webkitSpeechRecognition: new () => ISpeechRecognition;
  }
}

type ButtonConfig = {
  className?: string;
  icon?: React.ReactNode;
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

  /* button 상태 별 커스텀 클래스 */
  micButton?: ButtonConfig;        // 1. 마이크 버튼
  recordingButton?: ButtonConfig;  // 2. 녹음 중 버튼
  sendButton?: ButtonConfig;       // 3. 기본 send 버튼
  sendingButton?: ButtonConfig;    // 4. 전송 중 버튼

  /* textarea 최대 높이(px) */
  maxHeight?: number;

  /* 컨트롤드 모드 용 value */
  value?: string;

  /* 컨트롤드 모드 용 onChange */
  onChange?: (value: string) => void;

  /* 외부에서 전달되는 sending 상태(ex. useOptimisticChat의 isPending) */
  isSending?: boolean;
}

export default function ChatInput({
  onSend,
  disableVoice = false,
  placeholder = "메시지를 입력하세요...",
  className = "",
  inputClassName = "",
  micButton,
  recordingButton,
  sendButton,
  sendingButton,
  maxHeight = 150,
  value,
  onChange,
  isSending = false,
}: Props) {
  const [innerText, setInnerText] = useState<string>("");
  const [isRecording, setIsRecording] = useState<boolean>(false);
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
  const isVoiceMode = !disableVoice && !isSending && (isEmpty || isRecording);

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

    try {
      // uncontrolled일 때만 값 비우기
      if (!isControlled)
        setInnerText("");

      onSend(trimmed);

    } catch (error) {
      console.error("ChatInput.handleSend.error: ", error);
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

  // 어떤 버튼을 보여줄지 결정
  const getActivityLayer = () => {
    // 1) 전송 중: sending
    if (isSending) return "sending";

    // 2) disableVoice=false -> mic, recording, send
    if (!disableVoice) {
      if (isRecording) return "recording";
      if (isVoiceMode) return "mic";
      return "send";
    }

    // 3) disableVoice=true -> 텍스트가 있을 때만 send, 없으면 버튼 없애기
    if (disableVoice) {
      if (!isEmpty) return "send";
      return null;
    }

    return null;
  }

  const activeLayer = getActivityLayer();

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
          placeholder={placeholder}
          rows={1}
          className={`
            w-full px-3 py-2
            resize-none border-none
            text-sm focus:outline-none
            overflow-hidden chatinput-scroll
            ${inputClassName}
          `}
        />
        <button
          type="button" // submit 방지
          disabled={isSending}
          onClick={
            activeLayer === "mic" || activeLayer === "recording"
              ? handleRecord
              : handleSend
          }
          className="relative w-10 h-10 ml-2 mt-auto flex-shrink-0"
        >
          {/* mic layer */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center rounded-3xl
              transition-opacity duration-150
              ${activeLayer === "mic" ? "opacity-100" : "opacity-0"}
              bg-gray-100 text-gray-700
              ${micButton?.className || ""}
            `}
          >
            {micButton?.icon || (
              <svg width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M12 19v3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <rect x="9" y="2" width="6" height="13" rx="3" />
              </svg>
            )}
          </div>

          {/* recording layer */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center rounded-3xl
              transition-opacity duration-150
              ${activeLayer === "recording" ? "opacity-100" : "opacity-0"}
              bg-red-600 text-white
              ${recordingButton?.className || ""}
            `}
          >
            {recordingButton?.icon || (
              <svg width="24" height="24" stroke="currentColor" fill="none" strokeWidth="2">
                <path d="M12 19v3" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <rect x="9" y="2" width="6" height="13" rx="3" />
              </svg>
            )}
          </div>

          {/* send layer */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center rounded-3xl
              transition-opacity duration-150
              ${activeLayer === "send" ? "opacity-100" : "opacity-0"}
              bg-black text-white
              ${sendButton?.className || ""}
            `}
          >
            {sendButton?.icon || (
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 22 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
              >
                <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"/>
                <path d="M6 12h16"/>
              </svg>
            )}
          </div>

          {/* sending layer */}
          <div
            className={`
              absolute inset-0 flex items-center justify-center rounded-3xl
              transition-opacity duration-150
              ${activeLayer === "sending" ? "opacity-100" : "opacity-0"}
              bg-gray-400 text-white
              ${sendingButton?.className || ""}
            `}
          >
            {sendingButton?.icon || (
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 22 24" 
                fill="none" 
                stroke="currentColor" 
                stroke-width="2" 
              >
                <path d="M3.714 3.048a.498.498 0 0 0-.683.627l2.843 7.627a2 2 0 0 1 0 1.396l-2.842 7.627a.498.498 0 0 0 .682.627l18-8.5a.5.5 0 0 0 0-.904z"/>
                <path d="M6 12h16"/>
              </svg>
            )}
          </div>
        </button>
      </div>
    </>
  );
}
