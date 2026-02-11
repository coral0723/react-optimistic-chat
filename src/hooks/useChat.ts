import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { Message, MessageCore } from "../types/Message";
import { useState } from "react";

/* =========================
 * 내부 전용 타입 & 유틸
 * ========================= */

// map 설계 결과
type InternalMapResult<Raw extends object> = {
  core: MessageCore;
  usedKeys: readonly (keyof Raw)[];
}

// Raw에서 map이 소비한 필드를 제거해 custom 영역으로 계산
type CustomFromKeys<Raw, K extends readonly (keyof Raw)[]> = Omit<Raw, K[number]>;

// 사용자가 제공한 map을 실행해 내부 설계 정보로 승격
function runMap<Raw extends object>(
  raw: Raw,
  map: (raw: Raw) => MessageCore
): InternalMapResult<Raw> {
  const core = map(raw);

  // Raw 기준으로 core에 사용된 필드 추론
  const usedKeys = Object.keys(raw).filter((key) => 
    Object.values(core).includes((raw as any)[key])
  ) as (keyof Raw)[];

  return { core, usedKeys };
}

// InternalMapResult를 기반으로 최종 Message 생성
function buildMessage<
  Raw extends object,
  K extends readonly (keyof Raw)[]
>(
  raw: Raw,
  result: {
    core: MessageCore,
    usedKeys: K
  }
): Message<CustomFromKeys<Raw, K>> {
  const custom = {} as CustomFromKeys<Raw, K>;

  for (const key in raw) {
    if (!result.usedKeys.includes(key as K[number])) {
      (custom as any)[key] = raw[key];
    }
  }

  // 위 코드의 "as any" 최소화 버전
  // for (const key of Object.keys(raw) as (keyof Raw)[]) {
  //   if (!result.usedKeys.includes(key as K[number])) {
  //     custom[key as Exclude<keyof Raw, K[number]>] = raw[key];
  //   }
  // }

  return {
    ...result.core,
    custom,
  };
}

/* =========================
 * Public API
 * ========================= */

type Options<Raw> = {
  /* 해당 채팅의 queryKey */
  queryKey: readonly unknown[];

  /* 기존 채팅 내역을 가져오는 함수 */
  queryFn: (pageParam: unknown) => Promise<Raw[]>;

  /* 첫 페이지 번호 */
  initialPageParam: unknown;
  
  /* 다음 페이지를 가져오기 위한 pageParam 계산 함수 */
  getNextPageParam: (
    lastPage: Message<any>[],
    allPages: Message<any>[][]
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
  } = useInfiniteQuery<Message<any>[]>({
    queryKey,
    initialPageParam,
    queryFn: async ({ pageParam }) => {
      const rawList = await queryFn(pageParam);
      return rawList.map((raw) => {
        const mapped = runMap(raw, map);
        return buildMessage(raw, mapped);
      });
    },
    getNextPageParam,
    staleTime,
    gcTime,
  });

  const messages: Message<any>[] = data ? [...data.pages].reverse().flat() : [];

  const mutation = useMutation<
    Raw, 
    unknown, 
    string, 
    { prev?: InfiniteData<Message<any>[]> }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async (content) => {
      setIsPending(true);

      const prev = queryClient.getQueryData<InfiniteData<Message<any>[]>>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      // query cache에 optimistic message를 직접 삽입
      queryClient.setQueryData<InfiniteData<Message<any>[]>>(queryKey, (old) => {
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
          } as Message<any>,
          {
            id: crypto.randomUUID(),
            role: "AI",
            content: "",
            isLoading: true,
            custom: {}
          } as Message<any>,
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
      const mapped = runMap(rawAiResponse, map);
      const aiMessage = buildMessage(rawAiResponse, mapped);

      queryClient.setQueryData<InfiniteData<Message<any>[]>>(queryKey, (old) => {
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
