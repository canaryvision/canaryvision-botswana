import React, { useEffect, useState } from "react";
import BGImage from "../../assets/bg image.jpg";
import {
  // FiDownload,
  FiCalendar,
  FiAlertTriangle,
  FiClock,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
// import { IoMdPersonAdd } from "react-icons/io";
import { AiOutlineFolderView } from "react-icons/ai";
import FrameViewModal from "../employee/FrameViewModal";
import EmployeeAlertModal from "../modal/EmployeeAlertModal";
import { db } from "../../firebase/config";
import { doc, onSnapshot } from "firebase/firestore";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getTodayDocId = () => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, "0");
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/**
 * Parse "HH:MM:SS" or "HH:MM" → total seconds from midnight.
 * This is the KEY fix — intervals have seconds (e.g. "11:52:26").
 */
const toSeconds = (t: string): number => {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  // fallback for "HH:MM"
  const [h, m] = parts;
  return h * 3600 + m * 60;
};

/**
 * Format total seconds → human-readable duration.
 * Shows seconds when < 60s, e.g. "34s", "1m 23s", "2h 5m"
 */
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

/**
 * Format "HH:MM:SS" or "HH:MM" → "3:42:05 PM" (12-hour with seconds).
 */
const to12Hour = (t: string): string => {
  if (!t) return "—";
  const parts = t.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] ?? "00";
  const s = parts[2] ?? null;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  const base = `${h}:${m}`;
  return s !== null ? `${base}:${s} ${ampm}` : `${base} ${ampm}`;
};

interface Interval {
  checkin: string;  // "HH:MM:SS"
  checkout: string; // "HH:MM:SS"
}

/** Total INSIDE = sum of (checkout - checkin) in seconds for each interval */
const calcTotalInside = (intervals: Interval[]): number =>
  intervals.reduce((sum, iv) => {
    const diff = toSeconds(iv.checkout) - toSeconds(iv.checkin);
    return sum + Math.max(0, diff);
  }, 0);

/** Total OUTSIDE = gaps between intervals in seconds */
const calcTotalOutside = (intervals: Interval[]): number => {
  let total = 0;
  for (let i = 0; i < intervals.length - 1; i++) {
    const gap = toSeconds(intervals[i + 1].checkin) - toSeconds(intervals[i].checkout);
    total += Math.max(0, gap);
  }
  return total;
};

/** Outside gap segments with seconds-level precision */
const getOutsideGaps = (intervals: Interval[]) => {
  const gaps: { from: string; to: string; secs: number }[] = [];
  for (let i = 0; i < intervals.length - 1; i++) {
    const secs =
      toSeconds(intervals[i + 1].checkin) - toSeconds(intervals[i].checkout);
    if (secs > 0) {
      gaps.push({
        from: intervals[i].checkout,
        to: intervals[i + 1].checkin,
        secs,
      });
    }
  }
  return gaps;
};

// Alert threshold in seconds (15 minutes = 900 seconds)


