import { Routes, Route } from "react-router-dom";
import LinkButton from "./components/LinkButton";
import ChatMessagePlayground from "./pages/ChatMessagePlayGround"
import ChatListPlayGround from "./pages/ChatListPlayGround";
import ChatInputPlayGround from "./pages/ChatInputPlayGround";
import UseOptimisticChatPG from "./pages/UseOptimisitcChatPG";

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
            </div>
          }
        />
        <Route path="/chat-message" element={<ChatMessagePlayground />} />
        <Route path="/chat-list" element={<ChatListPlayGround/>} />
        <Route path="/chat-lnput" element={<ChatInputPlayGround/>} />
        <Route path="/use-optimistic-chat" element={<UseOptimisticChatPG/>} />
      </Routes>
    </div>
  );
}
