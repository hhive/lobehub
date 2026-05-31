export const LOBEHUB_REMOTE_TAG = '远程';

export const isLobeHubRemoteMcp = (item?: Record<string, any>) =>
  Boolean(item?.cloudEndPoint || item?.haveCloudEndpoint);

export const isRemoteMarketSkill = () => true;

export const isMarketAgentSkill = (skill?: { source?: string }) => skill?.source === 'market';

export const filterLobeHubRemoteItems = <T>(
  items: T[],
  isAdmin: boolean,
  isRemote: (item: T) => boolean,
) => (isAdmin ? items : items.filter((item) => !isRemote(item)));
