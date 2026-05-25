import { useState, useEffect } from 'react';

import type { ApiResponse } from '@monorepo/shared';

export function App() {
  const [status, setStatus] = useState<string>('loading...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data: ApiResponse) => {
        setStatus(data.success ? 'Connected' : 'Error');
      })
      .catch(() => setStatus('Offline'));
  }, []);

  return (
    <main>
      <h1>Monorepo Frontend</h1>
      <p>API Status: {status}</p>
    </main>
  );
}
