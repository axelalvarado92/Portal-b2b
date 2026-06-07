import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import AppLayout from "./layouts/AppLayout";

import ProtectedRoute from "./routes/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";

function App() {

  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          <Route
            path="/"
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
              element={<Dashboard />}
            />
          </Route>

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}

export default App;