<div align="center">
  <img width="350" height="240" alt="Image" src="https://github.com/user-attachments/assets/de84f731-14ae-4023-9649-2c22f7747ed1"/>
</div>

# react-optimistic-chat · [![npm](https://img.shields.io/npm/v/react-optimistic-chat)](https://www.npmjs.com/package/react-optimistic-chat)

<code>react-optimistic-chat</code>은 **React + TanStack Query** 기반으로  
AI 챗봇 서비스에서 필요한 **채팅 캐시 관리 및 optimistic update, 채팅 UI**를 손쉽게 구현할 수 있도록 돕는 라이브러리입니다.

## 목차
### **1.** [Install & Requirements](#install--requirements)  
### **2.** [Hooks](#hooks)  
**\-** [useChat](#usechat)  
**\-** [useBrowserSpeechRecognition](#usebrowserspeechrecognition)  
**\-** [useVoiceChat](#usevoicechat)  
### **3.** [Components](#components)  
**\-** [Indicators](#indicators)  
**\-** [ChatMessage](#chatmessage)  
**\-** [ChatList](#chatlist)   
**\-** [ChatInput](#chatinput)   
**\-** [ChatContainer](#chatcontainer)   
### **4.** [Core Types](#core-types)  
### **5.** [Design Philosophy](#design-philosophy)  

<br>

## 📦 Install & Requirements
### Installation
```bash
npm install react-optimistic-chat
# or
yarn add react-optimistic-chat
```
---
### Peer Dependencies
이 라이브러리는 아래 패키지들을 **peer dependency**로 사용합니다.  
프로젝트에 반드시 설치되어 있어야 합니다.  
```json
{
  "@tanstack/react-query": ">=5",
  "react": ">=18",
  "react-dom": ">=18"
}
```
---
### styles
<code>react-optimistic-chat</code>의 **채팅 UI 컴포넌트**를 사용하려면  
아래 스타일 파일을 반드시 import 해야 합니다.
```ts
import "react-optimistic-chat/style.css";
```
> React 프로젝트에서는 `App.tsx`에,  
> Next.js(App Router)에서는 루트 `Layout.tsx`에서 import 하는 것을 권장합니다.

<br>

## Hooks
### useChat
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

