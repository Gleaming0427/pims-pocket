import React, { useState } from 'react';
import { View, Text, ScrollView, Alert, Share, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  deleteUser,
} from 'firebase/auth';
import { auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { useAuthStore } from '@/stores/authStore';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import GroupTitle from '@/components/ui/GroupTitle';
import colors from '@/constants/colors';

export default function SecurityScreen() {
  const router = useRouter();
  const { signOut, user } = useAuthStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const isGoogleUser = auth.currentUser?.providerData?.some(
    (p) => p.providerId === 'google.com'
  );

  const handleChangePassword = async () => {
    if (isChanging) return;
    if (!newPassword || !currentPassword) {
      Alert.alert('Erreur', 'Remplis tous les champs.');
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

      Alert.alert('Mot de passe modifié', 'Ton nouveau mot de passe est enregistré.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch {
      Alert.alert('Erreur', 'Mot de passe actuel incorrect ou erreur réseau.');
    } finally {
      setIsChanging(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Supprimer mon compte',
      'Cette action est irréversible. Toutes tes données et celles de tes enfants seront perdues.',
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

  const handleExportData = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const callFn = httpsCallable(functions, 'exportUserData');
      const result = await callFn({});
      const json = JSON.stringify((result.data as { data: unknown }).data, null, 2);
      // Feuille de partage du téléphone : enregistrer dans Fichiers, envoyer par mail…
      await Share.share({ title: 'Mes données Pims Pocket', message: json });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      Alert.alert('Erreur', msg);
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const firebaseUser = auth.currentUser;
      if (!firebaseUser) throw new Error('Non connecté');

      if (!isGoogleUser && firebaseUser.email) {
        const credential = EmailAuthProvider.credential(firebaseUser.email, deletePassword);
        await reauthenticateWithCredential(firebaseUser, credential);
      }

      // 1. Supprimer toutes les données Firestore
      const callFn = httpsCallable(functions, 'deleteUserData');
      await callFn({});

      // 2. Supprimer le compte Firebase Auth
      await deleteUser(firebaseUser);
      await signOut();
      router.replace('/');
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer le compte. Vérifie ton mot de passe.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Sécurité" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Compte */}
        <GroupTitle label="Compte" first />
        <Card padding={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.canvas,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons
                name={isGoogleUser ? 'logo-google' : 'mail-outline'}
                size={19}
                color={colors.textPrimary}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>Connecté avec</Text>
              <Text
                numberOfLines={1}
                style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginTop: 2 }}
              >
                {user?.email}
              </Text>
            </View>
            <View
              style={{
                backgroundColor: colors.canvas,
                borderRadius: 999,
                paddingHorizontal: 10,
                paddingVertical: 4,
                marginLeft: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>
                {isGoogleUser ? 'Google' : 'Email'}
              </Text>
            </View>
          </View>

          {/* Mot de passe : uniquement pour les comptes email */}
          {!isGoogleUser && (
            <>
              <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginLeft: 50, marginTop: 12 }} />
              <TouchableOpacity
                onPress={() => setShowPasswordForm((v) => !v)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityState={{ expanded: showPasswordForm }}
                style={{ flexDirection: 'row', alignItems: 'center', paddingTop: 12 }}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    backgroundColor: colors.canvas,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="key-outline" size={19} color={colors.textPrimary} />
                </View>
                <Text
                  style={{ flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '600', color: colors.textPrimary }}
                >
                  Changer le mot de passe
                </Text>
                <Ionicons
                  name={showPasswordForm ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.textLight}
                />
              </TouchableOpacity>

              {showPasswordForm && (
                <View style={{ marginTop: 16 }}>
                  <Input
                    label="Mot de passe actuel"
                    placeholder="Ton mot de passe actuel"
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
                    placeholder="Retape le nouveau mot de passe"
                    icon="lock-closed-outline"
                    isPassword
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    error={
                      confirmPassword.length > 0 && confirmPassword !== newPassword
                        ? 'Les mots de passe ne correspondent pas'
                        : null
                    }
                  />
                  <Button
                    title="Enregistrer le mot de passe"
                    variant="dark"
                    onPress={handleChangePassword}
                    loading={isChanging}
                  />
                </View>
              )}
            </>
          )}
        </Card>

        {/* Données personnelles */}
        <GroupTitle label="Données personnelles" />
        <Card padding={14}>
          <TouchableOpacity
            onPress={handleExportData}
            disabled={isExporting}
            activeOpacity={0.7}
            accessibilityRole="button"
            style={{ flexDirection: 'row', alignItems: 'center', opacity: isExporting ? 0.5 : 1 }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.canvas,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="download-outline" size={19} color={colors.textPrimary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.textPrimary }}>
                {isExporting ? 'Préparation…' : 'Exporter mes données'}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Une copie de toutes tes données, à enregistrer ou envoyer
              </Text>
            </View>
            <Ionicons name="share-outline" size={18} color={colors.textLight} />
          </TouchableOpacity>
        </Card>

        {/* Zone sensible */}
        <GroupTitle label="Zone sensible" />
        <Card padding={14} style={{ borderWidth: 1, borderColor: colors.error + '30' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                backgroundColor: colors.error + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="trash-outline" size={19} color={colors.error} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.error }}>
                Supprimer mon compte
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Définitif : enfants, transactions et missions seront effacés
              </Text>
            </View>
          </View>

          {showDeleteConfirm ? (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 19 }}>
                {isGoogleUser
                  ? 'Confirme la suppression de ton compte.'
                  : 'Entre ton mot de passe pour confirmer la suppression.'}
              </Text>
              {!isGoogleUser && (
                <Input
                  label="Mot de passe"
                  placeholder="Ton mot de passe"
                  icon="lock-closed-outline"
                  isPassword
                  value={deletePassword}
                  onChangeText={setDeletePassword}
                />
              )}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  title="Annuler"
                  variant="light"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                  }}
                />
                <Button
                  title="Supprimer"
                  variant="danger"
                  fullWidth={false}
                  style={{ flex: 1 }}
                  loading={isDeleting}
                  onPress={confirmDeleteAccount}
                />
              </View>
            </View>
          ) : (
            <Button
              title="Supprimer mon compte"
              variant="light"
              onPress={handleDeleteAccount}
              textStyle={{ color: colors.error }}
              style={{ marginTop: 14 }}
            />
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}
