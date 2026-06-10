import { type ToolManifest } from '@lobechat/types';
import { z } from 'zod';

import { withScopedPermission } from '@/business/server/trpc-middlewares/rbacPermission';
import { wsCompatProcedure } from '@/business/server/trpc-middlewares/workspaceAuth';
import { PluginModel } from '@/database/models/plugin';
import { getKlavisClient } from '@/libs/klavis';
import { router } from '@/libs/trpc/lambda';
import { serverDatabase } from '@/libs/trpc/lambda/middleware';

/**
 * Klavis procedure with API key validation and database access
 */
const klavisProcedure = wsCompatProcedure.use(serverDatabase).use(async (opts) => {
  if (process.env.DISABLE_LOBEHUB_MARKET_TOOLS === '1') {
    return opts.next({
      ctx: { ...opts.ctx, klavisClient: null, pluginModel: null },
    });
  }

  const client = getKlavisClient();
  const wsId = opts.ctx.workspaceId ?? undefined;
  const pluginModel = new PluginModel(opts.ctx.serverDB, opts.ctx.userId, wsId);

  return opts.next({
    ctx: { ...opts.ctx, klavisClient: client, pluginModel },
  });
});

const getEnabledKlavisContext = (ctx: {
  klavisClient: ReturnType<typeof getKlavisClient> | null;
  pluginModel: PluginModel | null;
}) => {
  if (!ctx.klavisClient || !ctx.pluginModel) {
    throw new Error('Klavis tools are disabled');
  }

  return {
    klavisClient: ctx.klavisClient,
    pluginModel: ctx.pluginModel,
  };
};

