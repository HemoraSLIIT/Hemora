import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VscEyeClosed, VscEye } from "react-icons/vsc";
import toast, { Toaster } from "react-hot-toast";
import LoginBgImg from "/assets/hemlog7.png";
import Loading from "./Loading";
import Footer from "./Footer";
import Header from "./Header";
import { authAPI } from "../services/api";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [SignupData, setSignupData] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
    password_confirm: "",
    role: "RESEARCHER", // Default role
  });
  const [passwordMatch, setPasswordMatch] = useState(false);

  const handleLoginChange = (l) => {
    const { name, value } = l.target;
    setSignupData((SignupData) => {
      const updatedData = { ...SignupData, [name]: value };

      // Check if passwords match
      if (name === "password_confirm" || name === "password") {
        setPasswordMatch(updatedData.password === updatedData.password_confirm);
      }

      return updatedData;
    });
  };

  const SubmitRegistation = async (e) => {
    e.preventDefault();

    setLoading(true);

    // Check if passwords match
    if (!passwordMatch) {
      setLoading(false);
      toast.error("Passwords do not match!");
      return;
    }

    try {
      // Register with Django JWT
      const response = await authAPI.register(SignupData);

      toast.success("Your account created successfully!");

      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
    } catch (error) {
      setLoading(false);
      if (error.response?.data) {
        const errors = error.response.data;
        // Display first error message
        const firstError = Object.values(errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : firstError);
      } else {
        toast.error("Registration Failed. Please try again.");
      }
      console.error(error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <>
      <div className="container mx-auto px-4 py-4">
        <Header />
      </div>
      <Toaster />
      <div className="flex justify-between container mx-auto px-4 py-0">
        {/* Background Image */}
        <div>
          <img
            src={LoginBgImg}
            alt="Background"
            width={600}
            height={600}
            className=""
          />
        </div>
        {/* Login Form */}
        <div className="w-2/5 my-auto">
          <div className="bg-white bg-opacity-30 border-2 border-gray-500 my-auto rounded-3xl p-5">
            <form className="p-10 font-bold" onSubmit={SubmitRegistation}>
              {/* <h1 className="flex justify-center -mt-8 mb-5 text-3xl text-center font-serif">
                Create Account
              </h1> */}
              <div className="my-10">
                <input
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Username"
                  onChange={handleLoginChange}
                  required
                  className="block w-full mx-auto mt-2 h-12 outline-none border-2 border-gray-500 focus:border-[3px] focus:border-[#45607A] rounded-lg ps-5 text-bl2ck font-normal"
                />
              </div>
              <div className="my-8">
                <input
                  type="text"
                  name="email"
                  id="email"
                  placeholder="Email"
                  onChange={handleLoginChange}
                  required
                  className="block w-full mx-auto mt-2 h-12 outline-none border-2 border-gray-500 focus:border-[3px] focus:border-[#45607A] rounded-lg ps-5 text-bl2ck font-normal"
                />
              </div>
              <div className="my-8 flex gap-4">
                <input
                  type="text"
                  name="first_name"
                  id="first_name"
                  placeholder="First Name"
                  onChange={handleLoginChange}
                  className="block w-1/2 mx-auto mt-2 h-12 outline-none border-2 border-gray-500 focus:border-[3px] focus:border-[#45607A] rounded-lg ps-5 text-bl2ck font-normal"
                />
                <input
                  type="text"
                  name="last_name"
                  id="last_name"
                  placeholder="Last Name"
                  onChange={handleLoginChange}
                  className="block w-1/2 mx-auto mt-2 h-12 outline-none border-2 border-gray-500 focus:border-[3px] focus:border-[#45607A] rounded-lg ps-5 text-bl2ck font-normal"
                />
              </div>
              <div className="mb-5 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder="Password"
                  onChange={handleLoginChange}
                  className="block w-full mx-auto mt-2 h-12 outline-none border-2 border-gray-500 focus:border-[3px] focus:border-[#45607A] rounded-lg ps-5 text-bl2ck font-normal"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-5 flex items-center text-[#45607A] hover:text-[#2b3d4e] focus:outline-none"
                >
                  {showPassword ? (
                    <VscEyeClosed size={25} />
                  ) : (
                    <VscEye size={25} />
                  )}
                </button>
              </div>
              <div className="mb-5 relative">
                <input
                  type="password"
                  name="password_confirm"
                  id="password_confirm"
                  placeholder="Confirm Password"
                  onChange={handleLoginChange}
                  required
                  className={`block w-full mx-auto mt-2 h-12 outline-none border-2 ${
                    passwordMatch
                      ? "border-green-500 focus:border-green-500"
                      : "border-gray-500 focus:border-red-500"
                  } focus:border-[3px] rounded-lg ps-5 text-bl2ck font-normal`}
                />
                {passwordMatch && (
                  <p className="text-green-500 text-sm mt-1">
                    Passwords match!
                  </p>
                )}
              </div>
              <div className="flex justify-center">
                <button className="w-full h-12 text-xl mt-5 py-2 px-10 rounded-lg text-white duration-300 bg-[#45607A] hover:ring-1 hover:bg-[#2b3d4e] ring-[#45607A]">
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <Loading />
                    </div>
                  ) : (
                    "Sign Up"
                  )}
                </button>
              </div>
              <p className="font-normal text-gray-600 flex justify-center items-center mt-2">
                Already have an Account?
                <a
                  href="/login"
                  className="text-[#2b3d4e] font-semibold ml-1 hover:text-[#2b3d4e]"
                >
                  Log In
                </a>
              </p>
            </form>
          </div>
        </div>
        {/* <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex flex-col items-center text-gray-500">
                    <p>[2025/FEB] Y3S2 - Application Frameworks module project. </p>
                </div> */}
      </div>
      <Footer />
    </>
  );
}
