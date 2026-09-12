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
            Dernière mise à jour : 8 mai 2026
          </Text>

          <Section title="1. Introduction">
            <Para>
              Pims Pocket (« l'Application ») s'engage à protéger la vie privée de ses utilisateurs.
              Cette politique de confidentialité explique comment nous collectons, utilisons et
              protégeons vos données personnelles lorsque vous utilisez notre application de gestion
              d'argent de poche familial.
            </Para>
          </Section>

          <Section title="2. Données collectées">
            <Para>
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Compte parent :</Text>
              {'\n'}• Adresse email{'\n'}• Prénom{'\n'}• Identifiants de connexion Google (si
              connexion via Google)
            </Para>
            <Para>
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>Compte enfant :</Text>
              {'\n'}• Prénom{'\n'}• Date de naissance{'\n'}• Code d'invitation et code PIN
            </Para>
            <Para>
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                Données d'utilisation :
              </Text>
              {'\n'}• Transactions (montants, descriptions){'\n'}• Missions et objectifs
              d'épargne{'\n'}• Solde du porte-monnaie virtuel{'\n'}• Paramètres de notification
            </Para>
          </Section>

          <Section title="3. Utilisation des données">
            <Para>
              Nous utilisons vos données pour :{'\n'}• Fournir le service de gestion d'argent de
              poche familial{'\n'}• Authentifier les utilisateurs (parents et enfants){'\n'}•
              Permettre les transferts virtuels entre parents et enfants{'\n'}• Suivre les missions
              et récompenses{'\n'}• Envoyer des notifications liées à l'activité du compte
            </Para>
          </Section>

          <Section title="4. Services tiers">
            <Para>
              Pims Pocket utilise les services Firebase de Google pour l'authentification, le
              stockage des données et les notifications push. Les données sont stockées sur des
              serveurs Firebase situés dans l'Union Européenne. Pour plus d'informations, consultez
              la{' '}
              <Text
                style={{ color: colors.primary, textDecorationLine: 'underline' }}
                onPress={() =>
                  Linking.openURL('https://firebase.google.com/support/privacy')
                }
              >
                politique de confidentialité Firebase
              </Text>
              .
            </Para>
            <Para>
              Pims Pocket utilise également Sentry pour la détection et le suivi des erreurs
              techniques. Sentry collecte uniquement des données de diagnostic (messages d'erreur,
              traces d'exécution, informations sur l'appareil). Les données des enfants ne sont pas
              transmises à Sentry. Pour plus d'informations, consultez la{' '}
              <Text
                style={{ color: colors.primary, textDecorationLine: 'underline' }}
                onPress={() =>
                  Linking.openURL('https://sentry.io/privacy/')
                }
              >
                politique de confidentialité de Sentry
              </Text>
              .
            </Para>
          </Section>

          <Section title="5. Sécurité des données">
            <Para>
              Nous mettons en œuvre des mesures de sécurité pour protéger vos données :{'\n'}•
              Chiffrement des données en transit (HTTPS/TLS){'\n'}• Authentification sécurisée via
              Firebase Auth{'\n'}• Accès restreint aux données enfants via des règles Firestore
              strictes{'\n'}• Codes PIN et codes d'invitation pour l'accès des enfants
            </Para>
          </Section>

          <Section title="6. Données des enfants">
            <Para>
              Pims Pocket est conçu pour une utilisation familiale. Les comptes enfants sont créés et
              gérés par les parents. Aucune donnée personnelle d'enfant n'est collectée sans le
              consentement parental explicite. Les parents disposent d'un contrôle total sur le
              compte de leur enfant et peuvent en demander la suppression à tout moment.
            </Para>
          </Section>

          <Section title="7. Conservation des données">
            <Para>
              Vos données sont conservées tant que votre compte est actif, c'est-à-dire tant que vous
              continuez à utiliser l'application.{'\n'}• Compte actif : données conservées pour le
              fonctionnement du service{'\n'}• Compte inactif : un compte resté inactif depuis
              longtemps peut être supprimé après une notification préalable par e-mail{'\n'}•
              Suppression à la demande : lors de la suppression de votre compte (ou de celui d'un
              enfant), les données sont effacées immédiatement et au plus tard sous 30 jours{'\n'}•
              Données techniques (journaux d'erreurs Sentry) : conservées au maximum 90 jours
            </Para>
          </Section>

          <Section title="8. Vos droits (RGPD)">
            <Para>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous
              disposez des droits suivants :{'\n'}• Droit d'accès à vos données{'\n'}• Droit de
              rectification{'\n'}• Droit à l'effacement (droit à l'oubli){'\n'}• Droit à la
              portabilité des données{'\n'}• Droit de limitation du traitement{'\n'}• Droit
              d'opposition au traitement
            </Para>
            <Para>
              Pour exercer ces droits, contactez-nous à l'adresse ci-dessous.
            </Para>
          </Section>

          <Section title="9. Modifications">
            <Para>
              Nous nous réservons le droit de modifier cette politique de confidentialité à tout
              moment. Les modifications seront publiées dans l'application et vous serez informé de
              tout changement significatif.
            </Para>
          </Section>

          <Section title="10. Contact">
            <Para>
              Pour toute question concernant cette politique de confidentialité ou pour exercer vos
              droits :{'\n'}
              {'\n'}Email : privacy@pimspocket.app{'\n'}
              {'\n'}Nous nous engageons à répondre dans un délai maximum de 30 jours.
            </Para>
          </Section>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
