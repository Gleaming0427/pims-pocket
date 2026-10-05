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
  LegalStrong as Strong,
  LegalBullets as Bullets,
  LegalLink as Link,
  ContactEmail,
} from '@/components/legal/LegalBlocks';
import colors from '@/constants/colors';

const CONTACT_EMAIL = 'privacy@pimspocket.app';

// Points clés, repris tels quels des sections ci-dessous
const ESSENTIALS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'globe-outline', text: "Données stockées sur des serveurs situés dans l'Union Européenne" },
  { icon: 'people-outline', text: 'Comptes enfants créés et gérés par les parents' },
  { icon: 'trash-outline', text: 'Suppression à la demande, au plus tard sous 30 jours' },
  { icon: 'shield-checkmark-outline', text: 'Tous vos droits RGPD : accès, rectification, effacement…' },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Politique de confidentialité" showBack />
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
        <UpdatedPill date="8 mai 2026" />

        <SummaryCard title="L'essentiel" items={ESSENTIALS} />

        <Section number={1} title="Introduction">
          <Para>
            Pims Pocket (« l'Application ») s'engage à protéger la vie privée de ses utilisateurs.
            Cette politique de confidentialité explique comment nous collectons, utilisons et
            protégeons vos données personnelles lorsque vous utilisez notre application de gestion
            d'argent de poche familial.
          </Para>
        </Section>

        <Section number={2} title="Données collectées">
          <Strong>Compte parent :</Strong>
          <Bullets
            items={[
              'Adresse email',
              'Prénom',
              'Identifiants de connexion Google (si connexion via Google)',
            ]}
          />
          <Strong>Compte enfant :</Strong>
          <Bullets items={['Prénom', 'Date de naissance', "Code d'invitation et code PIN"]} />
          <Strong>Données d'utilisation :</Strong>
          <Bullets
            items={[
              'Transactions (montants, descriptions)',
              "Missions et objectifs d'épargne",
              'Solde du porte-monnaie virtuel',
              'Paramètres de notification',
            ]}
          />
        </Section>

        <Section number={3} title="Utilisation des données">
          <Para>Nous utilisons vos données pour :</Para>
          <Bullets
            items={[
              "Fournir le service de gestion d'argent de poche familial",
              'Authentifier les utilisateurs (parents et enfants)',
              'Permettre les transferts virtuels entre parents et enfants',
              'Suivre les missions et récompenses',
              "Envoyer des notifications liées à l'activité du compte",
            ]}
          />
        </Section>

        <Section number={4} title="Services tiers">
          <Para>
            Pims Pocket utilise les services Firebase de Google pour l'authentification, le
            stockage des données et les notifications push. Les données sont stockées sur des
            serveurs Firebase situés dans l'Union Européenne. Pour plus d'informations, consultez
            la{' '}
            <Link url="https://firebase.google.com/support/privacy">
              politique de confidentialité Firebase
            </Link>
            .
          </Para>
          <Para>
            Pims Pocket utilise également Sentry pour la détection et le suivi des erreurs
            techniques. Sentry collecte uniquement des données de diagnostic (messages d'erreur,
            traces d'exécution, informations sur l'appareil). Les données des enfants ne sont pas
            transmises à Sentry. Pour plus d'informations, consultez la{' '}
            <Link url="https://sentry.io/privacy/">politique de confidentialité de Sentry</Link>.
          </Para>
        </Section>

        <Section number={5} title="Sécurité des données">
          <Para>Nous mettons en œuvre des mesures de sécurité pour protéger vos données :</Para>
          <Bullets
            items={[
              'Chiffrement des données en transit (HTTPS/TLS)',
              'Authentification sécurisée via Firebase Auth',
              'Accès restreint aux données enfants via des règles Firestore strictes',
              "Codes PIN et codes d'invitation pour l'accès des enfants",
            ]}
          />
        </Section>

        <Section number={6} title="Données des enfants">
          <Para>
            Pims Pocket est conçu pour une utilisation familiale. Les comptes enfants sont créés et
            gérés par les parents. Aucune donnée personnelle d'enfant n'est collectée sans le
            consentement parental explicite. Les parents disposent d'un contrôle total sur le
            compte de leur enfant et peuvent en demander la suppression à tout moment.
          </Para>
        </Section>

        <Section number={7} title="Conservation des données">
          <Para>
            Vos données sont conservées tant que votre compte est actif, c'est-à-dire tant que vous
            continuez à utiliser l'application.
          </Para>
          <Bullets
            items={[
              'Compte actif : données conservées pour le fonctionnement du service',
              'Compte inactif : un compte resté inactif depuis longtemps peut être supprimé après une notification préalable par e-mail',
              "Suppression à la demande : lors de la suppression de votre compte (ou de celui d'un enfant), les données sont effacées immédiatement et au plus tard sous 30 jours",
              "Données techniques (journaux d'erreurs Sentry) : conservées au maximum 90 jours",
            ]}
          />
        </Section>

        <Section number={8} title="Vos droits (RGPD)">
          <Para>
            Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez
            des droits suivants :
          </Para>
          <Bullets
            items={[
              "Droit d'accès à vos données",
              'Droit de rectification',
              "Droit à l'effacement (droit à l'oubli)",
              'Droit à la portabilité des données',
              'Droit de limitation du traitement',
              "Droit d'opposition au traitement",
            ]}
          />
          <Para>Pour exercer ces droits, contactez-nous à l'adresse ci-dessous.</Para>
        </Section>

        <Section number={9} title="Modifications">
          <Para>
            Nous nous réservons le droit de modifier cette politique de confidentialité à tout
            moment. Les modifications seront publiées dans l'application et vous serez informé de
            tout changement significatif.
          </Para>
        </Section>

        <Section number={10} title="Contact">
          <Para>
            Pour toute question concernant cette politique de confidentialité ou pour exercer vos
            droits :
          </Para>
          <ContactEmail email={CONTACT_EMAIL} />
          <Para>Nous nous engageons à répondre dans un délai maximum de 30 jours.</Para>
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
