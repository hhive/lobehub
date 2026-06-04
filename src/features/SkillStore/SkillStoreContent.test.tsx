import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SkillStoreContent } from './SkillStoreContent';

let isAdmin = false;

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@/store/user', () => ({
  useUserStore: (selector: (state: { user?: { role?: string } }) => unknown) =>
    selector({ user: { role: isAdmin ? 'admin' : 'user' } }),
}));

vi.mock('@/store/user/slices/auth/selectors', () => ({
  userProfileSelectors: {
    isAdmin: (state: { user?: { role?: string } }) => state.user?.role === 'admin',
  },
}));

vi.mock('./Search', () => ({
  default: () => <div data-testid="skill-search" />,
}));

vi.mock('./SkillList/AddSkillButton', () => ({
  default: () => <div data-testid="add-skill-button" />,
}));

vi.mock('./SkillList/Custom', () => ({
  default: () => <div data-testid="custom-list" />,
}));

vi.mock('./SkillList/LobeHub', () => ({
  default: () => <div data-testid="lobehub-list" />,
}));

vi.mock('./SkillList/MarketSkills', () => ({
  default: () => <div data-testid="market-skill-list" />,
}));

vi.mock('./SkillList/MCP', () => ({
  default: () => <div data-testid="mcp-list" />,
}));

describe('SkillStoreContent', () => {
  beforeEach(() => {
    isAdmin = false;
  });

  it('shows only the default skills tab for non-admin users', () => {
    render(<SkillStoreContent />);

    expect(screen.getByTestId('skill-search')).toBeInTheDocument();
    expect(screen.queryByTestId('add-skill-button')).toBeNull();
    expect(screen.getByTestId('lobehub-list')).toBeInTheDocument();
    expect(screen.queryByTestId('market-skill-list')).toBeNull();
    expect(screen.queryByTestId('mcp-list')).toBeNull();
    expect(screen.queryByTestId('custom-list')).toBeNull();
  });

  it('renders the skill store for admins', () => {
    isAdmin = true;

    render(<SkillStoreContent />);

    expect(screen.getByTestId('skill-search')).toBeInTheDocument();
    expect(screen.getByTestId('add-skill-button')).toBeInTheDocument();
    expect(screen.getByTestId('lobehub-list')).toBeInTheDocument();
    expect(screen.getByTestId('market-skill-list')).toBeInTheDocument();
    expect(screen.getByTestId('custom-list')).toBeInTheDocument();
  });
});
