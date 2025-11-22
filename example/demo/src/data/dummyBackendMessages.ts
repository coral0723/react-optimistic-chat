export const dummyBackendData = [
  {
    chatId: "evt-001",
    sender: "user",
    body: "백엔드에서 채팅 데이터를 받았는데...",
    timestamp: 1737523000,
  },
  {
    chatId: "evt-002",
    sender: "user",
    body: "id, role, content가 아니네?",
    timestamp: 1737523002,
  },
  {
    chatId: "evt-003",
    sender: "user",
    body: "이 상태로 ChatList에 그냥 넘기면 오류날 것 같은데?",
    timestamp: 1737523005,
  },
  {
    chatId: "evt-004",
    sender: "bot",
    body: "맞아요! 이 데이터 구조는 Message 타입과 다릅니다.",
    timestamp: 1737523007,
  },
  {
    chatId: "evt-005",
    sender: "bot",
    body: "chatId → id, sender → role, body → content로 매핑해줘야 해요.",
    timestamp: 1737523010,
  },
  {
    chatId: "evt-006",
    sender: "user",
    body: "아 매핑을 직접 해야 되는구나?",
    timestamp: 1737523013,
  },
  {
    chatId: "evt-007",
    sender: "bot",
    body: "네! 그래서 ChatList에는 messageMapper라는 옵션이 있어요.",
    timestamp: 1737523016,
  },
  {
    chatId: "evt-008",
    sender: "bot",
    body: "messageMapper에서 원하는 구조로 변환해서 넘기면 됩니다!",
    timestamp: 1737523019,
  },
  {
    chatId: "evt-009",
    sender: "user",
    body: "그럼 이렇게 하면 되겠네?",
    timestamp: 1737523022,
  },
  {
    chatId: "evt-010",
    sender: "user",
    body: "messageMapper: (raw) => ({ id: raw.chatId, role: ..., content: raw.body })",
    timestamp: 1737523025,
  },
];
