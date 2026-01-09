# 🚀 Supabase MCP Server - Quick Reference

## Setup (One-time)

```bash
# Windows
.\mcp-server\setup.bat

# macOS/Linux
./mcp-server/setup.sh

# Or manually
npm run mcp:setup
```

**Then restart VS Code!**

## Available Tools

| Tool               | Purpose         | Example                          |
| ------------------ | --------------- | -------------------------------- |
| `query_table`      | Read data       | "Show me recent food listings"   |
| `insert_record`    | Create new      | "Add a food listing for apples"  |
| `update_record`    | Modify existing | "Mark listing abc123 as claimed" |
| `delete_record`    | Remove data     | "Delete expired claims"          |
| `count_records`    | Count rows      | "How many active users?"         |
| `get_table_schema` | View structure  | "What columns in users table?"   |

## Database Tables

- `users` - User profiles & auth
- `food_listings` - Available food items
- `food_claims` - Claims on listings
- `community_posts` - Discussion posts
- `feedback` - User feedback

## Quick Commands

```bash
# Test server
npm run mcp:start

# Run with auto-reload
npm run mcp:dev

# View logs
cd mcp-server && npm start
```

## Example Prompts

**Query:**

- "Get the 5 newest food listings"
- "Show all admin users"
- "Find available produce items"

**Create:**

- "Add a food listing for fresh bread"
- "Create a community post about event"

**Update:**

- "Update listing status to claimed"
- "Mark claim as completed"

**Count:**

- "How many pending claims?"
- "Count available food items"

## Environment Variables

Required in `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Troubleshooting

| Issue              | Solution            |
| ------------------ | ------------------- |
| MCP not showing    | Restart VS Code     |
| Server won't start | Check env vars set  |
| Permission errors  | Review RLS policies |
| Tool not working   | Check Supabase logs |

## Learn More

- [Full Documentation](README.md)
- [Usage Examples](EXAMPLES.md)
- [Setup Guide](../MCP_SETUP.md)

---

💡 **Tip:** Use `@workspace` in Copilot Chat to ensure MCP context is included!
