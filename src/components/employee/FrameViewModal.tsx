import React from "react";
import { FiX } from "react-icons/fi";

interface FrameViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  frame?: string | null;
  intervals?: { checkin: string; checkout: string }[];
}

const to12Hour = (t: string): string => {
  if (!t) return "—";
  const parts = t.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const FrameViewModal: React.FC<FrameViewModalProps> = ({
  isOpen,
  onClose,
  frame,
  intervals,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="relative w-[90%] max-w-[570px] bg-linear-to-r from-[#101828F2] to-[#030712F2] border border-[#1E293B] rounded-2xl shadow-[0_20px_60px_rgba(253,197,0,0.2)] p-8 space-y-6 text-white">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-2">
            <h2 className="text-[36px] font-normal leading-10 ">Live Feed</h2>
            <p className="text-[#99A1AF] text-base leading-6 ">
              View live feed of the employee's movement.
            </p>
          </div>

          <button
            className="bg-[#1E2939] p-2 rounded-full transition"
            onClick={onClose}
          >
            <FiX className="size-5" />
          </button>
        </div>

        {/* frame preview */}
        <div className="flex justify-center items-center">
          {frame ? (
            <img
              src={frame}
              alt="Employee Frame"
              className="w-full max-h-[500px] object-contain rounded-lg border border-[#1E293B]"
            />
          ) : (
            <p className="text-gray-400 text-center">No live frame available</p>
          )}
        </div>
        {/* Intervals Section */}
        {intervals && intervals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="text-lg font-medium text-[#FDC500]">Presence Intervals</h3>
              <span className="text-xs text-gray-500 uppercase tracking-widest">{intervals.length} Sessions</span>
            </div>
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
              {intervals.map((iv, idx) => (
                <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-gray-600 w-4">{idx + 1}.</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-300">{to12Hour(iv.checkin)}</span>
                      <span className="text-gray-600">→</span>
                      <span className="text-xs font-mono text-white">{iv.checkout ? to12Hour(iv.checkout) : 'Active'}</span>
                    </div>
                  </div>
                  {iv.checkout && (
                    <span className="text-[10px] font-bold text-[#FDC500] bg-[#FDC50010] px-2 py-0.5 rounded border border-[#FDC50020]">
                      Logged
                    </span>
                  )}
                </div>
              )).reverse()}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#FDC500] text-black font-bold rounded-lg hover:scale-105 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FrameViewModal;
