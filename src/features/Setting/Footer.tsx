import { type PropsWithChildren } from 'react';
import { memo } from 'react';

export const LayoutSettingsFooterClassName = 'settings-layout-footer';

const Footer = memo<PropsWithChildren>(() => null);

Footer.displayName = 'SettingFooter';

export default Footer;
