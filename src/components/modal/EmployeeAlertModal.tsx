import React from "react";
import { FiAlertTriangle } from "react-icons/fi";
import { GoX } from "react-icons/go";
import { IoLocationOutline } from "react-icons/io5";
import { LuClock } from "react-icons/lu";

interface Props {
  isOpen: boolean;
  employees: any[];
  onClose: () => void;
  shopName: string;
  alertLimit: number;
}

const EmployeeAlertModal: React.FC<Props> = ({
  isOpen,
  employees,
  onClose,
  shopName,
  alertLimit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[#161616CC] backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className="
        relative p-8 w-[450px] rounded-3xl text-white
        bg-linear-to-tr from-[#101828] to-[#030712]
        border-2 border-[#FDC500] shadow-[0_0_40px_#FDC50040]
      "
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-300 hover:text-white bg-[#1E2939] p-2 rounded-full transition"
        >
          <GoX className="size-5" />
        </button>

        {/* Warning Icon */}
        <div className="flex flex-col items-center gap-5">
          <div className="w-20 h-20 flex items-center justify-center rounded-full bg-[#FDC50026] border-[3px] border-[#FDC500] ">
            <FiAlertTriangle className="size-8 text-[#FDC500]" />
          </div>

          <h2 className="text-2xl font-normal leading-8 text-[#FDC500]">
            Alert – Time Exceeded!
          </h2>
        </div>

        {/* Content */}
        <div className="mt-6 space-y-4">
          {employees.length === 0 ? (
            <p className="text-gray-300 text-center text-sm">
              No active alerts.
            </p>
          ) : (
            employees.map((emp, i) => (
              <div
                key={i}
                className="bg-[#1E293980] p-5 rounded-2xl flex flex-col justify-center items-center text-center gap-4"
              >
                <p className="text-base leading-6 px-3 ">
                  Employee{" "}
                  <span className="text-yellow-400 font-semibold">
                    {emp.employee_id}
                  </span>{" "}
                  has been out for{" "}
                  <span className="text-yellow-400 font-semibold">
                    {emp.outDuration}m{" "}
                  </span>
                   exceeding the {alertLimit} minute limit.
                </p>

                <div className="text-sm leading-5 space-y-">
                  <p className="flex items-center gap-2 text-gray-400">
                    <LuClock className="size-4 text-[#FDC500]" /> Total Out:{" "}
                    {emp.outsideSecs ? Math.floor(emp.outsideSecs / 60) : 0}m
                  </p>
                  <p className="flex items-center gap-2 text-gray-400">
                    <IoLocationOutline className="size-4 text-[#FDC500]" />{" "}
                    Store: {shopName}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* View Button */}
        {/* <button
          onClick={onClose}
          className="
            w-full mt-6 py-3 rounded-lg 
            bg-[#FDC500] text-black font-semibold 
            hover:bg-[#e5b400] transition-colors
          "
        >
          View
        </button> */}
      </div>
    </div>
  );
};

export default EmployeeAlertModal;
