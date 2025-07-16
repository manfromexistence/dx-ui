"use client"

import { useSound } from "@/lib/sound";

const PlayIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="5 3 19 12 5 21 5 3" /></svg>
);
const PauseIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
);
const StopIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>
);

function SoundPlayer({ title, soundUrl }: { title: string; soundUrl: string }) {
  const [play, { pause, stop, isPlaying, duration }] = useSound(soundUrl, { preload: true });

  const formatDuration = (ms: number | null) => {
      if (ms === null) return "0:00";
      const seconds = Math.floor(ms / 1000) % 60;
      const minutes = Math.floor(ms / (1000 * 60));
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
      <div className="w-full max-w-sm p-6 bg-white dark:black rounded-2xl shadow-lg space-y-4 transform hover:scale-105 transition-transform duration-300">
          <h3 className="text-xl font-bold text-center text-gray-800 dark:text-white">{title}</h3>
          <div className="flex items-center justify-center space-x-4">
              <button
                  onClick={() => (isPlaying ? pause() : play())}
                  className="p-3 rounded-full bg-blue-500 text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200"
                  aria-label={isPlaying ? "Pause" : "Play"}
              >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button
                  onClick={() => stop()}
                  className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 transition-all duration-200"
                  aria-label="Stop"
              >
                  <StopIcon />
              </button>
          </div>
          <div className="text-center text-sm text-gray-600 dark:text-gray-300">
              <p>Status: <span className={`font-semibold ${isPlaying ? "text-green-500" : "text-red-500"}`}>{isPlaying ? "Playing" : "Stopped"}</span></p>
              <p>Duration: {formatDuration(duration)}</p>
          </div>
      </div>
  );
}

export default function HomePage() {
  return (
      <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex flex-col items-center justify-center transition-colors duration-500 p-4">
          <div className="text-center mb-12">
              <h1 className="text-5xl font-extrabold mb-2">dx-sound Demo</h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                  A showcase of your custom `useSound` hook!
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SoundPlayer
                  title="Drum Beat"
                  soundUrl="https://s3.amazonaws.com/freecodecamp/drums/Heater-1.mp3"
              />
              <SoundPlayer
                  title="Synth Chord"
                  soundUrl="https://s3.amazonaws.com/freecodecamp/drums/Chord_1.mp3"
              />
          </div>
      </div>
  );
}
