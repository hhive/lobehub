import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

let mockAgentState: Record<string, unknown>;
let mockChatInputState: Record<string, unknown>;
let mockChatState: Record<string, unknown>;
let mockUserState: Record<string, unknown>;

vi.mock('react-i18next', () => ({
  useTranslation: (namespace?: string) => ({
    t: (key: string) => {
      if (namespace === 'chat') {
        return (
          {
            'runtimeEnv.mode.cloud': 'Cloud Sandbox',
            'runtimeEnv.mode.cloudDesc': 'Run in a secure cloud sandbox',
            'runtimeEnv.mode.none': 'Off',
            'runtimeEnv.mode.noneDesc': 'Disable runtime environment',
            'runtimeEnv.selectMode': 'Select Runtime Environment',
          }[key] || key
        );
      }

      if (namespace === 'plugin') {
        return (
          {
            'localSystem.workingDirectory.notSet': 'No working directory',
          }[key] || key
        );
      }

      return key;
    },
  }),
}));

vi.mock('@lobehub/icons', () => ({
  Github: () => <span>Github</span>,
}));

vi.mock('@lobehub/ui', () => ({
  Flexbox: ({
    children,
  }: {
    children?: React.ReactNode;
  }) => <div>{children}</div>,
  Icon: ({ icon: Icon }: { icon?: React.ComponentType<{ size?: number }>; size?: number }) =>
    Icon ? <Icon /> : <span>Icon</span>,
  Popover: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Skeleton: {
    Button: () => <div>Skeleton Button</div>,
  },
  Tooltip: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
}));

vi.mock('antd-style', () => ({
  createStaticStyles: () => ({
    bar: 'bar',
    button: 'button',
    modeDesc: 'modeDesc',
    modeOption: 'modeOption',
    modeOptionActive: 'modeOptionActive',
    modeOptionDesc: 'modeOptionDesc',
    modeOptionIcon: 'modeOptionIcon',
    modeOptionTitle: 'modeOptionTitle',
  }),
  cssVar: {
    borderRadius: '4px',
    colorBgElevated: '#fff',
    colorFillSecondary: '#eee',
    colorFillTertiary: '#eee',
    colorText: '#000',
    colorTextDescription: '#666',
    colorTextSecondary: '#666',
    colorTextTertiary: '#999',
  },
  cx: (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' '),
}));

vi.mock('../hooks/useAgentId', () => ({
  useAgentId: () => 'agent-1',
}));

vi.mock('../hooks/useUpdateAgentConfig', () => ({
  useUpdateAgentConfig: () => ({
    updateAgentChatConfig: vi.fn(),
  }),
}));

vi.mock('./useRepoType', () => ({
  useRepoType: () => undefined,
}));

vi.mock('./ModeSelector', () => ({
  default: () => <div>Mode Selector</div>,
}));

vi.mock('./ApprovalMode', () => ({
  default: () => <div>Approval Mode</div>,
}));

vi.mock('./CloudRepoSwitcher', () => ({
  default: () => <div>Cloud Repo Switcher</div>,
}));

vi.mock('./GitStatus', () => ({
  default: () => <div>Git Status</div>,
}));

vi.mock('./WorkingDirectory', () => ({
  default: () => <div>Working Directory</div>,
}));

vi.mock('../ActionBar/Token', () => ({
  default: () => <div>Context Window</div>,
}));

vi.mock('@/store/agent/selectors', () => ({
  agentByIdSelectors: {
    getAgentEnableModeById: () => (s: Record<string, unknown>) => s.enableAgentMode,
    getAgentWorkingDirectoryById: () => (s: Record<string, unknown>) => s.workingDirectory,
    isAgentConfigLoadingById: () => (s: Record<string, unknown>) => s.isLoading,
    isAgentHeterogeneousById: () => (s: Record<string, unknown>) => s.isHeterogeneous,
  },
  chatConfigByIdSelectors: {
    getRuntimeModeById: () => (s: Record<string, unknown>) => s.runtimeMode,
  },
}));

vi.mock('@/store/chat/selectors', () => ({
  topicSelectors: {
    currentTopicWorkingDirectory: (s: Record<string, unknown>) => s.topicWorkingDirectory,
  },
}));

vi.mock('@/store/user/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (s: Record<string, unknown>) =>
      (s.user as { role?: string } | undefined)?.role === 'admin',
  },
}));

vi.mock('@/store/agent', () => ({
  useAgentStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mockAgentState),
}));

vi.mock('@/store/chat', () => ({
  useChatStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mockChatState),
}));

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (state: Record<string, unknown>) => unknown) => selector(mockUserState),
}));

vi.mock('../store', () => ({
  useChatInputStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector(mockChatInputState),
}));

describe('RuntimeConfig admin visibility', () => {
  beforeEach(() => {
    mockAgentState = {
      enableAgentMode: true,
      isHeterogeneous: false,
      isLoading: false,
      runtimeMode: 'cloud',
      workingDirectory: undefined,
    };
    mockChatInputState = {
      rightActions: [],
    };
    mockChatState = {
      topicWorkingDirectory: undefined,
    };
    mockUserState = {
      user: { role: 'user' },
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('hides runtime environment controls for non-admin users', async () => {
    const { default: RuntimeConfig } = await import('./index');

    render(<RuntimeConfig />);

    expect(screen.queryByText('Cloud Sandbox')).not.toBeInTheDocument();
    expect(screen.queryByText('Approval Mode')).not.toBeInTheDocument();
  }, 10_000);

  it('shows runtime environment controls for admins', async () => {
    mockUserState = {
      user: { role: 'admin' },
    };

    const { default: RuntimeConfig } = await import('./index');

    render(<RuntimeConfig />);

    expect(screen.getAllByText('Cloud Sandbox').length).toBeGreaterThan(0);
    expect(screen.getByText('Approval Mode')).toBeInTheDocument();
  }, 10_000);
});
