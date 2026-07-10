import { type DiscoverAssistantItem } from '@/types/discover';

export const RESTRICTED_ASSISTANT_TAG = '限制级';

const RESTRICTED_ASSISTANT_PATTERNS = [
  /jailbreak/i,
  /\bdan\b/i,
  /uncensored/i,
  /unfiltered/i,
  /bypass\s+(safety|limits?|restrictions?)/i,
  /without\s+(ethical|moral|safety)\s+(limits?|restrictions?|constraints?)/i,
  /越狱/,
  /无审查/,
  /无过滤/,
  /突破限制/,
  /绕过限制/,
  /绕过安全/,
  /不受道德限制/,
  /无道德限制/,
];

const toSearchText = (item: Partial<DiscoverAssistantItem>) =>
  [item.identifier, item.title, item.description, item.config?.systemRole]
    .filter(Boolean)
    .join('\n');

export const isAutoRestrictedAssistant = (item: Partial<DiscoverAssistantItem>) => {
  const text = toSearchText(item);

  return RESTRICTED_ASSISTANT_PATTERNS.some((pattern) => pattern.test(text));
};

export const resolveAssistantRestriction = (
  item: Partial<DiscoverAssistantItem>,
  manualRestrictions: Record<string, boolean> = {},
) => {
  if (
    item.identifier &&
    Object.prototype.hasOwnProperty.call(manualRestrictions, item.identifier)
  ) {
    return manualRestrictions[item.identifier];
  }

  return isAutoRestrictedAssistant(item);
};
