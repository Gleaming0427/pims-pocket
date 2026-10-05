import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Share, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Header from '@/components/shared/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import GroupTitle from '@/components/ui/GroupTitle';
import { useAuthStore } from '@/stores/authStore';
import { useChildren } from '@/hooks/useChildren';
import {
  FamilyParent,
  ParentInvite,
  createParentInvite,
  getFamilyParents,
  joinFamilyWithCode,
  removeFamilyParent,
} from '@/lib/familyParents';
import colors from '@/constants/colors';

const MAX_PARENTS = 4;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export default function FamilyParentsScreen() {
  const router = useRouter();
  // Lien d'invitation : pimspocket://family-parents?code=XXXXXX préremplit le code
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();
  const user = useAuthStore((s) => s.user);
  const { children } = useChildren();

  const [parents, setParents] = useState<FamilyParent[] | null>(null);
  const [invite, setInvite] = useState<ParentInvite | null>(null);
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [joinCode, setJoinCode] = useState((codeParam ?? '').toUpperCase().slice(0, 6));
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  const loadParents = useCallback(async () => {
    try {
      setParents(await getFamilyParents());
    } catch (e: unknown) {
      setParents([]);
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de charger les parents.');
    }
  }, []);

  useEffect(() => {
    if (user?.familyId) loadParents();
  }, [user?.familyId, loadParents]);

  useEffect(() => {
    if (codeParam) setJoinCode(codeParam.toUpperCase().slice(0, 6));
  }, [codeParam]);

  // Bascule l'app sur une autre famille (rejointe, ou nouvelle après départ)
  const switchToFamily = async (familyId: string) => {
    const store = useAuthStore.getState();
    if (store.user) store.setUser({ ...store.user, familyId });
    await store.fetchFamily(familyId);
    router.replace('/(parent)/dashboard');
  };

  const handleCreateInvite = async () => {
    if (isCreatingInvite) return;
    setIsCreatingInvite(true);
    try {
      setInvite(await createParentInvite());
    } catch (e: unknown) {
      Alert.alert('Erreur', e instanceof Error ? e.message : "Impossible de créer l'invitation.");
    }
    setIsCreatingInvite(false);
  };

  const handleShareInvite = async () => {
    if (!invite) return;
    const link = Linking.createURL('/family-parents', { queryParams: { code: invite.code } });
    try {
      await Share.share({
        message:
          `Rejoins notre famille sur Pims Pocket !\n\n` +
          `1. Installe l'application et crée ton compte parent.\n` +
          `2. Ouvre ce lien depuis ton téléphone : ${link}\n\n` +
          `Si le lien ne s'ouvre pas : Réglages → Parents de la famille → « Rejoindre une famille », ` +
          `puis entre le code ${invite.code}.\n\n` +
          `Le code est valable 7 jours.`,
      });
    } catch {
      // Partage annulé
    }
  };

  const handleJoin = async () => {
    if (isJoining) return;
    if (joinCode.trim().length !== 6) {
      setJoinError('Le code fait 6 caractères.');
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    try {
      const { familyId } = await joinFamilyWithCode(joinCode);
      Alert.alert('Bienvenue dans la famille !', 'Tu peux maintenant gérer les enfants avec l’autre parent.');
      await switchToFamily(familyId);
    } catch (e: unknown) {
      setJoinError(e instanceof Error ? e.message : 'Code invalide ou expiré.');
    }
    setIsJoining(false);
  };

  const confirmRemove = (parent: FamilyParent) => {
    const leaving = parent.isMe;
    Alert.alert(
      leaving ? 'Quitter la famille ?' : `Retirer ${parent.displayName || 'ce parent'} ?`,
      leaving
        ? "Tu n'auras plus accès aux enfants de cette famille. Tu repartiras avec une famille vide."
        : "Il n'aura plus accès aux enfants de cette famille.",
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: leaving ? 'Quitter' : 'Retirer',
          style: 'destructive',
          onPress: async () => {
            setBusyUid(parent.uid);
            try {
              const result = await removeFamilyParent(parent.uid);
              if (leaving && result.familyId) {
                await switchToFamily(result.familyId);
                return;
              }
              await loadParents();
            } catch (e: unknown) {
              Alert.alert('Erreur', e instanceof Error ? e.message : 'Action impossible.');
            }
            setBusyUid(null);
          },
        },
      ]
    );
  };

  const otherParents = parents?.filter((p) => !p.isMe) ?? [];
  const me = parents?.find((p) => p.isMe);
  const canInvite = (parents?.length ?? 0) < MAX_PARENTS;
  // On ne peut rejoindre une autre famille que si la sienne n'a pas encore d'enfant
  const canJoin = children.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}>
      <Header title="Parents de la famille" showBack />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 20, paddingBottom: 40, maxWidth: 720, width: '100%', alignSelf: 'center' }}
      >
        {/* Explication */}
        <Card padding={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: colors.primary + '15',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
            <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
              Invite l'autre parent : il pourra envoyer de l'argent, créer et valider les missions, et
              répondre aux demandes, comme toi.
            </Text>
          </View>
        </Card>

        {/* Parents */}
        <GroupTitle label="Parents" />
        <Card padding={14}>
          {parents === null ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: 16 }} />
          ) : (
            parents.map((parent, i) => (
              <View key={parent.uid}>
                <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: colors.primary + '20',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {initials(parent.displayName) ? (
                      <Text style={{ fontSize: 16, fontWeight: '800', color: colors.primary }}>
                        {initials(parent.displayName)}
                      </Text>
                    ) : (
                      <Ionicons name="person" size={20} color={colors.primary} />
                    )}
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text numberOfLines={1} style={{ fontSize: 15, fontWeight: '700', color: colors.textPrimary }}>
                      {parent.displayName || 'Parent'}
                      {parent.isMe ? ' (toi)' : ''}
                    </Text>
                    {!!parent.email && (
                      <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                        {parent.email}
                      </Text>
                    )}
                  </View>
                  {parent.isCreator && (
                    <View
                      style={{
                        backgroundColor: colors.canvas,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textPrimary }}>
                        Créateur
                      </Text>
                    </View>
                  )}
                  {!parent.isMe &&
                    (busyUid === parent.uid ? (
                      <ActivityIndicator color={colors.error} style={{ marginLeft: 10 }} />
                    ) : (
                      <TouchableOpacity
                        onPress={() => confirmRemove(parent)}
                        accessibilityRole="button"
                        accessibilityLabel={`Retirer ${parent.displayName}`}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={{ marginLeft: 10 }}
                      >
                        <Text style={{ fontSize: 13, fontWeight: '700', color: colors.error }}>Retirer</Text>
                      </TouchableOpacity>
                    ))}
                </View>
                {i < parents.length - 1 && (
                  <View style={{ height: 1, backgroundColor: colors.canvasMuted, marginLeft: 56 }} />
                )}
              </View>
            ))
          )}
        </Card>

        {/* Inviter */}
        <GroupTitle label="Inviter un parent" />
        <Card>
          {!canInvite ? (
            <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
              Ta famille compte déjà {MAX_PARENTS} parents, le maximum.
            </Text>
          ) : invite ? (
            <>
              <View
                style={{
                  backgroundColor: colors.canvas,
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>Code d'invitation</Text>
                <Text
                  selectable
                  style={{ fontSize: 32, fontWeight: '800', color: colors.textPrimary, letterSpacing: 6, marginTop: 4 }}
                >
                  {invite.code}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                  Valable jusqu'au{' '}
                  {new Date(invite.expiresAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </Text>
              </View>
              <View style={{ marginTop: 14, gap: 6 }}>
                {[
                  "L'autre parent crée son compte dans Pims Pocket.",
                  'Il ouvre Réglages → Parents de la famille.',
                  'Il entre ce code dans « Rejoindre une famille ».',
                ].map((step, i) => (
                  <View key={step} style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Text style={{ width: 18, fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>
                      {i + 1}.
                    </Text>
                    <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>{step}</Text>
                  </View>
                ))}
              </View>
              <Button
                title="Partager le code"
                variant="dark"
                icon={<Ionicons name="share-outline" size={18} color="#FFF" />}
                onPress={handleShareInvite}
                style={{ marginTop: 14 }}
              />
            </>
          ) : (
            <>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 }}>
                Crée un code et envoie-le à l'autre parent. Il est valable 7 jours et ne sert qu'une fois.
              </Text>
              <Button
                title="Créer un code d'invitation"
                variant="dark"
                icon={<Ionicons name="person-add" size={18} color="#FFF" />}
                loading={isCreatingInvite}
                onPress={handleCreateInvite}
              />
            </>
          )}
        </Card>

        {/* Rejoindre une autre famille : seulement tant qu'on n'a pas d'enfant */}
        {canJoin && (
          <>
            <GroupTitle label="Rejoindre une famille" />
            <Card>
              <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 14 }}>
                L'autre parent utilise déjà Pims Pocket ? Entre le code qu'il t'a envoyé pour rejoindre
                sa famille et retrouver ses enfants.
              </Text>
              <Input
                label="Code d'invitation"
                placeholder="ABC234"
                icon="key-outline"
                value={joinCode}
                onChangeText={(t) => {
                  setJoinCode(t.toUpperCase());
                  setJoinError(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={6}
                error={joinError}
              />
              <Button
                title="Rejoindre la famille"
                variant="dark"
                icon={<Ionicons name="enter-outline" size={18} color="#FFF" />}
                loading={isJoining}
                disabled={joinCode.trim().length !== 6}
                onPress={handleJoin}
              />
            </Card>
          </>
        )}

        {/* Quitter : seulement s'il reste un autre parent */}
        {me && otherParents.length > 0 && (
          <Button
            title="Quitter la famille"
            variant="light"
            textStyle={{ color: colors.error }}
            loading={busyUid === me.uid}
            onPress={() => confirmRemove(me)}
            style={{ marginTop: 20 }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
