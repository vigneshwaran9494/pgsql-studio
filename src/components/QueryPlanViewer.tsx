import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/Table';

interface QueryPlanViewerProps {
  connectionId: string;
  query: string;
}

export function QueryPlanViewer({ connectionId, query }: QueryPlanViewerProps) {
  const [plan, setPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query && connectionId) {
      loadPlan();
    }
  }, [query, connectionId]);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const result = await invoke<string>('explain_query', {
        request: {
          connection_id: connectionId,
          query,
        },
      });
      setPlan(result);
    } catch (error) {
      console.error('Failed to load query plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4">Loading plan...</div>;
  }

  return (
    <div className="p-4">
      <pre className="bg-muted p-4 rounded-md overflow-auto text-sm font-mono">
        {plan || 'No plan available. Execute a query to see its execution plan.'}
      </pre>
    </div>
  );
}
