import { Routes, Route } from "react-router-dom";
import LinkButton from "./components/LinkButton";
import ChatMessagePlayGround from "./pages/ChatMessagePlayGround"
import ChatListPlayGround from "./pages/ChatListPlayGround";
import ChatInputPlayGround from "./pages/ChatInputPlayGround";
import UseOptimisticChatPG from "./pages/UseOptimisitcChatPG";
import ChatContainerPG from "./pages/ChatContainerPG";

export default function App() {
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">React Optimistic Chat Examples</h1>

      <Routes>
        <Route
          path="/"
          element={
            <div className="space-y-3 max-w-xs">
              <LinkButton label="ChatMessage Playground" to="/chat-message" />
              <LinkButton label="ChatList Playground" to="/chat-list" />
              <LinkButton label="ChatInput Playground" to="/chat-lnput" />
              <LinkButton label="useOptimisticChat Playground" to="/use-optimistic-chat" />
              <LinkButton label="chatContainer Playground" to="/chat-container" />
            </div>
          }
        />
        <Route path="/chat-message" element={<ChatMessagePlayGround />} />
        <Route path="/chat-list" element={<ChatListPlayGround/>} />
        <Route path="/chat-lnput" element={<ChatInputPlayGround/>} />
        <Route path="/use-optimistic-chat" element={<UseOptimisticChatPG/>} />
        <Route path="/chat-container" element={<ChatContainerPG/>} />
      </Routes>
    </div>
  );
}
