# Supabase MCP Server Integration

This directory contains the Model Context Protocol (MCP) server implementation for the DoGoods app, enabling AI assistants to interact directly with your Supabase database.

## 📋 Quick Start

### Windows

```powershell
.\mcp-server\setup.bat
```

### macOS/Linux

```bash
chmod +x mcp-server/setup.sh
./mcp-server/setup.sh
```

### Manual Setup

```bash
cd mcp-server
npm install
npm start
```

## 🎯 What is MCP?

Model Context Protocol (MCP) is an open standard that allows AI assistants like GitHub Copilot to connect to external data sources and tools. The Supabase MCP server enables Copilot to:

- Query your database tables
- Insert, update, and delete records
- Count records with filters
- Access table schema information
- Browse available database resources

## 🔧 Configuration

The MCP server is automatically configured for GitHub Copilot in `.vscode/settings.json`. It uses your existing Supabase credentials from environment variables.

### Required Environment Variables

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 💡 Usage Examples

Once configured, you can interact with your database through GitHub Copilot Chat:

**Query data:**

- "Show me the latest 10 food listings"
- "Get all pending food claims"
- "Find admin users"

**Insert data:**

- "Add a new food listing for fresh vegetables"

**Analytics:**

- "How many food items are currently available?"
- "Count community posts from last week"

**Schema exploration:**

- "What columns does the users table have?"
- "Show me the structure of food_listings"

## 🔐 Security

- The MCP server uses the **anon key** (not service role)
- All operations respect Supabase **Row Level Security** policies
- Runs locally - no external network exposure
- Communication via stdio (standard input/output) only

## 📚 Documentation

See [mcp-server/README.md](mcp-server/README.md) for detailed documentation including:

- Available tools and parameters
- Table schemas
- Advanced usage
- Troubleshooting
- Development guide

## 🧪 Testing

Test the server independently:

```bash
cd mcp-server
npm start
```

The server should output:

```
✅ Supabase MCP Server running on stdio
```

## 🐛 Troubleshooting

**Server won't start:**

- Check environment variables are set
- Verify Node.js version 18+: `node --version`
- Ensure dependencies installed: `cd mcp-server && npm install`

**MCP not appearing in Copilot:**

- Restart VS Code after setup
- Check GitHub Copilot extension is updated
- Verify MCP is enabled in VS Code settings

**Permission errors:**

- Review Supabase RLS policies
- Check anon key permissions
- Consult Supabase logs

## 📖 Learn More

- [Model Context Protocol](https://modelcontextprotocol.io)
- [GitHub Copilot MCP Support](https://code.visualstudio.com/docs/copilot/copilot-mcp)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
