<div align="center">
  <img width="350" height="240" alt="Image" src="https://github.com/user-attachments/assets/de84f731-14ae-4023-9649-2c22f7747ed1"/>
</div>

# react-optimistic-chat · [![npm](https://img.shields.io/npm/v/react-optimistic-chat)](https://www.npmjs.com/package/react-optimistic-chat)

<code>react-optimistic-chat</code>은 **React + TanStack Query** 기반으로  
AI 챗봇 서비스에서 필요한 **채팅 캐시 관리 및 optimistic update, 채팅 UI**를 손쉽게 구현할 수 있도록 돕는 라이브러리입니다.

<br>

## 목차
#### **1.** [Install & Requirements](#install--requirements)  
#### **2.** [Hooks](#hooks)  
**\-** [useChat](#usechat)  
**\-** [useBrowserSpeechRecognition](#usebrowserspeechrecognition)  
**\-** [useVoiceChat](#usevoicechat)  
#### **3.** [Components](#components)  
**\-** [Indicators](#indicators)  
**\-** [ChatMessage](#chatmessage)  
**\-** [ChatList](#chatlist)   
**\-** [ChatInput](#chatinput)   
**\-** [ChatContainer](#chatcontainer)   
#### **4.** [Core Types](#core-types)  
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

<h1 id="hooks">🔗 Hooks</h1>

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
| `queryFn` | `(pageParam: unknown) => Promise<TRaw[]>` | ✅ | 기존 채팅 내역을 불러오는 함수 |
| `initialPageParam` | `unknown` | ✅ | 첫 페이지 요청 시 사용할 pageParam |
| `getNextPageParam` | `(lastPage: Message[], allPages: Message[][]) => unknown` | ✅ | 다음 페이지 요청을 위한 pageParam 계산 함수 |
| `mutationFn` | `(content: string) => Promise<TRaw>` | ✅ | 유저 입력을 받아 AI 응답 1개를 반환하는 함수 |
| `map` | `(raw: TRaw) => { id; role; content }` | ✅ | Raw 데이터를 Message 구조로 매핑하는 함수 |
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

--- 
 
### useBrowserSpeechRecognition
### useVoiceChat

<br>

## Components
### Indicators
### ChatMessage
### ChatList
### ChatInput
### ChatContainer

<br>

## Core Types

<br>

## Design Philosophy

<br>



