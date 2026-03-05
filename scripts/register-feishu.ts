import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'store/messages.db'));

// 注册私聊为主控聊天
const privateChatJid = 'fs:oc_3b09e64eaefdb1c090c528c5cd317371';
const groupChatJid = 'fs:oc_03a2c81a61c3c6ebdea19fd839386f05';

// 插入主控聊天
db.prepare(`
  INSERT OR REPLACE INTO registered_groups (jid, name, folder, trigger_pattern, added_at, requires_trigger, is_main)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(privateChatJid, 'Feishu私聊', 'feishu_main', '@Andy', new Date().toISOString(), 0, 1);

console.log('✅ 已注册私聊为主控聊天');
console.log(`   JID: ${privateChatJid}`);
console.log(`   机器人将响应所有消息`);

// 验证
const groups = db.prepare('SELECT * FROM registered_groups').all();
console.log('\n已注册的聊天:', groups);
