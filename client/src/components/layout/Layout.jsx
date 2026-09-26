import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, User, UserCheck, Edit3, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../common/Toast';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, dbUser, logout } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toLocaleDateString('en-PK', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const displayName = user?.displayName || dbUser?.name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || dbUser?.email || '';
  const photoURL = user?.photoURL || dbUser?.profileImage;
  const initial = (displayName || email || 'U').charAt(0).toUpperCase();

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await logout();
      navigate('/login');
      toast.success('Logged out successfully.');
    } catch {
      toast.error('Failed to logout.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden sm:block">
              <p className="text-xs text-gray-400 font-medium">{today}</p>
            </div>
          </div>

          {/* Top-Right User Profile Area */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100/80 transition-all text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className={`w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs ${
                  photoURL ? 'hidden' : 'flex'
                }`}
              >
                {initial}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[130px]">
                  {displayName}
                </p>
                <p className="text-[10px] text-gray-400 truncate max-w-[130px]">{email}</p>
              </div>

              <ChevronDown
                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Header info in dropdown */}
                <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
                  <p className="text-xs font-bold text-gray-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-gray-400 truncate">{email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                >
                  <User className="h-4 w-4 text-gray-400" />
                  Profile
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/profile?edit=true');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                >
                  <Edit3 className="h-4 w-4 text-gray-400" />
                  Edit Profile
                </button>

                <div className="border-t border-gray-100 my-1"></div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                >
                  <LogOut className="h-4 w-4 text-red-500" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
