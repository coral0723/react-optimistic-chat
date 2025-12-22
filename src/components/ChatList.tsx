import type { BaseMessage, Message } from "../types/Message";
import React from "react";
import ChatMessage from "./ChatMessage";

/* MessageMapper는 Message의 일부만 override */
type MessagePatch = Partial<BaseMessage> & Record<string, unknown>;

type Props<T extends Message = Message> = {
  /* 원본 메시지 배열 */
  messages: T[];

  /* Message 중 바꾸고 싶은 필드만 변환하는 함수 */
  messageMapper?: (msg: T) => MessagePatch;

  /* 커스텀 메시지 UI를 사용하고 싶을 때 */
  messageRenderer?: (msg: T) => React.ReactNode;

  /* wrapper 커스텀 클래스 */
  className?: string;

  loadingRenderer?: React.ReactNode;
};

export default function ChatList<T extends Message>({
  messages,
  messageMapper,
  messageRenderer,
  className,
  loadingRenderer,
}: Props<T>) {
  /*
  messages가 이미 MappedMessage 구조일 수도 있고 아닐 수도 있기 때문에
  messageMapper 여부에 따라 반환 처리
  */
  const mappedMessages: T[] = messageMapper
    ? messages.map((msg) => ({
      ...msg,
      ...messageMapper(msg),
      }))
    : messages;

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
            loadingRenderer={loadingRenderer}
          />
        );
      })}
    </div>
  )
}
