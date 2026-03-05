import 'dotenv/config';
import * as Lark from '@larksuiteoapi/node-sdk';

const client = new Lark.Client({
  appId: process.env.FEISHU_APP_ID!,
  appSecret: process.env.FEISHU_APP_SECRET!,
});

async function main() {
  console.log('\n=== 飞书机器人信息 ===\n');
  console.log(`App ID: ${process.env.FEISHU_APP_ID}`);
  console.log('\n=== 测试方式 ===\n');
  console.log('1. 在飞书 PC 或 App 中，搜索你的应用名称');
  console.log('2. 或者在飞书开放平台 -> 应用信息 中查看应用名称');
  console.log('3. 与机器人私聊发送消息测试');
  console.log('4. 或创建群聊并添加机器人');
  console.log('\n=== 监控日志 ===\n');
  console.log('发送消息后，运行: tail -f logs/nanoclaw.log');
}

main().catch(console.error);
