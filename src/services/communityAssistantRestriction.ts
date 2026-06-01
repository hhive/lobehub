import { lambdaClient } from '@/libs/trpc/client';

export interface ListCommunityAssistantRestrictionParams {
  identifiers: string[];
  source?: string;
}

export interface SetCommunityAssistantRestrictionParams {
  identifier: string;
  reason?: string;
  restricted: boolean;
  source?: string;
}

class CommunityAssistantRestrictionService {
  list = async (params: ListCommunityAssistantRestrictionParams) => {
    return lambdaClient.communityAssistantRestriction.list.query(params, {
      context: { showNotification: false },
    });
  };

  setRestricted = async (params: SetCommunityAssistantRestrictionParams) => {
    return lambdaClient.communityAssistantRestriction.setRestricted.mutate(params);
  };
}

export const communityAssistantRestrictionService = new CommunityAssistantRestrictionService();
