'use client';

import type React from 'react';
import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Code, Star, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Particles } from '@/components/ui/particles';
import { Spotlight } from '@/components/ui/spotlight';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { useTheme } from 'next-themes';
import { Bricolage_Grotesque } from 'next/font/google';
import { cn } from '@/lib/utils';

const brico = Bricolage_Grotesque({
  subsets: ['latin'],
});

// Sample users for the waitlist display
const users = [
  { imgUrl: 'https://avatars.githubusercontent.com/u/111780029' },
  { imgUrl: 'https://avatars.githubusercontent.com/u/123104247' },
  { imgUrl: 'https://avatars.githubusercontent.com/u/115650165' },
  { imgUrl: 'https://avatars.githubusercontent.com/u/71373838' },
];

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { resolvedTheme } = useTheme();
  const [color, setColor] = useState('#ffffff');

  useEffect(() => {
    setColor(resolvedTheme === 'dark' ? '#ffffff' : '#e60a64');
  }, [resolvedTheme]);

  // Track mouse position for spotlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
      } else if (response.status === 409) {
        setError('This email is already registered!');
      } else {
        setError(data.error);
      }
    } catch (error) {
      setError('Error submitting email. Please try again.');
    } finally {
      setEmail('');
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden xl:h-screen">
      <Spotlight />
      <div className="absolute right-4 top-2 z-[150]">
        <ModeToggle />
      </div>
      <div
        className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_var(--x)_var(--y),rgba(236,72,153,0.05)_0,transparent_60%)]"
        style={
          {
            '--x': `${mousePosition.x}px`,
            '--y': `${mousePosition.y}px`,
          } as React.CSSProperties
        }
      />

      {/* Animated particles */}
      <Particles
        className="absolute inset-0 z-0"
        quantity={100}
        ease={80}
        refresh
        color={color}
      />

      <div className="relative z-[100] mx-auto max-w-2xl px-4 py-16 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/10 bg-gradient-to-r from-primary/15 to-primary/5 px-4 py-2 backdrop-blur-sm"
        >
          <img
            src="https://i.postimg.cc/vHnf0qZF/logo.webp"
            alt="logo"
            className="spin h-6 w-6"
          />
          <span className="text-sm font-medium">Mvpblocks</span>
          <motion.div
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
          >
            <ArrowRight className="h-4 w-4" />
          </motion.div>
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className={cn(
            'mb-4 cursor-crosshair bg-gradient-to-b from-foreground via-foreground/80 to-foreground/40 bg-clip-text text-4xl font-bold text-transparent sm:text-7xl',
            brico.className,
          )}
        >
          Join the{' '}
          <span className="bg-primary from-foreground via-rose-300 to-primary bg-clip-text text-transparent dark:bg-gradient-to-b">
            Waitlist
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mb-12 mt-2 text-muted-foreground sm:text-lg"
        >
          Be the first to access our revolutionary component library.
          <br className="hidden sm:block" /> Build your MVP faster than ever
          before.
        </motion.p>

        {/* Stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mb-12 grid grid-cols-2 gap-6 sm:grid-cols-3"
        >
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border border-primary/10 bg-white/5 p-4 backdrop-blur-md',
              resolvedTheme === 'dark' ? 'glass' : 'glass2',
            )}
          >
            <Code className="mb-2 h-5 w-5 text-primary" />
            <span className="text-xl font-bold">100+</span>
            <span className="text-xs text-muted-foreground">Components</span>
          </div>

          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border border-primary/10 bg-white/5 p-4 backdrop-blur-md',
              resolvedTheme === 'dark' ? 'glass' : 'glass2',
            )}
          >
            <ExternalLink className="mb-2 h-5 w-5 text-primary" />
            <span className="text-xl font-bold">Open Source</span>
            <span className="text-xs text-muted-foreground">BSD 3-Clause</span>
          </div>

          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border border-primary/10 bg-white/5 p-4 backdrop-blur-md',
              resolvedTheme === 'dark' ? 'glass' : 'glass2',
            )}
          >
            <Star className="mb-2 h-5 w-5 text-primary" />
            <span className="text-xl font-bold">Premium</span>
            <span className="text-xs text-muted-foreground">Quality</span>
          </div>

          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-xl border border-primary/10 bg-white/5 p-4 backdrop-blur-md sm:hidden',
              resolvedTheme === 'dark' ? 'glass' : 'glass2',
            )}
          >
            <Code className="mb-2 h-5 w-5 text-primary" />
            <span className="text-xl font-bold">15+</span>
            <span className="text-xs text-muted-foreground">Categories</span>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="mx-auto flex flex-col gap-4 sm:flex-row"
        >
          <AnimatePresence mode="wait">
            {!submitted ? (
              <>
                <div className="relative flex-1">
                  <motion.input
                    key="email-input"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-primary/20 bg-white/5 px-6 py-4 text-foreground backdrop-blur-md transition-all placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {error && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-1 text-sm text-destructive sm:absolute"
                    >
                      {error}
                    </motion.p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || submitted}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-b from-rose-500 to-rose-700 px-8 py-4 font-semibold text-primary-foreground text-white shadow-[0px_2px_0px_0px_rgba(255,255,255,0.3)_inset] transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.4)] focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                    <Sparkles className="h-4 w-4 transition-all duration-300 group-hover:rotate-12" />
                  </span>
                  <span className="absolute inset-0 z-0 bg-gradient-to-r from-rose-500 to-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
                </button>
              </>
            ) : (
              <motion.div
                key="thank-you-message"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6 }}
                className={cn(
                  'flex-1 cursor-pointer rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 px-6 py-4 font-medium text-primary backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] active:brightness-125',
                  resolvedTheme === 'dark' ? 'glass' : 'glass2',
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  Thanks for joining!{' '}
                  <Sparkles className="h-4 w-4 animate-pulse" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>

        {/* User avatars */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-10 flex items-center justify-center gap-1"
        >
          <div className="flex -space-x-3">
            {users.map((user, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, x: -10 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 1 + i * 0.2 }}
                className="size-10 rounded-full border-2 border-background bg-gradient-to-r from-primary to-rose-500 p-[2px]"
              >
                <div className="overflow-hidden rounded-full">
                  <img
                    src={user.imgUrl}
                    alt="Avatar"
                    className="rounded-full transition-all duration-300 hover:rotate-6 hover:scale-110"
                    width={40}
                    height={40}
                  />
                </div>
              </motion.div>
            ))}
          </div>
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 1.3 }}
            className="ml-2 text-muted-foreground"
          >
            <span className="font-semibold text-primary">100+</span> already
            joined ✨
          </motion.span>
        </motion.div>
      </div>

      {/* Add keyframes for particle animation */}
      <style jsx global>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0) translateX(0);
            opacity: 0.3;
          }
          25% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-40px) translateX(-10px);
            opacity: 0.4;
          }
          75% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.6;
          }
        }
      `}</style>
    </main>
  );
}
