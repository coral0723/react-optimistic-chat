import ChatInput from "../../../../src/components/ChatInput";
import ChatList from "../../../../src/components/ChatList";
import useOptimisticChat from "../../../../src/hooks/useOptimisticChat";
import SendingDots from "../../../../src/components/indicators/SendingDots";
import { useState } from "react";
import "./styles/UseOptimisticChatPG.css";

type Raw = {
  chatId: string;
  sender: "ai" | "user";
  body: string;
};

async function getChat(roomId: string): Promise<Raw[]> {
  const res = await fetch(`/getChat?roomId=${roomId}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error("채팅 불러오기 실패");
  const json = await res.json();
  return json.result;
}

async function sendAI(content: string): Promise<Raw> {
  const res = await fetch(`/sendAI`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) throw new Error("AI 응답 실패");

  const json = await res.json();
  return json.result;
}

export default function UseOptimisticChatPG() {
  const [roomId, setRoomId] = useState<string>("room-1");
  const [forceError, setForceError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const { messages, sendUserMessage, isPending, isInitialLoading } =
    useOptimisticChat<Raw, Raw>({
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
      gcTime: 60 * 10000,
    });

  return (
    <div className="usechat-container">
      <div className="usechat-tab-container">
        {["room-1", "room-2", "room-3"].map((id) => (
          <button
            key={id}
            onClick={() => {
              setRoomId(id);
              setErrorMessage("");
            }}
            className={`usechat-tab-button ${
              roomId === id ? "active" : ""
            }`}
          >
            {id}
          </button>
        ))}
      </div>

      <label className="usechat-checkbox-row">
        <input
          type="checkbox"
          checked={forceError}
          onChange={(e) => setForceError(e.target.checked)}
        />
        <span className="usechat-checkbox-label">전송 에러 발생시키기</span>
      </label>

      {errorMessage && (
        <p className="usechat-error-text">{errorMessage}</p>
      )}

      {isInitialLoading && <p>채팅을 불러오는 중...</p>}

      <ChatList messages={messages} loadingRenderer={<SendingDots />} />

      <ChatInput
        onSend={sendUserMessage}
        isSending={isPending}
      />
    </div>
  );
}
