# Claude Code - AI Coding Assistant Guide

## Quick Start

Claude Code is now installed and ready to use in your Terminal IDE! Here's how to get started:

### Basic Usage

Run Claude Code from the terminal:
```bash
npx @anthropic-ai/claude-code
```

Or if globally accessible:
```bash
claude
```

### First-Time Setup

1. **Authentication Required**: Claude Code needs API access to Anthropic's services
2. **Billing**: Requires an active Anthropic account with billing enabled
3. **Login**: Follow the authentication prompts when first running

### Common Commands & Use Cases

#### Project Analysis
```bash
# Start Claude Code and ask questions about your codebase
npx @anthropic-ai/claude-code

# Example prompts once Claude Code is running:
"Explain the architecture of this e-commerce system"
"Show me how the database schemas are organized"
"Find all the API endpoints in the server folder"
"Analyze the React components structure"
```

#### Code Improvements
```bash
# Ask Claude Code to make improvements
"Optimize the database queries in the PO upload system"
"Add error handling to the secondary sales parser"
"Refactor the terminal component for better performance"
"Add TypeScript types to improve type safety"
```

#### Bug Fixes & Debugging
```bash
# Get help with issues
"Why is the Blinkit inventory upload failing?"
"Debug the SQL query execution timeout issues"
"Fix the terminal scroll behavior"
"Resolve TypeScript errors in the schema file"
```

#### Feature Development
```bash
# Build new features
"Add a new platform parser for Amazon Fresh"
"Create a dashboard showing sales analytics"
"Build an export feature for inventory data"
"Add user authentication to the system"
```

### Your E-commerce System Overview

Claude Code will have full access to your comprehensive system including:

#### **Platform Management**
- 5 PO platforms: Flipkart Grocery, Zepto, City Mall, Blinkit, Swiggy Instamart
- 4 Secondary sales platforms: Amazon, Zepto, Blinkit, Swiggy  
- 2 Inventory platforms: Jio Mart, Blinkit

#### **Database Structure**
- 56+ database tables with comprehensive PO, sales, and inventory tracking
- PostgreSQL with Drizzle ORM
- SAP B1 Hanna ERP integration for item master data

#### **Key Modules**
- Unified PO upload system with platform-specific parsers
- Secondary sales data processing with business unit filtering
- Inventory management with daily/range tracking
- SQL Query module with terminal access
- Terminal IDE with VS Code-like interface

### Best Practices

1. **Be Specific**: Ask clear, specific questions about your code
2. **Context Matters**: Claude Code can see your entire codebase
3. **Incremental Changes**: Make small, testable changes
4. **Review Changes**: Always review Claude Code's suggestions before implementing
5. **Use Git**: Commit frequently when working with Claude Code

### Troubleshooting

If Claude Code isn't working:

1. **Check Installation**: `npm list @anthropic-ai/claude-code`
2. **Try Full Path**: `npx @anthropic-ai/claude-code`
3. **Check Internet**: Claude Code requires internet connectivity
4. **Verify Billing**: Ensure your Anthropic account has active billing

### Example Session

```bash
$ npx @anthropic-ai/claude-code
Claude Code v1.0.72

? How can I help you today?

> Analyze the database schema for the PO management system and suggest optimizations

[Claude Code will analyze your schema files and provide detailed recommendations]

> Add proper indexing to the pf_po and pf_order_items tables for better query performance

[Claude Code will examine the tables and suggest/implement index improvements]
```

### Integration with Your Terminal IDE

Your VS Code-like Terminal IDE now includes:
- ✅ File explorer with collapsible folders
- ✅ Tabbed editor for viewing multiple files
- ✅ Minimizable terminal with Claude Code support
- ✅ Complete source code access for analysis
- ✅ Database schema visibility for AI assistance

Start exploring your codebase with Claude Code's help!