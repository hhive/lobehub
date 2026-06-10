import { describe, expect, it } from 'vitest';

import { assertCurrentUserIsAdmin } from './communityAssistantRestriction';

describe('community assistant restriction router helpers', () => {
  it('rejects non-admin users from writing restriction marks', async () => {
    const db = {
      query: {
        users: {
          findFirst: async () => ({ role: 'user' }),
        },
      },
    };

    await expect(assertCurrentUserIsAdmin(db as any, 'user-1')).rejects.toEqual(
      expect.objectContaining({ code: 'FORBIDDEN' }),
    );
  });

  it('allows admin users to write restriction marks', async () => {
    const db = {
      query: {
        users: {
          findFirst: async () => ({ role: 'admin' }),
        },
      },
    };

    await expect(assertCurrentUserIsAdmin(db as any, 'admin-1')).resolves.toBeUndefined();
  });
});
