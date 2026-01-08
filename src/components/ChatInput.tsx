import { useState, useRef, useEffect } from "react";
import useBrowserSpeechRecognition from "../hooks/useBrowserSpeechRecognition";
import type { VoiceRecognition } from "../types/VoiceRecognition";

type ButtonConfig = {
  className?: string;
  icon?: React.ReactNode;
}

type Props = {
  /* 전송 버튼 클릭(또는 Enter) 시 호출되는 콜백 */
  onSend: (value: string) => void | Promise<void>;

  /* true: 브라우저 음성 인식, false: 미사용 */
  voice?: boolean | VoiceRecognition;

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
  isSending: boolean;

  /* Enter로 전송할지 여부 */
  submitOnEnter?: boolean;  
}

export default function ChatInput({
  onSend,
  voice = true,
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
  isSending,
  submitOnEnter = false,
}: Props) {
  const [innerText, setInnerText] = useState<string>("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isControlled = value !== undefined;
  const text = isControlled ? value! : innerText;
  const isEmpty = text.trim().length === 0;

  const defaultVoice = useBrowserSpeechRecognition();

  useEffect(() => {
    if (!defaultVoice) return;

    defaultVoice.onTranscript = (text: string) => {
      if (!isControlled) {
        setInnerText(text);
      }
      onChange?.(text);
    };
  }, [defaultVoice, isControlled, onChange]);

  const voiceController =
    voice === true
      ? defaultVoice
      : typeof voice === "object"
        ? voice
        : null;
  
  const isRecording = voiceController?.isRecording ?? false;
  const isVoiceEnabled = Boolean(voiceController);
  const isVoiceMode =
    isVoiceEnabled &&
    !isSending &&
    (isEmpty || isRecording);

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

      await onSend(trimmed);

    } catch (error) {
      console.error("ChatInput.handleSend.error: ", error);
    }
  }

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!submitOnEnter) return;

    if (e.key === "Enter" && e.shiftKey) return;

    if (e.key === "Enter") {
      e.preventDefault(); // textarea 줄바꿈 방지
      await handleSend();
    }
  }

  const handleRecord = () => {
    if (!voiceController) return;

    if (isRecording) {
      voiceController.stop();
    } else {
      voiceController.start();
    }
  }

  // 어떤 버튼을 보여줄지 결정
  const getActivityLayer = () => {
    // 1) 전송 중: sending
    if (isSending) return "sending";

    // 2) disableVoice=false -> mic, recording, send
    if (isVoiceEnabled) {
      if (isRecording) return "recording";
      if (isVoiceMode) return "mic";
      return "send";
    }

    // 3) 텍스트가 있을 때만 send
    if (!isEmpty) return "send"; 

    return null;
  }

  const activeLayer = getActivityLayer();

  return (
    <div className={`chat-input ${className}`}>
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        placeholder={placeholder}
        rows={1}
        onKeyDown={handleKeyDown}
        className={`chat-input__textarea ${inputClassName}`}
      />
      <button
        type="button" // submit 방지
        disabled={isSending}
        onClick={
          activeLayer === "mic" || activeLayer === "recording"
            ? handleRecord
            : handleSend
        }
        className="chat-input__button"
      >
        {/* mic layer */}
        <div
          className={`chat-input__layer chat-input__layer--mic ${
            activeLayer === "mic" ? "is-active" : ""
          } ${micButton?.className || ""}`}
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
          className={`chat-input__layer chat-input__layer--recording ${
            activeLayer === "recording" ? "is-active" : ""
          } ${recordingButton?.className || ""}`}
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
          className={`chat-input__layer chat-input__layer--send ${
            activeLayer === "send" ? "is-active" : ""
          } ${sendButton?.className || ""}`}
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
          className={`chat-input__layer chat-input__layer--sending ${
            activeLayer === "sending" ? "is-active" : ""
          } ${sendingButton?.className || ""}`}
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
  );
}
