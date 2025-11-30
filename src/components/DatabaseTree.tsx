import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ChevronRight, ChevronDown, Database, Folder, Table as TableIcon } from 'lucide-react';

interface SchemaInfo {
  name: string;
}

interface TableInfo {
  name: string;
  schema: string;
}

interface DatabaseTreeProps {
  connectionId: string;
  onTableSelect?: (schema: string, table: string) => void;
}

export function DatabaseTree({ connectionId, onTableSelect }: DatabaseTreeProps) {
  const [expandedSchemas, setExpandedSchemas] = useState<Set<string>>(new Set());
  const [schemas, setSchemas] = useState<SchemaInfo[]>([]);
  const [tables, setTables] = useState<Map<string, TableInfo[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [loadingSchemas, setLoadingSchemas] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (connectionId) {
      loadSchemas();
    } else {
      setSchemas([]);
      setTables(new Map());
      setExpandedSchemas(new Set());
    }
  }, [connectionId]);

  const loadSchemas = async () => {
    if (!connectionId) return;
    
    setLoading(true);
    try {
      const result = await invoke<SchemaInfo[]>('get_schemas', {
        request: { connection_id: connectionId },
      });
      setSchemas(result);
    } catch (error) {
      console.error('Failed to load schemas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async (schema: string) => {
    if (!connectionId || tables.has(schema)) return;

    setLoadingSchemas((prev) => new Set(prev).add(schema));
    try {
      const result = await invoke<TableInfo[]>('get_tables', {
        request: {
          connection_id: connectionId,
          schema,
        },
      });
      setTables((prev) => {
        const newMap = new Map(prev);
        newMap.set(schema, result);
        return newMap;
      });
    } catch (error) {
      console.error(`Failed to load tables for schema ${schema}:`, error);
    } finally {
      setLoadingSchemas((prev) => {
        const newSet = new Set(prev);
        newSet.delete(schema);
        return newSet;
      });
    }
  };

  const toggleSchema = (schema: string) => {
    const isExpanded = expandedSchemas.has(schema);
    if (isExpanded) {
      setExpandedSchemas((prev) => {
        const newSet = new Set(prev);
        newSet.delete(schema);
        return newSet;
      });
    } else {
      setExpandedSchemas((prev) => new Set(prev).add(schema));
      loadTables(schema);
    }
  };

  const handleTableClick = (schema: string, table: string) => {
    if (onTableSelect) {
      onTableSelect(schema, table);
    }
  };

  if (!connectionId) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Select a connection to view database structure
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Loading schemas...
      </div>
    );
  }

  if (schemas.length === 0) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        No schemas found
      </div>
    );
  }

  return (
    <div className="p-2">
      {schemas.map((schema) => {
        const isExpanded = expandedSchemas.has(schema.name);
        const schemaTables = tables.get(schema.name) || [];
        const isLoading = loadingSchemas.has(schema.name);

        return (
          <div key={schema.name} className="select-none">
            {/* Schema Node */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent cursor-pointer group"
              onClick={() => toggleSchema(schema.name)}
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3 shrink-0" />
              ) : (
                <ChevronRight className="h-3 w-3 shrink-0" />
              )}
              <Folder className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="text-sm truncate flex-1">{schema.name}</span>
            </div>

            {/* Tables */}
            {isExpanded && (
              <div className="ml-4 mt-1">
                {isLoading ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    Loading tables...
                  </div>
                ) : schemaTables.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">
                    No tables
                  </div>
                ) : (
                  schemaTables.map((table) => (
                    <div
                      key={`${schema.name}.${table.name}`}
                      className="flex items-center gap-1 px-2 py-1 rounded hover:bg-accent cursor-pointer group"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTableClick(schema.name, table.name);
                      }}
                    >
                      <div className="w-3 shrink-0" /> {/* Spacer for alignment */}
                      <TableIcon className="h-3 w-3 shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate flex-1">{table.name}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
