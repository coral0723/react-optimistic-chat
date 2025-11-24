import { useState, useRef, useEffect } from "react";

type Props = {
  /* 전송 버튼 클릭(또는 Enter) 시 호출되는 콜백 */
  onSend: (value: string) => void;

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
  const [innerText, setInnerText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isControlled = value !== undefined;
  const text = isControlled ? value! : innerText;

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
  const isVoiceMode = !disableVoice && isEmpty; // 지금은 아이콘만 바꾸고 기능은 나중에 추가 예정

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (!isControlled) {
      setInnerText(next);
    }

    // onChange가 없다면(undefined) 실행 안 함
    onChange?.(next);
  }

  const handleSend = () => {
    // 음성 모드일 때는 나중에 Web Speech API 연동용 -> 지금은 아무것도 안 함
    if (isVoiceMode) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    onSend(trimmed);

    // uncontrolled일 때만 값 비우기
    if (!isControlled) {
      setInnerText("");
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
          onClick={handleSend}
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
              bg-gray-100 text-gray-700
              transition-opacity duration-100 ease-in
              ${isVoiceMode ? "opacity-100" : "opacity-0"}  
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
              ${isEmpty ? "opacity-0" : "opacity-100"}  
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
