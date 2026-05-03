import { useState } from 'react';
import { SampleButton } from '@tiglemp/ui';

function App() {
  const [count, setCount] = useState(0);

  return (
    <main
      style={{
        fontFamily: 'system-ui, sans-serif',
        maxWidth: 640,
        margin: '4rem auto',
        padding: '0 1rem',
      }}
    >
      <p style={{ color: '#2563eb', fontWeight: 600, margin: 0 }}>
        tiglemp.com
      </p>
      <h1 style={{ marginTop: '0.25rem' }}>Customer Portal</h1>
      <p style={{ color: '#4b5563' }}>
        Public marketing site + customer booking experience.
      </p>

      <SampleButton onClick={() => setCount((n) => n + 1)}>
        Clicked {count} times
      </SampleButton>
    </main>
  );
}

export default App;
