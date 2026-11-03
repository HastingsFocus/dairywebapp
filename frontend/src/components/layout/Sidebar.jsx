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
    onClose?.();
  };

  const isActive = (path) => {
    if (path === `/${user?.role}`) {
      return location.pathname === path;
    }

    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col
        border-r border-[#383838] bg-[#202020]
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
    >
      {/* Brand */}
      <div className="border-b border-[#383838] px-6 py-6">
        <Link
          to={`/${user?.role || "login"}`}
          onClick={onClose}
          className="group flex items-center gap-3"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#86efac] text-[#181818] shadow-lg shadow-green-950/20 transition-transform duration-200 group-hover:scale-105">
            <Milk size={25} strokeWidth={2.2} />
          </div>

          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-[#E7E7E7]">
              Dairy Records
            </h1>
            <span className="text-[10px] font-bold tracking-[0.25em] text-[#86efac]">
              DAIRYFLOW
            </span>
          </div>
        </Link>
      </div>

      {/* User information */}
      <div className="mx-4 mt-6 rounded-xl border border-[#383838] bg-[#262626] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#86efac]/30 bg-[#86efac]/10 text-lg font-bold text-[#86efac]">
            {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[#E7E7E7]">
              {user?.fullName || "User"}
            </p>

            <div className="mt-1 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#86efac]" />
              <span className="text-xs capitalize text-[#A3A3A3]">
                {user?.role || "User"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-7 flex-1 overflow-y-auto px-4">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#777777]">
          Main Menu
        </p>

        <ul className="space-y-1.5">
          {navigationLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`
                    group relative flex items-center gap-3
                    rounded-lg px-3 py-3 text-sm font-medium
                    transition-all duration-200
                    ${
                      active
                        ? "bg-[#86efac]/10 text-[#86efac]"
                        : "text-[#A3A3A3] hover:bg-[#2b2b2b] hover:text-[#E7E7E7]"
                    }
                  `}
                >
                  {active && (
                    <span className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-[#86efac]" />
                  )}

                  <Icon
                    size={19}
                    strokeWidth={active ? 2.2 : 1.8}
                    className={`shrink-0 transition-colors ${
                      active
                        ? "text-[#86efac]"
                        : "text-[#858585] group-hover:text-[#E7E7E7]"
                    }`}
                  />

                  <span className="truncate">{item.name}</span>

                  {active && (
                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#86efac]" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-[#383838] p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-[#A3A3A3] transition-colors duration-200 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut
            size={19}
            className="transition-transform duration-200 group-hover:-translate-x-0.5"
          />
          <span>Logout</span>
        </button>

        <p className="mt-4 text-center text-[10px] tracking-wide text-[#626262]">
          DairyFlow · Dairy Management
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;