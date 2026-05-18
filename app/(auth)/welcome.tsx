import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import colors from '@/constants/colors';

const { width } = Dimensions.get('window');

const slides = [
  {
    emoji: '💰',
    title: 'Argent de poche intelligent',
    description:
      "Gérez l'argent de poche de vos enfants simplement et suivez leurs dépenses en temps réel.",
  },
  {
    emoji: '🎯',
    title: 'Missions et récompenses',
    description:
      "Créez des missions pour vos enfants et récompensez-les automatiquement quand c'est validé.",
  },
  {
    emoji: '🐷',
    title: "Apprendre à épargner",
    description:
      "Vos enfants fixent des objectifs d'épargne et voient leur tirelire se remplir !",
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const w = width > 0 ? width : 1;
    const index = Math.round(e.nativeEvent.contentOffset.x / w);
    setActiveIndex(Math.max(0, Math.min(slides.length - 1, index)));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View
            style={{
              width,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 40,
            }}
          >
            <Text style={{ fontSize: 100, marginBottom: 30 }}>{item.emoji}</Text>
            <Text
              style={{
                fontSize: 26,
                fontWeight: '800',
                color: colors.textPrimary,
                textAlign: 'center',
                marginBottom: 16,
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
        )}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 24 }}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={{
              width: activeIndex === i ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: activeIndex === i ? colors.primary : colors.border,
              marginHorizontal: 4,
            }}
          />
        ))}
      </View>

      <View style={{ paddingHorizontal: 24, paddingBottom: 20, gap: 12 }}>
        <Button
          title="Créer un compte parent"
          onPress={() => router.push('/(auth)/register')}
        />
        <Button
          title="Se connecter"
          onPress={() => router.push('/(auth)/login')}
          variant="outline"
        />

      </View>
    </SafeAreaView>
  );
}
