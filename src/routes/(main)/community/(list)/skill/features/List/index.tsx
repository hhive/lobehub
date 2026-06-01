'use client';

import { Grid } from '@lobehub/ui';
import { memo, useMemo } from 'react';

import {
  filterLobeHubRemoteItems,
  isRemoteMarketSkill,
} from '@/features/SkillStore/SkillList/lobehubRemote';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';
import { type DiscoverSkillItem } from '@/types/discover';

import SkillEmpty from '../../../../features/SkillEmpty';
import Item from './Item';

interface SkillListProps {
  data?: DiscoverSkillItem[];
  rows?: number;
}

const SkillList = memo<SkillListProps>(({ data = [], rows = 3 }) => {
  const isAdmin = useUserStore((s) => userProfileSelectors.isAdmin(s));
  const visibleData = useMemo(
    () => filterLobeHubRemoteItems(data, isAdmin, isRemoteMarketSkill),
    [data, isAdmin],
  );

  if (visibleData.length === 0) return <SkillEmpty />;

  return (
    <Grid rows={rows} width={'100%'}>
      {visibleData.map((item, index) => (
        <Item key={index} showLobeHubTag={isRemoteMarketSkill(item)} {...item} />
      ))}
    </Grid>
  );
});

export default SkillList;