export const klavisRouter = router({
  /**
   * Create a single MCP server instance and save to database
   * Returns: { serverUrl, instanceId, oauthUrl?, identifier, serverName }
   */
  createServerInstance: klavisProcedure
    .use(withScopedPermission('agent:update'))
    .input(
      z.object({
        /** Identifier for storage (e.g., 'google-calendar') */
        identifier: z.string(),
        /** Server name for Klavis API (e.g., 'Google Calendar') */
        serverName: z.string(),
        userId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { klavisClient, pluginModel } = getEnabledKlavisContext(ctx);
      const { serverName, userId, identifier } = input;

      // Create a single server instance
      const response = await klavisClient.mcpServer.createServerInstance({
        serverName: serverName as any,
        userId,
      });

      const { serverUrl, instanceId, oauthUrl } = response;

      // Get the tool list for this server
      const toolsResponse = await klavisClient.mcpServer.getTools(serverName as any);
      const tools = toolsResponse.tools || [];

      // Save to database using the provided identifier (format: lowercase, spaces replaced with hyphens)
      const manifest: ToolManifest = {
        api: tools.map((tool: any) => ({
          description: tool.description || '',
          name: tool.name,
          parameters: tool.inputSchema || { properties: {}, type: 'object' },
        })),
        identifier,
        meta: {
          avatar: '🔌',
          description: `LobeHub Mcp Server: ${serverName}`,
          title: serverName,
        },
        type: 'default',
      };

      // Save to database with oauthUrl and isAuthenticated status
      const isAuthenticated = !oauthUrl; // If there's no oauthUrl, authentication is not required or already authenticated
      await pluginModel.create({
        customParams: {
          klavis: {
            instanceId,
            isAuthenticated,
            oauthUrl,
            serverName,
            serverUrl,
          },
        },
        identifier,
        manifest,
        source: 'klavis',
        type: 'plugin',
      });

      return {
        identifier,
        instanceId,
        isAuthenticated,
        oauthUrl,
        serverName,
        serverUrl,
      };
    }),

  /**
   * Delete a server instance
   */
  deleteServerInstance: klavisProcedure
    .use(withScopedPermission('agent:update'))
    .input(
      z.object({
        /** Identifier for storage (e.g., 'google-calendar') */
        identifier: z.string(),
        instanceId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { klavisClient, pluginModel } = getEnabledKlavisContext(ctx);
      // Call Klavis API to delete server instance
      await klavisClient.mcpServer.deleteServerInstance(input.instanceId);

      // Delete from database (using identifier)
      await pluginModel.delete(input.identifier);

      return { success: true };
    }),

  /**
   * Get Klavis plugins from database
   */
  getKlavisPlugins: klavisProcedure.query(async ({ ctx }) => {
    if (process.env.DISABLE_LOBEHUB_MARKET_TOOLS === '1') return [];

    const { pluginModel } = getEnabledKlavisContext(ctx);
    const allPlugins = await pluginModel.query();
    // Filter plugins that have klavis customParams
    return allPlugins.filter((plugin: any) => plugin.customParams?.klavis);
  }),

  /**
   * Get server instance status from Klavis API
   * Returns error object instead of throwing on auth errors (useful for polling)
   */
  getServerInstance: klavisProcedure
    .input(
      z.object({
        instanceId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { klavisClient } = getEnabledKlavisContext(ctx);
      try {
        const response = await klavisClient.mcpServer.getServerInstance(input.instanceId);
        return {
          authNeeded: response.authNeeded,
          error: undefined,
          externalUserId: response.externalUserId,
          instanceId: response.instanceId,
          isAuthenticated: response.isAuthenticated,
          oauthUrl: response.oauthUrl,
          platform: response.platform,
          serverName: response.serverName,
        };
      } catch (error) {
        // Check if this is an authentication error
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isAuthError =
          errorMessage.includes('Invalid API key or instance ID') ||
          errorMessage.includes('Status code: 401');

        // For auth errors, return error object instead of throwing
        // This prevents 500 errors in logs during polling
        if (isAuthError) {
          return {
            authNeeded: true,
            error: 'AUTH_ERROR',
            externalUserId: undefined,
            instanceId: input.instanceId,
            isAuthenticated: false,
            oauthUrl: undefined,
            platform: undefined,
            serverName: undefined,
          };
        }

        // For other errors, still throw
        throw error;
      }
    }),

  getUserIntergrations: klavisProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const { klavisClient } = getEnabledKlavisContext(ctx);
      const response = await klavisClient.user.getUserIntegrations(input.userId);

      return {
        integrations: response.integrations,
      };
    }),

  /**
   * Remove Klavis plugin from database by identifier
   */
  removeKlavisPlugin: klavisProcedure
    .use(withScopedPermission('agent:update'))
    .input(
      z.object({
        /** Identifier for storage (e.g., 'google-calendar') */
        identifier: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { pluginModel } = getEnabledKlavisContext(ctx);
      await pluginModel.delete(input.identifier);
      return { success: true };
    }),

  /**
   * Update Klavis plugin with tools and auth status in database
   */
  updateKlavisPlugin: klavisProcedure
    .use(withScopedPermission('agent:update'))
    .input(
      z.object({
        /** Identifier for storage (e.g., 'google-calendar') */
        identifier: z.string(),
        instanceId: z.string(),
        isAuthenticated: z.boolean(),
        oauthUrl: z.string().optional(),
        /** Server name for Klavis API (e.g., 'Google Calendar') */
        serverName: z.string(),
        serverUrl: z.string(),
        tools: z.array(
          z.object({
            description: z.string().optional(),
            inputSchema: z.any().optional(),
            name: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { pluginModel } = getEnabledKlavisContext(ctx);
      const { identifier, serverName, serverUrl, instanceId, tools, isAuthenticated, oauthUrl } =
        input;

      // Get existing plugin (using identifier)
      const existingPlugin = await pluginModel.findById(identifier);

      // Build manifest containing all tools
      const manifest: ToolManifest = {
        api: tools.map((tool) => ({
          description: tool.description || '',
          name: tool.name,
          parameters: tool.inputSchema || { properties: {}, type: 'object' },
        })),
        identifier,
        meta: existingPlugin?.manifest?.meta || {
          avatar: '🔌',
          description: `LobeHub Mcp Server: ${serverName}`,
          title: serverName,
        },
        type: 'default',
      };

      const customParams = {
        klavis: {
          instanceId,
          isAuthenticated,
          oauthUrl,
          serverName,
          serverUrl,
        },
      };

      // Update or create plugin
      if (existingPlugin) {
        await pluginModel.update(identifier, { customParams, manifest });
      } else {
        await pluginModel.create({
          customParams,
          identifier,
          manifest,
          source: 'klavis',
          type: 'plugin',
        });
      }

      return { savedCount: tools.length };
    }),
});

export type KlavisRouter = typeof klavisRouter;
