import { useState } from "react";
import ChatInput from "../../../../src/components/ChatInput";
import "./styles/ChatInputPlayGround.css";

export default function ChatInputPlayGround() {
  const [text, setText] = useState<string>("");
  const [value, setValue] = useState<string>("");

  return (
    <div className="chatinput-page-container">
      <div className="chatinput-output-box">
        {text}
      </div>

      <div className="chatinput-section">
        <span className="chatinput-title">{"<Default>"}</span>
        <ChatInput
          onSend={(t: string) => {
            setText(t);
          }}
        />
      </div>

      <div className="chatinput-section">
        <span className="chatinput-title">{"<disableVoice>"}</span>
        <ChatInput
          onSend={(t: string) => {
            setText(t);
          }}
          disableVoice={true}
        />
      </div>

      <div className="chatinput-section">
        <span className="chatinput-title">{"<placeholder>"}</span>
        <ChatInput
          onSend={(t: string) => {
            setText(t);
          }}
          placeholder="무엇이든 물어보세요"
        />
      </div>

      <div className="chatinput-section">
        <span className="chatinput-title">{"<maxHeight=50>"}</span>
        <ChatInput
          onSend={(t: string) => {
            setText(t);
          }}
          maxHeight={50}
        />
      </div>

      <div className="chatinput-section">
        <span className="chatinput-title">{"<value & onChange>"}</span>
        <ChatInput
          value={value}
          onChange={(e) => setValue(e)}
          onSend={(t: string) => {
            setText(t);
            setValue("");
          }}
        />
      </div>

      <div className="chatinput-section">
        <span className="chatinput-title">{"<async/await>"}</span>
        <ChatInput
          onSend={async (t: string) => {
            await new Promise((r) => setTimeout(r, 2000));
            setText(t);
            console.log("sended", t);
          }}
        />
      </div>
    </div>
  );
}
