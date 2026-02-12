import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { Message, MessageCore } from "../types/Message";
import { useState } from "react";

/* =========================
 * 내부 전용 타입 & 유틸
 * ========================= */

/* 
Raw 타입에서 MessageCore에 매핑된 필드를 제외한 나머지 필드 타입
-> 최종 Message의 custom 영역에 들어갈 타입을 의미 
*/
type Custom<Raw> = Omit<Raw, keyof MessageCore>;

/*
runMap 실행 결과값 
- core: Raw를 MessageCore 형태로 변환한 결과
- usedKeys: MessageCore로 매핑하는 과정에서 Raw에서 실제로 사용된 key 목록
*/
type MapResult<Raw extends Record<string, unknown>> = {
  core: MessageCore;
  usedKeys: readonly (keyof Raw)[];  // Raw의 매핑된 key들만 담는 배열
}

/*
Raw 데이터를 MessageCore로 변환하고,
Raw의 어떤 key가 매핑에 사용되었는지 추론
*/
function runMap<Raw extends Record<string, unknown>>(
  raw: Raw,
  map: (raw: Raw) => MessageCore
): MapResult<Raw> {
  const core = map(raw);

  // Raw 기준으로 매핑에 사용된 key 추론
  const usedKeys = (Object.keys(raw) as (keyof Raw)[]).filter((key) => 
    (Object.values(core) as unknown[]).includes(raw[key])
  );

  return { core, usedKeys };
}

/*
MapResult를 기반으로 최종 Message 객체 생성
- core: MessageCore 필드
- custom: Raw에서 매핑에 사용되지 않은 나머지 필드들
*/
function buildMessage<
  Raw extends Record<string, unknown>,
>(
  raw: Raw,
  result: MapResult<Raw>
): Message<Custom<Raw>> {
  const custom = {} as Custom<Raw>;

  /*
  Raw의 모든 key를 순회하면서,
  usedKeys에 포함되지 않은 key만 custom에 추가
  */
  for (const key of Object.keys(raw) as (keyof Raw)[]) { 
    // 매핑되지 않은 key라면 custom에 해당 필드 추가
    if (!result.usedKeys.includes(key)) { 
      custom[key as Exclude<keyof Raw, keyof MessageCore>] =
        raw[key] as Custom<Raw>[Exclude<keyof Raw, keyof MessageCore>];
    }
  }

  return {
    ...result.core,
    custom,
  };
}

/* =========================
 * Public API
 * ========================= */

type Options<Raw extends Record<string, unknown>> = {
  /* 해당 채팅의 queryKey */
  queryKey: readonly unknown[];

  /* 기존 채팅 내역을 가져오는 함수 */
  queryFn: (pageParam: unknown) => Promise<Raw[]>;

  /* 첫 페이지 번호 */
  initialPageParam: unknown;
  
  /* 다음 페이지를 가져오기 위한 pageParam 계산 함수 */
  getNextPageParam: (
    lastPage: Message<Custom<Raw>>[],
    allPages: Message<Custom<Raw>>[][]
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

export default function useChat<Raw extends Record<string, unknown>>({ 
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
  } = useInfiniteQuery<Message<Custom<Raw>>[]>({
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

  const messages: Message<Custom<Raw>>[] = data ? [...data.pages].reverse().flat() : [];

  const mutation = useMutation<
    Raw, 
    unknown, 
    string, 
    { prev?: InfiniteData<Message<Custom<Raw>>[]> }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async (content) => {
      setIsPending(true);

      const prev = queryClient.getQueryData<InfiniteData<Message<Custom<Raw>>[]>>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      // query cache에 optimistic message를 직접 삽입
      queryClient.setQueryData<InfiniteData<Message<Custom<Raw>>[]>>(queryKey, (old) => {
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
          } as Message<Custom<Raw>>,
          {
            id: crypto.randomUUID(),
            role: "AI",
            content: "",
            isLoading: true,
            custom: {}
          } as Message<Custom<Raw>>,
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

      queryClient.setQueryData<InfiniteData<Message<Custom<Raw>>[]>>(queryKey, (old) => {
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
