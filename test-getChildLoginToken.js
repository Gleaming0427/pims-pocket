/**
 * Script de test pour reproduire le comportement exact de getChildLoginToken
 * Usage: node test-getChildLoginToken.js
 */
const admin = require('./functions/node_modules/firebase-admin');

admin.initializeApp();
const db = admin.firestore();

const crypto = require('crypto');
const INVITE_CODE = '591601';
const PIN = '5678'; // PIN de test

function hashPin(pin, secret) {
  return crypto.createHash('sha256').update(`${pin}:${secret}`).digest('hex');
}

async function main() {
  console.log('=== Test getChildLoginToken ===');
  console.log(`InviteCode: ${INVITE_CODE}, PIN: ${PIN}`);

  // Étape 1 : Recherche du document enfant via collectionGroup
  console.log('\n1. Requête collectionGroup...');
  let childrenSnap;
  try {
    childrenSnap = await db
      .collectionGroup('children')
      .where('inviteCode', '==', INVITE_CODE)
      .limit(1)
      .get();
    console.log(`   ✅ OK - ${childrenSnap.size} résultat(s)`);
  } catch (err) {
    console.error('   ❌ ERREUR collectionGroup:', err.code || err.message);
    if (err.details) console.error('   Détails:', err.details);
    process.exit(2);
  }

  if (childrenSnap.empty) {
    console.log('   ⚠️  Code introuvable. Recherche alternative manuelle...');
    const usersSnap = await db.collection('users').get();
    let found = false;
    for (const userDoc of usersSnap.docs) {
      const childrenSnap2 = await db
        .collection('users').doc(userDoc.id)
        .collection('children')
        .where('inviteCode', '==', INVITE_CODE)
        .limit(1).get();
      if (!childrenSnap2.empty) {
        const cd = childrenSnap2.docs[0].data();
        console.log(`   ✅ Trouvé ! Parent: ${userDoc.id}, Child doc ID: ${childrenSnap2.docs[0].id}`);
        console.log(`   Données:`, JSON.stringify(cd, null, 2));
        found = true;
        childrenSnap = childrenSnap2; // pour suite
        break;
      }
    }
    if (!found) {
      console.log('   ❌ InviteCode introuvable dans toute la base.');
      process.exit(3);
    }
  }

  // Étape 2 : Détail du doc
  const childDoc = childrenSnap.docs[0];
  const childData = childDoc.data();
  console.log(`\n2. Document:`);
  console.log(`   Ref: ${childDoc.ref.path}`);
  Object.entries(childData).forEach(([k, v]) => {
    const s = typeof v === 'string' && v.length > 60 ? v.slice(0, 60) + '...' : String(v);
    console.log(`   ${k}: ${s}`);
  });

  // Étape 3 : Préconditions
  console.log('\n3. Préconditions:');
  const hasLinked = !!childData.linkedUserId;
  const hasSecret = !!childData._serverSecret;
  const hasHash   = !!childData._pinHash;
  console.log(`   linkedUserId: ${hasLinked ? childData.linkedUserId : '❌ absent'}`);
  console.log(`   _serverSecret: ${hasSecret ? '✅ présent' : '❌ absent'}`);
  console.log(`   _pinHash: ${hasHash ? '✅ présent' : '❌ absent'}`);

  if (!hasLinked || !hasSecret) {
    console.log('   → Compte enfant pas encore activé (createChildAccount non appelé ou échoué).');
    process.exit(4);
  }

  // Étape 4 : PIN
  console.log('\n4. Vérification PIN:');
  if (hasSecret && hasHash) {
    const providedHash = hashPin(PIN, childData._serverSecret);
    const match = providedHash === childData._pinHash;
    console.log(`   PIN testé: "${PIN}"`);
    console.log(`   Hash attendu:  ${childData._pinHash.slice(0, 20)}...`);
    console.log(`   Hash calculé:  ${providedHash.slice(0, 20)}...`);
    console.log(`   ✅/❌ ${match ? 'PIN VALIDE' : 'PIN INVALIDE'}`);
    if (!match) {
      // Essaie quelques PINs courants
      console.log('\n   Tentative PINs courants...');
      for (const p of ['0000','1111','1234','4321']) {
        const h = hashPin(p, childData._serverSecret);
        if (h === childData._pinHash) {
          console.log(`   🎯 PIN trouvé: "${p}"`);
          break;
        }
      }
    }
  }

  // Étape 5 : CustomToken
  console.log('\n5. Génération customToken...');
  try {
    const customToken = await admin.auth().createCustomToken(childData.linkedUserId);
    console.log(`   ✅ Token généré (${customToken.length} chars)`);
  } catch (err) {
    console.error(`   ❌ ERREUR: ${err.code || ''} ${err.message}`);
  }

  console.log('\n=== Test terminé ===');
}

main().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(1);
});