import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  Download,
} from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import toast from "react-hot-toast";
import AddUser from "./AddUser";
import DeleteConfirm from "./DeleteConfirm";
import ViewUser from "./ViewUser";
import EditUser from "./EditUser";

export default function UserView() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  // Fetch all users from API
  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAllUsers();
      // Handle paginated response (results array) or direct array
      const usersData = response.results || response;
      setUsers(usersData);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      toast.error("Failed to fetch users");
    }
  };

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

        // Fetch all users after current user is loaded
        await fetchUsers();
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

  useEffect(() => {
    // Filter users based on search and role filter
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id
            ?.toString()
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone?.includes(searchTerm)
      );
    }

    if (filterRole !== "All") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, users]);

  const handleViewUser = async (userId) => {
    try {
      const userData = await userAPI.getUserById(userId);
      setSelectedUser(userData);
      setIsViewUserOpen(true);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      toast.error("Failed to fetch user details");
    }
  };

  const handleEditUser = async (userId) => {
    try {
      const userData = await userAPI.getUserById(userId);
      setSelectedUser(userData);
      setIsEditUserOpen(true);
    } catch (err) {
      console.error("Failed to fetch user details:", err);
      toast.error("Failed to fetch user details");
    }
  };

  const handleDeleteUser = async (userId) => {
    // if (!window.confirm("Are you sure you want to delete this user?")) {
    //   return;
    // }

    try {
      await userAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted successfully");
    } catch (err) {
      console.error("Failed to delete user:", err);
      toast.error(err.response?.data?.detail || "Failed to delete user");
    }
  };

  // Callback when a new user is created
  const handleUserCreated = () => {
    fetchUsers();
  };

  const handleExportData = () => {
    // Convert users data to CSV
    const headers = ["ID", "Name", "Email", "Role", "Date Added"];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((u) =>
        [u.id, u.fullName || u.username, u.email, u.role, u.createdAt].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "Doctor":
        return "bg-blue-100 text-blue-800";
      case "Lab Technician":
        return "bg-purple-100 text-purple-800";
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Researcher":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

  const openDeleteConfirm = (userId) => {
    setDeleteUserId(userId);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteUserId) {
      handleDeleteUser(deleteUserId);
      setIsDeleteConfirmOpen(false);
      setDeleteUserId(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setDeleteUserId(null);
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Check if user is Admin */}
      {user?.role !== "Admin" && (
        <div className="flex items-center justify-center h-screen bg-gray-100">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <p className="text-red-500 text-lg font-semibold">Access Denied</p>
            <p className="text-gray-600 mt-2">
              Only administrators can manage users.
            </p>
          </div>
        </div>
      )}

      {user?.role === "Admin" && (
        <>
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-800">All Users</h1>
                <p className="text-sm text-gray-500">
                  Total Users: {filteredUsers.length}
                </p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
                <span>Add User</span>
              </button>
              <AddUser
                isOpen={isAddUserOpen}
                onClose={() => setIsAddUserOpen(false)}
                onUserCreated={handleUserCreated}
              />
              <ViewUser
                isOpen={isViewUserOpen}
                onClose={() => {
                  setIsViewUserOpen(false);
                  setSelectedUser(null);
                }}
                user={selectedUser}
              />
              <EditUser
                isOpen={isEditUserOpen}
                onClose={() => {
                  setIsEditUserOpen(false);
                  setSelectedUser(null);
                }}
                user={selectedUser}
                onUserUpdated={handleUserCreated}
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Search and Filter Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Box */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, ID, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
                  />
                </div>

                {/* Role Filter */}
                <div className="flex gap-2">
                  <Filter className="w-5 h-5 text-gray-400 mt-2.5" />
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent cursor-pointer"
                  >
                    <option value="All">All Roles</option>
                    <option value="Doctor">Doctor</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportData}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Export</span>
                </button>
              </div>
            </div>

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
              {filteredUsers.length > 0 ? (
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
                      {filteredUsers.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {user.id}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {user.fullName || user.username}
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
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditUser(user.id)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openDeleteConfirm(user.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
                  <p className="text-gray-400 text-sm">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </div>
          </div>

          <DeleteConfirm
            isOpen={isDeleteConfirmOpen}
            title="Delete User"
            message={`Are you sure you want to delete this user? This action cannot be undone.`}
            onConfirm={confirmDelete}
            onCancel={cancelDelete}
          />
        </>
      )}
    </div>
  );
}
