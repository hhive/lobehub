import { DEFAULT_INBOX_AVATAR, DEFAULT_USER_AVATAR_URL } from '@lobechat/const';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ProductLogo } from './index';

describe('ProductLogo', () => {
  it('uses the 小逆chat brand asset for product and default avatars', () => {
    render(<ProductLogo size={24} type={'flat'} />);

    expect(screen.getByRole('img', { name: '小逆chat' })).toHaveAttribute(
      'src',
      '/icons/xiaoni-chat.png',
    );
    expect(DEFAULT_INBOX_AVATAR).toBe('/icons/xiaoni-chat.png');
    expect(DEFAULT_USER_AVATAR_URL).toBe('/icons/xiaoni-chat.png');
  });
});
