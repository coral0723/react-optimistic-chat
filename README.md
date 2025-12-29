<div align="center">
  <img width="350" height="240" alt="Image" src="https://github.com/user-attachments/assets/de84f731-14ae-4023-9649-2c22f7747ed1"/>
</div>

# react-optimistic-chat · [![npm](https://img.shields.io/npm/v/react-optimistic-chat)](https://www.npmjs.com/package/react-optimistic-chat)

<code>react-optimistic-chat</code>은 **React + TanStack Query** 기반으로  
AI 챗봇 서비스에서 필요한 **채팅 캐시 관리 및 optimistic update, 채팅 UI**를 손쉽게 구현할 수 있도록 돕는 라이브러리입니다.

<br>

## 목차
#### **1.** [Install & Requirements](#install--requirements)  
#### **2.** [Core Type](#core-type)  
#### **3.** [Hooks](#hooks)  
**\-** [useChat](#usechat)  
**\-** [useBrowserSpeechRecognition](#usebrowserspeechrecognition)  
**\-** [useVoiceChat](#usevoicechat)  
#### **4.** [Components](#components)  
**\-** [Indicators](#indicators)  
**\-** [ChatMessage](#chatmessage)  
**\-** [ChatList](#chatlist)   
**\-** [ChatInput](#chatinput)   
**\-** [ChatContainer](#chatcontainer)   
#### **5.** [Design Philosophy](#design-philosophy)  

<br>

<h1 id="install--requirements">📦 Install & Requirements</h1>

## Installation
```bash
npm install react-optimistic-chat
# or
yarn add react-optimistic-chat
```

<br>

## Peer Dependencies
이 라이브러리는 아래 패키지들을 **peer dependency**로 사용합니다.  
프로젝트에 반드시 설치되어 있어야 합니다.  
```json
{
  "@tanstack/react-query": ">=5",
  "react": ">=18",
  "react-dom": ">=18"
}
```

<br>

## styles
<code>react-optimistic-chat</code>의 **채팅 UI 컴포넌트**를 사용하려면  
아래 스타일 파일을 반드시 import 해야 합니다.
```ts
import "react-optimistic-chat/style.css";
```
> React 프로젝트에서는 `App.tsx`에,  
> Next.js(App Router)에서는 루트 `Layout.tsx`에서 import 하는 것을 권장합니다.

<br>

<h1 id="core-type">🧩 Core Type</h1>

<code>react-optimistic-chat</code>은 채팅을 단순한 문자열 배열이 아닌  
**일관된 Message 타입을 중심으로 관리**하도록 설계되었습니다.

모든 Hooks와 UI 컴포넌트는 이 Core Type을 기준으로 동작하며,  
서버로부터 전달되는 다양한 형태의 Raw 데이터를 **예측 가능한 구조로 정규화**하는 것을 목표로 합니다.  

## 🧩 Message
```ts
type Message = {
  id: number | string;
  role: "USER" | "AI";
  content: string;
  isLoading?: boolean;
  custom: Record<string, unknown>;
};
```

| field | type | description |
|------|------|-------------|
| `id` | `number \| string` | 메시지를 식별하기 위한 고유 값 |
| `role` | `"USER" \| "AI"` | 메시지의 주체<br/>`"USER"`: 사용자가 입력한 메시지<br>`"AI"`: AI가 생성한 응답 메시지 |
| `content` | `string` | 메시지에 표시될 텍스트 내용 |
| `isLoading` | `boolean` _(optional)_ | AI 응답을 기다리는 중인 메시지임을 나타내는 플래그<br>optimistic update 시 UI 상태 표현에 사용 |
| `custom` | `Record<string, unknown>` | 서버에서 전달된 Raw 데이터 중 `id`, `role`, `content`에<br>포함되지 않은 모든 필드를 보존하는 객체 |

<br>

## 🧩 Example: \<Raw> → \<Message> 정규화
```ts
type Raw = {
  messageId: string;
  sender: "user" | "assistant";
  text: string;
  createdAt: string;
  model: string;
};
```
서버로부터 다음과 같은 <code>Raw</code> 채팅 데이터가 전달된다고 가정합니다.  

```ts
map: (raw: RawMessage) => ({
  id: raw.messageId,
  role: raw.sender === "user" ? "USER" : "AI",
  content: raw.text,
});
```
Hook에서 필수로 제공하는 <code>map</code> 함수를 다음과 같이 정의하면  

```ts
{
  id: "abc123",
  role: "AI",
  content: "Hello! How can I help you?",
  custom: {
    createdAt: "2024-01-01T10:00:00Z",
    model: "gpt-4o"
  }
}
```
내부적으로 <code>Message</code>는 아래와 같이 정규화됩니다.



<br>

<h1 id="hooks">🪝 Hooks</h1>

<h2 id="usechat">🪝 useChat</h2>

<code>useChat</code>은 **TanStack Query의 캐시를 기반으로**  
AI 챗봇 서비스에 필요한 **채팅 히스토리 관리, optimistic update, 메시지 정규화**를 한 번에 제공하는 Hook입니다.  

- <code>useInfiniteQuery</code> 기반 **채팅 히스토리 관리**
  - 채팅 내역을 페이지 단위로 캐시에 저장
  - 이미 로드된 페이지는 재요청 없이 캐시에서 즉시 복원 
- 사용자 메시지 전송 시 **Optimistic Update 적용**
  - 서버 응답을 기다리지 않고 UI에 즉시 반영
  - AI 응답 대기 중 상태를 <code>isPending</code>으로 제공
- 서버로부터 받은 Raw 데이터를 **일관된 Message 구조로 정규화**
  - <code>id</code>, <code>role</code>, <code>content</code>는 최상위 필드로 유지
  - Message에 포함되지 않은 나머지 Raw 필드는 <code>custom</code> 영역에 자동 보존
- TanStack Query의 캐시 메커니즘을 활용한 **안정적인 상태 동기화**
  - mutation 실패 시 이전 캐시 상태로 rollback
  - <code>staleTime</code>, <code>gcTime</code>을 통한 캐시 수명 제어

### Usage
```ts
const {
  messages,
  sendUserMessage,
  isPending,
  isInitialLoading,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useChat({
  queryKey: ["chat", roomId],
  queryFn: getChat,
  initialPageParam: 0,
  getNextPageParam,
  mutationFn: sendAI,
  map: (raw) => ({
    id: raw.chatId,
    role: raw.sender === "ai" ? "AI" : "USER",
    content: raw.body,
  }),
});
```

### Returned Values
| name | type | description |
|------|------|-------------|
| `messages` | `Message[]` | 정규화된 메시지 배열 |
| `sendUserMessage` | `(content: string) => void` | 유저 메시지 전송 함수 |
| `isPending` | `boolean` | AI 응답 대기 상태 |
| `isInitialLoading` | `boolean` | `messages` 로딩 상태 |
| `fetchNextPage` | `() => Promise<unknown>` | 다음 채팅 페이지 요청 |
| `hasNextPage` | `boolean \| undefined` | 다음 페이지 존재 여부 |
| `isFetchingNextPage` | `boolean` | 페이지 로딩 상태 |

### Options
| name | type | required | description |
|------|------|----------|-------------|
| `queryKey` | `readonly unknown[]` | ✅ | 해당 채팅의 TanStack Query key |
| `queryFn` | `(pageParam: unknown) => Promise<Raw[]>` | ✅ | 기존 채팅 내역을 불러오는 함수 |
| `initialPageParam` | `unknown` | ✅ | 첫 페이지 요청 시 사용할 pageParam |
| `getNextPageParam` | `(lastPage: Message[], allPages: Message[][]) => unknown` | ✅ | 다음 페이지 요청을 위한 pageParam 계산 함수 |
| `mutationFn` | `(content: string) => Promise<Raw>` | ✅ | 유저 입력을 받아 AI 응답 1개를 반환하는 함수 |
| `map` | `(raw: Raw) => { id; role; content }` | ✅ | Raw 데이터를 Message 구조로 매핑하는 함수 |
| `onError` | `(error: unknown) => void` | ❌ | mutation 에러 발생 시 호출되는 콜백 |
| `staleTime` | `number` | ❌ | 캐시가 fresh 상태로 유지되는 시간 (ms) |
| `gcTime` | `number` | ❌ | 캐시가 GC 되기 전까지 유지되는 시간 (ms) |

### 🔁 Optimistic Update Flow
**1.** 사용자가 메시지 전송  
**2.** USER 메시지 + 로딩 중인 AI 메시지를 즉시 캐시에 삽입  
**3.** AI 응답이 도착  
**4.** 로딩 중인 AI 메시지를 실제 응답으로 교체  
**5.** 에러 발생 시 이전 상태로 rollback  

<br>
 
<h2 id="usebrowserspeechrecognition">🪝 useBrowserSpeechRecognition</h2>

<code>useBrowserSpeechRecognition</code>은 브라우저에서 제공하는  
Speech Recognition API를 **React Hook 형태로 추상화한 훅**입니다.

이 훅은 음성 인식 로직을 직접 다루지 않고도, <code>useVoiceChat</code>이나 <code>ChatInput</code>과 같은 Hook/UI에서   
**음성 입력 기능을 간편하게 사용하고 싶은 사용자**를 위해 제공됩니다.

- 브라우저 내장 음성 인식 API를 간단한 인터페이스로 제공
- 음성 인식 시작 / 종료 제어
- 현재 녹음 상태를 나타내는 <code>isRecording</code> 제공
- 음성 인식 결과(transcript)를 외부 로직으로 전달 가능
- 브라우저 미지원 환경에 대한 에러 처리 지원

### Usage
```ts
const voice = useBrowserSpeechRecognition();
```

### Returned Values

| name | type | description |
|------|------|-------------|
| `start` | `() => void` | 음성 인식 시작 |
| `stop` | `() => void` | 음성 인식 종료 |
| `isRecording` | `boolean` | 현재 음성 인식 진행 상태 |
| `onTranscript` | `(fn: (text: string) => void) => void` | 음성 인식 결과(transcript)를 처리할 콜백 |


### Options

| name | type | required | description |
|------|------|----------|-------------|
| `lang` | `string` | ❌ | 음성 인식에 사용할 언어 코드 (기본값: `"ko-KR"`) |
| `onStart` | `() => void` | ❌ | 음성 인식이 시작될 때 실행되는 콜백 |
| `onEnd` | `() => void` | ❌ | 음성 인식이 종료될 때 실행되는 콜백 |
| `onError` | `(error: unknown) => void` | ❌ | 음성 인식 중 에러가 발생했을 때 실행되는 콜백 |

<br>

<h2 id="usevoicechat">🪝 useVoiceChat</h2>

<code>useVoiceChat</code>은 <code>useChat</code>의 캐시 구조와 optimistic update 흐름을 그대로 유지하면서,  
**음성 인식 기반 채팅** 경험을 제공하는 Hook입니다.

음성 인식 결과를 실시간으로 채팅 UI에 반영하고,  
녹음 종료 시 최종 텍스트를 AI 요청으로 연결하는 흐름을 내부에서 관리합니다.

- <code>useInfiniteQuery</code> 기반 **채팅 히스토리 캐시 관리**
  - <code>useChat</code>과 동일한 페이지 단위 캐싱 구조
  - 기존 텍스트 채팅과 동일한 Message 정규화 방식 유지
- 음성 입력 기반 **Optimistic Update**
  - 녹음 시작 시 USER 메시지를 즉시 캐시에 삽입
  - 음성 인식 중간 결과를 실시간으로 메시지 content에 반영
- 음성 인식 종료 시 **AI 요청 트리거**
  - 최종 transcript를 mutationFn으로 전달
  - AI 응답 대기 상태를 <code>isPending</code>으로 제공
- TanStack Query의 캐시 메커니즘을 활용한 **안정적인 상태 동기화**
  - 음성 입력 취소 또는 에러 발생 시 이전 캐시 상태로 rollback
  - <code>staleTime</code>, <code>gcTime</code>을 통한 캐시 수명 제어
- 음성 인식 로직을 외부에서 주입 가능
  - <code>useBrowserSpeechRecognition</code> 또는 커스텀 음성 인식 컨트롤러 사용 가능
 
### Usage
```ts
const voice = useBrowserSpeechRecognition();

const {
  messages,
  isPending,
  isInitialLoading,
  startRecording,
  stopRecording,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useVoiceChat({
  queryKey: ["chat", roomId],
  queryFn: getChat,
  initialPageParam: 0,
  getNextPageParam,
  mutationFn: sendAI,
  map: (raw) => ({
    id: raw.chatId,
    role: raw.sender === "ai" ? "AI" : "USER",
    content: raw.body,
  }),
  voice,
});
```

### Returned Values
| name                 | type                     | description                              |
| -------------------- | ------------------------ | ---------------------------------------- |
| `messages`           | `Message[]`              | 정규화된 메시지 배열                       |
| `isPending`          | `boolean`                | AI 응답 대기 상태                |
| `isInitialLoading`   | `boolean`                | `messages` 로딩 상태                         |
| `startRecording`     | `() => Promise<void>`    | 음성 인식 시작 함수                        |
| `stopRecording`      | `() => void`             | 음성 인식 종료 및 최종 텍스트 전송 함수                  |
| `fetchNextPage`      | `() => Promise<unknown>` | 다음 채팅 페이지 요청                             |
| `hasNextPage`        | `boolean \| undefined`   | 다음 페이지 존재 여부                             |
| `isFetchingNextPage` | `boolean`                | 페이지 로딩 상태                                |

### Options
| name               | type                                                                              | required | description                                                       |
| ------------------ | --------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `queryKey`         | `readonly unknown[]`                                                              | ✅        | 해당 채팅의 TanStack Query key                                         |
| `queryFn`          | `(pageParam: unknown) => Promise<Raw[]>`                                         | ✅        | 기존 채팅 내역을 불러오는 함수                                            |
| `initialPageParam` | `unknown`                                                                         | ✅        | 첫 페이지 요청 시 사용할 pageParam                                          |
| `getNextPageParam` | `(lastPage: Message[], allPages: Message[][]) => unknown` | ✅        | 다음 페이지 요청을 위한 pageParam 계산 함수                                     |
| `mutationFn`       | `(content: string) => Promise<Raw>`                                              | ✅        | 음성 인식 결과를 받아 AI 응답 1개를 반환하는 함수                          |
| `map`              | `(raw: Raw) => { id; role; content }`                                            | ✅        | Raw 데이터를 Message 구조로 매핑하는 함수                                      |
| `onError`          | `(error: unknown) => void`                                                        | ❌        | mutation 에러 발생 시 호출되는 콜백                                          |
| `staleTime`        | `number`                                                                          | ❌        | 캐시가 fresh 상태로 유지되는 시간 (ms)                                        |
| `gcTime`           | `number`                                                                          | ❌        | 캐시가 GC 되기 전까지 유지되는 시간 (ms)                                        |
| `voice`            | 아래 참조                                                      | ✅        | 음성 인식을 제어하는 컨트롤러 |


### <code>voice</code> object shape
```ts
{
  start: () => void;
  stop: () => void;
  isRecording: boolean;
  onTranscript: (text: string) => void;
}
```

### 🔁 Voice-based Optimistic Update Flow
**1.** 음성 인식 시작  
**2.** USER 메시지를 빈 content로 캐시에 즉시 삽입  
**3.** 음성 인식 중간 결과를 실시간으로 메시지에 반영  
**4.** 음성 인식 종료 + 로딩 중인 AI 메시지를 즉시 캐시에 삽입  
**5.** 최종 transcript로 AI 요청 전송  
**6.** AI placeholder 메시지를 실제 응답으로 교체  
**7.** 에러 또는 빈 입력 시 이전 상태로 rollback  

<br>

## Components
### Indicators
### ChatMessage
### ChatList
### ChatInput
### ChatContainer

<br>

## Design Philosophy

<br>






