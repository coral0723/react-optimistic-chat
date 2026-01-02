export type ChatRole = "AI" | "USER";

export type BaseMessage = {
  id: number | string;
  role: ChatRole;
  content: string;
  isLoading?: boolean;
}

// map 함수에서 반드시 반환해야 하는 최소 필드
export type MessageCore = Pick<BaseMessage, "id" | "role" | "content">;

export type Message<TCustom = unknown> = BaseMessage & {
  custom?: TCustom;
};
