import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { TabManager, Tab } from './components/TabManager';
import { StatusBar } from './components/StatusBar';
import { useTheme } from './hooks/useTheme';
import { useConnections } from './hooks/useConnection';
import { Switch } from './components/ui/Switch';
import { Moon, Sun } from 'lucide-react';

function App() {
  const { theme, toggleTheme } = useTheme();
  const { connections } = useConnections();
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | undefined>();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: '1', label: 'Query 1', connectionId: undefined, type: 'query' },
  ]);
  const [activeTab, setActiveTab] = useState('1');

  const handleNewTab = useCallback(() => {
    const newTabId = String(Date.now());
    const newTab: Tab = {
      id: newTabId,
      label: `Query ${tabs.length + 1}`,
      connectionId: selectedConnectionId,
      type: 'query',
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(newTabId);
  }, [tabs.length, selectedConnectionId]);

  const handleTabClose = useCallback((tabId: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      if (newTabs.length > 0 && activeTab === tabId) {
        setActiveTab(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  const handleConnectionSelect = (connectionId: string) => {
    setSelectedConnectionId(connectionId);
    // Update active tab's connection
    setTabs(
      tabs.map((tab) =>
        tab.id === activeTab ? { ...tab, connectionId } : tab
      )
    );
  };

  const handleTableSelect = useCallback((schema: string, table: string) => {
    if (!selectedConnectionId) return;
    
    const tabId = String(Date.now());
    const newTab: Tab = {
      id: tabId,
      label: `${schema}.${table}`,
      connectionId: selectedConnectionId,
      type: 'table',
      schema,
      table,
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTab(tabId);
  }, [selectedConnectionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K to toggle theme
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleTheme();
      }
      // Cmd/Ctrl+T for new tab
      if ((e.metaKey || e.ctrlKey) && e.key === 't') {
        e.preventDefault();
        handleNewTab();
      }
      // Cmd/Ctrl+W to close tab
      if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
        e.preventDefault();
        if (tabs.length > 1) {
          handleTabClose(activeTab);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, tabs, activeTab, handleNewTab, handleTabClose]);

  return (
    <div className="h-screen flex flex-col dark">
      {/* Header */}
      <div className="h-12 border-b flex items-center justify-between px-4 bg-background">
        <h1 className="font-semibold text-lg">PostgreSQL Studio</h1>
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" />
          <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          <Moon className="h-4 w-4" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <Sidebar
          selectedConnectionId={selectedConnectionId}
          onConnectionSelect={handleConnectionSelect}
          onTableSelect={handleTableSelect}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <TabManager
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onTabClose={handleTabClose}
            onNewTab={handleNewTab}
          />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        connection={
          selectedConnectionId
            ? connections.find((c) => c.id === selectedConnectionId)
            : undefined
        }
      />
    </div>
  );
}

export default App;
