import ChatList from "../../../../src/components/ChatList";
import { dummyMessages } from "../data/dummyMessages";
import { dummyBackendData } from "../data/dummyBackendMessages";
import ChatMessage from "../../../../src/components/ChatMessage";
import "./styles/chatListPlayGround.css";

export default function ChatListPlayGround() {
  return (
    <div className="pg-grid">
      <div className="pg-section">
        <span className="pg-title">{"<Default>"}</span>
        <ChatList messages={dummyMessages} />
      </div>

      <div className="pg-section">
        <span className="pg-title">{"<Backend Data Mapping>"}</span>
        <ChatList
          messages={dummyBackendData}
          messageMapper={(msg) => ({
            id: Number(msg.chatId),
            role: msg.sender === "bot" ? "AI" : "USER",
            content: msg.body,
          })}
        />
      </div>

      <div className="pg-section">
        <span className="pg-title">{"<Custom Message UI>"}</span>
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
              wrapperClassName="pg-wrapper"
              aiIconWrapperClassName="pg-ai-icon-wrapper"
              aiIconColor="pg-ai-icon-color"
              bubbleClassName="pg-bubble"
              aiBubbleClassName="pg-ai-bubble"
              userBubbleClassName="pg-user-bubble"
            />
          )}
        />
      </div>
    </div>
  );
}
