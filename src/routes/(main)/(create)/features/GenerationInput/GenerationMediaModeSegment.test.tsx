import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import GenerationMediaModeSegment from './GenerationMediaModeSegment';

const selectMock = vi.fn();
let isAdmin = false;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({ user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/slices/auth/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (s: { user?: { role?: string } }) => s.user?.role === 'admin',
  },
}));

vi.mock('@lobehub/ui', () => ({
  Flexbox: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Icon: () => null,
}));

vi.mock('@lobehub/ui/base-ui', () => ({
  Select: (props: any) => {
    selectMock(props);
    return <div data-testid="generation-mode-select" />;
  },
}));

vi.mock('antd-style', () => ({
  createStaticStyles: () => ({
    heroSelect: 'hero-select',
    heroText: 'hero-text',
    lite: 'lite',
  }),
}));

describe('GenerationMediaModeSegment', () => {
  beforeEach(() => {
    isAdmin = false;
    selectMock.mockClear();
  });

  it('only exposes image generation mode for non-admin users', () => {
    render(<GenerationMediaModeSegment mode="image" />);

    const [{ options }] = selectMock.mock.calls[0];

    expect(options).toHaveLength(1);
    expect(options[0].value).toBe('image');
    expect(options.map((item: { value: string }) => item.value)).not.toContain('video');
  });

  it('exposes video generation mode for admin users', () => {
    isAdmin = true;

    render(<GenerationMediaModeSegment mode="image" />);

    const [{ options }] = selectMock.mock.calls[0];

    expect(options.map((item: { value: string }) => item.value)).toEqual(['image', 'video']);
  });
});
