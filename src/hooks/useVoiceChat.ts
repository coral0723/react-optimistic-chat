import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Message, MessageCore } from "../types/Message";
import { useEffect, useRef, useState } from "react";
import type { VoiceRecognition } from "../types/VoiceRecognition";
import { buildMessage, type Custom, type KeyMap } from "../internal/messageNormalizer";
import type { MessageInfiniteData, MessagePage } from "../internal/messageCacheTypes";

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
    lastPage: MessagePage<Raw, Map>,
    allPages: MessagePage<Raw, Map>[]
  ) => unknown;

  /* 유저 입력(content)을 넘겨서 AI응답 1개를 받아오는 함수 */
  mutationFn: (content: string) => Promise<Raw>; 

  /* raw 데이터를 Message로 변환하는 mapper */
  keyMap: Map;

  /* Raw의 role 값을 내부 표준 role 타입으로 변환하는 함수 */
  roleResolver: (value: Raw[Map["role"]]) => MessageCore["role"];

  /* 음성 입력을 제어하기 위한 컨트롤러(start / stop / transcript 연결) */
  voice: VoiceRecognition;

  /* mutation 에러가 발생한 경우 외부에서 처리하고 싶을 때 사용하는 콜백 */
  onError?: (error: unknown) => void;

  staleTime?: number;
  gcTime?: number;
};

export default function useVoiceChat<
  Raw extends Record<string, unknown>,
  Map extends KeyMap<Raw>
>({ 
  queryKey, 
  queryFn, 
  initialPageParam,
  getNextPageParam,
  mutationFn,
  keyMap,
  roleResolver,
  voice,
  onError, 
  staleTime = 0,
  gcTime = 0,
}: Options<Raw, Map>) {
  const [isPending, setIsPending] = useState<boolean>(false); // AI 응답 대기 상태
  const queryClient = useQueryClient();
  const currentTextRef = useRef(""); // 음성 인식 중간 결과를 렌더링과 분리하기 위해 useRef 사용
  const rollbackRef = useRef<MessageInfiniteData<Raw, Map> | undefined>(undefined);

  // 내부적으로 queryFn(raw[]) -> Message[]로 변환해서 캐시에 저장
  const { 
    data, 
    isLoading: isInitialLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<MessagePage<Raw, Map>>({
    queryKey,
    initialPageParam,
    queryFn: async ({ pageParam }) => {
      const rawList = await queryFn(pageParam);
      return rawList.map((raw) => 
        buildMessage(raw, keyMap, roleResolver)  
      );
    },
    getNextPageParam,
    staleTime,
    gcTime,
  });

  const messages = data
  ? data.pages
      .map(page => [...page]) // page 복사
      .reverse()
      .flat()
  : [];


  const mutation = useMutation<
    Raw, 
    unknown, 
    string, 
    { prev?: MessageInfiniteData<Raw, Map> }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async () => {
      setIsPending(true);

      const prev = queryClient.getQueryData<MessageInfiniteData<Raw, Map>>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      queryClient.setQueryData<MessageInfiniteData<Raw, Map>>(queryKey, (old) => {
        if (!old) return old;

        const pages = [...old.pages];
        const firstPage = pages[0] ?? [];

        pages[0] = [
          ...firstPage,
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
      return prev ?  { prev } : {};
    },
    onSuccess: (rawAiResponse) => { 
      // 서버의 응답을 Message로 변환
      const aiMessage = buildMessage(rawAiResponse, keyMap, roleResolver);

      queryClient.setQueryData<MessageInfiniteData<Raw, Map>>(queryKey, (old) => {
        if (!old) return old;

        const pages = [...old.pages];
        const firstPage = [...pages[0]!];
        const lastIndex = firstPage.length - 1;

        // AI placeholder 제거 + 실제 메시지로 변경
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
    }
  });

  // 음성 녹음 시작
  const startRecording = async() => {
    currentTextRef.current = "";

    const prev = queryClient.getQueryData<MessageInfiniteData<Raw, Map>>(queryKey);
    rollbackRef.current = prev;

    if (prev) {
      await queryClient.cancelQueries({ queryKey });
    }

    queryClient.setQueryData<MessageInfiniteData<Raw, Map>>(queryKey, (old) => {
      if (!old) return old;

      const pages = [...old.pages];
      const firstPage = pages[0] ?? [];

      pages[0] = [
        ...firstPage,
        {
          id: crypto.randomUUID(),
          role: "USER",
          content: "",
          custom: {},
        } as Message<Custom<Raw, Map>>,
      ];

      return {
        ...old,
        pages
      };
    });

    voice.start();
  }

  // 음성 중간 입력
  const onTranscript = (text: string) => {
    currentTextRef.current = text;

    queryClient.setQueryData<MessageInfiniteData<Raw, Map>>(queryKey, (old) => {
      if (!old) return old;

      const pages = [...old.pages];
      const firstPage = [...pages[0]!];
      const lastIndex = firstPage.length - 1;

      if (firstPage[lastIndex]?.role !== "USER") return old;

      firstPage[lastIndex] = {
        ...firstPage[lastIndex],
        content: text,
      };

      pages[0] = firstPage;

      return {
        ...old,
        pages
      };
    });
  };
    
  // 음성 인식 콜백 연결
  useEffect(() => {
    voice.onTranscript = onTranscript;
  }, [voice]);

  // 음성 인식 종료
  const stopRecording = () => {
    voice.stop();

    const finalText = currentTextRef.current.trim();
    if (!finalText) {
      if (rollbackRef.current) {
        queryClient.setQueryData(queryKey, rollbackRef.current);
      }
      return;
    }

    mutation.mutate(finalText);
  };

  return {
    messages,          // Message<TExtra>[]
    isPending,         // 사용자가 채팅 전송 후 AI 응답이 올 때까지의 로딩
    isInitialLoading,  // 초기 로딩 상태
    startRecording,    // 음성 인식 시작 함수
    stopRecording,      // 음성 인식 종료 함수

    // infinite query용
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
}
