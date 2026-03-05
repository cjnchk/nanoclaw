import 'dotenv/config';
import * as Lark from '@larksuiteoapi/node-sdk';

const client = new Lark.Client({
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!,
});

async function main() {
  // 获取用户或机器人所在的群列表
  const res = await client.im.v1.chat.list({
    params: {
      page_size: 50,
    },
  });
  
  console.log('\n=== 飞书聊天列表 ===\n');
  for (const chat of res.data?.items || []) {
    console.log(`名称: ${chat.name}`);
    console.log(`Chat ID: ${chat.chat_id}`);
    console.log(`类型: ${chat.chat_type}`);
    console.log('---');
  }
}

main().catch(console.error);
