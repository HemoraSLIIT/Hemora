import DiseaseDistributionCard from "./DiseaseDistributionCard";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Activity, Database, ClipboardMinus } from "lucide-react";
import toast from "react-hot-toast";
import { patientAPI } from "../services/api";
import { downloadPatientsPdf } from "../utils/patientPdfExport";
import { getTopDiseaseLabel } from "../utils/diagnosisSummary";

export default function LabTechDashBody() {
  const navigate = useNavigate();

  const handleAddPatient = () => {
    navigate("/addpatient");
  };

  const handleViewPatients = () => {
    navigate("/patients");
  };

  const handleDiagnosisReports = () => {
    navigate("/diagnosis-reports");
  };

  const handleDatabaseExport = async () => {
    try {
      const records = await patientAPI.getPatients();

      const exportRows = await Promise.all(
        records.map(async (patient) => {
          const fullName = `${patient.firstName || ""} ${patient.lastName || ""}`.trim();
          const formattedPatient = {
            id: patient.id,
            name: fullName || "Unknown",
            ageGender: `${patient.age || "-"} / ${patient.gender || "-"}`,
            status: patient.status || "Pending",
            disease: patient.suspectedDisease || "Not specified",
            dateAdded: patient.createdAt ? patient.createdAt.split("T")[0] : "-",
          };

          try {
            const diagnosis = await patientAPI.getDiagnosisResult(patient.id);
            return {
              ...formattedPatient,
              disease: getTopDiseaseLabel(
                diagnosis,
                formattedPatient.status,
                formattedPatient.disease
              ),
            };
          } catch {
            return formattedPatient;
          }
        })
      );

      await downloadPatientsPdf(
        "patients_database_export.pdf",
        "Patients Database Export",
        exportRows
      );
      toast.success("Database exported successfully");
    } catch (error) {
      console.error("Failed to export patient database:", error);
      toast.error("Failed to export database");
    }
  };

  const handleGenerateReports = () => {
    navigate("/patients?status=Diagnosed");
    toast("Open a patient from the diagnosed list to generate the full report.");
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-6 mb-8">
        <DiseaseDistributionCard includedStatuses={["Diagnosed", "In Progress"]} />

        {/* Quick Actions */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={handleAddPatient}
              className="cursor-pointer w-full py-3 bg-[#0a0e3f] text-white rounded-lg hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Add New Patient</span>
            </button>
            <button
              onClick={handleViewPatients}
              className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>View All Patients</span>
            </button>
            <button
              onClick={handleDiagnosisReports}
              className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2"
            >
              <Activity className="w-5 h-5" />
              <span>Diagnosis Reports</span>
            </button>
            <button
              onClick={handleDatabaseExport}
              className="cursor-pointer w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-300 flex items-center justify-center space-x-2"
            >
              <Database className="w-5 h-5" />
              <span>Database Export</span>
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
    </div>
  );
}
