import ChatList from "../../../../src/components/ChatList";
import useVoiceOptimisticChat from "../../../../src/hooks/useVoiceOptimisticChat";
import SendingDots from "../../../../src/components/indicators/SendingDots";
import { useState } from "react";
import useBrowserSpeechRecognition from "../../../../src/hooks/useBrowserSpeechRecognition";
import "./styles/useVoiceOptimisticChatPG.css";

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

export default function UseVoiceOptimisticChatPG() {
  const [roomId, setRoomId] = useState<string>("room-1");
  const [forceError, setForceError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const voice = useBrowserSpeechRecognition();

  const {
    messages,
    isPending,
    isInitialLoading,
    startRecording,
    stopRecording,
  } = useVoiceOptimisticChat<Raw, Raw>({
    voice,
    queryKey: ["chat", roomId],
    queryFn: () => getChat(roomId),
    mutationFn: async (content) => ({
      chatId: crypto.randomUUID(),
      sender: "ai",
      body: content,
    }),
    map: (raw) => ({
      id: raw.chatId,
      role: raw.sender === "ai" ? "AI" : "USER",
      content: raw.body,
    }),
  });

  return (
    <div className="voice-chat-page">
      {/* 방 선택 */}
      <div className="room-selector">
        {["room-1", "room-2", "room-3"].map((id) => (
          <button
            key={id}
            onClick={() => {
              setRoomId(id);
              setErrorMessage("");
            }}
            className={`room-button ${roomId === id ? "active" : ""}`}
          >
            {id}
          </button>
        ))}
      </div>

      {/* 에러 토글 */}
      <label className="error-toggle">
        <input
          type="checkbox"
          checked={forceError}
          onChange={(e) => setForceError(e.target.checked)}
        />
        <span>전송 에러 발생시키기</span>
      </label>

      {errorMessage && (
        <p className="error-message">{errorMessage}</p>
      )}

      {isInitialLoading && <p>채팅을 불러오는 중...</p>}

      <ChatList
        messages={messages}
        loadingRenderer={<SendingDots />}
      />

      {/* 음성 버튼 */}
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (voice.isRecording) {
            stopRecording();
          } else {
            startRecording();
          }
        }}
        className={`record-button ${isPending ? "disabled" : ""}`}
      >
        {isPending
          ? "AI 응답 대기 중..."
          : voice.isRecording
            ? "녹음 종료"
            : "녹음 시작"}
      </button>
    </div>
  );
}
