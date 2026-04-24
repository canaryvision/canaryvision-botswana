import React, { useEffect, useState } from "react";
import { FiSettings, FiArrowLeft, FiEdit2, FiTrash2 } from "react-icons/fi";
import { BsCircleFill } from "react-icons/bs";
import BGImage from "../../assets/bg image.jpg";
import { IoMdPersonAdd } from "react-icons/io";
import { SlFlag } from "react-icons/sl";
import AddEmployeeModal from "./AddEmployeeModal";
import { useNavigate } from "react-router-dom";
import MarkOffSiteModal from "./MarkOffSiteModal";
import { db } from "../../firebase/config";
import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { toast } from "react-toastify";

const EmployeePageSection: React.FC = () => {
  const [deleteEmp, setDeleteEmp] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [addEmployeeModal, setAddEmployeeModal] = useState(false);
  const [localEmployees, setLocalEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [offSiteModalOpen, setOffSiteModalOpen] = useState(false);
  const [editEmployee, setEditEmployee] = useState<any | null>(null);
  const [, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch employees with real-time synchronization
  useEffect(() => {
    setLoading(true);
    const q = collection(db, "employees");

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({
        firestoreId: doc.id,
        ...doc.data()
      }));
      setLocalEmployees(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Auto-revert Off-Site employees whose return date has passed
  useEffect(() => {
    const checkAndRevertOffSite = async () => {
      const today = new Date().toISOString().split("T")[0];

      const expiredEmployees = localEmployees.filter(
        (emp) =>
          emp.status === "Off-Site" &&
          emp.offSiteUntil &&
          emp.offSiteUntil < today, // strictly past dates only
      );

      if (expiredEmployees.length === 0) return;

      console.log(
        `Auto-reverted ${expiredEmployees.length} employee(s) to Active.`,
      );
    };

    checkAndRevertOffSite();
  }, [localEmployees]);

  const filteredEmployees = localEmployees.filter((emp) => {
    const matchesFilter =
      activeFilter === "All" ||
      (activeFilter === "Off-Site"
        ? emp.status === "Off-Site"
        : emp.status === activeFilter);
    const matchesSearch =
      emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const handleDeleteEmployee = async (id: string) => {
    try {
      await deleteDoc(doc(db, "employees", id));
      setDeleteEmp(null);
      toast.success("Employee removed successfully");
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error("Failed to remove employee");
    }
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col gap-8 p-10 bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url(${BGImage})`, backgroundSize: "cover" }}
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-6 pb-6">
        <div className="flex-1">
          <h1 className="text-[36px] font-normal leading-tight">
            Staff Management
          </h1>
          <p className="text-[#99A1AF] mt-1 mb-6 text-base">
            Manage employees, assign off-site status, and edit profile details.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {["All", "Active", "Out", "Off-Site"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-5 py-2 rounded-[10px] text-base font-normal transition-all ${activeFilter === tab
                    ? "bg-[#FCCA00] text-black border-[#FCCA00] shadow-[0_0_10px_#FCCA0050]"
                    : "bg-[#1E293980] text-[#99A1AF] hover:bg-[#FCCA00] hover:text-black"
                  }`}
              >
                {tab}
              </button>
            ))}
            <div className="relative flex items-center ml-0 md:ml-3 w-full md:w-[450px]">
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-[#1E293980] border border-[#364153] text-[#99A1AF] placeholder-[#717182] focus:outline-none focus:border-[#FCCA00] transition"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setAddEmployeeModal(true)}
            className="flex items-center gap-4 bg-[#FCCA00] hover:bg-[#FFD633] hover:scale-105 text-black font-normal px-5 h-9 rounded-md shadow-[0_0_12px_#FCCA0040] transition-all duration-300 ease-in-out cursor-pointer"
          >
            <IoMdPersonAdd size={16} /> Add Employee
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="flex items-center gap-4 bg-white text-black font-normal px-5 h-9 rounded-md hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
          >
            <FiSettings size={16} /> Settings
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-4 bg-white text-black px-5 h-9 rounded-md hover:scale-105 shadow-[0_0_12px_#FCCA0040] transition-all duration-300 ease-in-out cursor-pointer"
          >
            <FiArrowLeft size={16} /> Back to Dashboard
          </button>
        </div>
      </div>

      {/* Employee Cards */}
      {filteredEmployees.length === 0 ? (
        <div className="flex justify-center items-center h-[200px] text-[#99A1AF] text-lg">
          No staff were found or added.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredEmployees.map((emp, index) => (
            <div
              key={emp.firestoreId || index}
              className={`relative bg-linear-to-r from-[#101828F2] to-[#030712F2] rounded-2xl p-6 shadow-[0_4px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_20px_rgba(255,204,0,0.15)] transition-all duration-300 ease-in-out backdrop-blur-sm ${deleteEmp === emp.firestoreId
                  ? "border-2 border-[#FB2C3680]"
                  : "border border-[#1E2939]"
                }`}
            >
              {deleteEmp === emp.firestoreId ? (
                <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                  <div className="p-3 bg-red-500/10 rounded-full border border-red-600/50">
                    <FiTrash2 size={28} className="text-red-500" />
                  </div>
                  <h2 className="text-lg font-semibold">Remove Employee?</h2>
                  <p className="text-gray-400 text-sm">
                    Are you sure you want to remove{" "}
                    <span className="text-[#FCCA00] font-medium">
                      {emp.name}
                    </span>
                    ?
                  </p>
                  <div className="flex justify-center gap-4 mt-4 w-full">
                    <button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md transition font-medium"
                      onClick={() => handleDeleteEmployee(emp.firestoreId)}
                    >
                      Yes, Remove
                    </button>
                    <button
                      className="flex-1 bg-white text-black py-2 rounded-md border border-gray-200 hover:bg-gray-100 transition font-medium"
                      onClick={() => setDeleteEmp(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <button
                      className="p-2 rounded-md bg-[#1E293B]/60 hover:bg-[#273246] transition"
                      onClick={() => {
                        setEditEmployee(emp);
                        setAddEmployeeModal(true);
                      }}
                    >
                      <FiEdit2 size={14} className="text-gray-300" />
                    </button>
                    <button
                      className="p-2 rounded-md bg-[#1E293B]/60 hover:bg-[#4B1E1E]/80 transition"
                      onClick={() => setDeleteEmp(emp.firestoreId)}
                    >
                      <FiTrash2 size={14} className="text-red-400" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center mt-2">
                    <div
                      className={`w-24 h-24 rounded-full border-4 ${emp.photo
                          ? "border-[#FCCA00] shadow-[0_0_12px_#FCCA0040]"
                          : "border-[#3A3A3A] bg-[#0B1120]"
                        } overflow-hidden mb-4`}
                    >
                      {emp.photo ? (
                        <img
                          src={emp.photo}
                          alt={emp.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BsCircleFill className="text-[#FCCA00] w-full h-full" />
                      )}
                    </div>

                    <div className="space-y-3 flex flex-col items-center">
                      <h3 className="text-xl font-normal leading-5 capitalize">
                        {emp.name}
                      </h3>
                      <p className="text-[#99A1AF] text-sm leading-5 capitalize">
                        {emp.role}
                      </p>
                      <div
                        className={`px-3 py-[3px] text-xs font-medium rounded-lg flex items-center gap-2 w-fit ${emp.status === "Active"
                            ? "bg-linear-to-r from-green-500/30 to-green-600/30 text-green-300 border border-green-500/40"
                            : emp.status === "Out"
                              ? "bg-linear-to-r from-red-500/30 to-red-600/30 text-red-300 border border-red-500/40"
                              : "bg-linear-to-r from-gray-500/30 to-gray-600/30 text-gray-300 border border-gray-500/40"
                          }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${emp.status === "Active"
                              ? "bg-green-400"
                              : emp.status === "Out"
                                ? "bg-red-400"
                                : "bg-gray-400"
                            }`}
                        />
                        {emp.status}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[#1E2939] pt-4 text-sm text-gray-400 space-y-1">
                    <div className="flex justify-between">
                      <p className="text-gray-500">Employee ID:</p>
                      <p className="text-gray-300">{emp.employeeId}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-gray-500">Phone:</p>
                      <p className="text-gray-300">{emp.phone}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setOffSiteModalOpen(true);
                    }}
                    className={`mt-5 w-full flex items-center justify-center gap-4 border border-[#2A3244] font-normal rounded-md py-2 active:scale-[0.98] transition-all shadow-[0_2px_8px_rgba(255,255,255,0.05)] ${emp.status === "Off-Site"
                        ? "bg-[#FCCA00] text-black hover:bg-[#FFD633]"
                        : "bg-white text-black hover:bg-gray-100"
                      }`}
                  >
                    <SlFlag />
                    {emp.status === "Off-Site"
                      ? "Mark as Active"
                      : "Mark as Off-Site"}
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ✅ onSave just closes modal — modal handles its own Firestore write */}
      <MarkOffSiteModal
        isOpen={offSiteModalOpen}
        onClose={() => setOffSiteModalOpen(false)}
        employee={selectedEmployee}
        onSave={() => setOffSiteModalOpen(false)}
      />

      <AddEmployeeModal
        isOpen={addEmployeeModal}
        onClose={() => {
          setAddEmployeeModal(false);
          setEditEmployee(null);
        }}
        editData={editEmployee}
      />
    </div>
  );
};

export default EmployeePageSection;
