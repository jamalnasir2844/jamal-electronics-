import { useState, useEffect } from 'react';
import { Plus, Search, Truck, Edit2, Trash2, Phone, Mail } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';

const emptyForm = { name: '', phone: '', email: '', address: '' };

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editSup, setEditSup] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await api.get('/suppliers', { params });
      setSuppliers(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load suppliers.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(1); }, [search]);

  const openCreate = () => { setEditSup(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s) => { setEditSup(s); setForm({ name: s.name, phone: s.phone, email: s.email, address: s.address }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Supplier name is required.');
    setSaving(true);
    try {
      if (editSup) {
        await api.put(`/suppliers/${editSup._id}`, form);
        toast.success('Supplier updated.');
      } else {
        await api.post('/suppliers', form);
        toast.success('Supplier added.');
      }
      setShowModal(false);
      fetchSuppliers(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save supplier.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/suppliers/${deleteId}`);
      toast.success('Supplier deleted.');
      setDeleteId(null);
      fetchSuppliers(pagination.page);
    } catch { toast.error('Failed to delete supplier.'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="section-title">Suppliers</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} suppliers</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" />Add Supplier</button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input type="text" placeholder="Search by name or phone..." className="input-field pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader /></div>
        ) : suppliers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Truck className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No suppliers found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Name</th>
                    <th className="table-header">Phone</th>
                    <th className="table-header">Email</th>
                    <th className="table-header text-right">Total Purchases</th>
                    <th className="table-header text-right">Remaining</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {suppliers.map((s) => (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell font-medium text-gray-900">{s.name}</td>
                      <td className="table-cell text-gray-500">{s.phone || '—'}</td>
                      <td className="table-cell text-gray-500">{s.email || '—'}</td>
                      <td className="table-cell text-right">{formatCurrency(s.totalPurchases)}</td>
                      <td className="table-cell text-right">
                        <span className={s.remainingBalance > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
                          {formatCurrency(s.remainingBalance)}
                        </span>
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(s)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => setDeleteId(s._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <Pagination currentPage={pagination.page} totalPages={pagination.pages} onPageChange={fetchSuppliers} />
            </div>
          </>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editSup ? 'Edit Supplier' : 'Add Supplier'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" className="input-field" value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea rows={2} className="input-field resize-none" value={form.address} onChange={(e) => setForm({...form, address: e.target.value})} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editSup ? 'Update' : 'Add Supplier'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} title="Delete Supplier" message="This will delete the supplier. Purchase history will remain." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteLoading} />
    </div>
  );
};

export default Suppliers;
