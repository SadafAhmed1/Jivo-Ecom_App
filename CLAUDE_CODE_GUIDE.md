# Claude Code Integration Guide

## Overview

Claude Code CLI has been integrated into your terminal for AI-powered coding assistance using your Claude subscription. This setup bypasses API costs by using subscription-based authentication.

## Setup Instructions

### 1. Check Current Status
```bash
claude config ls
```

### 2. Authentication Setup

If not authenticated, you'll need to set up Claude Code with your subscription:

#### Option A: Interactive Setup (if supported)
```bash
claude login
```
Follow the prompts to authenticate with your Claude subscription.

#### Option B: Manual Token Setup
If you have an authentication token:
```bash
claude config set -g auth.token "your-token-here"
```

### 3. Test the Integration
Once authenticated, test Claude Code in the terminal:
```bash
claude "hello world"
```

## Using Claude Code in the Terminal

### Basic Usage
You can use Claude Code directly in the terminal with these commands:

```bash
# Basic AI query
claude "analyze this project structure"

# Code analysis
claude "review this function for bugs"

# Project help
claude "explain the database schema"

# Development assistance
claude "suggest improvements for this API"
```

### Available Options
```bash
# Use specific model
claude --model sonnet "your prompt"

# Allow specific tools
claude --allowedTools "Bash,Edit" "your prompt"

# Set timeout
claude --timeout 60 "complex analysis task"
```

## Integration Features

### Terminal Interface
- **Command**: `claude [your prompt]`
- **Status Display**: Shows authentication status in the terminal welcome message
- **Response Formatting**: Claude responses are highlighted with special formatting
- **Execution Time**: Shows response time for each query

### Technical Details
- Uses Claude Code's non-interactive mode (`--print` flag) to bypass terminal limitations
- Integrates with your existing project context and working directory
- Supports all Claude Code features except interactive mode
- Automatically uses your subscription authentication

## Troubleshooting

### Common Issues

1. **"Raw mode not supported" error**
   - This is expected in Replit environment
   - Use the integrated terminal commands instead of direct `claude` interactive mode

2. **Authentication errors**
   - Run `claude config ls` to check status
   - Re-authenticate if needed with `claude login`

3. **Command not found**
   - Claude Code CLI is pre-installed globally
   - Check with `which claude`

4. **Permission issues**
   - Ensure you have a valid Claude subscription
   - Contact Anthropic support if authentication continues to fail

### Status Checking
- **Green status**: ✅ Authenticated and ready
- **Red status**: ❌ Authentication required
- **Unknown status**: ⚠️ Check terminal for details

## Example Workflows

### Code Review
```bash
claude "review the database schema in shared/schema.ts"
claude "analyze the API routes for security issues"
```

### Development Help
```bash
claude "help me optimize this SQL query"
claude "suggest better error handling for this function"
```

### Project Analysis
```bash
claude "explain the overall architecture of this e-commerce system"
claude "identify potential performance bottlenecks"
```

## Benefits

- **Cost Effective**: Uses your Claude subscription instead of API charges
- **Integrated**: Works seamlessly within your existing development environment
- **Context Aware**: Understands your project structure and current working directory
- **Full Featured**: Access to all Claude Code capabilities except interactive mode

## Need Help?

If you continue to have authentication issues:
1. Verify your Claude subscription is active
2. Try the authentication setup steps again
3. Contact Anthropic support for subscription-related issues

The integration is designed to work around Replit's terminal limitations while providing full Claude Code functionality through your subscription.