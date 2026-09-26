import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Package, Tag, ShoppingCart, TrendingUp,
  Warehouse, Users, Truck, DollarSign, BarChart3, Settings,
  LogOut, Zap, CreditCard, FileText, User, X, ChevronRight,
  Receipt, AlertCircle, Wallet,
} from 'lucide-react';
import { toast } from '../common/Toast';

const navItems = [
  { section: 'MAIN', items: [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ]},
  { section: 'ELECTRONICS', items: [
    { path: '/products', icon: Package, label: 'Products' },
    { path: '/categories', icon: Tag, label: 'Categories' },
    { path: '/purchases', icon: ShoppingCart, label: 'Purchases' },
    { path: '/sales', icon: TrendingUp, label: 'Sales' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
  ]},
  { section: 'PCO SERVICES', items: [
    { path: '/pco/withdrawals/new', icon: CreditCard, label: 'New Withdrawal' },
    { path: '/pco/deposits/new', icon: Wallet, label: 'New Deposit' },
    { path: '/pco/customers', icon: Users, label: 'PCO Customers' },
    { path: '/pco/transactions', icon: Receipt, label: 'Transactions' },
  ]},
  { section: 'FINANCE', items: [
    { path: '/expenses', icon: DollarSign, label: 'Expenses' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/reports', icon: BarChart3, label: 'Reports' },
  ]},
  { section: 'SYSTEM', items: [
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]},
];

const Sidebar = ({ open, onClose }) => {
  const { user, dbUser, logout } = useAuth();
  const navigate = useNavigate();

  const displayName = user?.displayName || dbUser?.name || user?.email?.split('@')[0] || 'User';
  const email = user?.email || dbUser?.email || '';
  const photoURL = user?.photoURL || dbUser?.profileImage;
  const initial = (displayName || email || 'U').charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully.');
    } catch {
      toast.error('Failed to logout.');
    }
  };

  const handleProfileClick = () => {
    onClose?.();
    navigate('/profile');
  };

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 leading-tight">Jamal Electronics</h1>
              <p className="text-xs text-gray-400">{dbUser?.shopName || 'Shop'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((group) => (
            <div key={group.section} className="mb-1">
              <p className="px-5 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                {group.section}
              </p>
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-100 ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User area */}
        <div className="border-t border-gray-100 p-3 flex-shrink-0">
          <button
            type="button"
            onClick={handleProfileClick}
            className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50/60 transition-all text-left group mb-2"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover border border-gray-200 group-hover:border-blue-300 transition-colors"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-xs ${
                photoURL ? 'hidden' : 'flex'
              }`}
            >
              {initial}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                {displayName}
              </p>
              <p className="text-[10px] text-gray-400 truncate">{email}</p>
            </div>

            <ChevronRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
