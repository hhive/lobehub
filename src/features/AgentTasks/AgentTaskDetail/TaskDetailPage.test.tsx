/**
 * @vitest-environment happy-dom
 */
import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import TaskDetailPage from './TaskDetailPage';

const mocks = vi.hoisted(() => ({
  globalState: {
    status: {
      showTaskAgentPanel: false,
      zenMode: false,
    },
    systemStatus: { showTaskAgentPanel: false },
    toggleTaskAgentPanel: vi.fn(),
  },
  taskState: {
    activeTaskId: undefined as string | undefined,
    setActiveTaskId: vi.fn(),
    taskDetailMap: {} as Record<string, unknown>,
    taskSaveStatus: 'idle',
    useFetchTaskDetail: vi.fn(),
  },
}));

vi.mock('@lobehub/ui', () => ({
  Button: ({ children }: { children?: ReactNode }) => <button>{children}</button>,
  Flexbox: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router', () => ({
  Link: ({ children, to }: { children?: ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock('@/components/404', () => ({
  default: ({ desc, title }: { desc: string; title: string }) => (
    <div data-testid="not-found">
      <span>{title}</span>
      <span>{desc}</span>
    </div>
  ),
}));

vi.mock('@/components/Editor/AutoSaveHint', () => ({
  default: () => <div data-testid="autosave" />,
}));

vi.mock('@/components/Loading/BrandTextLoading', () => ({
  default: () => <div data-testid="loading" />,
}));

vi.mock('@/features/DocumentModal/Preview', () => ({
  default: () => null,
}));

vi.mock('@/features/NavHeader', () => ({
  default: ({ left, right }: { left?: ReactNode; right?: ReactNode }) => (
    <header>
      {left}
      {right}
    </header>
  ),
}));

vi.mock('@/features/RightPanel/ToggleRightPanelButton', () => ({
  default: () => <button data-testid="toggle-panel" />,
}));

vi.mock('@/features/WideScreenContainer', () => ({
  default: ({ children }: { children?: ReactNode }) => <main>{children}</main>,
}));

vi.mock('@/store/global', () => ({
  useGlobalStore: (selector: (state: typeof mocks.globalState) => unknown) =>
    selector(mocks.globalState),
}));

vi.mock('@/store/task', () => ({
  useTaskStore: (selector: (state: typeof mocks.taskState) => unknown) => selector(mocks.taskState),
}));

vi.mock('../shared/Breadcrumb', () => ({
  default: ({ taskId }: { taskId?: string }) => <span>{taskId}</span>,
}));

vi.mock('./TaskActivities', () => ({
  default: () => <div data-testid="activities" />,
}));

vi.mock('./TaskArtifacts', () => ({
  default: () => <div data-testid="artifacts" />,
}));

vi.mock('./TaskDetailAssignee', () => ({
  default: () => <div data-testid="assignee" />,
}));

vi.mock('./TaskDetailHeaderActions', () => ({
  default: () => <div data-testid="header-actions" />,
}));

vi.mock('./TaskDetailRunPauseAction', () => ({
  default: () => <div data-testid="run-pause" />,
}));

vi.mock('./TaskDetailTitleInput', () => ({
  default: () => <div data-testid="title-input" />,
}));

vi.mock('./TaskInstruction', () => ({
  default: () => <div data-testid="instruction" />,
}));

vi.mock('./TaskModelConfig', () => ({
  default: () => <div data-testid="model-config" />,
}));

vi.mock('./TaskParentBar', () => ({
  default: () => <div data-testid="parent-bar" />,
}));

vi.mock('./TaskProperties', () => ({
  default: () => <div data-testid="properties" />,
}));

vi.mock('./TaskSubtasks', () => ({
  default: () => <div data-testid="subtasks" />,
}));

vi.mock('./TopicChatDrawer', () => ({
  default: () => null,
}));

describe('TaskDetailPage', () => {
  beforeEach(() => {
    mocks.taskState.taskDetailMap = {};
    mocks.taskState.setActiveTaskId.mockClear();
    mocks.taskState.useFetchTaskDetail.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders not-found immediately for permanent task detail 404', () => {
    mocks.taskState.useFetchTaskDetail.mockReturnValue({
      error: { data: { code: 'NOT_FOUND' } },
      isLoading: true,
    });

    render(<TaskDetailPage taskId="T-missing" />);

    expect(screen.getByTestId('not-found')).toBeInTheDocument();
    expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
  });
});
