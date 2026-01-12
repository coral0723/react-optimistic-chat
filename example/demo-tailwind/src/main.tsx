import worker from './mocks/browser.ts';

if (import.meta.env.VITE_API_MOCKING === "enabled") {
  worker.start();
}

import { BrowserRouter } from 'react-router-dom'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '../../../src/styles/chatMessage.css';
import '../../../src/styles/chatList.css';
import '../../../src/styles/chatInput.css';
import '../../../src/styles/chatContainer.css';
import '../../../src/styles/loadingSpinner.css';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <App />
      <ReactQueryDevtools initialIsOpen={false}/>
    </QueryClientProvider>
  </BrowserRouter>,
)
