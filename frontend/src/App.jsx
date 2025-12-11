import Login from "./components/Login";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import AddPatient from "./components/AddPatient";
import Patients from "./components/Patients";

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
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
