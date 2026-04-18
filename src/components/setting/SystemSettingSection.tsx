// import React, { useState } from "react";
// import { FiArrowLeft, FiSave } from "react-icons/fi";
// import BGImage from "../../assets/bg image.jpg";
// import { BiSolidEdit } from "react-icons/bi";
// import { RiDeleteBin6Line } from "react-icons/ri";
// // import { GoBell } from "react-icons/go";
// // import { PiEyeBold } from "react-icons/pi";
// import { useNavigate } from "react-router-dom";

// const SystemSettingSection: React.FC = () => {
//   const [alertDuration, setAlertDuration] = useState(10);
//   // const [alertSound, setAlertSound] = useState(true);
//   // const [visualFlash, setVisualFlash] = useState(false);
//   const [cameras, setCameras] = useState([
//     { name: "Camera-01", location: "Entrance", status: "Active", ip: "" },
//     { name: "Camera-02", location: "Counter Area", status: "Active", ip: "" },
//     { name: "Camera-03", location: "Storage", status: "Offline", ip: "" },
//   ]);
//   const navigate = useNavigate();
//   const [showAddForm, setShowAddForm] = useState(false);
//   const [editIndex, setEditIndex] = useState<number | null>(null);
//   const [formData, setFormData] = useState({ name: "", location: "", ip: "" });

//   const handleSaveCamera = () => {
//     if (!formData.name || !formData.location) return;

//     if (editIndex !== null) {
//       const updated = [...cameras];
//       updated[editIndex] = {
//         ...updated[editIndex],
//         name: formData.name,
//         location: formData.location,
//       };
//       setCameras(updated);
//       setEditIndex(null);
//     } else {
//       setCameras([
//         ...cameras,
//         {
//           name: formData.name,
//           location: formData.location,
//           ip: formData.ip,
//           status: "Active",
//         },
//       ]);
//     }

//     setFormData({ name: "", location: "", ip: "" });
//     setShowAddForm(false);
//   };

//   const handleEditCamera = (index: number) => {
//     const cam = cameras[index];
//     setEditIndex(index);
//     setFormData({
//       name: cam.name || "",
//       location: cam.location || "",
//       ip: cam.ip || "",
//     });
//     setShowAddForm(true);
//   };

//   const handleDeleteCamera = (index: number) => {
//     setCameras(cameras.filter((_, i) => i !== index));
//   };

//   return (
//     <div
//       className="min-h-screen text-white flex flex-col justify-center p-10 bg-cover bg-top bg-no-repeat "
//       style={{
//         backgroundImage: `url(${BGImage})`,
//         backgroundSize: "cover",
//       }}
//     >
//       <div className="w-full max-w-[80%] mx-auto flex flex-col  gap-10">
//         {/* Title Section */}
//         <div className="flex justify-between items-start">
//           <div className="space-y-2">
//             <h1 className="text-[36px] font-normal ">System Settings</h1>
//             <p className="text-[#99A1AF]  text-base">
//               Configure alerts, timing, and camera management for your store.
//             </p>
//           </div>

//           <div className="flex gap-4 mt-4">
//             <button className="flex items-center gap-2 bg-[#FCCA00] text-black px-6 py-2 rounded-md font-medium hover:bg-[#FFD633] transition">
//               <FiSave /> Save Changes
//             </button>
//             <button
//               onClick={() => navigate(-1)}
//               className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition"
//             >
//               <FiArrowLeft /> Back to Dashboard
//             </button>
//           </div>
//         </div>

//         {/* Settings Content */}
//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//           {/* Alert Timing Configuration */}
//           <div className="bg-linear-to-r from-[#101828F2] to-[#0A0E17] border-2 border-[#FDC50033] rounded-2xl p-8 shadow-[0_0_25px_rgba(0,0,0,0.4)] relative overflow-hidden">
//             <div className="border-b border-[#FDC50033] pb-6">
//               <h2 className="text-2xl font-normal mb-2 text-white">
//                 Alert Timing Configuration
//               </h2>
//               <div className="text-sm text-gray-400 space-y-1">
//                 <p>
//                   Set the maximum allowed outing time before triggering an
//                   alert.{" "}
//                 </p>
//                 <p className="text-[#FDC500] font-normal ">
//                   Default: 10 minutes
//                 </p>
//               </div>
//             </div>

