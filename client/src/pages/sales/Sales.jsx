import { useState, useEffect } from 'react';
import { Plus, Trash2, TrendingUp, Eye, X, Search, Printer } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewSale, setViewSale] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');

  const fetchSales = async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/sales', { params: { page, limit: 15 } });
      setSales(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch { toast.error('Failed to load sales.'); }
    finally { setLoading(false); }
  };

  const fetchMeta = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        api.get('/customers', { params: { limit: 500 } }),
        api.get('/products', { params: { limit: 500 } }),
      ]);
      setCustomers(custRes.data?.data || []);
      setProducts(prodRes.data?.data || []);
    } catch {}
  };

  useEffect(() => { fetchSales(); fetchMeta(); }, []);

  const openNew = () => {
    setCustomerId(''); setItems([]); setDiscount(0); setPaidAmount(0);
    setPaymentMethod('Cash'); setProductSearch(''); setShowNewModal(true);
  };

  const addItem = (product) => {
    if (product.stock === 0) { toast.error(`${product.name} is out of stock.`); return; }
    const existing = items.find((i) => i.product === product._id);
    if (existing) {
      if (existing.quantity >= product.stock) { toast.error(`Max available stock: ${product.stock}`); return; }
      setItems(items.map((i) => i.product === product._id ? {
        ...i, quantity: i.quantity + 1,
        total: (i.quantity + 1) * i.sellingPrice,
        profit: (i.sellingPrice - product.purchasePrice) * (i.quantity + 1),
      } : i));
    } else {
      setItems([...items, {
        product: product._id,
        productNameSnapshot: product.name,
        maxStock: product.stock,
        quantity: 1,
        sellingPrice: product.sellingPrice,
        purchasePriceAtSale: product.purchasePrice,
        total: product.sellingPrice,
        profit: product.sellingPrice - product.purchasePrice,
      }]);
    }
    setProductSearch('');
  };

  const updateItem = (idx, field, value) => {
    const updated = [...items];
    const numVal = Math.max(0, Number(value) || 0);
    updated[idx][field] = numVal;
    if (field === 'quantity') {
      if (numVal > updated[idx].maxStock) {
        toast.error(`Max available: ${updated[idx].maxStock}`);
        updated[idx].quantity = updated[idx].maxStock;
      }
      if (numVal < 1) updated[idx].quantity = 1;
    }
    updated[idx].total = updated[idx].quantity * updated[idx].sellingPrice;
    updated[idx].profit = (updated[idx].sellingPrice - updated[idx].purchasePriceAtSale) * updated[idx].quantity;
    setItems(updated);
  };

  const removeItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const subtotal = items.reduce((sum, i) => sum + (i.total || 0), 0);
  const numDiscount = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, subtotal - numDiscount);
  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const remaining = Math.max(0, grandTotal - numPaid);
  const totalProfit = items.reduce((sum, i) => sum + (i.profit || 0), 0) - numDiscount;

  const filteredProducts = products.filter(
    (p) => p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 8);

  const handlePayFull = () => {
    setPaidAmount(grandTotal);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Add at least one item.');
    setSaving(true);
    try {
      await api.post('/sales', {
        customerId: customerId || null,
        items: items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity) || 1,
          sellingPrice: Number(i.sellingPrice) || 0,
        })),
        discount: numDiscount,
        paidAmount: numPaid,
        paymentMethod,
      });
      toast.success('Sale completed. Stock updated.');
      setShowNewModal(false);
      fetchSales();
      fetchMeta(); // refresh stock
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save sale.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/sales/${deleteId}`);
      toast.success('Sale deleted. Stock restored.');
      setDeleteId(null);
      fetchSales();
    } catch { toast.error('Failed to delete sale.'); }
    finally { setDeleteLoading(false); }
  };

  const handlePrintInvoice = (sale) => {
    const printWindow = window.open('', '_blank', 'width=500,height=700');
    if (!printWindow) { toast.error('Please allow pop-ups to print.'); return; }
    
    const dateStr = new Date(sale.saleDate || Date.now()).toLocaleString('en-PK', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const itemRows = (sale.items || []).map(item => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;font-size:12px;">${item.productNameSnapshot}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:12px;">${item.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;text-align:right;font-size:12px;">Rs. ${Number(item.sellingPrice || 0).toLocaleString()}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;font-size:12px;">Rs. ${Number(item.total || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Sale Invoice - ${sale.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; background: white; }
          .invoice { max-width: 450px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #e5e7eb; padding-bottom: 16px; margin-bottom: 16px; }
          .shop-name { font-size: 20px; font-weight: 700; color: #1e40af; }
          .invoice-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; }
          .invoice-num { font-family: monospace; font-size: 14px; font-weight: 700; color: #2563eb; margin-top: 4px; }
          .meta { display: flex; justify-content: space-between; margin: 12px 0; font-size: 12px; color: #6b7280; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          th { padding: 8px; background: #f9fafb; font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: 600; text-align: left; }
          .summary { background: #f9fafb; padding: 12px; border-radius: 8px; margin-top: 12px; }
          .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
          .total-row { font-size: 16px; font-weight: 700; border-top: 2px solid #e5e7eb; padding-top: 8px; margin-top: 8px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 16px; border-top: 2px dashed #e5e7eb; font-size: 11px; color: #9ca3af; }
          @media print { .no-print { display: none !important; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div class="shop-name">Jamal Electronics</div>
            <div class="invoice-label">Sale Invoice</div>
            <div class="invoice-num">${sale.invoiceNumber}</div>
          </div>
          <div class="meta">
            <span>Customer: <strong>${sale.customer?.name || 'Walk-in'}</strong></span>
            <span>${dateStr}</span>
          </div>
          <div class="meta">
            <span>Payment: ${sale.paymentMethod || 'Cash'}</span>
          </div>
          <table>
            <thead><tr>
              <th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><span>Subtotal</span><span>Rs. ${Number(sale.subtotal || 0).toLocaleString()}</span></div>
            ${sale.discount > 0 ? `<div class="summary-row" style="color:#d97706"><span>Discount</span><span>- Rs. ${Number(sale.discount).toLocaleString()}</span></div>` : ''}
            <div class="summary-row total-row"><span>Grand Total</span><span style="color:#2563eb">Rs. ${Number(sale.grandTotal || 0).toLocaleString()}</span></div>
            <div class="summary-row" style="color:#16a34a"><span>Paid</span><span>Rs. ${Number(sale.paidAmount || 0).toLocaleString()}</span></div>
            <div class="summary-row" style="color:#dc2626"><span>Remaining</span><span>Rs. ${Number(sale.remainingAmount || 0).toLocaleString()}</span></div>
          </div>
          <div class="footer">
            <p>Thank you for shopping with us!</p>
          </div>
        </div>
        <div class="no-print" style="text-align:center;margin-top:20px;">
          <button onclick="window.print()" style="padding:10px 24px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:600;">🖨️ Print Invoice</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="section-title">Sales</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} sales</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus className="h-4 w-4" />New Sale</button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader /></div>
        ) : sales.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <TrendingUp className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No sales yet</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Invoice</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Customer</th>
                    <th className="table-header text-right">Grand Total</th>
                    <th className="table-header text-right">Paid</th>
                    <th className="table-header text-right">Remaining</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-medium text-blue-600">{s.invoiceNumber}</td>
                      <td className="table-cell text-gray-500">{formatDate(s.saleDate)}</td>
                      <td className="table-cell text-gray-700">{s.customer?.name || 'Walk-in'}</td>
                      <td className="table-cell text-right font-semibold">{formatCurrency(s.grandTotal)}</td>
                      <td className="table-cell text-right text-green-600">{formatCurrency(s.paidAmount)}</td>
                      <td className="table-cell text-right">
                        <span className={s.remainingAmount > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}>
                          {formatCurrency(s.remainingAmount)}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => setViewSale(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="h-4 w-4" /></button>
                          <button onClick={() => handlePrintInvoice(s)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Print Invoice"><Printer className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteId(s._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={fetchSales} />
            </div>
          </>
        )}
      </div>

      {/* New Sale Modal */}
      <Modal isOpen={showNewModal} onClose={() => setShowNewModal(false)} title="New Sale" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select className="input-field" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                <option value="">Walk-in Customer</option>
                {customers.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.phone})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select className="input-field" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Product Search with proper relative positioning */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Products</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" className="input-field pl-9" placeholder="Search product by name or SKU..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
            </div>
            {productSearch && (
              <div className="absolute z-20 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-56 overflow-y-auto divide-y divide-gray-100">
                {filteredProducts.length === 0 ? (
                  <div className="p-3 text-sm text-gray-400 text-center">No matching products found</div>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p._id}
                      type="button"
                      onClick={() => addItem(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium text-sm text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">
                          Stock: {p.stock} · Price: {formatCurrency(p.sellingPrice)}
                          {p.stock === 0 && <span className="text-red-500 ml-2">OUT OF STOCK</span>}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(p.sellingPrice)}</span>
                        <span className="block text-[10px] text-gray-400">Click to add</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
              <TrendingUp className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No products added yet</p>
              <p className="text-xs text-gray-400 mt-0.5">Use the search bar above to select products for this sale</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header text-left">Product</th>
                    <th className="table-header text-center w-28">Qty</th>
                    <th className="table-header text-right w-36">Price (Rs.)</th>
                    <th className="table-header text-right w-36">Total (Rs.)</th>
                    <th className="table-header text-right w-28">Profit</th>
                    <th className="table-header w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="table-cell">
                        <p className="font-medium text-gray-900 text-sm">{item.productNameSnapshot}</p>
                        <p className="text-xs text-gray-400">Max: {item.maxStock}</p>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold"
                          >-</button>
                          <input
                            type="number"
                            min="1"
                            max={item.maxStock}
                            className="input-field text-center w-14 py-1 text-sm font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold"
                          >+</button>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input-field text-right w-32 py-1 text-sm font-medium"
                          value={item.sellingPrice}
                          onChange={(e) => updateItem(idx, 'sellingPrice', e.target.value)}
                        />
                      </td>
                      <td className="table-cell text-right font-bold text-gray-900 text-sm">{formatCurrency(item.total)}</td>
                      <td className="table-cell text-right text-green-600 text-sm font-medium">{formatCurrency(item.profit)}</td>
                      <td className="table-cell text-center">
                        <button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Calculations Summary Card */}
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-xl p-5 border border-gray-200 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Subtotal ({items.length} items):</span>
              <span className="font-semibold text-gray-900 text-base">{formatCurrency(subtotal)}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Discount (Rs.):</span>
              <div className="w-36">
                <input
                  type="number"
                  min="0"
                  className="input-field text-right py-1 font-medium text-amber-600"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-gray-200 pt-3">
              <span className="font-bold text-gray-900 text-base">Grand Total:</span>
              <span className="font-bold text-blue-700 text-xl">{formatCurrency(grandTotal)}</span>
            </div>

            <div className="flex justify-between items-center text-sm pt-1">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Paid Amount (Rs.):</span>
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-xs px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-md transition-colors"
                >
                  Pay Full
                </button>
              </div>
              <div className="w-36">
                <input
                  type="number"
                  min="0"
                  className="input-field text-right py-1 font-semibold text-green-700"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2 font-medium">
              <span className="text-gray-600">Remaining Balance:</span>
              <span className={remaining > 0 ? 'text-red-600 font-bold text-base' : 'text-green-600 font-semibold'}>
                {formatCurrency(remaining)}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-gray-100 pt-2">
              <span className="text-gray-600">Estimated Profit:</span>
              <span className="text-green-600 font-semibold">{formatCurrency(totalProfit)}</span>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowNewModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving || items.length === 0} className="btn-success">
              {saving ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </form>
      </Modal>

      {viewSale && (
        <Modal isOpen={!!viewSale} onClose={() => setViewSale(null)} title={`Sale — ${viewSale.invoiceNumber}`} size="md">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{viewSale.customer?.name || 'Walk-in'}</span></div>
              <div><span className="text-gray-500">Date:</span> <span className="font-medium">{formatDate(viewSale.saleDate)}</span></div>
              <div><span className="text-gray-500">Payment:</span> <span className="font-medium">{viewSale.paymentMethod}</span></div>
            </div>
            <table className="w-full border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50"><tr><th className="table-header">Product</th><th className="table-header text-center">Qty</th><th className="table-header text-right">Price</th><th className="table-header text-right">Total</th><th className="table-header text-right">Profit</th></tr></thead>
              <tbody>
                {viewSale.items?.map((item, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    <td className="table-cell">{item.productNameSnapshot}</td>
                    <td className="table-cell text-center">{item.quantity}</td>
                    <td className="table-cell text-right">{formatCurrency(item.sellingPrice)}</td>
                    <td className="table-cell text-right font-medium">{formatCurrency(item.total)}</td>
                    <td className="table-cell text-right text-green-600">{formatCurrency(item.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="space-y-1 text-sm bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(viewSale.subtotal)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>{formatCurrency(viewSale.discount)}</span></div>
              <div className="flex justify-between font-bold text-base border-t pt-1 mt-1"><span>Grand Total</span><span className="text-blue-600">{formatCurrency(viewSale.grandTotal)}</span></div>
              <div className="flex justify-between text-green-600"><span>Paid</span><span>{formatCurrency(viewSale.paidAmount)}</span></div>
              <div className="flex justify-between text-red-600"><span>Remaining</span><span>{formatCurrency(viewSale.remainingAmount)}</span></div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handlePrintInvoice(viewSale)}
                className="btn-secondary flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </button>
              <button type="button" onClick={() => setViewSale(null)} className="btn-primary">Close</button>
            </div>
          </div>
        </Modal>
      )}

      <ConfirmDialog isOpen={!!deleteId} title="Delete Sale" message="This will delete the sale and restore the stock." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
};

export default Sales;
