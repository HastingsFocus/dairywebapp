
import { Link, useLocation } from "react-router-dom";
import { Milk, LogOut } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getNavigationForRole } from "../../config/Navigation";

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigationLinks = getNavigationForRole(user?.role);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    if (path === `/${user?.role}`) {
      return location.pathname === path;
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`dashboard-sidebar ${isOpen ? "open" : ""}`}>
      {/* Brand */}
      <div className="sidebar-brand">
        <Link to={`/${user?.role || "login"}`} onClick={onClose}>
          <div className="sidebar-logo">
            <Milk size={24} />
          </div>

          <div className="sidebar-brand-text">
            <h1>Dairy Records</h1>
            <span>DAIRYFLOW</span>
          </div>
        </Link>
      </div>

      {/* User information */}
      <div className="sidebar-user">
        <div className="sidebar-user-avatar">
          {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
        </div>

        <div className="sidebar-user-info">
          <strong>{user?.fullName || "User"}</strong>

          <span>
            {user?.role
              ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
              : "User"}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-navigation">
        <div className="sidebar-navigation-label">
          MENU
        </div>

        <ul>
          {navigationLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`sidebar-link ${
                    active ? "active" : ""
                  }`}
                >
                  <Icon size={19} />

                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="sidebar-bottom">
        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
        >
          <LogOut size={19} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
