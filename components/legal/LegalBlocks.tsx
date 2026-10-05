import React from 'react';
import { View, Text, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import colors from '@/constants/colors';

/**
 * Briques de mise en page des textes juridiques (politique de
 * confidentialité, conditions d'utilisation).
 */

// Date de mise à jour, en pastille
export function UpdatedPill({ date }: { date: string }) {
  return (
    <View
      style={{
        alignSelf: 'flex-start',
        backgroundColor: colors.surface,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.canvasMuted,
        paddingHorizontal: 12,
        paddingVertical: 5,
        marginBottom: 14,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>
        Dernière mise à jour : {date}
      </Text>
    </View>
  );
}

// Résumé en quelques points, repris tels quels du texte
export function SummaryCard({
  title,
  items,
}: {
  title: string;
  items: { icon: keyof typeof Ionicons.glyphMap; text: string }[];
}) {
  return (
    <Card padding={18} style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
        {title}
      </Text>
      {items.map((item, i) => (
        <View
          key={item.text}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 8,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: colors.canvasMuted,
          }}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: colors.canvas,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Ionicons name={item.icon} size={18} color={colors.textPrimary} />
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 19 }}>
            {item.text}
          </Text>
        </View>
      ))}
    </Card>
  );
}

// Section numérotée : une carte par section
export function LegalSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card padding={18} style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: colors.canvas,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '800', color: colors.textPrimary }}>{number}</Text>
        </View>
        <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: colors.textPrimary }}>
          {title}
        </Text>
      </View>
      {children}
    </Card>
  );
}

export function LegalPara({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 8 }}>
      {children}
    </Text>
  );
}

export function LegalStrong({ children }: { children: React.ReactNode }) {
  return (
    <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

// Liste à puces lisible (une ligne par élément)
export function LegalBullets({ items }: { items: React.ReactNode[] }) {
  return (
    <View style={{ marginBottom: 10 }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: colors.textLight,
              marginTop: 8,
              marginRight: 10,
            }}
          />
          <Text style={{ flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 22 }}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export function LegalLink({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <Text
      style={{ color: colors.primary, textDecorationLine: 'underline' }}
      onPress={() => Linking.openURL(url)}
      accessibilityRole="link"
    >
      {children}
    </Text>
  );
}

// Adresse de contact mise en évidence
export function ContactEmail({ email }: { email: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.canvas,
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <Ionicons name="mail-outline" size={18} color={colors.textPrimary} />
      <Text style={{ marginLeft: 10, fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>
        Email : {email}
      </Text>
    </View>
  );
}
