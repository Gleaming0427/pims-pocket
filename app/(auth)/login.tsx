import React, { useState } from 'react';
import { View, Text, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Header from '@/components/shared/Header';
import { useAuthStore } from '@/stores/authStore';
import { validateEmail, validatePassword, validateInviteCode, validatePinCode } from '@/utils/validators';
import colors from '@/constants/colors';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, signInChild, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'parent' | 'child'>('parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const handleParentLogin = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (e: unknown) {
      const loginErr = getFirebaseAuthUserMessage(e);
      if (!/permission|Missing or insufficient/i.test(loginErr)) {
        Alert.alert('Erreur', loginErr);
      }
    }
  };

  const handleChildLogin = async () => {
    const codeError = validateInviteCode(inviteCode);
    const pinError = validatePinCode(pin);
    setErrors({ inviteCode: codeError, pin: pinError });

    if (codeError || pinError) return;

    try {
      await signInChild(inviteCode, pin);
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!/permission|Missing or insufficient/i.test(msg)) {
        Alert.alert('Erreur', msg || "Code d'invitation ou PIN invalide");
      }
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Connexion" showBack />
      <ScrollView
        contentContainerStyle={{ padding: 24, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.border,
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          {(['parent', 'child'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={{
                flex: 1,
                paddingVertical: 10,
                borderRadius: 10,
                backgroundColor: mode === m ? colors.surface : 'transparent',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  fontWeight: '600',
                  fontSize: 15,
                  color: mode === m ? colors.primary : colors.textSecondary,
                }}
              >
                {m === 'parent' ? '👨‍👩‍👧 Parent' : '🧒 Enfant'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'parent' ? (
          <>
            <Input
              label="Email"
              placeholder="votre@email.com"
              icon="mail-outline"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />
            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              icon="lock-closed-outline"
              isPassword
              value={password}
              onChangeText={setPassword}
              error={errors.password}
            />
            <Button
              title="Se connecter"
              onPress={handleParentLogin}
              loading={isLoading}
              style={{ marginTop: 8 }}
            />
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'center', marginTop: 16 }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/(legal)/privacy')}
              style={{ alignSelf: 'center', marginTop: 20 }}
            >
              <Text style={{ color: colors.textLight, fontSize: 12 }}>
                Politique de confidentialité
              </Text>
            </TouchableOpacity>

          </>
        ) : (
          <>
            <Input
              label="Code d'invitation"
              placeholder="123456"
              icon="key-outline"
              value={inviteCode}
              onChangeText={setInviteCode}
              keyboardType="number-pad"
              maxLength={6}
              error={errors.inviteCode}
            />
            <Input
              label="Code PIN"
              placeholder="1234"
              icon="keypad-outline"
              value={pin}
              onChangeText={setPin}
              keyboardType="number-pad"
              maxLength={4}
              isPassword
              error={errors.pin}
            />
            <Button
              title="Se connecter"
              onPress={handleChildLogin}
              loading={isLoading}
              style={{ marginTop: 8 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
