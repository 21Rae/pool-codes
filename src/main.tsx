import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initSupabaseConfig } from './lib/supabase.ts';

async function bootstrap() {
  try {
    // Dynamically retrieve configured public keys from the server at startup
    await initSupabaseConfig();
  } catch (err) {
    console.warn('[Bootstrap] Deferred dynamic config retrieval:', err);
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

bootstrap();
