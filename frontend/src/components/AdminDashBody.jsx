import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Activity, Database, ClipboardMinus } from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import AddUser from "../components/AddUser";

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

  const handleAddUsers = () => {
    navigate("/adduser");
  };

  const handleViewUsers = () => {
    navigate("/users");
  };

  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

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
            <AddUser isOpen={isAddUserOpen} onClose={() => setIsAddUserOpen(false)} />
            <button
              onClick={handleViewUsers}
              className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>View All Users</span>
            </button>
            <button className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2">
              <ClipboardMinus className="w-5 h-5" />
              <span>Generate Reports</span>
            </button>
          </div>
        </div>
      </div>

      {/* Additional Analytics Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 text-sm mb-2">Next Payment Date</p>
          <p className="text-2xl font-bold text-[#0a0e3f]">2026/02/01</p>
          <p className="text-xs text-gray-500 mt-2">Payment due in 35 days</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 text-sm mb-2">Payment Status</p>
          <p className="text-2xl font-bold text-yellow-600">Completed</p>
          <p className="text-xs text-gray-500 mt-2">Last payment on 2025/12/29</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <p className="text-gray-600 text-sm mb-2">System Status</p>
          {/* <p className="text-2xl font-bold text-green-600">Operational</p>
          <p className="text-xs text-gray-500 mt-2">All systems running</p> */}
          <p className="text-2xl font-bold text-red-600">Offline</p>
          <p className="text-xs text-gray-500 mt-2">All systems down</p>
        </div>
      </div>
    </div>
  );
}
