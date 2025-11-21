import { Routes, Route } from "react-router-dom";
import LinkButton from "./components/LinkButton";
import ChatMessagePlayground from "./pages/ChatMessagePlayGround"

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
            </div>
          }
        />
        <Route path="/chat-message" element={<ChatMessagePlayground />} />
      </Routes>
    </div>
  );
}
