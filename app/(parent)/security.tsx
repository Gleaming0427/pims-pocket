import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import colors from '@/constants/colors';

export default function SecurityScreen() {
  const router = useRouter();
  const { signOut, user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isGoogleUser = auth.currentUser?.providerData?.some(
    (p) => p.providerId === 'google.com'
  );

  const handleChangePassword = async () => {
    if (!newPassword || !currentPassword) {
      Alert.alert('Erreur', 'Remplissez tous les champs.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Erreur', 'Le nouveau mot de passe doit faire au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.');
      return;
    }

    setIsChanging(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser?.email) throw new Error('Utilisateur non connecté');

      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      Alert.alert('Succès', 'Votre mot de passe a été modifié.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      Alert.alert('Erreur', 'Mot de passe actuel incorrect ou erreur réseau.');
    } finally {
      setIsChanging(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes vos données et celles de vos enfants seront perdues.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Continuer',
          style: 'destructive',
          onPress: () => setShowDeleteConfirm(true),
        },
      ]
    );
  };

  const confirmDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Non connecté');

      if (!isGoogleUser && firebaseUser.email) {
        const credential = EmailAuthProvider.credential(firebaseUser.email, deletePassword);
        await reauthenticateWithCredential(firebaseUser, credential);
      }

      await deleteUser(firebaseUser);
      await signOut();
      router.replace('/');
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer le compte. Vérifiez votre mot de passe.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title="Sécurité" showBack />
      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Card style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Ionicons name="mail" size={18} color={colors.textSecondary} />
            <Text style={{ marginLeft: 8, fontSize: 14, color: colors.textSecondary }}>
              Connecté avec
            </Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.textPrimary }}>
            {user?.email}
          </Text>
          {isGoogleUser && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: 8,
                backgroundColor: colors.info + '15',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 8,
                alignSelf: 'flex-start',
              }}
            >
              <Ionicons name="logo-google" size={14} color={colors.info} />
              <Text style={{ marginLeft: 6, fontSize: 12, color: colors.info, fontWeight: '600' }}>
                Compte Google
              </Text>
            </View>
          )}
        </Card>

        {!isGoogleUser && (
          <>
            <Text
              style={{
                fontSize: 13,
                fontWeight: '600',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: 1,
                marginBottom: 10,
              }}
            >
              Changer le mot de passe
            </Text>
            <Card style={{ marginBottom: 24 }}>
              <Input
                label="Mot de passe actuel"
                placeholder="Votre mot de passe actuel"
                icon="lock-closed-outline"
                isPassword
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <Input
                label="Nouveau mot de passe"
                placeholder="6 caractères minimum"
                icon="lock-open-outline"
                isPassword
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Input
                label="Confirmer"
                placeholder="Retapez le nouveau mot de passe"
                icon="lock-closed-outline"
                isPassword
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <Button
                title="Modifier le mot de passe"
                onPress={handleChangePassword}
                loading={isChanging}
                style={{ marginTop: 8 }}
              />
            </Card>
          </>
        )}

        <Text
          style={{
            fontSize: 13,
            fontWeight: '600',
            color: colors.error,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 10,
          }}
        >
          Zone dangereuse
        </Text>
        <Card style={{ borderWidth: 1, borderColor: colors.error + '30' }}>
          {showDeleteConfirm ? (
            <>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  lineHeight: 20,
                }}
              >
                {isGoogleUser
                  ? 'Confirmez la suppression de votre compte.'
                  : 'Entrez votre mot de passe pour confirmer la suppression.'}
              </Text>
              {!isGoogleUser && (
                <Input
                  label="Mot de passe"
                  placeholder="Votre mot de passe"
                  icon="lock-closed-outline"
                  isPassword
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                />
              )}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Button
                  title="Annuler"
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <Button
                  title="Supprimer"
                  onPress={confirmDeleteAccount}
                  variant="danger"
                  loading={isDeleting}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <Text
                style={{
                  fontSize: 14,
                  color: colors.textSecondary,
                  marginBottom: 12,
                  lineHeight: 20,
                }}
              >
                La suppression de votre compte est définitive. Toutes les données
                liées (enfants, transactions, missions) seront perdues.
              </Text>
              <Button
                title="Supprimer mon compte"
                onPress={handleDeleteAccount}
                variant="danger"
                icon={<Ionicons name="trash-outline" size={18} color="#FFF" />}
              />
            </>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
