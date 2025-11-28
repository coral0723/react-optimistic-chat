import { http, HttpResponse } from 'msw';

const delay = (ms: number) => new Promise((res) => {
  setTimeout(res, ms);
});

export const handlers = [
  http.get(`/getChat`, async ({ request }) => {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');

    return new HttpResponse(
      JSON.stringify({
        code: "Success",
        message: "성공",
        result: [
          {
            chatId: "1", 
            sender: "user", 
            body: "안녕하세요!"
          }, 
          {
            chatId: "2", 
            sender: "ai", 
            body: `${roomId}: 무엇을 도와드릴까요?`
          }
        ],
      })
    );
  }),
  http.post(`/sendAI`, async ({ request }) => {
    const { content } = await request.json() as { content: string };
    await delay(3000);

    return new HttpResponse(
      JSON.stringify({
        code: "Success",
        message: "성공",
        result: {
          chatId: crypto.randomUUID(),
          sender: "ai",
          body: `AI 응답: ${content}`
        }
      })
    );
  }),
]
