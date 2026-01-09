# Supabase MCP Server - Usage Examples

This document provides practical examples of using the Supabase MCP server with GitHub Copilot.

## Prerequisites

1. MCP server is set up: `npm run mcp:setup`
2. VS Code is restarted
3. GitHub Copilot is enabled

## Example Queries

### Querying Data

**Get latest food listings:**

```
@workspace Show me the 10 most recent food listings with their titles and categories
```

**Find specific users:**

```
@workspace Get all admin users from the database
```

**Filter by status:**

```
@workspace Show me all available food items that haven't been claimed yet
```

**Complex queries:**

```
@workspace Get pending food claims with their associated food listing details
```

### Creating Records

**Add a food listing:**

```
@workspace Create a new food listing:
- Title: "Fresh Organic Apples"
- Category: "produce"
- Quantity: 20
- Unit: "lbs"
- Status: "available"
```

**Create a community post:**

```
@workspace Add a community post titled "Food Drive This Weekend" in the events category
```

### Updating Data

**Update record status:**

```
@workspace Mark the food listing with id "abc123" as claimed
```

**Bulk updates:**

```
@workspace Update all pending claims older than 7 days to expired status
```

### Counting & Analytics

**Simple counts:**

```
@workspace How many food listings are currently available?
```

**Filtered counts:**

```
@workspace Count the number of food claims made in the last 30 days
```

**Admin statistics:**

```
@workspace Give me statistics on user engagement: total users, admin users, and active listings
```

### Schema Exploration

**Table structure:**

```
@workspace What columns are in the food_listings table?
```

**All tables:**

```
@workspace List all available database tables and their descriptions
```

## Advanced Examples

### Multi-step Operations

**Create and verify:**

```
@workspace Create a new food listing for "Fresh Bread" (10 loaves) and then show me all bread listings
```

**Update and check:**

```
@workspace Update the user with email "test@example.com" to admin status, then verify it worked
```

### Data Analysis

**Trend analysis:**

```
@workspace Compare the number of food listings created this month vs last month
```

**Category breakdown:**

```
@workspace Show me the distribution of food items by category
```

### Debugging & Investigation

**Check specific records:**

```
@workspace Show me the details of food claim ID "xyz789"
```

**Find related data:**

```
@workspace Get all claims for the food listing titled "Fresh Vegetables"
```

**Investigate issues:**

```
@workspace Find all food listings that have no claims and are older than 30 days
```

## Tips for Better Results

1. **Be specific**: Include table names, column names, and filter criteria
2. **Use natural language**: The MCP server interprets your intent
3. **Mention context**: Reference existing data when updating/deleting
4. **Ask for verification**: Request confirmation after create/update operations
5. **Combine operations**: Multiple steps can be performed in sequence

## Common Patterns

### CRUD Operations

**Create → Read → Verify**

```
1. Create a new record
2. Read it back to confirm
3. Verify the data matches expectations
```

**Read → Update → Read**

```
1. Get current state
2. Apply changes
3. Confirm changes were applied
```

### Analytics Patterns

**Count → Filter → Detail**

```
1. Get total count
2. Apply filters to narrow down
3. Get detailed view of filtered results
```

### Debugging Patterns

**List → Inspect → Fix**

```
1. List records matching criteria
2. Inspect specific record details
3. Apply fixes if needed
```

## Error Handling

If you get errors:

**Permission denied:**

- Check Supabase RLS policies
- Verify anon key has required permissions

**Table not found:**

- Ensure table name is correct
- Check TABLES constant in supabase-server.js

**Invalid filter:**

- Use simple equality filters (key-value pairs)
- For complex queries, adjust the server code

## Limitations

1. **Simple filters only**: Currently supports equality (`=`) filters
2. **No joins**: Direct table queries only (use nested selects in Supabase)
3. **RLS enforced**: All operations respect Row Level Security policies
4. **Batch operations**: Limited to what Supabase anon key allows

## Next Steps

- Extend the MCP server with custom tools
- Add more complex query capabilities
- Implement custom business logic
- Create specialized analytics tools

For more details, see [mcp-server/README.md](../mcp-server/README.md)
