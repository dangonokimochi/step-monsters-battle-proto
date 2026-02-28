import { useRef, useEffect, useState } from 'react';
import { getTerrainSprite } from '../data/terrain-sprites';
import type { TerrainType } from '../types';

interface TerrainTileProps {
  terrain: TerrainType;
  cellSize: number;
}

export function TerrainTile({ terrain, cellSize }: TerrainTileProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(0);
  const spriteRef = useRef(getTerrainSprite(terrain));

  // フレームアニメーション
  useEffect(() => {
    const sprite = getTerrainSprite(terrain);
    spriteRef.current = sprite;
    if (!sprite || sprite.frames.length <= 1) return;

    const offset = Math.random() * sprite.frameDuration;
    let timer: ReturnType<typeof setTimeout>;

    const loop = () => {
      timer = setTimeout(() => {
        setFrame((prev) => (prev + 1) % sprite.frames.length);
        loop();
      }, sprite.frameDuration);
    };

    timer = setTimeout(() => {
      setFrame(1);
      loop();
    }, offset);

    return () => clearTimeout(timer);
  }, [terrain]);

  // Canvas描画
  useEffect(() => {
    const canvas = canvasRef.current;
    const sprite = spriteRef.current;
    if (!canvas || !sprite) return;

    canvas.width = sprite.width;
    canvas.height = sprite.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, sprite.width, sprite.height);

    const frameData = sprite.frames[frame % sprite.frames.length];
    if (!frameData) return;

    for (let y = 0; y < sprite.height; y++) {
      for (let x = 0; x < sprite.width; x++) {
        const color = frameData[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
  }, [frame, terrain]);

  return (
    <canvas
      ref={canvasRef}
      className="terrain-canvas"
      style={{
        width: cellSize,
        height: cellSize,
        imageRendering: 'pixelated',
      }}
    />
  );
}
