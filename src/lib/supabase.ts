import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Safe WebSocket wrapper to gracefully handle ws:// vs wss:// over HTTPS pages
const OriginalWebSocket = typeof window !== 'undefined' ? window.WebSocket : null;

const SafeWebSocket = function (this: any, url: string, protocols?: string | string[]) {
  if (!OriginalWebSocket) {
    throw new Error('No global WebSocket available');
  }
  
  let targetUrl = url;
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('ws://')) {
    targetUrl = url.replace('ws://', 'wss://');
  }

  try {
    return new OriginalWebSocket(targetUrl, protocols);
  } catch (e) {
    console.warn('Insecure or invalid WebSocket connection blocked gracefully by SafeWebSocket wrapper:', e);
    // Create a mock WebSocket object to satisfy the client without throwing uncaught errors
    const mockWS: any = {
      url: targetUrl,
      readyState: 3, // CLOSED state
      close: () => {},
      send: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      onclose: null,
      onerror: null,
      onmessage: null,
      onopen: null,
    };
    
    // Notify handlers of an error next tick
    setTimeout(() => {
      if (mockWS.onerror) {
        try {
          mockWS.onerror(new Event('error'));
        } catch (err) {}
      }
    }, 0);
    
    return mockWS;
  }
} as any;

if (OriginalWebSocket) {
  SafeWebSocket.prototype = OriginalWebSocket.prototype;
  
  // Define standard WebSocket readyState static values
  Object.defineProperty(SafeWebSocket, 'CONNECTING', { value: 0, enumerable: true });
  Object.defineProperty(SafeWebSocket, 'OPEN', { value: 1, enumerable: true });
  Object.defineProperty(SafeWebSocket, 'CLOSING', { value: 2, enumerable: true });
  Object.defineProperty(SafeWebSocket, 'CLOSED', { value: 3, enumerable: true });
}

let supabaseClient: SupabaseClient | null = null;
let fetchedUrl = '';
let fetchedAnonKey = '';
let isConfigFetched = false;

/**
 * Dynamically loads Supabase configuration from the server-side proxy endpoint.
 * This ensures that on Vercel or production hosting, the client gets the correct environment variables
 * regardless of whether they were baked in during static compile-time build.
 */
export async function initSupabaseConfig(): Promise<boolean> {
  if (isConfigFetched) return true;
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.supabaseUrl && data.supabaseAnonKey) {
        fetchedUrl = data.supabaseUrl;
        fetchedAnonKey = data.supabaseAnonKey;
        isConfigFetched = true;
        // Pre-initialize client so it's ready synchronously
        getSupabaseClient();
        return true;
      }
    }
  } catch (err) {
    console.error('[Supabase Client Config] Error fetching runtime config:', err);
  }
  return false;
}

export function getSupabaseClient(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient;
  }

  let supabaseUrl = '';
  let supabaseAnonKey = '';

  try {
    // @ts-ignore
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || '';
    // @ts-ignore
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || '';
  } catch (e) {
    // Fail-safe fallback if import.meta.env is not defined or locked
  }

  // Backup fallback to process.env or window values for robust configuration loading
  if (!supabaseUrl) {
    try {
      supabaseUrl = (process as any).env?.VITE_SUPABASE_URL || (process as any).env?.SUPABASE_URL || (window as any)._env_?.VITE_SUPABASE_URL || (window as any)._env_?.SUPABASE_URL || '';
    } catch (_) {}
  }
  if (!supabaseAnonKey) {
    try {
      supabaseAnonKey = (process as any).env?.VITE_SUPABASE_ANON_KEY || (process as any).env?.SUPABASE_ANON_KEY || (window as any)._env_?.VITE_SUPABASE_ANON_KEY || (window as any)._env_?.SUPABASE_ANON_KEY || '';
    } catch (_) {}
  }

  // If statically compiled variables are empty, fall back to dynamically fetched runtime variables
  if (!supabaseUrl) {
    supabaseUrl = fetchedUrl;
  }
  if (!supabaseAnonKey) {
    supabaseAnonKey = fetchedAnonKey;
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  // Auto-upgrade insecure http:// to https:// in production secure context
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    if (supabaseUrl.startsWith('http://')) {
      supabaseUrl = supabaseUrl.replace('http://', 'https://');
    }
  }

  try {
    // Pass the safe WebSocket wrapper specifically to Supabase Realtime options
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: OriginalWebSocket ? {
        WebSocket: SafeWebSocket
      } : undefined
    } as any);
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

