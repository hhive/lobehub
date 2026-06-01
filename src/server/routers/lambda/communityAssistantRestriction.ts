import { TRPCError } from '@trpc/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { CommunityAssistantRestrictionModel } from '@/database/models/communityAssistantRestriction';
import { users } from '@/database/schemas';
import { authedProcedure, router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';

const DEFAULT_SOURCE = 'new';

export const assertCurrentUserIsAdmin = async (
  serverDB: any,
  userId: string,
): Promise<void> => {
  const user = await serverDB.query.users.findFirst({
    columns: { role: true },
    where: eq(users.id, userId),
  });

  if (user?.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'ADMIN_ONLY' });
  }
};

const communityAssistantRestrictionProcedure = authedProcedure
  .use(serverDatabase)
  .use(async ({ ctx, next }) => {
    return next({
      ctx: {
        communityAssistantRestrictionModel: new CommunityAssistantRestrictionModel(ctx.serverDB),
      },
    });
  });

export const communityAssistantRestrictionRouter = router({
  list: communityAssistantRestrictionProcedure
    .input(
      z.object({
        identifiers: z.array(z.string()).max(100),
        source: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const items = await ctx.communityAssistantRestrictionModel.list({
        identifiers: input.identifiers,
        source: input.source || DEFAULT_SOURCE,
      });

      return Object.fromEntries(items.map((item) => [item.identifier, item.restricted]));
    }),

  setRestricted: communityAssistantRestrictionProcedure
    .input(
      z.object({
        identifier: z.string().min(1),
        reason: z.string().optional(),
        restricted: z.boolean(),
        source: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await assertCurrentUserIsAdmin(ctx.serverDB, ctx.userId);

      return ctx.communityAssistantRestrictionModel.upsert({
        identifier: input.identifier,
        reason: input.reason,
        restricted: input.restricted,
        source: input.source || DEFAULT_SOURCE,
        updatedBy: ctx.userId,
      });
    }),
});

export type CommunityAssistantRestrictionRouter = typeof communityAssistantRestrictionRouter;
