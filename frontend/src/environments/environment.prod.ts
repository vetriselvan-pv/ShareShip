export const environment = {
  production: true,
  currencyCode: 'INR',
  currencySymbol: '₹',
  apiUrl:
    typeof window !== 'undefined' && (window as any).__ENV?.API_URL
      ? (window as any).__ENV.API_URL
      : '',
};
