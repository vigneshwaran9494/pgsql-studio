# Quick Start Guide

## How to Run the App

### Step 1: Install Dependencies

```bash
# Install Node.js dependencies
pnpm install

# Rust dependencies will be installed automatically when you run the app
# But you can also install them manually:
cd src-tauri
cargo build
cd ..
```

### Step 2: Run in Development Mode

```bash
pnpm tauri dev
```

This command will:
1. Start the Vite dev server (frontend)
2. Compile the Rust backend
3. Launch the Tauri application window

**Note**: The first run may take a few minutes as it compiles Rust dependencies.

### Step 3: Build for Production

```bash
pnpm tauri build
```

This creates platform-specific installers in `src-tauri/target/release/bundle/`

## Testing the Application

### 1. Create Your First Connection

1. **Launch the app** using `pnpm tauri dev`
2. **Click the "+" button** in the sidebar (top right of connections panel)
3. **Fill in connection details**:
   - Connection Name: `Local PostgreSQL` (or any name)
   - Host: `localhost` (or your PostgreSQL server)
   - Port: `5432` (default PostgreSQL port)
   - Database: `postgres` (or your database name)
   - Username: `postgres` (or your username)
   - Password: Your PostgreSQL password
4. **Click "Test Connection"** to verify it works
5. **Click "Save"** to store the connection

### 2. Execute a Query

1. **Select your connection** from the sidebar
2. **Type a SQL query** in the editor, for example:
   ```sql
   SELECT version();
   ```
   or
   ```sql
   SELECT * FROM pg_database;
   ```
3. **Press Cmd+Enter** (Mac) or **Ctrl+Enter** (Windows/Linux) or click the **Execute** button
4. **View results** in the table below the editor

### 3. Test Keyboard Shortcuts

- **Cmd/Ctrl + Enter**: Execute current query
- **Cmd/Ctrl + T**: Create new query tab
- **Cmd/Ctrl + W**: Close current tab
- **Cmd/Ctrl + K**: Toggle dark/light theme

### 4. Test Multiple Tabs

1. Press **Cmd/Ctrl + T** to create a new tab
2. Each tab can have its own query
3. Switch between tabs by clicking on them
4. Close tabs with **Cmd/Ctrl + W** or the X button

### 5. Test Theme Toggle

1. Click the **theme toggle switch** in the header (sun/moon icon)
2. Or press **Cmd/Ctrl + K**
3. The entire UI should switch between light and dark themes

## Troubleshooting

### App won't start

**Error: "Command not found: tauri"**
```bash
pnpm install
```

**Error: Rust compilation fails**
```bash
# Update Rust
rustup update stable

# Clean and rebuild
cd src-tauri
cargo clean
cargo build
cd ..
```

### Connection fails

1. **Verify PostgreSQL is running**:
   ```bash
   # macOS/Linux
   pg_isready
   
   # Or check if postgres process is running
   ps aux | grep postgres
   ```

2. **Check connection details**:
   - Ensure host, port, database name, and credentials are correct
   - For remote connections, ensure PostgreSQL allows connections from your IP

3. **Test connection manually**:
   ```bash
   psql -h localhost -p 5432 -U postgres -d postgres
   ```

### Monaco Editor not loading

- Clear browser cache
- Restart the dev server
- Check console for errors

### Keyring errors (Linux)

Install required system dependency:
```bash
sudo apt-get install libsecret-1-dev
```

## Development Tips

### Run Frontend Only (Faster UI Development)

```bash
pnpm dev
```

This runs only the Vite dev server without Tauri, useful for rapid UI iteration.

### View Logs

- **Frontend logs**: Check browser DevTools console
- **Rust/Backend logs**: Check the terminal where you ran `pnpm tauri dev`

### Hot Reload

- Frontend changes: Automatically reloads
- Rust changes: Requires restart (`pnpm tauri dev`)

## Next Steps

Once you have the basic app running:

1. **Explore the UI**: Try different queries, create multiple connections
2. **Test ERD**: When implemented, view database relationships
3. **Test Table Editing**: Edit table data inline (when implemented)
4. **Customize**: Modify themes, add features

## Common Test Queries

Here are some safe queries to test with:

```sql
-- Check PostgreSQL version
SELECT version();

-- List all databases
SELECT datname FROM pg_database;

-- List all tables in current database
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Get table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'your_table_name';

-- Simple SELECT
SELECT * FROM pg_database LIMIT 5;
```
