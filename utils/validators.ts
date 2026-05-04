import * as Crypto from 'expo-crypto';

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'L\'email est requis';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Email invalide';
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return 'Le mot de passe est requis';
  if (password.length < 6) return 'Le mot de passe doit faire au moins 6 caractères';
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return 'Le nom est requis';
  if (name.trim().length < 2) return 'Le nom doit faire au moins 2 caractères';
  return null;
}

export function validateAmount(amount: string): string | null {
  if (!amount.trim()) return 'Le montant est requis';
  const num = parseFloat(amount.replace(',', '.'));
  if (isNaN(num)) return 'Montant invalide';
  if (num <= 0) return 'Le montant doit être positif';
  if (num > 10000) return 'Montant trop élevé';
  return null;
}

export function parseAmountToCents(amount: string): number {
  const num = parseFloat(amount.replace(',', '.'));
  return Math.round(num * 100);
}

export function validatePinCode(pin: string): string | null {
  if (!pin) return 'Le code PIN est requis';
  if (pin.length !== 4) return 'Le code PIN doit faire 4 chiffres';
  if (!/^\d{4}$/.test(pin)) return 'Le code PIN ne doit contenir que des chiffres';
  return null;
}

export function validateInviteCode(code: string): string | null {
  if (!code) return 'Le code d\'invitation est requis';
  if (code.length !== 6) return 'Le code doit faire 6 chiffres';
  if (!/^\d{6}$/.test(code)) return 'Le code ne doit contenir que des chiffres';
  return null;
}

export function generateInviteCode(): string {
  const bytes = Crypto.getRandomBytes(3);
  const code = 100000 + ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) % 900000;
  return String(code);
}
