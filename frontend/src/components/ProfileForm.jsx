import React, { useState, useEffect } from "react";
import { userAPI } from "../services/api";
import toast from "react-hot-toast";

export default function ProfileForm({
  isEditing = false,
  initialData = null,
  onSuccess,
  onCancel,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    specialization: "",
    hospitalAffiliation: "",
    medicalLicense: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        email: initialData.email || "",
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        phoneNumber: initialData.phoneNumber || "",
        specialization: initialData.specialization || "",
        hospitalAffiliation: initialData.hospitalAffiliation || "",
        medicalLicense: initialData.medicalLicense || "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Prefer a dedicated self-update endpoint if available
  const updateSelfProfile = async (payload) => {
    if (typeof userAPI.updateCurrentUser === "function") {
      return await userAPI.updateCurrentUser(payload); // e.g. PATCH /api/me/
    }
    // Fallback to admin-style update for own id (works if backend permits)
    if (typeof userAPI.updateUser === "function" && initialData?.id) {
      return await userAPI.updateUser(initialData.id, payload); // PATCH /api/users/:id/
    }
    // Nothing configured
    throw new Error("Profile update endpoint is not configured in userAPI.");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate BEFORE loading
    if (!formData.email?.trim()) {
      toast.error("Email is required");
      return;
    }
    if (initialData?.role !== "Admin") {
      if (!formData.firstName?.trim()) {
        toast.error("First name is required");
        return;
      }
      if (!formData.lastName?.trim()) {
        toast.error("Last name is required");
        return;
      }
    }
    if (initialData?.role === "Doctor") {
      if (!formData.specialization?.trim()) {
        toast.error("Specialization is required");
        return;
      }
      if (!formData.hospitalAffiliation?.trim()) {
        toast.error("Hospital affiliation is required");
        return;
      }
      if (!formData.medicalLicense?.trim()) {
        toast.error("Medical license number is required");
        return;
      }
    } else if (initialData?.role === "Lab Technician") {
      if (!formData.hospitalAffiliation?.trim()) {
        toast.error("Hospital/Lab affiliation is required");
        return;
      }
    }

    setLoading(true);
    try {
      // Build payload (aligned with EditUser)
      const payload = { email: formData.email.trim() };
      if (initialData?.role !== "Admin") {
        payload.firstName = formData.firstName.trim();
        payload.lastName = formData.lastName.trim();
      }
      if (formData.phoneNumber?.trim()) {
        payload.phoneNumber = formData.phoneNumber.trim();
      }
      if (initialData?.role === "Doctor") {
        payload.specialization = formData.specialization.trim();
        payload.hospitalAffiliation = formData.hospitalAffiliation.trim();
        payload.medicalLicense = formData.medicalLicense.trim();
      } else if (initialData?.role === "Lab Technician") {
        payload.hospitalAffiliation = formData.hospitalAffiliation.trim();
      }

      // Deterministic self-update
      await updateSelfProfile(payload);

      if (onSuccess) onSuccess({ ...initialData, ...payload });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to save user:", error);
      const errorData = error?.response?.data;
      if (errorData) {
        const errorMessages = Object.entries(errorData)
          .map(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages.join(", ") : messages;
            return `${field}: ${msg}`;
          })
          .join("\n");
        toast.error(errorMessages || "Failed to update profile");
      } else {
        toast.error(error?.message || "Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const renderFormFields = () => {
    const role = initialData?.role;

    switch (role) {
      case "Doctor":
        return (
          <>
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  First Name *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Last Name *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            {/* Specialization & Hospital Affiliation */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Specialization *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="specialization"
                  placeholder="Enter specialization"
                  value={formData.specialization}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Hospital Affiliation *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="hospitalAffiliation"
                  placeholder="Enter hospital affiliation"
                  value={formData.hospitalAffiliation}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            {/* Medical License & Phone */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Medical License Number *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="medicalLicense"
                  placeholder="Enter medical license number"
                  value={formData.medicalLicense}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </>
        );

      case "Lab Technician":
        return (
          <>
            {/* First & Last Name */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  First Name *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Last Name *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            {/* Hospital Affiliation & Phone */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Hospital / Lab Affiliation *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="hospitalAffiliation"
                  placeholder="Enter hospital / lab affiliation"
                  value={formData.hospitalAffiliation}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter phone number"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </>
        );

      case "Admin":
        return (
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Phone
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                type="tel"
                name="phoneNumber"
                placeholder="Enter phone number"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Username & Email */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Username
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed disabled:bg-gray-100 disabled:cursor-not-allowed"
            type="text"
            value={initialData?.username || ""}
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">
            Email *
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            type="email"
            name="email"
            placeholder="Enter email"
            value={formData.email}
            onChange={handleChange}
            disabled={!isEditing}
            required
          />
        </div>
      </div>

      {/* Role-specific fields */}
      {renderFormFields()}

      {/* Submit and Cancel buttons */}
      {isEditing && (
        <div className="flex gap-4 mt-8">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-[#0a0e3f] text-white rounded-lg font-semibold hover:opacity-90 transition duration-300 cursor-pointer disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition duration-300 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </form>
  );
}
