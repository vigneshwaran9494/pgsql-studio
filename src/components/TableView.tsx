import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/Table';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface TableViewProps {
  connectionId: string;
  schema: string;
  table: string;
}

export function TableView({ connectionId, schema, table }: TableViewProps) {
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');

  // Load table data
  const loadData = async () => {
    setLoading(true);
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const result = await invoke('get_table_data', {
        request: {
          connection_id: connectionId,
          schema,
          table,
          limit: 100,
          offset: 0,
        },
      });
      setData(result.rows || []);
      setColumns(result.columns || []);
    } catch (error) {
      console.error('Failed to load table data:', error);
    } finally {
      setLoading(false);
    }
  };

  // This would be called when component mounts or connection/table changes
  // useEffect(() => { loadData(); }, [connectionId, schema, table]);

  const handleCellClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    setEditValue(data[row]?.[col] || '');
  };

  const handleSave = () => {
    if (editingCell) {
      const newData = [...data];
      newData[editingCell.row][editingCell.col] = editValue;
      setData(newData);
      setEditingCell(null);
      // TODO: Save to database
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">
          {schema}.{table}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!editingCell}>
            Save Changes
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {row.map((cell: any, colIdx: number) => (
                  <TableCell
                    key={colIdx}
                    onClick={() => handleCellClick(rowIdx, colIdx)}
                    className="cursor-pointer"
                  >
                    {editingCell?.row === rowIdx && editingCell?.col === colIdx ? (
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSave();
                          } else if (e.key === 'Escape') {
                            setEditingCell(null);
                          }
                        }}
                        autoFocus
                      />
                    ) : (
                      cell === null ? (
                        <span className="text-muted-foreground">NULL</span>
                      ) : (
                        String(cell)
                      )
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
