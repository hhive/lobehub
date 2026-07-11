'use client';

import type { BuiltinInspectorProps } from '@lobechat/types';
import { ImageIcon } from 'lucide-react';
import { memo } from 'react';

import type { GenerateImageParams, GenerateImageState } from '../../types';

export const GenerateImageInspector = memo<
  BuiltinInspectorProps<GenerateImageParams, GenerateImageState>
>(({ args, partialArgs, isArgumentsStreaming, isLoading, pluginState }) => {
  const prompt = args?.prompt || partialArgs?.prompt;
  const imageCount = pluginState?.images?.length ?? 0;

  return (
    <div
      data-loading={isArgumentsStreaming || isLoading ? 'true' : undefined}
      style={{ alignItems: 'center', display: 'flex', gap: 6, minWidth: 0 }}
    >
      <ImageIcon aria-hidden size={16} />
      <span>Generate image</span>
      {prompt && (
        <span
          title={prompt}
          style={{
            maxWidth: 320,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {prompt}
        </span>
      )}
      {imageCount > 0 && <span aria-label="generated image count">({imageCount})</span>}
    </div>
  );
});

GenerateImageInspector.displayName = 'GenerateImageInspector';
