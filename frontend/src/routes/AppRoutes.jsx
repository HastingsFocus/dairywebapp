
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import DashboardLayout from "../components/layout/DashboardLayout";

// Authentication pages
import SetPassword from "../pages/auth/SetPassword";
import Login from "../pages/auth/Login";
import OwnerSignup from "../pages/auth/OwnerSignUp";

// Dashboard
import DashboardHome from "../pages/dashboard/DashboardHome";

// Owner pages
import Buyer from "../pages/owner/Buyer";
import OwnerMilkRecords from "../pages/owner/MilkRecords";
import MilkPricing from "../pages/owner/MilkPricing";
import FinancialReports from "../pages/owner/FinancialReports";
import LoanManagement from "../pages/owner/LoanManagement";

// Buyer pages
import Farmers from "../pages/buyers/Farmers";
import MilkRecords from "../pages/buyers/MilkRecords";

// Farmer pages
import MyMilkRecords from "../pages/farmers/MyMilkRecords";
import MyFinancialReport from "../pages/farmers/MyFinancialReport";
import LoanApplication from "../pages/farmers/LoanApplication";

const RoleHome = () => {
  const { user } = useAuth();

  const destinations = {
    admin: "/admin",
    owner: "/owner",
    buyer: "/buyer",
    farmer: "/farmer",
  };

  return (
    <Navigate
      to={destinations[user?.role] || "/login"}
      replace
    />
  );
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        Loading Dairy Records System...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <Navigate
            to={user ? `/${user.role}` : "/login"}
            replace
          />
        }
      />

      <Route
        path="/login"
        element={user ? <RoleHome /> : <Login />}
      />

      <Route
        path="/owner/signup"
        element={user ? <RoleHome /> : <OwnerSignup />}
      />

      <Route
        path="/set-password/:token"
        element={<SetPassword />}
      />

      {/* Admin routes */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/admin" element={<DashboardHome />} />
          <Route path="/admin/users" element={<DashboardHome />} />
          <Route path="/admin/reports" element={<DashboardHome />} />
        </Route>
      </Route>

      {/* Owner routes */}
      <Route element={<ProtectedRoute allowedRoles={["owner"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/owner" element={<DashboardHome />} />

          <Route path="/owner/buyers" element={<Buyer />} />

          <Route
            path="/owner/milk-records"
            element={<OwnerMilkRecords />}
          />

          <Route
            path="/owner/milk-pricing"
            element={<MilkPricing />}
          />

          <Route
            path="/owner/financial-reports"
            element={<FinancialReports />}
          />

          <Route
  path="/owner/loans"
  element={<LoanManagement />}
/>

          <Route
            path="/owner/reports"
            element={<DashboardHome />}
          />
        </Route>
      </Route>

      {/* Buyer routes */}
      <Route element={<ProtectedRoute allowedRoles={["buyer"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/buyer" element={<DashboardHome />} />

          <Route path="/buyer/farmers" element={<Farmers />} />

          <Route
            path="/buyer/milk-records"
            element={<MilkRecords />}
          />

          <Route
            path="/buyer/reports"
            element={<DashboardHome />}
          />
        </Route>
      </Route>

      {/* Farmer routes */}
      <Route element={<ProtectedRoute allowedRoles={["farmer"]} />}>
        <Route element={<DashboardLayout />}>
          <Route path="/farmer" element={<DashboardHome />} />

          <Route
            path="/farmer/records"
            element={<MyMilkRecords />}
          />

          <Route
            path="/farmer/financial-report"
            element={<MyFinancialReport />}
          />

          <Route
            path="/farmer/loans"
            element={<LoanApplication />}
          />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route
        path="*"
        element={
          <Navigate
            to={user ? `/${user.role}` : "/login"}
            replace
          />
        }
      />
    </Routes>
  );
};

export default AppRoutes;
