"use client"

// Example Component for Next.js App Router (page.tsx)
export default function Page() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(1);

    const { play, pause, stop, volume: setSoundVolume, playing, on, duration } = useSound({
        src: ['https://main.v2.howl.js.org/assets/audio/sound.mp3'],
        autoplay: false,
        loop: false,
        volume: 1,
    });

    useEffect(() => {
        const checkPlaying = setInterval(() => {
            setIsPlaying(playing());
        }, 100);

        on('play', () => console.log('Playback started!'));
        on('pause', () => console.log('Playback paused!'));
        on('stop', () => console.log('Playback stopped!'));
        on('end', () => {
            console.log('Finished!');
            setIsPlaying(false);
        });

        return () => clearInterval(checkPlaying);
    }, [playing, on]);

    const handlePlayPause = () => {
        if (isPlaying) {
            pause();
        } else {
            play();
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolumeState(newVolume);
        (setSoundVolume as (vol: number) => void)(newVolume);
    };

    return (
        <div className="bg-gray-900 text-white min-h-screen flex flex-col items-center justify-center font-sans p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
                <h1 className="text-4xl font-bold mb-2 text-cyan-400">sound</h1>
                <p className="text-gray-400 mb-6">A React-based audio library for Next.js.</p>
                
                <div className="space-y-4">
                    <button 
                        onClick={handlePlayPause}
                        className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        {isPlaying ? 'Pause' : 'Play'}
                    </button>
                    <button 
                        onClick={() => stop()}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                    >
                        Stop
                    </button>
                </div>

                <div className="mt-8">
                    <label htmlFor="volume" className="block text-gray-400 mb-2">Volume</label>
                    <input
                        type="range"
                        id="volume"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    />
                </div>
            </div>
        </div>
    );
};
