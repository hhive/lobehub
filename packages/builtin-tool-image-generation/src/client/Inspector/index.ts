import type { BuiltinInspector } from '@lobechat/types';

import { ImageGenerationApiName } from '../../types';
import { GenerateImageInspector } from './GenerateImage';

export const ImageGenerationInspectors: Record<string, BuiltinInspector> = {
  [ImageGenerationApiName.generateImage]: GenerateImageInspector as BuiltinInspector,
};

export { GenerateImageInspector };
