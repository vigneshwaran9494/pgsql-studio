import { useState } from 'react';
import { Database, Plus, MoreVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import { useConnections, ConnectionConfig } from '../hooks/useConnection';
import { ConnectionManager } from './ConnectionManager';

interface SidebarProps {
  selectedConnectionId?: string;
  onConnectionSelect: (id: string) => void;
}

export function Sidebar({ selectedConnectionId, onConnectionSelect }: SidebarProps) {
  const { connections, reload } = useConnections();
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [editingConnection, setEditingConnection] = useState<ConnectionConfig | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewConnection = () => {
    setEditingConnection(undefined);
    setConnectionDialogOpen(true);
  };

  const handleEditConnection = (conn: ConnectionConfig) => {
    setEditingConnection(conn);
    setConnectionDialogOpen(true);
  };

  const handleDeleteConnection = async (id: string) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('delete_connection', { id });
        reload();
      } catch (error) {
        console.error('Failed to delete connection:', error);
      }
    }
  };

  const filteredConnections = connections.filter((conn) =>
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="w-64 border-r bg-muted/30 flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold">Connections</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNewConnection}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Input
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="flex-1 overflow-auto">
          {filteredConnections.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground text-center">
              {connections.length === 0
                ? 'No connections. Create one to get started.'
                : 'No connections match your search.'}
            </div>
          ) : (
            <div className="p-2">
              {filteredConnections.map((conn) => (
                <div
                  key={conn.id}
                  className={`group flex items-center justify-between p-2 rounded hover:bg-accent cursor-pointer ${
                    selectedConnectionId === conn.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => onConnectionSelect(conn.id)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Database className="h-4 w-4 shrink-0" />
                    <span className="text-sm truncate">{conn.name}</span>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      onClick={(e) => e.stopPropagation()}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditConnection(conn)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteConnection(conn.id)}
                        className="text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ConnectionManager
        open={connectionDialogOpen}
        onOpenChange={setConnectionDialogOpen}
        connection={editingConnection}
        onSaved={() => {
          reload();
          setConnectionDialogOpen(false);
        }}
      />
    </>
  );
}
