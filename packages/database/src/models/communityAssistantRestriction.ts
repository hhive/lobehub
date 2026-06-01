import { and, eq, inArray } from 'drizzle-orm';

import { communityAssistantRestrictions } from '../schemas';
import type { LobeChatDatabase } from '../type';

export interface ListCommunityAssistantRestrictionsParams {
  identifiers: string[];
  source?: string;
}

export interface UpsertCommunityAssistantRestrictionParams {
  identifier: string;
  reason?: string;
  restricted: boolean;
  source?: string;
  updatedBy: string;
}

export class CommunityAssistantRestrictionModel {
  constructor(private db: LobeChatDatabase) {}

  list = async ({ identifiers, source = 'new' }: ListCommunityAssistantRestrictionsParams) => {
    if (identifiers.length === 0) return [];

    return this.db.query.communityAssistantRestrictions.findMany({
      where: and(
        eq(communityAssistantRestrictions.source, source),
        inArray(communityAssistantRestrictions.identifier, identifiers),
      ),
    });
  };

  upsert = async ({
    identifier,
    reason,
    restricted,
    source = 'new',
    updatedBy,
  }: UpsertCommunityAssistantRestrictionParams) => {
    const now = new Date();

    const [item] = await this.db
      .insert(communityAssistantRestrictions)
      .values({
        identifier,
        reason,
        restricted,
        source,
        updatedBy,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        set: {
          reason,
          restricted,
          updatedBy,
          updatedAt: now,
        },
        target: [communityAssistantRestrictions.identifier, communityAssistantRestrictions.source],
      })
      .returning();

    return item;
  };
}
