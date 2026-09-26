import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Loader from '../../components/common/Loader';
import { formatDate } from '../../utils/helpers';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch { toast.error('Failed to load categories.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setEditCat(null); setForm({ name: '', description: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditCat(c); setForm({ name: c.name, description: c.description }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Category name is required.');
    setSaving(true);
    try {
      if (editCat) {
        await api.put(`/categories/${editCat._id}`, form);
        toast.success('Category updated.');
      } else {
        await api.post('/categories', form);
        toast.success('Category created.');
      }
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/categories/${deleteId}`);
      toast.success('Category deleted.');
      setDeleteId(null);
      fetchCategories();
    } catch { toast.error('Failed to delete category.'); }
    finally { setDeleteLoading(false); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="section-title">Categories</h1>
          <p className="text-sm text-gray-400 mt-0.5">{categories.length} categories</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />Add Category
        </button>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader /></div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Tag className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No categories yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="table-header">#</th>
                <th className="table-header">Name</th>
                <th className="table-header">Description</th>
                <th className="table-header">Created</th>
                <th className="table-header text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c, i) => (
                <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell text-gray-400">{i + 1}</td>
                  <td className="table-cell font-medium text-gray-900">{c.name}</td>
                  <td className="table-cell text-gray-500">{c.description || '—'}</td>
                  <td className="table-cell text-gray-500">{formatDate(c.createdAt)}</td>
                  <td className="table-cell text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteId(c._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editCat ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
            <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} className="input-field resize-none" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editCat ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Category"
        message="Are you sure? This will not delete products but they will lose this category."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Categories;
