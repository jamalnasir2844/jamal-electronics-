import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../components/common/Toast';
import Loader from '../../components/common/Loader';

const Settings = () => {
  const [settings, setSettings] = useState({
    shopName: 'Jamal Electronics',
    chargeRate: 20,
    chargePer: 1000,
    currency: 'PKR',
    currencySymbol: 'Rs.',
    address: '',
    phone: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/settings').then((res) => {
      if (res.data.data) setSettings(res.data.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', settings);
      setSettings(res.data.data);
      toast.success('Settings saved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings.');
    } finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-16"><Loader /></div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your shop configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Shop Info */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-blue-600" />
            Shop Information
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name</label>
            <input type="text" className="input-field" value={settings.shopName} onChange={(e) => setSettings({...settings, shopName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea rows={2} className="input-field resize-none" value={settings.address} onChange={(e) => setSettings({...settings, address: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="text" className="input-field" value={settings.phone} onChange={(e) => setSettings({...settings, phone: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" className="input-field" value={settings.email} onChange={(e) => setSettings({...settings, email: e.target.value})} />
            </div>
          </div>
        </div>

        {/* PCO Rate */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">PCO Charge Rate</h2>
          <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            <p><strong>Formula:</strong> Service Charge = (Withdrawal ÷ Charge Per) × Charge Rate</p>
            <p className="mt-1">Example with current settings: Rs.5,000 withdrawal → Rs.{((5000 / settings.chargePer) * settings.chargeRate).toFixed(0)} charge</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Charge Rate (Rs.)</label>
              <input type="number" min="0" step="0.01" className="input-field" value={settings.chargeRate} onChange={(e) => setSettings({...settings, chargeRate: Number(e.target.value)})} />
              <p className="text-xs text-gray-400 mt-1">Amount charged</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Per Amount (Rs.)</label>
              <input type="number" min="1" className="input-field" value={settings.chargePer} onChange={(e) => setSettings({...settings, chargePer: Number(e.target.value)})} />
              <p className="text-xs text-gray-400 mt-1">Per this amount withdrawn</p>
            </div>
          </div>
        </div>

        {/* Currency */}
        <div className="card p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Currency</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency Code</label>
              <input type="text" className="input-field" value={settings.currency} onChange={(e) => setSettings({...settings, currency: e.target.value})} placeholder="PKR" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency Symbol</label>
              <input type="text" className="input-field" value={settings.currencySymbol} onChange={(e) => setSettings({...settings, currencySymbol: e.target.value})} placeholder="Rs." />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default Settings;
