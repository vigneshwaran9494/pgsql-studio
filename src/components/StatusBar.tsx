import { ConnectionConfig } from '../hooks/useConnection';

interface StatusBarProps {
  connection?: ConnectionConfig;
  queryInfo?: {
    rowCount?: number;
    executionTime?: number;
  };
}

export function StatusBar({ connection, queryInfo }: StatusBarProps) {
  return (
    <div className="h-6 border-t bg-muted/30 flex items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-4">
        {connection ? (
          <>
            <span className="text-muted-foreground">Connected:</span>
            <span>{connection.name}</span>
            <span className="text-muted-foreground">({connection.host}:{connection.port})</span>
          </>
        ) : (
          <span className="text-muted-foreground">No connection selected</span>
        )}
      </div>
      {queryInfo && (
        <div className="flex items-center gap-4">
          {queryInfo.rowCount !== undefined && (
            <span>{queryInfo.rowCount} rows</span>
          )}
          {queryInfo.executionTime !== undefined && (
            <span>{queryInfo.executionTime}ms</span>
          )}
        </div>
      )}
    </div>
  );
}
