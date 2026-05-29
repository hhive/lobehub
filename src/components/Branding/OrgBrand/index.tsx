import { ORG_NAME } from '@lobechat/business-const';
import { type LobeHubProps } from '@lobehub/ui/brand';
import { memo } from 'react';

export const OrgBrand = memo<LobeHubProps>(({ className, style }) => {
  return (
    <span className={className} style={style}>
      {ORG_NAME}
    </span>
  );
});