// ── Component ─────────────────────────────────────────────────────────────────
const HomePageSection: React.FC = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<any[]>([]);
  const [, setLastUpdated] = useState<string>("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [liveFrame, setLiveFrame] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertEmployees, setAlertEmployees] = useState<any[]>([]);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [hasShownAlerts, setHasShownAlerts] = useState(false);
  const [loading, setLoading] = useState(true);
  const todayDocId = getTodayDocId();
  const [shopName] = useState<string>("CanaryVision");
  const [alertThresholdSecs] = useState(15 * 60);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const date = new Date();
      setCurrentDateTime(date.toLocaleString()); // Formats the date and time as a localized string
    };

    updateDateTime();
    const intervalId = setInterval(updateDateTime, 1000); // Update the time every second

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  // Fetch real-time tracking data for today
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, "tracking", todayDocId), (docSnap) => {
      setLastUpdated(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      
      const parsed: any[] = [];
      if (docSnap.exists()) {
        const raw = docSnap.data();
        Object.entries(raw).forEach(([cameraKey, cameraVal]) => {
          if (cameraKey === "last_updated" || cameraKey === "cam1_frame") return;
          if (typeof cameraVal !== "object" || cameraVal === null) return;
          
          // No shop filter - show all tracking data
          Object.entries(cameraVal as Record<string, any>).forEach(([empId, empData]) => {
            if (typeof empData !== "object" || empData === null) return;

            const intervals: Interval[] = Array.isArray(empData.intervals)
              ? empData.intervals.filter((iv: any) => iv.checkin && iv.checkout)
              : [];

            const insideSecs = calcTotalInside(intervals);
            const outsideSecs = calcTotalOutside(intervals);
            const outsideGaps = getOutsideGaps(intervals);

            const hasAlert = outsideGaps.some((g) => g.secs >= alertThresholdSecs);

            parsed.push({
              employee_id: empId,
              camera: cameraKey,
              shopId: cameraKey,
              status: empData.status === true,
              intervals,
              insideSecs,
              outsideSecs,
              outsideGaps,
              alert: hasAlert,
            });
          });
        });
      }

      parsed.sort((a, b) => a.employee_id.localeCompare(b.employee_id));
      setEmployees(parsed);
      setLoading(false);
    });

    return () => unsub();
  }, [alertThresholdSecs, todayDocId]);

  useEffect(() => {
    const alerted = employees.filter((e) => e.alert);
    if (alerted.length > 0 && !isAlertModalOpen && !hasShownAlerts) {
      setAlertEmployees(alerted);
      setIsAlertModalOpen(true);
      setHasShownAlerts(true);
    }
  }, [employees]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  return (
    <div
      className="min-h-screen text-white flex justify-center p-6 bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url(${BGImage})` }}
    >
      <div
        className="w-full rounded-2xl border-2 border-[#FDC500] relative"
        style={{
          background:
            "linear-gradient(135deg, rgba(16,24,40,0.95) 0%, rgba(3,7,18,0.95) 50%, rgba(0,0,0,0.95) 100%)",
          boxShadow: "0px 20px 60px 0px #FDC50033",
        }}
      >
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 border-b border-[#1E2939] p-10">
          <div>
            <h1 className="text-[30px] font-semibold">{shopName} - Outing Tracker</h1>
            <p className="text-gray-400 text-base mt-1">
              Real-time staff movement and outing duration tracking.
            </p>
          </div>
   <div className="flex items-center gap-3 flex-wrap">
        {/* Date and Time with border and animation */}
        <div className="border-2 border-[#FDC500] p-3 bg-white rounded-md text-right md:text-left text-sm text-black mt-2 md:mt-0 transition duration-500 ease-in-out transform hover:scale-105 hover:shadow-lg">
          <span>{currentDateTime}</span>
        </div>
        <button
          onClick={() => navigate("/employee-history")}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-[#FDC500] transition"
        >
          <FiCalendar /> Weekly History
        </button>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-md hover:bg-[#FDC500] transition"
        >
          <AiOutlineFolderView /> Live Feed
        </button>
        <button
          onClick={() => navigate("/employees")}
          className="bg-white text-black p-2 rounded-md hover:bg-[#FDC500] transition"
        >
          Employees
        </button>
      </div>
        </div>

        {/* ── Table ── */}
        <div className="p-10">
          {loading ? (
            <div className="flex items-center justify-center h-[200px] text-[#FCCA00] animate-pulse text-base">
              Loading today's data...
            </div>
          ) : employees.length === 0 ? (
            <div className="flex items-center justify-center h-[200px] text-gray-500 text-base">
              No data found for {todayDocId}.
            </div>
          ) : (
            <div className="rounded-2xl bg-[#111827]/60 border border-[#1E293B] overflow-hidden">
              <table className="w-full text-sm text-left text-gray-200">
                <thead className="text-gray-400 bg-[#10182880]">
                  <tr>
                    <th className="py-5 px-6">Employee ID</th>
                    <th className="py-5 px-6">Status</th>
                    <th className="py-5 px-6">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                        Total Time Inside
                      </span>
                    </th>
                    {/* <th className="py-5 px-6">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                        Total Time Outside
                      </span>
                    </th> */}
                    <th className="py-5 px-6">Alert</th>
                    <th className="py-5 px-6 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <React.Fragment key={i}>
                      {/* ── Main row ── */}
                      <tr
                        className={`border-b border-[#1E293B] cursor-pointer transition-colors duration-200 ${
                          expanded === emp.employee_id
                            ? "bg-[#1B2333]"
                            : "hover:bg-[#1B2333]"
                        }`}
                        onClick={() => toggleExpand(emp.employee_id)}
                      >
                        {/* Employee ID */}
                        <td className="py-4 px-6 font-semibold text-white">
                          {emp.employee_id}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                              emp.status
                                ? "bg-green-500/15 text-green-400 border border-green-500/30"
                                : "bg-red-500/15 text-red-400 border border-red-500/30"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                emp.status
                                  ? "bg-green-400 animate-pulse"
                                  : "bg-red-400"
                              }`}
                            />
                            {emp.status ? "Inside" : "Outside"}
                          </span>
                        </td>

                        {/* Total Inside — now seconds-accurate */}
                        <td className="py-4 px-6">
                          {emp.insideSecs > 0 ? (
                            <span className="text-green-300 font-semibold">
                              {formatDuration(emp.insideSecs)}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>

                        {/* Total Outside — now seconds-accurate */}
                        {/* <td className="py-4 px-6">
                          {emp.outsideSecs > 0 ? (
                            <span
                              className={`font-semibold ${
                                emp.alert ? "text-red-400" : "text-orange-300"
                              }`}
                            >
                              {formatDuration(emp.outsideSecs)}
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td> */}

                        {/* Alert */}
                        <td className="py-4 px-6">
                          {emp.alert ? (
                            <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-full">
                              <FiAlertTriangle size={11} /> Alert
                            </span>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>

                        {/* Expand toggle */}
                        <td className="py-4 px-6 text-right">
                          {expanded === emp.employee_id ? (
                            <FiChevronUp className="inline text-[#FCCA00]" />
                          ) : (
                            <FiChevronDown className="inline text-gray-500" />
                          )}
                        </td>
                      </tr>

                      {/* ── Expanded detail ── */}
                      {expanded === emp.employee_id && (
                        <tr>
                          <td
                            colSpan={6}
                            className="bg-[#080E1A] px-8 py-6 border-b border-[#1E293B]"
                          >
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                              {/* LEFT — Inside sessions */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                                    Inside Sessions
                                  </p>
                                  <span className="ml-auto text-green-300 text-sm font-semibold">
                                    Total: {formatDuration(emp.insideSecs)}
                                  </span>
                                </div>

                                {emp.intervals.length === 0 ? (
                                  <div className="flex items-center justify-center h-[60px] bg-[#1E293B]/30 border border-[#2A3441] rounded-xl">
                                    <p className="text-gray-600 text-xs">No sessions recorded</p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    {emp.intervals.map((iv: Interval, idx: number) => {
                                      const secs = toSeconds(iv.checkout) - toSeconds(iv.checkin);
                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center justify-between bg-green-500/5 border border-green-500/15 rounded-xl px-4 py-3"
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 text-[10px] flex items-center justify-center font-semibold">
                                              {idx + 1}
                                            </span>
                                            <FiClock className="size-3.5 text-green-400" />
                                            {/* Show full HH:MM:SS times */}
                                            <span className="text-white text-sm font-medium font-mono">
                                              {to12Hour(iv.checkin)}
                                            </span>
                                            <span className="text-gray-500 text-xs">→</span>
                                            <span className="text-white text-sm font-medium font-mono">
                                              {to12Hour(iv.checkout)}
                                            </span>
                                          </div>
                                          {/* Duration in seconds if < 60 */}
                                          <span className="text-green-300 text-sm font-semibold bg-green-500/10 border border-green-500/20 px-3 py-0.5 rounded-full font-mono">
                                            {formatDuration(Math.max(0, secs))}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* RIGHT — Outside gaps */}
                              <div>
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                                    Outside Gaps
                                  </p>
                                  <span
                                    className={`ml-auto text-sm font-semibold ${
                                      emp.outsideSecs > 0
                                        ? emp.alert
                                          ? "text-red-400"
                                          : "text-orange-300"
                                        : "text-gray-600"
                                    }`}
                                  >
                                    Total: {formatDuration(emp.outsideSecs)}
                                  </span>
                                </div>

                                {emp.outsideGaps.length === 0 ? (
                                  <div className="flex items-center justify-center h-[60px] bg-[#1E293B]/30 border border-[#2A3441] rounded-xl">
                                    <p className="text-gray-600 text-xs">
                                      No outside gaps recorded
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    {emp.outsideGaps.map((gap: any, idx: number) => {
                                      const isLong = gap.secs >= alertThresholdSecs;
                                      return (
                                        <div
                                          key={idx}
                                          className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                                            isLong
                                              ? "bg-red-500/8 border-red-500/20"
                                              : "bg-orange-500/5 border-orange-500/15"
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span
                                              className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-semibold ${
                                                isLong
                                                  ? "bg-red-500/20 border border-red-500/40 text-red-400"
                                                  : "bg-orange-500/20 border border-orange-500/40 text-orange-400"
                                              }`}
                                            >
                                              {idx + 1}
                                            </span>
                                            <FiClock
                                              className={`size-3.5 ${isLong ? "text-red-400" : "text-orange-400"}`}
                                            />
                                            <span className="text-white text-sm font-medium font-mono">
                                              {to12Hour(gap.from)}
                                            </span>
                                            <span className="text-gray-500 text-xs">→</span>
                                            <span className="text-white text-sm font-medium font-mono">
                                              {to12Hour(gap.to)}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`text-sm font-semibold px-3 py-0.5 rounded-full border font-mono ${
                                                isLong
                                                  ? "text-red-400 bg-red-500/10 border-red-500/30"
                                                  : "text-orange-300 bg-orange-500/10 border-orange-500/20"
                                              }`}
                                            >
                                              {formatDuration(gap.secs)}
                                            </span>
                                            {isLong && (
                                              <span className="flex items-center gap-1 text-red-400 text-xs">
                                                <FiAlertTriangle size={10} /> Exceeded
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <FrameViewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        frame={liveFrame}
      />
      <EmployeeAlertModal
        isOpen={isAlertModalOpen}
        employees={alertEmployees}
        shopName={shopName}
        alertLimit={Math.floor(alertThresholdSecs / 60)}
        onClose={() => setIsAlertModalOpen(false)}
      />
    </div>
  );
};

export default HomePageSection;