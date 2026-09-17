'use client';

import { useState } from 'react';
import Image from 'next/image';

interface FoodImageProps {
  src: string | null | undefined;
  alt: string;
  fallbackEmoji?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

export default function FoodImage({
  src,
  alt,
  fallbackEmoji = '🍱',
  className = 'w-full h-full object-cover',
  sizes = '(max-width: 768px) 100vw, 300px',
  priority = false,
}: FoodImageProps) {
  const [loadStage, setLoadStage] = useState<'next' | 'direct' | 'fallback'>('next');

  if (!src || !src.trim() || loadStage === 'fallback') {
    return (
      <div className="w-full h-full flex items-center justify-center select-none bg-emerald-600/5">
        <span className="text-3xl leading-none">{fallbackEmoji}</span>
      </div>
    );
  }

  const cleanSrc = src.trim();

  // Try Next.js Image first (optimized & cached on server)
  if (loadStage === 'next') {
    return (
      <div className="relative w-full h-full overflow-hidden">
        <Image
          src={cleanSrc}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={className}
          referrerPolicy="no-referrer"
          onError={() => setLoadStage('direct')}
        />
      </div>
    );
  }

  // Fallback to direct img tag with no-referrer
  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        src={cleanSrc}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setLoadStage('fallback')}
      />
    </div>
  );
}
