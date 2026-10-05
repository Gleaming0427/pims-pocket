import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Header from '@/components/shared/Header';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { useAuthStore } from '@/stores/authStore';
import { validateEmail, validatePassword, validateInviteCode, validatePinCode } from '@/utils/validators';
import colors from '@/constants/colors';
import { getContrastTextColor } from '@/utils/colorContrast';
import { getFirebaseAuthUserMessage } from '@/utils/firebaseAuthErrors';

export default function LoginScreen() {
  const router = useRouter();
  // ?mode=child : ouvre directement l'onglet Enfant (lien « Je suis un enfant »)
  const { mode: modeParam } = useLocalSearchParams<{ mode?: string }>();
  const { signIn, signInChild, isLoading } = useAuthStore();

  const [mode, setMode] = useState<'parent' | 'child'>(modeParam === 'child' ? 'child' : 'parent');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [pin, setPin] = useState('');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  // Erreur affichée en bannière inline (messages français, plus doux qu'une Alert)
  const [bannerError, setBannerError] = useState<string | null>(null);

  const switchMode = (m: 'parent' | 'child') => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(m);
    setBannerError(null);
    setErrors({});
  };

  const handleParentLogin = async () => {
    if (isLoading) return;
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    setErrors({ email: emailError, password: passwordError });

    if (emailError || passwordError) return;

    setBannerError(null);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (e: unknown) {
      const loginErr = getFirebaseAuthUserMessage(e);
      // Permission Firestore = erreur silencieuse (email pas encore vérifié)
      if (/permission|Missing or insufficient/i.test(loginErr)) return;
      setBannerError(loginErr);
    }
  };

  const handleChildLogin = async () => {
    if (isLoading) return;
    const codeError = validateInviteCode(inviteCode);
    const pinError = validatePinCode(pin);
    setErrors({ inviteCode: codeError, pin: pinError });

    if (codeError || pinError) return;

    setBannerError(null);
    try {
      await signInChild(inviteCode, pin);
      router.replace('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/permission|Missing or insufficient/i.test(msg)) return;
      setBannerError(msg || "Code d'invitation ou PIN invalide");
    }
  };

  const ErrorBanner = () => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.error + '10',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
      }}
    >
      <Ionicons name="alert-circle" size={18} color={colors.error} style={{ marginRight: 8 }} />
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>
        {bannerError}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header
        title={mode === 'parent' ? 'Ravi de vous revoir !' : 'Bonjour !'}
        subtitle={mode === 'parent' ? 'Connectez-vous pour gérer la famille' : 'Entre ton code et ton PIN pour te connecter'}
        showBack
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Parent / Enfant */}
        <SegmentedControl
          value={mode}
          onChange={switchMode}
          style={{ marginBottom: 16 }}
          options={[
            { value: 'parent', label: 'Parent' },
            { value: 'child', label: 'Enfant' },
          ]}
        />

        {mode === 'parent' ? (
          <Card padding={20}>
            <Input
              label="Email"
              placeholder="votre@email.com"
              icon="mail-outline"
              value={email}
              onChangeText={(t) => { setEmail(t); setBannerError(null); }}
              keyboardType="email-address"
              autoCapitalize="none"
              textContentType="emailAddress"
              autoComplete="email"
              returnKeyType="next"
              error={errors.email}
            />
            <Input
              label="Mot de passe"
              placeholder="Votre mot de passe"
              icon="lock-closed-outline"
              isPassword
              value={password}
              onChangeText={(t) => { setPassword(t); setBannerError(null); }}
              textContentType="password"
              autoComplete="current-password"
              returnKeyType="go"
              onSubmitEditing={handleParentLogin}
              error={errors.password}
            />
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={{ alignSelf: 'flex-end', marginTop: -6, marginBottom: 16 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: '700', fontSize: 13 }}>
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>
            {bannerError && <ErrorBanner />}
            <Button
              title="Se connecter"
              variant="dark"
              onPress={handleParentLogin}
              loading={isLoading}
              icon={<Ionicons name="log-in-outline" size={18} color="#FFF" />}
            />
          </Card>
        ) : (
          <>
            <Card padding={14} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: colors.secondary + '20',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons name="phone-portrait-outline" size={20} color={colors.textPrimary} />
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                  Ton code et ton PIN se trouvent sur le téléphone de ton parent, dans ta fiche
                  (Compte enfant).
                </Text>
              </View>
            </Card>
            <Card padding={20}>
              <Input
                label="Code d'invitation"
                placeholder="123456"
                icon="key-outline"
                value={inviteCode}
                onChangeText={(t) => { setInviteCode(t); setBannerError(null); }}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="next"
                error={errors.inviteCode}
              />
              <Input
                label="Code PIN"
                placeholder="1234"
                icon="keypad-outline"
                value={pin}
                onChangeText={(t) => { setPin(t); setBannerError(null); }}
                keyboardType="number-pad"
                maxLength={4}
                isPassword
                returnKeyType="go"
                onSubmitEditing={handleChildLogin}
                error={errors.pin}
              />
              {bannerError && <ErrorBanner />}
              <Button
                title="C'est parti !"
                variant="secondary"
                accentColor={colors.secondary}
                onPress={handleChildLogin}
                loading={isLoading}
                icon={<Ionicons name="rocket-outline" size={18} color={getContrastTextColor(colors.secondary)} />}
              />
            </Card>
          </>
        )}

        {/* Liens bas de page */}
        {mode === 'parent' && (
          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
            style={{ alignSelf: 'center', marginTop: 20 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 14, color: colors.textSecondary }}>
              Pas encore de compte ?{' '}
              <Text style={{ color: colors.textPrimary, fontWeight: '700' }}>Créer un compte parent</Text>
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={() => router.push('/(legal)/privacy')}
          style={{ alignSelf: 'center', marginTop: 24 }}
        >
          <Text style={{ color: colors.textLight, fontSize: 12, fontWeight: '600' }}>
            Politique de confidentialité
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
