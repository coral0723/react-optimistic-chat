import type { Message } from "../types/Message";
import LoadingSpinner from "./indicators/LoadingSpinner";
import React from "react";

type Props = Message & {
  /* wrapper 커스텀 클래스 */
  wrapperClassName?: string;

  /* AI 아이콘 */
  icon?: React.ReactNode;

  /* AI 아이콘 wrapper override */
  aiIconWrapperClassName?: string;

  /* AI 기본 아이콘의 색상 (stroke) */
  aiIconColor?: string;

  /* 공통 bubble 커스텀 클래스 */
  bubbleClassName?: string;

  /* role별 bubble 커스텀 클래스 */
  aiBubbleClassName?: string;
  userBubbleClassName?: string;

  /* 위치 override */
  position?: "auto" | "left" | "right";

  loadingRenderer?: React.ReactNode;
};

export default function ChatMessage({
  id,
  role,
  content,
  isLoading = false,
  wrapperClassName = "",
  icon,
  aiIconWrapperClassName = "",
  aiIconColor = "",
  bubbleClassName = "",
  aiBubbleClassName = "",
  userBubbleClassName = "",
  position = "auto",
  loadingRenderer,
}: Props) {
  const isAI = role === "AI";

  // 위치 결정
  const justify =
    position === "auto"
      ? isAI
        ? "justify-start"
        : "justify-end"
      : position === "left"
      ? "justify-start"
      : "justify-end";

  // 기본 AI 아이콘
  const defaultAIIcon = (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`${aiIconColor}`}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 8V4H8" />
      <rect width="16" height="12" x="4" y="8" rx="2" />
      <path d="M2 14h2" />
      <path d="M20 14h2" />
      <path d="M15 13v2" />
      <path d="M9 13v2" />
    </svg>
  );

  return (
    <div key={id} className={`flex mb-4 items-start ${justify} ${wrapperClassName}`}>
      
      {/* AI 아이콘 */}
      {isAI && (
        <div
          className={`
            mr-2 bg-gray-100 rounded-full p-2 border-2 border-black
            ${aiIconWrapperClassName}
          `}
        >
          {/* icon이 없을 때만 기본 SVG 사용 + 색상 커스터마이징 */}
          {icon || defaultAIIcon}
        </div>
      )}

      {/* 말풍선 */}
      <div
        className={`
          py-3 px-3 max-h-96 overflow-y-auto w-fit max-w-[calc(100%-3rem)]
          whitespace-pre-wrap break-words text-sm
          ${
            isAI
              ? `bg-gray-100 border-gray-200 rounded-b-xl rounded-t-xl ${aiBubbleClassName}`
              : `bg-white border border-gray-200 rounded-b-xl rounded-tl-xl ${userBubbleClassName}`
          }
          ${bubbleClassName}
        `}
      >
        {isLoading 
          ? loadingRenderer ?? <LoadingSpinner size="xs"/>
          : content
        }
      </div>
    </div>
  );
}
