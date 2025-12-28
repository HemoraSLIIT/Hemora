import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import toast from "react-hot-toast";

export default function AdminDashBody() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([
    {
      id: "U001",
      name: "John Smith",
      email: "john.smith@hospital.com",
      role: "Doctor",
      dateAdded: "2024-12-11",
      phone: "555-1001",
    },
    {
      id: "U002",
      name: "Sarah Johnson",
      email: "sarah.johnson@hospital.com",
      role: "Lab Technician",
      dateAdded: "2024-12-10",
      phone: "555-1002",
    },
    {
      id: "U003",
      name: "Michael Chen",
      email: "michael.chen@hospital.com",
      role: "Admin",
      dateAdded: "2024-12-09",
      phone: "555-1003",
    },
    {
      id: "U004",
      name: "Emily Davis",
      email: "emily.davis@hospital.com",
      role: "Admin",
      dateAdded: "2024-12-09",
      phone: "555-1004",
    },
    {
      id: "U005",
      name: "Robert Wilson",
      email: "robert.wilson@hospital.com",
      role: "Doctor",
      dateAdded: "2024-12-08",
      phone: "555-1005",
    },
    {
      id: "U006",
      name: "Lisa Martinez",
      email: "lisa.martinez@hospital.com",
      role: "Lab Technician",
      dateAdded: "2024-12-08",
      phone: "555-1006",
    },
    {
      id: "U007",
      name: "David Brown",
      email: "david.brown@hospital.com",
      role: "Doctor",
      dateAdded: "2024-12-07",
      phone: "555-1007",
    },
    {
      id: "U008",
      name: "Jennifer Lee",
      email: "jennifer.lee@hospital.com",
      role: "Doctor",
      dateAdded: "2024-12-07",
      phone: "555-1008",
    },
  ]);

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

  const handleViewUser = (userId) => {
    toast.success(`Viewing user ${userId}`);
    // Navigate to user detail view when implemented
  };

  const handleEditUser = (userId) => {
    toast.success(`Editing user ${userId}`);
    // Navigate to edit user when implemented
  };

  const handleDeleteUser = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User deleted successfully");
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Doctor":
        return "bg-blue-100 text-blue-800";
      case "Lab Technician":
        return "bg-purple-100 text-purple-800";
      case "Admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Content */}
      <div className="p-8">   
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {users.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Role
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewUser(user.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditUser(user.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 text-lg">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}