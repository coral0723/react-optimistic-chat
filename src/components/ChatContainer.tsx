import { useEffect, useRef } from "react";
import type { Message } from "../types/Message";
import ChatInput from "./ChatInput";
import ChatList from "./ChatList";

type Props<T> = {
  /* ChatList */
  messages: T[];
  messageMapper?: (msg: T) => Message;
  messageRenderer?: (msg: Message) => React.ReactNode;
  loadingRenderer?: React.ReactNode;
  listClassName?: string;

  /* ChatInput */
  onSend: (value: string) => void | Promise<void>;
  isSending?: boolean;
  disableVoice?: boolean;
  placeholder?: string;
  inputClassName?: string;

  /* 전체 wrapper 커스텀 클래스 */
  className?: string;
}

export default function ChatContainer<T>({
  messages,
  messageMapper,
  messageRenderer,
  loadingRenderer,
  listClassName,
  onSend,
  isSending,
  disableVoice,
  placeholder,
  inputClassName,
  className,
}: Props<T>) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);
  
  return (
    <>
      {/* 커스텀 스크롤바 스타일 */}
      <style>{`
        .chatContainer-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .chatContainer-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .chatContainer-scroll::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 10px;
        }
        .chatContainer-scroll::-webkit-scrollbar-button {
          display: none; 
        }
      `}</style>
      <div
        className={`
          flex flex-col ${className || ""}
        `}  
      >
        <div 
          ref={scrollRef}
          className={`flex-1 overflow-y-auto chatContainer-scroll p-2`}>
          <ChatList
            messages={messages}
            {...(messageMapper && { messageMapper })}
            {...(messageRenderer && { messageRenderer })}
            {... (loadingRenderer && { loadingRenderer })}
            {...(listClassName && { className: listClassName })}
          />
        </div>

        <div className="flex-shrink-0">
          <ChatInput
            onSend={onSend}
            {...(isSending && { isSending })}
            {...(disableVoice && { disableVoice })}
            {...(placeholder && { placeholder })}
            {...(inputClassName && { className: inputClassName })}
          />
        </div>
      </div>
    </>
  )
}