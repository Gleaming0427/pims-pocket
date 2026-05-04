import type { Timestamp } from '@/types';

export function formatCurrency(cents: number): string {
  const c = Number(cents);
  if (!Number.isFinite(c)) {
    return (0).toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
  const euros = c / 100;
  return euros.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatCurrencyShort(cents: number): string {
  const c = Number(cents);
  if (!Number.isFinite(c)) return '0,00 €';
  const euros = c / 100;
  return `${euros.toFixed(2).replace('.', ',')} €`;
}

export function formatDate(date: Timestamp | Date): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(date: Timestamp | Date): string {
  const d = date instanceof Date ? date : date.toDate();
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function formatRelativeDate(date: Timestamp | Date): string {
  const d = date instanceof Date ? date : date.toDate();
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return formatDateShort(d);
}

export function getDayName(day: number): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[day] ?? '';
}

export function getAge(birthDate: Timestamp | Date): number {
  const d = birthDate instanceof Date ? birthDate : birthDate.toDate();
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    age--;
  }
  return age;
}
