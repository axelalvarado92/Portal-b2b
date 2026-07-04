import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Companies from "./pages/customer/Companies";
import Products from "./pages/customer/Products";
import ProductsAdmin from "./pages/admin/Products";
import Orders from "./pages/customer/Orders";
import Landing from "./pages/Landing";
import AdminOrders from "./pages/admin/Orders";
import DashboardAdmin from "./pages/admin/DashboardAdmin";
import Profile from "./pages/customer/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import Register from "./pages/Register";
import AccountRequests from "./pages/admin/AccountRequests";
import ProductDetail from "./pages/customer/ProductDetail";
import HomePage from "./pages/customer/HomePage";
import CompanyDetail from "./pages/admin/CompanyDetail";
import AdminProductDetail from "./pages/admin/ProductDetail";


import AppLayout from "./layouts/AppLayout";
import AdminLayout from "./layouts/AdminLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Users from "./pages/admin/Users";
import AdminCompanies from "./pages/admin/Companies";
import Invoices from "./pages/Invoices";

import AdminRoute from "./routes/AdminRoute";

import { AuthProvider } from "./context/AuthContext";
import { CompanyProvider } from "./context/CompanyContext";
import { CartProvider } from "./context/CartContext";

import Cart from "./pages/customer/Cart";

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Rutas Públicas */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/register" element={<Register />} />

              {/* Layout para Clientes (CustomerLayout) */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout /> 
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<HomePage />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/company/:id" element={<Products />} />
                <Route path="/products" element={<Products />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/invoices" element={<Invoices />} />
              </Route>

              {/* Layout para Admin (AdminLayout) */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminLayout />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              >
                <Route path="dashboard" element={<DashboardAdmin />} />
                <Route path="users" element={<Users />} />
                <Route path="products" element={<ProductsAdmin />} />
                <Route path="products/new" element={<AdminProductDetail mode="create" />} />
                <Route path="products/:id" element={<AdminProductDetail mode="edit" />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="companies" element={<AdminCompanies />} />
                <Route path="companies/new" element={<CompanyDetail mode="create" />} />
                <Route path="companies/:id" element={<CompanyDetail mode="edit" />} />
                <Route path="account-requests" element={<AccountRequests />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </CompanyProvider>
    </AuthProvider>
  );
}


export default App;