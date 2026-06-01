'use client';

import { Grid } from '@lobehub/ui';
import { memo, useMemo } from 'react';

import {
  filterLobeHubRemoteItems,
  isLobeHubRemoteMcp,
} from '@/features/SkillStore/SkillList/lobehubRemote';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';
import { type DiscoverMcpItem } from '@/types/discover';

import McpEmpty from '../../../../features/McpEmpty';
import Item from './Item';

interface McpListProps {
  data?: DiscoverMcpItem[];
  rows?: number;
}

const McpList = memo<McpListProps>(({ data = [], rows = 3 }) => {
  const isAdmin = useUserStore((s) => userProfileSelectors.isAdmin(s));
  const visibleData = useMemo(
    () => filterLobeHubRemoteItems(data, isAdmin, isLobeHubRemoteMcp),
    [data, isAdmin],
  );

  if (visibleData.length === 0) return <McpEmpty />;

  return (
    <Grid rows={rows} width={'100%'}>
      {visibleData.map((item, index) => (
        <Item key={index} showLobeHubTag={isLobeHubRemoteMcp(item)} {...item} />
      ))}
    </Grid>
  );
});

export default McpList;
