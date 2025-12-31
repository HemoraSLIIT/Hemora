import React from "react";
import {
  X,
  User,
  Droplet,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertCircle,
  Pill,
  FileText,
  Stethoscope,
  UserRoundCheck,
  Pencil,
  CalendarFold,
  BookCheck,
  Mars,
} from "lucide-react";

export default function ViewPatient({ isOpen, onClose, patient }) {
  if (!isOpen || !patient) return null;

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
    <div
      className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-1000"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserRoundCheck className="text-gray-900 w-6 h-6" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Patient Details
              </h2>
            </div>
          </div>
          <button
            className="bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-gray-900"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Patient Info */}
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-gray-50 rounded-lg py-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#0a0e3f] rounded-full flex items-center justify-center">
                <span className="text-2xl text-white font-bold">
                  {(patient.name?.[0] || "P").toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {patient.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    patient.status
                  )}`}
                >
                  {patient.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  Patient ID: <strong>{patient.id}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  Date Added: <strong>{patient.dateAdded}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500 mb-1">First Name</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {patient.firstName || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500 mb-1">Last Name</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {patient.lastName || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <BookCheck className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500 mb-1">Age</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {patient.age || "N/A"} years
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Mars className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500 mb-1">Gender</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {patient.gender || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <CalendarFold className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500 mb-1">Date of Birth</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {patient.dateOfBirth || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Droplet className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Blood Group</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.bloodGroup || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Phone Number</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.phone || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Email</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.email || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Address</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.address || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Emergency Contact
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    Emergency Contact Name
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.emergencyContact || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Emergency Phone</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.emergencyPhone || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Medical History */}
          {/* <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Medical Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Medical History</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.medicalHistory || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Symptoms</p>
                <p className="text-sm font-medium text-gray-900">
                  {patient.symptoms || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Current Medications</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.currentMedications || "N/A"}
                </p>
              </div>
            </div>
          </div> */}

          {/* Clinical Assessment */}
          {/* <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Clinical Assessment
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Referring Doctor</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {patient.referringDoctor || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-500 mb-1">Suspected Disease</p>
                <p className="text-sm font-medium text-gray-900">
                  {patient.suspectedDisease || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2">
                <p className="text-xs text-gray-500 mb-1">Confirmed Disease</p>
                <p className="text-sm font-medium text-gray-900">
                  {patient.disease || "N/A"}
                </p>
              </div>
            </div>
          </div> */}

          {/* Date and Status Info */}
          {/* <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-xs text-gray-500">Date Registered</p>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {patient.dateAdded || "N/A"}
              </p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-500 mb-1">Patient Status</p>
              <p className="mt-1">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                    patient.status
                  )}`}
                >
                  {patient.status}
                </span>
              </p>
            </div>
          </div> */}
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition duration-300 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
