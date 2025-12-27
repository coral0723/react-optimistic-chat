import { Route, Routes } from 'react-router-dom';
import './styles/app.css';
import LinkButton from './components/LinkButton';
import ChatMessagePlayGround from './pages/ChatMessagePlayGround';
import ChatListPlayGround from './pages/ChatListPlayGround';
import ChatInputPlayGround from './pages/ChatInputPlayGround';
import UseChatPG from './pages/UseChatPG';
import UseVoiceChatPG from './pages/UseVoiceChatPG';
import ChatContainerPG from './pages/ChatContainerPG';

function App() {
  return (
    <>
      <div className="app-wrapper">
        <h1 className="app-title">React Optimistic Chat Examples</h1>

        <Routes>
          <Route
            path="/"
            element={
              <div className="link-list">
                <LinkButton label="ChatMessage Playground" to="/chat-message" />
                <LinkButton label="ChatList Playground" to="/chat-list" />
                <LinkButton label="ChatInput Playground" to="/chat-lnput" />
                <LinkButton label="useChat Playground" to="/use-chat" />
                <LinkButton label="chatContainer Playground" to="/chat-container" />
                <LinkButton label="useVoiceChat Playground" to="/use-voice-chat" />
              </div>
            }
          />
          <Route path="/chat-message" element={<ChatMessagePlayGround />} />
          <Route path="/chat-list" element={<ChatListPlayGround/>} />
          <Route path="/chat-lnput" element={<ChatInputPlayGround/>} />
          <Route path="/use-chat" element={<UseChatPG/>} />
          <Route path="/chat-container" element={<ChatContainerPG/>} />
          <Route path="/use-voice-chat" element={<UseVoiceChatPG/>} />
        </Routes>
      </div>
    </>
  )
}

export default App
