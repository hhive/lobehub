import { ImageGenerationApiName } from '../../types';
import GenerateImageRender from './GenerateImage';

export const ImageGenerationRenders = {
  [ImageGenerationApiName.generateImage]: GenerateImageRender,
};

export { default as GenerateImageRender } from './GenerateImage';
