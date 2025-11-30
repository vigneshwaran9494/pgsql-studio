import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';

export interface QueryResult {
  columns: string[];
  rows: Array<Array<any>>;
  row_count: number;
}

export function useQuery() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);

  const executeQuery = async (connectionId: string, query: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<QueryResult>('execute_query', {
        request: {
          connection_id: connectionId,
          query,
        },
      });
      setResult(result);
    } catch (err: any) {
      setError(err.message || 'Query execution failed');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return { executeQuery, loading, error, result };
}
