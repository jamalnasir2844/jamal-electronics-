import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Image, Filter, X } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate, getStockStatus } from '../../utils/helpers';
import { toast } from '../../components/common/Toast';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import Loader from '../../components/common/Loader';

const UNITS = ['pcs', 'kg', 'g', 'L', 'mL', 'box', 'set', 'pair', 'roll'];

const emptyForm = {
  name: '', sku: '', category: '', description: '',
  purchasePrice: '', sellingPrice: '', stock: '', minimumStock: '5',
  unit: 'pcs', supplier: '',
};

const Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  const fetchProducts = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 15 };
      if (search) params.search = search;
      if (filterCategory) params.category = filterCategory;
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load products.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [catRes, supRes] = await Promise.all([api.get('/categories'), api.get('/suppliers')]);
      setCategories(catRes.data.data);
      setSuppliers(supRes.data.data);
    } catch {}
  };

  useEffect(() => { fetchMeta(); }, []);
  useEffect(() => { fetchProducts(1); }, [search, filterCategory]);

  const openCreate = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setImageFile(null);
    setImagePreview('');
    setShowModal(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name, sku: p.sku || '', category: p.category?._id || '',
      description: p.description, purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice, stock: p.stock, minimumStock: p.minimumStock,
      unit: p.unit, supplier: p.supplier?._id || '',
    });
    setImageFile(null);
    setImagePreview(p.imageUrl || '');
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Product name is required.');
    if (!form.purchasePrice) return toast.error('Purchase price is required.');
    if (!form.sellingPrice) return toast.error('Selling price is required.');

    setSaving(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          formData.append(k, v);
        }
      });
      if (imageFile) formData.append('image', imageFile);

      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product updated successfully.');
      } else {
        await api.post('/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Product created successfully.');
      }
      setShowModal(false);
      fetchProducts(editProduct ? pagination.page : 1);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.delete(`/products/${deleteId}`);
      toast.success('Product deleted.');
      setDeleteId(null);
      fetchProducts(pagination.page);
    } catch {
      toast.error('Failed to delete product.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const StockBadge = ({ stock, minimumStock }) => {
    const status = getStockStatus(stock, minimumStock);
    const cls = status.color === 'green' ? 'badge-green' : status.color === 'amber' ? 'badge-amber' : 'badge-red';
    return <span className={cls}>{status.label}</span>;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="section-title">Products</h1>
          <p className="text-sm text-gray-400 mt-0.5">{pagination.total} total products</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            className="input-field pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-full sm:w-48"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="h-12 w-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-gray-400 text-sm">Add your first product to get started</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="table-header">Product</th>
                    <th className="table-header">SKU</th>
                    <th className="table-header">Category</th>
                    <th className="table-header text-right">Purchase Price</th>
                    <th className="table-header text-right">Selling Price</th>
                    <th className="table-header text-center">Stock</th>
                    <th className="table-header text-center">Status</th>
                    <th className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {products.map((p) => (
                    <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                      <td className="table-cell">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-9 h-9 rounded-lg object-cover border border-gray-100" />
                          ) : (
                            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                              <Package className="h-4 w-4 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{p.name}</p>
                            <p className="text-xs text-gray-400">{p.unit}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell text-gray-500">{p.sku || '—'}</td>
                      <td className="table-cell">{p.category?.name || '—'}</td>
                      <td className="table-cell text-right">{formatCurrency(p.purchasePrice)}</td>
                      <td className="table-cell text-right font-medium text-blue-600">{formatCurrency(p.sellingPrice)}</td>
                      <td className="table-cell text-center font-semibold">{p.stock}</td>
                      <td className="table-cell text-center">
                        <StockBadge stock={p.stock} minimumStock={p.minimumStock} />
                      </td>
                      <td className="table-cell text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeleteId(p._id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-gray-100 px-4 py-3">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={(p) => fetchProducts(p)}
              />
            </div>
          </>
        )}
      </div>

      {/* Product Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editProduct ? 'Edit Product' : 'Add Product'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div className="flex items-start gap-4">
            <div
              className="w-24 h-24 bg-gray-100 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors flex-shrink-0 overflow-hidden"
              onClick={() => fileRef.current.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <div className="text-center p-2">
                  <Image className="h-6 w-6 text-gray-300 mx-auto" />
                  <p className="text-xs text-gray-400 mt-1">Upload</p>
                </div>
              )}
            </div>
            <input type="file" ref={fileRef} accept="image/*" onChange={handleImageChange} className="hidden" />
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <input type="text" className="input-field" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                  <input type="text" className="input-field" placeholder="Auto-generated if empty" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({...form, category: e.target.value})}>
                <option value="">Select category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
              <select className="input-field" value={form.supplier} onChange={(e) => setForm({...form, supplier: e.target.value})}>
                <option value="">Select supplier</option>
                {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price *</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.purchasePrice} onChange={(e) => setForm({...form, purchasePrice: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price *</label>
              <input type="number" min="0" step="0.01" className="input-field" value={form.sellingPrice} onChange={(e) => setForm({...form, sellingPrice: e.target.value})} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select className="input-field" value={form.unit} onChange={(e) => setForm({...form, unit: e.target.value})}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Stock</label>
              <input type="number" min="0" className="input-field" value={form.stock} onChange={(e) => setForm({...form, stock: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Stock</label>
              <input type="number" min="0" className="input-field" value={form.minimumStock} onChange={(e) => setForm({...form, minimumStock: e.target.value})} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={2} className="input-field resize-none" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Products;
