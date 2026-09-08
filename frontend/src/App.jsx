import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import IssueQueue from "./pages/IssueQueue";
import Cashier from "./pages/Cashier";
import Display from "./pages/Display";
import Error404 from "./pages/Error404";

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
          <Route path="*" element={<Error404 />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;