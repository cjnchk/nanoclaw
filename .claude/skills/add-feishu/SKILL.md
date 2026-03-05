---
name: add-feishu
description: Add Feishu (Lark) as a channel. Uses long-polling for event subscription (no public URL needed). Supports both direct messages and group chats.
---

# Add Feishu (Lark) Channel

This skill adds Feishu/Lark support to NanoClaw.

## Prerequisites

1. A Feishu application created at https://open.feishu.cn/
2. App ID and App Secret
3. Enable required permissions and events

## Phase 1: Apply Code Changes

### Initialize skills system (if needed)

If `.nanoclaw/` directory doesn't exist yet:

```bash
npx tsx scripts/apply-skill.ts --init
```

### Create the channel file

Create `src/channels/feishu.ts` with the FeishuChannel implementation.

### Register the channel

Add `import './feishu.js'` to `src/channels/index.ts`.

### Install dependencies

```bash
npm install @larksuiteoapi/node-sdk
```

### Update .env.example

Add Feishu environment variables to `.env.example`.

## Phase 2: Configuration

### Set environment variables

Add to `.env`:

```
FEISHU_APP_ID=your_app_id
FEISHU_APP_SECRET=your_app_secret
```

### Configure Feishu App Permissions

In Feishu Admin Console:

1. Go to your app > Permissions
2. Enable these permissions:
   - `im:message` - Get messages
   - `im:message:send_as_bot` - Send messages as bot
   - `contact:user.base:readonly` - Get user info (optional)

### Configure Event Subscription

1. Go to your app > Event Subscriptions
2. Enable "Use Long Connection" mode
3. Add events:
   - `im.message.receive_v1` - Receive messages

## Phase 3: Register Chat

### Get Chat ID

For direct messages: the chat ID format is `fs:<open_id>` or `fs:<chat_id>`

For group chats: `fs:<chat_id>`

### Register the chat

Use the registration script or direct database insert.

## Troubleshooting

### Bot not responding

1. Check `FEISHU_APP_ID` and `FEISHU_APP_SECRET` in `.env`
2. Verify permissions are enabled in Feishu console
3. Check logs: `tail -f logs/nanoclaw.log`

### Long connection issues

The SDK handles reconnection automatically. Check logs for connection status.