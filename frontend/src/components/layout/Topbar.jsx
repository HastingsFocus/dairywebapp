
import { Menu, Bell, UserCircle } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  const roleName = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "User";

  return (
    <header className="dashboard-topbar">
      {/* Mobile menu button */}
      <button
        type="button"
        className="topbar-menu-button"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
      >
        <Menu size={22} />
      </button>

      {/* Page / system information */}
      <div className="topbar-heading">
        <h2>Dairy Records System</h2>
        <p>Manage your dairy operations</p>
      </div>

      {/* Right side */}
      <div className="topbar-actions">
        {/* Notifications */}
        <button
          type="button"
          className="topbar-icon-button"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        {/* User */}
        <div className="topbar-user">
          <div className="topbar-user-icon">
            <UserCircle size={32} />
          </div>

          <div className="topbar-user-details">
            <strong>{user?.fullName || "User"}</strong>
            <span>{roleName}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
