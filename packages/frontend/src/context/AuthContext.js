import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { navigate } from "gatsby";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${process.env.GATSBY_API_URL}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(response.data.data.user);
      setError(null);
    } catch (err) {
      console.error("Auth check failed:", err);
      localStorage.removeItem("token");
      setError("Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        `${process.env.GATSBY_API_URL}/api/auth/login`,
        { email, password }
      );

      const { token, user } = response.data.data;
      localStorage.setItem("token", token);
      setUser(user);
      setError(null);

      // Redirect based on user role
      if (user.role === "client") {
        navigate("/dashboard/client");
      } else {
        navigate("/dashboard/provider");
      }

      return user;
    } catch (err) {
      console.error("Login failed:", err);
      const message = err.response?.data?.message || "Login failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(
        `${process.env.GATSBY_API_URL}/api/auth/register`,
        userData
      );

      const { token, user } = response.data.data;
      localStorage.setItem("token", token);
      setUser(user);
      setError(null);

      // Redirect based on user role
      if (user.role === "client") {
        navigate("/dashboard/client");
      } else {
        navigate("/dashboard/provider");
      }

      return user;
    } catch (err) {
      console.error("Registration failed:", err);
      const message = err.response?.data?.message || "Registration failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
  };

  const updateProfile = async (profileData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.patch(
        `${process.env.GATSBY_API_URL}/api/auth/profile`,
        profileData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setUser(response.data.data.user);
      setError(null);
      return response.data.data.user;
    } catch (err) {
      console.error("Profile update failed:", err);
      const message = err.response?.data?.message || "Profile update failed";
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(
        `${process.env.GATSBY_API_URL}/api/auth/password`,
        {
          currentPassword,
          newPassword,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setError(null);
    } catch (err) {
      console.error("Password change failed:", err);
      const message = err.response?.data?.message || "Password change failed";
      setError(message);
      throw new Error(message);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  if (loading) {
    // You might want to show a loading spinner here
    return <div>Loading...</div>;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
