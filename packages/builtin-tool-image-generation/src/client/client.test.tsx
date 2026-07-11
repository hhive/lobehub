/**
 * @vitest-environment happy-dom
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GenerateImageInspector } from './Inspector';
import { GenerateImageRender } from './Render';

vi.mock('lucide-react', () => ({
  ImageIcon: () => <span data-testid="image-icon" />,
}));

vi.mock('antd-style', () => ({
  createStaticStyles: () => new Proxy({}, { get: (_target, property) => String(property) }),
}));

const renderProps = { content: '', messageId: 'message-test' };

describe('image generation client components', () => {
  afterEach(cleanup);

  it('shows streaming prompt details in the inspector', () => {
    render(
      <GenerateImageInspector
        {...renderProps}
        isArgumentsStreaming
        apiName="generate_image"
        args={{ prompt: '' }}
        identifier="lobe-image-generation"
        partialArgs={{ prompt: 'Warm nostalgic city street' }}
      />,
    );

    expect(screen.getByText('Generate image')).toBeTruthy();
    expect(screen.getByText('Warm nostalgic city street')).toBeTruthy();
    expect(screen.getByTestId('image-icon')).toBeTruthy();
  });

  it('renders images and provider metadata from runtime state', () => {
    render(
      <GenerateImageRender
        {...renderProps}
        args={{ prompt: 'Fallback alt text', shape: 'landscape' }}
        pluginState={{
          images: [
            {
              alt: 'First result',
              fileId: 'file-1',
              height: 1024,
              model: 'gpt-image-2',
              provider: 'openai',
              url: '/files/file-1',
              width: 1536,
            },
            { fileId: 'file-2', url: '/files/file-2' },
          ],
        }}
      />,
    );

    const images = screen.getAllByRole('img') as HTMLImageElement[];
    expect(images).toHaveLength(2);
    expect(images[0].src).toContain('/files/file-1');
    expect(images[0].alt).toBe('First result');
    expect(images[0].width).toBe(1536);
    expect(images[0].height).toBe(1024);
    expect(images[1].alt).toBe('Fallback alt text');
    expect(screen.getByText('First result - openai / gpt-image-2')).toBeTruthy();
  });

  it('renders nothing when runtime state has no images', () => {
    const { container } = render(
      <GenerateImageRender {...renderProps} args={{ prompt: 'Nothing yet' }} pluginState={{}} />,
    );

    expect(container.innerHTML).toBe('');
  });
});
