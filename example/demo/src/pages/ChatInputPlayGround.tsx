import { useState } from "react";
import ChatInput from "../../../../src/components/ChatInput";

export default function ChatInputPlayGround() {
  const [text, setText] = useState<string>("");
  const [value, setValue] = useState<string>("");

  return (
    <div className="max-w-4xl mx-auto flex flex-col">
      <div className=" mb-4 p-2 border border-gray-500 whitespace-pre-wrap">
        {text}
      </div>
      <div className="mb-2 w-full flex flex-col">
        <span className="self-center text-xl font-bold mb-1">
          {"<Default>"}
        </span>
        <ChatInput
          onSend={(t: string) => {
            setText(t);
          }}
        />
      </div>
      <div className="mb-2 w-full flex flex-col">
        <span className="self-center text-xl font-bold mb-1">
          {"<disableVoice>"}
        </span>
        <ChatInput
          onSend={(t: string) => {
            setText(t);
          }}
          disableVoice={true}
        />
      </div>
      <div className="mb-2 w-full flex flex-col">
        <span className="self-center text-xl font-bold mb-1">
          {"<placeholder>"}
        </span>
        <ChatInput
          onSend={(t: string) => {
            setText(t);
          }}
          placeholder="무엇이든 물어보세요"
        />
      </div>
      <div className="mb-2 w-full flex flex-col">
        <span className="self-center text-xl font-bold mb-1">
          {"<maxHeight=50>"}
        </span>
        <ChatInput
          onSend={(t: string) => {
            setText(t);
          }}
          maxHeight={50}
        />
      </div>
      <div className="mb-2 w-full flex flex-col">
        <span className="self-center text-xl font-bold mb-1">
          {"<value & onChange>"}
        </span>
        <ChatInput
          value={value}
          onChange={(e) => setValue(e)}
          onSend={(t: string) => {
            setText(t);
            setValue("");
          }}
        />
      </div>
    </div>
  )
}