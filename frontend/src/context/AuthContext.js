
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the existing session after a page refresh.
  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");
    const token = sessionStorage.getItem("token");

    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("token");
      }
    } else {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("token");
    }

    setLoading(false);
  }, []);

  // Save the response received from authService.
  const login = (data) => {
    const loggedInUser = {
      ...(data.user || {}),
      id: data.user?.id || data.user?._id || data.id,
      email: data.user?.email || data.email,
      role: data.user?.role || data.role,
      fullName:
        data.user?.fullName || data.fullName || "User",
    };

    if (!data.token || !loggedInUser.role) {
      throw new Error(
        "The server returned an incomplete login response."
      );
    }

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem(
      "user",
      JSON.stringify(loggedInUser)
    );

    setUser(loggedInUser);

    return loggedInUser;
  };

  const logout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: Boolean(user),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
};

export default AuthContext;
