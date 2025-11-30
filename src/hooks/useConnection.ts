import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect } from 'react';

export interface ConnectionConfig {
  id: string;
  name: string;
  host: string;
  port: number;
  database: string;
  username: string;
}

export function useConnections() {
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const result = await invoke<ConnectionConfig[]>('get_connections');
      setConnections(result);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);

  return { connections, loading, reload: loadConnections };
}
