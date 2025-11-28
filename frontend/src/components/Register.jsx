import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { VscEyeClosed, VscEye } from "react-icons/vsc";
import toast, { Toaster } from "react-hot-toast";
import LoginBgImg from "/assets/hemlog7.png";
import Loading from "./Loading";
import Footer from "./Footer";
import Header from "./Header";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [SignupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [passwordMatch, setPasswordMatch] = useState(false); // State to track if passwords match

  const handleLoginChange = (l) => {
    const { name, value } = l.target;
    setSignupData((SignupData) => {
      const updatedData = { ...SignupData, [name]: value };

      // Check if passwords match when confirmPassword is updated
      if (name === "confirmPassword" || name === "password") {
        setPasswordMatch(updatedData.password === updatedData.confirmPassword);
      }

      return updatedData;
    });
  };

  const SubmitRegistation = async (e) => {
    e.preventDefault();

    //Ensure the loading function happens while the registration happens
    setLoading(true);

    // Check if passwords match
    if (!passwordMatch) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:4800/api/auth/register",
        {
          name: SignupData.name,
          email: SignupData.email,
          password: SignupData.password,
        }
      );

      const { token, user } = response.data;

      // Store the token and role in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("name", user.name);
      localStorage.setItem("email", user.email);

      setTimeout(() => {
        //display the successfull message for account creation, as a toast message
        toast.success("Your account created successfully!");

        // Redirect based on the role
        setTimeout(() => {
          // switch (user.role) {
          //   case "admin":
          //     navigate("/admin-dashboard");
          //     break;
          //   case "customer":
          //     navigate("/user-content");
          //     break;
          //   default:
          //     break;
          // }
          navigate("/login"); // Redirect to login page after successful signup
        }, 2000);
      }, 1000);
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        toast.error(error.response.data.message); // Show backend error message
      } else {
        toast.error("Signup Failed. Please try again.");
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
                  name="name"
                  id="name"
                  placeholder="Name"
                  onChange={handleLoginChange}
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
                  className="block w-full mx-auto mt-2 h-12 outline-none border-2 border-gray-500 focus:border-[3px] focus:border-[#45607A] rounded-lg ps-5 text-bl2ck font-normal"
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
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="Confirm Password"
                  onChange={handleLoginChange}
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
