import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import colors from '@/constants/colors';

interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  style?: ViewStyle;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  style,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      style={{
        flexDirection: 'row',
        backgroundColor: colors.canvasMuted,
        borderRadius: 14,
        padding: 4,
        ...style,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onChange(option.value)}
            activeOpacity={0.7}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: 9,
              borderRadius: 11,
              backgroundColor: selected ? colors.surface : 'transparent',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: selected ? 0.06 : 0,
              shadowRadius: 4,
              elevation: selected ? 1 : 0,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: selected ? '700' : '600',
                color: selected ? colors.textPrimary : colors.textSecondary,
              }}
            >
              {option.label}
            </Text>
            {option.count !== undefined && option.count > 0 && (
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: selected ? colors.textPrimary : colors.textLight,
                }}
              >
                {option.count}
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
