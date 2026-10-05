import colors from '@/constants/colors';

function luminance(color: string): number {
  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(color.slice(offset, offset + 2), 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

export function getContrastTextColor(background: string): string {
  const brightness = luminance(background);
  const darkContrast = (brightness + 0.05) / (luminance(colors.textPrimary) + 0.05);
  const lightContrast = 1.05 / (brightness + 0.05);
  if (darkContrast < 4.5 && lightContrast < 4.5) {
    return getReadableAccent(colors.textPrimary, background);
  }
  return darkContrast >= lightContrast ? colors.textPrimary : colors.surface;
}

export function getReadableAccent(color: string, background: string = colors.canvasMuted): string {
  const backgroundLuminance = luminance(background);
  const channels = [1, 3, 5].map((offset) => parseInt(color.slice(offset, offset + 2), 16));
  let candidate = color;
  for (let step = 0; step < 100; step += 1) {
    const candidateLuminance = luminance(candidate);
    const contrast = (Math.max(backgroundLuminance, candidateLuminance) + 0.05)
      / (Math.min(backgroundLuminance, candidateLuminance) + 0.05);
    if (contrast >= 4.5) return candidate;
    candidate = '#' + channels.map((channel) =>
      Math.round(channel * (1 - (step + 1) / 100)).toString(16).padStart(2, '0')
    ).join('');
  }
  return colors.textPrimary;
}
