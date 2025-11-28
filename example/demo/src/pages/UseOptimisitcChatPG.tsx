import ChatInput from "../../../../src/components/ChatInput";
import ChatList from "../../../../src/components/ChatList";
import useOptimisticChat from "../../../../src/hooks/useOptimisticChat";
import SendingDots from "../../../../src/components/indicators/SendingDots";

type Raw = {
  chatId: string;
  sender: "ai" | "user";
  body: string;
}

async function getChat(): Promise<Raw[]> {
  return Promise.resolve([
    { chatId: "1", sender: "user", body: "안녕하세요!" },
    { chatId: "2", sender: "ai", body: "무엇을 도와드릴까요?" },
  ]);
}

async function sendAI(content: string): Promise<Raw> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        chatId: crypto.randomUUID(),
        sender: "ai",
        body: `AI 응답: ${content}`,
      });
    }, 3000);
  });
}

export default function UseOptimisticChatPG() {
  const roomId = "test-room-1";

  const { 
    messages, 
    sendUserMessage, 
    isPending, 
    isInitialLoading 
  } = useOptimisticChat<Raw, Raw>({
    queryKey: ["chat", roomId],
    queryFn: getChat,
    mutationFn: sendAI,
    map: (raw) => ({
      id: raw.chatId,
      role: raw.sender === "ai" ? "AI" : "USER",
      content: raw.body,
    }),
  });

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4 p-4">
      <h2 className="text-xl font-bold mb-2">useOptimisticChat Demo</h2>

      {/* 로딩 */}
      {isInitialLoading && <p>채팅을 불러오는 중...</p>}

      {/* 메시지 목록 */}
      <ChatList
        messages={messages}
        loadingRenderer={<SendingDots/>}
      />

      {/* 입력창 */}
      <ChatInput
        onSend={sendUserMessage}
        isSending={isPending}
        disableVoice={true}
      />
    </div>
  )
}