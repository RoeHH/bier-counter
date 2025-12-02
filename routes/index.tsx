import { useSignal } from "@preact/signals";
import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import Counter from "../islands/Counter.tsx";

export default define.page(function Home(ctx) {
  const count = useSignal(ctx.state.user?.beersChugged ?? 0);

  console.log("Shared value " + ctx.state.user?.name);

  return (
    <div class="px-4 py-8 mx-auto fresh-gradient min-h-screen">
      <Head>
        <title>Fresh counter</title>
      </Head>
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <Counter count={count} />

        <p class="text-lg">Du hesch vor em lade vo de Site scho {ctx.state.user?.beersChugged ?? 0} Bier gsoffe.</p>
      </div>
    </div>
  );
});
