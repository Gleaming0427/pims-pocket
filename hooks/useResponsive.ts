import { useWindowDimensions } from 'react-native';
import type { ViewStyle } from 'react-native';

const TABLET_BREAKPOINT = 768;
export const CONTENT_MAX_WIDTH = 720;

/**
 * Hook responsive simple :
 *  - isTablet      : true si la largeur >= 768 (iPad portrait, foldables ouverts).
 *  - scale         : facteur de mise à l'échelle (1.0 sur téléphone, 1.25 sur tablette).
 *  - contentStyle  : styles à étaler sur le contentContainerStyle d'un ScrollView
 *                    (ou d'une View) pour centrer le contenu et le limiter à
 *                    720 px de large. Sur téléphone le maxWidth ne joue pas
 *                    (largeur < 720), donc rien ne change.
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_BREAKPOINT;
  const scale = isTablet ? 1.25 : 1;

  const contentStyle: ViewStyle = {
    width: '100%',
    maxWidth: CONTENT_MAX_WIDTH,
    alignSelf: 'center',
  };

  return { isTablet, scale, contentStyle, width };
}

/**
 * Helper sans hook (utilisable hors composant) — applique juste la largeur max
 * et le centrage. Plus simple à étaler dans les contentContainerStyle existants.
 */
export const responsiveContent: ViewStyle = {
  width: '100%',
  maxWidth: CONTENT_MAX_WIDTH,
  alignSelf: 'center',
};
