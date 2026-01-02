import React, { useState, useEffect } from "react";
import { X, UserRoundPen } from "lucide-react";
import { userAPI } from "../services/api";
import toast from "react-hot-toast";

export default function EditUser({ isOpen, onClose, user, onUserUpdated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    specialization: "",
    hospitalAffiliation: "",
    universityAffiliation: "",
    medicalLicense: "",
    password: "",
  });

  // Populate form when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || "",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phoneNumber: user.phoneNumber || "",
        specialization: user.specialization || "",
        hospitalAffiliation: user.hospitalAffiliation || "",
        universityAffiliation: user.universityAffiliation || "",
        medicalLicense: user.medicalLicense || "",
        password: "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build payload - only include fields that have values
      const payload = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      // Add optional fields if they have values
      if (formData.phoneNumber) payload.phoneNumber = formData.phoneNumber;
      if (formData.password) payload.password = formData.password;

      // Add role-specific fields
      if (user.role === "Doctor") {
        payload.specialization = formData.specialization;
        payload.hospitalAffiliation = formData.hospitalAffiliation;
        payload.medicalLicense = formData.medicalLicense;
      } else if (user.role === "Lab Technician") {
        payload.hospitalAffiliation = formData.hospitalAffiliation;
      } else if (user.role === "Admin") {
        payload.hospitalAffiliation = formData.hospitalAffiliation;
      } else if (user.role === "Researcher") {
        payload.universityAffiliation = formData.universityAffiliation;
      }

      await userAPI.updateUser(user.id, payload);
      toast.success("User updated successfully!");

      // Notify parent to refresh user list
      if (onUserUpdated) {
        onUserUpdated();
      }

      onClose();
    } catch (error) {
      console.error("Failed to update user:", error);
      const errorData = error.response?.data;
      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(
            ([field, messages]) =>
              `${field}: ${
                Array.isArray(messages) ? messages.join(", ") : messages
              }`
          )
          .join("\n");
        toast.error(errorMessages || "Failed to update user");
      } else {
        toast.error("Failed to update user");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user) return null;

  const renderRoleSpecificFields = () => {
    switch (user.role) {
      case "Doctor":
        return (
          <>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Specialization *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  name="specialization"
                  placeholder="Enter specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Hospital Affiliation *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  name="hospitalAffiliation"
                  placeholder="Enter hospital affiliation"
                  value={formData.hospitalAffiliation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Medical License Number *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  name="medicalLicense"
                  placeholder="Enter medical license number"
                  value={formData.medicalLicense}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          </>
        );

      case "Lab Technician":
        return (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Hospital / Lab Affiliation *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="text"
                name="hospitalAffiliation"
                placeholder="Enter hospital / lab affiliation"
                value={formData.hospitalAffiliation}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="tel"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>
        );

      case "Researcher":
        return (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                University Affiliation *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="text"
                name="universityAffiliation"
                placeholder="Enter university affiliation"
                value={formData.universityAffiliation}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="tel"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>
        );

      case "Admin":
        return (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Hospital / Lab Affiliation *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="text"
                name="hospitalAffiliation"
                placeholder="Enter hospital / lab affiliation"
                value={formData.hospitalAffiliation}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="tel"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserRoundPen className="text-gray-900 w-6 h-6" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Edit User
              </h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Editing: {user.fullName || user.username} ({user.role})
            </p>
          </div>
          <button
            className="absolute top-4 right-4 p-1 bg-none border-none cursor-pointer text-gray-400 hover:text-gray-700 transition-colors duration-200 rounded hover:scale-110"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username (Read-only) & Email */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Username
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
                type="text"
                value={user.username}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Username cannot be changed
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email *
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* First & Last Name - Show for Doctor, Lab Technician, and Admin */}
          {user.role !== "Researcher" && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  First Name *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Last Name *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          )}

          {/* Role-specific fields */}
          {renderRoleSpecificFields()}

          {/* Password (Optional) */}
          {/* <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              New Password (Optional)
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
              type="password"
              name="password"
              placeholder="Leave blank to keep current password"
              value={formData.password}
              onChange={handleChange}
            />
            <p className="text-xs text-gray-500 mt-1">
              Only fill this if you want to change the password
            </p>
          </div> */}

          {/* Buttons */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition duration-300 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
