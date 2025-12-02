import { db, define } from "@/utils.ts";

export const handler = define.handlers({
  async GET(ctx) {
    const user = ctx.state.user;
    user.beersChugged = (user.beersChugged ?? 0) + 1;
    await db.set(["counter", "log", user.sub], user);

    const counter = await db.get<number>(["counter"]);
    const newValue = (counter.value ?? 0) + 1;
    await db.set(["counter"], newValue);

    return new Response(
      JSON.stringify({ counter: newValue, beersChugged: user.beersChugged }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  },
});
