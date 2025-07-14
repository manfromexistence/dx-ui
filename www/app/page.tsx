"use client";

import { create } from "@/lib/store";
import { useTheme } from "@/lib/theme";

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterStore>((setStore) => ({
  count: 0,
  increment: () => setStore((store) => ({ count: store.count + 1 })),
  decrement: () => setStore((store) => ({ count: store.count - 1 })),
}));

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="theme-toggle"
    >
      Switch to {resolvedTheme === "dark" ? "Light" : "Dark"} Mode
    </button>
  );
}

export default function Counter() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div className="counter-container">
      <ThemeToggle />
      <h1 className="counter-title">{count}</h1>
      <div className="button-group">
        <button
          onClick={increment}
          className="button button-increment"
        >
          Increment
        </button>
        <button
          onClick={decrement}
          className="button button-decrement"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
