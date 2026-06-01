import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MobileTabBar from './index';

let isAdmin = false;

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
}));

vi.mock('@lobehub/ui', () => ({
  Icon: () => <span />,
}));

vi.mock('@lobehub/ui/mobile', () => ({
  TabBar: ({ items }: { items: { key: string; onClick: () => void; title: string }[] }) => (
    <nav>
      {items.map((item) => (
        <button key={item.key} type="button" onClick={item.onClick}>
          {item.title}
        </button>
      ))}
    </nav>
  ),
}));

vi.mock('antd-style', () => ({
  createStaticStyles: () => ({ active: 'active' }),
  cssVar: { colorPrimary: '#1677ff' },
}));

vi.mock('lucide-react', () => ({
  Bot: 'Bot',
  MessageSquare: 'MessageSquare',
  User: 'User',
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/libs/router/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock('@/store/serverConfig', () => ({
  featureFlagsSelectors: (state: { showMarket: boolean }) => ({ showMarket: state.showMarket }),
  useServerConfigStore: (selector: (state: { showMarket: boolean }) => unknown) =>
    selector({ showMarket: true }),
}));

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (state: { user: { role: string } }) => unknown) =>
    selector({ user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (state: { user?: { role?: string } }) => state.user?.role === 'admin',
  },
}));

beforeEach(() => {
  isAdmin = false;
  mocks.push.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('MobileTabBar', () => {
  it('keeps the community tab visible for non-admin users', () => {
    render(<MobileTabBar />);

    expect(screen.getByText('tab.community')).toBeInTheDocument();
  });

  it('opens the assistant community page for non-admin users', () => {
    render(<MobileTabBar />);

    screen.getByText('tab.community').click();

    expect(mocks.push).toHaveBeenCalledWith('/community/agent');
  });
});
