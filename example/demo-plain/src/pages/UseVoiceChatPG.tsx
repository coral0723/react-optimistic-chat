import ChatList from "../../../../src/components/ChatList";
import useVoiceChat from "../../../../src/hooks/useVoiceChat";
import SendingDots from "../../../../src/components/indicators/SendingDots";
import { useState } from "react";
import useBrowserSpeechRecognition from "../../../../src/hooks/useBrowserSpeechRecognition";
import "./styles/useVoiceOptimisticChatPG.css";

type Raw = {
  chatId: string;
  sender: "ai" | "user";
  body: string;
  end?: boolean;
};

async function getChat(roomId: string, pageParam: number): Promise<Raw[]> {
  const res = await fetch(`/getChat?roomId=${roomId}&page=${pageParam}`, {
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

export default function UseVoiceChatPG() {
  const [roomId, setRoomId] = useState<string>("room-1");
  const [forceError, setForceError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const PAGE_SIZE = 8;

  const voice = useBrowserSpeechRecognition();

  const {
    messages,
    isPending,
    isInitialLoading,
    startRecording,
    stopRecording,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useVoiceChat<Raw>({
    voice,
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
      if (forceError) 
        throw new Error("강제 에러 발생 테스트");
      return sendAI(content);
    },
    map: (raw) => ({
      id: raw.chatId,
      role: raw.sender === "ai" ? "AI" : "USER",
      content: raw.body,
    }),
  });

  const lastMessageEnd = messages[messages.length - 1]?.custom.end ? true : false;

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
        messageMapper={(msg) => ({
          content: msg.custom.end === true ? "true입니당" : msg.content,
        })}
        loadingRenderer={<SendingDots />}
      />

      {messages.length > 0 && (
        <p className="text-center text-sm text-gray-500">
          마지막 메시지 end 값:{" "}
          <strong>{lastMessageEnd ? "true" : "false"}</strong>
        </p>
      )}

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "이전 채팅 불러오는 중" : "이전 채팅 더 불러오기"}
        </button>
      )}

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
