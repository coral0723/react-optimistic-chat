import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { BaseMessage, Message, MessageCore } from "../types/Message";
import { useState } from "react";

/* Raw 데이터 중 Message에 매핑되지 않은 나머지 필드들 */
type ExtractCustom<Raw> = Omit<Raw, keyof BaseMessage>;

type Options<Raw> = {
  /* 해당 채팅의 queryKey */
  queryKey: readonly unknown[];

  /* 기존 채팅 내역을 가져오는 함수 */
  queryFn: (pageParam: unknown) => Promise<Raw[]>;

  /* 첫 페이지 번호 */
  initialPageParam: unknown;
  
  /* 다음 페이지를 가져오기 위한 pageParam 계산 함수 */
  getNextPageParam: (
    lastPage: Message<ExtractCustom<Raw>>[],
    allPages: Message<ExtractCustom<Raw>>[][]
  ) => unknown;

  /* 유저 입력(content)을 넘겨서 AI응답 1개를 받아오는 함수 */
  mutationFn: (content: string) => Promise<Raw>; 

  /* raw 데이터를 Message로 변환하는 mapper */
  map: (raw: Raw) => MessageCore;

  /* mutation 에러가 발생한 경우 외부에서 처리하고 싶을 때 사용하는 콜백 */
  onError?: (error: unknown) => void;

  staleTime?: number;
  gcTime?: number;
};

/* 
Raw 데이터와 map 결과를 분리하여
map에 사용된 필드는 Message 최상위에 유지하고
나머지 Raw 필드는 custom 객체로 수집하는 함수
*/
function splitRawToMessage<Raw extends object>(
  raw: Raw,
  mapped: MessageCore
): Message<ExtractCustom<Raw>> {
  const custom = {} as ExtractCustom<Raw>;
  const mappedValues = new Set(Object.values(mapped));

  for (const [key, value] of Object.entries(raw)) {
    if (!mappedValues.has(value)) {
      (custom as any)[key] = value;
    }
  }

  return {
    ...mapped,
    custom
  };
}

export default function useChat<Raw extends object>({ 
  queryKey, 
  queryFn, 
  initialPageParam,
  getNextPageParam,
  mutationFn,
  map,
  onError, 
  staleTime = 0,
  gcTime = 0,
}: Options<Raw>) {
  const [isPending, setIsPending] = useState<boolean>(false); // AI 응답 대기 상태
  const queryClient = useQueryClient();

  // 내부적으로 Raw 데이터를 Message 구조로 정규화하여 캐시에 저장
  const { 
    data, 
    isLoading: isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Message<ExtractCustom<Raw>>[]>({
    queryKey,
    initialPageParam,
    queryFn: async ({ pageParam }) => {
      const raw = await queryFn(pageParam);
      return raw.map((r) => {
        const mapped = map(r);
        return splitRawToMessage(r, mapped);
      });
    },
    getNextPageParam,
    staleTime,
    gcTime,
  });

  const messages: Message<ExtractCustom<Raw>>[] = data ? [...data.pages].reverse().flat() : [];

  const mutation = useMutation<
    Raw, 
    unknown, 
    string, 
    { prev?: InfiniteData<Message<ExtractCustom<Raw>>[]> }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async (content) => {
      setIsPending(true);

      const prev = queryClient.getQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      // query cache에 optimistic message를 직접 삽입
      queryClient.setQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey, (old) => {
        if (!old) return old;

        const pages = [...old.pages];
        const firstPage = pages[0] ?? [];

        pages[0] = [
          ...firstPage,
          {
            id: crypto.randomUUID(),
            role: "USER",
            content,
            custom: {}
          } as Message<ExtractCustom<Raw>>,
          {
            id: crypto.randomUUID(),
            role: "AI",
            content: "",
            isLoading: true,
            custom: {}
          } as Message<ExtractCustom<Raw>>,
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
      const mapped = map(rawAiResponse);
      const aiMessage = splitRawToMessage(rawAiResponse, mapped);

      queryClient.setQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey, (old) => {
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
