import { Routes, Route } from "react-router-dom";
import LinkButton from "./components/LinkButton";
import ChatMessagePlayground from "./pages/ChatMessagePlayGround"
import ChatListPlayGround from "./pages/ChatListPlayGround";

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
            </div>
          }
        />
        <Route path="/chat-message" element={<ChatMessagePlayground />} />
        <Route path="/chat-list" element={<ChatListPlayGround/>} />
      </Routes>
    </div>
  );
}
