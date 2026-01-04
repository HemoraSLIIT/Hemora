import { useEffect, useState } from "react";
import { authAPI, userAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Bell, Search } from "lucide-react";

export default function Header() {
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
      } catch (err) {
        console.error("Failed to fetch user data:", err);

        // If unauthorized, redirect to login
        if (err.response?.status === 401) {
          authAPI.logout();
          navigate("/login");
        }
      }
    };

    fetchUserData();
  }, [navigate]);

  return (
    <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-end">
      <div className="flex items-center space-x-4">
        {/* <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search patients..."
                className="pl-10 pr-4 py-2 bg-gray-100 text-gray-700 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div> */}
        {/* <Bell className="text-gray-600 w-6 h-6 cursor-pointer hover:text-blue-600" /> */}
        <div className="relative">
          <img
            src={`https://ui-avatars.com/api/?name=${user?.username?.[0]}&background=0a0e3f&color=fff`}
            alt="Profile"
            title="View Profile"
            className="w-10 h-10 rounded-full cursor-pointer"
            onClick={() => navigate("/profile")}
          />
        </div>
      </div>
    </div>
  );
}
