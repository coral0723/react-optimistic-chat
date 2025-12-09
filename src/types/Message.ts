export type ChatRole = "AI" | "USER";

export type Message = {
  id: number | string;
  role: ChatRole;
  content: string;
  isLoading?: boolean;
}