'use client';

import { useCountUp } from '@/hooks/useCountup';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
}

export function AnimatedNumber({
  value,
  duration = 1200,
  format,
  className,
}: AnimatedNumberProps) {
  const animated = useCountUp(value, duration);
  const display = format ? format(animated) : animated.toLocaleString('en-US');
  return <span className={className}>{display}</span>;
}