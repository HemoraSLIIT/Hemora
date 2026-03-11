import DiseaseDistributionCard from "./DiseaseDistributionCard";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Activity, Database, ClipboardMinus } from "lucide-react";

export default function LabTechDashBody() {
  const navigate = useNavigate();

  const handleAddPatient = () => {
    navigate("/addpatient");
  };

  const handleViewPatients = () => {
    navigate("/patients");
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
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
