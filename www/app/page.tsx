"use client"

import useSound from "@/lib/sound";

const BoopButton = () => {
    const [play] = useSound("/click.mp3");
    return <div onClick={play}>Boop!</div>;
};

export default function HomePage() {
    return (
        <div className="h-full w-full flex items-center justify-center font-bold text-4xl">
            <span>DX SOUND</span>
            <BoopButton />
        </div>
    );
}