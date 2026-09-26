import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { PageLoader } from './components/common/Loader';
import { ToastContainer } from './components/common/Toast';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// App pages
import Dashboard from './pages/dashboard/Dashboard';
import Products from './pages/products/Products';
import Categories from './pages/categories/Categories';
import Purchases from './pages/purchases/Purchases';
import Sales from './pages/sales/Sales';
import Customers from './pages/customers/Customers';
import Suppliers from './pages/suppliers/Suppliers';
import NewWithdrawal from './pages/pco/NewWithdrawal';
import NewDeposit from './pages/pco/NewDeposit';
import Transactions from './pages/pco/Transactions';
import PCOCustomers from './pages/pco/PCOCustomers';
import Expenses from './pages/expenses/Expenses';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import Profile from './pages/profile/Profile';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => {
  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/purchases" element={<ProtectedRoute><Purchases /></ProtectedRoute>} />
        <Route path="/sales" element={<ProtectedRoute><Sales /></ProtectedRoute>} />
        <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
        <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
        <Route path="/pco/withdrawals/new" element={<ProtectedRoute><NewWithdrawal /></ProtectedRoute>} />
        <Route path="/pco/deposits/new" element={<ProtectedRoute><NewDeposit /></ProtectedRoute>} />
        <Route path="/pco/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
        <Route path="/pco/customers" element={<ProtectedRoute><PCOCustomers /></ProtectedRoute>} />
        <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <ToastContainer />
    </>
  );
};

export default App;
