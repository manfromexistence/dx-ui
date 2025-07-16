"use client";

import { create } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { motion, AnimatePresence } from "@/components/dx";

interface CounterStore {
  count: number;
  increment: () => void;
  decrement: () => void;
}

const useCounterStore = create<CounterStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
}));

export default function Counter() {
  const { count, increment, decrement } = useCounterStore();

  return (
    <div className="min-h-screen bg-background text-gray-900 dark:text-white flex flex-col items-center justify-center transition-colors duration-500 relative overflow-hidden">
      {/* <AnimatePresence mode="wait">
        <motion.h1
          key={count}
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.8 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-8xl font-bold mb-8"
        >
          {count}
        </motion.h1>
      </AnimatePresence>
      <div className="flex items-center space-x-4">
        <motion.button
          onClick={increment}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="px-8 py-4 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Increment
        </motion.button>
        <motion.button
          onClick={decrement}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="px-8 py-4 bg-gray-600 text-white font-bold rounded-lg shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
        >
          Decrement
        </motion.button>
      </div> */}
      Motion
    </div>
  );
}
