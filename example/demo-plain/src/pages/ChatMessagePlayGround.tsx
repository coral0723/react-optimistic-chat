import { useState } from "react";
import ChatMessage from "../../../../src/components/ChatMessage";
import "./styles/chatMessagePlayGround.css";

export default function ChatMessagePlayGround() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiBubble, setAiBubble] = useState("");
  const [bubbleCommon, setBubbleCommon] = useState("");
  const [wrapperClass, setWrapperClass] = useState("");
  const [aiIconWrapper, setAiIconWrapper] = useState("");
  const [aiIconColor, setAiIconColor] = useState("");
  const [position, setPosition] = useState<"auto" | "left" | "right">("auto");

  return (
    <div className="playground-container">
      <div className="preview-area">
        <h2 className="preview-title">Preview</h2>

        <ChatMessage
          id={1}
          role="AI"
          content="안녕하세요! 무엇을 도와드릴까요?"
          isLoading={isLoading}
          aiBubbleClassName={aiBubble}
          bubbleClassName={bubbleCommon}
          wrapperClassName={wrapperClass}
          aiIconWrapperClassName={aiIconWrapper}
          aiIconColor={aiIconColor}
          position={position}
        />

        <ChatMessage
          id={2}
          role="USER"
          content="아무것도 아니야!"
          bubbleClassName={bubbleCommon}
        />
      </div>

      <div className="control-area">
        <h2 className="control-title">Props Playground</h2>

        <label className="control-block">
          <div className="control-label">isLoading</div>
          <input
            type="checkbox"
            checked={isLoading}
            onChange={(e) => setIsLoading(e.target.checked)}
          />
        </label>

        <label className="control-block">
          <div className="control-label">aiBubbleClassName</div>
          <select
            className="control-select"
            value={aiBubble}
            onChange={(e) => setAiBubble(e.target.value)}
          >
            <option value="">기본값</option>
            <option value="bubble-purple">보라색 말풍선</option>
            <option value="bubble-blue">파란색 말풍선</option>
            <option value="bubble-green">초록색 말풍선</option>
            <option value="bubble-yellow">노란색 말풍선</option>
          </select>
        </label>

        <label className="control-block">
          <div className="control-label">bubbleClassName</div>
          <select
            className="control-select"
            value={bubbleCommon}
            onChange={(e) => setBubbleCommon(e.target.value)}
          >
            <option value="">없음</option>
            <option value="bubble-shadow">shadow</option>
            <option value="bubble-border">border</option>
            <option value="text-sm-custom">text-sm</option>
            <option value="text-base-custom">text-base</option>
          </select>
        </label>

        <label className="control-block">
          <div className="control-label">wrapperClassName</div>
          <select
            className="control-select"
            value={wrapperClass}
            onChange={(e) => setWrapperClass(e.target.value)}
          >
            <option value="">없음</option>
            <option value="wrapper-red">bg-red-50</option>
            <option value="wrapper-gray">bg-gray-50</option>
            <option value="wrapper-padding">padding 2</option>
          </select>
        </label>

        <label className="control-block">
          <div className="control-label">aiIconWrapperClassName</div>
          <select
            className="control-select"
            value={aiIconWrapper}
            onChange={(e) => setAiIconWrapper(e.target.value)}
          >
            <option value="">기본값</option>
            <option value="icon-purple">보라색 아이콘 배경</option>
            <option value="icon-blue">파란색 아이콘 배경</option>
            <option value="icon-green">초록색 아이콘 배경</option>
          </select>
        </label>

        <label className="control-block">
          <div className="control-label">aiIconColor</div>
          <select
            className="control-select"
            value={aiIconColor}
            onChange={(e) => setAiIconColor(e.target.value)}
          >
            <option value="">기본값</option>
            <option value="text-purple-custom">보라색</option>
            <option value="text-blue-custom">파란색</option>
            <option value="text-green-custom">초록색</option>
            <option value="text-red-custom">빨간색</option>
          </select>
        </label>

        <label className="control-block">
          <div className="control-label">Position</div>
          <select
            className="control-select"
            value={position}
            onChange={(e) =>
              setPosition(e.target.value as "auto" | "left" | "right")
            }
          >
            <option value="auto">auto (AI=left, USER=right)</option>
            <option value="left">left</option>
            <option value="right">right</option>
          </select>
        </label>
      </div>
    </div>
  );
}
