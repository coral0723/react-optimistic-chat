import { useInfiniteQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { BaseMessage, Message, MessageCore } from "../types/Message";
import { useEffect, useRef, useState } from "react";
import type { VoiceRecognition } from "../types/VoiceRecognition";

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
  map: (raw: Raw) => MessageCore

  /* 음성 입력을 제어하기 위한 컨트롤러(start / stop / transcript 연결) */
  voice: VoiceRecognition;

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

export default function useVoiceChat<Raw extends object>({ 
  queryKey, 
  queryFn, 
  initialPageParam,
  getNextPageParam,
  mutationFn,
  map,
  voice,
  onError, 
  staleTime = 0,
  gcTime = 0,
}: Options<Raw>) {
  const [isPending, setIsPending] = useState<boolean>(false); // AI 응답 대기 상태
  const queryClient = useQueryClient();
  const currentTextRef = useRef(""); // 음성 인식 중간 결과를 렌더링과 분리하기 위해 useRef 사용
  const rollbackRef = useRef<InfiniteData<Message<ExtractCustom<Raw>>[]> | undefined>(undefined);

  // 내부적으로 queryFn(raw[]) -> Message[]로 변환해서 캐시에 저장
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
    { prev?: InfiniteData<Message<ExtractCustom<Raw>>[]> }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async () => {
      setIsPending(true);

      const prev = queryClient.getQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      queryClient.setQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey, (old) => {
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
          } as Message<ExtractCustom<Raw>>,
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
      const mapped = map(rawAiResponse);
      const aiMessage = splitRawToMessage(rawAiResponse, mapped);

      queryClient.setQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey, (old) => {
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

    const prev = queryClient.getQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey);
    rollbackRef.current = prev;

    if (prev) {
      await queryClient.cancelQueries({ queryKey });
    }

    queryClient.setQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey, (old) => {
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
        } as Message<ExtractCustom<Raw>>,
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

    queryClient.setQueryData<InfiniteData<Message<ExtractCustom<Raw>>[]>>(queryKey, (old) => {
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
