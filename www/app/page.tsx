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
      className="absolute top-4 right-4 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
    >
      Switch to {resolvedTheme === "dark" ? "Light" : "Dark"} Mode
    </button>
  );
}

export default function Counter() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen transition-colors bg-yellow-500 dark:bg-red-500">
      <ThemeToggle />
      <h1 className="text-6xl font-bold mb-8">{count}</h1>
      <div className="flex space-x-4">
        <button
          onClick={increment}
          className="px-6 py-3 bg-indigo-600 rounded-lg text-lg font-semibold text-white hover:bg-indigo-700 transition-colors"
        >
          Increment
        </button>
        <button
          onClick={decrement}
          className="px-6 py-3 bg-red-600 rounded-lg text-lg font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
