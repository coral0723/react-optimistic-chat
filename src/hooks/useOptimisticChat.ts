import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message } from "../types/Message";
import { useState } from "react";

type MessageMapper<TRaw> = (raw: TRaw) => Message;

type Options<TQueryRaw, TMutationRaw> = {
  /* 해당 채팅의 queryKey */
  queryKey: unknown[];

  /* 기존 채팅 내역을 가져오는 함수 */
  queryFn: () => Promise<TQueryRaw[]>;

  /* 유저 입력(content)을 넘겨서 AI응답 1개를 받아오는 함수 */
  mutationFn: (content: string) => Promise<TMutationRaw>; 

  /* raw 데이터를 Message로 변환하는 mapper */
  map: MessageMapper<TQueryRaw | TMutationRaw>;

  /* mutation 에러가 발생한 경우 외부에서 처리하고 싶을 때 사용하는 콜백 */
  onError?: (error: unknown) => void;

  staleTime?: number;
  gcTime?: number;
};

export default function useOptimisticChat<TQeuryRaw, TMutationRaw>({ 
  queryKey, 
  queryFn, 
  mutationFn,
  map,
  onError, 
  staleTime = 0,
  gcTime = 0,
}: Options<TQeuryRaw, TMutationRaw>) {
  const [isPending, setIsPending] = useState<boolean>(false); // AI 응답 대기 상태
  const queryClient = useQueryClient();

  // 1) 초기 메시지 로딩
  // 내부적으로 queryFn(raw[]) -> Message[]로 변환해서 캐시에 저장
  const { 
    data: messages = [], 
    isLoading: isInitialLoading 
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const rawList = await queryFn();
      return rawList.map(map);
    },
    staleTime,
    gcTime,
  });

  // 4) mutation (AI 요청 + optimistic update)
  const mutation = useMutation<TMutationRaw, unknown, string>({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: (content) => {
      setIsPending(true);

      queryClient.setQueryData<Message[]>(queryKey, (old) => {
        const base = old ?? [];
        const next = [...base]; 

        // user 메시지 추가
        next.push({
          id: crypto.randomUUID(),
          role: "USER",
          content,
        })

        // AI placeholder 추가
        next.push({
          id: crypto.randomUUID(),
          role: "AI",
          content: "",
          isLoading: true,
        });

        return next;
      });
    },
    onSuccess: (rawAiResponse) => { 
      // 서버의 응답을 Message로 변환
      const aiMessage = map(rawAiResponse);

      queryClient.setQueryData<Message[]>(queryKey, (old) => {
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
    onError: (error) => {
      setIsPending(false);
      // placeholder 롤백은 추후 추가 예정
      onError?.(error);
    }
  });

  // 5) 유저 메시지 전송
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
