import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Search, Eye, Filter, Download } from "lucide-react";
import { authAPI, patientAPI } from "../services/api";
import toast from "react-hot-toast";
import ViewPatient from "./ViewPatient";
import { downloadPatientsPdf } from "../utils/patientPdfExport";
import { getTopDiseaseLabel } from "../utils/diagnosisSummary";

const VISIBLE_STATUSES = ["In Progress", "Diagnosed"];

export default function DocPatientsView() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [isViewPatientOpen, setIsViewPatientOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const navigate = useNavigate();

  const formatPatients = (records) => {
    return records.map((patient) => {
      const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

      return {
        id: patient.id,
        name: fullName || "Unknown",
        age: patient.age || "-",
        gender: patient.gender || "-",
        status: patient.status || "Pending",
        disease: patient.suspectedDisease || "Not specified",
        dateAdded: patient.createdAt ? patient.createdAt.split("T")[0] : "-",
        bloodGroup: patient.bloodGroup || "-",
        phone: patient.phone || "-",
      };
    });
  };

  const fetchPatients = useCallback(async () => {
    const records = await patientAPI.getPatients();
    const formatted = formatPatients(records).filter((patient) =>
      VISIBLE_STATUSES.includes(patient.status)
    );
    setPatients(formatted);
  }, []);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const loadPatients = async () => {
      try {
        await fetchPatients();
        setError("");
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError("Failed to fetch patients.");
        setLoading(false);

        if (err.response?.status === 401) {
          authAPI.logout();
          navigate("/login");
        }
      }
    };

    loadPatients();
  }, [navigate, fetchPatients]);

  useEffect(() => {
    if (!authAPI.isAuthenticated()) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void fetchPatients();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [fetchPatients]);

  const filteredPatients = useMemo(() => {
    let filtered = patients;

    if (searchTerm) {
      filtered = filtered.filter(
        (patient) =>
          patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(patient.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(patient.phone).includes(searchTerm)
      );
    }

    if (filterStatus !== "All Status") {
      filtered = filtered.filter((patient) => patient.status === filterStatus);
    }

    return filtered;
  }, [searchTerm, filterStatus, patients]);

  const handleViewPatient = async (patientId) => {
    try {
      const patient = await patientAPI.getPatientById(patientId);
      const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();

      setSelectedPatient({
        ...patient,
        name: fullName || "Unknown",
        dateAdded: patient.createdAt ? patient.createdAt.split("T")[0] : "-",
      });
      setIsViewPatientOpen(true);
    } catch (err) {
      console.error("Failed to fetch patient details:", err);
      toast.error("Failed to load patient details");
    }
  };

  const handleViewResults = (patientId) => {
    navigate(`/view-results?patientId=${patientId}`);
  };

  const handleExportData = async () => {
    try {
      const exportRows = await Promise.all(
        filteredPatients.map(async (patient) => {
          try {
            const diagnosis = await patientAPI.getDiagnosisResult(patient.id);
            return {
              ...patient,
              disease: getTopDiseaseLabel(diagnosis, patient.status, patient.disease),
            };
          } catch {
            return patient;
          }
        })
      );

      downloadPatientsPdf("patients_export.pdf", "Patients List", exportRows);
      toast.success("PDF exported successfully");
    } catch (err) {
      console.error("Failed to export PDF:", err);
      toast.error("Failed to export PDF");
    }
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
      {loading && (
        <div className="px-8 py-4 text-sm text-gray-500">Loading patients...</div>
      )}
      {error && !loading && (
        <div className="px-8 py-4 text-sm text-red-600">{error}</div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">All Patients</h1>
            <p className="text-sm text-gray-500">
              Total Patients: {filteredPatients.length}
            </p>
          </div>
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
                <option value="All Status">All Status</option>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 mb-8">
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
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      {/* Doctor Actions */}
                    </th>
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
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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
                            className={`px-6 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer whitespace-nowrap min-w-[130px] ${
                              patient.status === "In Progress"
                                ? "bg-gray-500 text-white hover:opacity-90"
                                : "bg-[#b91c1c] text-white hover:opacity-90"
                            }`}
                          >
                            {patient.status === "In Progress" ? "Review" : "View Results"}
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

      <ViewPatient
        isOpen={isViewPatientOpen}
        onClose={() => setIsViewPatientOpen(false)}
        patient={selectedPatient}
      />
    </div>
  );
}
