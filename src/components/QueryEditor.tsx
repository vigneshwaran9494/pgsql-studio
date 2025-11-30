import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Play } from 'lucide-react';
import { Button } from './ui/Button';
import { useQuery } from '../hooks/useQuery';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/Table';
import { setupMonaco } from '../lib/monaco-setup';

interface QueryEditorProps {
  connectionId?: string;
  onConnectionChange?: (id: string) => void;
}

export function QueryEditor({ connectionId, onConnectionChange }: QueryEditorProps) {
  const [query, setQuery] = useState('SELECT * FROM ');
  const [editorTheme, setEditorTheme] = useState<'light' | 'vs-dark'>('vs-dark');
  const { executeQuery, loading, error, result } = useQuery();
  const editorRef = useRef<any>(null);

  useEffect(() => {
    setupMonaco();
    const isDark = document.documentElement.classList.contains('dark');
    setEditorTheme(isDark ? 'vs-dark' : 'light');
  }, []);

  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setEditorTheme(isDark ? 'vs-dark' : 'light');
    };

    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleExecute = () => {
    if (!connectionId) {
      alert('Please select a connection first');
      return;
    }
    if (!query.trim()) {
      return;
    }
    executeQuery(connectionId, query);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 border-b">
        <Button
          onClick={handleExecute}
          disabled={loading || !connectionId}
          size="sm"
        >
          <Play className="h-4 w-4 mr-2" />
          {loading ? 'Executing...' : 'Execute'}
        </Button>
        <span className="text-xs text-muted-foreground">
          Cmd/Ctrl+Enter to execute
        </span>
      </div>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 border-b">
          <Editor
            height="100%"
            language="sql"
            theme={editorTheme}
            value={query}
            onChange={(value) => setQuery(value || '')}
            onMount={(editor) => {
              editorRef.current = editor;
              editor.onKeyDown((e) => {
                if ((e.metaKey || e.ctrlKey) && e.keyCode === 3) {
                  e.preventDefault();
                  handleExecute();
                }
              });
            }}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
            }}
          />
        </div>
        <div className="flex-1 overflow-auto">
          {error && (
            <div className="p-4 text-destructive bg-destructive/10">
              <strong>Error:</strong> {error}
            </div>
          )}
          {result && (
            <div className="p-4">
              <div className="mb-2 text-sm text-muted-foreground">
                {result.row_count} row{result.row_count !== 1 ? 's' : ''}
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    {result.columns.map((col) => (
                      <TableHead key={col}>{col}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {row.map((cell: any, cellIdx: number) => (
                        <TableCell key={cellIdx}>
                          {cell === null ? (
                            <span className="text-muted-foreground">NULL</span>
                          ) : typeof cell === 'object' ? (
                            JSON.stringify(cell)
                          ) : (
                            String(cell)
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
