'use client';

import { Button, Icon } from '@lobehub/ui';
import { Store } from 'lucide-react';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { createSkillStoreModal } from '@/features/SkillStore';
import SettingHeader from '@/routes/(main)/settings/features/SettingHeader';
import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

import SkillList from './features/SkillList';

const Page = () => {
  const { t } = useTranslation('setting');
  const isAdmin = useUserStore((s) => userProfileSelectors.isAdmin(s));

  const handleOpenStore = useCallback(() => {
    createSkillStoreModal();
  }, []);

  return (
    <>
      <SettingHeader
        title={t('tab.skill')}
        extra={
          isAdmin ? (
          <Button icon={<Icon icon={Store} />} size="large" onClick={handleOpenStore}>
            {t('skillStore.button')}
          </Button>
          ) : null
        }
      />
      <SkillList />
    </>
  );
};

Page.displayName = 'SkillsSetting';

export default Page;
