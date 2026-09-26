import { useState, useEffect } from 'react';
import { Search, Users, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { formatCurrency } from '../../utils/helpers';
import Loader from '../../components/common/Loader';

const PCOCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      try {
        const params = { limit: 100 };
        if (search) params.search = search;
        const res = await api.get('/customers', { params });
        // Filter only PCO customers
        setCustomers(res.data.data.filter((c) => c.transactionCount > 0));
      } catch {}
      finally { setLoading(false); }
    };
    fetchCustomers();
  }, [search]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="section-title">PCO Customers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{customers.length} PCO customers</p>
        </div>
        <Link to="/pco/withdrawals/new" className="btn-primary">
          <CreditCard className="h-4 w-4" />New Withdrawal
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search by name or phone..." className="input-field pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader /></div>
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No PCO customers yet</p>
            <p className="text-gray-400 text-sm">Customers will appear after their first withdrawal</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="table-header">Customer</th>
                  <th className="table-header">Phone</th>
                  <th className="table-header text-right">Total Withdrawals</th>
                  <th className="table-header text-right">Total Charges</th>
                  <th className="table-header text-center">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-bold text-xs">{c.name?.charAt(0)?.toUpperCase()}</span>
                        </div>
                        <p className="font-medium text-gray-900">{c.name}</p>
                      </div>
                    </td>
                    <td className="table-cell text-gray-500">{c.phone}</td>
                    <td className="table-cell text-right font-medium">{formatCurrency(c.totalWithdrawals)}</td>
                    <td className="table-cell text-right text-amber-600 font-semibold">{formatCurrency(c.totalCharges)}</td>
                    <td className="table-cell text-center">
                      <span className="badge-blue">{c.transactionCount}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PCOCustomers;
