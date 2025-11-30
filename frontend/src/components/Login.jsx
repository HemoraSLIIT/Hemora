import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { VscEyeClosed, VscEye } from "react-icons/vsc";
import toast, { Toaster } from "react-hot-toast";
import LoginBgImg from "/assets/hemlog7.png";
import Loading from "./Loading";
import Footer from "./Footer";
import Header from "./Header";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [logindata, setlogindata] = useState({
    email: "",
    password: "",
  });

  const handleLoginChange = (l) => {
    const { name, value } = l.target;
    setlogindata((logindata) => ({
      ...logindata,
      [name]: value,
    }));
  };

  const SubmitLogin = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:4800/api/auth/login",
        logindata
      );

      const { token, user } = response.data;

      console.log("The JWT token is: ", token);
      console.log("The user data is: ", user);

      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("email", user.email);
      localStorage.setItem("id", user.id);

      toast.success("Login Successful!");

      setTimeout(() => {
        switch (user.role) {
          case "admin":
            navigate("/admin-dashboard");
            break;
          case "customer":
            navigate("/customer-dashboard");
            break;
          case "restaurant":
            navigate("/restaurant-admin-dashboard");
            break;
          case "delivery":
            navigate("/delivery-personnel-dashboard");
            break;
          default:
            toast.error("Unauthorized role!");
            break;
        }
      }, 2000);
    } catch (error) {
      toast.error("Login Failed. Invalid credentials!");
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
        <div>
          <img
            src={LoginBgImg}
            alt="Background"
            width={600}
            height={600}
            className=""
          />
        </div>
        <div className="w-2/5 my-auto">
          <div className="bg-white bg-opacity-30 border-2 border-gray-500 my-auto rounded-3xl p-5">
            <form className="p-10 font-bold" onSubmit={SubmitLogin}>
              <div className="my-10">
                <input
                  type="text"
                  name="email"
                  id="email"
                  placeholder="Email"
                  onChange={handleLoginChange}
                  className="block w-full mx-auto mt-2 h-12 outline-none border-2 border-gray-500 focus:border-[3px] focus:border-[#45607A] rounded-lg  ps-5 text-bl2ck font-normal"
                />
              </div>
              <div className="mb-5 relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  id="password"
                  placeholder="Password"
                  onChange={handleLoginChange}
                  className="block w-full mx-auto mt-2 h-12 outline-none border-2 border-gray-500 focus:border-[3px] focus:border-[#45607A] rounded-lg  ps-5 text-bl2ck font-normal"
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
              <div className="flex justify-center">
                <button className="w-full h-12 text-xl mt-5 py-2 px-10 rounded-lg text-white duration-300 bg-[#45607A] hover:ring-1 hover:bg-[#2b3d4e] ring-[#45607A]">
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <Loading />
                    </div>
                  ) : (
                    "Log In"
                  )}
                </button>
              </div>
              <p className="font-normal text-gray-600 flex justify-center items-center mt-2">
                Don't have an account yet?
                <a
                  href="/"
                  className="text-[#2b3d4e] font-semibold ml-1 hover:text-[#2b3d4e]"
                >
                  Create Account
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
