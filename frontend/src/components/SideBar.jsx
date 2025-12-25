import { useNavigate } from "react-router-dom";
import {
  Home,
  Bell,
  Calendar,
  Settings,
  Users,
  Activity,
  Database,
} from "lucide-react";
import HemNewLogo from "/assets/hemnewlogo3.svg";

export default function SideBar() {
  const navigate = useNavigate();

  const handleViewPatients = () => {
    navigate("/dashboard");
  };

  return (
    <div className="w-22 bg-[#0a0e3f] flex flex-col items-center py-6 space-y-0 rounded-tr-4xl rounded-br-4xl h-full">
      <div className="">
        <img src={HemNewLogo} alt="Logo" width={60} height={60} className="" />
      </div>
      <div className="flex flex-col items-center justify-center flex-1 space-y-8">
        <Home
          onClick={handleViewPatients}
          className="text-white w-6 h-6 cursor-pointer hover:scale-110"
        />
        <Bell className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
        <Users
          className="text-white w-6 h-6 cursor-pointer hover:scale-110"
          // onClick={handleViewPatients}
        />
        {/* <Activity className="text-white w-6 h-6 cursor-pointer hover:text-blue-300" /> */}
        <Calendar className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
        {/* <Database className="text-white w-6 h-6 cursor-pointer hover:text-blue-300" /> */}
        <Settings className="text-white w-6 h-6 cursor-pointer hover:scale-110" />
      </div>
    </div>
  );
}
