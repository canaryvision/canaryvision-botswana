import React, { useEffect, useRef, useState } from "react";
import BGImage from "../../assets/bg image.jpg";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  // FiDownload,
  FiTrendingUp,
  FiUsers,
} from "react-icons/fi";
import { useNavigate, useParams } from "react-router-dom";
import { db } from "../../firebase/config";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Interval {
  checkin: string;  // "HH:MM:SS"
  checkout: string; // "HH:MM:SS"
}

interface EmployeeRecord {
  employee_id: string;
  camera: string;
  date: string;
  status: boolean;
  intervals: Interval[];
  insideSecs: number;   // ← seconds (was mins)
  outsideSecs: number;  // ← seconds (was mins)
  alert: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Parse "HH:MM:SS" or "HH:MM" → total seconds from midnight.
 */
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

/**
 * Format total seconds → readable duration (shows seconds when < 60).
 * Examples: 34 → "34s", 97 → "1m 37s", 3661 → "1h 1m 1s"
 */
const formatDuration = (totalSecs: number): string => {
  if (totalSecs <= 0) return "0s";
  if (totalSecs < 60) return `${totalSecs}s`;
  if (totalSecs < 3600) {
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  }
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  if (m === 0 && s === 0) return `${h}h`;
  if (s === 0) return `${h}h ${m}m`;
  return `${h}h ${m}m ${s}s`;
};

/**
 * Format "HH:MM:SS" or "HH:MM" → "3:42:05 PM" (includes seconds).
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

/** Total INSIDE in seconds */
const calcInsideSecs = (intervals: Interval[]): number =>
  intervals.reduce((sum, iv) => {
    const diff = toSeconds(iv.checkout) - toSeconds(iv.checkin);
    return sum + Math.max(0, diff);
  }, 0);

/** Total OUTSIDE (gaps between intervals) in seconds */
const calcOutsideSecs = (intervals: Interval[]): number => {
  let total = 0;
  for (let i = 0; i < intervals.length - 1; i++) {
    const gap = toSeconds(intervals[i + 1].checkin) - toSeconds(intervals[i].checkout);
    total += Math.max(0, gap);
  }
  return total;
};

/** Outside gap segments with seconds precision */
const getOutsideGaps = (intervals: Interval[]) => {
  const gaps: { from: string; to: string; secs: number }[] = [];
  for (let i = 0; i < intervals.length - 1; i++) {
    const secs =
      toSeconds(intervals[i + 1].checkin) - toSeconds(intervals[i].checkout);
    if (secs > 0)
      gaps.push({
        from: intervals[i].checkout,
        to: intervals[i + 1].checkin,
        secs,
      });
  }
  return gaps;
};

// Alert threshold: 15 minutes = 900 seconds
const ALERT_THRESHOLD_SECS = 15 * 60;

const getDateDocIds = (days: number): string[] => {
  const ids: string[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    ids.push(`${dd}-${mm}-${yyyy}`);
  }
  return ids;
};

const parseDocToRecords = (dateId: string, data: any, filterShopId?: string): EmployeeRecord[] => {
  const records: EmployeeRecord[] = [];
  Object.entries(data).forEach(([cameraKey, cameraVal]) => {
    if (cameraKey === "last_updated" || cameraKey === "cam1_frame") return;
    if (typeof cameraVal !== "object" || cameraVal === null) return;
    
    // Filter by Shop ID if cameraKey represents shop
    if (filterShopId && cameraKey !== filterShopId) return;

    Object.entries(cameraVal as Record<string, any>).forEach(([empId, empData]) => {
      if (typeof empData !== "object" || empData === null) return;
      const intervals: Interval[] = Array.isArray(empData.intervals)
        ? empData.intervals.filter((iv: any) => iv.checkin && iv.checkout)
        : [];
      const insideSecs = calcInsideSecs(intervals);
      const outsideSecs = calcOutsideSecs(intervals);
      const gaps = getOutsideGaps(intervals);
      const alert = gaps.some((g) => g.secs >= ALERT_THRESHOLD_SECS);
      records.push({
        employee_id: empId,
        camera: cameraKey,
        date: dateId,
        status: empData.status === true,
        intervals,
        insideSecs,
        outsideSecs,
        alert,
      });
    });
  });
  return records;
};

const formatDateLabel = (docId: string) => {
  const [dd, mm, yyyy] = docId.split("-");
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${dd} ${months[parseInt(mm) - 1]} ${yyyy}`;
};

const FILTER_OPTIONS = [
  { label: "Today", days: 1 },
  { label: "Yesterday", days: 2 },
  { label: "Last 7 Days", days: 7 },
  { label: "Last 2 Weeks", days: 14 },
  { label: "Last 1 Month", days: 30 },
];

// ── Component ─────────────────────────────────────────────────────────────────
const WeeklyHistory: React.FC = () => {
  const navigate = useNavigate();
  const { shopId } = useParams<{ shopId: string }>();
  const [selected, setSelected] = useState("Last 7 Days");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [selectedEmployee, setSelectedEmployee] = useState("All Employees");
  const [isEmployeeOpen, setIsEmployeeOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  const [allRecords, setAllRecords] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (key: string) =>
    setExpandedRow((prev) => (prev === key ? null : key));

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setIsOpen(false);
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(e.target as Node))
        setIsEmployeeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const daysToFetch =
          FILTER_OPTIONS.find((opt) => opt.label === selected)?.days || 7;
        const dateIds = getDateDocIds(daysToFetch);

        const fetchedChunks: EmployeeRecord[] = [];

        // Fetch each day's document from Firestore
        // Collection: "tracking" (Based on standard pattern for this project)
        for (const dateId of dateIds) {
          const docRef = doc(db, "tracking", dateId);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            fetchedChunks.push(...parseDocToRecords(dateId, data, shopId));
          }
        }

        fetchedChunks.sort((a, b) => {
          const [da, ma, ya] = a.date.split("-").map(Number);
          const [db2, mb, yb] = b.date.split("-").map(Number);
          const dateA = new Date(ya, ma - 1, da).getTime();
          const dateB = new Date(yb, mb - 1, db2).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return a.employee_id.localeCompare(b.employee_id);
        });

        setAllRecords(fetchedChunks);
        setSelectedEmployee("All Employees");
        setExpandedRow(null);
      } catch (error) {
        console.error("Error fetching history:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selected, shopId]);

  // ── Derived stats (all in seconds now) ───────────────────────────────────
  const employeeList = [
    "All Employees",
    ...Array.from(new Set(allRecords.map((r) => r.employee_id))).sort(),
  ];

  const filteredRecords =
    selectedEmployee === "All Employees"
      ? allRecords
      : allRecords.filter((r) => r.employee_id === selectedEmployee);

  const totalTracked = new Set(allRecords.map((r) => r.employee_id)).size;
  const totalAlerts = allRecords.filter((r) => r.alert).length;

  const allOutsideSecs = allRecords.map((r) => r.outsideSecs);
  const avgOutSecs =
    allOutsideSecs.length > 0
      ? Math.round(allOutsideSecs.reduce((s, v) => s + v, 0) / allOutsideSecs.length)
      : 0;
  const longestOutSecs = allOutsideSecs.length > 0 ? Math.max(...allOutsideSecs) : 0;

  // Per-employee sidebar stats
  const empRecords = allRecords.filter((r) => r.employee_id === selectedEmployee);
  const empTotalInsideSecs = empRecords.reduce((s, r) => s + r.insideSecs, 0);
  const empTotalOutsideSecs = empRecords.reduce((s, r) => s + r.outsideSecs, 0);
  const empAlerts = empRecords.filter((r) => r.alert).length;
  const empAvgOutSecs =
    empRecords.length > 0
      ? Math.round(empTotalOutsideSecs / empRecords.length)
      : 0;

  return (
    <div
      className="min-h-screen text-white flex flex-col justify-start p-4 sm:p-6 lg:p-10 bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url(${BGImage})`, backgroundSize: "cover" }}
    >
      <div className="w-full max-w-full lg:max-w-[90%] mx-auto flex flex-col gap-6 sm:gap-8">

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-normal">
              Outing History
            </h1>
            <p className="text-[#99A1AF] text-sm sm:text-base">
              View detailed outing logs filtered by date range.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Date range dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 justify-between w-full sm:w-[180px] bg-[#1E293980] border border-[#364153] text-white px-4 py-2 rounded-md text-sm cursor-pointer select-none"
              >
                <FiCalendar className="text-[#FCCA00] shrink-0" />
                <span className="flex-1 text-xs sm:text-sm">{selected}</span>
                <FiChevronDown className={`text-[#8F8F8F] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
              </div>
              {isOpen && (
                <div className="absolute left-0 mt-1 w-full sm:w-[180px] bg-[#1E293B] border border-[#364153] rounded-md shadow-xl z-50 overflow-hidden">
                  {FILTER_OPTIONS.map((opt) => (
                    <div
                      key={opt.label}
                      onClick={() => { setSelected(opt.label); setIsOpen(false); }}
                      className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selected === opt.label ? "bg-[#FCCA00] text-black font-medium" : "text-white hover:bg-[#2A3441]"}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* <button className="flex items-center justify-center gap-2 bg-[#FCCA00] hover:bg-[#FFD633] text-black font-medium px-4 py-2 rounded-md transition text-sm whitespace-nowrap">
              <FiDownload className="size-4" /> Download Report
            </button> */}
            <button
              onClick={() => navigate(`/dashboard/${shopId || ""}`)}
              className="flex items-center justify-center gap-2 bg-white text-black px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition text-sm"
            >
              <FiArrowLeft /> Back
            </button>
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: <FiUsers className="text-[#FCCA00] size-5" />,
              value: totalTracked,
              label: "Total Employees",
              color: "text-[#FCCA00]",
              border: "border-[#FCCA00]/20",
              bg: "bg-[#FCCA0008]",
            },
            {
              icon: <FiClock className="text-[#3B82F6] size-5" />,
              value: formatDuration(avgOutSecs),
              label: "Avg Out Duration",
              color: "text-[#3B82F6]",
              border: "border-[#3B82F6]/20",
              bg: "bg-[#3B82F608]",
            },
            {
              icon: <FiTrendingUp className="text-[#EF4444] size-5" />,
              value: formatDuration(longestOutSecs),
              label: "Longest Outing",
              color: "text-[#EF4444]",
              border: "border-[#EF4444]/20",
              bg: "bg-[#EF444408]",
            },
            {
              icon: <FiAlertTriangle className="text-[#FACC15] size-5" />,
              value: totalAlerts,
              label: "Alerts Triggered",
              color: "text-[#FACC15]",
              border: "border-[#FACC15]/20",
              bg: "bg-[#FACC1508]",
            },
          ].map((s, i) => (
            <div
              key={i}
              className={`flex flex-col justify-between ${s.bg} border ${s.border} rounded-xl px-5 py-5 from-[#101828F2] to-[#030712F2] bg-linear-to-br`}
            >
              <div className="flex items-center justify-between mb-3">
                {s.icon}
                <p className={`text-2xl lg:text-[28px] font-normal ${s.color}`}>
                  {s.value}
                </p>
              </div>
              <p className="text-xs text-[#99A1AF]">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Table + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Table ── */}
          <div className="col-span-1 lg:col-span-2 bg-linear-to-br from-[#101828F2] to-[#030712F2] border-2 border-[#FDC500] rounded-2xl shadow-[0px_10px_40px_0px_#FDC50026] overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-5 border-b border-[#1E2939]">
              <div>
                <h2 className="text-lg font-normal">Detailed Outing Logs</h2>
                <p className="text-xs text-[#99A1AF] mt-0.5">
                  {filteredRecords.length} record{filteredRecords.length !== 1 ? "s" : ""} · {selected}
                </p>
              </div>
              <div className="relative w-full sm:w-[200px]" ref={employeeDropdownRef}>
                <button
                  onClick={() => setIsEmployeeOpen(!isEmployeeOpen)}
                  className="flex items-center justify-between w-full h-9 bg-[#1E293980] border border-[#364153] text-white text-sm rounded-lg px-3 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm truncate">{selectedEmployee}</span>
                  <FiChevronDown className={`size-4 text-[#8F8F8F] shrink-0 transition-transform duration-200 ${isEmployeeOpen ? "rotate-180" : ""}`} />
                </button>
                {isEmployeeOpen && (
                  <div className="absolute right-0 mt-1 w-full bg-[#1E293B] border border-[#364153] rounded-md shadow-xl z-50 overflow-hidden max-h-[200px] overflow-y-auto">
                    {employeeList.map((emp) => (
                      <div
                        key={emp}
                        onClick={() => { setSelectedEmployee(emp); setIsEmployeeOpen(false); }}
                        className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${selectedEmployee === emp ? "bg-[#FCCA00] text-black font-medium" : "text-white hover:bg-[#2A3441]"}`}
                      >
                        {emp}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-[200px] text-[#FCCA00] animate-pulse text-sm">
                Loading data...
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="flex items-center justify-center h-[200px] text-gray-500 text-sm">
                No records found for this period.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
                <table className="w-full text-left border-collapse min-w-[640px]">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[#10182880] text-[#99A1AF] border-b border-[#1E2939]">
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide">Employee ID</th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide">Date</th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide">Status</th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Total Inside
                        </span>
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide">
                        <span className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Total Outside
                        </span>
                      </th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide">Sessions</th>
                      <th className="px-5 py-4 text-xs font-medium uppercase tracking-wide">Alert</th>
                      <th className="px-5 py-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((row, i) => {
                      const rowKey = `${row.date}-${row.employee_id}`;
                      const isExpanded = expandedRow === rowKey;
                      const gaps = getOutsideGaps(row.intervals);

                      return (
                        <React.Fragment key={i}>
                          {/* ── Main row ── */}
                          <tr
                            onClick={() => toggleRow(rowKey)}
                            className={`border-b border-[#1E293B]/60 cursor-pointer transition-colors duration-150 ${isExpanded ? "bg-[#1B2333]" : "hover:bg-[#1B2333]"}`}
                          >
                            <td className="px-5 py-3.5 text-sm font-semibold text-white">
                              {row.employee_id}
                            </td>
                            <td className="px-5 py-3.5 text-sm text-[#99A1AF]">
                              {formatDateLabel(row.date)}
                            </td>
                            <td className="px-5 py-3.5">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${row.status ? "bg-green-500/15 text-green-400 border border-green-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${row.status ? "bg-green-400" : "bg-red-400"}`} />
                                {row.status ? "Inside" : "Outside"}
                              </span>
                            </td>
                            {/* Inside — seconds-accurate */}
                            <td className="px-5 py-3.5">
                              <span className="text-sm text-green-300 font-semibold">
                                {row.insideSecs > 0 ? formatDuration(row.insideSecs) : "—"}
                              </span>
                            </td>
                            {/* Outside — seconds-accurate */}
                            <td className="px-5 py-3.5">
                              <span className={`text-sm font-semibold ${row.alert ? "text-red-400" : row.outsideSecs > 0 ? "text-orange-300" : "text-gray-600"}`}>
                                {row.outsideSecs > 0 ? formatDuration(row.outsideSecs) : "—"}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-sm text-gray-400">
                              {row.intervals.length}
                            </td>
                            <td className="px-5 py-3.5">
                              {row.alert ? (
                                <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/30 px-2 py-1 rounded-full">
                                  <FiAlertTriangle size={10} /> Alert
                                </span>
                              ) : (
                                <span className="text-gray-600 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              {isExpanded
                                ? <FiChevronUp className="inline text-[#FCCA00]" />
                                : <FiChevronDown className="inline text-gray-500" />
                              }
                            </td>
                          </tr>

                          {/* ── Expanded row ── */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} className="bg-[#080E1A] px-6 py-5 border-b border-[#1E293B]">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                                  {/* Inside Sessions */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="w-2 h-2 rounded-full bg-green-400" />
                                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                                        Inside Sessions
                                      </p>
                                      <span className="ml-auto text-green-300 text-sm font-semibold">
                                        Total: {formatDuration(row.insideSecs)}
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                      {row.intervals.length === 0 ? (
                                        <div className="flex items-center justify-center h-[60px] bg-[#1E293B]/30 border border-[#2A3441] rounded-xl">
                                          <p className="text-gray-600 text-xs">No sessions recorded</p>
                                        </div>
                                      ) : (
                                        row.intervals.map((iv, idx) => {
                                          const secs = Math.max(0, toSeconds(iv.checkout) - toSeconds(iv.checkin));
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
                                                {/* Full HH:MM:SS displayed */}
                                                <span className="text-white text-sm font-medium font-mono">
                                                  {to12Hour(iv.checkin)}
                                                </span>
                                                <span className="text-gray-500 text-xs">→</span>
                                                <span className="text-white text-sm font-medium font-mono">
                                                  {to12Hour(iv.checkout)}
                                                </span>
                                              </div>
                                              <span className="text-green-300 text-sm font-semibold bg-green-500/10 border border-green-500/20 px-3 py-0.5 rounded-full font-mono">
                                                {formatDuration(secs)}
                                              </span>
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>
                                  </div>

                                  {/* Outside Gaps */}
                                  <div>
                                    <div className="flex items-center gap-2 mb-3">
                                      <span className="w-2 h-2 rounded-full bg-red-400" />
                                      <p className="text-xs text-gray-400 uppercase tracking-wider">
                                        Outside Gaps
                                      </p>
                                      <span className={`ml-auto text-sm font-semibold ${row.outsideSecs > 0 ? (row.alert ? "text-red-400" : "text-orange-300") : "text-gray-600"}`}>
                                        Total: {formatDuration(row.outsideSecs)}
                                      </span>
                                    </div>
                                    {gaps.length === 0 ? (
                                      <div className="flex items-center justify-center h-[60px] bg-[#1E293B]/30 border border-[#2A3441] rounded-xl">
                                        <p className="text-gray-600 text-xs">No outside gaps recorded</p>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col gap-2">
                                        {gaps.map((gap, idx) => {
                                          const isLong = gap.secs >= ALERT_THRESHOLD_SECS;
                                          return (
                                            <div
                                              key={idx}
                                              className={`flex items-center justify-between rounded-xl px-4 py-3 border ${isLong ? "bg-red-500/5 border-red-500/20" : "bg-orange-500/5 border-orange-500/15"}`}
                                            >
                                              <div className="flex items-center gap-3">
                                                <span className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-semibold ${isLong ? "bg-red-500/20 border border-red-500/40 text-red-400" : "bg-orange-500/20 border border-orange-500/40 text-orange-400"}`}>
                                                  {idx + 1}
                                                </span>
                                                <FiClock className={`size-3.5 ${isLong ? "text-red-400" : "text-orange-400"}`} />
                                                <span className="text-white text-sm font-medium font-mono">
                                                  {to12Hour(gap.from)}
                                                </span>
                                                <span className="text-gray-500 text-xs">→</span>
                                                <span className="text-white text-sm font-medium font-mono">
                                                  {to12Hour(gap.to)}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <span className={`text-sm font-semibold px-3 py-0.5 rounded-full border font-mono ${isLong ? "text-red-400 bg-red-500/10 border-red-500/30" : "text-orange-300 bg-orange-500/10 border-orange-500/20"}`}>
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
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Right Panel (Employee Summary) ── */}
          <div className="col-span-1">
            {selectedEmployee === "All Employees" ? (
              <div className="bg-linear-to-br from-[#101828F2] to-[#030712F2] border-2 border-[#FDC500] rounded-2xl shadow-[0px_10px_40px_0px_#FDC50026] flex flex-col items-center justify-center h-[220px] p-6">
                <FiUsers className="opacity-30 text-[#FDC500] size-10 mb-3" />
                <p className="text-sm text-[#99A1AF]">No Employee Selected</p>
                <p className="text-xs text-[#4A5565] mt-1 text-center">
                  Filter by employee to view individual summary
                </p>
              </div>
            ) : (
              <div className="bg-linear-to-br from-[#101828F2] to-[#030712F2] border-2 border-[#FDC500] rounded-2xl shadow-[0px_10px_40px_0px_#FDC50026] p-6 space-y-5 text-white">
                <div className="flex items-center gap-3 border-b border-[#1E2939] pb-5">
                  <div className="w-11 h-11 flex items-center justify-center rounded-full bg-[#FDC50026] border-2 border-[#FDC500] text-[#FDC500] font-semibold text-lg">
                    {selectedEmployee}
                  </div>
                  <div>
                    <p className="text-base font-normal">Employee {selectedEmployee}</p>
                    <p className="text-xs text-[#99A1AF]">
                      {selected} · {empRecords.length} day{empRecords.length !== 1 ? "s" : ""} of data
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#1E29394D] rounded-xl p-4">
                    <p className="text-xs text-[#99A1AF] mb-1">Total Time Inside</p>
                    <p className="text-2xl font-normal text-green-400">
                      {formatDuration(empTotalInsideSecs)}
                    </p>
                  </div>
                  <div className="bg-[#1E29394D] rounded-xl p-4">
                    <p className="text-xs text-[#99A1AF] mb-1">Total Time Outside</p>
                    <p className="text-2xl font-normal text-[#FDC500]">
                      {formatDuration(empTotalOutsideSecs)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-[#1E29394D] rounded-xl p-4">
                      <p className="text-xs text-[#99A1AF] mb-1">Days Tracked</p>
                      <p className="text-xl font-normal">{empRecords.length}</p>
                    </div>
                    <div className="bg-[#1E29394D] rounded-xl p-4">
                      <p className="text-xs text-[#99A1AF] mb-1">Total Alerts</p>
                      <p className="text-xl font-normal text-red-400">{empAlerts}</p>
                    </div>
                  </div>
                  <div className="bg-[#1E29394D] rounded-xl p-4">
                    <p className="text-xs text-[#99A1AF] mb-1">Avg Outside / Day</p>
                    <p className="text-xl font-normal text-blue-400">
                      {formatDuration(empAvgOutSecs)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WeeklyHistory;