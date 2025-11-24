import { useState, useRef, useEffect } from "react";

export default function ChatInput() {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_HEIGHT = 150;

  // 높이 자동 조절 + 최대 높이 설정
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    el.style.height = "auto";

    const newHeight = Math.min(el.scrollHeight, MAX_HEIGHT);
    el.style.height = newHeight + "px";

    // 150px 이상이면 내부 스크롤 가능하도록
    el.style.overflowY = el.scrollHeight > MAX_HEIGHT ? "auto" : "hidden";
  }, [text]);

  const isEmpty = text.trim().length === 0;

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

      <div className="flex items-end border border-gray-300 p-2 rounded-3xl">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`
            w-full px-3 py-2
            border-none
            text-sm resize-none
            focus:outline-none
            overflow-hidden chatinput-scroll
          `}
          placeholder="메시지를 입력하세요…"
          rows={1}
        />
        <button
          className={`
            w-10 h-10 ml-2
            p-2 rounded-3xl flex items-center justify-center
            relative overflow-hidden flex-shrink-0
          `}
        >
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              bg-gray-100 text-gray-700
              transition-opacity duration-100 ease-in
              ${isEmpty ? "opacity-100" : "opacity-0"}  
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
