import React, { useState } from "react";
import { UserRoundPlus } from "lucide-react";
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Build payload with camelCase field names matching backend
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
      };

      // Add role-specific fields
      if (formData.role === "Doctor") {
        payload.firstName = formData.firstName;
        payload.lastName = formData.lastName;
        payload.specialization = formData.specialization;
        payload.hospitalAffiliation = formData.hospitalAffiliation;
        payload.medicalLicense = formData.medicalLicense;
        if (formData.phone) payload.phoneNumber = formData.phone;
      } else if (formData.role === "Lab Technician") {
        payload.firstName = formData.firstName;
        payload.lastName = formData.lastName;
        payload.hospitalAffiliation = formData.hospitalAffiliation;
        if (formData.phone) payload.phoneNumber = formData.phone;
      } else if (formData.role === "Admin") {
        // Admin only needs username, email, password (already added above)
        if (formData.phone) payload.phoneNumber = formData.phone;
      }

      await userAPI.createUser(payload);
      toast.success("User created successfully!");
      
      // Reset form
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

      // Notify parent to refresh user list
      if (onUserCreated) {
        onUserCreated();
      }
      
      onClose();
    } catch (error) {
      console.error("Failed to create user:", error);
      const errorData = error.response?.data;
      if (errorData) {
        // Show specific field errors
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
          .join("\n");
        toast.error(errorMessages || "Failed to create user");
      } else {
        toast.error("Failed to create user");
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Specialization *</label>
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Hospital Affiliation *</label>
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Medical License Number *</label>
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Hospital / Lab Affiliation *</label>
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
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
    <div className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-1000 mb-0" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-lg w-4xl h-60vh overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <UserRoundPlus className="text-gray-900 w-6 h-6" />
              <h2 className="text-2xl font-semibold text-gray-900">Add New User</h2>
            </div>
          </div>
          <button className="bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-gray-900" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Role */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">Role *</label>
            <div className="grid grid-cols-3 gap-55 px-3 py-2 border border-gray-300 rounded-lg">
              {["Doctor", "Lab Technician", "Admin"].map(
                (role) => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="role"
                      value={role}
                      checked={formData.role === role}
                      onChange={handleChange}
                    />
                    {role}
                  </label>
                )
              )}
            </div>
          </div>

          {/* Username & Email */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Username *</label>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
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

          {/* First & Last Name - Only show for Doctor and Lab Technician */}
          {formData.role !== "Admin" && (
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">First Name *</label>
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
                <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name *</label>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Password *</label>
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
              <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password *</label>
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