import React, { useState } from 'react';
import { View, Text, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { validateEmail } from '@/utils/validators';
import colors from '@/constants/colors';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;

    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (e: unknown) {
      Alert.alert('Erreur', getFirebaseAuthUserMessage(e));
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <Header title="Email envoyé" showBack />
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 40,
          }}
        >
          <Text style={{ fontSize: 64, marginBottom: 20 }}>📧</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textPrimary,
              textAlign: 'center',
              marginBottom: 12,
            }}
          >
            Vérifiez votre boîte mail
          </Text>
          <Text
            style={{
              fontSize: 15,
              color: colors.textSecondary,
              textAlign: 'center',
              lineHeight: 22,
              marginBottom: 32,
            }}
          >
            Un email de réinitialisation a été envoyé à {email}. Suivez les instructions
            pour créer un nouveau mot de passe.
          </Text>
          <Button
            title="Retour à la connexion"
            onPress={() => router.back()}
            variant="outline"
            fullWidth={false}
            style={{ paddingHorizontal: 32 }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Mot de passe oublié" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 15,
            color: colors.textSecondary,
            marginBottom: 24,
            lineHeight: 22,
          }}
        >
          Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser
          votre mot de passe.
        </Text>

        <Input
          label="Email"
          placeholder="votre@email.com"
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={error}
        />

        <Button
          title="Envoyer le lien"
          onPress={handleReset}
          loading={isLoading}
          style={{ marginTop: 8 }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
