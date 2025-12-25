import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Bell,
  MessageSquare,
  Calendar,
  FileText,
  Settings,
  Search,
  User,
  Plus,
  Users,
  Activity,
  ClipboardList,
  Database,
  ClipboardMinus,
} from "lucide-react";
import { authAPI, userAPI } from "../services/api";
import HemNewLogo from "/assets/hemnewlogo3.svg";

const DoctorDashboard = () => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("recent");
  const navigate = useNavigate();

  // Dashboard statistics
  const [dashboardStats] = useState({
    totalPatients: 156,
    todayPatients: 12,
    pendingDiagnosis: 8,
    completedToday: 4,
    diseases: [
      { name: "Acute Lymphoblastic Leukemia", count: 23, color: "bg-red-500" },
      { name: "Beta Thalassemia", count: 45, color: "bg-blue-500" },
      { name: "Iron Deficiency Anemia", count: 67, color: "bg-yellow-500" },
      { name: "Sickle Cell Disease", count: 21, color: "bg-purple-500" },
      { name: "Healthy", count: 10, color: "bg-green-500" },
    ],
    recentPatients: [
      {
        id: "P001",
        name: "John Doe",
        age: 34,
        status: "Pending",
        disease: "IDA",
        date: "2024-12-11",
      },
      {
        id: "P002",
        name: "Jane Smith",
        age: 28,
        status: "Diagnosed",
        disease: "Beta Thalassemia",
        date: "2024-12-11",
      },
      {
        id: "P003",
        name: "Robert Johnson",
        age: 45,
        status: "In Progress",
        disease: "ALL",
        date: "2024-12-10",
      },
      {
        id: "P004",
        name: "Maria Garcia",
        age: 52,
        status: "Pending",
        disease: "SCD",
        date: "2024-12-10",
      },
      {
        id: "P005",
        name: "David Lee",
        age: 39,
        status: "Diagnosed",
        disease: "IDA",
        date: "2024-12-09",
      },
      {
        id: "P006",
        name: "Sarah Wilson",
        age: 31,
        status: "In Progress",
        disease: "Beta Thalassemia",
        date: "2024-12-09",
      },
    ],
    pendingTests: [
      { patient: "John Doe", test: "Blood Smear Analysis", priority: "High" },
      { patient: "Maria Garcia", test: "CBC Report Upload", priority: "High" },
      {
        patient: "Robert Johnson",
        test: "Blood Smear Analysis",
        priority: "Medium",
      },
      { patient: "Sarah Wilson", test: "Final Diagnosis", priority: "Low" },
    ],
  });

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

  const handleAddPatient = () => {
    navigate("/addpatient");
  };

  const handleViewPatients = () => {
    navigate("/patients");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Diagnosed":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-100 text-red-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 text-lg font-semibold mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <p className="text-red-500 text-lg font-semibold">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-22 bg-[#0a0e3f] flex flex-col items-center py-6 space-y-0 rounded-tr-4xl rounded-br-4xl h-full">
        <div className="">
          {/* <div className="bg-white text-blue-900 px-2 py-1 rounded">HEMO</div> */}
          {/* <div> */}
          <img
            src={HemNewLogo}
            alt="Logo"
            width={60}
            height={60}
            className=""
          />
          {/* </div> */}
        </div>
        <div className="flex flex-col items-center justify-center flex-1 space-y-8">
          <Home className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          <Bell className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          <Users
            className="text-white w-6 h-6 cursor-pointer hover:scale-110"
            onClick={handleViewPatients}
          />
          {/* <Activity className="text-white w-6 h-6 cursor-pointer hover:text-blue-300" /> */}
          <Calendar className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
          {/* <Database className="text-white w-6 h-6 cursor-pointer hover:text-blue-300" /> */}
          <Settings className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            {/* <h1 className="text-2xl font-bold text-gray-800">Blood Disease Diagnosis System</h1> */}
            {/* <p className="text-sm text-gray-500">Laboratory Management Dashboard</p> */}
          </div>
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
                src={`https://ui-avatars.com/api/?name=${user?.first_name}+${user?.last_name}&background=0a0e3f&color=fff`}
                alt="Profile"
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* User Welcome Section */}
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

          {/* Quick Stats */}
          {/* <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Total Patients</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {dashboardStats.totalPatients}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600 w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Today's Patients</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {dashboardStats.todayPatients}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="text-green-600 w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">
                    Pending Diagnosis
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {dashboardStats.pendingDiagnosis}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ClipboardList className="text-orange-600 w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Completed Today</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {dashboardStats.completedToday}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-purple-600 w-6 h-6" />
                </div>
              </div>
            </div>
          </div> */}

          {/* Disease Distribution & Quick Actions */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            {/* Disease Distribution */}
            <div className="col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Disease Distribution
              </h3>
              <div className="space-y-4">
                {dashboardStats.diseases.map((disease, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-700 font-medium">
                        {disease.name}
                      </span>
                      <span className="text-gray-600 font-semibold">
                        {disease.count} patients
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${disease.color} h-3 rounded-full transition-all duration-500`}
                        style={{
                          width: `${
                            (disease.count / dashboardStats.totalPatients) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Action Summary
                </h3>
                <h3 className="text-lg font-bold text-[#A6A6A6] mb-4">
                  See all
                </h3>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleAddPatient}
                  className="cursor-pointer w-full h-21 py-3 bg-[#EEEFF1] text-gray-700 rounded-lg hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
                >
                  {/* <Plus className="w-5 h-5" />
                  <span>Add New Patient</span> */}
                </button>
                <button
                  onClick={handleAddPatient}
                  className="cursor-pointer w-full h-21 py-3 bg-[#EEEFF1] text-gray-700 rounded-lg hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
                >
                  {/* <Plus className="w-5 h-5" />
                  <span>Add New Patient</span> */}
                </button>
                <button
                  onClick={handleAddPatient}
                  className="cursor-pointer w-full h-21 py-3 bg-[#EEEFF1] text-gray-700 rounded-lg hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
                >
                  {/* <Plus className="w-5 h-5" />
                  <span>Add New Patient</span> */}
                </button>
                {/* <button
                  onClick={handleViewPatients}
                  className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2"
                >
                  <Users className="w-5 h-5" />
                  <span>View All Patients</span>
                </button>
                <button className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Diagnosis Reports</span>
                </button>
                <button className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Database Export</span>
                </button>
                <button className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2">
                  <ClipboardMinus className="w-5 h-5" />
                  <span>Generate Reports</span>
                </button> */}
              </div>
            </div>
          </div>

          {/* Recent Patients & Pending Tests */}
          <div className="grid grid-cols-2 gap-6">
            {/* Recent Patients */}
            {/* <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                  Recent Patients
                </h3>
                <button
                  onClick={handleViewPatients}
                  className="text-blue-600 text-sm font-semibold hover:text-blue-700"
                >
                  View All →
                </button>
              </div>
              <div className="space-y-3">
                {dashboardStats.recentPatients.map((patient, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">
                          {patient.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {patient.id} • Age: {patient.age}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                          patient.status
                        )}`}
                      >
                        {patient.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Suspected: {patient.disease}
                      </span>
                      <span className="text-gray-400">{patient.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div> */}

            {/* Pending Tests */}
            {/* <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                Pending Tests & Analysis
              </h3>
              <div className="space-y-3">
                {dashboardStats.pendingTests.map((test, index) => (
                  <div
                    key={index}
                    className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-semibold text-gray-800">
                        {test.patient}
                      </p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getPriorityColor(
                          test.priority
                        )}`}
                      >
                        {test.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{test.test}</p>
                  </div>
                ))}
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
