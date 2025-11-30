import { useState } from 'react';
import { X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/Tabs';
import { Button } from './ui/Button';
import { QueryEditor } from './QueryEditor';
import { TableView } from './TableView';

export interface Tab {
  id: string;
  label: string;
  connectionId?: string;
  type?: 'query' | 'table';
  schema?: string;
  table?: string;
}

interface TabManagerProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export function TabManager({
  tabs,
  activeTab,
  onTabChange,
  onTabClose,
  onNewTab,
}: TabManagerProps) {
  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Button onClick={onNewTab}>New Query</Button>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="h-full flex flex-col">
      <div className="flex items-center border-b">
        <TabsList className="flex-1 justify-start h-auto border-0 rounded-none bg-transparent">
          {tabs.map((tab) => (
            <div key={tab.id} className="flex items-center group">
              <TabsTrigger
                value={tab.id}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
              >
                {tab.label}
              </TabsTrigger>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </TabsList>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewTab}
          className="mr-2"
        >
          +
        </Button>
      </div>
      {tabs.map((tab) => (
        <TabsContent
          key={tab.id}
          value={tab.id}
          className="flex-1 m-0 mt-0 overflow-hidden"
        >
          {tab.type === 'table' && tab.connectionId && tab.schema && tab.table ? (
            <TableView
              connectionId={tab.connectionId}
              schema={tab.schema}
              table={tab.table}
            />
          ) : (
            <QueryEditor
              connectionId={tab.connectionId}
              onConnectionChange={(id) => {
                // Update tab connection
              }}
            />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
