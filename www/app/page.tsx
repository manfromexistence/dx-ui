'use client';

import { create } from '@/lib/ux/store';

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

export default function Counter() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-6xl font-bold mb-8">{count}</h1>
      <div className="flex space-x-4">
        <button
          onClick={increment}
          className="px-6 py-3 bg-indigo-600 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Increment
        </button>
        <button
          onClick={decrement}
          className="px-6 py-3 bg-red-600 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Decrement
        </button>
      </div>
    </div>
  );
}
