import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { Message, MessageCore } from "../types/Message";
import { useState } from "react";

/* =========================
 * 내부 전용 타입 & 유틸
 * ========================= */

/* Raw 타입의 필드를 MessageCore(id, role, content)에 매핑하기 위한 키 정의 */
type KeyMap<Raw extends Record<string, unknown>> = {
  id: keyof Raw;
  role: keyof Raw;
  content: keyof Raw;
}

/* 
Raw에서 MessageCore에 매핑된 필드를 제외한 나머지 필드
-> 최종 Message의 custom 영역
*/
type Custom<
  Raw extends Record<string, unknown>,
  Map extends KeyMap<Raw>
> = Omit<Raw, Map["id" | "role" | "content"]>;

/*
Raw 데이터를 MessageCore로 변환
- key 매핑은 컴파일 타임에 보장
- role 값 변환은 roleResolver에서 처리
*/
function buildCore<
  Raw extends Record<string, unknown>,
  Map extends KeyMap<Raw>
>(
  raw: Raw,
  map: Map,
  roleResolver: (value: Raw[Map["role"]]) => MessageCore["role"]
): MessageCore {
  return {
    id: raw[map.id] as MessageCore["id"],
    role: roleResolver(raw[map.role]),
    content: raw[map.content] as string,
  };
}

/* 최종 Message 생성 */
function buildMessage<
  Raw extends Record<string, unknown>,
  Map extends KeyMap<Raw>
>(
  raw: Raw,
  map: Map,
  roleResolver: (value: Raw[Map["role"]]) => MessageCore["role"]
): Message<Custom<Raw, Map>> {
  const core = buildCore(raw, map, roleResolver);
  const custom = {} as Custom<Raw, Map>;

  for (const key in raw) {
    if (
      key !== map.id &&
      key !== map.role &&
      key !== map.content
    ) {
      (custom as Record<string, unknown>)[key]= raw[key];
    }
  }

  return {
    ...core,
    custom: custom as Custom<Raw, Map>,
  };
}

/* =========================
 * Public API
 * ========================= */

type Options<
  Raw extends Record<string, unknown>,
  Map extends KeyMap<Raw> = KeyMap<Raw>
> = {
  /* 해당 채팅의 queryKey */
  queryKey: readonly unknown[];

  /* 기존 채팅 내역을 가져오는 함수 */
  queryFn: (pageParam: unknown) => Promise<Raw[]>;

  /* 첫 페이지 번호 */
  initialPageParam: unknown;
  
  /* 다음 페이지를 가져오기 위한 pageParam 계산 함수 */
  getNextPageParam: (
    lastPage: Message<Custom<Raw, Map>>[],
    allPages: Message<Custom<Raw, Map>>[][]
  ) => unknown;

  /* 유저 입력(content)을 넘겨서 AI응답 1개를 받아오는 함수 */
  mutationFn: (content: string) => Promise<Raw>; 

  /* raw 데이터를 Message로 변환하는 mapper */
  map: Map;

  /* Raw의 role 값을 내부 표준 role 타입으로 변환하는 함수 */
  roleResolver: (value: Raw[Map["role"]]) => MessageCore["role"];

  /* mutation 에러가 발생한 경우 외부에서 처리하고 싶을 때 사용하는 콜백 */
  onError?: (error: unknown) => void;

  staleTime?: number;
  gcTime?: number;
};

export default function useChat<
  Raw extends Record<string, unknown>,
  Map extends KeyMap<Raw>
>({ 
  queryKey, 
  queryFn, 
  initialPageParam,
  getNextPageParam,
  mutationFn,
  map,
  roleResolver,
  onError, 
  staleTime = 0,
  gcTime = 0,
}: Options<Raw, Map>) {
  const [isPending, setIsPending] = useState<boolean>(false); // AI 응답 대기 상태
  const queryClient = useQueryClient();

  // 내부적으로 Raw 데이터를 Message 구조로 정규화하여 캐시에 저장
  const { 
    data, 
    isLoading: isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<Message<Custom<Raw, Map>>[]>({
    queryKey,
    initialPageParam,
    queryFn: async ({ pageParam }) => {
      const rawList = await queryFn(pageParam);
      return rawList.map((raw) => 
        buildMessage(raw, map, roleResolver)
      );
    },
    getNextPageParam,
    staleTime,
    gcTime,
  });

  const messages = data ? [...data.pages].reverse().flat() : [];

  const mutation = useMutation<
    Raw, 
    unknown, 
    string, 
    { prev?: InfiniteData<Message<Custom<Raw, Map>>[]> }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async (content) => {
      setIsPending(true);

      const prev = queryClient.getQueryData<InfiniteData<Message<Custom<Raw, Map>>[]>>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      // query cache에 optimistic message를 직접 삽입
      queryClient.setQueryData<InfiniteData<Message<Custom<Raw, Map>>[]>>(queryKey, (old) => {
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
          } as Message<Custom<Raw, Map>>,
          {
            id: crypto.randomUUID(),
            role: "AI",
            content: "",
            isLoading: true,
            custom: {}
          } as Message<Custom<Raw, Map>>,
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
      const aiMessage = buildMessage(rawAiResponse, map, roleResolver);

      queryClient.setQueryData<InfiniteData<Message<Custom<Raw, Map>>[]>>(queryKey, (old) => {
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
