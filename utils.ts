export const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const parseRupiahInput = (value: string): number => {
  // Remove non-digit characters
  const numericString = value.replace(/[^0-9]/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
};

export const formatInputDisplay = (amount: number): string => {
  if (!amount) return '';
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

export const getMonthName = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};