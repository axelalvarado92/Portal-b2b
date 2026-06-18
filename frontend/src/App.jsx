import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Customer/DashboardCustomer";
import Companies from "./pages/Companies";
import Products from "./pages/customer/Products";
import ProductsAdmin from "./pages/admin/Products";
import Orders from "./pages/customer/Orders";
import Landing from "./pages/Landing";
import AdminOrders from "./pages/admin/Orders";
import DashboardAdmin from "./pages/admin/DashboardAdmin";

import AppLayout from "./layouts/AppLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Users from "./pages/admin/Users";
import AdminCompanies from "./pages/admin/Companies";
import Invoices from "./pages/Invoices";

import AdminRoute from "./routes/AdminRoute";

import { AuthProvider } from "./context/AuthContext";

import {
  CompanyProvider,
} from "./context/CompanyContext";

import Cart from "./pages/customer/Cart";
import DashboardCustomer from "./pages/customer/DashboardCustomer";

function App() {

  return (
    <AuthProvider>

      <CompanyProvider>

        <BrowserRouter>

          <Routes>

            <Route
                path="/"
                element={<Landing />}
              />

              <Route
                path="/login"
                element={<Login />}
              />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >

              <Route
                path="/dashboard"
                element={<DashboardCustomer />}
              />

              <Route
                path="/companies"
                element={<Companies />}
              />

              <Route
                path="/products"
                element={<Products />}
              />

              <Route
                path="/cart"
                element={<Cart />}
              />

              <Route
                path="/orders"
                element={<Orders />}
              />

              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <Users />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/dashboard"
                element={
                  <AdminRoute>
                    <DashboardAdmin />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/products"
                element={
                  <AdminRoute>
                    <ProductsAdmin />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/orders"
                element={
                  <AdminRoute>
                    <AdminOrders />
                  </AdminRoute>
                }
              />

              <Route
                path="/admin/companies"
                element={
                  <AdminRoute>
                    <AdminCompanies />
                  </AdminRoute>
                }
              />
              
              <Route
                path="/invoices"
                element={<Invoices />}
              />

            </Route>

          </Routes>

        </BrowserRouter>

      </CompanyProvider>

    </AuthProvider>
  );
}

export default App;