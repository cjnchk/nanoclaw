import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';

const db = new Database(path.join(process.cwd(), 'store/messages.db'));

const groupChatJid = 'fs:oc_03a2c81a61c3c6ebdea19fd839386f05';

// 注册群聊为普通聊天（需要触发词）
db.prepare(`
  INSERT OR REPLACE INTO registered_groups (jid, name, folder, trigger_pattern, added_at, requires_trigger, is_main)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`).run(groupChatJid, 'Feishu群聊', 'feishu_group', '@Andy', new Date().toISOString(), 1, 0);

console.log('✅ 已注册群聊');
console.log(`   JID: ${groupChatJid}`);
console.log(`   需要 @Andy 触发`);

// 验证
const groups = db.prepare('SELECT * FROM registered_groups').all();
console.log('\n已注册的聊天:', groups);
