import ChatList from "../../../../src/components/ChatList";
import useVoiceOptimisticChat from "../../../../src/hooks/useVoiceOptimisticChat";
import SendingDots from "../../../../src/components/indicators/SendingDots";
import { useState } from "react";
import useBrowserSpeechRecognition from "../../../../src/hooks/useBrowserSpeechRecognition";

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
    voice: voice,
    queryKey: ["chat", roomId],
    queryFn: () => getChat(roomId),
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
    onError: (err) => {
      console.error(err);
      setErrorMessage("전송 중 오류가 발생했습니다.");
    },
    staleTime: 60 * 1000,
    gcTime: 60 * 10000
  });

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-4 p-4">
      <div className="flex justify-center gap-3 mb-2">
        {["room-1", "room-2", "room-3"].map((id) => (
          <button
            key={id}
            onClick={() => {
              setRoomId(id);
              setErrorMessage("");
            }}
            className={`
              px-3 py-1 rounded border
              ${roomId === id ? "bg-black text-white" : "bg-white"}  
            `}
          >
            {id}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 justify-center">
        <input
          type="checkbox"
          checked={forceError}
          onChange={(e) => setForceError(e.target.checked)}
        />
        <span className="text-sm">전송 에러 발생시키기</span>
      </label>

      {errorMessage && (
        <p className="text-center text-red-500 font-medium">{errorMessage}</p>
      )}

      {/* 로딩 */}
      {isInitialLoading && <p>채팅을 불러오는 중...</p>}

      {/* 메시지 목록 */}
      <ChatList
        messages={messages}
        loadingRenderer={<SendingDots/>}
      />

      {/* 입력창 */}
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
        className={`
          w-full py-3 rounded-lg font-medium
          ${isPending ? "bg-gray-400" : "bg-black text-white"}
        `}
      >
        {isPending
          ? "AI 응답 대기 중..."
          : voice.isRecording
            ? "녹음 종료"
            : "녹음 시작"}
      </button>
    </div>
  )
}