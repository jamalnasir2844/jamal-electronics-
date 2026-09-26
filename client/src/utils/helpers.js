// Format currency - PKR by default
export const formatCurrency = (amount, symbol = 'Rs.') => {
  const num = Number(amount || 0);
  return `${symbol} ${num.toLocaleString('en-PK', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};

// Format date
export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// Format date time
export const formatDateTime = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Get stock status
export const getStockStatus = (stock, minimumStock) => {
  if (stock === 0) return { label: 'Out of Stock', color: 'red' };
  if (stock <= minimumStock) return { label: 'Low Stock', color: 'amber' };
  return { label: 'In Stock', color: 'green' };
};

// Calculate PCO charge
export const calculatePCOCharge = (withdrawalAmount, chargeRate, chargePer) => {
  if (!withdrawalAmount || !chargePer) return { serviceCharge: 0, customerPaid: withdrawalAmount || 0 };
  const serviceCharge = (withdrawalAmount / chargePer) * chargeRate;
  const customerPaid = withdrawalAmount + serviceCharge;
  return { serviceCharge, customerPaid };
};

// Truncate text
export const truncate = (text, length = 30) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};
