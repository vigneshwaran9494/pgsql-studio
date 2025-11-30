import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/Dialog';
import { ConnectionConfig } from '../hooks/useConnection';

interface ConnectionManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connection?: ConnectionConfig;
  onSaved: () => void;
}

export function ConnectionManager({
  open,
  onOpenChange,
  connection,
  onSaved,
}: ConnectionManagerProps) {
  const [formData, setFormData] = useState({
    name: connection?.name || '',
    host: connection?.host || 'localhost',
    port: connection?.port?.toString() || '5432',
    database: connection?.database || '',
    username: connection?.username || '',
    password: '',
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);

  // Update form data when connection prop changes or dialog opens
  useEffect(() => {
    if (open && connection) {
      // Editing existing connection
      setFormData({
        name: connection.name || '',
        host: connection.host || 'localhost',
        port: connection.port?.toString() || '5432',
        database: connection.database || '',
        username: connection.username || '',
        password: '', // Will be loaded separately
      });
      
      // Load password from keyring
      setLoadingPassword(true);
      invoke<string>('get_connection_password', { id: connection.id })
        .then((password) => {
          setFormData((prev) => ({ ...prev, password }));
        })
        .catch((err) => {
          console.error('Failed to load password:', err);
          // Password might not exist or keyring access failed, leave empty
        })
        .finally(() => {
          setLoadingPassword(false);
        });
    } else if (open && !connection) {
      // New connection
      setFormData({
        name: '',
        host: 'localhost',
        port: '5432',
        database: '',
        username: '',
        password: '',
      });
    }
    
    // Clear messages when dialog opens
    if (open) {
      setError(null);
      setSuccess(null);
    }
  }, [open, connection]);

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await invoke<{ success: boolean; message: string }>('test_connection', {
        request: {
          host: formData.host,
          port: parseInt(formData.port),
          database: formData.database,
          username: formData.username,
          password: formData.password,
        },
      });
      if (response.success) {
        setSuccess(response.message || 'Connection successful!');
      } else {
        setError(response.message || 'Connection test failed');
      }
    } catch (err: any) {
      setError(err.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    // Validate required fields (password is optional when editing)
    if (!formData.name || !formData.host || !formData.database || !formData.username) {
      setError('Please fill in all required fields');
      return;
    }

    // Password is required for new connections, optional for edits
    if (!connection && !formData.password) {
      setError('Password is required for new connections');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await invoke('save_connection', {
        request: {
          id: connection?.id,
          name: formData.name,
          host: formData.host,
          port: parseInt(formData.port),
          database: formData.database,
          username: formData.username,
          password: connection && !formData.password ? null : formData.password, // null for empty password when editing, password string otherwise
        },
      });
      onSaved();
      onOpenChange(false);
      setFormData({
        name: '',
        host: 'localhost',
        port: '5432',
        database: '',
        username: '',
        password: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save connection');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {connection ? 'Edit Connection' : 'New Connection'}
          </DialogTitle>
          <DialogDescription>
            Configure your PostgreSQL database connection
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Connection Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="My Database"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="host">Host</Label>
              <Input
                id="host"
                value={formData.host}
                onChange={(e) =>
                  setFormData({ ...formData, host: e.target.value })
                }
                placeholder="localhost"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="port">Port</Label>
              <Input
                id="port"
                type="number"
                value={formData.port}
                onChange={(e) =>
                  setFormData({ ...formData, port: e.target.value })
                }
                placeholder="5432"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="database">Database</Label>
            <Input
              id="database"
              value={formData.database}
              onChange={(e) =>
                setFormData({ ...formData, database: e.target.value })
              }
              placeholder="postgres"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="postgres"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">
              Password
              {connection && (
                <span className="text-muted-foreground text-xs font-normal ml-2">
                  (leave empty to keep existing)
                </span>
              )}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder={connection ? "•••••••• (leave empty to keep existing)" : "••••••••"}
              disabled={loadingPassword}
            />
            {loadingPassword && (
              <span className="text-xs text-muted-foreground">Loading password...</span>
            )}
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          {success && (
            <div className="text-sm text-green-600 dark:text-green-400">{success}</div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
