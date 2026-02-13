import type { Message, MessageCore } from "../types/Message";

/* Raw 타입의 필드를 MessageCore(id, role, content)에 매핑하기 위한 키 정의 */
export type KeyMap<Raw extends Record<string, unknown>> = {
  id: keyof Raw;
  role: keyof Raw;
  content: keyof Raw;
}

/* 
Raw에서 MessageCore에 매핑된 필드를 제외한 나머지 필드
-> 최종 Message의 custom 영역
*/
export type Custom<
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
export function buildMessage<
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