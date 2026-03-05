/**
 * Feishu (Lark) Channel Implementation
 *
 * Uses Feishu SDK WebSocket long-connection for event subscription (no public URL needed).
 * Supports direct messages and group chats.
 */
import * as Lark from '@larksuiteoapi/node-sdk';
import {
  Channel,
  OnInboundMessage,
  OnChatMetadata,
  RegisteredGroup,
  NewMessage,
} from '../types.js';
import { registerChannel } from './registry.js';
import { logger } from '../logger.js';

interface FeishuConfig {
  appId: string;
  appSecret: string;
}

export class FeishuChannel implements Channel {
  name = 'feishu';
  private client: Lark.Client | null = null;
  private wsClient: Lark.WSClient | null = null;
  private onMessage: OnInboundMessage;
  private onChatMetadata: OnChatMetadata;
  private registeredGroups: () => Record<string, RegisteredGroup>;
  private connected = false;
  private config: FeishuConfig | null = null;

  constructor(
    onMessage: OnInboundMessage,
    onChatMetadata: OnChatMetadata,
    registeredGroups: () => Record<string, RegisteredGroup>,
  ) {
    this.onMessage = onMessage;
    this.onChatMetadata = onChatMetadata;
    this.registeredGroups = registeredGroups;
  }

  async connect(): Promise<void> {
    const appId = process.env.FEISHU_APP_ID;
    const appSecret = process.env.FEISHU_APP_SECRET;

    if (!appId || !appSecret) {
      logger.info('Feishu credentials not configured, skipping connection');
      return;
    }

    this.config = { appId, appSecret };

    try {
      // Create Feishu client for sending messages
      this.client = new Lark.Client({
        appId,
        appSecret,
        loggerLevel: Lark.LoggerLevel.info,
      });

      // Create WebSocket client for receiving events (long-connection mode)
      this.wsClient = new Lark.WSClient({
        appId,
        appSecret,
        loggerLevel: Lark.LoggerLevel.info,
      });

      // Create event dispatcher
      const eventDispatcher = new Lark.EventDispatcher({}).register({
        'im.message.receive_v1': async (data) => {
          await this.handleMessage(data);
        },
      });

      // Start WebSocket connection
      await this.wsClient.start({
        eventDispatcher,
      });

      this.connected = true;
      logger.info('Feishu channel connected via WebSocket long-connection');
    } catch (error) {
      logger.error({ error }, 'Failed to connect Feishu channel');
      throw error;
    }
  }

  private async handleMessage(event: {
    sender: {
      sender_id?: {
        union_id?: string;
        user_id?: string;
        open_id?: string;
      };
      sender_type: string;
      tenant_key?: string;
    };
    message: {
      message_id: string;
      root_id?: string;
      parent_id?: string;
      create_time: string;
      update_time?: string;
      chat_id: string;
      thread_id?: string;
      chat_type: string;
      message_type: string;
      content: string;
      mentions?: Array<{
        key: string;
        id: {
          union_id?: string;
          user_id?: string;
          open_id?: string;
        };
        name: string;
        tenant_key?: string;
      }>;
      user_agent?: string;
    };
  }): Promise<void> {
    try {
      const msg = event.message;
      const sender = event.sender;

      // Skip messages from the bot itself
      if (sender.sender_type === 'app') {
        return;
      }

      // Only handle text messages
      if (msg.message_type !== 'text') {
        return;
      }

      // Parse content (JSON string for text messages)
      let contentText = '';
      try {
        const content = JSON.parse(msg.content);
        contentText = content.text || '';
      } catch {
        contentText = msg.content;
      }

      if (!contentText.trim()) {
        return;
      }

      // Construct chat JID: fs:<chat_id>
      const chatJid = `fs:${msg.chat_id}`;
      const senderOpenId = sender.sender_id?.open_id || 'unknown';
      const senderJid = `fs:${senderOpenId}`;

      const newMessage: NewMessage = {
        id: msg.message_id,
        chat_jid: chatJid,
        sender: senderJid,
        sender_name: senderOpenId, // Will be resolved later
        content: contentText,
        timestamp: new Date(parseInt(msg.create_time)).toISOString(),
        is_from_me: false,
      };

      // Notify metadata FIRST (creates chat record for foreign key constraint)
      this.onChatMetadata(
        chatJid,
        newMessage.timestamp,
        undefined, // Name will be synced separately if needed
        'feishu',
        msg.chat_type === 'group' || msg.chat_type === 'topic',
      );

      // Then deliver to message handler
      this.onMessage(chatJid, newMessage);
    } catch (error) {
      logger.error({ error, event }, 'Error handling Feishu message');
    }
  }

  async sendMessage(jid: string, text: string): Promise<void> {
    if (!this.client) {
      throw new Error('Feishu client not connected');
    }

    // Extract chat_id from jid (format: fs:<chat_id>)
    const chatId = jid.startsWith('fs:') ? jid.slice(3) : jid;

    try {
      const response = await this.client.im.v1.message.create({
        params: {
          receive_id_type: 'chat_id',
        },
        data: {
          receive_id: chatId,
          msg_type: 'text',
          content: JSON.stringify({ text }),
        },
      });

      logger.debug({ response }, 'Feishu message sent');
    } catch (error) {
      logger.error({ error, jid, text }, 'Failed to send Feishu message');
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected && this.client !== null;
  }

  ownsJid(jid: string): boolean {
    return jid.startsWith('fs:');
  }

  async disconnect(): Promise<void> {
    if (this.wsClient) {
      try {
        // WSClient doesn't have a stop method, just close the connection
        this.connected = false;
        logger.info('Feishu channel disconnected');
      } catch (error) {
        logger.error({ error }, 'Error disconnecting Feishu channel');
      }
    }
  }
}

// Self-registration
registerChannel('feishu', (opts) => {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    logger.debug('Feishu credentials not found, channel not registered');
    return null;
  }

  return new FeishuChannel(opts.onMessage, opts.onChatMetadata, opts.registeredGroups);
});