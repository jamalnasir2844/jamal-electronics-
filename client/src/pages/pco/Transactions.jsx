import { useState, useEffect } from 'react';
import { Search, Receipt, Trash2, Eye, Printer, CreditCard, Wallet } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txType, setTxType] = useState('withdrawals'); // 'withdrawals' or 'deposits'
  const [viewTx, setViewTx] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState('withdrawals');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [settings, setSettings] = useState({});

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.data) setSettings(res.data.data);
    }).catch(() => {});
  }, []);

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get(`/${txType}`, { params });
      setTransactions(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch { toast.error('Failed to load transactions.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTransactions(1); }, [search, startDate, endDate, txType]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/${deleteType}/${deleteId}`);
      toast.success('Transaction deleted.');
      setDeleteId(null);
      fetchTransactions();
    } catch { toast.error('Failed to delete transaction.'); }
    finally { setDeleteLoading(false); }
  };

  const openDelete = (id, type) => {
    setDeleteId(id);
    setDeleteType(type);
  };

  const handlePrintReceipt = (tx) => {
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) { toast.error('Please allow pop-ups to print.'); return; }

    const isDeposit = txType === 'deposits';
    const dateStr = new Date(tx.createdAt || Date.now()).toLocaleString('en-PK', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const amountLabel = isDeposit ? 'Deposit Amount' : 'Withdrawal Amount';
    const amount = isDeposit ? tx.depositAmount : tx.withdrawalAmount;
    const resultLabel = isDeposit ? 'Customer Received' : 'Customer Paid';
    const resultAmount = isDeposit ? tx.customerReceived : tx.customerPaid;
    const typeEmoji = isDeposit ? '💰' : '💳';
    const typeText = isDeposit ? 'Deposit Receipt' : 'Withdrawal Receipt';
    const typeColor = isDeposit ? '#16a34a' : '#2563eb';
    const badgeText = isDeposit ? '✓ Deposit Successful' : '✓ Withdrawal Successful';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${typeText} - ${tx.transactionReference || ''}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: white; color: #1a1a1a; }
          .receipt { max-width: 350px; margin: 0 auto; border: 2px solid #e5e7eb; border-radius: 12px; padding: 24px; }
          .header { text-align: center; border-bottom: 2px dashed #e5e7eb; padding-bottom: 16px; margin-bottom: 16px; }
          .shop-name { font-size: 18px; font-weight: 700; color: #1e40af; }
          .receipt-type { font-size: 13px; font-weight: 600; color: ${typeColor}; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
          .ref { font-family: monospace; font-size: 12px; color: #6b7280; margin-top: 8px; }
          .date { font-size: 11px; color: #9ca3af; margin-top: 2px; }
          .details { margin: 16px 0; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
          .row .label { color: #6b7280; }
          .row .value { font-weight: 600; color: #111827; }
          .divider { border-top: 1px dashed #e5e7eb; margin: 8px 0; }
          .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: 700; }
          .total-row .label { color: #111827; }
          .total-row .value { color: ${typeColor}; }
          .charge-value { color: #d97706 !important; }
          .footer { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 2px dashed #e5e7eb; font-size: 11px; color: #9ca3af; }
          .success-badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 8px; }
          @media print { body { padding: 0; } .receipt { border: none; } .no-print { display: none !important; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="shop-name">${settings.shopName || 'Jamal Electronics'}</div>
            <div class="receipt-type">${typeEmoji} ${typeText}</div>
            <div class="ref">${tx.transactionReference || ''}</div>
            <div class="date">${dateStr}</div>
            <div class="success-badge">${badgeText}</div>
          </div>
          <div class="details">
            <div class="row"><span class="label">Customer</span><span class="value">${tx.customerNameSnapshot || ''}</span></div>
            <div class="row"><span class="label">Phone</span><span class="value">${tx.phoneSnapshot || ''}</span></div>
            <div class="row"><span class="label">Payment</span><span class="value">${tx.paymentMethod || 'Cash'}</span></div>
          </div>
          <div class="divider"></div>
          <div class="details">
            <div class="row"><span class="label">${amountLabel}</span><span class="value">Rs. ${Number(amount || 0).toLocaleString()}</span></div>
            <div class="row"><span class="label">Service Charge (${tx.chargeRateSnapshot || 20}/${(tx.chargePerSnapshot || 1000).toLocaleString()})</span><span class="value charge-value">Rs. ${Number(tx.serviceCharge || 0).toLocaleString()}</span></div>
          </div>
          <div class="divider"></div>
          <div class="total-row"><span class="label">${resultLabel}</span><span class="value">Rs. ${Number(resultAmount || 0).toLocaleString()}</span></div>
          ${tx.notes ? `<div style="font-size:11px;color:#6b7280;margin-top:8px;">Note: ${tx.notes}</div>` : ''}
          <div class="footer">
            <p>Thank you for using our services!</p>
            ${settings.phone ? `<p style="margin-top:4px;">Contact: ${settings.phone}</p>` : ''}
          </div>
        </div>
        <div class="no-print" style="text-align:center;margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 24px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">🖨️ Print Receipt</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isDeposit = txType === 'deposits';

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="section-title">PCO Transactions</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} {txType}</p>
        </div>
      </div>

      {/* Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setTxType('withdrawals')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            txType === 'withdrawals'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Withdrawals
        </button>
        <button
          onClick={() => setTxType('deposits')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            txType === 'deposits'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Wallet className="h-4 w-4" />
          Deposits
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search reference, customer, phone..." className="input-field pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <input type="date" className="input-field w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="input-field w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader /></div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Receipt className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No {txType} found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Type</th>
                    <th className="table-header">Reference</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header text-right">Amount</th>
                    <th className="table-header text-right">Charge</th>
                    <th className="table-header text-right">{isDeposit ? 'Received' : 'Paid'}</th>
                    <th className="table-header text-center">Method</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        {isDeposit ? (
                          <span className="badge-green">Deposit</span>
                        ) : (
                          <span className="badge-blue">Withdrawal</span>
                        )}
                      </td>
                      <td className="table-cell font-mono text-blue-600 text-xs">{tx.transactionReference}</td>
                      <td className="table-cell text-gray-500 text-xs">{formatDateTime(tx.createdAt)}</td>
                      <td className="table-cell font-medium">{tx.customerNameSnapshot}</td>
                      <td className="table-cell text-gray-500">{tx.phoneSnapshot}</td>
                      <td className="table-cell text-right">{formatCurrency(isDeposit ? tx.depositAmount : tx.withdrawalAmount)}</td>
                      <td className="table-cell text-right text-amber-600 font-medium">{formatCurrency(tx.serviceCharge)}</td>
                      <td className="table-cell text-right font-semibold text-blue-600">{formatCurrency(isDeposit ? tx.customerReceived : tx.customerPaid)}</td>
                      <td className="table-cell text-center"><span className="badge-gray">{tx.paymentMethod}</span></td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setViewTx(tx)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View Details"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => handlePrintReceipt(tx)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Print Receipt"><Printer className="h-4 w-4" /></button>
                          <button onClick={() => openDelete(tx._id, txType)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={fetchTransactions} />
            </div>
          </>
        )}
      </div>

      {viewTx && (
        <Modal isOpen={!!viewTx} onClose={() => setViewTx(null)} title="Transaction Details" size="sm">
          <div className="space-y-4">
            <div className={`${isDeposit ? 'bg-emerald-50' : 'bg-blue-50'} p-4 rounded-xl text-center`}>
              <p className={`text-xs ${isDeposit ? 'text-emerald-500' : 'text-blue-500'} mb-1`}>Transaction Reference</p>
              <p className={`font-mono font-bold ${isDeposit ? 'text-emerald-800' : 'text-blue-800'} text-lg`}>{viewTx.transactionReference}</p>
              <span className={`inline-block mt-2 text-xs font-semibold px-3 py-1 rounded-full ${isDeposit ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                {isDeposit ? '💰 Deposit' : '💳 Withdrawal'}
              </span>
            </div>
            <div className="space-y-2 text-sm">
              {[
                ['Customer', viewTx.customerNameSnapshot],
                ['Phone', viewTx.phoneSnapshot],
                ['Date', formatDateTime(viewTx.createdAt)],
                [isDeposit ? 'Deposit Amount' : 'Withdrawal Amount', formatCurrency(isDeposit ? viewTx.depositAmount : viewTx.withdrawalAmount)],
                ['Rate Snapshot', `Rs. ${viewTx.chargeRateSnapshot} per Rs. ${viewTx.chargePerSnapshot?.toLocaleString()}`],
                ['Service Charge', formatCurrency(viewTx.serviceCharge)],
                [isDeposit ? 'Customer Received' : 'Customer Paid', formatCurrency(isDeposit ? viewTx.customerReceived : viewTx.customerPaid)],
                ['Payment Method', viewTx.paymentMethod],
                ['Notes', viewTx.notes || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between border-b border-gray-50 pb-2 last:border-0">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-right">{value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => handlePrintReceipt(viewTx)}
                className="btn-secondary flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </button>
              <button onClick={() => setViewTx(null)} className="btn-primary">Close</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog isOpen={!!deleteId} title="Delete Transaction" message="This will delete the transaction and reverse the customer's PCO totals." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
};

export default Transactions;
