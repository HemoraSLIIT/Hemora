import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { userAPI } from "../services/api";

export default function AddUser({ isOpen, onClose, mode = "add", userId = null, userData = null, onSuccess }) {
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

  const [loading, setLoading] = useState(false);
  const [fetchingUserData, setFetchingUserData] = useState(false);

  // Prefill form when editing
  useEffect(() => {
    if (mode === "edit" && isOpen) {
      if (userData) {
        // If user data is passed as prop, use it
        prefillForm(userData);
      } else if (userId) {
        // Otherwise fetch user data
        fetchUserForEdit(userId);
      }
    } else if (mode === "add" && isOpen) {
      // Reset form for add mode
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
    }
  }, [mode, isOpen, userId, userData]);

  const prefillForm = (user) => {
    setFormData({
      role: user.role || "Doctor",
      username: user.username || "",
      email: user.email || "",
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      password: "",
      confirmPassword: "",
      specialization: user.specialization || "",
      hospitalAffiliation: user.hospitalAffiliation || "",
      medicalLicense: user.medicalLicense || "",
      phone: user.phone || "",
    });
  };

  const fetchUserForEdit = async (id) => {
    setFetchingUserData(true);
    try {
      const user = await userAPI.getUserById(id);
      prefillForm(user);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      toast.error("Failed to load user data");
    } finally {
      setFetchingUserData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (mode === "add" && (!formData.password || !formData.confirmPassword)) {
      toast.error("Password fields are required");
      return;
    }

    if (mode === "add" && formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      if (mode === "add") {
        await userAPI.createUser(formData);
        toast.success("User created successfully");
      } else if (mode === "edit") {
        // For edit, exclude password fields if empty
        const updatePayload = { ...formData };
        if (!updatePayload.password) {
          delete updatePayload.password;
          delete updatePayload.confirmPassword;
        }
        await userAPI.updateUser(userId, updatePayload);
        toast.success("User updated successfully");
      }
      
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error(error.message || "Failed to save user");
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
          </>
        );

      case "Admin":
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
          </>
        );

      default:
        return null;
    }
  };

  const isEditMode = mode === "edit";
  const title = isEditMode ? "👤 Edit Profile" : "👤 Add New User";
  const submitButtonText = isEditMode ? "Update Profile" : "Add";

  return (
    <div className="fixed inset-0 bg-[#000000b4] flex items-center justify-center z-1000 mb-0" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-4xl h-60vh overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
          <button className="bg-none border-none text-2xl cursor-pointer text-gray-600 hover:text-gray-900" onClick={onClose}>✕</button>
        </div>

        {fetchingUserData ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-gray-600">Loading user data...</p>
          </div>
        ) : (
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
                        disabled={isEditMode}
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
                  disabled={isEditMode}
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

            {/* First & Last Name */}
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

            {/* Password - only show in add mode */}
            {!isEditMode && (
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
            )}

            {/* Password - optional in edit mode */}
            {isEditMode && (
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">New Password (leave empty to keep current)</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    type="password"
                    name="password"
                    placeholder="••••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Confirm Password</label>
                  <input
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                    type="password"
                    name="confirmPassword"
                    placeholder="••••••••••••••"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}

            {/* Dynamic fields based on role */}
            {renderFormFields()}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Processing..." : submitButtonText}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}