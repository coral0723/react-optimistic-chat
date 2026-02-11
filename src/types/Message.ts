type ChatRole = "AI" | "USER";

// 라이브러리 내부에서 불변으로 보장되는 최소 메시지 구조
export type BaseMessage = {
  id: number | string;
  role: ChatRole;
  content: string;
  isLoading?: boolean;
}

// 사용자가 map 함수에서 반드시 반환해야 하는 최소 필드
// 해당 타입이 깨지면 컴파일 타임에 바로 에러
export type MessageCore = Pick<BaseMessage, "id" | "role" | "content">;

// 최종적으로 UI / 상태에서 사용되는 메시지 타입
// custom은 map 설계에서 의도적으로 소비되지 않은 Raw 필드 영역
export type Message<TCustom = unknown> = BaseMessage & {
  custom?: TCustom;
};
