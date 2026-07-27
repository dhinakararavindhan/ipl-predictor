'use client';

import { useEffect, useRef } from 'react';
import { useIPLStore } from '@/lib/store';

/**
 * Invisible component — runs the initial simulation once on mount.
 */
export function SimulationRunner() {
  const runSimulations = useIPLStore((s) => s.runSimulations);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      runSimulations();
    }
  }, [runSimulations]);

  return null;
}
