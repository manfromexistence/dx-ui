"use client";

import { create } from "@/lib/store";
import { useTheme } from "@/lib/theme";

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="absolute top-4 right-4 px-4 py-2 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg font-semibold shadow-md hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-200"
    >
      Switch to {resolvedTheme === "dark" ? "Light" : "Dark"} Mode
    </button>
  );
}

export default function Counter() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div className="min-h-screen bg-white dark:bg-pink-500 text-gray-900 dark:text-white flex flex-col items-center justify-center transition-colors duration-500 relative">
      <ThemeToggle />
      <h1 className="text-8xl font-bold mb-8">{count}</h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={increment}
          className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transform hover:scale-105 transition-transform duration-200"
        >
          Increment
        </button>
        <button
          onClick={decrement}
          className="px-8 py-4 bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transform hover:scale-105 transition-transform duration-200"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
