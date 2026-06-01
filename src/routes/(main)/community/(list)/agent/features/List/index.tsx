'use client';

import { Grid } from '@lobehub/ui';
import { memo, useCallback, useMemo } from 'react';
import useSWR from 'swr';

import { useQuery } from '@/hooks/useQuery';
import { communityAssistantRestrictionService } from '@/services/communityAssistantRestriction';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';
import { type AssistantMarketSource, type DiscoverAssistantItem } from '@/types/discover';

import AssistantEmpty from '../../../../features/AssistantEmpty';
import Item from './Item';
import { resolveAssistantRestriction } from './restrictedAssistant';

export interface AssistantListProps {
  data?: DiscoverAssistantItem[];
  rows?: number;
}

const AssistantList = memo<AssistantListProps>(({ data = [], rows = 3 }) => {
  const isAdmin = useUserStore((s) => userProfileSelectors.isAdmin(s));
  const { source } = useQuery() as { source?: AssistantMarketSource };
  const marketSource = source || 'new';
  const identifiers = useMemo(() => data.map((item) => item.identifier).filter(Boolean), [data]);
  const { data: manualRestrictions = {}, mutate } = useSWR(
    identifiers.length > 0
      ? ['community-assistant-restrictions', marketSource, identifiers.join('|')]
      : null,
    () =>
      communityAssistantRestrictionService.list({
        identifiers,
        source: marketSource,
      }),
  );

  const visibleData = useMemo(
    () => data.filter((item) => isAdmin || !resolveAssistantRestriction(item, manualRestrictions)),
    [data, isAdmin, manualRestrictions],
  );

  const handleRestrictedChange = useCallback(
    async (identifier: string, restricted: boolean) => {
      await communityAssistantRestrictionService.setRestricted({
        identifier,
        restricted,
        source: marketSource,
      });
      await mutate({ ...manualRestrictions, [identifier]: restricted }, { revalidate: false });
    },
    [manualRestrictions, marketSource, mutate],
  );

  if (visibleData.length === 0) return <AssistantEmpty />;

  return (
    <Grid rows={rows} width={'100%'}>
      {visibleData.map((item, index) => (
        <Item
          key={index}
          restricted={resolveAssistantRestriction(item, manualRestrictions)}
          showRestrictedTag={resolveAssistantRestriction(item, manualRestrictions)}
          onRestrictedChange={
            isAdmin
              ? (restricted) => handleRestrictedChange(item.identifier, restricted)
              : undefined
          }
          {...item}
        />
      ))}
    </Grid>
  );
});

export default AssistantList;
