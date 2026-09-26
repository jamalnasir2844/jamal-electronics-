import { useState, useEffect } from 'react';
import { Plus, Trash2, ShoppingCart, Eye, X, Search, ChevronRight, CheckCircle, Clock, AlertCircle, Printer } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/helpers';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [showNewModal, setShowNewModal] = useState(false);
  const [viewPurchase, setViewPurchase] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchFilter, setSearchFilter] = useState('');

  const fetchPurchases = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (searchFilter) params.search = searchFilter;
      const res = await api.get('/purchases', { params });
      setPurchases(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      toast.error('Failed to load purchases.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/suppliers'),
        api.get('/products', { params: { limit: 500 } }),
      ]);
      setSuppliers(supRes.data?.data || []);
      setProducts(prodRes.data?.data || []);
    } catch {}
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchPurchases(1);
  }, [searchFilter]);

  const openNew = () => {
    setSelectedSupplierId('');
    setItems([]);
    setDiscount(0);
    setPaidAmount(0);
    setPaymentMethod('Cash');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setProductSearch('');
    setShowNewModal(true);
  };

  const addItem = (product) => {
    const existingIndex = items.findIndex((i) => i.product === product._id);
    if (existingIndex > -1) {
      const updated = [...items];
      const newQty = updated[existingIndex].quantity + 1;
      updated[existingIndex].quantity = newQty;
      updated[existingIndex].total = newQty * updated[existingIndex].purchasePrice;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          product: product._id,
          productNameSnapshot: product.name,
          sku: product.sku || '',
          quantity: 1,
          purchasePrice: product.purchasePrice || 0,
          total: product.purchasePrice || 0,
        },
      ]);
    }
    setProductSearch('');
  };

  const updateItem = (index, field, value) => {
    const updated = [...items];
    const numVal = Math.max(0, Number(value) || 0);
    updated[index][field] = numVal;
    updated[index].total = updated[index].quantity * updated[index].purchasePrice;
    setItems(updated);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Live Calculations
  const subtotal = items.reduce((sum, i) => sum + (i.total || 0), 0);
  const numDiscount = Math.max(0, Number(discount) || 0);
  const grandTotal = Math.max(0, subtotal - numDiscount);
  const numPaid = Math.max(0, Number(paidAmount) || 0);
  const remaining = Math.max(0, grandTotal - numPaid);

  const handlePayFull = () => {
    setPaidAmount(grandTotal);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 8);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return toast.error('Please add at least one product.');

    setSaving(true);
    try {
      await api.post('/purchases', {
        supplierId: selectedSupplierId || null,
        items: items.map((i) => ({
          product: i.product,
          quantity: Number(i.quantity) || 1,
          purchasePrice: Number(i.purchasePrice) || 0,
        })),
        discount: numDiscount,
        paidAmount: numPaid,
        paymentMethod,
        purchaseDate,
      });
      toast.success('Purchase recorded successfully. Stock updated!');
      setShowNewModal(false);
      fetchPurchases(1);
      fetchMeta(); // refresh stock/suppliers
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save purchase.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/purchases/${deleteId}`);
      toast.success('Purchase deleted and stock reversed.');
      setDeleteId(null);
      fetchPurchases(pagination.page);
    } catch {
      toast.error('Failed to delete purchase.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handlePrintInvoice = (purchase) => {
    const printWindow = window.open('', '_blank', 'width=500,height=700');
    if (!printWindow) { toast.error('Please allow pop-ups to print.'); return; }
    
    const dateStr = new Date(purchase.purchaseDate || Date.now()).toLocaleString('en-PK', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

    const itemRows = (purchase.items || []).map(item => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;font-size:12px;">${item.productNameSnapshot}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;text-align:center;font-size:12px;">${item.quantity}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;text-align:right;font-size:12px;">Rs. ${Number(item.purchasePrice || 0).toLocaleString()}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #f3f4f6;text-align:right;font-weight:600;font-size:12px;">Rs. ${Number(item.total || 0).toLocaleString()}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Invoice - ${purchase.invoiceNumber}</title>
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
            <div class="invoice-label">Purchase Invoice</div>
            <div class="invoice-num">${purchase.invoiceNumber}</div>
          </div>
          <div class="meta">
            <span>Supplier: <strong>${purchase.supplier?.name || 'Walk-in Supplier'}</strong></span>
            <span>${dateStr}</span>
          </div>
          <div class="meta">
            <span>Payment: ${purchase.paymentMethod || 'Cash'}</span>
          </div>
          <table>
            <thead><tr>
              <th>Product</th><th style="text-align:center">Qty</th><th style="text-align:right">Unit Cost</th><th style="text-align:right">Total</th>
            </tr></thead>
            <tbody>${itemRows}</tbody>
          </table>
          <div class="summary">
            <div class="summary-row"><span>Subtotal</span><span>Rs. ${Number(purchase.subtotal || 0).toLocaleString()}</span></div>
            ${purchase.discount > 0 ? `<div class="summary-row" style="color:#d97706"><span>Discount</span><span>- Rs. ${Number(purchase.discount).toLocaleString()}</span></div>` : ''}
            <div class="summary-row total-row"><span>Grand Total</span><span style="color:#2563eb">Rs. ${Number(purchase.grandTotal || 0).toLocaleString()}</span></div>
            <div class="summary-row" style="color:#16a34a"><span>Paid</span><span>Rs. ${Number(purchase.paidAmount || 0).toLocaleString()}</span></div>
            <div class="summary-row" style="color:#dc2626"><span>Remaining</span><span>Rs. ${Number(purchase.remainingAmount || 0).toLocaleString()}</span></div>
          </div>
          <div class="footer">
            <p>Jamal Electronics - Purchase Record</p>
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
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Purchases</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} total purchase orders</p>
        </div>
        <button onClick={openNew} className="btn-primary">
          <Plus className="h-4 w-4" />
          New Purchase
        </button>
      </div>

      {/* Search Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search invoice number..."
            className="input-field pl-9"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Purchases List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader />
          </div>
        ) : purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No purchases found</p>
            <p className="text-gray-400 text-sm">Record a purchase order to replenish stock</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Invoice</th>
                    <th className="table-header">Date</th>
                    <th className="table-header">Supplier</th>
                    <th className="table-header text-center">Items</th>
                    <th className="table-header text-right">Grand Total</th>
                    <th className="table-header text-right">Paid</th>
                    <th className="table-header text-right">Remaining</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {purchases.map((p) => {
                    const isFullyPaid = p.remainingAmount <= 0;
                    const isPartial = p.paidAmount > 0 && p.remainingAmount > 0;
                    return (
                      <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                        <td className="table-cell font-mono text-blue-600 font-medium">{p.invoiceNumber}</td>
                        <td className="table-cell text-gray-500">{formatDate(p.purchaseDate)}</td>
                        <td className="table-cell font-medium text-gray-800">{p.supplier?.name || 'Walk-in Supplier'}</td>
                        <td className="table-cell text-center">
                          <span className="badge-blue">{p.items?.length || 0} items</span>
                        </td>
                        <td className="table-cell text-right font-semibold text-gray-900">{formatCurrency(p.grandTotal)}</td>
                        <td className="table-cell text-right text-green-600 font-medium">{formatCurrency(p.paidAmount)}</td>
                        <td className="table-cell text-right">
                          <span className={p.remainingAmount > 0 ? 'text-red-600 font-semibold' : 'text-gray-400'}>
                            {formatCurrency(p.remainingAmount)}
                          </span>
                        </td>
                        <td className="table-cell text-center">
                          {isFullyPaid ? (
                            <span className="badge-green">Paid</span>
                          ) : isPartial ? (
                            <span className="badge-amber">Partial</span>
                          ) : (
                            <span className="badge-red">Unpaid</span>
                          )}
                        </td>
                        <td className="table-cell text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setViewPurchase(p)}
                              title="View Invoice"
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handlePrintInvoice(p)}
                              title="Print Invoice"
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Printer className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteId(p._id)}
                              title="Delete Purchase"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={fetchPurchases}
              />
            </div>
          </>
        )}
      </div>

      {/* New Purchase Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Create New Purchase Order"
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Top form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select
                className="input-field"
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
              >
                <option value="">Select Supplier (Optional)</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} {s.remainingBalance ? `(Due: ${formatCurrency(s.remainingBalance)})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                className="input-field"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank Transfer</option>
                <option value="Other">Online / Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                className="input-field"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
          </div>

          {/* Product Search & Add Section */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Add Products to Purchase</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="Search products by name or SKU to add..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
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
                        <p className="text-xs text-gray-400">SKU: {p.sku || 'N/A'} · Current Stock: {p.stock}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-blue-600">{formatCurrency(p.purchasePrice)}</span>
                        <span className="block text-[10px] text-gray-400">Click to add</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected Products Table */}
          {items.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50/50">
              <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">No products added yet</p>
              <p className="text-xs text-gray-400 mt-0.5">Use the search bar above to select products for this purchase</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="table-header text-left">Product</th>
                    <th className="table-header text-center w-28">Quantity</th>
                    <th className="table-header text-right w-36">Unit Cost (Rs.)</th>
                    <th className="table-header text-right w-36">Total (Rs.)</th>
                    <th className="table-header w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="table-cell">
                        <p className="font-medium text-gray-900 text-sm">{item.productNameSnapshot}</p>
                        {item.sku && <p className="text-xs text-gray-400 font-mono">SKU: {item.sku}</p>}
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => updateItem(idx, 'quantity', Math.max(1, item.quantity - 1))}
                            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            className="input-field text-center w-14 py-1 text-sm font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => updateItem(idx, 'quantity', item.quantity + 1)}
                            className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="table-cell text-right">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="input-field text-right w-32 py-1 text-sm font-medium"
                          value={item.purchasePrice}
                          onChange={(e) => updateItem(idx, 'purchasePrice', e.target.value)}
                        />
                      </td>
                      <td className="table-cell text-right font-bold text-gray-900 text-sm">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="table-cell text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
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
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => setShowNewModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || items.length === 0}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save & Update Stock'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Purchase Modal */}
      {viewPurchase && (
        <Modal
          isOpen={!!viewPurchase}
          onClose={() => setViewPurchase(null)}
          title={`Purchase Invoice — ${viewPurchase.invoiceNumber}`}
          size="lg"
        >
          <div className="space-y-5" id="printable-purchase">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <p className="text-xs text-gray-400">Invoice Reference</p>
                <p className="font-mono font-bold text-blue-700 text-lg">{viewPurchase.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Date</p>
                <p className="text-sm font-medium text-gray-800">{formatDate(viewPurchase.purchaseDate)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-sm">
              <div>
                <span className="text-gray-400 text-xs block">Supplier</span>
                <span className="font-semibold text-gray-900">{viewPurchase.supplier?.name || 'Walk-in Supplier'}</span>
                {viewPurchase.supplier?.phone && (
                  <p className="text-xs text-gray-500 mt-0.5">{viewPurchase.supplier.phone}</p>
                )}
              </div>
              <div>
                <span className="text-gray-400 text-xs block">Payment Method</span>
                <span className="font-medium text-gray-800">{viewPurchase.paymentMethod || 'Cash'}</span>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-header text-left">Product</th>
                    <th className="table-header text-center">Qty</th>
                    <th className="table-header text-right">Unit Price</th>
                    <th className="table-header text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {viewPurchase.items?.map((item, i) => (
                    <tr key={i}>
                      <td className="table-cell font-medium">{item.productNameSnapshot}</td>
                      <td className="table-cell text-center font-semibold">{item.quantity}</td>
                      <td className="table-cell text-right">{formatCurrency(item.purchasePrice)}</td>
                      <td className="table-cell text-right font-bold text-gray-900">{formatCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary card */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(viewPurchase.subtotal)}</span>
              </div>
              {viewPurchase.discount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>Discount:</span>
                  <span>- {formatCurrency(viewPurchase.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 text-gray-900">
                <span>Grand Total:</span>
                <span className="text-blue-700">{formatCurrency(viewPurchase.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-medium">
                <span>Paid Amount:</span>
                <span>{formatCurrency(viewPurchase.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-100 pt-1">
                <span>Remaining Balance:</span>
                <span className={viewPurchase.remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}>
                  {formatCurrency(viewPurchase.remainingAmount)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => handlePrintInvoice(viewPurchase)}
                className="btn-secondary flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print Invoice
              </button>
              <button
                type="button"
                onClick={() => setViewPurchase(null)}
                className="btn-primary"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Purchase"
        message="Are you sure you want to delete this purchase? This will automatically reverse added product stock and supplier balances."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Purchases;
