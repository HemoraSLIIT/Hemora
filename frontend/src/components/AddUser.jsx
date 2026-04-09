import React, { useState } from "react";
import { UserRoundPlus, X } from "lucide-react";
import { userAPI } from "../services/api";
import toast from "react-hot-toast";

export default function AddUser({ isOpen, onClose, onUserCreated }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    role: "Doctor",
    username: "",
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    confirmPassword: "",
    specialization: "",
    hospitalAffiliation: "",
    medicalLicense: "",
    phone: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Map backend field names to user-friendly labels
  const fieldLabels = {
    username: "Username",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    firstName: "First Name",
    lastName: "Last Name",
    role: "Role",
    specialization: "Specialization",
    hospitalAffiliation: "Hospital Affiliation",
    medicalLicense: "Medical License",
    universityAffiliation: "University Affiliation",
    phoneNumber: "Phone Number",
    non_field_errors: "Error",
    detail: "Error",
  };

  const formatBackendErrors = (errorData) => {
    return Object.entries(errorData)
      .map(([field, messages]) => {
        const label = fieldLabels[field] || field;
        const msg = Array.isArray(messages) ? messages.join(", ") : messages;
        return `${label}: ${msg}`;
      })
      .join(" | ");
  };

  const validateForm = () => {
    // Password length (Django MinimumLengthValidator requires 8)
    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return false;
    }

    // Password match
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match.");
      return false;
    }

    // Password not entirely numeric (Django NumericPasswordValidator)
    if (/^\d+$/.test(formData.password)) {
      toast.error("Password cannot be entirely numeric.");
      return false;
    }

    // Role-specific required fields
    if (formData.role === "Doctor") {
      if (!formData.specialization.trim()) {
        toast.error("Specialization is required for doctors.");
        return false;
      }
      if (!formData.hospitalAffiliation.trim()) {
        toast.error("Hospital affiliation is required for doctors.");
        return false;
      }
      if (!formData.medicalLicense.trim()) {
        toast.error("Medical license number is required for doctors.");
        return false;
      }
    } else if (formData.role === "Lab Technician" || formData.role === "Admin") {
      if (!formData.hospitalAffiliation.trim()) {
        toast.error("Hospital/Lab affiliation is required.");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        firstName: formData.firstName,
        lastName: formData.lastName,
      };

      // Add role-specific fields
      if (formData.role === "Doctor") {
        payload.specialization = formData.specialization;
        payload.hospitalAffiliation = formData.hospitalAffiliation;
        payload.medicalLicense = formData.medicalLicense;
      } else if (formData.role === "Lab Technician" || formData.role === "Admin") {
        payload.hospitalAffiliation = formData.hospitalAffiliation;
      }

      if (formData.phone) payload.phoneNumber = formData.phone;

      await userAPI.createUser(payload);
      toast.success("User created successfully!");

      setFormData({
        role: "Doctor",
        username: "",
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        confirmPassword: "",
        specialization: "",
        hospitalAffiliation: "",
        medicalLicense: "",
        phone: "",
      });

      if (onUserCreated) {
        onUserCreated();
      }

      onClose();
    } catch (error) {
      console.error("Failed to create user:", error.response?.data);
      const errorData = error.response?.data;
      if (errorData) {
        toast.error(formatBackendErrors(errorData) || "Failed to create user");
      } else {
        toast.error("Failed to create user. Check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const renderFormFields = () => {
    switch (formData.role) {
      case "Doctor":
        return (
          <>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Specialization <span className="text-red-500">*</span>
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
                  Hospital Affiliation <span className="text-red-500">*</span>
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
                  Medical License Number <span className="text-red-500">*</span>
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
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </>
        );

      case "Lab Technician":
        return (
          <>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Hospital / Lab Affiliation <span className="text-red-500">*</span>
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
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  type="tel"
                  name="phone"
                  placeholder="+94 7xxxxxxxx"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div> */}
          </>
        );

      case "Admin":
        return (
          <>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Hospital / Lab Affiliation <span className="text-red-500">*</span>
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
                  name="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-1000 mb-0"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-4xl h-60vh overflow-y-auto p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserRoundPlus className="text-gray-900 w-6 h-6" />
              <h2 className="text-2xl font-semibold text-gray-900">
                Add New User
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

        <form onSubmit={handleSubmit}>
          {/* Role */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-55 px-3 py-2 border border-gray-300 rounded-lg">
              {["Doctor", "Lab Technician", "Admin"].map((role) => (
                <label
                  key={role}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={formData.role === role}
                    onChange={handleChange}
                    className="h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-full border border-gray-400 checked:border-[#0a0e3f] checked:bg-[#0a0e3f] checked:shadow-[inset_0_0_0_3px_white] focus:outline-none focus:ring-0"
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>

          {/* Username & Email */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="text"
                name="username"
                placeholder="Enter username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* First & Last Name - Show for Doctor, Lab Technician, and Admin */}
          {formData.role !== "Researcher" && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  First Name <span className="text-red-500">*</span>
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
                  Last Name <span className="text-red-500">*</span>
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

          {/* Password */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="password"
                name="password"
                placeholder="••••••••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                type="password"
                name="confirmPassword"
                placeholder="••••••••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Dynamic fields based on role */}
          {renderFormFields()}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer"
          >
            {loading ? "Creating..." : "Add"}
          </button>
        </form>
      </div>
    </div>
  );
}
