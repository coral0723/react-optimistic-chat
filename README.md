<div align="center">
  <img width="350" height="240" alt="Image" src="https://github.com/user-attachments/assets/de84f731-14ae-4023-9649-2c22f7747ed1"/>
</div>

# react-optimistic-chat · [![npm](https://img.shields.io/npm/v/react-optimistic-chat)](https://www.npmjs.com/package/react-optimistic-chat)

<code>react-optimistic-chat</code>은 **React + TanStack Query** 기반으로  
AI 챗봇 서비스에서 필요한 **채팅 캐시 관리 및 optimistic update, 채팅 UI**를 손쉽게 구현할 수 있도록 돕는 라이브러리입니다.

<br>

> 이 라이브러리는 AI 응답 생성 기능을 포함하지 않으며,  
> 기존 API와 결합해 채팅 상태 관리와 UI 구현에만 집중합니다.

<br>

## 목차
#### **1.** [Install & Requirements](#install--requirements)  
#### **2.** [Quick Start](#quick-start)  
#### **3.** [Core Types](#core-types)  
**\-** [Message](#message)  
**\-** [VoiceRecognition](#voicerecognition)  
#### **4.** [Hooks](#hooks)  
**\-** [useChat](#usechat)  
**\-** [useBrowserSpeechRecognition](#usebrowserspeechrecognition)  
**\-** [useVoiceChat](#usevoicechat)  
#### **5.** [Components](#components)  
**\-** [Indicators](#indicators)  
**\-** [ChatMessage](#chatmessage)  
**\-** [ChatList](#chatlist)   
**\-** [ChatInput](#chatinput)   
**\-** [ChatContainer](#chatcontainer)   
#### **6.** [Design Philosophy](#design-philosophy)  

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

<h1 id="quick-start">🚀 Quick Start</h1>

아래 예제는 서버로부터 전달되는 Raw 채팅 데이터를  
<code>useChat</code>과 <code>ChatContainer</code>를 조합해 **최소한의 설정으로 채팅 UI를 구성하는 방법**을 보여줍니다.  

**Raw 데이터 → Message 타입 정규화 → 캐싱 → 렌더링**까지의 흐름을 한 번에 확인할 수 있습니다.  

<br>

## 1️⃣ RawMessage
서버로부터 전달되는 채팅 데이터는 다음과 같은 형태라고 가정합니다.  
```ts
type Raw = {
  chatId: string;
  sender: "ai" | "user";
  body: string;
};
```

<br>

## 2️⃣ getChat & sendAI
채팅 목록을 불러오고, 사용자 메시지를 서버로 전송하는 함수는 다음과 같은 형태라고 가정합니다.  
```ts
async function getChat(roomId: string, page: number): Promise<Raw[]> {
  const res = await fetch(`/getChat?roomId=${roomId}&page=${page}`);

  if (!res.ok) {
    throw new Error("채팅 불러오기 실패");
  }

  const json = await res.json();
  return json.result;
}

async function sendAI(content: string): Promise<Raw> {
  const res = await fetch(`/sendAI`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    throw new Error("AI 응답 실패");
  }

  const json = await res.json();
  return json.result;
}
```

<br>

## 3️⃣ ChatExample 
<code>useChat</code> 훅으로 메시지 상태를 관리하고,  
<code>ChatContainer</code> 컴포넌트에 전달해 채팅 UI + 무한 스크롤을 구성합니다.  

이때 서버의 Raw 데이터를 Message 타입의  
<code>id</code>, <code>role</code>, <code>content</code> 필드에 **정확히 매핑**합니다.

```tsx
export default function ChatExample() {
  const roomId = "room-1";
  const PAGE_SIZE = 8;

  const {
    messages,
    sendUserMessage,
    isPending,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useChat<Raw>({
    queryKey: ["chat", roomId],
    queryFn: (pageParam) => getChat(roomId, pageParam as number),
    initialPageParam: 0,

    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length : undefined,

    mutationFn: sendAI,

    map: (raw) => ({
      id: raw.chatId,
      role: raw.sender === "ai" ? "AI" : "USER",
      content: raw.body,
    }),
  });

  return (
    <ChatContainer
      className="h-[80vh]"
      messages={messages}
      onSend={sendUserMessage}
      isSending={isPending}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
    />
  );
}
```

<br>

## 4️⃣ VoiceChatExample
음성 입력 기반 채팅을 사용하고 싶은 경우,  
<code>useBrowserSpeechRecognition</code>을 생성한 뒤  
<code>useVoiceChat</code>의 <code>voice</code> 옵션으로 전달하면 됩니다.  

```tsx
const voice = useBrowserSpeechRecognition();

const {
  // 음성 제어용 API
  startRecording,
  stopRecording,
  ...
} = useVoiceChat<Raw>({
  voice,
  ...
});
```

<br>

<h1 id="core-types">🧩 Core Types</h1>

<h2 id="message">🧩 Message</h2>

<code>react-optimistic-chat</code>은 채팅을 단순한 문자열 배열이 아닌  
**일관된 Message 타입을 중심으로 관리**하도록 설계되었습니다.

모든 Hooks와 UI 컴포넌트는 이 Core Type을 기준으로 동작하며,  
서버로부터 전달되는 다양한 형태의 Raw 데이터를 **예측 가능한 구조로 정규화**하는 것을 목표로 합니다.  
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

## Example: \<Raw> → \<Message> 정규화
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

<h2 id="voicerecognition">🧩 VoiceRecognition</h2>

<code>react-optimistic-chat</code>은 음성 입력을 단순한 브라우저 API 호출이 아닌  
**일관된 VoiceRecognition 인터페이스를 통해 추상화**하도록 설계되었습니다.  

이를 통해 입력 방식(브라우저, 외부 SDK, 커스텀 STT 등)에 관계없이  
<code>useVoiceChat</code> 훅과 <code>ChatInput</code> 컴포넌트에서 동일한 방식으로 음성 인식 상태를 제어할 수 있습니다.

```ts
type VoiceRecognition = {
  start: () => void;
  stop: () => void;
  isRecording: boolean;
  onTranscript?: (text: string) => void;
}
```

| field          | type                     | description         |
| -------------- | ------------------------ | ------------------- |
| `start`        | `() => void`             | 음성 인식을 시작하는 함수      |
| `stop`         | `() => void`             | 음성 인식을 중단하는 함수      |
| `isRecording`  | `boolean`                | 현재 음성 인식이 진행 중인지 여부 |
| `onTranscript` | `(text: string) => void` | 인식된 음성 텍스트를 전달받는 콜백<br>• `useVoiceChat`에서는 필수<br>• `ChatInput`에서는 내부에서 자동으로 처리 |



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

<br>

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

<br>

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

<br> 

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

<br>

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

<br>

### Usage
```ts
const voice = useBrowserSpeechRecognition();
```

<br>
 
### Returned Values

| name | type | description |
|------|------|-------------|
| `start` | `() => void` | 음성 인식 시작 |
| `stop` | `() => void` | 음성 인식 종료 |
| `isRecording` | `boolean` | 현재 음성 인식 진행 상태 |
| `onTranscript` | `(fn: (text: string) => void) => void` | 음성 인식 결과(transcript)를 처리할 콜백 |

<br>
 
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

<br>

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
  voice,
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

<br>
 
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

<br>
 
### Options
| name               | type                                                                              | required | description                                                       |
| ------------------ | --------------------------------------------------------------------------------- | -------- | ----------------------------------------------------------------- |
| `voice`            | `VoiceRecognition`                                             | ✅        | 음성 인식을 제어하는 컨트롤러 |
| `queryKey`         | `readonly unknown[]`                                                              | ✅        | 해당 채팅의 TanStack Query key                                         |
| `queryFn`          | `(pageParam: unknown) => Promise<Raw[]>`                                         | ✅        | 기존 채팅 내역을 불러오는 함수                                            |
| `initialPageParam` | `unknown`                                                                         | ✅        | 첫 페이지 요청 시 사용할 pageParam                                          |
| `getNextPageParam` | `(lastPage: Message[], allPages: Message[][]) => unknown` | ✅        | 다음 페이지 요청을 위한 pageParam 계산 함수                                     |
| `mutationFn`       | `(content: string) => Promise<Raw>`                                              | ✅        | 음성 인식 결과를 받아 AI 응답 1개를 반환하는 함수                          |
| `map`              | `(raw: Raw) => { id; role; content }`                                            | ✅        | Raw 데이터를 Message 구조로 매핑하는 함수                                      |
| `onError`          | `(error: unknown) => void`                                                        | ❌        | mutation 에러 발생 시 호출되는 콜백                                          |
| `staleTime`        | `number`                                                                          | ❌        | 캐시가 fresh 상태로 유지되는 시간 (ms)                                        |
| `gcTime`           | `number`                                                                          | ❌        | 캐시가 GC 되기 전까지 유지되는 시간 (ms)                                        |

<br>
 
### 🔁 Voice-based Optimistic Update Flow
**1.** 음성 인식 시작  
**2.** USER 메시지를 빈 content로 캐시에 즉시 삽입  
**3.** 음성 인식 중간 결과를 실시간으로 메시지에 반영  
**4.** 음성 인식 종료 + 로딩 중인 AI 메시지를 즉시 캐시에 삽입  
**5.** 최종 transcript로 AI 요청 전송  
**6.** AI placeholder 메시지를 실제 응답으로 교체  
**7.** 에러 또는 빈 입력 시 이전 상태로 rollback  

<br>

<h1 id="components">🎨 Components</h1>

<h2 id="indicators">🎨 Indicators</h2>

<code>Indicators</code>는 **로딩 상태를 시각적으로 표현하기 위한 컴포넌트 모음**입니다.  
현재 아래 두 가지 컴포넌트를 제공합니다.

| <img src="https://github.com/user-attachments/assets/cd480e2f-5518-4588-bf90-e3461607bef1" alt="LoadingSpinner" width="120" /> | <img src="https://github.com/user-attachments/assets/0c30ce29-9535-480b-b74f-0f170a594951" alt="SendingDots" width="120" /> |
| :---------------: | :---------------: |
| **LoadingSpinner** | **SendingDots** |

<br>
 
### Usage
```tsx
<LoadingSpinner size="lg" />
```
```tsx
<SendingDots size="lg" />
```

<br>
 
### Props
| name   | type                           | required | description |
| ------ | ------------------------------ |-----| ----------- |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | ❌ | 컴포넌트의 크기<br>(<code>default</code>: "md")   |

<br>

<h2 id="chatmessage">🎨 ChatMessage</h2>

<code>ChatMessage</code>는 **단일 채팅 메시지를 렌더링하는 말풍선 컴포넌트**입니다.  
메시지의 <code>role</code>에 따라 AI / USER 레이아웃을 자동으로 분기하며,  
아이콘, 위치, 스타일을 유연하게 커스터마이징할 수 있도록 설계되었습니다.

| <img width="224" height="63" alt="Image" src="https://github.com/user-attachments/assets/e351d1f2-b476-41f5-a002-eee4119cf0a0" /> | <img width="174" height="61" alt="Image" src="https://github.com/user-attachments/assets/98a8e033-d364-49da-bdc1-bc0a9f842969" /> |
| :---------------: | :---------------: |
| **role="AI"** | **role="USER"** |

<br>
 
### Usage
```tsx
<ChatMessage
  id="1"
  role="AI"
  content="안녕하세요! 무엇을 도와드릴까요?"
/>

<ChatMessage
  id="2"
  role="USER"
  content="질문이 있어요."
/>

<ChatMessage
  id="3"
  role="AI"
  isLoading
  loadingRenderer={<SendingDots/>}
/>
```

<br>
 
### Props
| name | type | required | description |
| ----------------- | ----------------------------- | --------------- | --------------- |
| `id`              | `string`                      | ✅ | 메시지의 고유 식별자      |
| `role`            | `"AI" \| "USER"`              | ✅ | 메시지 주체<br><code>AI</code>: 좌측 메시지<br>  <code>USER</code>: 우측 메시지  |
| `content`         | `string`                      | ✅ | 메시지 텍스트         |
| `isLoading`       | `boolean`                     | ❌ | 로딩 상태 여부        |
| `wrapperClassName` | `string` | ❌ | 메시지 wrapper 커스텀 클래스 |
| `icon` | `React.ReactNode` | ❌ | AI 메시지에 표시할 커스텀 아이콘 |
| `aiIconWrapperClassName` | `string` | ❌ | AI 아이콘 wrapper 커스텀 클래스 |
| `aiIconColor` | `string` | ❌ | 기본 AI 아이콘 색상 클래스 |
| `bubbleClassName` | `string` | ❌ | 공통 말풍선 커스텀 클래스 |
| `aiBubbleClassName` | `string` | ❌ | AI 말풍선 커스텀 클래스 |
| `userBubbleClassName` | `string` | ❌ | User 말풍선 커스텀 클래스 |
| `position` | `"auto" \| "left" \| "right"` | ❌ | 말풍선 위치 설정 |
| `loadingRenderer` | `React.ReactNode` | ❌ | 로딩 상태 시 렌더링할 커스텀 UI<br>(<code>default</code>: \<LoadingSpinner/>) |

<br>

<h2 id="chatlist">🎨 ChatList</h2>

<code>ChatList</code>는 **채팅 메시지 목록을 렌더링하는 컴포넌트**입니다.  
내부에서 <code>ChatMessage</code>를 사용해 메시지를 순서대로 나열하며,  
메시지 매핑, 커스텀 렌더링을 통해 유연한 메시지 UI 구성이 가능합니다.  

| <img width="524" height="450" alt="Image" src="https://github.com/user-attachments/assets/d55f54cc-22b3-4153-9982-5fe086aa5e31" /> |
| :---------------: | 
| **ChatList** |

<br>
 
### Usage
```tsx
// 이미 Message 타입으로 정규화된 데이터를 사용하는 경우
<ChatList
  messages={messages}
/>

// 서버에서 내려오는 Raw 데이터를 사용하는 경우
<ChatList
  messages={messages}
  messageMapper={(msg) => ({
    id: Number(msg.chatId),
    role: msg.sender === "bot" ? "AI" : "USER",
    content: msg.body,
  })}
/>

// 커스텀 메시지 UI 사용
<ChatList
  messages={messages}
  messageRenderer={(msg) => (
    <CustomMessage key={msg.id} {...msg} />
  )}
/>
```

<br>
 
### Props
| name              | type                                     | required | description                         |
| ----------------- | ---------------------------------------- | -------- | ----------------------------------- |
| `messages`        | `Message[] \| Raw[]`                     | ✅        | 렌더링할 메시지 배열                         |
| `messageMapper`   | `(msg: Raw) => Message`               | ❌        | Raw 데이터를 Message 구조로 매핑하는 함수    |
| `messageRenderer` | `(msg: Message) => React.ReactNode`      | ❌        | 기본 `ChatMessage` 대신 사용할 커스텀 메시지 렌더러 |
| `className`       | `string`                                 | ❌        | 메시지 리스트 wrapper 커스텀 클래스             |
| `loadingRenderer` | `React.ReactNode`                        | ❌        | AI 메시지의 로딩 상태에 전달할 커스텀 로딩 UI<br>(<code>default</code>: \<LoadingSpinner/>)        |

<br>

<h2 id="chatinput">🎨 ChatInput</h2>

<code>ChatInput</code>은 **텍스트 입력과 음성 입력을 모두 지원하는 채팅 입력 컴포넌트**입니다.  
**textarea** 기반 입력창과 전송 버튼을 제공하며,  
마이크 버튼을 통해 음성을 텍스트로 변환해 입력할 수 있도록 설계되었습니다.  

기본적으로 브라우저 음성 인식 기능을 사용한  
<code>useBrowserSpeechRecognition</code> 훅이 설정되어 있으며,  
다른 음성 인식 로직을 사용하고 싶은 경우 **voice** 옵션으로 교체할 수 있습니다.

| <img width="534" height="69" alt="Image" src="https://github.com/user-attachments/assets/15c90e44-1a44-4243-87ec-7755610eafb2" />|
| :---------------: | 
| **ChatInput** |

<br>
 
### Usage
```tsx
<ChatInput
  onSend={(value) => {
    console.log(value);
  }}
  isSending={isPending}
/>
```

<br>
 
### Props
| name              | type                                       | required | description                   |
| ----------------- | ------------------------------------------ | -------- | ----------------------------- |
| `onSend`          | `(value: string) => void \| Promise<void>` | ✅        | 메시지 전송 시 호출되는 콜백              |
| `isSending`       | `boolean`                                  | ✅        | 메시지 전송 중 상태 여부                    |
| `voice`           | `boolean \| VoiceRecognition`    | ❌        | 음성 인식 사용 여부 또는 커스텀 음성 인식 컨트롤러<br>(<code>default</code>: true) |
| `placeholder`     | `string`                                   | ❌        | 입력창 placeholder 텍스트      |
| `className`       | `string`                                   | ❌        | 전체 wrapper 커스텀 클래스            |
| `inputClassName`  | `string`                                   | ❌        | textarea 커스텀 클래스              |
| `micButton`       | `{ className?: string; icon?: ReactNode }` | ❌        | 마이크 버튼 커스터마이징                 |
| `recordingButton` | `{ className?: string; icon?: ReactNode }` | ❌        | 녹음 중 버튼 커스터마이징                |
| `sendButton`      | `{ className?: string; icon?: ReactNode }` | ❌        | 전송 버튼 커스터마이징                  |
| `sendingButton`   | `{ className?: string; icon?: ReactNode }` | ❌        | 전송 중 버튼 커스터마이징                |
| `maxHeight`       | `number`                                   | ❌        | textarea 최대 높이(px)            |
| `value`           | `string`                                   | ❌        | 컨트롤드 모드 입력값                   |
| `onChange`        | `(value: string) => void`                  | ❌        | 컨트롤드 모드 입력 변경 핸들러             |
| `submitOnEnter`   | `boolean`                                  | ❌        | Enter 키로 전송할지 여부              |

<br>

<h2 id="chatcontainer">🎨 ChatContainer</h2>

<code>ChatContainer</code>는 **채팅 UI를 빠르게 구성하고 싶은 사용자를 위한 채팅 컨테이너 컴포넌트**입니다.  
<code>ChatList</code>와 <code>ChatInput</code>을 내부에서 함께 렌더링하며,  
<code>useChat</code>, <code>useVoiceChat</code>과 자연스럽게 결합할 수 있도록 설계되었습니다.  

또한 <code>fetchNextPage</code>, <code>hasNextPage</code>, <code>isFetchingNextPage</code>를 props로 받아  
스크롤을 최상단으로 올리면 과거 채팅 내역을 자동으로 로딩합니다.  

| <img width="438" height="532" alt="Image" src="https://github.com/user-attachments/assets/b1713f34-419e-40cf-a79c-016c57145920" />|
| :---------------: | 
| **ChatContainer** |

- 메시지 추가 시 스크롤이 하단에 고정됨
- 스크롤 최상단 도달 시 과거 메시지 페이지 로딩
- 하단에 도달하지 않은 상태에서는 "scroll to bottom" 버튼 노출

<br>
 
### Usage
```tsx
// 이미 Message 타입으로 정규화된 데이터를 사용하는 경우
<ChatContainer
  messages={messages}
  onSend={sendMessage}
  isSending={isPending}
/>

// 서버에서 내려오는 Raw 데이터를 사용하는 경우
<ChatContainer
  messages={rawMessages}
  messageMapper={(raw) => ({
    id: raw.id,
    role: raw.sender === "user" ? "USER" : "AI",
    content: raw.text,
  })}
  onSend={sendMessage}
  isSending={isPending}
/>

// useChat, useVoiceChat과 함께 사용하는 경우
<ChatContainer
  messages={messages}
  onSend={sendMessage}
  isSending={isPending}
  fetchNextPage={fetchNextPage}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
/>
```

<br>
 
### Props
| name                 | type                                       | required | description                         |
| -------------------- | ------------------------------------------ | -------- | ----------------------------------- |
| `messages`           | `Message[] \| Raw[]`                         | ✅        | 렌더링할 메시지 배열                         |
| `onSend`             | `(value: string) => void \| Promise<void>` | ✅        | 메시지 전송 시 호출되는 콜백                    |
| `isSending`          | `boolean`                                  | ✅        | 메시지 전송 중 상태 여부                      |
| `messageMapper`      | `(msg: Raw) => Message`                      | ❌        | Raw 데이터를 `Message`구조로 매핑하는 함수         |
| `messageRenderer`    | `(msg: Message) => React.ReactNode`        | ❌        | 기본 `ChatMessage` 대신 사용할 커스텀 메시지 렌더러 |
| `loadingRenderer`    | `React.ReactNode`                          | ❌        | 메시지 로딩 상태에 사용할 커스텀 UI               |
| `listClassName`      | `string`                                   | ❌        | `ChatList` wrapper 커스텀 클래스          |
| `disableVoice`       | `boolean`                                  | ❌        | 음성 입력 기능 비활성화 여부                    |
| `placeholder`        | `string`                                   | ❌        | 입력창 placeholder 텍스트                 |
| `inputClassName`     | `string`                                   | ❌        | `ChatInput` 커스텀 클래스                 |
| `fetchNextPage`      | `() => void`                               | ❌        | 다음 채팅 페이지를 요청하는 함수                   |
| `hasNextPage`        | `boolean`                                  | ❌        | 다음 페이지 존재 여부                 |
| `isFetchingNextPage` | `boolean`                                  | ❌        | 다음 페이지 로딩 상태                    |
| `className`          | `string`                                   | ❌        | 전체 컨테이너 wrapper 커스텀 클래스             |

<br>

## Design Philosophy

<br>













