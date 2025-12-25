import Login from "./components/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import AddPatient from "./components/AddPatient";
import Patients from "./components/Patients";
import ResearcherDashboard from "./components/ResearcherDashboard";
import DoctorDashboard from "./components/DoctorDashboard";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/addpatient" element={<AddPatient />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/researcher-dashboard" element={<ResearcherDashboard/>} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard/>} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
