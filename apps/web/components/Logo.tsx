import Image from 'next/image';

/** Intrinsic size of public/logo-mark.png, used to keep the aspect ratio exact. */
const MARK_W = 512;
const MARK_H = 309;

interface LogoProps {
  /** Rendered height of the mark in px. */
  size?: number;
  /** Omit the wordmark to show the mark alone. */
  withWordmark?: boolean;
  /** Light text for dark surfaces. */
  tone?: 'dark' | 'light';
  className?: string;
}

export default function Logo({ size = 26, withWordmark = true, tone = 'dark', className = '' }: LogoProps) {
  const width = Math.round((size * MARK_W) / MARK_H);

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Image
        src="/logo-mark.png"
        alt=""
        width={width}
        height={size}
        priority
        className="shrink-0 transition-transform duration-500 ease-spring group-hover:scale-105"
      />
      {withWordmark ? (
        <span
          className={`text-[0.95rem] font-semibold tracking-tight sm:text-base ${
            tone === 'light' ? 'text-white' : 'text-ink'
          }`}
        >
          Stack<span className="text-sky-500">Forge</span>
        </span>
      ) : null}
    </span>
  );
}
