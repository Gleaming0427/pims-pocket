import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import colors from '@/constants/colors';

interface LoadingScreenProps {
  message?: string;
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background,
      }}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text
          style={{
            marginTop: 16,
            fontSize: 16,
            color: colors.textSecondary,
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}
