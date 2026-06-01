import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import McpList from './index';

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

vi.mock('../../../../features/McpEmpty', () => ({
  default: () => <div>empty-mcp-list</div>,
}));

vi.mock('./Item', () => ({
  default: ({ name, showLobeHubTag }: { name: string; showLobeHubTag?: boolean }) => (
    <div>
      {name}
      {showLobeHubTag && <span>远程</span>}
    </div>
  ),
}));

const localMcp = {
  identifier: 'local-mcp',
  name: 'Local MCP',
};

const remoteMcp = {
  cloudEndPoint: 'https://example.com',
  identifier: 'remote-mcp',
  name: 'Remote MCP',
};

beforeEach(() => {
  isAdmin = false;
});

afterEach(() => {
  cleanup();
});

describe('community mcp list', () => {
  it('hides remote MCP items from non-admin users', () => {
    render(<McpList data={[localMcp as any, remoteMcp as any]} />);

    expect(screen.getByText('Local MCP')).toBeInTheDocument();
    expect(screen.queryByText('Remote MCP')).not.toBeInTheDocument();
  });

  it('shows remote tag for admin users', () => {
    isAdmin = true;

    render(<McpList data={[localMcp as any, remoteMcp as any]} />);

    expect(screen.getByText('Local MCP')).toBeInTheDocument();
    expect(screen.getByText('Remote MCP')).toBeInTheDocument();
    expect(screen.getByText('远程')).toBeInTheDocument();
  });
});
