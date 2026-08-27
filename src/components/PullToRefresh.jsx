import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

const THRESHOLD = 64;
const MAX = 110;

export default function PullToRefresh({ onRefresh, children, className }) {
  const containerRef = useRef(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [touching, setTouching] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);

  const handleStart = useCallback(
    (clientY) => {
      if (refreshing) return;
      if ((window.scrollY || 0) > 0) {
        active.current = false;
        return;
      }
      startY.current = clientY;
      active.current = true;
      setTouching(true);
    },
    [refreshing]
  );

  const handleMove = useCallback(
    (clientY) => {
      if (!active.current || refreshing) return false;
      const delta = clientY - startY.current;
      if (delta > 0) {
        setPull(Math.min(delta * 0.5, MAX));
        return true;
      }
      return false;
    },
    [refreshing]
  );

  const handleEnd = useCallback(async () => {
    if (!active.current) return;
    active.current = false;
    setTouching(false);
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(THRESHOLD * 0.7);
      try {
        await onRefresh?.();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  }, [pull, onRefresh]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onStart = (e) => handleStart(e.touches[0].clientY);
    const onMove = (e) => {
      if (handleMove(e.touches[0].clientY)) e.preventDefault();
    };
    const onEnd = () => handleEnd();
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: true });
    el.addEventListener('touchcancel', onEnd, { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const showIndicator = pull > 0 || refreshing;

  return (
    <div ref={containerRef} className={className}>
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: touching ? 'none' : 'transform 0.25s ease'
        }}
      >
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{
            height: showIndicator ? pull : 0,
            transition: touching ? 'none' : 'height 0.25s ease'
          }}
        >
          {refreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <ArrowDown
              className="h-5 w-5 text-muted-foreground"
              style={{ transform: `rotate(${progress * 180}deg)`, transition: 'transform 0.1s linear' }}
            />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}