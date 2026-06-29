import { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number;
}

export default function StreamingText({ text, speed = 14 }: StreamingTextProps) {
  const [displayed, setDisplayed] = useState('');
  const [streaming, setStreaming] = useState(false);
  const prevTextRef = useRef('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!text) { setDisplayed(''); prevTextRef.current = ''; return; }

    if (text.startsWith(prevTextRef.current)) {
      const diff = text.slice(prevTextRef.current.length);
      if (!diff) return;
      let i = 0;
      setStreaming(true);
      const step = () => {
        setDisplayed(prev => {
          const next = prev + diff[i];
          prevTextRef.current = next;
          return next;
        });
        i++;
        if (i < diff.length) { timerRef.current = setTimeout(step, speed); }
        else { setStreaming(false); }
      };
      timerRef.current = setTimeout(step, speed);
    } else {
      setDisplayed('');
      prevTextRef.current = '';
      let i = 0;
      setStreaming(true);
      const step = () => {
        setDisplayed(prev => {
          const next = prev + text[i];
          prevTextRef.current = next;
          return next;
        });
        i++;
        if (i < text.length) { timerRef.current = setTimeout(step, speed); }
        else { setStreaming(false); }
      };
      timerRef.current = setTimeout(step, speed);
    }

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {streaming && (
        <span className="inline-block w-[2px] h-[1em] bg-current align-middle ml-[1px] animate-pulse" />
      )}
    </span>
  );
}
