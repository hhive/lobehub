'use client';

import type { BuiltinRenderProps } from '@lobechat/types';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

import type { GenerateImageParams, GenerateImageState } from '../../types';

const styles = createStaticStyles(({ css, cssVar }) => ({
  caption: css`
    overflow: hidden;
    padding: 8px 10px;
    font-size: 12px;
    color: ${cssVar.colorTextSecondary};
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  grid: css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr));
    gap: 12px;
    width: 100%;
  `,
  image: css`
    display: block;
    width: 100%;
    height: auto;
    max-height: 640px;
    object-fit: contain;
    background: ${cssVar.colorFillQuaternary};
  `,
  item: css`
    overflow: hidden;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 8px;
    background: ${cssVar.colorBgContainer};
  `,
}));

const GenerateImageRender = memo<BuiltinRenderProps<GenerateImageParams, GenerateImageState>>(
  ({ args, pluginState }) => {
    const images = pluginState?.images;

    if (!images?.length) return null;

    return (
      <div className={styles.grid}>
        {images.map((image) => {
          const alt = image.alt || args?.prompt || 'Generated image';
          const source = [image.provider, image.model].filter(Boolean).join(' / ');

          return (
            <figure className={styles.item} key={image.fileId} style={{ margin: 0 }}>
              <a href={image.url} rel="noreferrer" target="_blank">
                <img
                  alt={alt}
                  className={styles.image}
                  height={image.height}
                  src={image.url}
                  width={image.width}
                />
              </a>
              {(image.alt || source) && (
                <figcaption
                  className={styles.caption}
                  title={[image.alt, source].filter(Boolean).join(' - ')}
                >
                  {[image.alt, source].filter(Boolean).join(' - ')}
                </figcaption>
              )}
            </figure>
          );
        })}
      </div>
    );
  },
);

GenerateImageRender.displayName = 'GenerateImageRender';

export default GenerateImageRender;