//             {/* Duration Control */}
//             <div className="pt-6">
//               <p className="text-sm text-gray-300 mb-3">Set Alert Duration</p>

//               {/* Duration Box */}
//               <div className="bg-[#0F172A]/80 border border-[#1E293B] rounded-xl px-6 py-6 mb-4">
//                 <div className="flex items-center justify-between mb-4">
//                   <label className="text-sm text-gray-400">Duration:</label>
//                   <p className="text-[#FCCA00] text-3xl font-semibold">
//                     {alertDuration} min
//                   </p>
//                 </div>

//                 {/* Custom Slider */}
//                 <div className="relative w-full">
//                   {/* Background track (light section) */}
//                   <div className="absolute top-1/2 left-0 w-full h-3 bg-[#E5E7EB] rounded-full -translate-y-1/2"></div>

//                   {/* Filled section (dark portion before thumb) */}
//                   <div
//                     className="absolute top-1/2 left-0 h-3 bg-[#0B0F1A] rounded-full -translate-y-1/2 transition-all duration-200"
//                     style={{ width: `${(alertDuration / 60) * 100}%` }}
//                   ></div>

//                   {/* Range input */}
//                   <input
//                     type="range"
//                     min="1"
//                     max="60"
//                     value={alertDuration}
//                     onChange={(e) => setAlertDuration(Number(e.target.value))}
//                     className="w-full appearance-none bg-transparent relative z-10 cursor-pointer"
//                   />

//                   {/* Custom thumb styles */}
//                   <style>
//                     {`
//                       input[type="range"] {
//                         -webkit-appearance: none;
//                         appearance: none;
//                         height: 12px;
//                         background: transparent;
//                       }

//                       /* Chrome, Safari, Edge */
//                       input[type="range"]::-webkit-slider-thumb {
//                         -webkit-appearance: none;
//                         height: 14px;
//                         width: 14px;
//                         border-radius: 50%;
//                         background: #fff;
//                         border: none;
//                         box-shadow: 0 0 4px rgba(0,0,0,0.5);
//                         cursor: pointer;
//                         position: relative;
//                         z-index: 20;
//                       }

//                       /* Firefox */
//                       input[type="range"]::-moz-range-thumb {
//                         height: 14px;
//                         width: 14px;
//                         border-radius: 50%;
//                         background: #fff;
//                         border: none;
//                         box-shadow: 0 0 4px rgba(0,0,0,0.5);
//                         cursor: pointer;
//                       }

//                       /* Remove extra focus outline */
//                       input[type="range"]:focus {
//                         outline: none;
//                       }
//                     `}
//                   </style>
//                 </div>

//                 {/* Slider Labels */}
//                 <div className="flex justify-between text-xs text-gray-500 mt-2">
//                   <span>1 min</span>
//                   <span>30 min</span>
//                   <span>60 min</span>
//                 </div>
//               </div>

//               {/* Info Box
//               <div className="flex items-start gap-2 bg-[#FCCA0010] border border-[#FCCA0040] text-[#FCCA00] text-xs p-3 rounded-md">
//                 <span className="mt-px">⚠</span>
//                 <p className="text-gray-300 text-[13px] leading-relaxed">
//                   If an employee is out longer than this time, an alert will be
//                   triggered.
//                 </p>
//               </div> */}
//             </div>

//             {/* Toggles */}
//             {/* <div className="mt-6 flex flex-col gap-4">

