import type { Signal } from "@preact/signals";
import { Button } from "../components/Button.tsx";
import { useEffect } from "preact/hooks";

const sseEffect =
  (url: string, onMessage: (data: any) => void, onError?: (err: any) => void) =>
  () => {
    const sse = new EventSource(url);

    sse.onerror = (err) => {
      console.log("Connection Error");
      sse.close();
      if (onError) {
        onError(err);
      }
    };

    sse.onmessage = (event) => {
      onMessage(JSON.parse(event.data));
    };
  };

interface CounterProps {
  count: Signal<number>;
}

export default function Counter({ count }: CounterProps) {
  useEffect(sseEffect(`/sse/counter`, (data) => {
    count.value = data.counter;
  }));

  const decrementFn = async () => {
    await fetch("/api/counter/decrement");
  };

  const incrementFn = async () => {
    await fetch("/api/counter/increment");
  };

  return (
    <div class="flex gap-8 py-6">
      <Button id="decrement" onClick={decrementFn}>-1</Button>
      <p class="text-3xl tabular-nums">{count}</p>
      <Button id="increment" onClick={incrementFn}>+1</Button>
    </div>
  );
}
