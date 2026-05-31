import { describe, expect, it } from 'vitest';

import {
  filterLobeHubRemoteItems,
  isLobeHubRemoteMcp,
  isMarketAgentSkill,
  isRemoteMarketSkill,
} from './lobehubRemote';

describe('lobehub remote skill visibility', () => {
  it('detects cloud MCP items as LobeHub remote dependencies', () => {
    expect(isLobeHubRemoteMcp({ cloudEndPoint: 'https://example.com' })).toBe(true);
    expect(isLobeHubRemoteMcp({ haveCloudEndpoint: true })).toBe(true);
    expect(isLobeHubRemoteMcp({ identifier: 'local-mcp' })).toBe(false);
  });

  it('treats market skills as LobeHub remote dependencies', () => {
    expect(isRemoteMarketSkill()).toBe(true);
    expect(isMarketAgentSkill({ source: 'market' })).toBe(true);
    expect(isMarketAgentSkill({ source: 'user' })).toBe(false);
  });

  it('hides remote items from non-admin users and keeps them for admins', () => {
    const items = [
      { id: 'local', remote: false },
      { id: 'remote', remote: true },
    ];

    expect(filterLobeHubRemoteItems(items, false, (item) => item.remote).map((item) => item.id))
      .toEqual(['local']);
    expect(filterLobeHubRemoteItems(items, true, (item) => item.remote).map((item) => item.id))
      .toEqual(['local', 'remote']);
  });
});
