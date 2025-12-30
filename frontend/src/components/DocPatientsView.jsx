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
import ViewResults from "./ViewResults";

export default function DocPatientsView() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([
    {
      id: "P001",
      name: "John Doe",
      age: 34,
      gender: "Male",
      status: "Pending",
      disease: "Iron Deficiency Anemia",
      dateAdded: "2024-12-11",
      bloodGroup: "O+",
      phone: "555-0101",
    },
    {
      id: "P002",
      name: "Jane Smith",
      age: 28,
      gender: "Female",
      status: "Diagnosed",
      disease: "Beta Thalassemia",
      dateAdded: "2024-12-11",
      bloodGroup: "A+",
      phone: "555-0102",
    },
    {
      id: "P003",
      name: "Robert Johnson",
      age: 45,
      gender: "Male",
      status: "In Progress",
      disease: "Acute Lymphoblastic Leukemia",
      dateAdded: "2024-12-10",
      bloodGroup: "B+",
      phone: "555-0103",
    },
    {
      id: "P004",
      name: "Maria Garcia",
      age: 52,
      gender: "Female",
      status: "Pending",
      disease: "Sickle Cell Disease",
      dateAdded: "2024-12-10",
      bloodGroup: "O-",
      phone: "555-0104",
    },
    {
      id: "P005",
      name: "David Lee",
      age: 39,
      gender: "Male",
      status: "Diagnosed",
      disease: "Iron Deficiency Anemia",
      dateAdded: "2024-12-09",
      bloodGroup: "A-",
      phone: "555-0105",
    },
    {
      id: "P006",
      name: "Sarah Wilson",
      age: 31,
      gender: "Female",
      status: "In Progress",
      disease: "Beta Thalassemia",
      dateAdded: "2024-12-09",
      bloodGroup: "B-",
      phone: "555-0106",
    },
    {
      id: "P007",
      name: "Michael Brown",
      age: 55,
      gender: "Male",
      status: "Diagnosed",
      disease: "Healthy",
      dateAdded: "2024-12-08",
      bloodGroup: "AB+",
      phone: "555-0107",
    },
    {
      id: "P008",
      name: "Emily Davis",
      age: 26,
      gender: "Female",
      status: "Pending",
      disease: "Iron Deficiency Anemia",
      dateAdded: "2024-12-08",
      bloodGroup: "O+",
      phone: "555-0108",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filteredPatients, setFilteredPatients] = useState(patients);
  const [isViewResultsOpen, setIsViewResultsOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
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

  useEffect(() => {
    // Filter patients based on search and status filter
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          patient.phone.includes(searchTerm)
      );
    }

    if (filterStatus !== "All") {
      filtered = filtered.filter((patient) => patient.status === filterStatus);
    }

    setFilteredPatients(filtered);
  }, [searchTerm, filterStatus, patients]);

  const handleAddPatient = () => {
    navigate("/addpatient");
  };

  const handleViewPatient = (patientId) => {
    toast.success(`Viewing patient ${patientId}`);
    // Navigate to patient detail view when implemented
  };

  const handleEditPatient = (patientId) => {
    toast.success(`Editing patient ${patientId}`);
    // Navigate to edit patient when implemented
  };

  const handleDeletePatient = (patientId) => {
    setPatients((prev) => prev.filter((p) => p.id !== patientId));
    toast.success("Patient deleted successfully");
  };

  const handleDiagnose = (patientId) => {
    toast.success(`Starting diagnosis for patient ${patientId}`);
    // Navigate to diagnosis page when implemented
    // navigate(`/diagnosis/${patientId}`);
  };

  const handleViewResults = (patientId) => {
    const patient = patients.find((p) => p.id === patientId);
    setSelectedPatient(patient);
    setIsViewResultsOpen(true);
  };

  const handleExportData = () => {
    // Convert patients data to CSV
    const headers = [
      "ID",
      "Name",
      "Age",
      "Gender",
      "Blood Group",
      "Status",
      "Disease",
      "Phone",
      "Date Added",
    ];
    const csvContent = [
      headers.join(","),
      ...filteredPatients.map((p) =>
        [
          p.id,
          p.name,
          p.age,
          p.gender,
          p.bloodGroup,
          p.status,
          p.disease,
          p.phone,
          p.dateAdded,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patients_export.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data exported successfully");
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
  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">All Patients</h1>
            <p className="text-sm text-gray-500">
              Total Patients: {filteredPatients.length}
            </p>
          </div>
          <button
            onClick={handleAddPatient}
            className="flex items-center space-x-2 px-4 py-2 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add Patient</span>
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
                placeholder="Search by name, ID, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              <Filter className="w-5 h-5 text-gray-400 mt-2.5" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0a0e3f] focus:border-transparent cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Diagnosed">Diagnosed</option>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {patients.length}
                </p>
              </div>
              <Users className="w-12 h-12 text-blue-100" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Pending</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {patients.filter((p) => p.status === "Pending").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg"></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {patients.filter((p) => p.status === "In Progress").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg"></div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Diagnosed</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {patients.filter((p) => p.status === "Diagnosed").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Patients Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          {filteredPatients.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Patient ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Age / Gender
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Date Added
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Actions
                    </th>
                    {/* <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Comments
                      </th> */}
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((patient) => (
                    <tr
                      key={patient.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {patient.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {patient.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {patient.age} / {patient.gender}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            patient.status
                          )}`}
                        >
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {patient.dateAdded}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleViewPatient(patient.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* <button
                            onClick={() => handleEditPatient(patient.id)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeletePatient(patient.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button> */}
                        </div>
                      </td>
                      {/* Doctor */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-3">
                          {/* <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium cursor-pointer whitespace-nowrap">
                            Add Comment
                          </button> */}

                          <button
                            onClick={() => handleViewResults(patient.id)}
                            className="px-4 py-2 bg-orange-700 text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
                          >
                            View Results
                          </button>

                          {/* <button className="px-4 py-2 bg-[#32C527] text-white rounded-lg hover:opacity-90 transition-colors text-sm font-medium cursor-pointer">
                            Approve
                          </button> */}
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
              <p className="text-gray-500 text-lg">No patients found</p>
              <p className="text-gray-400 text-sm">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      <ViewResults
        isOpen={isViewResultsOpen}
        onClose={() => setIsViewResultsOpen(false)}
        userRole="Doctor"
      />
    </div>
  );
}