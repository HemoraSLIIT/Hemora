import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Activity, Database, ClipboardMinus } from "lucide-react";

export default function DocDashBody() {
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

  const handleAddPatient = () => {
    navigate("/addpatient");
  };

  const handleViewPatients = () => {
    navigate("/patients");
  };
  return (
    <div>
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
            <h3 className="text-lg font-bold text-[#A6A6A6] mb-4">See all</h3>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleAddPatient}
              className="cursor-pointer w-full h-21 py-3 bg-[#EEEFF1] text-gray-700 rounded-lg hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
            ></button>
            <button
              onClick={handleAddPatient}
              className="cursor-pointer w-full h-21 py-3 bg-[#EEEFF1] text-gray-700 rounded-lg hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
            ></button>
            <button
              onClick={handleAddPatient}
              className="cursor-pointer w-full h-21 py-3 bg-[#EEEFF1] text-gray-700 rounded-lg hover:opacity-90 transition duration-300 flex items-center justify-center space-x-2"
            ></button>
          </div>
        </div>
      </div>
    </div>
  );
}
