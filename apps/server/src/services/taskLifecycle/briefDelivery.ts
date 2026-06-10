import type {
  SendDirectMessageParams,
  SendMessageParams,
} from '@lobechat/builtin-tool-message/executionRuntime';
import { LarkApiClient } from '@lobechat/chat-adapter-feishu';
import { QQApiClient } from '@lobechat/chat-adapter-qq';
import { WechatApiClient } from '@lobechat/chat-adapter-wechat';

import { AgentBotProviderModel, type DecryptedBotProvider } from '@/database/models/agentBotProvider';
import { NotificationModel } from '@/database/models/notification';
import type { BriefItem } from '@/database/schemas';
import type { LobeChatDatabase } from '@/database/type';
import { KeyVaultsGateKeeper } from '@/server/modules/KeyVaultsEncrypt';
import { DiscordApi } from '@/server/services/bot/platforms/discord/api';
import { DiscordMessageService } from '@/server/services/bot/platforms/discord/service';
import { FeishuMessageService } from '@/server/services/bot/platforms/feishu/service';
import { ImessageDesktopBridgeApi } from '@/server/services/bot/platforms/imessage/desktopBridge';
import { ImessageMessageService } from '@/server/services/bot/platforms/imessage/service';
import { QQMessageService } from '@/server/services/bot/platforms/qq/service';
import { SlackApi } from '@/server/services/bot/platforms/slack/api';
import { SlackMessageService } from '@/server/services/bot/platforms/slack/service';
import { TelegramApi } from '@/server/services/bot/platforms/telegram/api';
import { TelegramMessageService } from '@/server/services/bot/platforms/telegram/service';
import { WechatMessageService } from '@/server/services/bot/platforms/wechat/service';
import type { MessageRuntimeService } from '@/server/services/toolExecution/serverRuntimes/message/adapters/types';

type DeliveryNotification = { id: string } | null;

type BriefDeliveryDeps = {
  createDelivery: (data: {
    channel: string;
    failedReason?: string;
    notificationId: string;
    providerMessageId?: string;
    sentAt?: Date;
    status: 'failed' | 'sent';
  }) => Promise<unknown>;
  createNotification: (data: {
    actionUrl?: string;
    category: string;
    content: string;
    dedupeKey: string;
    title: string;
    type: string;
  }) => Promise<DeliveryNotification>;
  createService: (provider: DecryptedBotProvider) => MessageRuntimeService;
  listProviders: (agentId: string) => Promise<DecryptedBotProvider[]>;
};

export type BriefDeliveryInput = {
  brief: Pick<BriefItem, 'id' | 'summary' | 'title'>;
  task: {
    assigneeAgentId?: null | string;
    identifier?: null | string;
    name?: null | string;
  };
};

const pickString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim() ? value.trim() : undefined;

export const formatBriefNotificationContent = (input: BriefDeliveryInput): string => {
  const taskName = input.task.name || input.task.identifier || '任务';
  return `${taskName}\n\n${input.brief.summary}`;
};

export const resolveMessageTarget = (
  settings: Record<string, unknown> | null | undefined,
): { channelId?: string; userId?: string } => ({
  channelId:
    pickString(settings?.channelId) ||
    pickString(settings?.serverId) ||
    pickString(settings?.chatId) ||
    pickString(settings?.threadId),
  userId: pickString(settings?.userId),
});

const sendThroughProvider = async (
  service: MessageRuntimeService,
  provider: DecryptedBotProvider,
  content: string,
) => {
  const target = resolveMessageTarget(provider.settings as Record<string, unknown> | undefined);

  if (target.userId && service.sendDirectMessage) {
    return service.sendDirectMessage({
      content,
      platform: provider.platform as SendDirectMessageParams['platform'],
      userId: target.userId,
    });
  }

  const channelId = target.channelId || target.userId;
  if (!channelId) throw new Error('No message target configured in bot settings');

  return service.sendMessage({
    channelId,
    content,
    platform: provider.platform as SendMessageParams['platform'],
  });
};

export const deliverBriefToAgentBotsWithDeps = async (
  input: BriefDeliveryInput,
  deps: BriefDeliveryDeps,
): Promise<void> => {
  if (!input.task.assigneeAgentId) return;

  const notification = await deps.createNotification({
    category: 'task',
    content: formatBriefNotificationContent(input),
    dedupeKey: `brief:${input.brief.id}`,
    title: input.brief.title,
    type: 'task_brief',
  });
  if (!notification) return;

  const providers = (await deps.listProviders(input.task.assigneeAgentId)).filter(
    (provider) => provider.enabled,
  );

  for (const provider of providers) {
    try {
      const result = await sendThroughProvider(
        deps.createService(provider),
        provider,
        `【${input.brief.title}】\n${formatBriefNotificationContent(input)}`,
      );
      await deps.createDelivery({
        channel: provider.platform,
        notificationId: notification.id,
        providerMessageId: result?.messageId,
        sentAt: new Date(),
        status: 'sent',
      });
    } catch (error) {
      await deps.createDelivery({
        channel: provider.platform,
        failedReason: error instanceof Error ? error.message : String(error),
        notificationId: notification.id,
        status: 'failed',
      });
    }
  }
};

const createServiceForProvider = (
  provider: DecryptedBotProvider,
  userId: string,
): MessageRuntimeService => {
  switch (provider.platform) {
    case 'discord': {
      return new DiscordMessageService(new DiscordApi(provider.credentials.botToken));
    }
    case 'feishu':
    case 'lark': {
      return new FeishuMessageService(
        new LarkApiClient(provider.applicationId, provider.credentials.appSecret, provider.platform),
        provider.platform,
      );
    }
    case 'imessage': {
      return new ImessageMessageService(
        new ImessageDesktopBridgeApi({
          applicationId: provider.applicationId,
          deviceId: provider.credentials.desktopDeviceId,
          userId,
        }),
      );
    }
    case 'qq': {
      return new QQMessageService(
        new QQApiClient(provider.applicationId, provider.credentials.appSecret),
      );
    }
    case 'slack': {
      return new SlackMessageService(new SlackApi(provider.credentials.botToken));
    }
    case 'telegram': {
      return new TelegramMessageService(new TelegramApi(provider.credentials.botToken));
    }
    case 'wechat': {
      return new WechatMessageService(
        new WechatApiClient(provider.credentials.botToken, provider.credentials.botId),
        provider.applicationId,
      );
    }
    default: {
      throw new Error(`Unsupported bot platform: ${provider.platform}`);
    }
  }
};

export const deliverBriefToAgentBots = async ({
  brief,
  db,
  task,
  userId,
}: BriefDeliveryInput & { db: LobeChatDatabase; userId: string }): Promise<void> => {
  const gateKeeper = await KeyVaultsGateKeeper.initWithEnvKey();
  const providerModel = new AgentBotProviderModel(db, userId, gateKeeper);
  const notificationModel = new NotificationModel(db, userId);

  await deliverBriefToAgentBotsWithDeps(
    { brief, task },
    {
      createDelivery: (data) => notificationModel.createDelivery(data as any),
      createNotification: (data) => notificationModel.create(data),
      createService: (provider) => createServiceForProvider(provider, userId),
      listProviders: (agentId) => providerModel.findByAgentId(agentId),
    },
  );
};
