import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BaseMessage, Message } from "../types/Message";
import { useState } from "react";

type ExtraFromRaw<TRaw> = Omit<TRaw, keyof BaseMessage>;

type MessageMapperResult = Pick<BaseMessage, "id" | "role" | "content">;

type MessageMapper<TRaw> = Message<ExtraFromRaw<TRaw>>;

type Options<TRaw> = {
  /* 해당 채팅의 queryKey */
  queryKey: readonly unknown[];

  /* 기존 채팅 내역을 가져오는 함수 */
  queryFn: () => Promise<TRaw[]>;

  /* 유저 입력(content)을 넘겨서 AI응답 1개를 받아오는 함수 */
  mutationFn: (content: string) => Promise<TRaw>; 

  /* raw 데이터를 Message로 변환하는 mapper */
  map: (raw: TRaw) => MessageMapperResult;

  /* mutation 에러가 발생한 경우 외부에서 처리하고 싶을 때 사용하는 콜백 */
  onError?: (error: unknown) => void;

  staleTime?: number;
  gcTime?: number;
};

export default function useOptimisticChat<TRaw>({ 
  queryKey, 
  queryFn, 
  mutationFn,
  map,
  onError, 
  staleTime = 0,
  gcTime = 0,
}: Options<TRaw>) {
  const [isPending, setIsPending] = useState<boolean>(false); // AI 응답 대기 상태
  const queryClient = useQueryClient();

  // 내부적으로 queryFn(raw[]) -> Message[]로 변환해서 캐시에 저장
  const { 
    data: messages = [], 
    isLoading: isInitialLoading 
  } = useQuery<MessageMapper<TRaw>[]>({
    queryKey,
    queryFn: async () => {
      const raw = await queryFn();
      return raw.map((r) => ({
        ...map(r),
        ...(r as ExtraFromRaw<TRaw>),
      }));
    },
    staleTime,
    gcTime,
  });

  const mutation = useMutation<
    TRaw, 
    unknown, 
    string, 
    { prev?: MessageMapper<TRaw>[] }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async (content) => {
      setIsPending(true);

      const prev = queryClient.getQueryData<MessageMapper<TRaw>[]>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      queryClient.setQueryData<MessageMapper<TRaw>[]>(queryKey, (old) => {
        const base = old ?? [];

        return [
          ...base,
          // user 메시지 추가
          {
            id: crypto.randomUUID(),
            role: "USER",
            content,
          } as MessageMapper<TRaw>,
          // AI placeholder 추가
          {
            id: crypto.randomUUID(),
            role: "AI",
            content: "",
            isLoading: true,
          } as MessageMapper<TRaw>,
        ]; 
      });

      // rollback context 반환
      return prev ? { prev } : {};
    },
    onSuccess: (rawAiResponse) => { 
      // 서버의 응답을 Message로 변환
      const aiMessage = {
        ...map(rawAiResponse),
        ...(rawAiResponse as ExtraFromRaw<TRaw>),
      };

      queryClient.setQueryData(queryKey, (old?: MessageMapper<TRaw>[]) => {
        if (!old || old.length === 0) {
          return [aiMessage];
        }

        const next = [...old];
        const lastIndex = next.length - 1;

        // AI placeholder 제거 + 실제 메시지로 변경
        next[lastIndex] = {
          ...next[lastIndex],
          ...aiMessage,
          isLoading: false,
        };

        return next;
      });

      setIsPending(false);
    },
    onError: (error, _variables, context) => {
      setIsPending(false);
      
      // context 기반 rollback
      if (context?.prev) {
        queryClient.setQueryData(queryKey, context.prev);
      }

      onError?.(error);
    },
  });

  // 유저 메시지 전송
  const sendUserMessage = (content: string) => {
    if (!content.trim()) return;
    mutation.mutate(content);
  }

  return {
    messages, // Message[]
    sendUserMessage, // (content: string) => void
    isPending, // 사용자가 채팅 전송 후 AI 응답이 올 때까지의 로딩
    isInitialLoading // 초기 로딩 상태
  };
}