//               <div className="flex items-center justify-between bg-[#1E29394D] rounded-xl px-5 py-4">
//                 <div className="flex items-center gap-3">
//                   <GoBell className="size-6 text-[#FDC500]" />
//                   <div className="space-y-1">
//                     <p className="text-base font-medium text-gray-100">
//                       Enable Alert Sound
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       Play audio notification when alert triggers
//                     </p>
//                   </div>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={alertSound}
//                     onChange={() => setAlertSound(!alertSound)}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-[#4B5563] rounded-full peer-checked:bg-[#FCCA00] transition-all"></div>
//                   <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full peer-checked:translate-x-full transition-all"></div>
//                 </label>
//               </div>

//               <div className="flex items-center justify-between bg-[#1E29394D] rounded-xl px-5 py-4">
//                 <div className="flex items-center gap-3">
//                   <PiEyeBold className="size-6 text-[#FDC500]" />
//                   <div className="space-y-1">
//                     <p className="text-base font-medium text-gray-100">
//                       Show Visual Flash
//                     </p>
//                     <p className="text-sm text-gray-500">
//                       Display flashing alert banner on dashboard
//                     </p>
//                   </div>
//                 </div>
//                 <label className="relative inline-flex items-center cursor-pointer">
//                   <input
//                     type="checkbox"
//                     checked={visualFlash}
//                     onChange={() => setVisualFlash(!visualFlash)}
//                     className="sr-only peer"
//                   />
//                   <div className="w-11 h-6 bg-[#4B5563] rounded-full peer-checked:bg-[#FCCA00] transition-all"></div>
//                   <div className="absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full peer-checked:translate-x-full transition-all"></div>
//                 </label>
//               </div>
//             </div> */}
//           </div>

//           {/* Camera Management */}
//           <div className="bg-linear-to-r from-[#101828F2] to-[#0A0E17] border-2 border-[#FDC50033] rounded-2xl p-8 space-y-8 shadow-[0_0_25px_rgba(0,0,0,0.35)] backdrop-blur-sm">
//             {/* Header */}
//             <div className="border-b border-[#FDC50033] pb-6">
//               <h2 className="text-2xl font-normal mb-2 text-white">
//                 Camera Management
//               </h2>
//               <div className="text-sm text-gray-400">
//                 <p>Add, rename, or remove cameras assigned to this store.</p>
//                 <p>
//                   Each camera will be linked to specific zones for staff
//                   tracking.
//                 </p>
//               </div>
//             </div>

//             {/* Camera Table */}
//             <div className="overflow-hidden rounded-xl bg-[#1E29394D]">
//               <table className="w-full text-sm">
//                 <thead className="text-gray-400 text-left uppercase tracking-wide">
//                   <tr>
//                     <th className="px-6 py-5 font-medium">Camera Name</th>
//                     <th className="px-6 py-5 font-medium">Location</th>
//                     <th className="px-6 py-5 font-medium">Status</th>
//                     <th className="px-6 py-5 font-medium">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {cameras.map((cam, index) => (
//                     <tr
//                       key={index}
//                       className="border-t border-[#2A3244] text-gray-300 hover:bg-[#1E293980] transition-all duration-200"
//                     >
//                       <td className="px-6 py-3.5 font-medium text-white">
//                         {cam.name}
//                       </td>
//                       <td className="px-6 py-3.5 text-gray-400">
//                         {cam.location}
//                       </td>
//                       <td className="px-6 py-3.5">
//                         <div className="flex items-center gap-2">
//                           <span
//                             className={`w-2.5 h-2.5 rounded-full ${
//                               cam.status === "Active"
//                                 ? "bg-green-500"
//                                 : "bg-red-500"
//                             }`}
//                           ></span>
//                           <span
//                             className={`text-sm font-medium ${
//                               cam.status === "Active"
//                                 ? "text-green-400"
//                                 : "text-red-400"
//                             }`}
//                           >
//                             {cam.status}
//                           </span>
//                         </div>
//                       </td>
//                       <td className="px-6 py-3 flex items-center gap-3">
//                         <button
//                           onClick={() => handleEditCamera(index)}
//                           className="p-2 rounded-md bg-[#1E293B]/60 hover:bg-[#273246] transition-all"
//                         >
//                           <BiSolidEdit className="size-5" />
//                         </button>
//                         <button
//                           onClick={() => handleDeleteCamera(index)}
//                           className="p-2 rounded-md bg-[#FB2C361A] text-[#FF6467] hover:bg-[#4B1E1E]/80 transition-all"
//                         >
//                           <RiDeleteBin6Line className="size-5" />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>

