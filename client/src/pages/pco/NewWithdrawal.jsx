import { useState, useEffect, useRef } from 'react';
import { CreditCard, Calculator, Printer, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, calculatePCOCharge } from '../../utils/helpers';
import { toast } from '../../components/common/Toast';

const NewWithdrawal = () => {
  const [settings, setSettings] = useState({ chargeRate: 20, chargePer: 1000, currencySymbol: 'Rs.' });
  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    withdrawalAmount: '',
    paymentMethod: 'Cash',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.data) setSettings(res.data.data);
    }).catch(() => {});
  }, []);

  const { serviceCharge, customerPaid } = calculatePCOCharge(
    Number(form.withdrawalAmount),
    settings.chargeRate,
    settings.chargePer
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerName) return toast.error('Customer name is required.');
    if (!form.phone) return toast.error('Phone number is required.');
    if (!form.withdrawalAmount || Number(form.withdrawalAmount) <= 0) return toast.error('Withdrawal amount must be greater than 0.');

    setSaving(true);
    try {
      const res = await api.post('/withdrawals', {
        customerName: form.customerName,
        phone: form.phone,
        withdrawalAmount: Number(form.withdrawalAmount),
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      });
      toast.success('Withdrawal completed!');
      setResult(res.data.data);
      setForm({ customerName: '', phone: '', withdrawalAmount: '', paymentMethod: 'Cash', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process withdrawal.');
    } finally { setSaving(false); }
  };

  const handlePrintReceipt = () => {
    if (!result) return;
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print receipt.');
      return;
    }
    
    const withdrawal = result?.withdrawal;
    const dateStr = new Date(withdrawal?.createdAt || Date.now()).toLocaleString('en-PK', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Withdrawal Receipt - ${withdrawal?.transactionReference || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: white; color: #1a1a1a; }
          .receipt { max-width: 350px; margin: 0 auto; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; }
          .header { text-align: center; border-bottom: 2px dashed #e5e7eb; padding-bottom: 16px; margin-bottom: 16px; }
          .shop-name { font-size: 18px; font-weight: 700; color: #1e40af; }
          .receipt-type { font-size: 13px; font-weight: 600; color: #2563eb; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
          .ref { font-family: monospace; font-size: 12px; color: #6b7280; margin-top: 8px; }
          .date { font-size: 11px; color: #9ca3af; margin-top: 2px; }
          .details { margin: 16px 0; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .row .label { color: #6b7280; }
          .row .value { font-weight: 600; color: #111827; }
          .divider { border-top: 1px dashed #e5e7eb; margin: 8px 0; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: 700; }
          .total-row .label { color: #111827; }
          .total-row .value { color: #2563eb; }
          .charge-value { color: #d97706 !important; }
          .footer { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 2px dashed #e5e7eb; font-size: 11px; color: #9ca3af; }
          .success-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 8px; }
          @media print { 
            body { padding: 0; } 
            .receipt { border: none; }
            .no-print { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="shop-name">${settings.shopName || 'Jamal Electronics'}</div>
            <div class="receipt-type">💳 Withdrawal Receipt</div>
            <div class="ref">${withdrawal?.transactionReference || ''}</div>
            <div class="date">${dateStr}</div>
            <div class="success-badge">✓ Withdrawal Successful</div>
          </div>
          
          <div class="details">
            <div class="row">
              <span class="label">Customer</span>
              <span class="value">${withdrawal?.customerNameSnapshot || ''}</span>
            </div>
            <div class="row">
              <span class="label">Phone</span>
              <span class="value">${withdrawal?.phoneSnapshot || ''}</span>
            </div>
            <div class="row">
              <span class="label">Payment</span>
              <span class="value">${withdrawal?.paymentMethod || 'Cash'}</span>
            </div>
          </div>

          <div class="divider"></div>
          
          <div class="details">
            <div class="row">
              <span class="label">Withdrawal Amount</span>
              <span class="value">Rs. ${Number(withdrawal?.withdrawalAmount || 0).toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Service Charge (${withdrawal?.chargeRateSnapshot || 20}/${(withdrawal?.chargePerSnapshot || 1000).toLocaleString()})</span>
              <span class="value charge-value">Rs. ${Number(withdrawal?.serviceCharge || 0).toLocaleString()}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="total-row">
            <span class="label">Customer Paid</span>
            <span class="value">Rs. ${Number(withdrawal?.customerPaid || 0).toLocaleString()}</span>
          </div>

          ${withdrawal?.notes ? `<div style="font-size:11px;color:#6b7280;margin-top:8px;">Note: ${withdrawal.notes}</div>` : ''}

          <div class="footer">
            <p>Thank you for using our services!</p>
            <p style="margin-top:4px;">${settings.phone ? 'Contact: ' + settings.phone : ''}</p>
          </div>
        </div>
        
        <div class="no-print" style="text-align:center;margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 24px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">
            🖨️ Print Receipt
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="section-title">New PCO Withdrawal</h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Current rate: {settings.currencySymbol} {settings.chargeRate} per {settings.currencySymbol} {settings.chargePer?.toLocaleString()}
        </p>
      </div>

      {/* Result card */}
      {result && (
        <div ref={receiptRef} className="card p-5 border-l-4 border-l-green-500 bg-green-50">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-green-900">Withdrawal Completed!</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Reference:</span> <span className="font-mono font-bold text-blue-700">{result.withdrawal?.transactionReference}</span></div>
            <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{result.withdrawal?.customerNameSnapshot}</span></div>
            <div><span className="text-gray-500">Withdrawal:</span> <span className="font-semibold">{formatCurrency(result.withdrawal?.withdrawalAmount)}</span></div>
            <div><span className="text-gray-500">Service Charge:</span> <span className="font-semibold text-amber-600">{formatCurrency(result.withdrawal?.serviceCharge)}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Customer Paid:</span> <span className="font-bold text-green-700 text-lg">{formatCurrency(result.withdrawal?.customerPaid)}</span></div>
          </div>
          
          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-green-200">
            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium shadow-sm"
            >
              <Printer className="h-4 w-4" />
              Print Receipt
            </button>
            <button onClick={() => setResult(null)} className="text-sm text-green-700 hover:text-green-900 font-medium">
              ← New withdrawal
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
            <input type="text" className="input-field" placeholder="Muhammad Jamal" value={form.customerName} onChange={(e) => setForm({...form, customerName: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input type="text" className="input-field" placeholder="0300-0000000" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} required />
            <p className="text-xs text-gray-400 mt-1">Used to identify/create customer</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Withdrawal Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">Rs.</span>
            <input
              type="number"
              min="1"
              step="1"
              className="input-field pl-10 text-lg font-semibold"
              placeholder="0"
              value={form.withdrawalAmount}
              onChange={(e) => setForm({...form, withdrawalAmount: e.target.value})}
              required
            />
          </div>
        </div>

        {/* Live Calculation */}
        {form.withdrawalAmount > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-700">Live Calculation</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Withdrawal Amount</span>
                <span className="font-semibold">{formatCurrency(Number(form.withdrawalAmount))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Service Charge ({settings.chargeRate}/{settings.chargePer?.toLocaleString()})
                </span>
                <span className="font-semibold text-amber-600">{formatCurrency(serviceCharge)}</span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2 font-bold text-base">
                <span>Customer Pays</span>
                <span className="text-blue-700">{formatCurrency(customerPaid)}</span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select className="input-field" value={form.paymentMethod} onChange={(e) => setForm({...form, paymentMethod: e.target.value})}>
              <option value="Cash">Cash</option>
              <option value="Bank">Bank</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input type="text" className="input-field" placeholder="Optional note" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} />
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center py-3 text-base">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </span>
          ) : (
            <>
              <CreditCard className="h-5 w-5" />
              Complete Withdrawal
            </>
          )}
        </button>
      </form>

      {/* Examples */}
      <div className="card p-4 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Rate Examples</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {[1000, 5000, 10000, 25000].map((amt) => {
            const { serviceCharge: sc, customerPaid: cp } = calculatePCOCharge(amt, settings.chargeRate, settings.chargePer);
            return (
              <div key={amt} className="flex justify-between bg-white rounded-lg p-2 border border-gray-100">
                <span className="text-gray-600">{formatCurrency(amt)}</span>
                <span className="text-xs"><span className="text-amber-600">+{formatCurrency(sc)}</span> = <span className="font-semibold">{formatCurrency(cp)}</span></span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NewWithdrawal;
