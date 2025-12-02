import type { Signal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { useEffect } from "preact/hooks";
import { increment } from "jsr:@std/semver@^1.0.6/increment";

interface CounterProps {
  count: Signal<number>;
}

export default function Counter(props: CounterProps) {
  useEffect(() => {
    const sse = new EventSource(`/sse/counter`);
    sse.onerror = (_err) => {
      console.log("Connection Error");
      sse.close();
    };

    sse.onmessage = (event) => {
      const data = JSON.parse(event.data);
      props.count.value = data.counter;
    };
  }, []);

  const decrementFn = async () => {
    await fetch("/api/counter/decrement");
  };

  const incrementFn = async () => {
    await fetch("/api/counter/increment");
  };

  return (
    <div class="flex gap-8 py-6">
      <Button id="decrement" onClick={decrementFn}>-1</Button>
      <p class="text-3xl tabular-nums">{props.count}</p>
      <Button id="increment" onClick={incrementFn}>+1</Button>
    </div>
  );
}