//             {/* Add Camera Button */}
//             <button
//               onClick={() => setShowAddForm(!showAddForm)}
//               className="mt-6 w-full flex items-center justify-center gap-3 bg-[#FCCA00] hover:bg-[#FFD633] text-black font-medium rounded-lg py-3 transition-all duration-200"
//             >
//               <span className="text-lg leading-none">+</span>
//               Add New Camera
//             </button>

//             {/* Add New Camera Form */}
//             {showAddForm && (
//               <div className="bg-[#0F172A]/60 border border-[#2A3244] rounded-xl p-6 space-y-5 transition-all duration-300">
//                 <div className="flex items-center gap-2 text-[#FCCA00] font-medium">
//                   <i className="fas fa-camera text-lg"></i>
//                   <span>Add New Camera</span>
//                 </div>

//                 <div className="space-y-4">
//                   <div>
//                     <label className="text-sm text-gray-300">Camera Name</label>
//                     <input
//                       type="text"
//                       value={formData.name}
//                       onChange={(e) =>
//                         setFormData({ ...formData, name: e.target.value })
//                       }
//                       placeholder="e.g., Camera-04"
//                       className="w-full mt-1 bg-transparent border border-[#2A3244] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#FCCA00] outline-none"
//                     />
//                   </div>

//                   <div>
//                     <label className="text-sm text-gray-300">Location</label>
//                     <input
//                       type="text"
//                       value={formData.location}
//                       onChange={(e) =>
//                         setFormData({ ...formData, location: e.target.value })
//                       }
//                       placeholder="Select location"
//                       className="w-full mt-1 bg-transparent border border-[#2A3244] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#FCCA00] outline-none"
//                     />
//                   </div>

//                   <div>
//                     <label className="text-sm text-gray-300">
//                       IP Address / ID (Optional)
//                     </label>
//                     <input
//                       type="text"
//                       value={formData.ip}
//                       onChange={(e) =>
//                         setFormData({ ...formData, ip: e.target.value })
//                       }
//                       placeholder="e.g., 192.168.1.104"
//                       className="w-full mt-1 bg-transparent border border-[#2A3244] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-[#FCCA00] outline-none"
//                     />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 items-center gap-4">
//                   <button
//                     onClick={handleSaveCamera}
//                     className="bg-[#FCCA00] hover:bg-[#FFD633] text-black font-medium rounded-md py-2 px-6 transition-all duration-200"
//                   >
//                     Save Camera
//                   </button>
//                   <button
//                     onClick={() => {
//                       setShowAddForm(false);
//                       setFormData({ name: "", location: "", ip: "" });
//                     }}
//                     className="bg-white text-black font-medium rounded-md py-2 px-6 hover:bg-gray-100 transition-all duration-200"
//                   >
//                     Cancel
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SystemSettingSection;

import React, { useState, useEffect, useRef } from "react";
import { FiArrowLeft } from "react-icons/fi";
import BGImage from "../../assets/bg image.jpg";
import { BiSolidEdit } from "react-icons/bi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { FiX, FiSave } from "react-icons/fi";
import { MOCK_SHOPS } from "../../data/mockData";

// ─── Camera Modal ─────────────────────────────────────────────────────────────
interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData: {
    id: string;
    name: string;
    location: string;
    ip: string;
    status: string;
  } | null;
  onSaved: () => void;
  shopId?: string; // Optional since shops are removed
}

