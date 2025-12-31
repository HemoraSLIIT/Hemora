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
import AddUser from "../components/AddUser";
import DeleteConfirm from "./DeleteConfirm";

export default function UserView() {
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

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filteredUsers, setFilteredUsers] = useState(users);
  const navigate = useNavigate();

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [addUserMode, setAddUserMode] = useState("add");
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);

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

  useEffect(() => {
    // Filter users based on search and role filter
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.phone.includes(searchTerm)
      );
    }

    if (filterRole !== "All") {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, users]);

  const handleViewUser = (userId) => {
    toast.success(`Viewing user ${userId}`);
    // Navigate to user detail view when implemented
  };

  const handleEditUser = (userId) => {
    const userToEdit = users.find((u) => u.id === userId);
    if (userToEdit) {
      setSelectedUserForEdit(userToEdit);
      setAddUserMode("edit");
      setIsAddUserOpen(true);
    }
  };

  const handleDeleteUser = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    toast.success("User deleted successfully");
  };

  const handleExportData = () => {
    // Convert users data to CSV
    const headers = ["ID", "Name", "Email", "Role", "Phone", "Date Added"];
    const csvContent = [
      headers.join(","),
      ...filteredUsers.map((u) =>
        [u.id, u.name, u.email, u.role, u.phone, u.dateAdded].join(",")
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
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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

  const handleAddUserClose = () => {
    setIsAddUserOpen(false);
    setAddUserMode("add");
    setSelectedUserForEdit(null);
  };

  const handleAddUserSuccess = () => {
    // Refresh the users list
    // In a real scenario, this would refetch from the API
    // For now, we're just closing and could implement list refresh
    handleAddUserClose();
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">aaa Users</h1>
            <p className="text-sm text-gray-500">
              Total Users: {filteredUsers.length}
            </p>
          </div>
          <button
            onClick={() => {
              setAddUserMode("add");
              setSelectedUserForEdit(null);
              setIsAddUserOpen(true);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add User</span>
          </button>
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

      <AddUser
        isOpen={isAddUserOpen}
        onClose={handleAddUserClose}
        mode={addUserMode}
        userId={selectedUserForEdit?.id}
        userData={selectedUserForEdit}
        onSuccess={handleAddUserSuccess}
      />

      <DeleteConfirm
        isOpen={isDeleteConfirmOpen}
        title="Delete User"
        message={`Are you sure you want to delete this user? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </div>
  );
}
