import { http, HttpResponse } from 'msw';

const delay = (ms: number) => new Promise((res) => {
  setTimeout(res, ms);
});

const randomBoolean = () => Math.random() < 0.5;

export const handlers = [
  http.get(`/getChat`, async ({ request }) => {
    const url = new URL(request.url);
    const roomId = url.searchParams.get('roomId');
    const page = url.searchParams.get('page');

    await delay(2000);

    return new HttpResponse(
      JSON.stringify({
        code: "Success",
        message: "성공",
        result: [
          {
            chatId: `1${randomBoolean()}`, 
            sender: "user", 
            body: "안녕하세요!",
            timestamp: "1222",
          }, 
          {
            chatId: `2${randomBoolean()}`, 
            sender: "ai", 
            body: `${roomId}, ${page}: 무엇을 도와드릴까요?`
          },
          {
            chatId: `3${randomBoolean()}`, 
            sender: "user", 
            body: "안녕하세요!"
          }, 
          {
            chatId: `4${randomBoolean()}`, 
            sender: "ai", 
            body: `${roomId}, ${page}: 무엇을 도와드릴까요?`
          },
          {
            chatId: `5${randomBoolean()}`, 
            sender: "user", 
            body: "안녕하세요!"
          }, 
          {
            chatId: `6${randomBoolean()}`, 
            sender: "ai", 
            body: `${roomId}, ${page}: 무엇을 도와드릴까요?`
          },
          {
            chatId: `7${randomBoolean()}`, 
            sender: "user", 
            body: "안녕하세요!"
          }, 
          {
            chatId: `8${randomBoolean()}`, 
            sender: "ai", 
            body: `${roomId}, ${page}: 무엇을 도와드릴까요?`
          },
        ],
      })
    );
  }),
  http.post(`/sendAI`, async ({ request }) => {
    const { content, forceError } = await request.json() as { 
      content: string;
      forceError: boolean;
    };

    await delay(3000);

    if (forceError) {
      return new HttpResponse(
        JSON.stringify({
          code: "Error",
          message: "강제 에러 발생 테스트",
        }),
        {status: 500}
      );
    }
    return new HttpResponse(
      JSON.stringify({
        code: "Success",
        message: "성공",
        result: {
          chatId: crypto.randomUUID(),
          sender: "ai",
          body: `AI 응답입니다: ${content}`,
          end: randomBoolean(),
        }
      })
    );
  }),
]
