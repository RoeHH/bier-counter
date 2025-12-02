import { ServerSentEventStream } from "jsr:@std/http";
import { db, define } from "@/utils.ts";

export const handler = define.handlers({
  GET(_ctx) {
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (
            const [{ value }] of db.watch([["counter"]])
          ) {
            controller.enqueue({
              data: JSON.stringify({ counter: value }),
              id: Date.now(),
              event: "message",
            });
          }
        },
        cancel() {
          console.log("cancel stream lol wtf");
        },
      }).pipeThrough(new ServerSentEventStream()),
      {
        headers: {
          "Content-Type": "text/event-stream",
        },
      },
    );
  },
});
