import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, ShoppingCart, CreditCard, DollarSign, Package } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import Loader from '../../components/common/Loader';

const COLORS = ['#2563eb', '#7c3aed', '#16a34a', '#dc2626', '#d97706', '#6b7280'];

const Reports = () => {
  const [activeTab, setActiveTab] = useState('profit');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = { startDate, endDate };
      const endpoints = {
        profit: '/reports/profit',
        sales: '/reports/sales',
        purchases: '/reports/purchases',
        pco: '/reports/pco',
        expenses: '/reports/expenses',
        stock: '/reports/stock',
      };
      const res = await api.get(endpoints[activeTab], { params });
      setData(res.data.data);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, [activeTab, startDate, endDate]);

  const tabs = [
    { id: 'profit', label: 'Profit & Loss', icon: TrendingUp },
    { id: 'sales', label: 'Sales', icon: TrendingUp },
    { id: 'purchases', label: 'Purchases', icon: ShoppingCart },
    { id: 'pco', label: 'PCO', icon: CreditCard },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'stock', label: 'Stock', icon: Package },
  ];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="section-title">Reports</h1>
          <p className="text-sm text-gray-400 mt-0.5">Business intelligence from real data</p>
        </div>
        <div className="flex gap-2">
          <input type="date" className="input-field w-36" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <input type="date" className="input-field w-36" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader /></div>
      ) : (
        <div className="space-y-5">
          {/* Profit & Loss */}
          {activeTab === 'profit' && data && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Sales Revenue', value: data.salesRevenue, color: 'blue' },
                  { label: 'PCO Charges', value: data.pcoCharges, color: 'amber' },
                  { label: 'Gross Profit', value: data.grossProfit, color: 'green' },
                  { label: 'Total Expenses', value: data.expenses, color: 'red' },
                  { label: 'Net Profit', value: data.netProfit, color: data.netProfit >= 0 ? 'green' : 'red' },
                ].map((item) => (
                  <div key={item.label} className="card p-5">
                    <p className="text-sm text-gray-500">{item.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${
                      item.color === 'green' ? 'text-green-600' :
                      item.color === 'red' ? 'text-red-600' :
                      item.color === 'amber' ? 'text-amber-600' : 'text-blue-600'
                    }`}>{formatCurrency(item.value)}</p>
                  </div>
                ))}
              </div>
              <div className="card p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Profit Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between p-2 bg-blue-50 rounded"><span>Sales Revenue</span><span className="font-semibold">{formatCurrency(data.salesRevenue)}</span></div>
                  <div className="flex justify-between p-2 bg-amber-50 rounded"><span>PCO Service Charges</span><span className="font-semibold text-amber-700">+ {formatCurrency(data.pcoCharges)}</span></div>
                  <div className="flex justify-between p-2 bg-green-50 rounded border border-green-100"><span className="font-semibold">Gross Profit</span><span className="font-bold text-green-700">{formatCurrency(data.grossProfit)}</span></div>
                  <div className="flex justify-between p-2 bg-red-50 rounded"><span>Total Expenses</span><span className="font-semibold text-red-700">- {formatCurrency(data.expenses)}</span></div>
                  <div className="flex justify-between p-3 bg-gray-900 rounded"><span className="text-white font-semibold">Net Profit</span><span className={`font-bold text-lg ${data.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(data.netProfit)}</span></div>
                </div>
              </div>
            </>
          )}

          {/* Sales Report */}
          {activeTab === 'sales' && data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-5"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(data.totals?.totalRevenue)}</p></div>
                <div className="card p-5"><p className="text-sm text-gray-500">Total Profit</p><p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(data.totals?.totalProfit)}</p></div>
                <div className="card p-5"><p className="text-sm text-gray-500">Transactions</p><p className="text-2xl font-bold text-gray-900 mt-1">{data.totals?.count || 0}</p></div>
              </div>
              {data.sales?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-semibold text-gray-900 mb-4">Daily Sales</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={data.sales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => formatCurrency(v)} />
                      <Bar dataKey="totalRevenue" name="Revenue" fill="#2563eb" radius={[4,4,0,0]} />
                      <Bar dataKey="totalProfit" name="Profit" fill="#16a34a" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}

          {/* PCO Report */}
          {activeTab === 'pco' && data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-5"><p className="text-sm text-gray-500">Total Withdrawals</p><p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.totals?.totalWithdrawals)}</p></div>
                <div className="card p-5"><p className="text-sm text-gray-500">Service Charges Earned</p><p className="text-2xl font-bold text-amber-600 mt-1">{formatCurrency(data.totals?.totalCharges)}</p></div>
                <div className="card p-5"><p className="text-sm text-gray-500">Transactions</p><p className="text-2xl font-bold text-gray-900 mt-1">{data.totals?.count || 0}</p></div>
              </div>
              <div className="card p-4 border-l-4 border-amber-400 bg-amber-50">
                <p className="text-sm text-amber-800"><strong>Note:</strong> PCO withdrawal amount is NOT profit. Only service charges ({formatCurrency(data.totals?.totalCharges)}) are earned revenue.</p>
              </div>
            </>
          )}

          {/* Expenses Report */}
          {activeTab === 'expenses' && data && (
            <>
              <div className="card p-5"><p className="text-sm text-gray-500">Total Expenses</p><p className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(data.totals?.total)}</p></div>
              {data.byCategory?.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="card p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">By Category</h3>
                    <div className="space-y-2">
                      {data.byCategory.map((cat, i) => (
                        <div key={cat._id} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                            <span className="text-sm">{cat._id}</span>
                          </div>
                          <span className="font-semibold text-sm">{formatCurrency(cat.total)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="card p-5">
                    <h3 className="font-semibold text-gray-900 mb-4">Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.byCategory} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                          {data.byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Stock Report */}
          {activeTab === 'stock' && data && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div className="card p-5"><p className="text-sm text-gray-500">Stock Value</p><p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(data.stockValue)}</p></div>
                <div className="card p-5"><p className="text-sm text-gray-500">Low Stock Items</p><p className="text-2xl font-bold text-amber-600 mt-1">{data.lowStockCount}</p></div>
                <div className="card p-5"><p className="text-sm text-gray-500">Out of Stock</p><p className="text-2xl font-bold text-red-600 mt-1">{data.outOfStockCount}</p></div>
              </div>
              <div className="card overflow-hidden">
                <div className="px-5 py-3 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">All Products</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="table-header">Product</th>
                        <th className="table-header">Category</th>
                        <th className="table-header text-center">Stock</th>
                        <th className="table-header text-right">Purchase Price</th>
                        <th className="table-header text-right">Stock Value</th>
                        <th className="table-header text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {data.products?.map((p) => (
                        <tr key={p._id} className="hover:bg-gray-50">
                          <td className="table-cell font-medium">{p.name}</td>
                          <td className="table-cell text-gray-500">{p.category?.name || '—'}</td>
                          <td className="table-cell text-center">{p.stock}</td>
                          <td className="table-cell text-right">{formatCurrency(p.purchasePrice)}</td>
                          <td className="table-cell text-right font-medium">{formatCurrency(p.stock * p.purchasePrice)}</td>
                          <td className="table-cell text-center">
                            {p.stock === 0 ? <span className="badge-red">Out</span> : p.stock <= p.minimumStock ? <span className="badge-amber">Low</span> : <span className="badge-green">OK</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
