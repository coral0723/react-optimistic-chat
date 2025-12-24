import { useState } from "react";
import useChat from "../../../../src/hooks/useChat";
import ChatContainer from "../../../../src/components/ChatContainer";
import SendingDots from "../../../../src/components/indicators/SendingDots";
import ChatMessage from "../../../../src/components/ChatMessage";
import "./styles/ChatContainerPG.css";

type Raw = {
  chatId: string;
  sender: "ai" | "user";
  body: string;
};

async function getChat(roomId: string, pageParam: number): Promise<Raw[]> {
  const res = await fetch(`/getChat?roomId=${roomId}&page=${pageParam}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error("채팅 불러오기 실패");

  const json = await res.json();
  return json.result;
}

async function sendAI(content: string, forceError: boolean): Promise<Raw> {
  const res = await fetch(`/sendAI`, {
    method: "POST",
    headers: { "Content-Type": "application/json"},
    body: JSON.stringify({ content, forceError })
  });

  if (!res.ok) throw new Error("AI 응답 실패");

  const json = await res.json();
  return json.result;
}

export default function ChatContainerPG() {
  const [forceError, setForceError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const roomId = "roomId";
  const PAGE_SIZE = 8;

  const { 
    messages, 
    sendUserMessage, 
    isPending, 
    isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useChat<Raw>({
    queryKey: ["chat", roomId],
    queryFn: (pageParam) => getChat(roomId, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPage) => {
      if (lastPage.length === PAGE_SIZE) {
        return allPage.length;
      }
      return undefined;
    },
    mutationFn: async (content) => {
      return sendAI(content, forceError);
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
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
      />
    </div>
  );
}
