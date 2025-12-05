import ChatList from "../../../../src/components/ChatList";
import { dummyMessages } from "../data/dummyMessages";
import { dummyBackendData } from "../data/dummyBackendMessages";
import ChatMessage from "../../../../src/components/ChatMessage";

export default function ChatListPlayGround() {
  return (
    <div className="grid grid-cols-3">
      <div className="max-w-lg flex flex-col items-center">
        <span className="mb-4 font-bold text-2xl">{"<Default>"}</span>
        <ChatList
          messages={dummyMessages}
        />
      </div>
      <div className="max-w-lg flex flex-col items-center">
        <span className="mb-4 font-bold text-2xl">{"<Backend Data Mapping>"}</span>
        <ChatList
          messages={dummyBackendData}
          messageMapper={(msg) => ({
            id: Number(msg.chatId),
            role: msg.sender === "bot" ? "AI" : "USER",
            content: msg.body,
          })}
        />
      </div>
      <div className="max-w-lg flex flex-col items-center">
        <span className="mb-4 font-bold text-2xl">{"<Custom Message UI>"}</span>
        <ChatList
          messages={dummyBackendData}
          messageMapper={(msg) => ({
            id: Number(msg.chatId),
            role: msg.sender === "bot" ? "AI" : "USER",
            content: msg.body,
          })}
          messageRenderer={(msg) => (
            <ChatMessage
              key={msg.id}
              {...msg}
              wrapperClassName="my-4"
              aiIconWrapperClassName="bg-blue-200 border-blue-400"
              aiIconColor="text-blue-600"
              bubbleClassName="shadow-md"
              aiBubbleClassName="bg-blue-50 border-blue-100"
              userBubbleClassName="bg-white border-gray-300"
            />
          )}
        />
      </div>
    </div>
  )
}
