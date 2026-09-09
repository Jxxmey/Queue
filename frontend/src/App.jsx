import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import IssueQueue from "./pages/IssueQueue";
import Cashier from "./pages/Cashier";
import Display from "./pages/Display";
import Error404 from "./pages/Error404";
import AdminQueue from "./pages/AdminQueue";
import TvDisplay from './pages/TvDisplay';
import SelectBranch from "./pages/SelectBranch";
import ManageOfficers from "./pages/ManageOfficers";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:queueNumber" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/sale" element={<IssueQueue />} />
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/display" element={<Display />} />
          <Route path="/admin" element={<AdminQueue />} />
          <Route path="/tv" element={<TvDisplay />} />
          <Route path="/select-branch" element={<SelectBranch />} />
          <Route path="/manage-officers" element={<ManageOfficers />} />
          <Route path="*" element={<Error404 />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;