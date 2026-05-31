'use client';

import { Flexbox } from '@lobehub/ui';
import { memo } from 'react';
import urlJoin from 'url-join';

import { AGENTS_OFFICIAL_URL } from '@/const/url';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

import ShareButton from '../../../../features/ShareButton';
import { useDetailContext } from '../../DetailProvider';
import AddAgent from './AddAgent';
import ForkAndChat from './ForkAndChat';

const ActionButton = memo<{ mobile?: boolean }>(({ mobile }) => {
  const { avatar, description, tags, title, identifier } = useDetailContext();
  const isAdmin = useUserStore((s) => userProfileSelectors.isAdmin(s));

  return (
    <Flexbox gap={8}>
      <AddAgent mobile={mobile} />
      <Flexbox horizontal align={'center'} gap={8}>
        {isAdmin && <ForkAndChat mobile={mobile} />}
        <ShareButton
          meta={{
            avatar,
            desc: description,
            hashtags: tags,
            title,
            url: urlJoin(AGENTS_OFFICIAL_URL, identifier as string),
          }}
        />
      </Flexbox>
    </Flexbox>
  );
});

export default ActionButton;
