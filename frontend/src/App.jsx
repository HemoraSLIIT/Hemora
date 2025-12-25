import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddPatient from "./pages/AddPatient";
import Patients from "./pages/Patients";

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
