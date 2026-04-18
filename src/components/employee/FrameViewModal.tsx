import React from "react";
import { FiX } from "react-icons/fi";

interface FrameViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  frame?: string | null;
}

const FrameViewModal: React.FC<FrameViewModalProps> = ({
  isOpen,
  onClose,
  frame,
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
      </div>
    </div>
  );
};

export default FrameViewModal;
