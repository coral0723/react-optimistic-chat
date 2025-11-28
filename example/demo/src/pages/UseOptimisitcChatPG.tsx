import ChatInput from "../../../../src/components/ChatInput";
import ChatList from "../../../../src/components/ChatList";
import useOptimisticChat from "../../../../src/hooks/useOptimisticChat";
import SendingDots from "../../../../src/components/indicators/SendingDots";

type Raw = {
  chatId: string;
  sender: "ai" | "user";
  body: string;
}

async function getChat(roomId: string): Promise<Raw[]> {
  const res = await fetch(`/getChat?roomId=${roomId}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok)
    throw new Error("채팅 불러오기 실패");

  const json = await res.json();
  return json.result;
}

async function sendAI(content: string): Promise<Raw> {
  const res = await fetch(`/sendAI`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ content })
  })

  if (!res.ok)
    throw new Error("AI 응답 실패");

  const json = await res.json();
  return json.result;
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
    queryFn: () => getChat(roomId),
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