import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

// CRITICAL: Local timezone date conversion (avoid UTC bugs)
export function dateToLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function localStringToDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

export function formatDate(dateString: string): string {
  const date = localStringToDate(dateString);
  return format(date, 'dd.MM.yyyy', { locale: de });
}

export { addDays };
