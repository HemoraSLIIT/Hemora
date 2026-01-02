import { BrowserRouter, Routes, Route } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AddPatient from "./pages/AddPatient";
import Patients from "./pages/Patients";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import ViewResults from "./pages/ViewResults";

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
          <Route path="/users" element={<Users />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/view-results" element={<ViewResults />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
