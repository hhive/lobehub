import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Nav from './Nav';

let isAdmin = false;

vi.mock('@lobehub/ui', () => ({
  Flexbox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@lobehub/ui/icons', () => ({
  McpIcon: 'McpIcon',
  ProviderIcon: 'ProviderIcon',
  SkillsIcon: 'SkillsIcon',
}));

vi.mock('lucide-react', () => ({
  Bot: 'Bot',
  Brain: 'Brain',
  ShapesIcon: 'ShapesIcon',
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router', () => ({
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
  useNavigate: () => vi.fn(),
}));

vi.mock('@/features/NavPanel/components/NavItem', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}));

vi.mock('@/libs/router/navigation', () => ({
  usePathname: () => '/community',
}));

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/slices/auth/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (state: { user?: { role?: string } }) => state.user?.role === 'admin',
  },
}));

vi.mock('@/utils/navigation', () => ({
  isModifierClick: () => false,
}));

beforeEach(() => {
  isAdmin = false;
});

afterEach(() => {
  cleanup();
});

describe('community sidebar nav', () => {
  it('shows the assistant and skill entries to non-admin users', () => {
    render(<Nav />);

    expect(screen.getByText('tab.assistant')).toBeInTheDocument();
    expect(screen.queryByText('tab.skill')).not.toBeInTheDocument();
    expect(screen.queryByText('tab.home')).not.toBeInTheDocument();
    expect(screen.queryByText('MCP')).not.toBeInTheDocument();
    expect(screen.queryByText('tab.model')).not.toBeInTheDocument();
    expect(screen.queryByText('tab.provider')).not.toBeInTheDocument();
  });

  it('keeps all community entries visible for admin users', () => {
    isAdmin = true;

    render(<Nav />);

    expect(screen.getByText('tab.home')).toBeInTheDocument();
    expect(screen.getByText('tab.assistant')).toBeInTheDocument();
    expect(screen.getByText('tab.skill')).toBeInTheDocument();
    expect(screen.getByText('MCP')).toBeInTheDocument();
    expect(screen.getByText('tab.model')).toBeInTheDocument();
    expect(screen.getByText('tab.provider')).toBeInTheDocument();
  });
});
