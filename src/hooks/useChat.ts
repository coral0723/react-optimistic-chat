import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { BaseMessage, Message } from "../types/Message";
import { useState } from "react";

type ExtraFromRaw<TRaw> = Omit<TRaw, keyof BaseMessage>;

type MessageMapper<TRaw> = Message<ExtraFromRaw<TRaw>>;

type MessageMapperResult = Pick<BaseMessage, "id" | "role" | "content">;

type Options<TRaw> = {
  /* 해당 채팅의 queryKey */
  queryKey: readonly unknown[];

  /* 기존 채팅 내역을 가져오는 함수 */
  queryFn: (pageParam: unknown) => Promise<TRaw[]>;

  initialPageParam: unknown;
  
  getNextPageParam: (
    lastPage: MessageMapper<TRaw>[],
    allPages: MessageMapper<TRaw>[][]
  ) => unknown;

  /* 유저 입력(content)을 넘겨서 AI응답 1개를 받아오는 함수 */
  mutationFn: (content: string) => Promise<TRaw>; 

  /* raw 데이터를 Message로 변환하는 mapper */
  map: (raw: TRaw) => MessageMapperResult;

  /* mutation 에러가 발생한 경우 외부에서 처리하고 싶을 때 사용하는 콜백 */
  onError?: (error: unknown) => void;

  staleTime?: number;
  gcTime?: number;
};

export default function useChat<TRaw>({ 
  queryKey, 
  queryFn, 
  initialPageParam,
  getNextPageParam,
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
    data, 
    isLoading: isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MessageMapper<TRaw>[]>({
    queryKey,
    initialPageParam,
    queryFn: async ({ pageParam }) => {
      const raw = await queryFn(pageParam);
      return raw.map((r) => ({
        ...map(r),
        ...(r as ExtraFromRaw<TRaw>),
      }));
    },
    getNextPageParam,
    staleTime,
    gcTime,
  });

  const messages: MessageMapper<TRaw>[] = data ? [...data.pages].reverse().flat() : [];


  const mutation = useMutation<
    TRaw, 
    unknown, 
    string, 
    { prev?: InfiniteData<MessageMapper<TRaw>[]> }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async (content) => {
      setIsPending(true);

      const prev = queryClient.getQueryData<InfiniteData<MessageMapper<TRaw>[]>>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      queryClient.setQueryData<InfiniteData<MessageMapper<TRaw>[]>>(queryKey, (old) => {
        if (!old) return old;

        const pages = [...old.pages];
        const firstPage = pages[0] ?? [];

        pages[0] = [
          ...firstPage,
          {
            id: crypto.randomUUID(),
            role: "USER",
            content,
          } as MessageMapper<TRaw>,
          {
            id: crypto.randomUUID(),
            role: "AI",
            content: "",
            isLoading: true,
          } as MessageMapper<TRaw>,
        ];

        return {
          ...old,
          pages,
        };
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

      queryClient.setQueryData<InfiniteData<MessageMapper<TRaw>[]>>(queryKey, (old) => {
        if (!old) return old;

        const pages = [...old.pages];
        const firstPage = [...pages[0]!];
        const lastIndex = firstPage.length - 1;

        firstPage[lastIndex] = {
          ...firstPage[lastIndex],
          ...aiMessage,
          isLoading: false,
        };

        pages[0] = firstPage;

        return {
          ...old,
          pages,
        };
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
    isInitialLoading, // 초기 로딩 상태

    // infinite query용
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
