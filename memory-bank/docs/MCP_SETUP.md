# MCP Setup for ChayCards

This project includes MCP (Model Context Protocol) servers for enhanced Claude Code capabilities.

## Quick Start

The MCP servers are pre-configured in `.mcp.json`. When you first use Claude Code in this project, it will prompt you to approve these servers.

## Notion Setup (Required for Task Tracking)

1. **Get a Notion API Key**:
   - Go to https://www.notion.so/my-integrations
   - Click "New integration"
   - Name it "ChayCards Dev"
   - Copy the API token

2. **Set Environment Variable**:
   ```bash
   export NOTION_API_KEY="your-notion-api-key-here"
   ```

3. **Create Your Database**:
   - Duplicate the ChayCards_Dev database template (ask team for link)
   - Or create a new database with these properties:
     - Project name (Title)
     - Status (Status: Not started, In progress, Done)
     - Priority (Select: High, Medium, Low)
     - Category (Select: Infrastructure, Plugin System, Core Plugins, Backend, Testing)
   
4. **Share Database with Integration**:
   - Click "..." menu on your database
   - Select "Add connections"
   - Find and add your "ChayCards Dev" integration

5. **Update Database ID**:
   - Copy the database ID from the URL (the 32-character string)
   - Update it in `notion.md`

## Puppeteer Setup

No additional setup needed! Puppeteer MCP works out of the box for frontend testing.

## Verifying Setup

When you run Claude Code in this project, you should see both MCP servers available:
- `mcp__notion__*` - Notion task management tools
- `mcp__puppeteer__*` - Browser automation tools

## Troubleshooting

If MCP servers don't load:
1. Make sure you approved them when prompted
2. Check your environment variables are set
3. Run with `--mcp-debug` flag for more info

## Security Note

- Never commit your Notion API key
- The `.mcp.json` file uses environment variable substitution for security
- Each developer needs their own Notion workspace and API key