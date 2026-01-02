import React, { useState, useEffect } from "react";
import { userAPI } from "../services/api";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function ProfileForm({
  isEditing = false,
  initialData = null,
  onSuccess,
  onCancel,
  // Optional: parent can pass a handler to start editing
  onStartEdit, // added optional prop
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

  const navigate = useNavigate();

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

  // Only digits, max 10
  const handlePhoneChange = (e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
    setFormData((prev) => ({ ...prev, phoneNumber: digits }));
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

  // Validators (aligned with AddUser.jsx)
  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  const isValidName = (value) => /^[A-Za-z][A-Za-z\s\-']{1,49}$/.test(String(value).trim()); // 2-50 chars
  const isValidText = (value) => /^[A-Za-z0-9\s\-&().,]{2,100}$/.test(String(value).trim()); // 2-100 chars
  const isValidPhone = (value) => {
    // require exactly 10 digits
    const digits = String(value).replace(/\D/g, "");
    return /^\d{10}$/.test(digits);
  };
  const isValidLicense = (value) => /^[A-Za-z0-9\-]{4,50}$/.test(String(value).trim());

  // Add safe pattern constants for JSX pattern attributes (escape backslashes)
  const NAME_PATTERN = "^[A-Za-z][A-Za-z\\s\\-']{1,49}$";
  const TEXT_PATTERN = "^[A-Za-z0-9\\s&().,\\-]{2,100}$";
  const PHONE_PATTERN = "^[0-9]{10}$"; // exactly 10 digits
  const LICENSE_PATTERN = "^[A-Za-z0-9\\-]{4,50}$";

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Trim values first
    const role = initialData?.role;
    const email = formData.email.trim();
    const firstName = formData.firstName.trim();
    const lastName = formData.lastName.trim();
    const phoneNumber = formData.phoneNumber?.trim() || "";
    const specialization = formData.specialization?.trim() || "";
    const hospitalAffiliation = formData.hospitalAffiliation?.trim() || "";
    const medicalLicense = formData.medicalLicense?.trim() || "";

    // Email required + format
    if (!email) {
      toast.error("Email is required");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email address");
      return;
    }

    // First/Last Name required for all roles
    if (!firstName) {
      toast.error("First name is required");
      return;
    }
    if (!isValidName(firstName)) {
      toast.error("First name must be 2-50 letters (spaces/hyphens allowed)");
      return;
    }
    if (!lastName) {
      toast.error("Last name is required");
      return;
    }
    if (!isValidName(lastName)) {
      toast.error("Last name must be 2-50 letters (spaces/hyphens allowed)");
      return;
    }

    // Role-specific validations
    if (role === "Doctor") {
      if (!specialization) {
        toast.error("Specialization is required");
        return;
      }
      if (!isValidText(specialization)) {
        toast.error("Specialization must be 2-100 valid characters");
        return;
      }
      if (!hospitalAffiliation) {
        toast.error("Hospital affiliation is required");
        return;
      }
      if (!isValidText(hospitalAffiliation)) {
        toast.error("Hospital affiliation must be 2-100 valid characters");
        return;
      }
      if (!medicalLicense) {
        toast.error("Medical license number is required");
        return;
      }
      if (!isValidLicense(medicalLicense)) {
        toast.error("Medical license must be 4-50 letters/numbers/hyphens");
        return;
      }
    } else if (role === "Lab Technician") {
      if (!hospitalAffiliation) {
        toast.error("Hospital/Lab affiliation is required");
        return;
      }
      if (!isValidText(hospitalAffiliation)) {
        toast.error("Hospital/Lab affiliation must be 2-100 valid characters");
        return;
      }
    } else if (role === "Admin") {
      if (!hospitalAffiliation) {
        toast.error("Hospital/Organization affiliation is required");
        return;
      }
      if (!isValidText(hospitalAffiliation)) {
        toast.error("Hospital/Organization affiliation must be 2-100 valid characters");
        return;
      }
    }

    // Optional phone validation
    if (!isValidPhone(phoneNumber)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      // Build payload with trimmed values
      const payload = {
        email,
        firstName,
        lastName,
      };
      payload.phoneNumber = phoneNumber; // required: always include
      if (role === "Doctor") {
        payload.specialization = specialization;
        payload.hospitalAffiliation = hospitalAffiliation;
        payload.medicalLicense = medicalLicense;
      } else if (role === "Lab Technician" || role === "Admin") {
        payload.hospitalAffiliation = hospitalAffiliation;
      }

      await updateSelfProfile(payload);

      if (onSuccess) onSuccess({ ...initialData, ...payload });
      toast.success("Profile updated successfully!");
      navigate("/profile"); // redirect after successful edit
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
                  maxLength={50}
                  pattern={NAME_PATTERN}
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
                  maxLength={50}
                  pattern={NAME_PATTERN}
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
                  maxLength={100}
                  pattern={TEXT_PATTERN}
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
                  maxLength={100}
                  pattern={TEXT_PATTERN}
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
                  maxLength={50}
                  pattern={LICENSE_PATTERN}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  onInvalid={(e) => e.target.setCustomValidity("Enter exactly 10 digits")}
                  onInput={(e) => e.target.setCustomValidity("")}
                  disabled={!isEditing}
                  inputMode="numeric"
                  pattern={PHONE_PATTERN}
                  title="Enter exactly 10 digits"
                  required
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
                  maxLength={50}
                  pattern={NAME_PATTERN}
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
                  maxLength={50}
                  pattern={NAME_PATTERN}
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
                  maxLength={100}
                  pattern={TEXT_PATTERN}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  onInvalid={(e) => e.target.setCustomValidity("Enter exactly 10 digits")}
                  onInput={(e) => e.target.setCustomValidity("")}
                  disabled={!isEditing}
                  inputMode="numeric"
                  pattern={PHONE_PATTERN}
                  title="Enter exactly 10 digits"
                  required
                />
              </div>
            </div>
          </>
        );

      case "Admin":
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
                  maxLength={50}
                  pattern={NAME_PATTERN}
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
                  maxLength={50}
                  pattern={NAME_PATTERN}
                />
              </div>
            </div>

            {/* Phone & Hospital / Organization Affiliation in one row */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="tel"
                  name="phoneNumber"
                  placeholder="Enter 10-digit phone number"
                  value={formData.phoneNumber}
                  onChange={handlePhoneChange}
                  onInvalid={(e) => e.target.setCustomValidity("Enter exactly 10 digits")}
                  onInput={(e) => e.target.setCustomValidity("")}
                  disabled={!isEditing}
                  inputMode="numeric"
                  pattern={PHONE_PATTERN}
                  title="Enter exactly 10 digits"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Hospital / Organization Affiliation *
                </label>
                <input
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  type="text"
                  name="hospitalAffiliation"
                  placeholder="Enter hospital / organization affiliation"
                  value={formData.hospitalAffiliation}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                  maxLength={100}
                  pattern={TEXT_PATTERN}
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  const handleStartEdit = () => {
    // Prefer parent-controlled edit toggle if provided
    if (typeof onStartEdit === "function") {
      onStartEdit();
      return;
    }
    // Fallback: navigate to an edit route if your app uses one
    navigate("/profile/edit");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
     

      {/* Username & Email */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Username</label>
          <input
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed disabled:bg-gray-100 disabled:cursor-not-allowed"
            type="text"
            value={initialData?.username || ""}
            disabled
          />
          <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-900 mb-2">Email *</label>
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

      {/* Actions: Save / Cancel (no Change Password here while editing) */}
      {isEditing && (
        <div className="flex justify-end gap-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg shadow-sm hover:bg-gray-300 focus:outline-none"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm focus:outline-none ${
              loading ? "bg-[#0a0e3f]/60 text-white cursor-not-allowed" : "bg-[#0a0e3f] text-white hover:opacity-90"
            }`}
          >
            {loading ? "Saving..." : "Update Profile"}
          </button>
        </div>
      )}
    </form>
  );
}
