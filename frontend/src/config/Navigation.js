
import {
  LayoutDashboard,
  Users,
  UserRound,
  Milk,
  BarChart3,
  Settings,
  UserCircle,
} from "lucide-react";

export const navigation = {
  // ADMIN NAVIGATION
  admin: [
    {
      name: "Overview",
      path: "/admin",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      path: "/admin/users",
      icon: Users,
    },
    {
      name: "Reports",
      path: "/admin/reports",
      icon: BarChart3,
    },
  ],

  // OWNER NAVIGATION
  owner: [
    {
      name: "Overview",
      path: "/owner",
      icon: LayoutDashboard,
    },
    {
      name: "Buyers",
      path: "/owner/buyers",
      icon: Users,
    },
    {
      name: "Farmers",
      path: "/owner/farmers",
      icon: UserRound,
    },
    {
      name: "Milk Records",
      path: "/owner/milk-records",
      icon: Milk,
    },
    {
      name: "Reports",
      path: "/owner/reports",
      icon: BarChart3,
    },
    {
      name: "Settings",
      path: "/owner/settings",
      icon: Settings,
    },
  ],

  // BUYER NAVIGATION
  buyer: [
    {
      name: "Overview",
      path: "/buyer",
      icon: LayoutDashboard,
    },
    {
      name: "Farmers",
      path: "/buyer/farmers",
      icon: UserRound,
    },
    {
      name: "Milk Records",
      path: "/buyer/milk-records",
      icon: Milk,
    },
    {
      name: "Reports",
      path: "/buyer/reports",
      icon: BarChart3,
    },
    {
      name: "My Profile",
      path: "/buyer/profile",
      icon: UserCircle,
    },
  ],

  // FARMER NAVIGATION
  farmer: [
    {
      name: "Overview",
      path: "/farmer",
      icon: LayoutDashboard,
    },
    {
      name: "My Milk Records",
      path: "/farmer/records",
      icon: Milk,
    },
    {
      name: "My Profile",
      path: "/farmer/profile",
      icon: UserCircle,
    },
  ],
};

export const getNavigationForRole = (role) => {
  return navigation[role] || [];
};
