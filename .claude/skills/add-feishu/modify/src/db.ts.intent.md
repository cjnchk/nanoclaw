# Intent: Add members table and related accessors for Feishu integration

Add a `members` table to store chat member information (for Feishu bot identification and member metadata), update the `messages` table foreign key relationship, and add member accessor functions.

**Schema Changes:**
1. Add `members` table with columns:
   - `mid` (TEXT) - member ID, part of composite primary key
   - `chat_jid` (TEXT) - chat JID, part of composite primary key
   - `app_id` (TEXT) - application-specific ID (e.g., Feishu open_id)
   - `name` (TEXT) - member display name
   - `desc` (TEXT) - member description
   - `is_bot` (INTEGER) - flag indicating if member is a bot (default 0)
   - Foreign key: `chat_jid` references `chats(jid)`

2. Update `messages` table:
   - Add foreign key: `FOREIGN KEY (sender, chat_jid) REFERENCES members(mid, chat_jid)`

**New Functions:**
- `messageExists(id: string, chatJid: string): boolean` - Check if a message exists
- `storeMember(member)` - Insert or replace a member record
- `getMember(mid, chatJid)` - Get a single member by composite key
- `getMembersByChat(chatJid)` - Get all members for a specific chat
- `getAllMembers()` - Get all members across all chats
- `getMemberByAppId(appId, chatJid)` - Lookup member by app_id (for bot identification)

**Invariants:**
- All existing tables, indexes, and functions remain unchanged
- Member interface uses `is_bot` flag to identify bot accounts (e.g., `bot@bot` in Feishu)
- Foreign key relationships preserve referential integrity
- Do not modify existing message storage or retrieval logic beyond the FK addition
