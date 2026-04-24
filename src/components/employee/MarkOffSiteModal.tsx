import React, { useState, useEffect } from "react";
import { FiX, FiFlag, FiCalendar, FiCheckCircle } from "react-icons/fi";
import { toast } from "react-toastify";
import { db } from "../../firebase/config";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";

interface MarkOffSiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: any | null;
  onSave: (employee: any) => void;
}

const DATE_OPTIONS = ["Today", "Tomorrow", "Custom"];

const toDateString = (date: Date) => date.toISOString().split("T")[0];
const getTodayStr = () => toDateString(new Date());
const getTomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toDateString(d);
};
const MarkOffSiteModal: React.FC<MarkOffSiteModalProps> = ({
  isOpen,
  onClose,
  employee,
  onSave,
}) => {
  const [isOffSite, setIsOffSite] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedDateOption, setSelectedDateOption] = useState("Today");
  const [customDate, setCustomDate] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync state when employee changes or modal opens
  useEffect(() => {
    if (employee) {
      const offSite = employee.status === "Off-Site";
      setIsOffSite(offSite);
      setReason(offSite ? employee.offSiteReason || "" : "");
      setSelectedDateOption(
        offSite && employee.offSiteUntil ? "Custom" : "Today",
      );
      setCustomDate(offSite ? employee.offSiteUntil || "" : "");
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const getResolvedDate = () => {
    if (selectedDateOption === "Today") return getTodayStr();
    if (selectedDateOption === "Tomorrow") return getTomorrowStr();
    return customDate;
  };

  const handleSave = async () => {
    if (isOffSite && !reason.trim()) {
      toast.error("Please provide a reason for Off-Site status.");
      return;
    }

    if (isOffSite && selectedDateOption === "Custom" && !customDate) {
      toast.error("Please select a return date.");
      return;
    }

    setSaving(true);
    try {
      const resolvedDate = isOffSite ? getResolvedDate() : null;
      const updatePayload: any = {
        status: isOffSite ? "Off-Site" : "Active",
        offSiteReason: isOffSite ? reason.trim() : "",
        offSiteUntil: resolvedDate,
        updatedAt: serverTimestamp(),
      };

      if (!employee.firestoreId) {
        throw new Error("Employee ID (firestoreId) is missing.");
      }

      const empRef = doc(db, "employees", employee.firestoreId);
      await updateDoc(empRef, updatePayload);

      toast.success(
        isOffSite
          ? `${employee.name} marked as Off-Site until ${resolvedDate}`
          : `${employee.name} marked as Active`,
      );

      onSave({ ...employee, ...updatePayload });
      onClose();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update status in the database.");
    } finally {
      setSaving(false);
    }
  };

  const resolvedDate = getResolvedDate();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="w-[500px] h-full bg-linear-to-b from-[#0B0F1A] to-[#000000] border-l border-[#F0B1004D] p-8 text-white shadow-[0_0_40px_rgba(252,202,0,0.15)] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-[20px] font-semibold capitalize">
              {employee.name}
            </h2>
            <p className="text-sm text-gray-400">Off-Site Configuration</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#1E2939] hover:bg-[#2A3244] transition"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* Toggle */}
        <div className="bg-[#F0B1001A] border border-[#F0B10033] rounded-xl px-6 py-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FiFlag className="text-[#FCCA00] size-5" />
              <div>
                <p className="text-sm text-gray-200 font-medium">
                  Off-Site Status
                </p>
                <p className="text-xs text-gray-500">
                  {isOffSite
                    ? "Employee is currently Off-Site"
                    : "Pause tracking and alerts"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isOffSite}
                onChange={(e) => {
                  setIsOffSite(e.target.checked);
                  if (!e.target.checked) {
                    setReason("");
                    setCustomDate("");
                    setSelectedDateOption("Today");
                  }
                }}
              />
              <div className="w-11 h-6 bg-[#CBCED4] rounded-full peer-checked:bg-[#FCCA00] transition-all" />
              <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full peer-checked:translate-x-full transition-all" />
            </label>
          </div>
        </div>

        {/* Off-Site Fields */}
        {isOffSite && (
          <div className="space-y-5">
            {/* Reason */}
            <div>
              <label className="text-sm text-gray-300 mb-2 block">
                Off-Site Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                value={reason || ""}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Client Visit - City Mall, Bank Work, Supplier Meeting..."
                className="w-full bg-[#1E293980] border border-[#2A3244] rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-500 resize-none h-24 focus:outline-none focus:border-[#FCCA00] transition"
              />
            </div>

            {/* Return Date */}
            <div>
              <label className="text-sm text-gray-300 mb-2 flex items-center gap-2">
                <FiCalendar size={13} className="text-[#FCCA00]" />
                Return Date <span className="text-red-400">*</span>
              </label>

              {/* Date Option Chips */}
              <div className="flex gap-2 mb-3">
                {DATE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setSelectedDateOption(opt);
                      if (opt !== "Custom") setCustomDate("");
                    }}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                      selectedDateOption === opt
                        ? "bg-[#FCCA00] text-black border-[#FCCA00]"
                        : "bg-[#1E293980] text-gray-400 border-[#2A3244] hover:border-[#FCCA00]/50"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>

              {/* Custom date picker */}
              {selectedDateOption === "Custom" && (
                <input
                  type="date"
                  min={getTodayStr()}
                  value={customDate || ""}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full bg-[#1E293980] border border-[#2A3244] rounded-lg px-4 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-[#FCCA00] transition scheme-dark"
                />
              )}

              {/* Resolved date preview */}
              {(selectedDateOption !== "Custom" || customDate) && (
                <div className="mt-2 flex items-center gap-2 text-xs text-[#FCCA00]/80">
                  <FiCheckCircle size={12} />
                  Status will auto-revert to{" "}
                  <strong className="text-[#FCCA00]">Active</strong> on{" "}
                  <strong className="text-[#FCCA00]">{resolvedDate}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reverting to Active info banner */}
        {!isOffSite && employee.status === "Off-Site" && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-5 py-4 mb-6 text-sm text-green-300">
            <p>
              Saving will revert this employee to <strong>Active</strong> and
              clear all Off-Site data.
            </p>
          </div>
        )}

        <div className="mt-8" />

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full font-medium rounded-lg py-2.5 transition shadow-[0_4px_20px_rgba(252,202,0,0.3)] ${
            saving
              ? "bg-[#D1B600] cursor-not-allowed text-black"
              : "bg-[#FCCA00] hover:bg-[#FFD633] text-black"
          }`}
        >
          {saving ? "Saving..." : "Save Status"}
        </button>
      </div>
    </div>
  );
};

export default MarkOffSiteModal;
