# PostgreSQL Studio

A modern desktop application for managing PostgreSQL databases, built with Tauri, React, TypeScript, Tailwind CSS, and Radix UI.

## Features

- 🔐 Secure credential storage using system keyring
- 📝 SQL query editor with Monaco Editor
- 📊 Table data viewing and editing
- 🔗 ERD (Entity Relationship Diagram) visualization
- 📈 Query execution plan viewer
- 🎨 Dark/light theme support
- ⌨️ Keyboard shortcuts for productivity

## Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v18 or higher) and pnpm - [Install pnpm](https://pnpm.io/installation)
2. **Rust** (latest stable version) - [Install Rust](https://www.rust-lang.org/tools/install)
3. **System dependencies for Tauri**:
   - **macOS**: Xcode Command Line Tools
   - **Linux**: `libwebkit2gtk-4.0-dev`, `build-essential`, `curl`, `wget`, `libssl-dev`, `libgtk-3-dev`, `libayatana-appindicator3-dev`, `librsvg2-dev`
   - **Windows**: Microsoft Visual Studio C++ Build Tools

## Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd pgsql-studio
   ```

2. **Install frontend dependencies**:
   ```bash
   pnpm install
   ```

3. **Install Rust dependencies** (this happens automatically when you run the app, but you can also do it manually):
   ```bash
   cd src-tauri
   cargo build
   cd ..
   ```

## Running the Application

### Development Mode

To run the application in development mode:

```bash
pnpm tauri dev
```

This will:
- Start the Vite dev server for the frontend
- Compile the Rust backend
- Launch the Tauri application window

The app will automatically reload when you make changes to the frontend code.

### Build for Production

To build the application for production:

```bash
pnpm tauri build
```

This will create platform-specific installers:
- **macOS**: `.app` bundle in `src-tauri/target/release/bundle/macos/`
- **Linux**: `.AppImage` and `.deb` packages in `src-tauri/target/release/bundle/`
- **Windows**: `.msi` installer in `src-tauri/target/release/bundle/msi/`

## Testing the Application

### 1. Create a Database Connection

1. Launch the application
2. Click the **+** button in the sidebar to create a new connection
3. Fill in the connection details:
   - **Connection Name**: A friendly name for your connection
   - **Host**: Your PostgreSQL server host (e.g., `localhost`)
   - **Port**: PostgreSQL port (default: `5432`)
   - **Database**: Database name
   - **Username**: PostgreSQL username
   - **Password**: PostgreSQL password
4. Click **Test Connection** to verify the connection works
5. Click **Save** to store the connection

### 2. Execute SQL Queries

1. Select a connection from the sidebar
2. The query editor will be available in the main tab
3. Type your SQL query in the Monaco editor
4. Press **Cmd/Ctrl+Enter** or click the **Execute** button
5. View results in the table below the editor

### 3. Test Keyboard Shortcuts

- **Cmd/Ctrl+Enter**: Execute query
- **Cmd/Ctrl+T**: New query tab
- **Cmd/Ctrl+W**: Close current tab
- **Cmd/Ctrl+K**: Toggle dark/light theme

### 4. Test Table Viewing

1. Select a connection
2. In the sidebar, expand the database tree (when implemented)
3. Click on a table to view its data
4. Use the table viewer to browse and edit data

### 5. Test ERD Visualization

1. Select a connection
2. Navigate to the ERD view (when implemented)
3. View the database schema relationships

## Project Structure

```
pgsql-studio/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── styles/             # Global styles
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/       # Tauri command handlers
│   │   ├── db/             # Database abstractions
│   │   ├── security/       # Credential encryption
│   │   └── models.rs       # Data structures
│   └── Cargo.toml          # Rust dependencies
└── package.json            # Frontend dependencies
```

## Troubleshooting

### Common Issues

1. **"Command not found: tauri"**
   - Make sure you've run `pnpm install` to install all dependencies including `@tauri-apps/cli`

2. **Rust compilation errors**
   - Ensure you have the latest stable Rust version: `rustup update stable`
   - Try cleaning the build: `cd src-tauri && cargo clean && cd ..`

3. **Keyring errors on Linux**
   - Install required system dependencies:
     ```bash
     sudo apt-get install libsecret-1-dev
     ```

4. **PostgreSQL connection fails**
   - Verify PostgreSQL is running: `pg_isready`
   - Check connection details (host, port, credentials)
   - Ensure PostgreSQL allows connections from your IP address

5. **Monaco Editor not loading**
   - Clear browser cache and restart the dev server
   - Check browser console for errors

### Development Tips

- Use `pnpm dev` to run only the frontend (without Tauri) for faster UI development
- Check Rust logs in the terminal where you ran `pnpm tauri dev`
- Use browser DevTools (when running frontend only) or Tauri DevTools for debugging

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]
