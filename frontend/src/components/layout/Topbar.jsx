import { Menu, Bell, UserCircle } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const Topbar = ({ onMenuClick }) => {
  const { user } = useAuth();

  const roleName = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "User";

  return (
    <header className="sticky top-0 z-30 flex h-[76px] w-full items-center justify-between gap-3 border-b border-[#383838] bg-[#181818]/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      {/* Left side */}
      <div className="flex min-w-0 items-center gap-3 sm:gap-4">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#383838] bg-[#222222] text-[#E7E7E7] transition-all duration-200 hover:border-[#86efac]/50 hover:bg-[#292929] hover:text-[#86efac] focus:outline-none focus:ring-2 focus:ring-[#86efac]/40 lg:hidden"
        >
          <Menu size={21} />
        </button>

        {/* System information */}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-bold tracking-tight text-[#E7E7E7] sm:text-base">
            Dairy Records System
          </h2>

          <p className="mt-1 hidden truncate text-xs text-[#A3A3A3] sm:block">
            Manage your dairy operations
          </p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">
        {/* Notifications */}
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg text-[#A3A3A3] transition-colors duration-200 hover:bg-[#292929] hover:text-[#86efac] focus:outline-none focus:ring-2 focus:ring-[#86efac]/40"
        >
          <Bell size={20} strokeWidth={1.8} />
        </button>

        {/* Divider */}
        <div className="hidden h-9 w-px bg-[#383838] sm:block" />

        {/* User profile */}
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#86efac]/30 bg-[#86efac]/10 text-[#86efac]">
            {user?.fullName ? (
              <span className="text-sm font-bold">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <UserCircle size={25} />
            )}
          </div>

          <div className="hidden min-w-0 sm:block">
            <p className="max-w-[180px] truncate text-sm font-semibold text-[#E7E7E7]">
              {user?.fullName || "User"}
            </p>

            <p className="mt-0.5 text-xs text-[#86efac]">
              {roleName}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;