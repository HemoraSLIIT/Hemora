import React from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/");
  };

  return (
    <header
      className="flex justify-between items-center cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-center">
        <h1 className="text-2xl font-bold">
          <span className="text-[#45607A]">HEMORA</span>
          {/* <span className="text-white bg-[#f08116]">dies</span> */}
        </h1>
      </div>
    </header>
  );
}
