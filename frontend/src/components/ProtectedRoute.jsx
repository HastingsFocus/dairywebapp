
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading">Loading your session...</div>;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const destinations = {
      admin: "/admin",
      owner: "/owner",
      buyer: "/buyer",
      farmer: "/farmer",
    };

    return (
      <Navigate
        to={destinations[user.role] || "/login"}
        replace
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
