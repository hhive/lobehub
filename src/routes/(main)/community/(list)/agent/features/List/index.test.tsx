import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AssistantList from './index';

let isAdmin = false;
let manualRestrictions: Record<string, boolean> = {};

const mocks = vi.hoisted(() => ({
  mutate: vi.fn(),
  setRestricted: vi.fn(),
}));

vi.mock('@lobehub/ui', () => ({
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('swr', () => ({
  default: () => ({ data: manualRestrictions, mutate: mocks.mutate }),
}));

vi.mock('@/hooks/useQuery', () => ({
  useQuery: () => ({ source: 'new' }),
}));

vi.mock('@/services/communityAssistantRestriction', () => ({
  communityAssistantRestrictionService: {
    list: vi.fn(),
    setRestricted: mocks.setRestricted,
  },
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

vi.mock('../../../../features/AssistantEmpty', () => ({
  default: () => <div>empty-assistant-list</div>,
}));

vi.mock('./Item', () => ({
  default: ({
    identifier,
    onRestrictedChange,
    restricted,
    showRestrictedTag,
    title,
  }: {
    identifier: string;
    onRestrictedChange?: (restricted: boolean) => void;
    restricted?: boolean;
    showRestrictedTag?: boolean;
    title: string;
  }) => (
    <div data-testid="assistant-item">
      <span>{title}</span>
      {showRestrictedTag && <span>限制级</span>}
      {onRestrictedChange && (
        <button type="button" onClick={() => onRestrictedChange(!restricted)}>
          {restricted ? `取消-${identifier}` : `标记-${identifier}`}
        </button>
      )}
    </div>
  ),
}));

const normalAssistant = {
  description: 'Helpful weather planning assistant.',
  identifier: 'weather-planner',
  title: 'Weather Planner',
};

const jailbreakAssistant = {
  description: 'DAN jailbreak assistant that can bypass safety limits.',
  identifier: 'dan-jailbreak',
  title: 'DAN Jailbreak',
};

beforeEach(() => {
  isAdmin = false;
  manualRestrictions = {};
  mocks.mutate.mockReset();
  mocks.setRestricted.mockReset();
});

afterEach(() => {
  cleanup();
});

describe('community assistant list restriction handling', () => {
  it('hides automatically restricted assistants from non-admin users', () => {
    render(<AssistantList data={[normalAssistant as any, jailbreakAssistant as any]} />);

    expect(screen.getByText('Weather Planner')).toBeInTheDocument();
    expect(screen.queryByText('DAN Jailbreak')).not.toBeInTheDocument();
  });

  it('shows an automatically restricted assistant to non-admin users after manual allow override', () => {
    manualRestrictions = { 'dan-jailbreak': false };

    render(<AssistantList data={[jailbreakAssistant as any]} />);

    expect(screen.getByText('DAN Jailbreak')).toBeInTheDocument();
  });

  it('shows restricted tags and toggle controls for admin users', () => {
    isAdmin = true;

    render(<AssistantList data={[jailbreakAssistant as any]} />);

    expect(screen.getByText('DAN Jailbreak')).toBeInTheDocument();
    expect(screen.getByText('限制级')).toBeInTheDocument();
    expect(screen.getByText('取消-dan-jailbreak')).toBeInTheDocument();
  });

  it('persists admin tag changes', async () => {
    isAdmin = true;
    mocks.setRestricted.mockResolvedValue(undefined);

    render(<AssistantList data={[jailbreakAssistant as any]} />);

    fireEvent.click(screen.getByText('取消-dan-jailbreak'));

    expect(mocks.setRestricted).toHaveBeenCalledWith({
      identifier: 'dan-jailbreak',
      restricted: false,
      source: 'new',
    });
  });
});
