import { useState } from "react";
import useOptimisticChat from "../../../../src/hooks/useOptimisticChat";
import ChatContainer from "../../../../src/components/ChatContainer";
import SendingDots from "../../../../src/components/indicators/SendingDots";
import ChatMessage from "../../../../src/components/ChatMessage";
import "./styles/ChatContainerPG.css";

type Raw = {
  chatId: string;
  sender: "ai" | "user";
  body: string;
};

async function getChat(roomId: string): Promise<Raw[]> {
  const res = await fetch(`/getChat?roomId=${roomId}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error("채팅 불러오기 실패");

  const json = await res.json();
  return json.result;
}

async function sendAI(content: string): Promise<Raw> {
  const res = await fetch(`/sendAI`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ content })
  });

  if (!res.ok) throw new Error("AI 응답 실패");

  const json = await res.json();
  return json.result;
}

export default function ChatContainerPG() {
  const [forceError, setForceError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const roomId = "roomId";

  const { 
    messages, 
    sendUserMessage, 
    isPending, 
    isInitialLoading 
  } = useOptimisticChat<Raw, Raw>({
    queryKey: ["chat", roomId],
    queryFn: () => getChat(roomId),
    mutationFn: async (content) => {
      if (forceError) throw new Error("강제 에러 발생 테스트");
      return sendAI(content);
    },
    map: (raw) => ({
      id: raw.chatId,
      role: raw.sender === "ai" ? "AI" : "USER",
      content: raw.body,
    }),
    onError: () => {
      setErrorMessage("전송 중 오류가 발생했습니다.");
    },
    staleTime: 60 * 1000,
    gcTime: 60 * 10000
  });

  if (isInitialLoading) return <div>로딩 중...</div>;

  return (
    <div className="container-wrapper">

      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={forceError}
          onChange={(e) => setForceError(e.target.checked)}
        />
        <span className="checkbox-label">전송 에러 발생시키기</span>
      </label>

      {errorMessage && (
        <p className="error-text">{errorMessage}</p>
      )}

      <ChatContainer
        className="chat-container-height"
        messages={messages}
        loadingRenderer={<SendingDots />}
        messageRenderer={(msg) => (
          <ChatMessage
            key={msg.id}
            {...msg}
            aiIconWrapperClassName="ai-icon-wrapper-blue"
            aiIconColor="ai-icon-color-blue"
          />
        )}
        onSend={sendUserMessage}
        isSending={isPending}
      />
    </div>
  );
}
