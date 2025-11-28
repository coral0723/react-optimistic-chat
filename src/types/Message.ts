export type Message = {
  id: number | string;
  role: "AI" | "USER";
  content: string;
  isLoading?: boolean;
}