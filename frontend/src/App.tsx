import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { DashboardPage } from "./pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="assets" element={<div className="p-4">Assets Page Placeholder</div>} />
          <Route path="bookings" element={<div className="p-4">Bookings Page Placeholder</div>} />
          <Route path="maintenance" element={<div className="p-4">Maintenance Page Placeholder</div>} />
          <Route path="users" element={<div className="p-4">Users Page Placeholder</div>} />
          <Route path="settings" element={<div className="p-4">Settings Page Placeholder</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