const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  editData,
  onSaved,
  shopId,
}) => {
  const [formData, setFormData] = useState({ name: "", location: "", ip: "" });
  const [errors, setErrors] = useState({ name: "", location: "", ip: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name,
        location: editData.location,
        ip: editData.ip,
      });
    } else {
      setFormData({ name: "", location: "", ip: "" });
    }
    setErrors({ name: "", location: "", ip: "" });
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = { name: "", location: "", ip: "" };
    if (!formData.name.trim()) newErrors.name = "Camera name is required";
    if (!formData.location.trim()) newErrors.location = "Location is required";
    if (!formData.ip.trim()) newErrors.ip = "IP Address is required";
    setErrors(newErrors);
    return !newErrors.name && !newErrors.location && !newErrors.ip;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      toast.success(editData ? "Camera updated (Mock)." : "Camera added (Mock).");
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save camera.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[90%] max-w-[500px] bg-linear-to-b from-[#101828] to-[#030712] border border-[#FDC50033] rounded-2xl p-8 text-white shadow-[0_0_40px_rgba(252,202,0,0.15)]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-normal">
              {editData ? "Edit Camera" : "Add New Camera"}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              {editData
                ? "Update the camera details below."
                : "Fill in the details to register a new camera."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-[#1E2939] hover:bg-[#2A3244] transition"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {[
            {
              key: "name",
              label: "Camera Name",
              placeholder: "e.g., Camera-04",
            },
            {
              key: "location",
              label: "Location",
              placeholder: "e.g., Entrance, Counter Area",
            },
            {
              key: "ip",
              label: "IP Address",
              placeholder: "e.g., 192.168.1.104",
            },
          ].map((field) => (
            <div key={field.key}>
              <label className="text-sm text-gray-300 mb-1 block">
                {field.label} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={(formData as any)[field.key]}
                onChange={(e) => {
                  setFormData({ ...formData, [field.key]: e.target.value });
                  setErrors((p) => ({ ...p, [field.key]: "" }));
                }}
                placeholder={field.placeholder}
                className={`w-full bg-[#1E293980] border rounded-md px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none transition ${
                  (errors as any)[field.key]
                    ? "border-red-500"
                    : "border-[#2A3244] focus:border-[#FCCA00]"
                }`}
              />
              {(errors as any)[field.key] && (
                <p className="text-red-400 text-xs mt-1">
                  {(errors as any)[field.key]}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className="flex-1 bg-white text-black font-medium rounded-lg py-2.5 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 font-medium rounded-lg py-2.5 transition ${
              saving
                ? "bg-[#D1B600] cursor-not-allowed text-black"
                : "bg-[#FCCA00] hover:bg-[#FFD633] text-black"
            }`}
          >
            {saving ? "Saving..." : editData ? "Update Camera" : "Save Camera"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
interface DeleteModalProps {
  isOpen: boolean;
  cameraName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteModalProps> = ({
  isOpen,
  cameraName,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[90%] max-w-[420px] bg-linear-to-b from-[#101828] to-[#030712] border border-red-500/30 rounded-2xl p-8 text-white shadow-[0_0_30px_rgba(251,44,54,0.2)] text-center">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-500/10 rounded-full border border-red-500/30">
            <RiDeleteBin6Line className="text-red-400 size-8" />
          </div>
        </div>
        <h2 className="text-xl font-semibold mb-2">Delete Camera?</h2>
        <p className="text-gray-400 text-sm mb-8">
          Are you sure you want to remove{" "}
          <span className="text-[#FCCA00] font-medium">{cameraName}</span>? This
          action cannot be undone.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-white text-black font-medium rounded-lg py-2.5 hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg py-2.5 transition"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Section ─────────────────────────────────────────────────────────────
const SystemSettingSection: React.FC = () => {
  const [alertDuration, setAlertDuration] = useState(10);
  const [isSavingAlertDuration, setIsSavingAlertDuration] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoad = useRef(true);

  const [cameras, setCameras] = useState<any[]>([]);
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [editCamera, setEditCamera] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Default to 15 mins since shops are removed
    setAlertDuration(15);
    isFirstLoad.current = false;
  }, []);

  useEffect(() => {
    if (isFirstLoad.current) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsSavingAlertDuration(true);
      try {
        // Mock save
        setSavedIndicator(true);
        setTimeout(() => setSavedIndicator(false), 2000);
      } catch (err) {
        console.error("Failed to save alert duration:", err);
      } finally {
        setIsSavingAlertDuration(false);
      }
    }, 600);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [alertDuration]);

  useEffect(() => {
    setCameras([
      { id: "C1", name: "Entrance Cam", location: "Entrance", status: "Active" },
      { id: "C2", name: "Counter Cam", location: "Counter", status: "Active" }
    ]);
  }, []);

  const handleDeleteCamera = async () => {
    if (!deleteTarget) return;
    setCameras(prev => prev.filter(c => c.id !== deleteTarget.id));
    toast.success(`${deleteTarget.name} deleted (Mock).`);
    setDeleteTarget(null);
  };

  return (
    <div
      className="min-h-screen text-white flex flex-col justify-center p-10 bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url(${BGImage})`, backgroundSize: "cover" }}
    >
      <div className="w-full max-w-[80%] mx-auto flex flex-col gap-10">
        {/* Title */}
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <h1 className="text-[36px] font-normal">System Settings</h1>
            <p className="text-[#99A1AF] text-base">
              Configure alerts, timing, and camera management for your store.
            </p>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded-md font-medium hover:bg-gray-100 transition"
            >
              <FiArrowLeft /> Back to Dashboard
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Alert Timing ── */}
          <div className="bg-linear-to-r from-[#101828F2] to-[#0A0E17] border-2 border-[#FDC50033] rounded-2xl p-8 shadow-[0_0_25px_rgba(0,0,0,0.4)]">
            <div className="border-b border-[#FDC50033] pb-6">
              <h2 className="text-2xl font-normal mb-2">
                Alert Timing Configuration
              </h2>
              <div className="text-sm text-gray-400 space-y-1">
                <p>
                  Set the maximum allowed outing time before triggering an
                  alert.
                </p>
                <p className="text-[#FDC500] font-normal">
                  Default: 10 minutes
                </p>
              </div>
            </div>

            <div className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-300">Set Alert Duration</p>
                {/* Live save indicator */}
                <div className="flex items-center gap-2 text-xs">
                  {isSavingAlertDuration && (
                    <span className="text-[#FCCA00] animate-pulse flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#FCCA00] inline-block animate-ping" />
                      Saving...
                    </span>
                  )}
                  {savedIndicator && !isSavingAlertDuration && (
                    <span className="text-green-400 flex items-center gap-1">
                      <FiSave size={11} /> Saved
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#0F172A]/80 border border-[#1E293B] rounded-xl px-6 py-6 mb-4">
                <div className="flex items-center justify-between mb-6">
                  <label className="text-sm text-gray-400">Duration:</label>
                  <p className="text-[#FCCA00] text-3xl font-semibold">
                    {alertDuration} min
                  </p>
                </div>

                {/* Slider */}
                <div className="relative w-full">
                  <div className="absolute top-1/2 left-0 w-full h-3 bg-[#E5E7EB] rounded-full -translate-y-1/2" />
                  <div
                    className="absolute top-1/2 left-0 h-3 bg-[#0B0F1A] rounded-full -translate-y-1/2 transition-all duration-100"
                    style={{ width: `${((alertDuration - 1) / 59) * 100}%` }}
                  />
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={alertDuration}
                    onChange={(e) => setAlertDuration(Number(e.target.value))}
                    className="w-full appearance-none bg-transparent relative z-10 cursor-pointer"
                  />
                  <style>{`
                    input[type="range"] { -webkit-appearance: none; appearance: none; height: 12px; background: transparent; }
                    input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; border-radius: 50%; background: #FCCA00; border: 3px solid #fff; box-shadow: 0 0 8px rgba(252,202,0,0.5); cursor: pointer; }
                    input[type="range"]::-moz-range-thumb { height: 20px; width: 20px; border-radius: 50%; background: #FCCA00; border: 3px solid #fff; box-shadow: 0 0 8px rgba(252,202,0,0.5); cursor: pointer; }
                    input[type="range"]:focus { outline: none; }
                  `}</style>
                </div>

                {/* Tick marks */}
                <div className="flex justify-between text-xs text-gray-500 mt-3">
                  <span>1 min</span>
                  <span>15 min</span>
                  <span>30 min</span>
                  <span>45 min</span>
                  <span>60 min</span>
                </div>
              </div>

              {/* Quick presets */}
              <div className="flex gap-2 flex-wrap">
                {[5, 10, 15, 20, 30].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAlertDuration(val)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      alertDuration === val
                        ? "bg-[#FCCA00] text-black border-[#FCCA00]"
                        : "bg-[#1E293980] text-gray-400 border-[#2A3244] hover:border-[#FCCA00]/50"
                    }`}
                  >
                    {val} min
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Camera Management ── */}
          <div className="bg-linear-to-r from-[#101828F2] to-[#0A0E17] border-2 border-[#FDC50033] rounded-2xl p-8 space-y-6 shadow-[0_0_25px_rgba(0,0,0,0.35)] backdrop-blur-sm">
            <div className="border-b border-[#FDC50033] pb-6">
              <h2 className="text-2xl font-normal mb-2">Camera Management</h2>
              <div className="text-sm text-gray-400">
                <p>Add, rename, or remove cameras assigned to this store.</p>
                <p>
                  Each camera will be linked to specific zones for staff
                  tracking.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl bg-[#1E29394D]">
              {cameras.length === 0 ? (
                <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
                  No cameras added yet.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-gray-400 text-left uppercase tracking-wide">
                    <tr>
                      <th className="px-6 py-5 font-medium">Camera Name</th>
                      <th className="px-6 py-5 font-medium">Location</th>
                      <th className="px-6 py-5 font-medium">Status</th>
                      <th className="px-6 py-5 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cameras.map((cam) => (
                      <tr
                        key={cam.id}
                        className="border-t border-[#2A3244] text-gray-300 hover:bg-[#1E293980] transition-all duration-200"
                      >
                        <td className="px-6 py-3.5 font-medium text-white">
                          {cam.name}
                        </td>
                        <td className="px-6 py-3.5 text-gray-400">
                          {cam.location}
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${cam.status === "Active" ? "bg-green-500" : "bg-red-500"}`}
                            />
                            <span
                              className={`text-sm font-medium ${cam.status === "Active" ? "text-green-400" : "text-red-400"}`}
                            >
                              {cam.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-3 flex items-center gap-3">
                          <button
                            onClick={() => {
                              setEditCamera(cam);
                              setCameraModalOpen(true);
                            }}
                            className="p-2 rounded-md bg-[#1E293B]/60 hover:bg-[#273246] transition-all"
                          >
                            <BiSolidEdit className="size-5" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(cam)}
                            className="p-2 rounded-md bg-[#FB2C361A] text-[#FF6467] hover:bg-[#4B1E1E]/80 transition-all"
                          >
                            <RiDeleteBin6Line className="size-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <button
              onClick={() => {
                setEditCamera(null);
                setCameraModalOpen(true);
              }}
              className="w-full flex items-center justify-center gap-3 bg-[#FCCA00] hover:bg-[#FFD633] text-black font-medium rounded-lg py-3 transition-all duration-200"
            >
              <span className="text-lg leading-none">+</span>
              Add New Camera
            </button>
          </div>
        </div>
      </div>

      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => {
          setCameraModalOpen(false);
          setEditCamera(null);
        }}
        editData={editCamera}
        onSaved={() => {
          setCameraModalOpen(false);
          setEditCamera(null);
        }}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        cameraName={deleteTarget?.name || ""}
        onConfirm={handleDeleteCamera}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default SystemSettingSection;
