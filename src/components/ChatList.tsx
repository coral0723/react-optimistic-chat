import type { Message } from "../types/Message";
import React from "react";
import ChatMessage from "./ChatMessage";

type Props<T> = {
  /* 원본 메시지 배열 */
  messages: T[];

  /* messages를 MappedMessage 형태로 변환하는 함수 */
  messageMapper?: (msg: T) => Message;

  /* 커스텀 메시지 UI를 사용하고 싶을 때 */
  messageRenderer?: (msg: Message) => React.ReactNode;

  /* wrapper 커스텀 클래스 */
  className?: string;
};

export default function ChatList<T>({
  messages,
  messageMapper,
  messageRenderer,
  className,
}: Props<T>) {
  /*
  messages가 이미 MappedMessage 구조일 수도 있고 아닐 수도 있기 때문에
  messageMapper 여부에 따라 반환 처리
  */
  const mappedMessages: Message[] = messageMapper
    ? messages.map(messageMapper)
    : (messages as unknown as Message[]);

  return (
    <div className={`flex flex-col ${className}`}>
      {mappedMessages.map((msg) => {
        /*
        사용자가 messageRenderer를 제공했다면
        ChatMessage 대신 그걸 렌더링
        */
        if(messageRenderer) {
          return (
            <React.Fragment key={msg.id}>
              {messageRenderer(msg)}
            </React.Fragment>
          );
        }

        return (
          <ChatMessage
            key={msg.id}
            {...msg}
          />
        );
      })}
    </div>
  )
}
