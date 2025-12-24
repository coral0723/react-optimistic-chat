import { useEffect, useRef, useState } from "react";
import type { Message } from "../types/Message";
import ChatInput from "./ChatInput";
import ChatList from "./ChatList";
import LoadingSpinner from "./indicators/LoadingSpinner";

type MessageProps = {
  messages: Message[];
  messageMapper?: never;
};

type RawProps<T> = {
  messages: T[];
  messageMapper: (msg: T) => Message;
}

type CommonProps = {
  /* ChatList */
  messageRenderer?: (msg: Message) => React.ReactNode;
  loadingRenderer?: React.ReactNode;
  listClassName?: string;

  /* ChatInput */
  onSend: (value: string) => void | Promise<void>;
  isSending: boolean;
  disableVoice?: boolean;
  placeholder?: string;
  inputClassName?: string;

  /* infinite scroll */
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;

  /* 전체 wrapper 커스텀 클래스 */
  className?: string;
};

type Props<T> = CommonProps & (MessageProps | RawProps<T>);

export default function ChatContainer<T>(props: Props<T>) {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    messageRenderer,
    loadingRenderer,
    listClassName,
    onSend,
    isSending,
    disableVoice,
    placeholder,
    inputClassName,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    className,
  } = props;

  const mappedMessages: Message[] = 
    typeof props.messageMapper === "function"
      ? props.messages.map(props.messageMapper)
      : (messages as Message[]);

  // 스크롤 이벤트 처리
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = async () => {
      const isBottom =
        el.scrollTop + el.clientHeight >= el.scrollHeight - 10;
      setIsAtBottom(isBottom);

      // 최상단 도달 시 과거 메시지 로딩
      if (
        el.scrollTop === 0 &&
        hasNextPage &&
        !isFetchingNextPage &&
        fetchNextPage
      ) {
        const prevScrollHeight = el.scrollHeight;

        await fetchNextPage();
        
        requestAnimationFrame(() => {
          const newScrollHeight = el.scrollHeight;
          el.scrollTop = newScrollHeight - prevScrollHeight;
        });
      }
    };

    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  // 메시지 변경 시 하단 고정
  useEffect(() => { 
    const el = scrollRef.current; 
    if (!el) return; 
    if (isAtBottom) { 
      el.scrollTop = el.scrollHeight; 
  } }, [messages, isAtBottom]);

  // 스크롤 하단 이동 함수
  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setIsAtBottom(true);
  };

  // 사용자 메시지 전송 시 스크롤 하단으로 이동
  const handleSend = async (value: string) => {
    setIsAtBottom(true);

    requestAnimationFrame(() => {
      scrollToBottom();
    });

    await onSend(value);
  };
  
  return (
    <>
      <div
        className={`
          flex flex-col ${className || ""}
        `}  
      >
        <div 
          ref={scrollRef}
          className={`flex-1 overflow-y-auto chatContainer-scroll p-2`}
        >
          {hasNextPage && isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <LoadingSpinner size="sm"/>
            </div>
          )}
          <ChatList
            messages={mappedMessages}
            {...(messageRenderer && { messageRenderer })}
            {... (loadingRenderer && { loadingRenderer })}
            {...(listClassName && { className: listClassName })}
          />
        </div>

        <div className="flex-shrink-0 relative">
          {!isAtBottom && (
            <button
              onClick={scrollToBottom}
              className="
                absolute bottom-20 left-1/2 -translate-x-1/2
                w-10 h-10 rounded-full bg-white font-bold
                flex items-center justify-center
                border-gray-200 border-[1px]
              "
              aria-label="scroll to bottom"
            >
              <svg xmlns="http://www.w3.org/2000/svg" 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M12 5v14"/>
                <path d="m19 12-7 7-7-7"/>
              </svg>
            </button>
          )}
          <ChatInput
            onSend={handleSend}
            isSending={isSending}
            {...(disableVoice && { disableVoice })}
            {...(placeholder && { placeholder })}
            {...(inputClassName && { className: inputClassName })}
          />
        </div>
      </div>
    </>
  )
}