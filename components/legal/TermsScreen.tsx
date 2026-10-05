import React from 'react';
import { ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/shared/Header';
import Button from '@/components/ui/Button';
import {
  UpdatedPill,
  SummaryCard,
  LegalSection as Section,
  LegalPara as Para,
  ContactEmail,
} from '@/components/legal/LegalBlocks';
import colors from '@/constants/colors';

const CONTACT_EMAIL = 'privacy@pimspocket.app';

// Points clés, repris tels quels des sections ci-dessous
const ESSENTIALS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'home-outline', text: "Une utilisation dans le cadre familial uniquement" },
  { icon: 'people-outline', text: 'Comptes enfants créés et gérés exclusivement par le parent' },
  { icon: 'information-circle-outline', text: 'Montants indicatifs : ne remplace pas un compte bancaire réel' },
  { icon: 'trash-outline', text: 'Suppression du compte à tout moment depuis les réglages' },
];

/**
 * Conditions d'utilisation — écran partagé par la route publique
 * (avant connexion) et celle des réglages parent.
 */
export default function TermsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Conditions d'utilisation" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <UpdatedPill date="18 mai 2026" />

        <SummaryCard title="En bref" items={ESSENTIALS} />

        <Section number={1} title="Présentation">
          <Para>
            Pims Pocket est une application mobile de gestion d'argent de poche familial.
            L'application permet aux parents de gérer l'argent de poche de leurs enfants via des
            missions, des versements et un suivi des dépenses.
          </Para>
        </Section>

        <Section number={2} title="Compte parent">
          <Para>
            Le parent est responsable de l'exactitude des informations fournies. Il s'engage à
            utiliser l'application dans le cadre familial uniquement. Le parent est responsable de
            toutes les actions effectuées avec son compte.
          </Para>
        </Section>

        <Section number={3} title="Compte enfant">
          <Para>
            Les comptes enfants sont créés et gérés exclusivement par le parent. Le parent donne
            son consentement explicite au traitement des données de son enfant. Les enfants ne
            peuvent pas créer de compte sans l'intervention d'un parent.
          </Para>
        </Section>

        <Section number={4} title="Responsabilité">
          <Para>
            Pims Pocket est un outil de gestion. Les montants affichés sont indicatifs.
            L'application ne remplace pas un compte bancaire réel. Pims Pocket ne peut être tenue
            responsable des décisions financières prises via l'application.
          </Para>
        </Section>

        <Section number={5} title="Résiliation">
          <Para>
            Le parent peut supprimer son compte à tout moment depuis les réglages. La suppression
            entraîne l'effacement définitif de toutes les données associées.
          </Para>
        </Section>

        <Section number={6} title="Contact">
          <Para>Pour toute question, contactez-nous à {CONTACT_EMAIL}.</Para>
          <ContactEmail email={CONTACT_EMAIL} />
          <Button
            title="Nous écrire"
            variant="dark"
            icon={<Ionicons name="mail" size={18} color="#FFF" />}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
          />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
