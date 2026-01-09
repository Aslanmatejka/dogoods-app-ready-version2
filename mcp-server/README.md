# DoGoods Supabase MCP Server

This Model Context Protocol (MCP) server provides AI assistants with direct access to your DoGoods Supabase database.

## Features

- **Query Operations**: Read data from any table with filtering, ordering, and limits
- **CRUD Operations**: Insert, update, and delete records
- **Schema Access**: Get table structure and column information
- **Count Records**: Get record counts with optional filtering
- **Resource Browsing**: List and explore available database tables

## Setup

### 1. Install Dependencies

```bash
cd mcp-server
npm install
```

### 2. Configure Environment Variables

The server uses the same Supabase credentials as your main app. Ensure these are set in your environment:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. VS Code Integration

The MCP server is automatically configured in `.vscode/settings.json`. GitHub Copilot will detect and use it when enabled.

To enable MCP in GitHub Copilot:

1. Open VS Code Settings (Ctrl+,)
2. Search for "MCP"
3. Ensure "GitHub Copilot: Chat: MCP: Enabled" is checked

### 4. Test the Server

Run the server standalone:

```bash
cd mcp-server
npm start
```

Or with auto-reload:

```bash
npm run dev
```

## Available Tools

### `query_table`

Query data from a table with filtering and ordering.

**Example:**

```json
{
  "table": "food_listings",
  "select": "id, title, status",
  "filter": { "status": "available" },
  "orderBy": { "column": "created_at", "ascending": false },
  "limit": 10
}
```

### `insert_record`

Insert a new record into a table.

**Example:**

```json
{
  "table": "food_listings",
  "data": {
    "user_id": "123",
    "title": "Fresh Vegetables",
    "category": "produce",
    "quantity": 10,
    "unit": "lbs"
  }
}
```

### `update_record`

Update existing records.

**Example:**

```json
{
  "table": "food_listings",
  "filter": { "id": "abc123" },
  "data": { "status": "claimed" }
}
```

### `delete_record`

Delete records matching filter criteria.

**Example:**

```json
{
  "table": "food_claims",
  "filter": { "status": "expired" }
}
```

### `count_records`

Count records with optional filtering.

**Example:**

```json
{
  "table": "users",
  "filter": { "is_admin": true }
}
```

### `get_table_schema`

Get schema information for a table.

**Example:**

```json
{
  "table": "food_listings"
}
```

## Available Tables

- **users**: User profiles and authentication data
- **food_listings**: Available food items for sharing
- **food_claims**: Claims made on food listings
- **community_posts**: Community discussion posts
- **feedback**: User feedback submissions

## Usage in GitHub Copilot Chat

Once configured, you can ask Copilot to interact with your database:

**Example prompts:**

- "Show me the latest 5 food listings"
- "How many admin users are there?"
- "Get all pending food claims"
- "What's the schema of the users table?"

## Security Considerations

⚠️ **Important Security Notes:**

1. The MCP server uses the `SUPABASE_ANON_KEY`, which respects Row Level Security (RLS) policies
2. Only operations allowed by your Supabase RLS policies will succeed
3. Never expose service_role keys through MCP
4. The server runs locally and doesn't expose any network ports
5. All communication happens via stdio (standard input/output)

## Troubleshooting

### Server won't start

- Verify environment variables are set: `echo $VITE_SUPABASE_URL`
- Check that dependencies are installed: `npm install`
- Ensure Node.js version is 18+ : `node --version`

### MCP not showing in Copilot

- Restart VS Code after updating `.vscode/settings.json`
- Check VS Code output panel for MCP server logs
- Verify GitHub Copilot extension is up to date

### Permission errors

- Check your Supabase RLS policies
- Verify the anon key has appropriate permissions
- Review Supabase logs for denied operations

## Development

To modify the server:

1. Edit `supabase-server.js`
2. Add new tools in the `ListToolsRequestSchema` handler
3. Implement tool logic in the `CallToolRequestSchema` handler
4. Update TABLES constant if adding new table support
5. Restart the server (automatic with `npm run dev`)

## Learn More

- [Model Context Protocol Documentation](https://modelcontextprotocol.io)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [GitHub Copilot MCP Integration](https://code.visualstudio.com/docs/copilot/copilot-mcp)
