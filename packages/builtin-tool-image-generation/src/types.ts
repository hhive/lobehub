export const ImageGenerationIdentifier = 'lobe-image-generation';

export const ImageGenerationApiName = {
  generateImage: 'generate_image',
} as const;

export type ImageGenerationApiNameType =
  (typeof ImageGenerationApiName)[keyof typeof ImageGenerationApiName];

export type ImageGenerationShape = 'landscape' | 'portrait' | 'square';

export interface GenerateImageParams {
  prompt: string;
  reference_image_file_ids?: string[];
  shape?: ImageGenerationShape;
}

export interface GeneratedImage {
  alt?: string;
  fileId: string;
  height?: number;
  model?: string;
  provider?: string;
  url: string;
  width?: number;
}

export interface GenerateImageState {
  images?: GeneratedImage[];
}
