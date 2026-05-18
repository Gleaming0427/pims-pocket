import React from 'react';
import { View, Text, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import colors from '@/constants/colors';

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 20 }}>
    <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 }}>
      {title}
    </Text>
    {children}
  </View>
);

const Para = ({ children }: { children: React.ReactNode }) => (
  <Text style={{ fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 10 }}>
    {children}
  </Text>
);

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Politique de confidentialité" showBack />
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingBottom: 40,
          maxWidth: 720,
          width: '100%',
          alignSelf: 'center',
        }}
      >
        <Card style={{ padding: 20 }}>
          <Text style={{ fontSize: 13, color: colors.textLight, marginBottom: 16 }}>
            Derniere mise a jour : 8 mai 2026
          </Text>

          <Section title="1. Introduction">
            <Para>
              Pims Pocket ("l'Application")s'engage a proteger la vie privee de ses utilisateurs.
              Cette politique de confidentialite explique comment nous collectons, utilisons et
              protegeons vos donnees personnelles lorsque vous utilisez notre application de gestion
              d'argent de poche familial.
            </Para>
          </Section>

          <Section title="2. Donnees collectees">
            <Para>
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Compte parent :</Text>
              {'\n'}• Adresse email{'\n'}• Prenom{'\n'}• Identifiants de connexion Google (si
              connexion via Google)
            </Para>
            <Para>
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Compte enfant :</Text>
              {'\n'}• Prenom{'\n'}• Date de naissance{'\n'}• Code d'invitation et code PIN
            </Para>
            <Para>
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                Donnees d'utilisation :
              </Text>
              {'\n'}• Transactions (montants, descriptions){'\n'}• Missions et objectifs
              d'epargne{'\n'}• Solde du porte-monnaie virtuel{'\n'}• Parametres de notification
            </Para>
          </Section>

          <Section title="3. Utilisation des donnees">
            <Para>
              Nous utilisons vos donnees pour :{'\n'}• Fournir le service de gestion d'argent de
              poche familial{'\n'}• Authentifier les utilisateurs (parents et enfants){'\n'}•
              Permettre les transferts virtuels entre parents et enfants{'\n'}• Suivre les missions
              et recompenses{'\n'}• Envoyer des notifications liees a l'activite du compte
            </Para>
          </Section>

          <Section title="4. Services tiers">
            <Para>
              Pims Pocketutilise les services Firebase de Google pour l'authentification, le
              stockage des donnees et les notifications push. Les donnees sont stockees sur des
              serveurs Firebase situes dans l'Union Europeenne. Pour plus d'informations, consultez
              la{' '}
              <Text
                style={{ color: colors.primary, textDecorationLine: 'underline' }}
                onPress={() =>
                  Linking.openURL('https://firebase.google.com/support/privacy')
                }
              >
                politique de confidentialite Firebase
              </Text>
              .
            </Para>
            <Para>
              Pims Pocketutilise egalement Sentry pour la detection et le suivi des erreurs
              techniques. Sentry collecte uniquement des donnees de diagnostic (messages d'erreur,
              traces d'execution, informations sur l'appareil). Les donnees des enfants ne sont pas
              transmises a Sentry. Pour plus d'informations, consultez la{' '}
              <Text
                style={{ color: colors.primary, textDecorationLine: 'underline' }}
                onPress={() =>
                  Linking.openURL('https://sentry.io/privacy/')
                }
              >
                politique de confidentialite de Sentry
              </Text>
              .
            </Para>
          </Section>

          <Section title="5. Securite des donnees">
            <Para>
              Nous mettons en oeuvre des mesures de securite pour proteger vos donnees :{'\n'}•
              Chiffrement des donnees en transit (HTTPS/TLS){'\n'}• Authentification securisee via
              Firebase Auth{'\n'}• Acces restreint aux donnees enfants via des regles Firestore
              strictes{'\n'}• Codes PIN et codes d'invitation pour l'acces des enfants
            </Para>
          </Section>

          <Section title="6. Donnees des enfants">
            <Para>
              Pims Pocketest concu pour une utilisation familiale. Les comptes enfants sont crees et
              geres par les parents. Aucune donnee personnelle d'enfant n'est collectee sans le
              consentement parental explicite. Les parents disposent d'un controle total sur le
              compte de leur enfant et peuvent en demander la suppression a tout moment.
            </Para>
          </Section>

          <Section title="7. Conservation des donnees">
            <Para>
              Vos donnees sont conservees tant que votre compte est actif. Vous pouvez demander la
              suppression de votre compte et de toutes les donnees associees a tout moment en nous
              contactant. Les donnees sont supprimees dans un delai de 30 jours suivant la demande.
            </Para>
          </Section>

          <Section title="8. Vos droits (RGPD)">
            <Para>
              Conformement au Reglement General sur la Protection des Donnees (RGPD), vous
              disposez des droits suivants :{'\n'}• Droit d'acces a vos donnees{'\n'}• Droit de
              rectification{'\n'}• Droit a l'effacement (droit a l'oubli){'\n'}• Droit a la
              portabilite des donnees{'\n'}• Droit de limitation du traitement{'\n'}• Droit
              d'opposition au traitement
            </Para>
            <Para>
              Pour exercer ces droits, contactez-nous a l'adresse ci-dessous.
            </Para>
          </Section>

          <Section title="9. Modifications">
            <Para>
              Nous nous reservons le droit de modifier cette politique de confidentialite a tout
              moment. Les modifications seront publiees dans l'application et vous serez informe de
              tout changement significatif.
            </Para>
          </Section>

          <Section title="10. Contact">
            <Para>
              Pour toute question concernant cette politique de confidentialite ou pour exercer vos
              droits :{'\n'}
              {'\n'}Email : privacy@pimspocket.app{'\n'}
              {'\n'}Nous nous engageons a repondre dans un delai maximum de 30 jours.
            </Para>
          </Section>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
