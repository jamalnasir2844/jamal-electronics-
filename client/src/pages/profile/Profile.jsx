import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  User,
  Camera,
  Save,
  LogOut,
  Edit3,
  Mail,
  Building,
  Shield,
  Key,
  CheckCircle2,
  AlertCircle,
  X,
  UploadCloud,
} from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/firebaseConfig';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { toast } from '../../components/common/Toast';

const Profile = () => {
  const { user, dbUser, logout, updateUserProfile, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    displayName: '',
    shopName: 'Jamal Electronics',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Sync state with current Firebase user & dbUser
  useEffect(() => {
    const currentName = user?.displayName || dbUser?.name || user?.email?.split('@')[0] || '';
    const currentShop = dbUser?.shopName || 'Jamal Electronics';
    const currentPhoto = user?.photoURL || dbUser?.profileImage || '';

    setForm({
      displayName: currentName,
      shopName: currentShop,
    });
    if (!imageFile) {
      setImagePreview(currentPhoto);
    }

    if (searchParams.get('edit') === 'true') {
      setIsEditing(true);
    }
  }, [user, dbUser, searchParams, imageFile]);

  const displayName = user?.displayName || dbUser?.name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || dbUser?.email || '';
  const photoURL = imagePreview || user?.photoURL || dbUser?.profileImage;
  const initial = (displayName || email || 'U').charAt(0).toUpperCase();

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    // 5MB limit
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadPhotoFile = async (file) => {
    if (!user) throw new Error('User not logged in');

    // 1. Attempt Firebase Storage upload
    try {
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (storageError) {
      console.warn('Firebase Storage upload notice (using fallback):', storageError.message);
      
      // 2. Fallback to backend Cloudinary upload
      const formData = new FormData();
      formData.append('profileImage', file);
      formData.append('name', form.displayName || displayName);
      const res = await api.put('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data?.data?.profileImage || '';
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!form.displayName.trim()) {
      toast.error('Display name cannot be empty.');
      return;
    }

    setSaving(true);
    try {
      let finalPhotoURL = user?.photoURL || '';

      // Upload new photo if selected
      if (imageFile) {
        setUploadingPhoto(true);
        const uploadedUrl = await uploadPhotoFile(imageFile);
        if (uploadedUrl) {
          finalPhotoURL = uploadedUrl;
        }
      }

      // Update Firebase User Profile
      await updateUserProfile({
        displayName: form.displayName.trim(),
        photoURL: finalPhotoURL,
      });

      // Update shop name on backend if modified
      if (form.shopName !== dbUser?.shopName) {
        await api.put('/profile', { shopName: form.shopName.trim() });
        await refreshUser();
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setImageFile(null);
      setSearchParams({});
    } catch (err) {
      console.error('Failed to update profile:', err);
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
      setUploadingPhoto(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully.');
    } catch {
      toast.error('Failed to logout.');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setImageFile(null);
    setImagePreview(user?.photoURL || dbUser?.profileImage || '');
    setForm({
      displayName: user?.displayName || dbUser?.name || user?.email?.split('@')[0] || '',
      shopName: dbUser?.shopName || 'Jamal Electronics',
    });
    setSearchParams({});
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Profile</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your personal details and account settings</p>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Edit3 className="h-4 w-4" />
              Edit Profile
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200 text-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Main Profile Card */}
      <div className="card overflow-hidden shadow-sm border border-gray-100">
        {/* Banner Cover */}
        <div className="h-32 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 relative">
          <div className="absolute inset-0 bg-black/5"></div>
        </div>

        <div className="px-6 pb-8 pt-0">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-6 gap-4">
            <div className="flex items-end gap-5">
              <div className="relative group">
                <div className="w-28 h-28 rounded-2xl bg-white p-1 shadow-lg border-2 border-white">
                  {photoURL ? (
                    <img
                      src={photoURL}
                      alt={displayName}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className={`w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-4xl shadow-inner ${
                      photoURL ? 'hidden' : 'flex'
                    }`}
                  >
                    {initial}
                  </div>
                </div>

                {/* Change photo button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change profile picture"
                  className="absolute bottom-1 right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-md transition-transform hover:scale-105"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>

              <div className="mb-2">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{displayName}</h2>
                <p className="text-sm text-gray-500 font-mono">{email}</p>
              </div>
            </div>

            <div className="sm:mb-2 flex items-center gap-2">
              <span className="badge-green flex items-center gap-1.5 py-1 px-3">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                Active Authenticated User
              </span>
            </div>
          </div>

          {/* Edit Form or Read-only Display */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Edit3 className="h-4 w-4 text-blue-600" />
                  Edit Account Information
                </h3>
                <span className="text-xs text-gray-400">Updates will sync with Firebase & Database</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Enter your name"
                    value={form.displayName}
                    onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown in the header, sidebar, and invoices</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      className="input-field bg-gray-50 text-gray-500 cursor-not-allowed pr-10"
                      value={email}
                      disabled
                    />
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Managed securely by Firebase Authentication</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop / Business Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="input-field pr-10"
                      placeholder="Jamal Electronics"
                      value={form.shopName}
                      onChange={(e) => setForm({ ...form, shopName: e.target.value })}
                    />
                    <Building className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <div className="input-field bg-gray-50 text-gray-500 capitalize flex items-center justify-between">
                    <span>{dbUser?.role || 'admin'}</span>
                    <Shield className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Photo file indicator */}
              {imageFile && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-blue-800">
                    <UploadCloud className="h-4 w-4" />
                    <span>New picture selected: <strong>{imageFile.name}</strong></span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(user?.photoURL || dbUser?.profileImage || '');
                    }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={cancelEdit}
                  disabled={saving}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving
                    ? uploadingPhoto
                      ? 'Uploading photo...'
                      : 'Saving changes...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          ) : (
            /* Read-Only Account Information Layout */
            <div className="space-y-6 pt-4 border-t border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Full Name
                    </span>
                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Email Address
                    </span>
                    <p className="text-sm font-semibold text-gray-900 font-mono">{email}</p>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Shop Name
                    </span>
                    <p className="text-sm font-semibold text-gray-900">
                      {dbUser?.shopName || 'Jamal Electronics'}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-100">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                      Role & Permissions
                    </span>
                    <p className="text-sm font-semibold text-gray-900 capitalize">
                      {dbUser?.role || 'Administrator'}
                    </p>
                  </div>

                  <div className="sm:col-span-2 p-4 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                        Firebase User ID (UID)
                      </span>
                      <p className="text-xs font-mono text-gray-600 truncate max-w-md">{user?.uid || 'N/A'}</p>
                    </div>
                    <Key className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Bottom Quick Action bar */}
              <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  Edit Profile
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-secondary flex items-center gap-2 text-red-600 hover:bg-red-50 hover:border-red-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
