import { useState, useEffect } from 'react';
import {
  TrendingUp, ShoppingCart, CreditCard, DollarSign,
  Package, AlertTriangle, ArrowUp, ArrowDown, Minus,
  Warehouse, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip, CartesianGrid, Legend,
} from 'recharts';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colors = {
    blue: { bg: 'bg-blue-50', icon: 'bg-blue-600', text: 'text-blue-600' },
    green: { bg: 'bg-green-50', icon: 'bg-green-600', text: 'text-green-600' },
    red: { bg: 'bg-red-50', icon: 'bg-red-600', text: 'text-red-600' },
    amber: { bg: 'bg-amber-50', icon: 'bg-amber-600', text: 'text-amber-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-600', text: 'text-purple-600' },
    gray: { bg: 'bg-gray-50', icon: 'bg-gray-600', text: 'text-gray-600' },
  };
  const c = colors[color];

  return (
    <div className="card p-5 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className={`h-5 w-5 ${c.text}`} />
        </div>
        {trend !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-medium ${
              trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {trend > 0 ? <ArrowUp className="h-3 w-3" /> : trend < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm font-medium text-gray-600 mt-0.5">{title}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { dbUser } = useAuth();

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/reports/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  const today = data?.today || {};
  const chartData = data?.chartData || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {dbUser?.name?.split(' ')[0] || 'User'}! 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Here's what's happening at your shop today.</p>
      </div>

      {/* Today's Stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Today's Summary</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(today.sales)}
            subtitle={`${today.salesCount || 0} transaction(s)`}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Today's Purchases"
            value={formatCurrency(today.purchases)}
            subtitle={`${today.purchasesCount || 0} purchase(s)`}
            icon={ShoppingCart}
            color="purple"
          />
          <StatCard
            title="PCO Withdrawals"
            value={formatCurrency(today.pcoWithdrawals)}
            subtitle={`${today.pcoTransactions || 0} transaction(s)`}
            icon={CreditCard}
            color="amber"
          />
          <StatCard
            title="PCO Charges Earned"
            value={formatCurrency(today.pcoCharges)}
            subtitle="Service revenue"
            icon={Zap}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <StatCard
            title="Today's Expenses"
            value={formatCurrency(today.expenses)}
            subtitle="Operational costs"
            icon={DollarSign}
            color="red"
          />
          <StatCard
            title="Gross Profit"
            value={formatCurrency(today.grossProfit)}
            subtitle="Sales + PCO charges"
            icon={TrendingUp}
            color={today.grossProfit >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Net Profit"
            value={formatCurrency(today.netProfit)}
            subtitle="After expenses"
            icon={TrendingUp}
            color={today.netProfit >= 0 ? 'green' : 'red'}
          />
          <StatCard
            title="Stock Value"
            value={formatCurrency(data?.stockValue)}
            subtitle="Current inventory"
            icon={Warehouse}
            color="gray"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">7-Day Performance</h2>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickFormatter={(v) => `Rs.${(v/1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value) => [formatCurrency(value), '']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
            />
            <Legend />
            <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} name="Sales" />
            <Line type="monotone" dataKey="purchases" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} name="Purchases" />
            <Line type="monotone" dataKey="profit" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} name="Profit" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-base font-semibold text-gray-900">Low Stock Alert</h2>
            {data?.lowStockCount > 0 && (
              <span className="badge-amber ml-auto">{data.lowStockCount} items</span>
            )}
          </div>
          {data?.lowStockProducts?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">✅ All products well stocked!</p>
          ) : (
            <div className="space-y-2">
              {data?.lowStockProducts?.slice(0, 6).map((p) => (
                <div key={p._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">Min: {p.minimumStock}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Sales */}
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Sales</h2>
          {data?.recentSales?.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No sales yet today.</p>
          ) : (
            <div className="space-y-2">
              {data?.recentSales?.map((sale) => (
                <div key={sale._id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{sale.invoiceNumber}</p>
                    <p className="text-xs text-gray-400">
                      {sale.customer?.name || 'Walk-in'} · {formatDate(sale.saleDate)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-blue-600">{formatCurrency(sale.grandTotal)}</p>
                    <span className="badge-gray text-xs">{sale.paymentMethod}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Products */}
      {data?.topProducts?.length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Top Selling Products (Last 30 Days)</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="table-header">Product</th>
                  <th className="table-header text-right">Units Sold</th>
                  <th className="table-header text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((p, i) => (
                  <tr key={p._id} className="border-b border-gray-50 last:border-0">
                    <td className="table-cell">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-blue-100 rounded text-xs font-bold text-blue-600 flex items-center justify-center">
                          {i + 1}
                        </span>
                        {p.productName}
                      </div>
                    </td>
                    <td className="table-cell text-right font-medium">{p.totalQuantity}</td>
                    <td className="table-cell text-right font-medium text-green-600">
                      {formatCurrency(p.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
