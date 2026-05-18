import React from 'react';
import { Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/shared/Header';
import colors from '@/constants/colors';

export default function TermsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Conditions d'utilisation" showBack />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <Text style={{ fontSize: 13, color: colors.textLight, marginBottom: 24 }}>
          Dernière mise à jour : 18 mai 2026
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
          1. Présentation
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 }}>
          Pims Pocketest une application mobile de gestion d'argent de poche familial. L'application permet aux parents de gérer l'argent de poche de leurs enfants via des missions, des versements et un suivi des dépenses.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
          2. Compte parent
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 }}>
          Le parent est responsable de l'exactitude des informations fournies. Il s'engage à utiliser l'application dans le cadre familial uniquement. Le parent est responsable de toutes les actions effectuées avec son compte.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
          3. Compte enfant
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 }}>
          Les comptes enfants sont créés et gérés exclusivement par le parent. Le parent donne son consentement explicite au traitement des données de son enfant. Les enfants ne peuvent pas créer de compte sans l'intervention d'un parent.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
          4. Responsabilité
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 }}>
          Pims Pocketest un outil de gestion. Les montants affichés sont indicatifs. L'application ne remplace pas un compte bancaire réel. Pims Pocketne peut être tenue responsable des décisions financières prises via l'application.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
          5. Résiliation
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 }}>
          Le parent peut supprimer son compte à tout moment depuis les réglages. La suppression entraîne l'effacement définitif de toutes les données associées.
        </Text>

        <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 }}>
          6. Contact
        </Text>
        <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 }}>
          Pour toute question, contactez-nous à privacy@pimspocket.app.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
