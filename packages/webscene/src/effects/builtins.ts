import type { RGBA } from '../utils/types';
import { rgbaToCss } from '../utils/color';
import { clamp } from '../utils/math';
import type { EffectRegistry } from './registry';
import type { EffectHandler } from './types';
import type { Canvas2DContext } from '../render/context';

const colorParam = (value: unknown, fallback: RGBA): RGBA => {
  if (Array.isArray(value) && value.length === 4) {
    return [Number(value[0]), Number(value[1]), Number(value[2]), Number(value[3])] as const;
  }
  return fallback;
};

const numberParam = (value: unknown, fallback: number): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const drawSource = (ctx: Canvas2DContext, source: CanvasImageSource, width: number, height: number): void => {
  ctx.drawImage(source, 0, 0, width, height);
};

const blurEffect: EffectHandler = {
  type: 'blur',
  apply(targetCtx, effect, context) {
    const radius = clamp(numberParam(effect.params.radius, 2), 0, 120);
    targetCtx.save();
    targetCtx.filter = `blur(${radius}px)`;
    drawSource(targetCtx, context.source, context.width, context.height);
    targetCtx.restore();
  },
};

const glowEffect: EffectHandler = {
  type: 'glow',
  apply(targetCtx, effect, context) {
    const radius = clamp(numberParam(effect.params.radius, 8), 0, 120);
    const intensity = clamp(numberParam(effect.params.intensity, 0.65), 0, 1.5);
    const color = colorParam(effect.params.color, [255, 255, 255, 0.7]);

    drawSource(targetCtx, context.source, context.width, context.height);

    targetCtx.save();
    targetCtx.globalCompositeOperation = 'screen';
    targetCtx.filter = `blur(${radius}px)`;
    targetCtx.globalAlpha = intensity;
    drawSource(targetCtx, context.source, context.width, context.height);
    targetCtx.fillStyle = rgbaToCss(color);
    targetCtx.globalCompositeOperation = 'source-atop';
    targetCtx.fillRect(0, 0, context.width, context.height);
    targetCtx.restore();
  },
};

const vignetteEffect: EffectHandler = {
  type: 'vignette',
  apply(targetCtx, effect, context) {
    const strength = clamp(numberParam(effect.params.strength, 0.35), 0, 1);
    const color = colorParam(effect.params.color, [0, 0, 0, 1]);

    drawSource(targetCtx, context.source, context.width, context.height);

    const gradient = targetCtx.createRadialGradient(
      context.width * 0.5,
      context.height * 0.5,
      context.width * 0.2,
      context.width * 0.5,
      context.height * 0.5,
      Math.max(context.width, context.height) * 0.72,
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, rgbaToCss([color[0], color[1], color[2], strength]));

    targetCtx.save();
    targetCtx.globalCompositeOperation = 'multiply';
    targetCtx.fillStyle = gradient;
    targetCtx.fillRect(0, 0, context.width, context.height);
    targetCtx.restore();
  },
};

const colorOverlayEffect: EffectHandler = {
  type: 'colorOverlay',
  apply(targetCtx, effect, context) {
    const color = colorParam(effect.params.color, [255, 0, 0, 0.2]);
    drawSource(targetCtx, context.source, context.width, context.height);
    targetCtx.save();
    targetCtx.globalCompositeOperation = 'source-atop';
    targetCtx.fillStyle = rgbaToCss(color);
    targetCtx.fillRect(0, 0, context.width, context.height);
    targetCtx.restore();
  },
};

const dropShadowEffect: EffectHandler = {
  type: 'dropShadow',
  apply(targetCtx, effect, context) {
    const blur = clamp(numberParam(effect.params.blur, 6), 0, 120);
    const offsetX = numberParam(effect.params.offsetX, 5);
    const offsetY = numberParam(effect.params.offsetY, 5);
    const color = colorParam(effect.params.color, [0, 0, 0, 0.45]);

    targetCtx.save();
    targetCtx.shadowBlur = blur;
    targetCtx.shadowOffsetX = offsetX;
    targetCtx.shadowOffsetY = offsetY;
    targetCtx.shadowColor = rgbaToCss(color);
    drawSource(targetCtx, context.source, context.width, context.height);
    targetCtx.restore();

    drawSource(targetCtx, context.source, context.width, context.height);
  },
};

const strokeEffect: EffectHandler = {
  type: 'stroke',
  apply(targetCtx, effect, context) {
    const size = clamp(numberParam(effect.params.size, 2), 1, 12);
    const color = colorParam(effect.params.color, [0, 0, 0, 1]);
    const steps = Math.max(4, Math.ceil(size * 4));

    targetCtx.save();
    targetCtx.fillStyle = rgbaToCss(color);
    for (let i = 0; i < steps; i += 1) {
      const angle = (i / steps) * Math.PI * 2;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      targetCtx.drawImage(context.source, x, y, context.width, context.height);
    }
    targetCtx.globalCompositeOperation = 'destination-in';
    targetCtx.drawImage(context.source, 0, 0, context.width, context.height);
    targetCtx.restore();

    drawSource(targetCtx, context.source, context.width, context.height);
  },
};

export const registerBuiltInEffects = (registry: EffectRegistry): void => {
  registry.register(blurEffect);
  registry.register(glowEffect);
  registry.register(vignetteEffect);
  registry.register(colorOverlayEffect);
  registry.register(dropShadowEffect);
  registry.register(strokeEffect);
};
