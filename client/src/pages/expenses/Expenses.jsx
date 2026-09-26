import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';

const EXPENSE_CATEGORIES = ['Rent', 'Electricity', 'Transport', 'Salary', 'Maintenance', 'Internet', 'Other'];

const emptyForm = { title: '', category: 'Other', amount: '', description: '', date: new Date().toISOString().split('T')[0] };

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchExpenses = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const res = await api.get('/expenses', { params });
      setExpenses(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load expenses.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(1); }, [search, filterCategory, startDate, endDate]);

  const openCreate = () => { setEditExpense(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (e) => { setEditExpense(e); setForm({ title: e.title, category: e.category, amount: e.amount, description: e.description, date: e.date?.split('T')[0] }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error('Title is required.');
    if (!form.amount || form.amount < 0) return toast.error('Valid amount required.');
    setSaving(true);
    try {
      if (editExpense) {
        await api.put(`/expenses/${editExpense._id}`, form);
        toast.success('Expense updated.');
      } else {
        await api.post('/expenses', form);
        toast.success('Expense added.');
      }
      setShowModal(false);
      fetchExpenses(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save expense.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/expenses/${deleteId}`);
      toast.success('Expense deleted.');
      setDeleteId(null);
      fetchExpenses(pagination.page);
    } catch { toast.error('Failed to delete expense.'); }
    finally { setDeleteLoading(false); }
  };

  const totalShown = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryColors = {
    Rent: 'badge-red', Electricity: 'badge-amber', Transport: 'badge-blue',
    Salary: 'badge-green', Maintenance: 'badge-gray', Internet: 'badge-blue', Other: 'badge-gray',
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="section-title">Expenses</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} expenses</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" />Add Expense</button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search..." className="input-field pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-40" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" className="input-field w-40" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <input type="date" className="input-field w-40" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
      </div>

      {expenses.length > 0 && (
        <div className="card p-4 bg-red-50 border-red-100 flex justify-between items-center">
          <span className="text-sm font-medium text-red-700">Total (shown)</span>
          <span className="font-bold text-red-700 text-lg">{formatCurrency(totalShown)}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader /></div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No expenses found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Title</th>
                    <th className="table-header">Category</th>
                    <th className="table-header">Date</th>
                    <th className="table-header text-right">Amount</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {expenses.map((e) => (
                    <tr key={e._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <p className="font-medium text-gray-900">{e.title}</p>
                        {e.description && <p className="text-xs text-gray-400">{e.description}</p>}
                      </td>
                      <td className="table-cell"><span className={categoryColors[e.category] || 'badge-gray'}>{e.category}</span></td>
                      <td className="table-cell text-gray-500">{formatDate(e.date)}</td>
                      <td className="table-cell text-right font-semibold text-red-600">{formatCurrency(e.amount)}</td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(e)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteId(e._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={fetchExpenses} />
            </div>
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editExpense ? 'Edit Expense' : 'Add Expense'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input type="text" className="input-field" value={form.title} onChange={(e) => setForm({...form, title: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" className="input-field" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} className="input-field resize-none" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editExpense ? 'Update' : 'Add Expense'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} title="Delete Expense" message="Are you sure you want to delete this expense?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
};

export default Expenses;
