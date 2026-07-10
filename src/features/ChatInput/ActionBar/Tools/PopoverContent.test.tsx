import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import PopoverContent from './PopoverContent';

let isAdmin = false;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@lobehub/ui', async () => {
  const actual = (await vi.importActual('@lobehub/ui')) as Record<string, unknown>;

  return {
    ...actual,
    usePopoverContext: () => ({ close: vi.fn() }),
  };
});

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (state: { user?: { role?: string } }) => unknown) =>
    selector({ user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/slices/auth/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (state: { user?: { role?: string } }) => state.user?.role === 'admin',
  },
}));

vi.mock('./ScrollSignalContext', () => ({
  ScrollSignalProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./SkillActivateMode', () => ({
  default: () => <div data-testid="skill-activate-mode" />,
}));

vi.mock('./ToolsList', () => ({
  default: () => <div data-testid="tools-list" />,
  toolsListStyles: {
    item: 'item',
    itemContent: 'content',
    itemIcon: 'icon',
  },
}));

describe('PopoverContent', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('hides the skill store entry for non-admin users', () => {
    render(<PopoverContent items={[]} onOpenStore={vi.fn()} />);

    expect(screen.queryByText('skillStore.title')).toBeNull();
    expect(screen.getByText('tools.plugins.management')).toBeInTheDocument();
  });

  it('shows the skill store entry for admins', () => {
    isAdmin = true;

    render(<PopoverContent items={[]} onOpenStore={vi.fn()} />);

    expect(screen.getByText('skillStore.title')).toBeInTheDocument();
  });
});
