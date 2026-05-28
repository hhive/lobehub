import { type AvatarProps } from '@lobehub/ui';
import { Avatar } from '@lobehub/ui';
import { memo } from 'react';

interface GitHubAvatarProps extends Omit<AvatarProps, 'avatar'> {
  username: string;
}

const GitHubAvatar = memo<GitHubAvatarProps>(({ username, size = 24 }) => {
  return <Avatar alt={username} avatar={undefined} shape={'square'} size={size} />;
});

export default GitHubAvatar;
