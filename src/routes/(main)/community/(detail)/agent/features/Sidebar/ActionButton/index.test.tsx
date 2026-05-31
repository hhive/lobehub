import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DetailProvider } from '../../DetailProvider';
import ActionButton from './index';

let isAdmin = false;

vi.mock('@lobehub/ui', () => ({
  Flexbox: ({
    children,
    horizontal,
  }: {
    children: React.ReactNode;
    horizontal?: boolean;
  }) => <div data-horizontal={horizontal ? 'true' : 'false'}>{children}</div>,
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

vi.mock('../../../../features/ShareButton', () => ({
  default: () => <button type="button">share</button>,
}));

vi.mock('./AddAgent', () => ({
  default: () => <button type="button">direct-chat</button>,
}));

vi.mock('./ForkAndChat', () => ({
  default: () => <button type="button">fork-and-chat</button>,
}));

const renderActionButton = () =>
  render(
    <DetailProvider
      config={{
        description: 'test assistant',
        identifier: 'assistant-1',
        tags: ['tag'],
        title: 'Test Assistant',
      }}
    >
      <ActionButton />
    </DetailProvider>,
  );

beforeEach(() => {
  isAdmin = false;
});

afterEach(() => {
  cleanup();
});

describe('community agent action button', () => {
  it('shows direct chat and hides fork chat for non-admin users', () => {
    renderActionButton();

    expect(screen.getByText('direct-chat')).toBeInTheDocument();
    expect(screen.queryByText('fork-and-chat')).not.toBeInTheDocument();
    expect(screen.getByText('share')).toBeInTheDocument();
  });

  it('shows direct chat above fork chat for admin users', () => {
    isAdmin = true;

    renderActionButton();

    const directChat = screen.getByText('direct-chat');
    const forkAndChat = screen.getByText('fork-and-chat');

    expect(directChat).toBeInTheDocument();
    expect(forkAndChat).toBeInTheDocument();
    expect(directChat.compareDocumentPosition(forkAndChat)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
