import { useRef, useEffect } from 'react';
import { getSprite } from '../data/pixel-sprites';

interface PixelSpriteProps {
  speciesId: string;
  size: number; // 描画サイズ（px）
  flip?: boolean; // 左右反転（敵チーム用）
  className?: string;
}

export function PixelSprite({ speciesId, size, flip, className }: PixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const sprite = getSprite(speciesId);
    if (!sprite) return;

    canvas.width = sprite.width;
    canvas.height = sprite.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, sprite.width, sprite.height);

    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const color = sprite.pixels[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [speciesId]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        transform: flip ? 'scaleX(-1)' : undefined,
      }}
    />
  );
}
