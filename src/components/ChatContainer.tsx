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
  return (
    <div
      className={`
        w-full flex flex-col ${className}
      `}  
    >
      <ChatList
        messages={messages}
        {...(messageMapper && { messageMapper })}
        {...(messageRenderer && { messageRenderer })}
        {... (loadingRenderer && { loadingRenderer })}
        {...(listClassName && { className: listClassName })}
      />
      <ChatInput
        onSend={onSend}
        {...(isSending && { isSending })}
        {...(disableVoice && { disableVoice })}
        {...(placeholder && { placeholder })}
        {...(inputClassName && { className: inputClassName })}
      />
    </div>
  )
}