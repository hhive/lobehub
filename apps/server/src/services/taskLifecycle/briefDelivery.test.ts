// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

import {
  deliverBriefToAgentBotsWithDeps,
  formatBriefNotificationContent,
  resolveMessageTarget,
} from './briefDelivery';

const baseProvider = (overrides: Record<string, unknown> = {}) =>
  ({
    applicationId: 'app-1',
    credentials: {},
    enabled: true,
    id: 'provider-1',
    platform: 'feishu',
    settings: { userId: 'ou_user' },
    ...overrides,
  }) as any;

describe('briefDelivery', () => {
  it('formats a brief notification with the task name and summary', () => {
    expect(
      formatBriefNotificationContent({
        brief: { id: 'brief-1', summary: '今天天气晴，明天小雨。', title: '天气早报' },
        task: { name: '杭州天气早间通知' },
      }),
    ).toBe('杭州天气早间通知\n\n今天天气晴，明天小雨。');
  });

  it('resolves direct user and channel targets from provider settings', () => {
    expect(resolveMessageTarget({ channelId: 'C-1', userId: 'U-1' })).toEqual({
      channelId: 'C-1',
      userId: 'U-1',
    });
    expect(resolveMessageTarget({ serverId: 'S-1' })).toEqual({ channelId: 'S-1' });
  });

  it('creates a notification and sends it through each enabled provider direct target', async () => {
    const createNotification = vi.fn().mockResolvedValue({ id: 'notification-1' });
    const createDelivery = vi.fn().mockResolvedValue(undefined);
    const sendDirectMessage = vi.fn().mockResolvedValue({ messageId: 'msg-1' });

    await deliverBriefToAgentBotsWithDeps(
      {
        brief: { id: 'brief-1', summary: 'summary', title: 'title' },
        task: { assigneeAgentId: 'agent-1', name: 'task name' },
      },
      {
        createDelivery,
        createNotification,
        createService: () => ({ sendDirectMessage } as any),
        listProviders: vi.fn().mockResolvedValue([baseProvider()]),
      },
    );

    expect(createNotification).toHaveBeenCalledWith({
      category: 'task',
      content: 'task name\n\nsummary',
      dedupeKey: 'brief:brief-1',
      title: 'title',
      type: 'task_brief',
    });
    expect(sendDirectMessage).toHaveBeenCalledWith({
      content: '【title】\ntask name\n\nsummary',
      platform: 'feishu',
      userId: 'ou_user',
    });
    expect(createDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'feishu',
        notificationId: 'notification-1',
        providerMessageId: 'msg-1',
        status: 'sent',
      }),
    );
  });

  it('falls back to channel delivery when direct messaging is unavailable', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ messageId: 'msg-channel' });

    await deliverBriefToAgentBotsWithDeps(
      {
        brief: { id: 'brief-1', summary: 'summary', title: 'title' },
        task: { assigneeAgentId: 'agent-1', name: 'task name' },
      },
      {
        createDelivery: vi.fn().mockResolvedValue(undefined),
        createNotification: vi.fn().mockResolvedValue({ id: 'notification-1' }),
        createService: () => ({ sendMessage } as any),
        listProviders: vi
          .fn()
          .mockResolvedValue([baseProvider({ platform: 'telegram', settings: { userId: '123' } })]),
      },
    );

    expect(sendMessage).toHaveBeenCalledWith({
      channelId: '123',
      content: '【title】\ntask name\n\nsummary',
      platform: 'telegram',
    });
  });

  it('records failed delivery when a provider has no target', async () => {
    const createDelivery = vi.fn().mockResolvedValue(undefined);

    await deliverBriefToAgentBotsWithDeps(
      {
        brief: { id: 'brief-1', summary: 'summary', title: 'title' },
        task: { assigneeAgentId: 'agent-1', name: 'task name' },
      },
      {
        createDelivery,
        createNotification: vi.fn().mockResolvedValue({ id: 'notification-1' }),
        createService: () => ({ sendMessage: vi.fn() } as any),
        listProviders: vi.fn().mockResolvedValue([baseProvider({ settings: {} })]),
      },
    );

    expect(createDelivery).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: 'feishu',
        failedReason: 'No message target configured in bot settings',
        notificationId: 'notification-1',
        status: 'failed',
      }),
    );
  });
});
