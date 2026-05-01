import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Activity, Database, ClipboardMinus } from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import toast from "react-hot-toast";
import AddUser from "../components/AddUser";
import { downloadUsersPdf } from "../utils/userPdfExport";

export default function AdminDashBody() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

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

        // Fetch all users from backend
        const response = await userAPI.getAllUsers();
        // Handle both array and paginated responses
        const usersList = Array.isArray(response)
          ? response
          : response.results || [];
        setUsers(usersList);

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

  const handleAddUsers = () => {
    navigate("/adduser");
  };

  const handleViewUsers = () => {
    navigate("/users");
  };

  const handleGenerateReports = async () => {
    try {
      const exportRows = users.map((entry) => ({
        id: entry.id,
        name: entry.fullName || entry.username || entry.name || "Unknown",
        email: entry.email || "-",
        role: entry.role || "-",
        dateAdded: entry.createdAt || entry.dateJoined || "-",
      }));

      await downloadUsersPdf("users_report.pdf", "Users Report", exportRows);
      toast.success("User PDF exported successfully");
    } catch (err) {
      console.error("Failed to generate user report:", err);
      toast.error("Failed to generate user report");
    }
  };

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  const handleUserCreated = async () => {
    try {
      const response = await userAPI.getAllUsers();
      // Handle both array and paginated responses
      const usersList = Array.isArray(response)
        ? response
        : response.results || [];
      setUsers(usersList);
    } catch (err) {
      console.error("Failed to refresh users:", err);
    }
  };

  return (
    <div>
      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Stats Section */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.length}
                </p>
              </div>
              <Users className="w-12 h-12 text-gray-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Doctors</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.filter((u) => u.role === "Doctor").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg"></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Lab Technicians</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.filter((u) => u.role === "Lab Technician").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg"></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Admins</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {users.filter((u) => u.role === "Admin").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => setIsAddUserOpen(true)}
              className="cursor-pointer w-full py-3 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add New User</span>
            </button>
            <AddUser
              isOpen={isAddUserOpen}
              onClose={() => setIsAddUserOpen(false)}
              onUserCreated={handleUserCreated}
            />
            <button
              onClick={handleViewUsers}
              className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>View All Users</span>
            </button>
            <button
              onClick={handleGenerateReports}
              className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2"
            >
              <ClipboardMinus className="w-5 h-5" />
              <span>Generate Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Analytics Section */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 text-sm mb-2">Next Payment Date</p>
          <p className="text-2xl font-bold text-[#0a0e3f]">2026/02/01</p>
          <p className="text-xs text-gray-500 mt-2">Payment due in 35 days</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 text-sm mb-2">Payment Status</p>
          <p className="text-2xl font-bold text-yellow-600">Completed</p>
          <p className="text-xs text-gray-500 mt-2">
            Last payment on 2025/12/29
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 text-sm mb-2">System Status</p>
          <p className="text-2xl font-bold text-green-600">Operational</p>
          <p className="text-xs text-gray-500 mt-2">All systems running</p>
          <p className="text-2xl font-bold text-red-600">Offline</p>
          <p className="text-xs text-gray-500 mt-2">All systems down</p>     
        </div>
      </div> */}
    </div>
  );
}
