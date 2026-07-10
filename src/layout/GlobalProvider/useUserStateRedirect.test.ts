import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { type UserInitializationState } from '@/types/user';

import { useWebUserStateRedirect } from './useUserStateRedirect';

describe('useWebUserStateRedirect', () => {
  it('keeps the current location when onboarding redirects are disabled', () => {
    const { result } = renderHook(() => useWebUserStateRedirect());
    const currentUrl = window.location.href;

    act(() => {
      result.current({} as UserInitializationState);
    });

    expect(window.location.href).toBe(currentUrl);
  });
});
