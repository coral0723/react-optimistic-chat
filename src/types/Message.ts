export type ChatRole = "AI" | "USER";

export type BaseMessage = {
  id: number | string;
  role: ChatRole;
  content: string;
  isLoading?: boolean;
}

export type Message<TExtra = {}> = BaseMessage & TExtra;