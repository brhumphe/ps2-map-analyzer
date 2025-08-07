/**
 * Convert hex color to HSL color space
 * @param hex Hex color string (e.g. '#441c7a')
 * @returns Object with hue, saturation, and lightness
 */
export function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remove the # if present
  hex = hex.replace('#', '');

  // Convert hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0,
    l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h, s, l };
}

/**
 * Convert HSL to hex color
 * @param h Hue (0-1)
 * @param s Saturation (0-1)
 * @param l Lightness (0-1)
 * @returns Hex color string
 */
export function hslToHex(h: number, s: number, l: number): string {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToRgb(p, q, h + 1 / 3);
    g = hueToRgb(p, q, h);
    b = hueToRgb(p, q, h - 1 / 3);
  }

  return `#${Math.round(r * 255)
    .toString(16)
    .padStart(2, '0')}${Math.round(g * 255)
    .toString(16)
    .padStart(2, '0')}${Math.round(b * 255)
    .toString(16)
    .padStart(2, '0')}`;
}

/**
 * Helper function for HSL to RGB conversion
 */
export function hueToRgb(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/**
 * Set the absolute brightness of a color
 * @param color Hex color string
 * @param brightness Desired brightness (0-1)
 * @returns Hex color string with specified brightness
 */
export function setColorBrightness(color: string, brightness: number): string {
  // Ensure brightness is between 0 and 1
  brightness = Math.min(1, Math.max(0, brightness));

  // Convert to HSL
  const { h, s, l: originalL } = hexToHSL(color);

  // Create new color with specified brightness
  return hslToHex(h, s, brightness);
}

/**
 * Adjust the lightness and saturation of a hex color
 * @param hex Hex color string (e.g. '#441c7a')
 * @param lightnessAdjustment Amount to adjust lightness (-1 to 1, where -1 is black, 1 is white)
 * @param saturationAdjustment Amount to adjust saturation (-1 to 1, where -1 removes all color, 1 maximizes saturation)
 * @returns Hex color string with adjusted lightness and saturation
 */
export function adjustColorLightnessSaturation(
  hex: string,
  lightnessAdjustment: number = 0,
  saturationAdjustment: number = 0
): string {
  // Clamp adjustments to valid ranges
  lightnessAdjustment = Math.min(1, Math.max(-1, lightnessAdjustment));
  saturationAdjustment = Math.min(1, Math.max(-1, saturationAdjustment));

  // Convert to HSL
  const { h, s, l } = hexToHSL(hex);

  // Calculate new lightness
  let newLightness: number;
  if (lightnessAdjustment >= 0) {
    // Positive adjustment: blend towards white (1.0)
    newLightness = l + (1 - l) * lightnessAdjustment;
  } else {
    // Negative adjustment: blend towards black (0.0)
    newLightness = l + l * lightnessAdjustment;
  }

  // Calculate new saturation
  let newSaturation: number;
  if (saturationAdjustment >= 0) {
    // Positive adjustment: blend towards maximum saturation (1.0)
    newSaturation = s + (1 - s) * saturationAdjustment;
  } else {
    // Negative adjustment: blend towards no saturation (0.0)
    newSaturation = s + s * saturationAdjustment;
  }

  // Ensure values stay within bounds (should already be guaranteed by the math above)
  newLightness = Math.min(1, Math.max(0, newLightness));
  newSaturation = Math.min(1, Math.max(0, newSaturation));

  // Convert back to hex
  return hslToHex(h, newSaturation, newLightness);
}

/**
 * Create a lighter version of a color
 * @param hex Hex color string
 * @param amount Amount to lighten (0-1, where 1 makes it white)
 * @returns Lightened hex color string
 */
export function lightenColor(hex: string, amount: number): string {
  return adjustColorLightnessSaturation(hex, Math.abs(amount), 0);
}

/**
 * Create a darker version of a color
 * @param hex Hex color string
 * @param amount Amount to darken (0-1, where 1 makes it black)
 * @returns Darkened hex color string
 */
export function darkenColor(hex: string, amount: number): string {
  return adjustColorLightnessSaturation(hex, -Math.abs(amount), 0);
}

/**
 * Create a more saturated version of a color
 * @param hex Hex color string
 * @param amount Amount to saturate (0-1, where 1 maximizes saturation)
 * @returns More saturated hex color string
 */
export function saturateColor(hex: string, amount: number): string {
  return adjustColorLightnessSaturation(hex, 0, Math.abs(amount));
}

/**
 * Create a less saturated (more gray) version of a color
 * @param hex Hex color string
 * @param amount Amount to desaturate (0-1, where 1 makes it completely gray)
 * @returns Less saturated hex color string
 */
export function desaturateColor(hex: string, amount: number): string {
  return adjustColorLightnessSaturation(hex, 0, -Math.abs(amount));
}

/**
 * Converts an integer to a hexadecimal color code string.
 *
 * @param {number} packed - The integer value to convert to a hexadecimal color code.
 * @return {string} The hexadecimal color code represented as a string, prefixed with '#'.
 */
export function unpackIntToHex(packed: number): string {
  return '#' + packed.toString(16).padStart(6, '0');
}
