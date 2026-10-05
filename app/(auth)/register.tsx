import React, { useState } from 'react';
import { View, Text, Image, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Header from '@/components/shared/Header';
import StepHeader from '@/components/ui/StepHeader';
import { useAuthStore } from '@/stores/authStore';
import { validateEmail, validatePassword, validateName } from '@/utils/validators';
import colors from '@/constants/colors';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';

// Case à cocher d'accord (politique, conditions)
function ConsentRow({
  checked,
  onToggle,
  children,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 8,
          borderWidth: checked ? 0 : 1.5,
          borderColor: colors.textLight,
          backgroundColor: checked ? colors.textPrimary : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {checked && <Ionicons name="checkmark" size={17} color="#FFF" />}
      </View>
      <Text style={{ flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{children}</Text>
    </TouchableOpacity>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuthStore();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const passwordRules = [
    { label: '8 caractères', ok: password.length >= 8 },
    { label: '1 majuscule', ok: /[A-Z]/.test(password) },
    { label: '1 chiffre', ok: /[0-9]/.test(password) },
  ];

  const handleRegister = async () => {
    if (isLoading) return;
    const nameError = validateName(displayName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError =
      password !== confirmPassword ? 'Les mots de passe ne correspondent pas' : null;

    setErrors({
      displayName: nameError,
      email: emailError,
      password: passwordError,
      confirmPassword: confirmError,
    });

    if (nameError || emailError || passwordError || confirmError) return;

    if (!acceptedPrivacy) {
      Alert.alert('Consentement requis', 'Vous devez accepter la politique de confidentialité.');
      return;
    }
    if (!acceptedTerms) {
      Alert.alert('Consentement requis', 'Vous devez accepter les conditions d\'utilisation.');
      return;
    }

    try {
      await signUp(email.trim(), password, displayName.trim());
      router.replace('/');
    } catch (e: unknown) {
      const msg = getFirebaseAuthUserMessage(e);
      // Permission Firestore = erreur silencieuse (email pas encore vérifié)
      if (/permission|Missing or insufficient/i.test(msg)) return;
      Alert.alert('Erreur', msg);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Créer un compte" subtitle="Bienvenue dans la famille !" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Accueil */}
        <Card padding={14} style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={require('../../assets/icon.png')}
              style={{ width: 44, height: 44, borderRadius: 14, marginRight: 12 }}
              accessibilityLabel="Logo Pims Pocket"
            />
            <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
              Crée ton compte parent pour gérer l'argent de poche de tes enfants en quelques secondes.
            </Text>
          </View>
        </Card>

        {/* 1. Informations */}
        <Card style={{ marginBottom: 12 }}>
          <StepHeader step={1} title="Tes informations" />
          <Input
            label="Ton prénom"
            placeholder="Jean"
            icon="person-outline"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            maxLength={50}
            returnKeyType="next"
            error={errors.displayName}
          />
          <Input
            label="Email"
            placeholder="ton@email.com"
            icon="mail-outline"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            autoComplete="email"
            returnKeyType="next"
            error={errors.email}
          />
        </Card>

        {/* 2. Mot de passe */}
        <Card style={{ marginBottom: 12 }}>
          <StepHeader step={2} title="Ton mot de passe" />
          <Input
            label="Mot de passe"
            placeholder="Choisis un mot de passe"
            icon="lock-closed-outline"
            isPassword
            value={password}
            onChangeText={setPassword}
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="next"
            error={errors.password}
          />
          {/* Critères cochés pendant la saisie */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: -6, marginBottom: 16 }}>
            {passwordRules.map((rule) => (
              <View
                key={rule.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: rule.ok ? colors.success + '18' : colors.canvas,
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                }}
              >
                <Ionicons
                  name={rule.ok ? 'checkmark-circle' : 'ellipse-outline'}
                  size={14}
                  color={rule.ok ? colors.success : colors.textLight}
                />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textPrimary }}>{rule.label}</Text>
              </View>
            ))}
          </View>
          <Input
            label="Confirmer le mot de passe"
            placeholder="Retape ton mot de passe"
            icon="lock-closed-outline"
            isPassword
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={handleRegister}
            error={
              errors.confirmPassword ??
              (confirmPassword.length > 0 && confirmPassword !== password
                ? 'Les mots de passe ne correspondent pas'
                : null)
            }
          />
        </Card>

        {/* 3. Accords */}
        <Card style={{ marginBottom: 20 }}>
          <StepHeader step={3} title="Tes accords" />
          <ConsentRow checked={acceptedPrivacy} onToggle={() => setAcceptedPrivacy(!acceptedPrivacy)}>
            J'accepte la{' '}
            <Text
              style={{ color: colors.textPrimary, fontWeight: '700', textDecorationLine: 'underline' }}
              onPress={() => router.push('/(legal)/privacy')}
            >
              politique de confidentialité
            </Text>
          </ConsentRow>
          <ConsentRow checked={acceptedTerms} onToggle={() => setAcceptedTerms(!acceptedTerms)}>
            J'accepte les{' '}
            <Text
              style={{ color: colors.textPrimary, fontWeight: '700', textDecorationLine: 'underline' }}
              onPress={() => router.push('/(legal)/terms')}
            >
              conditions d'utilisation
            </Text>
          </ConsentRow>
        </Card>

        <Button
          title="Créer mon compte"
          variant="dark"
          onPress={handleRegister}
          loading={isLoading}
          icon={<Ionicons name="sparkles-outline" size={18} color="#FFF" />}
        />

        {/* Second parent invité */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.canvasMuted,
            padding: 12,
            marginTop: 16,
          }}
        >
          <Ionicons name="people-outline" size={18} color={colors.textSecondary} style={{ marginTop: 1 }} />
          <Text style={{ flex: 1, marginLeft: 10, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
            <Text style={{ fontWeight: '700', color: colors.textPrimary }}>Tu as reçu un code d'un autre parent ?</Text>{' '}
            Crée d'abord ton compte, puis rejoins sa famille depuis ton écran d'accueil.
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          style={{ alignSelf: 'center', marginTop: 20 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 14, color: colors.textSecondary }}>
            Déjà un compte ? <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Se connecter</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
