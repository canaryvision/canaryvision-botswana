import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiArrowLeft, FiClock, FiActivity, FiEye, FiAlertTriangle } from "react-icons/fi";
import BGImage from "../../assets/bg image.jpg";
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

const BoxDetailSection: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [boxData, setBoxData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [nowSecs, setNowSecs] = useState(0);
  const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setNowSecs(now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: firestoreData, loading: firestoreLoading } = useRealtimeData(selectedDate);

  useEffect(() => {
    if (!firestoreLoading) {
      const data = firestoreData?.[id || ""];
      if (data) {
        // Handle both Array and Object (Map) structures from Firestore
        const presenceRaw = data.operator_presence || [];
        const sortedIntervals = Array.isArray(presenceRaw) 
          ? presenceRaw 
          : Object.values(presenceRaw).sort((a: any, b: any) => (a.checkin || '').localeCompare(b.checkin || ''));

        const lastInterval = sortedIntervals[sortedIntervals.length - 1];
        
        // Map Firestore fields to what the component expects
        const mappedData = {
          ...data,
          operator_presence: sortedIntervals,
          Operator_presence_status: lastInterval?.operator_status === true || (!!lastInterval?.checkin && !lastInterval?.checkout),
          eye_status: data.eyes_status?.trim() === "open",
        };
        setBoxData(mappedData);
      } else {
        setBoxData(null);
      }
      setLoading(false);
    }
  }, [id, firestoreData, firestoreLoading]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#FDC500]">Loading...</div>;
  if (!boxData) return <div className="min-h-screen flex items-center justify-center text-white">Box not found.</div>;

  const intervals = boxData.operator_presence || [];
  const status = boxData.Operator_presence_status;

  let currentTotalSecs = 0;
  intervals.forEach((iv: any) => {
    if (iv.checkin && iv.checkout) {
      currentTotalSecs += (toSeconds(iv.checkout) - toSeconds(iv.checkin));
    } else if (iv.checkin && !iv.checkout && status) {
      const startSecs = toSeconds(iv.checkin);
      if (nowSecs > startSecs) {
        currentTotalSecs += (nowSecs - startSecs);
      }
    }
  });

  return (
    <div
      className="min-h-screen text-white flex flex-col p-6 sm:p-10 bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url(${BGImage})`, backgroundSize: "cover" }}
    >
      <div className="w-full max-w-full lg:max-w-[85%] mx-auto flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all shadow-lg"
          >
            <FiArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">{id} Detail Monitoring</h1>
            <p className="text-[#99A1AF] text-sm sm:text-base mt-1">Comprehensive tracking data for this station.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Presence Card */}
          <div className="bg-[#111827]/80 backdrop-blur-md border-2 border-[#FDC500] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Operator Status</p>
              <FiActivity className={status ? "text-green-400" : "text-red-400"} size={20} />
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${status ? 'bg-green-400 animate-pulse shadow-[0_0_10px_#4ade80]' : 'bg-red-400'}`} />
              <h3 className="text-2xl font-bold">{status ? "ACTIVE" : "INACTIVE"}</h3>
            </div>
          </div>

          {/* Eye Status Card */}
          <div className="bg-[#111827]/80 backdrop-blur-md border-2 border-[#FDC500] rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-start mb-4">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Eye Tracking</p>
              <FiEye className={boxData.eye_status ? "text-blue-400" : "text-gray-500"} size={20} />
            </div>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${boxData.eye_status ? 'bg-blue-400 shadow-[0_0_10px_#3b82f6]' : 'bg-gray-500'}`} />
              <h3 className="text-2xl font-bold uppercase">{boxData.eye_status ? "OPEN" : "CLOSED"}</h3>
            </div>
          </div>

          {/* Duration Card */}
          <div className="bg-[#111827]/80 backdrop-blur-md border-2 border-[#FDC500] rounded-2xl p-6 shadow-xl col-span-1 md:col-span-2">
            <div className="flex justify-between items-start mb-4">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Active Duration Today</p>
              <FiClock className="text-[#FDC500]" size={20} />
            </div>
            <h3 className="text-4xl font-mono font-bold text-[#FDC500] tracking-wider">
              {formatDuration(currentTotalSecs)}
            </h3>
          </div>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 gap-8">
          {/* Presence Logs */}
          <div className="bg-[#101828F2] border-2 border-[#FDC500] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1E293B] bg-[#10182880]">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FiActivity className="text-[#FDC500]" /> Presence Intervals
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/20 text-[#99A1AF] text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">No.</th>
                    <th className="px-8 py-4">Check In</th>
                    <th className="px-8 py-4">Check Out</th>
                    <th className="px-8 py-4">Duration</th>
                    <th className="px-8 py-4">Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {intervals.map((iv: any, idx: number) => {
                    const finished = iv.checkin && iv.checkout;
                    const live = iv.checkin && !iv.checkout && status;
                    let dur = 0;
                    if (finished) dur = toSeconds(iv.checkout) - toSeconds(iv.checkin);
                    else if (live) dur = nowSecs - toSeconds(iv.checkin);

                    return (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-4 text-sm text-gray-500 font-mono">{idx + 1}</td>
                        <td className="px-8 py-4 text-sm text-white font-mono">{to12Hour(iv.checkin)}</td>
                        <td className="px-8 py-4 text-sm text-white font-mono">
                          {iv.checkout ? to12Hour(iv.checkout) : (status ? <span className="text-green-400 animate-pulse">Now</span> : "—")}
                        </td>
                        <td className="px-8 py-4">
                          <span className={`text-sm font-mono font-bold ${live ? "text-green-400" : "text-[#FDC500]"}`}>
                            {dur > 0 ? formatDuration(dur) : "—"}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          {(() => {
                            const prevIv = intervals[idx - 1];
                            if (prevIv && prevIv.checkout && iv.checkin) {
                              const gap = toSeconds(iv.checkin) - toSeconds(prevIv.checkout);
                              if (gap > 300) return <FiAlertTriangle className="text-red-500 animate-pulse" size={18} />;
                            }
                            return <span className="text-gray-600">—</span>;
                          })()}
                        </td>
                      </tr>
                    );
                  }).reverse()}
                </tbody>
              </table>
            </div>
          </div>

          {/* Eyes Data Table */}
          <div className="bg-[#101828F2] border-2 border-[#FDC500] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[#1E293B] bg-[#10182880]">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <FiEye className="text-[#FDC500]" /> Eye Activity Logs (Closed Periods)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/20 text-[#99A1AF] text-xs uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-4">No.</th>
                    <th className="px-8 py-4">Eye Closed</th>
                    <th className="px-8 py-4">Eye Opened</th>
                    <th className="px-8 py-4">Total Closed Time</th>
                    <th className="px-8 py-4">Alert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {(boxData.eyes_data || []).map((iv: any, idx: number) => {
                    const finished = iv.close && iv.open;
                    const live = iv.close && !iv.open && !boxData.eye_status;
                    let dur = 0;
                    if (finished) dur = toSeconds(iv.open) - toSeconds(iv.close);
                    else if (live) dur = nowSecs - toSeconds(iv.close);

                    return (
                      <tr key={idx} className="hover:bg-white/5 transition-colors">
                        <td className="px-8 py-4 text-sm text-gray-500 font-mono">{idx + 1}</td>
                        <td className="px-8 py-4 text-sm text-white font-mono">{to12Hour(iv.close)}</td>
                        <td className="px-8 py-4 text-sm text-white font-mono">
                          {iv.open ? to12Hour(iv.open) : (!boxData.eye_status ? <span className="text-red-400 animate-pulse">Now</span> : "—")}
                        </td>
                        <td className="px-8 py-4">
                          <span className={`text-sm font-mono font-bold ${live ? "text-red-400" : "text-blue-400"}`}>
                            {dur > 0 ? formatDuration(dur) : "—"}
                          </span>
                        </td>
                        <td className="px-8 py-4">
                          {dur > 300 ? (
                            <FiAlertTriangle className="text-red-500 animate-pulse" size={18} />
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  }).reverse()}
                  {(boxData.eyes_data || []).length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-10 text-center text-gray-500 italic text-sm">
                        No eye activity records found for today.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BoxDetailSection;
