'use client';

import React, { useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const defaultTestimonials = [
  {
    text: 'MVPBlocks has completely changed the way I build UIs. Copy-paste, done. No more design stress.',
    imageSrc: '/assets/avatars/avatar-1.webp',
    name: 'Arjun Mehta',
    username: '@arjdev',
    role: 'Frontend Developer',
  },
  {
    text: 'Honestly shocked at how smooth the animations and styling are out of the box. Just works.',
    imageSrc: '/assets/avatars/avatar-2.webp',
    name: 'Sara Lin',
    username: '@sara.codes',
    role: 'UX Designer',
  },
  {
    text: 'Our team launched a client site in 2 days using MVPBlocks. Saved so much time.',
    imageSrc: '/assets/avatars/avatar-3.webp',
    name: 'Devon Carter',
    username: '@devninja',
    role: 'Product Manager',
  },
  {
    text: 'Plugged a few blocks into our existing codebase and everything blended perfectly. Massive W.',
    imageSrc: '/assets/avatars/avatar-4.webp',
    name: 'Priya Shah',
    username: '@priyacodes',
    role: 'Full Stack Developer',
  },
  {
    text: 'Found a beautiful hero section, dropped it into V0, tweaked copy, and shipped in 15 minutes.',
    imageSrc: '/assets/avatars/avatar-5.webp',
    name: 'Leo Martin',
    username: '@leobuilds',
    role: 'Startup Founder',
  },
  {
    text: 'MVPBlocks helped us prototype multiple landing pages without writing CSS once.',
    imageSrc: '/assets/avatars/avatar-6.webp',
    name: 'Chloe Winters',
    username: '@chloewinters',
    role: 'UI Designer',
  },
];

interface TestimonialProps {
  testimonials?: {
    text: string;
    imageSrc: string;
    name: string;
    username: string;
    role?: string;
  }[];
  title?: string;
  subtitle?: string;
  autoplaySpeed?: number;
  className?: string;
}

export default function TestimonialsCarousel({
  testimonials = defaultTestimonials,
  title = 'What our users say',
  subtitle = 'From intuitive design to powerful features, our components have become essential tools for developers around the world.',
  autoplaySpeed = 3000,
  className,
}: TestimonialProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    containScroll: 'trimSnaps',
    dragFree: true,
  });

  useEffect(() => {
    if (!emblaApi) return;

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, autoplaySpeed);

    return () => {
      clearInterval(autoplay);
    };
  }, [emblaApi, autoplaySpeed]);

  const allTestimonials = [...testimonials, ...testimonials];

  return (
    <section
      className={cn('relative overflow-hidden py-16 md:py-24', className)}
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.2),transparent_60%)]" />
        <div className="absolute left-1/4 top-1/4 h-32 w-32 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute inset-0 bg-[length:20px_20px] bg-grid-foreground/[0.02]" />
      </div>

      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="relative mb-12 text-center md:mb-16"
        >
          <h1 className="mb-4 bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-3xl font-bold text-transparent md:text-5xl lg:text-6xl">
            {title}
          </h1>

          <motion.p
            className="mx-auto max-w-2xl text-base text-muted-foreground md:text-lg"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* Testimonials carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {allTestimonials.map((testimonial, index) => (
              <div
                key={`${testimonial.name}-${index}`}
                className="flex justify-center px-4"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="relative h-full w-fit rounded-2xl border border-border bg-gradient-to-b from-secondary/20 to-card p-6 shadow-md backdrop-blur-sm"
                >
                  {/* Enhanced decorative gradients */}
                  <div className="absolute -left-5 -top-5 -z-10 h-40 w-40 rounded-full bg-gradient-to-b from-primary/15 to-card blur-md" />
                  <div className="absolute -bottom-10 -right-10 -z-10 h-32 w-32 rounded-full bg-gradient-to-t from-primary/10 to-transparent opacity-70 blur-xl" />

                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="mb-4 text-primary"
                  >
                    <div className="relative">
                      <Quote className="h-10 w-10 -rotate-180" />
                    </div>
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="relative mb-6 text-base leading-relaxed text-foreground/90"
                  >
                    <span className="relative">{testimonial.text}</span>
                  </motion.p>

                  {/* Enhanced user info with animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                    viewport={{ once: true }}
                    className="mt-auto flex items-center gap-3 border-t border-border/40 pt-2"
                  >
                    <Avatar className="h-10 w-10 border border-border ring-2 ring-primary/10 ring-offset-1 ring-offset-background">
                      <AvatarImage
                        src={testimonial.imageSrc}
                        alt={testimonial.name}
                      />
                      <AvatarFallback>
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <h4 className="whitespace-nowrap font-medium text-foreground">
                        {testimonial.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <p className="whitespace-nowrap text-sm text-primary/80">
                          {testimonial.username}
                        </p>
                        {testimonial.role && (
                          <>
                            <span className="flex-shrink-0 text-muted-foreground">
                              •
                            </span>
                            <p className="whitespace-nowrap text-sm text-muted-foreground">
                              {testimonial.role}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
