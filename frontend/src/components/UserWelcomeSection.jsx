import { useEffect, useState } from "react";
import { authAPI, userAPI } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function UserWelcomeSection() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Fetch current user data
    const fetchUserData = async () => {
      try {
        const userData = await userAPI.getCurrentUser();
        setUser(userData);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch user data:", err);
        setError("Failed to fetch user data.");
        setLoading(false);

        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          authAPI.logout();
          navigate("/login");
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = () => {
    authAPI.logout();
    navigate("/login");
  };

  return (
    <>
      {user && (
        <div className="mb-6 bg-gradient-to-r from-blue-900 to-[#0a0e3f] rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Welcome back, {user.first_name}!
              </h2>
              <p className="text-blue-100 mt-1">
                {user.role} • {user.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 pt-2 pb-3 bg-white font-bold text-[#0a0e3f] rounded-lg transition duration-300 cursor-pointer hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
