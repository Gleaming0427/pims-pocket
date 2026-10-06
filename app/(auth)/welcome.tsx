import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Avatar from '@/components/ui/Avatar';
import ParentArtwork from '@/components/parent/ParentArtwork';
import { SplitBar } from '@/components/shared/SplitBar';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');
const AUTOPLAY_MS = 5000;

const slides = [
  {
    artwork: 'transfer' as const,
    title: 'Argent de poche intelligent',
    description:
      "Gérez l'argent de poche de vos enfants simplement et suivez leurs dépenses en temps réel.",
  },
  {
    artwork: 'mission' as const,
    title: 'Missions et récompenses',
    description:
      "Créez des missions pour vos enfants et récompensez-les automatiquement quand c'est validé.",
  },
  {
    artwork: 'savings' as const,
    title: 'Apprendre à épargner',
    description:
      "Vos enfants fixent des objectifs d'épargne et voient leur tirelire se remplir !",
  },
];

// Aperçu de l'app façon maquette : une tirelire et deux cartes flottantes
// (données d'exemple, purement illustratives)
function AppPreview() {
  return (
    <View style={{ marginHorizontal: 20, marginTop: 24, marginBottom: 28 }}>
      <Card padding={16}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar avatarId="fox" size={40} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>Tirelire de Léa</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>5,00 € chaque samedi</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 }}>
            24,50 €
          </Text>
        </View>
        <SplitBar
          segments={[
            { value: 17.5, color: colors.primary },
            { value: 7, color: colors.secondary },
          ]}
          style={{ marginTop: 14 }}
        />
        <View style={{ flexDirection: 'row', marginTop: 10, gap: 16 }}>
          {[
            { color: colors.primary, label: 'Disponible 17,50 €' },
            { color: colors.secondary, label: 'Épargné 7,00 €' },
          ].map((item) => (
            <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: item.color, marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View style={{ flexDirection: 'row', gap: 10, marginTop: -14, paddingHorizontal: 8 }}>
        <Card padding={12} style={{ flex: 1, transform: [{ rotate: '-2deg' }] }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: colors.accentOrange + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="sparkles" size={17} color={colors.accentOrange} />
          </View>
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 8 }}>
            Ranger sa chambre
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.success, marginTop: 2 }}>+2,00 €</Text>
        </Card>
        <Card padding={12} style={{ flex: 1, marginTop: 10, transform: [{ rotate: '2deg' }] }}>
          <Ionicons name="bicycle-outline" size={24} color={colors.textPrimary} accessible={false} />
          <Text numberOfLines={1} style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 6 }}>
            Objectif vélo
          </Text>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.canvasMuted, marginTop: 8, overflow: 'hidden' }}>
            <View style={{ width: '65%', height: '100%', backgroundColor: colors.starGold }} />
          </View>
          <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>65 % épargné</Text>
        </Card>
      </View>
    </View>
  );
}

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  // Progression du slide actif (remplissage du point)
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeIndexRef = useRef(0);
  // Animations d'entrée (héro + actions)
  const heroAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;
  const reducedMotionRef = useRef(false);

  // Entrée en scène + respect du réglage système « réduire les animations »
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      reducedMotionRef.current = enabled;
      if (enabled) {
        heroAnim.setValue(1);
        actionsAnim.setValue(1);
      }
    });
    Animated.parallel([
      Animated.timing(heroAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.timing(actionsAnim, {
        toValue: 1,
        duration: 450,
        delay: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [heroAnim, actionsAnim]);

  // Relance le remplissage du point actif
  const restartProgress = useCallback(() => {
    progress.stopAnimation();
    progress.setValue(0);
    if (reducedMotionRef.current) return;
    Animated.timing(progress, {
      toValue: 1,
      duration: AUTOPLAY_MS,
      useNativeDriver: false, // largeur animée : petit élément, coût négligeable
    }).start();
  }, [progress]);

  const goToSlide = useCallback(
    (index: number) => {
      scrollRef.current?.scrollTo({ x: index * width, animated: true });
      scheduleAuto();
      restartProgress();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Programme le passage automatique au slide suivant (désactivé si
  // l'utilisateur préfère réduire les animations)
  const scheduleAuto = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (reducedMotionRef.current) return;
    timerRef.current = setTimeout(() => {
      goToSlide((activeIndexRef.current + 1) % slides.length);
    }, AUTOPLAY_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pause l'autoplay quand l'écran perd le focus, reprend au retour
  useFocusEffect(
    useCallback(() => {
      scheduleAuto();
      restartProgress();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        progress.stopAnimation();
      };
    }, [scheduleAuto, restartProgress, progress])
  );

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: true,
      listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        const w = width > 0 ? width : 1;
        const index = Math.round(e.nativeEvent.contentOffset.x / w);
        const clamped = Math.max(0, Math.min(slides.length - 1, index));
        if (clamped !== activeIndexRef.current) {
          activeIndexRef.current = clamped;
          setActiveIndex(clamped);
        }
      },
    }
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      {/* Marque */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <Image
          source={require('../../assets/icon.png')}
          style={{ width: 40, height: 40, borderRadius: 12, marginRight: 10 }}
          accessibilityLabel="Logo Pims Pocket"
        />
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary }}>Pims Pocket</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Accroche */}
        <Animated.View
          style={{
            paddingHorizontal: 20,
            paddingTop: 16,
            opacity: heroAnim,
            transform: [
              {
                translateY: heroAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [14, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: colors.surface,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: colors.canvasMuted,
              paddingHorizontal: 12,
              paddingVertical: 5,
              marginBottom: 14,
            }}
          >
            <Ionicons name="people" size={14} color={colors.primary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
              Pour toute la famille
            </Text>
          </View>
          <Text
            style={{
              fontSize: 34,
              fontWeight: '800',
              color: colors.textPrimary,
              letterSpacing: -1,
              lineHeight: 40,
            }}
          >
            L'argent de poche,{'\n'}en famille.
          </Text>
          <Text style={{ fontSize: 15, color: colors.textSecondary, lineHeight: 22, marginTop: 10 }}>
            Missions, objectifs d'épargne et tirelire en temps réel, pour les parents et les enfants.
          </Text>
        </Animated.View>

        <Animated.View style={{ opacity: heroAnim }}>
          <AppPreview />
        </Animated.View>

        {/* Carrousel — ScrollView horizontal simple (3 slides), effet de profondeur */}
        <Animated.ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            if (timerRef.current) clearTimeout(timerRef.current);
            progress.stopAnimation();
            progress.setValue(0);
          }}
          onMomentumScrollEnd={() => {
            scheduleAuto();
            restartProgress();
          }}
        >
          {slides.map((item, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const scale = scrollX.interpolate({
              inputRange,
              outputRange: [0.92, 1, 0.92],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.45, 1, 0.45],
              extrapolate: 'clamp',
            });
            return (
              <View
                key={index}
                style={{
                  width,
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingHorizontal: 20,
                  paddingBottom: 28,
                }}
              >
                <Animated.View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    padding: 20,
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    minHeight: 168,
                    width: '100%',
                    opacity,
                    transform: [{ scale }],
                  }}
                >
                  <View style={{ marginBottom: 12 }}>
                    <ParentArtwork name={item.artwork} size={48} />
                  </View>
                  <Text
                    style={{
                      fontSize: 17,
                      fontWeight: '700',
                      color: colors.textPrimary,
                      marginBottom: 6,
                    }}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: colors.textSecondary,
                      lineHeight: 21,
                    }}
                    numberOfLines={3}
                  >
                    {item.description}
                  </Text>
                </Animated.View>
              </View>
            );
          })}
        </Animated.ScrollView>

        {/* Points cliquables avec progression du slide actif */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 0,
            marginBottom: 8,
          }}
        >
          {slides.map((_, i) => {
            const isActive = activeIndex === i;
            const fillWidth = progress.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 28],
            });
            return (
              <TouchableOpacity
                key={i}
                onPress={() => goToSlide(i)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{ marginHorizontal: 4 }}
                accessibilityLabel={`Slide ${i + 1}`}
              >
                {isActive ? (
                  <View
                    style={{
                      width: 28,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.canvasMuted,
                      overflow: 'hidden',
                    }}
                  >
                    <Animated.View
                      style={{
                        width: fillWidth,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.textPrimary,
                      }}
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: colors.canvasMuted,
                    }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* Actions, toujours visibles */}
      <Animated.View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 8,
          gap: 10,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
          opacity: actionsAnim,
          transform: [
            {
              translateY: actionsAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              }),
            },
          ],
        }}
      >
        <Button
          title="Créer un compte parent"
          variant="dark"
          onPress={() => router.push('/(auth)/register')}
          icon={<Ionicons name="person-add-outline" size={18} color="#FFF" />}
        />
        <Button
          title="Se connecter"
          variant="light"
          onPress={() => router.push('/(auth)/login')}
          icon={<Ionicons name="log-in-outline" size={18} color={colors.textPrimary} />}
        />
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login?mode=child')}
          accessibilityRole="button"
          style={{ alignItems: 'center', paddingVertical: 6 }}
        >
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Tu es un enfant ?{' '}
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Connecte-toi avec ton code</Text>
          </Text>
        </TouchableOpacity>

        {/* Légal */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
          <TouchableOpacity onPress={() => router.push('/(legal)/privacy')}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textLight }}>Confidentialité</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(legal)/terms')}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textLight }}>Conditions</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
