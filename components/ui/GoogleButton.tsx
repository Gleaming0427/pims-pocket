import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, Image } from 'react-native';
import colors from '@/constants/colors';

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
}

const GOOGLE_LOGO_URI =
  'https://developers.google.com/identity/images/g-logo.png';

export default function GoogleButton({
  onPress,
  loading = false,
  disabled = false,
  title = 'Continuer avec Google',
}: GoogleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        minHeight: 48,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        backgroundColor: colors.surface,
        borderWidth: 1.5,
        borderColor: colors.border,
        opacity: disabled || loading ? 0.5 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={colors.textPrimary} size="small" />
      ) : (
        <>
          <Image
            source={{ uri: GOOGLE_LOGO_URI }}
            style={{ width: 20, height: 20, marginRight: 12 }}
          />
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: colors.textPrimary,
            }}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
