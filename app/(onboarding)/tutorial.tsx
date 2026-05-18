import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { updateUserOnboardingStatus } from '@/lib/firestore';
import colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '👋',
    title: 'Bienvenue dans\nPocketKids !',
    description:
      "L'application qui rend l'argent de poche intelligent et amusant pour toute la famille.",
  },
  {
    emoji: '📱',
    title: 'Pour vous,\nle parent',
    description:
      'Créez des missions, validez les travaux, suivez les dépenses et enseignez la valeur de l’argent à vos enfants.',
  },
  {
    emoji: '🚀',
    title: 'Votre premier enfant\nvous attend',
    description:
      'Nous allons créer un profil démo pour vous montrer le fonctionnement. Vous pourrez le modifier ou le supprimer à tout moment.',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { addChild } = useChildStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const isLastSlide = activeIndex === SLIDES.length - 1;

  const handleComplete = useCallback(async () => {
    if (isCompleting || !user?.familyId) return;
    setIsCompleting(true);

    try {
      // Créer l'enfant démo D'ABORD
      await addChild(user.familyId, {
        firstName: 'Emma',
        avatarId: 'unicorn',
        birthDate: new Date(2018, 0, 1),
        weeklyAllowance: 500,
        allowanceDay: 6,
      });

      // Puis marquer l'onboarding comme terminé
      await updateUserOnboardingStatus(user.id, true);
      useAuthStore.getState().setUser({ ...user, hasCompletedOnboarding: true });

      router.replace('/(onboarding)/celebration');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue';
      Alert.alert('Erreur', msg);
      router.replace('/(parent)/dashboard');
    } finally {
      setIsCompleting(false);
    }
  }, [isCompleting, user, addChild, router]);

  const renderSlide = useCallback(
    ({ item }: { item: (typeof SLIDES)[number] }) => (
      <View
        style={{
          width: SCREEN_WIDTH,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
        }}
      >
        <Text style={{ fontSize: 72, marginBottom: 24 }}>{item.emoji}</Text>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '800',
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 34,
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: colors.textSecondary,
            textAlign: 'center',
            lineHeight: 24,
          }}
        >
          {item.description}
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Bouton Passer */}
      <TouchableOpacity
        onPress={handleComplete}
        disabled={isCompleting}
        style={{ position: 'absolute', top: 16, right: 24, zIndex: 10 }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.textLight,
          }}
        >
          Passer
        </Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveIndex(index);
        }}
        keyExtractor={(_, i) => String(i)}
      />

      {/* Footer */}
      <View style={{ paddingHorizontal: 24, paddingBottom: 40, alignItems: 'center' }}>
        {/* Dots */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === activeIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor:
                  i === activeIndex ? colors.primary : colors.textLight + '40',
              }}
            />
          ))}
        </View>

        {isLastSlide ? (
          <Button
            title={isCompleting ? 'Création...' : 'Commencer'}
            onPress={handleComplete}
            loading={isCompleting}
          />
        ) : (
          <TouchableOpacity
            onPress={() => {
              flatListRef.current?.scrollToIndex({
                index: activeIndex + 1,
                animated: true,
              });
            }}
            style={{
              paddingVertical: 14,
              paddingHorizontal: 32,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: colors.primary,
              }}
            >
              Suivant
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}
