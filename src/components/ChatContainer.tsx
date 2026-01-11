import { useEffect, useRef, useState } from "react";
import type { Message } from "../types/Message";
import ChatInput from "./ChatInput";
import ChatList from "./ChatList";
import LoadingSpinner from "./indicators/LoadingSpinner";

type MessageProps = {
  messages: Message[];
  messageMapper?: never;
};

type RawProps<Raw> = {
  messages: Raw[];
  messageMapper: (msg: Raw) => Message;
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

type Props<Raw> = CommonProps & (MessageProps | RawProps<Raw>);

export default function ChatContainer<Raw>(props: Props<Raw>) {
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
      <div className={`roc-chat-container ${className || ""}`}>
        <div 
          ref={scrollRef}
          className="roc-chat-container__list"
        >
          {hasNextPage && isFetchingNextPage && (
            <div className="roc-chat-container__loading">
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

        <div className="roc-chat-container__input">
          {!isAtBottom && (
            <button
              className="roc-chat-container__scroll-button"
              onClick={scrollToBottom}
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