import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Message } from "../types/Message";
import { useEffect, useRef, useState } from "react";

type MessageMapper<TRaw> = (raw: TRaw) => Message;

type VoiceRecognitionController = {
  start: () => void;
  stop: () => void;
  isRecording: boolean;
  onTranscript: (text: string) => void;
}

type Options<TQueryRaw, TMutationRaw> = {
  /* 해당 채팅의 queryKey */
  queryKey: readonly unknown[];

  /* 기존 채팅 내역을 가져오는 함수 */
  queryFn: () => Promise<TQueryRaw[]>;

  /* 유저 입력(content)을 넘겨서 AI응답 1개를 받아오는 함수 */
  mutationFn: (content: string) => Promise<TMutationRaw>; 

  /* raw 데이터를 Message로 변환하는 mapper */
  map: MessageMapper<TQueryRaw | TMutationRaw>;

  /* 음성 입력을 제어하기 위한 컨트롤러(start / stop / transcript 연결) */
  voice: VoiceRecognitionController;

  /* mutation 에러가 발생한 경우 외부에서 처리하고 싶을 때 사용하는 콜백 */
  onError?: (error: unknown) => void;

  staleTime?: number;
  gcTime?: number;
};

export default function useVoiceOptimisticChat<TQeuryRaw, TMutationRaw>({ 
  queryKey, 
  queryFn, 
  mutationFn,
  map,
  voice,
  onError, 
  staleTime = 0,
  gcTime = 0,
}: Options<TQeuryRaw, TMutationRaw>) {
  const [isPending, setIsPending] = useState<boolean>(false); // AI 응답 대기 상태
  const queryClient = useQueryClient();
  const currentTextRef = useRef(""); // 음성 인식 중간 결과를 렌더링과 분리하기 위해 useRef 사용
  const rollbackRef = useRef<Message[] | undefined>(undefined);

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

  const mutation = useMutation<
    TMutationRaw, 
    unknown, 
    string, 
    { prev?: Message[] | undefined }
  >({
    mutationFn, // (content: string) => Promise<TMutationRaw>
    onMutate: async () => {
      setIsPending(true);

      const prev = queryClient.getQueryData<Message[]>(queryKey);
      
      // 조건부 cancleQueries
      if (prev) {
        await queryClient.cancelQueries({ queryKey });
      }

      queryClient.setQueryData<Message[]>(queryKey, (old) => {
        const base = old ?? [];

        return [
          ...base,
          // AI placeholder 추가
          {
            id: crypto.randomUUID(),
            role: "AI",
            content: "",
            isLoading: true,
          }
        ]; 
      });

      // rollback context 반환
      return { prev };
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
    onError: (error, _variables, context) => {
      setIsPending(false);
      
      // context 기반 rollback
      if (context?.prev) {
        queryClient.setQueryData(queryKey, context.prev);
      }

      onError?.(error);
    },
    // mutation 이후 서버 기준 최신 데이터 재동기화
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // 음성 녹음 시작
  const startRecording = async() => {
    currentTextRef.current = "";

    const prev = queryClient.getQueryData<Message[]>(queryKey);
    rollbackRef.current = prev;

    if (prev) {
      await queryClient.cancelQueries({ queryKey });
    }

    queryClient.setQueryData<Message[]>(queryKey, (old) => [
      ...(old ?? []),
      {
        id: crypto.randomUUID(),
        role: "USER",
        content: "",
      },
    ]);

    voice.start();
  }

  // 음성 중간 입력
  const onTranscript = (text: string) => {
    currentTextRef.current = text;

    queryClient.setQueryData<Message[]>(queryKey, (old) => {
      if (!old) return old;

      const next = [...old];
      const last = next.length - 1;

      if (next[last]?.role !== "USER") return old;

      next[last] = {
        ...next[last],
        content: text,
      };

      return next;
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
    messages,          // Message[]
    isPending,         // 사용자가 채팅 전송 후 AI 응답이 올 때까지의 로딩
    isInitialLoading,  // 초기 로딩 상태
    startRecording,    // 음성 인식 시작 함수
    stopRecording      // 음성 인식 종료 함수
  };
}
