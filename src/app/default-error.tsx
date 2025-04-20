'use client';

import { useEffect } from 'react';

export default function DefaultError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h2>문제가 발생했습니다</h2>
      <p>잠시 후 다시 시도해 주세요.</p>
      <button
        onClick={reset}
        style={{
          padding: '8px 16px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        다시 시도
      </button>
    </div>
  );
} 