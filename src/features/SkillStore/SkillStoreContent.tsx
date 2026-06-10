'use client';

import { Flexbox, Segmented } from '@lobehub/ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/slices/auth/selectors';

import Search from './Search';
import AddSkillButton from './SkillList/AddSkillButton';
import CustomList from './SkillList/Custom';
import LobeHubList from './SkillList/LobeHub';
import MarketSkillList from './SkillList/MarketSkills';
import MCPList from './SkillList/MCP';

export enum SkillStoreTab {
  Custom = 'custom',
  LobeHub = 'lobehub',
  MCP = 'mcp',
  Skills = 'skills',
}

export const SkillStoreContent = () => {
  const { t } = useTranslation('setting');
  const isAdmin = useUserStore((s) => userProfileSelectors.isAdmin(s));
  const [activeTab, setActiveTab] = useState<SkillStoreTab>(SkillStoreTab.LobeHub);
  const [lobehubKeywords, setLobehubKeywords] = useState('');
  const [skillKeywords, setSkillKeywords] = useState('');

  const isLobeHub = activeTab === SkillStoreTab.LobeHub;
  const isSkills = activeTab === SkillStoreTab.Skills;
  const isMCP = activeTab === SkillStoreTab.MCP;
  const isCustom = activeTab === SkillStoreTab.Custom;

  return (
    <Flexbox gap={8} style={{ maxHeight: '75vh' }} width={'100%'}>
      <Flexbox gap={8}>
        <Flexbox horizontal align={'center'} gap={8}>
          <Segmented
            block
            style={{ flex: 1 }}
            value={activeTab}
            variant={'filled'}
            options={
              isAdmin
                ? [
                    { label: t('skillStore.tabs.lobehub'), value: SkillStoreTab.LobeHub },
                    { label: t('skillStore.tabs.skills'), value: SkillStoreTab.Skills },
                    { label: t('skillStore.tabs.mcp'), value: SkillStoreTab.MCP },
                    { label: t('skillStore.tabs.custom'), value: SkillStoreTab.Custom },
                  ]
                : [{ label: t('skillStore.tabs.lobehub'), value: SkillStoreTab.LobeHub }]
            }
            onChange={(v) => setActiveTab(v as SkillStoreTab)}
          />
          {isAdmin && <AddSkillButton />}
        </Flexbox>
        <Search
          activeTab={activeTab}
          onLobeHubSearch={setLobehubKeywords}
          onSkillSearch={setSkillKeywords}
        />
      </Flexbox>
      <Flexbox height={496} style={{ marginBlockEnd: -12, marginInline: -16 }}>
        <Flexbox flex={1} style={{ display: isLobeHub ? 'flex' : 'none', overflow: 'auto' }}>
          <LobeHubList keywords={lobehubKeywords} />
        </Flexbox>
        {isAdmin && (
          <Flexbox flex={1} style={{ display: isSkills ? 'flex' : 'none', overflow: 'auto' }}>
          <MarketSkillList keywords={skillKeywords} />
          </Flexbox>
        )}
        {isAdmin && (
          <Flexbox flex={1} style={{ display: isMCP ? 'flex' : 'none', overflow: 'auto' }}>
            <MCPList />
          </Flexbox>
        )}
        {isAdmin && (
          <Flexbox flex={1} style={{ display: isCustom ? 'flex' : 'none', overflow: 'auto' }}>
          <CustomList />
          </Flexbox>
        )}
      </Flexbox>
    </Flexbox>
  );
};
