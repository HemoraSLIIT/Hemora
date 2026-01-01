import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import toast from "react-hot-toast";
import Header from "../components/Header";
import ProfileForm from "../components/ProfileForm";
import SideBar from "../components/SideBar"; // added

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();

  const fetchUserData = async () => {
    try {
      const userData = await userAPI.getCurrentUser();
      if (!userData) throw new Error("Unable to fetch user details");

      if (userData.username) {
        sessionStorage.setItem(
          "userInitial",
          userData.username.charAt(0).toUpperCase()
        );
      }

      setUser(userData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      toast.error("Failed to fetch user data");
      setLoading(false);

      if (err.response?.status === 401) {
        authAPI.logout();
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }
    fetchUserData();
  }, [navigate]);

  const handleUpdateSuccess = async () => {
    await fetchUserData();
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a0e3f]"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen bg-gray-50">
        <SideBar />
        <div className="flex-1 flex flex-col">
          <Header />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-red-600">Failed to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SideBar />
      <div className="flex-1 overflow-auto">
        <Header />
        <div className="p-8">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-200">
                <UserRound className="w-12 h-12 text-[#0a0e3f]" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                  <p className="text-gray-600">{user.role}</p>
                </div>
              </div>

              {/* Edit Button */}
              <div className="mb-8">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 cursor-pointer font-medium"
                  >
                    Edit Profile
                  </button>
                ) : null}
              </div>

              {/* ProfileForm */}
              <ProfileForm
                isEditing={isEditing}
                initialData={user}
                onSuccess={handleUpdateSuccess}
                onCancel={handleCancel}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
