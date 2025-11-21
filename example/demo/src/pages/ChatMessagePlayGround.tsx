import { useState } from "react";
import ChatMessage from "../../../../src/components/ChatMessage";

export default function ChatMessagePlayGround() {
  const [isLoading, setIsLoading] = useState(false);
  const [aiBubble, setAiBubble] = useState("");
  const [bubbleCommon, setBubbleCommon] = useState("");
  const [wrapperClass, setWrapperClass] = useState("");
  const [aiIconWrapper, setAiIconWrapper] = useState("");
  const [aiIconColor, setAiIconColor] = useState("");
  const [position, setPosition] = useState<"auto" | "left" | "right">("auto");

  return (
    <div className="flex h-screen">
      {/* LEFT: Preview */}
      <div className="bg-gray-200 max-w-4xl p-4 flex-1 overflow-y-auto">
        <h2 className="text-lg font-bold mb-4">Preview</h2>

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

      {/* RIGHT: Controls */}
      <div className="w-[400px] border-l p-6 overflow-y-auto bg-white">
        <h2 className="text-xl font-bold mb-4">Props Playground</h2>

        {/* isLoading */}
        <label className="block mb-4">
          <div className="font-medium mb-1">isLoading</div>
          <input
            type="checkbox"
            checked={isLoading}
            onChange={(e) => setIsLoading(e.target.checked)}
          />
        </label>

        {/* aiBubbleClassName */}
        <label className="block mb-4">
          <div className="font-medium mb-1">aiBubbleClassName</div>
          <select
            className="border p-2 w-full"
            value={aiBubble}
            onChange={(e) => setAiBubble(e.target.value)}
          >
            <option value="">기본값</option>
            <option value="bg-purple-200 border-purple-300">
              보라색 말풍선
            </option>
            <option value="bg-blue-200 border-blue-300">
              파란색 말풍선
            </option>
            <option value="bg-green-200 border-green-300">
              초록색 말풍선
            </option>
            <option value="bg-yellow-200 border-yellow-300">
              노란색 말풍선
            </option>
          </select>
        </label>

        {/* bubbleClassName */}
        <label className="block mb-4">
          <div className="font-medium mb-1">bubbleClassName</div>
          <select
            className="border p-2 w-full"
            value={bubbleCommon}
            onChange={(e) => setBubbleCommon(e.target.value)}
          >
            <option value="">없음</option>
            <option value="shadow">shadow</option>
            <option value="border-4">border</option>
            <option value="text-sm">text-sm</option>
            <option value="text-base">text-base</option>
          </select>
        </label>

        {/* wrapperClassName */}
        <label className="block mb-4">
          <div className="font-medium mb-1">wrapperClassName</div>
          <select
            className="border p-2 w-full"
            value={wrapperClass}
            onChange={(e) => setWrapperClass(e.target.value)}
          >
            <option value="">없음</option>
            <option value="bg-red-50">bg-red-50</option>
            <option value="bg-gray-50">bg-gray-50</option>
            <option value="p-2">padding 2</option>
          </select>
        </label>

        {/* aiIconWrapperClassName */}
        <label className="block mb-4">
          <div className="font-medium mb-1">aiIconWrapperClassName</div>
          <select
            className="border p-2 w-full"
            value={aiIconWrapper}
            onChange={(e) => setAiIconWrapper(e.target.value)}
          >
            <option value="">기본값</option>
            <option value="bg-purple-200 border-purple-400">
              보라색 아이콘 배경
            </option>
            <option value="bg-blue-200 border-blue-400">
              파란색 아이콘 배경
            </option>
            <option value="bg-green-200 border-green-400">
              초록색 아이콘 배경
            </option>
          </select>
        </label>

        {/* aiIconColor */}
        <label className="block mb-4">
          <div className="font-medium mb-1">aiIconColor</div>
          <select
            className="border p-2 w-full"
            value={aiIconColor}
            onChange={(e) => setAiIconColor(e.target.value)}
          >
            <option value="">기본값</option>
            <option value="text-purple-500">보라색</option>
            <option value="text-blue-500">파란색</option>
            <option value="text-green-500">초록색</option>
            <option value="text-red-500">빨간색</option>
          </select>
        </label>

        {/* Position */}
        <label className="block mb-4">
          <div className="font-medium mb-1">Position</div>
          <select
            className="border p-2 w-full"
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
