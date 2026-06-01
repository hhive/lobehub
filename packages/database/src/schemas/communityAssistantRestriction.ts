import { boolean, index, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';

import { createdAt, updatedAt } from './_helpers';
import { users } from './user';

export const communityAssistantRestrictions = pgTable(
  'community_assistant_restrictions',
  {
    identifier: text('identifier').notNull(),
    reason: text('reason'),
    restricted: boolean('restricted').default(true).notNull(),
    source: text('source').default('new').notNull(),
    updatedBy: text('updated_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.source] }),
    index('community_assistant_restrictions_identifier_idx').on(table.identifier),
    index('community_assistant_restrictions_source_idx').on(table.source),
    index('community_assistant_restrictions_restricted_idx').on(table.restricted),
  ],
);

export type CommunityAssistantRestrictionItem =
  typeof communityAssistantRestrictions.$inferSelect;
export type NewCommunityAssistantRestriction =
  typeof communityAssistantRestrictions.$inferInsert;
