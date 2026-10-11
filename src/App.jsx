import { Navigate, Route, Routes } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from './auth';
import Layout from './components/Layout';
import { Loading } from './components/ui';

import Login from './pages/auth/Login';
import RegisterFarmer from './pages/auth/RegisterFarmer';
import RegisterCustomer from './pages/auth/RegisterCustomer';
import Notifications from './pages/Notifications';

import AdminDashboard from './pages/admin/Dashboard';
import AdminFarmers from './pages/admin/Farmers';
import AdminCustomers from './pages/admin/Customers';
import AdminDrivers from './pages/admin/Drivers';
import AdminCatalog from './pages/admin/Catalog';
import AdminPurchaseOrders from './pages/admin/PurchaseOrders';
import AdminReceiving from './pages/admin/Receiving';
import AdminFarmerPayments from './pages/admin/FarmerPayments';
import AdminProcessing from './pages/admin/Processing';
import AdminInventory from './pages/admin/Inventory';
import AdminRequirements from './pages/admin/Requirements';
import AdminOrders from './pages/admin/Orders';
import AdminDeliveries from './pages/admin/Deliveries';
import AdminFinance from './pages/admin/Finance';

import FarmerProfile from './pages/farmer/Profile';
import FarmerProducts from './pages/farmer/Products';
import FarmerOrders from './pages/farmer/Orders';
import FarmerPayments from './pages/farmer/Payments';

import CustomerShop from './pages/customer/Shop';
import CustomerCart from './pages/customer/Cart';
import CustomerOrders from './pages/customer/Orders';
import CustomerRequirements from './pages/customer/Requirements';
import CustomerInvoices from './pages/customer/Invoices';
import CustomerProfile from './pages/customer/Profile';
import PaymentResult from './pages/customer/PaymentResult';
import MockPayment from './pages/customer/MockPayment';

import DriverDeliveries from './pages/driver/Deliveries';

function RequireRole({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={HOME_BY_ROLE[user.role] || '/login'} replace />;
  return children;
}

function RequireLogin({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function Home() {
  const { user } = useAuth();
  return <Navigate to={user ? HOME_BY_ROLE[user.role] || '/login' : '/login'} replace />;
}

export default function App() {
  const { ready } = useAuth();
  if (!ready) return <Loading text="Starting..." />;

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register/farmer" element={<RegisterFarmer />} />
      <Route path="/register/customer" element={<RegisterCustomer />} />

      <Route element={<RequireLogin><Layout /></RequireLogin>}>
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/admin" element={<RequireRole role="ADMIN"><AdminDashboard /></RequireRole>} />
        <Route path="/admin/farmers" element={<RequireRole role="ADMIN"><AdminFarmers /></RequireRole>} />
        <Route path="/admin/customers" element={<RequireRole role="ADMIN"><AdminCustomers /></RequireRole>} />
        <Route path="/admin/drivers" element={<RequireRole role="ADMIN"><AdminDrivers /></RequireRole>} />
        <Route path="/admin/catalog" element={<RequireRole role="ADMIN"><AdminCatalog /></RequireRole>} />
        <Route path="/admin/purchase-orders" element={<RequireRole role="ADMIN"><AdminPurchaseOrders /></RequireRole>} />
        <Route path="/admin/receiving" element={<RequireRole role="ADMIN"><AdminReceiving /></RequireRole>} />
        <Route path="/admin/farmer-payments" element={<RequireRole role="ADMIN"><AdminFarmerPayments /></RequireRole>} />
        <Route path="/admin/processing" element={<RequireRole role="ADMIN"><AdminProcessing /></RequireRole>} />
        <Route path="/admin/inventory" element={<RequireRole role="ADMIN"><AdminInventory /></RequireRole>} />
        <Route path="/admin/requirements" element={<RequireRole role="ADMIN"><AdminRequirements /></RequireRole>} />
        <Route path="/admin/orders" element={<RequireRole role="ADMIN"><AdminOrders /></RequireRole>} />
        <Route path="/admin/deliveries" element={<RequireRole role="ADMIN"><AdminDeliveries /></RequireRole>} />
        <Route path="/admin/finance" element={<RequireRole role="ADMIN"><AdminFinance /></RequireRole>} />

        <Route path="/farmer" element={<RequireRole role="FARMER"><FarmerProfile /></RequireRole>} />
        <Route path="/farmer/products" element={<RequireRole role="FARMER"><FarmerProducts /></RequireRole>} />
        <Route path="/farmer/orders" element={<RequireRole role="FARMER"><FarmerOrders /></RequireRole>} />
        <Route path="/farmer/payments" element={<RequireRole role="FARMER"><FarmerPayments /></RequireRole>} />

        <Route path="/customer" element={<RequireRole role="CUSTOMER"><CustomerShop /></RequireRole>} />
        <Route path="/customer/cart" element={<RequireRole role="CUSTOMER"><CustomerCart /></RequireRole>} />
        <Route path="/customer/orders" element={<RequireRole role="CUSTOMER"><CustomerOrders /></RequireRole>} />
        <Route path="/customer/requirements" element={<RequireRole role="CUSTOMER"><CustomerRequirements /></RequireRole>} />
        <Route path="/customer/invoices" element={<RequireRole role="CUSTOMER"><CustomerInvoices /></RequireRole>} />
        <Route path="/customer/profile" element={<RequireRole role="CUSTOMER"><CustomerProfile /></RequireRole>} />
        <Route path="/payment/result" element={<RequireRole role="CUSTOMER"><PaymentResult /></RequireRole>} />
        <Route path="/payment/mock" element={<RequireRole role="CUSTOMER"><MockPayment /></RequireRole>} />

        <Route path="/driver" element={<RequireRole role="DRIVER"><DriverDeliveries /></RequireRole>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
