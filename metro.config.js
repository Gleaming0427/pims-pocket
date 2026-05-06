const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
const merged = withNativeWind(config, { input: "./global.css" });

// Firebase Auth (modular) on React Native: Metro's package "exports" resolution
// can pick the browser @firebase/auth build, which never registers the "auth"
// component → "Component auth has not been registered yet". Disabling package
// exports restores resolution via the "react-native" field (see @firebase/auth
// package.json). Same approach as Firebase + Expo community guidance:
// https://stackoverflow.com/questions/79602687/react-native-expo-firebase-auth-component-auth-has-not-been-registered-yet
merged.resolver.unstable_enablePackageExports = false;

// npm peut hoister @firebase/auth à la racine (node_modules/@firebase/auth)
// ou le nicher sous firebase (node_modules/firebase/node_modules/@firebase/auth)
// selon la version et le mode d'installation. On résout dynamiquement pour
// éviter les chemins en dur qui cassent silencieusement.
const fs = require("fs");

function resolveFirebaseAuthRnFile(file) {
  const candidates = [
    path.resolve(__dirname, `node_modules/@firebase/auth/dist/rn/${file}`),
    path.resolve(__dirname, `node_modules/firebase/node_modules/@firebase/auth/dist/rn/${file}`),
  ];
  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) {
    throw new Error(
      `[metro.config] Impossible de localiser @firebase/auth/dist/rn/${file}. ` +
      `Chemins testés:\n  - ${candidates.join("\n  - ")}`
    );
  }
  return found;
}

const firebaseAuthRnIndex = resolveFirebaseAuthRnFile("index.js");
const firebaseAuthRnInternal = resolveFirebaseAuthRnFile("internal.js");

const origResolve = merged.resolver.resolveRequest;
merged.resolver.resolveRequest = (context, moduleName, platform) => {
  const isNative = platform === "ios" || platform === "android";
  if (isNative) {
    if (moduleName === "firebase/auth" || moduleName === "@firebase/auth") {
      return { type: "sourceFile", filePath: firebaseAuthRnIndex };
    }
    if (moduleName === "@firebase/auth/internal") {
      return { type: "sourceFile", filePath: firebaseAuthRnInternal };
    }
  }

  const origin = (context.originModulePath ?? "").replace(/\\/g, "/");
  if (
    origin.includes("expo-notifications/build") &&
    (moduleName === "./DevicePushTokenAutoRegistration.fx" ||
      moduleName === "./DevicePushTokenAutoRegistration.fx.js")
  ) {
    return {
      type: "sourceFile",
      filePath: path.resolve(__dirname, "shims/expo-notifications-DevicePushTokenAutoRegistration.fx.js"),
    };
  }
  if (typeof origResolve === "function") {
    return origResolve(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = merged;
