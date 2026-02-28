import { useRef, useEffect, useState } from 'react';
import { getSprite } from '../data/pixel-sprites';

interface PixelSpriteProps {
  speciesId: string;
  size: number;
  flip?: boolean;
  className?: string;
}

export function PixelSprite({ speciesId, size, flip, className }: PixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);
  const spriteRef = useRef(getSprite(speciesId));

  // フレームアニメーションループ
  useEffect(() => {
    const sprite = getSprite(speciesId);
    spriteRef.current = sprite;
    if (!sprite || sprite.frames.length <= 1) return;

    // 各モンスターの開始タイミングをランダムにずらす
    const offset = Math.random() * sprite.frameDuration;
    let timer: ReturnType<typeof setTimeout>;

    const startLoop = () => {
      timer = setTimeout(() => {
        setFrame((prev) => (prev + 1) % sprite.frames.length);
        startLoop();
      }, sprite.frameDuration);
    };

    timer = setTimeout(() => {
      setFrame(1);
      startLoop();
    }, offset);

    return () => clearTimeout(timer);
  }, [speciesId]);

  // Canvas描画
  useEffect(() => {
    const canvas = canvasRef.current;
    const sprite = spriteRef.current;
    if (!canvas || !sprite) return;

    const frameData = sprite.frames[frame % sprite.frames.length];
    if (!frameData) return;

    canvas.width = sprite.width;
    canvas.height = sprite.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, sprite.width, sprite.height);

    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const color = frameData[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [frame, speciesId]);

  const classes = [className, flip ? 'sprite-flip' : ''].filter(Boolean).join(' ');

  return (
    <canvas
      ref={canvasRef}
      className={classes}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    />
  );
}
