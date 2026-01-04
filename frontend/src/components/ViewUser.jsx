import React from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  GraduationCap,
  Award,
  Stethoscope,
  Shield,
  Calendar,
  UserRoundCheck,
  TrendingUp,
  Pencil,
} from "lucide-react";

export default function ViewUser({ isOpen, onClose, user }) {
  if (!isOpen || !user) return null;

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

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-1000"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-2">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserRoundCheck className="text-gray-900 w-6 h-6" />
              <h2 className="text-2xl font-semibold text-gray-900">
                User Details
              </h2>
            </div>
          </div>
          <button
            className="absolute top-4 right-4 p-1 bg-none border-none cursor-pointer text-gray-400 hover:text-gray-700 transition-colors duration-200 rounded hover:scale-110"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* User Info */}
        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="py-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-[#0a0e3f] rounded-full flex items-center justify-center">
                <span className="text-2xl text-white font-bold">
                  {(
                    user.firstName?.[0] ||
                    user.username?.[0] ||
                    "U"
                  ).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {user.fullName || user.username}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(
                    user.role
                  )}`}
                >
                  {user.role}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">
                  Username: <strong>{user.username}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">
                  Email: <strong>{user.email}</strong>
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
                  {user.firstName || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500 mb-1">Last Name</p>
                </div>
                <p className="text-sm font-medium text-gray-900">
                  {user.lastName || "N/A"}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Phone Number</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {user.phoneNumber || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Role-Specific Details */}
          {user.role === "Doctor" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Professional Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500">Medical License</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {user.medicalLicense || "N/A"}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500">Specialization</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {user.specialization || "N/A"}
                  </p>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 col-span-2">
                  <div className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      Hospital Affiliation
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-1">
                    {user.hospitalAffiliation || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {user.role === "Lab Technician" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Professional Information
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    Hospital / Lab Affiliation
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {user.hospitalAffiliation || "N/A"}
                </p>
              </div>
            </div>
          )}

          {user.role === "Admin" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Professional Information
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    Hospital / Lab Affiliation
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {user.hospitalAffiliation || "N/A"}
                </p>
              </div>
            </div>
          )}

          {user.role === "Researcher" && (
            <div>
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Professional Information
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">
                    University Affiliation
                  </p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {user.universityAffiliation || "N/A"}
                </p>
              </div>
            </div>
          )}

          {/* Status & Timestamps */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">
              Account Status
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Verification Status</p>
                </div>
                <p className="mt-1">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.isVerified
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {user.isVerified ? "Verified" : "Not Verified"}
                  </span>
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Account Status</p>
                </div>
                <p className="mt-1">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      user.isActive
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Created At</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatDate(user.createdAt)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <p className="text-xs text-gray-500">Last Updated</p>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-1">
                  {formatDate(user.updatedAt)}
                </p>
              </div>
            </div>
          </div>
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
