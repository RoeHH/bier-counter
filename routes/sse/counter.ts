import { ServerSentEventStream } from "jsr:@std/http";
import { define } from "@/utils.ts";

const db = await Deno.openKv();

export const handler = define.handlers({
  async GET(_ctx) {
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (
            const [{ value: message }] of db.watch([["counter"]])
          ) {
            console.log("message", message);

            controller.enqueue({
              data: JSON.stringify({ counter: message }),
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
