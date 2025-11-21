import ChatMessage from "../../../src/components/ChatMessage";

function App() {
  return (
    <div className="bg-white max-w-2xl p-2 mx-auto">
      <ChatMessage
        id={1}
        role="AI"
        content="안녕하세요 무엇을 도와드릴까요"
      />
      <ChatMessage
        id={2}
        role="USER"
        content="아무것도 아니야"
      />
      
    </div>
  );
}

export default App;
