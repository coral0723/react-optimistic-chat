export type Message = {
  id: number;
  role: "AI" | "USER";
  content: string;
  isLoading?: boolean;
}