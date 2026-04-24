import React, { useEffect, useState } from "react";
import BGImage from "../../assets/bg image.jpg";
import { FiCalendar, FiAlertTriangle, FiClock, FiUserCheck, } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { AiOutlineFolderView } from "react-icons/ai";
import FrameViewModal from "../employee/FrameViewModal";
import EmployeeAlertModal from "../modal/EmployeeAlertModal";
import { useRealtimeData } from "../../hooks/useRealtimeData";

// ── Helpers ───────────────────────────────────────────────────────────────────

const toSeconds = (t: string): number => {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  const [h, m] = parts;
  return h * 3600 + m * 60;
};

const formatDuration = (totalSeconds: number): string => {
  if (totalSeconds <= 0) return "0s";
  if (totalSeconds < 60) return `${totalSeconds}s`;
  if (totalSeconds < 3600) {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (m === 0 && s === 0) return `${h}h`;
  if (s === 0) return `${h}h ${m}m`;
  return `${h}h ${m}m ${s}s`;
};

// ── Component ─────────────────────────────────────────────────────────────────
const HomePageSection: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertEmployees] = useState<any[]>([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shopName] = useState<string>("CanaryVision");
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const updateDateTime = () => {
      const date = new Date();
      setCurrentDateTime(date.toLocaleTimeString());
    };
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000);
    return () => clearInterval(intervalId);
  }, []);

  const { data: firestoreData, loading: firestoreLoading } = useRealtimeData(selectedDate);

  useEffect(() => {
    const updateTracker = () => {
      const now = new Date();
      const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

      const sourceData = firestoreData || {};
      const parsed: any[] = Object.entries(sourceData).map(([boxKey, data]: [string, any]) => {
        // Handle both Array and Object (Map) structures from Firestore
        const presenceRaw = data.operator_presence || [];
        const intervals = Array.isArray(presenceRaw)
          ? presenceRaw
          : Object.values(presenceRaw).sort((a: any, b: any) => (a.checkin || '').localeCompare(b.checkin || ''));

        const lastInterval = intervals[intervals.length - 1];

        // Status is active if operator_status is true OR if there is no checkout field in the latest interval
        const status = lastInterval?.operator_status === true || (!!lastInterval?.checkin && !lastInterval?.checkout);

        const eyeStatus = data.eyes_status?.trim() === "open";

        let totalSecs = 0;
        intervals.forEach((iv: any) => {
          if (iv.checkin && iv.checkout) {
            totalSecs += (toSeconds(iv.checkout) - toSeconds(iv.checkin));
          } else if (iv.checkin && !iv.checkout && status) {
            const startSecs = toSeconds(iv.checkin);
            if (nowSecs > startSecs) {
              totalSecs += (nowSecs - startSecs);
            }
          }
        });

        // Presence Alert Logic: If currently Absent, check how long since last checkout
        let presenceAlert = false;
        if (!status && lastInterval?.checkout) {
          const outSince = toSeconds(lastInterval.checkout);
          if (nowSecs - outSince > 300) { // 5 minutes
            presenceAlert = true;
          }
        }

        // Calculate Eye Closed Duration from eyes_data
        const eyeIntervals = data.eyes_data || [];
        let eyeClosedSecs = 0;
        let eyeAlert = false;
        eyeIntervals.forEach((iv: any) => {
          if (iv.close && iv.open) {
            eyeClosedSecs += (toSeconds(iv.open) - toSeconds(iv.close));
          } else if (iv.close && !iv.open && !eyeStatus) {
            // Currently CLOSED - count live
            const startSecs = toSeconds(iv.close);
            if (nowSecs > startSecs) {
              const currentClosed = nowSecs - startSecs;
              eyeClosedSecs += currentClosed;
              if (currentClosed > 300) eyeAlert = true; // 5 mins alert
            }
          }
        });

        return {
          id: boxKey,
          name: boxKey.replace(/_/g, ' ').toUpperCase(), // Format cam1_box1 to CAM1 BOX1
          status: status,
          eyeStatus: eyeStatus,
          lastOut: lastInterval?.checkout || lastInterval?.checkin || "—",
          duration: formatDuration(totalSecs),
          eyeDuration: formatDuration(eyeClosedSecs),
          alert: presenceAlert || eyeAlert,
          intervals: intervals
        };
      });
      setEmployees(parsed);
      setLoading(firestoreLoading);
    };

    updateTracker(); // initial run
    const intervalId = setInterval(updateTracker, 1000);
    return () => clearInterval(intervalId);
  }, [firestoreData, firestoreLoading]);


  return (
    <div
      className="min-h-screen text-white flex justify-center p-4 sm:p-6 lg:p-10 bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url(${BGImage})`, backgroundSize: "cover" }}
    >
      <div className="w-full max-w-full lg:max-w-[90%] mx-auto flex flex-col gap-6 sm:gap-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-normal leading-tight">
              {shopName} - Outing Tracker
            </h1>
            <p className="text-[#99A1AF] text-sm sm:text-base">
              Real-time staff movement and outing duration tracking.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="border-2 border-[#FDC500] bg-white rounded-md flex items-center px-2 py-1 gap-2 transition duration-500 hover:scale-105 w-full sm:w-auto justify-center">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm text-black font-medium cursor-pointer outline-none border-none"
              />
              <div className="w-px h-4 bg-gray-300 mx-1" />
              <span className="text-sm text-black font-medium min-w-[80px] text-center">
                {currentDateTime}
              </span>
            </div>
            <button
              onClick={() => navigate("/employee-history")}
              className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-[#FDC500] transition text-sm w-full sm:w-auto"
            >
              <FiCalendar /> Weekly History
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-[#FDC500] transition text-sm w-full sm:w-auto"
            >
              <AiOutlineFolderView /> Live Feed
            </button>
            <button
              onClick={() => navigate("/employees")}
              className="bg-[#FDC500] text-black font-bold px-5 py-2 rounded-md hover:scale-105 transition shadow-[0_0_15px_rgba(253,197,0,0.4)] text-sm w-full sm:w-auto"
            >
              Employees
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-linear-to-br from-[#101828F2] to-[#030712F2] border-2 border-[#FDC500] rounded-2xl shadow-[0px_10px_40px_0px_#FDC50026] overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-[200px] text-[#FDC500] animate-pulse text-sm">
              Loading tracker data...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-[#10182880] text-[#99A1AF] border-b border-[#1E2939]">
                    <th className="px-6 py-5 text-xs font-medium uppercase tracking-wide">Box</th>
                    <th className="px-6 py-5 text-xs font-medium uppercase tracking-wide">Operator Status</th>
                    <th className="px-6 py-5 text-xs font-medium uppercase tracking-wide">Eye Status</th>
                    <th className="px-6 py-5 text-xs font-medium uppercase tracking-wide">Last Out</th>
                    <th className="px-6 py-5 text-xs font-medium uppercase tracking-wide">Duration</th>
                    <th className="px-6 py-5 text-xs font-medium uppercase tracking-wide">Closed Duration</th>
                    <th className="px-6 py-5 text-xs font-medium uppercase tracking-wide">Alert</th>
                    <th className="px-6 py-5" />
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <React.Fragment key={emp.id}>
                      <tr
                        onClick={() => navigate(`/box/${emp.id}`)}
                        className="border-b border-[#1E293B]/60 cursor-pointer transition-colors duration-150 hover:bg-[#1B2333]"
                      >
                        <td className="px-6 py-4 text-sm font-semibold text-white">
                          {emp.name}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${emp.status ? 'bg-green-500/15 text-green-400 border border-green-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.status ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                            {emp.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${emp.eyeStatus ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${emp.eyeStatus ? 'bg-blue-400 shadow-[0_0_8px_#3b82f6]' : 'bg-gray-400'}`} />
                            {emp.eyeStatus ? 'Open' : 'Closed'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#99A1AF] font-mono">
                          {emp.lastOut}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${emp.status ? 'text-green-300' : 'text-red-400'}`}>
                            {emp.duration}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm font-semibold ${emp.eyeStatus ? 'text-blue-300' : 'text-gray-500'}`}>
                            {emp.eyeDuration}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {emp.alert ? (
                            <FiAlertTriangle className="text-red-500 animate-pulse" size={16} />
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-linear-to-br from-[#101828F2] to-[#030712F2] border-2 border-[#FDC500] rounded-2xl p-6 flex justify-between items-center shadow-[0px_10px_40px_0px_#FDC50026] hover:scale-[1.02] transition-all">
            <div>
              <p className="text-green-400 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_#4ade80]" /> ACTIVE
              </p>
              <h3 className="text-3xl sm:text-4xl font-normal mt-2 tracking-tight">
                {employees.filter(e => e.status).length}
              </h3>
            </div>
            <div className="p-4 bg-green-500/10 rounded-full border border-green-500/20">
              <FiUserCheck className="text-green-400 size-8" />
            </div>
          </div>

          <div className="bg-linear-to-br from-[#101828F2] to-[#030712F2] border-2 border-[#FDC500] rounded-2xl p-6 flex justify-between items-center shadow-[0px_10px_40px_0px_#FDC50026] hover:scale-[1.02] transition-all">
            <div>
              <p className="text-red-400 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" /> OUT
              </p>
              <h3 className="text-3xl sm:text-4xl font-normal mt-2 tracking-tight">
                {employees.filter(e => !e.status).length}
              </h3>
            </div>
            <div className="p-4 bg-red-500/10 rounded-full border border-red-500/20">
              <FiClock className="text-red-400 size-8" />
            </div>
          </div>

          <div className="bg-linear-to-br from-[#101828F2] to-[#030712F2] border-2 border-[#FDC500] rounded-2xl p-6 flex justify-between items-center shadow-[0px_10px_40px_0px_#FDC50026] hover:scale-[1.02] transition-all">
            <div>
              <p className="text-[#FDC500] text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
                Alerts
              </p>
              <h3 className="text-3xl sm:text-4xl font-normal mt-2 text-[#FDC500] tracking-tight">
                {employees.filter(e => e.alert).length} <span className="text-sm font-normal text-gray-500 ml-1">Active</span>
              </h3>
            </div>
            <div className="p-4 bg-[#FDC500]/10 rounded-full border border-[#FDC500]/20">
              <FiAlertTriangle className="text-[#FDC500] size-8" />
            </div>
          </div>
        </div>
      </div>

      <FrameViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        frame={null}
        intervals={employees[0]?.intervals}
      />
      <EmployeeAlertModal
        isOpen={isAlertModalOpen}
        employees={alertEmployees}
        shopName={shopName}
        alertLimit={15}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </div>
  );
};

export default HomePageSection;