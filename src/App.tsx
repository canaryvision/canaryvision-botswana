import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { WebSocketProvider } from "./context/WebSocketContext";
import HomePage from "./pages/HomePage";
import EmployeePage from "./pages/EmployeePage";
import SettingPage from "./pages/SettingPage";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import WelcomePage from "./pages/WelcomePage";
import EmployeeHistoryPage from "./pages/EmployeeHistoryPage";
// import ShopManagementPage from "./pages/ShopManagementPage";
import ShopLoginPage from "./pages/ShopLoginPage";
import ProtectedRoute from "./components/ProtectedRoute";
 
function App() {
  return (
    <WebSocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/shop-login" element={<ShopLoginPage />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard/:shopId?" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/employees/:shopId?" element={<ProtectedRoute><EmployeePage /></ProtectedRoute>} />
          <Route path="/settings/:shopId?" element={<ProtectedRoute><SettingPage /></ProtectedRoute>} />
          <Route path="/employee-history/:shopId?" element={<ProtectedRoute><EmployeeHistoryPage /></ProtectedRoute>} />
        </Routes>

        {/* ✅ Global Toast Container */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnHover
          draggable
          theme="light"
        />
      </Router>
    </WebSocketProvider>
  );
}

export default App;
