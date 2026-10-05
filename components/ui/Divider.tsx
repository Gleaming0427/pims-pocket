import React from 'react';
import { View, Text } from 'react-native';
import colors from '@/constants/colors';

interface DividerProps {
  label?: string;
}

export default function Divider({ label = 'ou' }: DividerProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
      }}
    >
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      <Text
        style={{
          marginHorizontal: 16,
          fontSize: 14,
          color: colors.textSecondary,
          fontWeight: '500',
        }}
      >
        {label}
      </Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
    </View>
  );
}
