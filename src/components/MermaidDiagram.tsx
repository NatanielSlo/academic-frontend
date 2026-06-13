import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default' });

let idCounter = 0;

export const MermaidDiagram = ({ code }: { code: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const id = useRef(`mermaid-${++idCounter}`);

  useEffect(() => {
    if (!ref.current) return;
    setError('');
    mermaid
      .render(id.current, code)
      .then(({ svg }) => {
        if (ref.current) ref.current.innerHTML = svg;
      })
      .catch((err) => {
        setError(err?.message || 'Failed to render diagram');
      });
  }, [code]);

  if (error) {
    return (
      <pre className="text-sm text-red-500 bg-red-50 p-3 rounded overflow-x-auto">
        {code}
      </pre>
    );
  }

  return <div ref={ref} className="my-4 flex justify-center overflow-x-auto" />;
};
