import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import SkillList from './index';

let isAdmin = false;

vi.mock('@lobehub/ui', () => ({
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
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

vi.mock('../../../../features/SkillEmpty', () => ({
  default: () => <div>empty-skill-list</div>,
}));

vi.mock('./Item', () => ({
  default: ({ name, showLobeHubTag }: { name: string; showLobeHubTag?: boolean }) => (
    <div>
      {name}
      {showLobeHubTag && <span>远程</span>}
    </div>
  ),
}));

const skill = {
  identifier: 'remote-skill',
  name: 'Remote Skill',
};

beforeEach(() => {
  isAdmin = false;
});

afterEach(() => {
  cleanup();
});

describe('community skill list', () => {
  it('hides remote market skills from non-admin users', () => {
    render(<SkillList data={[skill as any]} />);

    expect(screen.getByText('empty-skill-list')).toBeInTheDocument();
    expect(screen.queryByText('Remote Skill')).not.toBeInTheDocument();
  });

  it('shows remote tag for admin users', () => {
    isAdmin = true;

    render(<SkillList data={[skill as any]} />);

    expect(screen.getByText('Remote Skill')).toBeInTheDocument();
    expect(screen.getByText('远程')).toBeInTheDocument();
  });
});
