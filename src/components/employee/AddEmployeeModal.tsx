import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiUpload, FiX, FiZoomIn, FiZoomOut, FiCheck } from "react-icons/fi";
import { MdCropFree } from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../../firebase/config";
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

// ── 1:1 Image Crop Component ──────────────────────────────────────────────────
interface CropperProps {
  imageSrc: string;
  onCropDone: (croppedBase64: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<CropperProps> = ({
  imageSrc,
  onCropDone,
  onCancel,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef({ mx: 0, my: 0, ox: 0, oy: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);

  const CANVAS_SIZE = 320;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const fitScale = Math.max(
        CANVAS_SIZE / img.width,
        CANVAS_SIZE / img.height,
      );
      const s = Math.max(fitScale, 1);
      setScale(s);
      setOffset({
        x: (CANVAS_SIZE - img.width * s) / 2,
        y: (CANVAS_SIZE - img.height * s) / 2,
      });
      setImgLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    if (!imgLoaded || !imgRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(
      imgRef.current,
      offset.x,
      offset.y,
      imgRef.current.width * scale,
      imgRef.current.height * scale,
    );
  }, [scale, offset, imgLoaded]);

  const onMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    dragStart.current = {
      mx: e.clientX,
      my: e.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !imgRef.current) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      const newX = dragStart.current.ox + dx;
      const newY = dragStart.current.oy + dy;
      const imgW = imgRef.current.width * scale;
      const imgH = imgRef.current.height * scale;
      setOffset({
        x: Math.min(0, Math.max(CANVAS_SIZE - imgW, newX)),
        y: Math.min(0, Math.max(CANVAS_SIZE - imgH, newY)),
      });
    },
    [dragging, scale],
  );
  const onMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const touchStart = useRef({ tx: 0, ty: 0, ox: 0, oy: 0 });
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = {
      tx: t.clientX,
      ty: t.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  };
  const onTouchMove = (e: React.TouchEvent) => {
    if (!imgRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.tx;
    const dy = t.clientY - touchStart.current.ty;
    const newX = touchStart.current.ox + dx;
    const newY = touchStart.current.oy + dy;
    const imgW = imgRef.current.width * scale;
    const imgH = imgRef.current.height * scale;
    setOffset({
      x: Math.min(0, Math.max(CANVAS_SIZE - imgW, newX)),
      y: Math.min(0, Math.max(CANVAS_SIZE - imgH, newY)),
    });
  };

  const zoomIn = () => {
    if (!imgRef.current) return;
    const newScale = Math.min(scale * 1.15, 5);
    const imgW = imgRef.current.width * newScale;
    const imgH = imgRef.current.height * newScale;
    setScale(newScale);
    setOffset((prev) => ({
      x: Math.min(
        0,
        Math.max(
          CANVAS_SIZE - imgW,
          prev.x - (imgRef.current!.width * (newScale - scale)) / 2,
        ),
      ),
      y: Math.min(
        0,
        Math.max(
          CANVAS_SIZE - imgH,
          prev.y - (imgRef.current!.height * (newScale - scale)) / 2,
        ),
      ),
    }));
  };

  const zoomOut = () => {
    if (!imgRef.current) return;
    const minScale = Math.max(
      CANVAS_SIZE / imgRef.current.width,
      CANVAS_SIZE / imgRef.current.height,
    );
    const newScale = Math.max(scale / 1.15, minScale);
    const imgW = imgRef.current.width * newScale;
    const imgH = imgRef.current.height * newScale;
    setScale(newScale);
    setOffset((prev) => ({
      x: Math.min(0, Math.max(CANVAS_SIZE - imgW, prev.x)),
      y: Math.min(0, Math.max(CANVAS_SIZE - imgH, prev.y)),
    }));
  };

  const handleCrop = () => {
    if (!canvasRef.current) return;
    const out = document.createElement("canvas");
    out.width = 400;
    out.height = 400;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(
      canvasRef.current,
      0,
      0,
      CANVAS_SIZE,
      CANVAS_SIZE,
      0,
      0,
      400,
      400,
    );
    onCropDone(out.toDataURL("image/jpeg", 0.92));
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-linear-to-br from-[#101828] to-[#030712] border-2 border-[#FDC500] rounded-2xl shadow-[0_0_40px_#FDC50033] p-6 flex flex-col items-center gap-5 w-[420px]">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <MdCropFree className="text-[#FDC500] size-5" />
            <h3 className="text-white text-lg font-normal">Crop Photo</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white bg-[#1E2939] p-1.5 rounded-full transition"
          >
            <FiX className="size-4" />
          </button>
        </div>

        <p className="text-[#99A1AF] text-xs text-center">
          Drag to reposition · Zoom to fit · Result will be a 1:1 square
        </p>

        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-xl border-2 border-[#FDC500] shadow-[0_0_24px_#FDC50040]"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            cursor: dragging ? "grabbing" : "grab",
          }}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
        >
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            className="block"
          />
          {[
            "top-0 left-0",
            "top-0 right-0",
            "bottom-0 left-0",
            "bottom-0 right-0",
          ].map((pos, i) => (
            <div
              key={i}
              className={`absolute ${pos} w-6 h-6 border-[#FDC500] ${
                i === 0
                  ? "border-t-2 border-l-2 rounded-tl-md"
                  : i === 1
                    ? "border-t-2 border-r-2 rounded-tr-md"
                    : i === 2
                      ? "border-b-2 border-l-2 rounded-bl-md"
                      : "border-b-2 border-r-2 rounded-br-md"
              }`}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <div className="w-px h-12 bg-[#FDC500] absolute" />
            <div className="h-px w-12 bg-[#FDC500] absolute" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={zoomOut}
            className="flex items-center gap-1.5 bg-[#1E2939] hover:bg-[#293548] text-white px-4 py-2 rounded-lg text-sm transition border border-[#364153]"
          >
            <FiZoomOut className="size-4" /> Zoom Out
          </button>
          <span className="text-xs text-[#99A1AF] w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="flex items-center gap-1.5 bg-[#1E2939] hover:bg-[#293548] text-white px-4 py-2 rounded-lg text-sm transition border border-[#364153]"
          >
            <FiZoomIn className="size-4" /> Zoom In
          </button>
        </div>

        <div className="flex w-full gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-white text-black font-medium text-sm hover:bg-gray-100 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="flex-1 py-2.5 rounded-lg bg-[#FCCA00] hover:bg-[#FFD633] text-black font-medium text-sm transition flex items-center justify-center gap-2"
          >
            <FiCheck className="size-4" /> Use This Photo
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Employee ID Field with real-time duplicate check ─────────────────────────
type IdStatus = "idle" | "checking" | "available" | "taken";

interface EmpIdInputProps {
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  error: string;
  idStatus: IdStatus;
}

const EmpIdInput: React.FC<EmpIdInputProps> = ({
  value,
  onChange,
  onBlur,
  error,
  idStatus,
}) => {
  // Block non-digits and enforce max 3 characters
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const borderClass =
    error || idStatus === "taken"
      ? "border-red-500 focus:border-red-500"
      : idStatus === "available"
        ? "border-green-500 focus:border-green-500"
        : "border-[#364153] focus:border-[#FCCA00]";

  return (
    <div className="space-y-2">
      <label className="block text-sm text-[#D1D5DC]">
        Employee ID / Name
      </label>

      <div className="relative">
        <input
          type="text"
          placeholder="e.g. John Doe or 001"
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          className={`w-full px-4 py-2 pr-10 rounded-md bg-[#1E293980] border placeholder-gray-500 text-gray-200 focus:outline-none transition ${borderClass}`}
        />

        {/* Inline status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {idStatus === "checking" && (
            <svg
              className="animate-spin size-4 text-[#FCCA00]"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8z"
              />
            </svg>
          )}
          {idStatus === "available" && (
            <FiCheck className="size-4 text-green-400" />
          )}
          {idStatus === "taken" && <FiX className="size-4 text-red-400" />}
        </div>
      </div>

      {/* Hint / status message */}
      {error ? (
        <p className="text-red-400 text-xs">{error}</p>
      ) : idStatus === "checking" ? (
        <p className="text-[#FCCA00] text-xs">Checking availability…</p>
      ) : idStatus === "available" ? (
        <p className="text-green-400 text-xs flex items-center gap-1">
          <FiCheck className="size-3" /> Employee ID is available
        </p>
      ) : idStatus === "taken" ? (
        <p className="text-red-400 text-xs flex items-center gap-1">
          <FiX className="size-3" /> This Employee ID already exists in the
          database
        </p>
      ) : (
        <p className="text-[#4A5565] text-xs">
          Enter a unique identifier for the employee
        </p>
      )}
    </div>
  );
};

// ── Main Modal ─────────────────────────────────────────────────────────────────
const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  editData,
}) => {
  const [croppedPhotos, setCroppedPhotos] = useState<string[]>([]);
  const [cropperSrc, setCropperSrc] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    employeeId: "",
    role: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({
    fullName: "",
    employeeId: "",
    photo: "",
  });

  const [idStatus, setIdStatus] = useState<IdStatus>("idle");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Duplicate ID check using Firestore ────────────────────────────
  const checkIdExists = async (id: string): Promise<boolean> => {
    if (!id) return false;
    // If editing and ID hasn't changed, ignore check
    if (editData && editData.employeeId === id) return false;
    
    try {
      const docRef = doc(db, "employees", id);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (err) {
      console.error("Error checking ID existence:", err);
      return false;
    }
  };

  // ── Employee ID change handler (debounced check) ─────────────────────────
  const handleEmployeeIdChange = (val: string) => {
    setFormData((prev) => ({ ...prev, employeeId: val }));
    setErrors((prev) => ({ ...prev, employeeId: "" }));
    setIdStatus("idle");

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (val.length >= 1) {
      setIdStatus("checking");
      debounceTimer.current = setTimeout(async () => {
        try {
          const exists = await checkIdExists(val);
          setIdStatus(exists ? "taken" : "available");
        } catch {
          setIdStatus("idle");
        }
      }, 600);
    }
  };

  // Check on blur (handles the case where user tabs away quickly)
  const handleEmployeeIdBlur = async () => {
    if (formData.employeeId.length >= 1 && idStatus === "idle") {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      setIdStatus("checking");
      try {
        const exists = await checkIdExists(formData.employeeId);
        setIdStatus(exists ? "taken" : "available");
      } catch {
        setIdStatus("idle");
      }
    }
  };

  // ── Validation ───────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e = { fullName: "", employeeId: "", photo: "" };

    if (!formData.fullName.trim()) {
      e.fullName = "Full Name is required";
    }

    const id = formData.employeeId;
    if (!id) {
      e.employeeId = "Employee ID is required";
    } else if (idStatus === "taken") {
      e.employeeId = "This Employee ID already exists in the database";
    } else if (idStatus === "checking") {
      e.employeeId = "Please wait — still checking availability";
    } else if (idStatus === "idle") {
      // Not yet checked — treat as unknown, block save
      e.employeeId = "Please wait for ID validation to complete";
    }

    if (croppedPhotos.length === 0) {
      e.photo = "Please upload at least one photo";
    }

    setErrors(e);
    return !e.fullName && !e.employeeId && !e.photo;
  };

  // ── Reset on modal open/editData change ──────────────────────────────────
  useEffect(() => {
    if (editData) {
      setFormData({
        fullName: editData.name || "",
        employeeId: editData.employeeId || "",
        role: editData.role || "",
        phone: editData.phone || "",
      });
      setCroppedPhotos(
        Array.isArray(editData.photos) && editData.photos.length > 0
          ? editData.photos
          : editData.photo
            ? [editData.photo]
            : [],
      );
      // Own ID is always "available" in edit mode (we exclude it from the check)
      setIdStatus(editData.employeeId ? "available" : "idle");
    } else {
      setFormData({
        fullName: "",
        employeeId: "",
        role: "",
        phone: "",
      });
      setCroppedPhotos([]);
      setIdStatus("idle");
    }
    setErrors({ fullName: "", employeeId: "", photo: "" });
    setCropperSrc(null);
  }, [editData, isOpen]);

  if (!isOpen) return null;

  // ── Photo handlers ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setCropperSrc(URL.createObjectURL(files[0]));
    e.target.value = "";
  };

  const handleCropDone = (base64: string) => {
    setCroppedPhotos((prev) => [...prev, base64]);
    setCropperSrc(null);
    setErrors((prev) => ({ ...prev, photo: "" }));
  };

  const removePhoto = (index: number) => {
    setCroppedPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Save to Firestore ────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const employeeRef = doc(db, "employees", formData.employeeId);
      
      const payload = {
        name: formData.fullName,
        employeeId: formData.employeeId,
        role: formData.role,
        phone: formData.phone,
        photos: croppedPhotos,
        photo: croppedPhotos[0] || "", // Use first photo as primary
        status: editData?.status || "Active",
        updatedAt: serverTimestamp(),
      };

      if (editData?.firestoreId && editData.firestoreId !== formData.employeeId) {
        // If ID changed, we need to delete the old document and create a new one
        await setDoc(employeeRef, { ...payload, createdAt: editData.createdAt || serverTimestamp() });
        await deleteDoc(doc(db, "employees", editData.firestoreId));
      } else {
        // Just update or create
        await setDoc(employeeRef, { 
          ...payload, 
          createdAt: editData?.createdAt || serverTimestamp() 
        }, { merge: true });
      }

      toast.success(editData ? "Employee updated successfully!" : "Employee added successfully!");
      onClose();
    } catch (err) {
      console.error("Error saving employee:", err);
      toast.error("Error saving employee. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const isSaveDisabled =
    saving || idStatus === "checking" || idStatus === "taken";

  return (
    <>
      {cropperSrc && (
        <ImageCropper
          imageSrc={cropperSrc}
          onCropDone={handleCropDone}
          onCancel={() => setCropperSrc(null)}
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="relative w-[90%] max-w-[920px] bg-linear-to-r from-[#101828F2] to-[#030712F2] border border-[#1E293B] rounded-2xl shadow-[0_20px_60px_rgba(253,197,0,0.2)] p-8 space-y-6 text-white max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-2">
              <h2 className="text-[36px] font-normal leading-10">
                {editData ? "Edit Employee" : "Add New Employee"}
              </h2>
              <p className="text-[#99A1AF] text-base leading-6">
                {editData
                  ? "Modify the details or update existing employee information."
                  : "Complete the form below to add a new employee to the system."}
              </p>
            </div>
            <button
              className="bg-[#1E2939] p-2 rounded-full transition"
              onClick={onClose}
            >
              <FiX className="size-5" />
            </button>
          </div>

          <div className="space-y-8 p-6">
            {/* ── Profile Information ── */}
            <div className="space-y-6">
              <h3 className="text-xl font-normal leading-7 border-b border-[#1E2939] pb-4">
                Profile Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="block text-sm text-[#D1D5DC]">
                    Full Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={formData.fullName || ""}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value });
                      setErrors((prev) => ({ ...prev, fullName: "" }));
                    }}
                    className={`w-full px-4 py-2 rounded-md bg-[#1E293980] border placeholder-gray-500 text-gray-200 focus:outline-none transition ${
                      errors.fullName
                        ? "border-red-500 focus:border-red-500"
                        : "border-[#364153] focus:border-[#FCCA00]"
                    }`}
                  />
                  {errors.fullName && (
                    <p className="text-red-400 text-xs">{errors.fullName}</p>
                  )}
                </div>

                {/* Employee ID — custom validated field */}
                <EmpIdInput
                  value={formData.employeeId}
                  onChange={handleEmployeeIdChange}
                  onBlur={handleEmployeeIdBlur}
                  error={errors.employeeId}
                  idStatus={idStatus}
                />

                {/* Role */}
                <div className="space-y-2">
                  <label className="block text-sm text-[#D1D5DC]">
                    Role / Department
                  </label>
                  <input
                    type="text"
                    placeholder="Select role"
                    value={formData.role || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-md bg-[#1E293980] border border-[#364153] placeholder-gray-500 text-gray-200 focus:outline-none focus:border-[#FCCA00] transition"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="block text-sm text-[#D1D5DC]">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    value={formData.phone || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-2 rounded-md bg-[#1E293980] border border-[#364153] placeholder-gray-500 text-gray-200 focus:outline-none focus:border-[#FCCA00] transition"
                  />
                </div>

                </div>
              </div>

            {/* ── Face Recognition Photos ── */}
            <div className="space-y-4">
              <h3 className="text-xl font-normal border-b border-[#1E2939] pb-4">
                Face Recognition Photos
                {croppedPhotos.length > 0 && (
                  <span className="ml-3 text-sm text-[#FCCA00] font-normal">
                    {croppedPhotos.length} photo
                    {croppedPhotos.length > 1 ? "s" : ""}
                  </span>
                )}
              </h3>

              {croppedPhotos.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {croppedPhotos.map((src, idx) => (
                    <div key={idx} className="relative group aspect-square">
                      <img
                        src={src}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover rounded-xl border-2 border-[#364153] group-hover:border-[#FCCA00] transition"
                      />
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                        #{idx + 1}
                      </div>
                      <button
                        onClick={() => removePhoto(idx)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition"
                        title="Remove photo"
                      >
                        <FiX className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.photo && (
                <p className="text-red-400 text-xs">{errors.photo}</p>
              )}

              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-sm text-white font-medium mb-1">
                    Upload square face photos
                  </p>
                  <p className="text-xs text-[#99A1AF]">
                    Each photo will be cropped to a 1:1 square. Upload multiple
                    photos for better face recognition accuracy.
                  </p>
                </div>

                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center gap-2 cursor-pointer bg-[#1E2939] hover:bg-[#293548] border border-[#364153] hover:border-[#FCCA00]/50 text-white px-5 py-2.5 rounded-lg text-sm transition w-fit"
                >
                  <FiUpload className="size-4 text-[#FCCA00]" />
                  Add Photo
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                {croppedPhotos.length > 0 && (
                  <button
                    onClick={() => setCroppedPhotos([])}
                    className="inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition w-fit"
                  >
                    <FiX className="size-3.5" /> Remove all photos
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex w-full gap-6 px-6">
            <button
              onClick={onClose}
              className="w-full px-6 py-2 rounded-lg bg-white text-black font-medium hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaveDisabled}
              className={`w-full px-6 py-2 rounded-lg text-black font-medium transition flex items-center justify-center gap-2 ${
                isSaveDisabled
                  ? "bg-[#D1B600] cursor-not-allowed opacity-60"
                  : "bg-[#FCCA00] hover:bg-[#FFD633]"
              }`}
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin size-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8z"
                    />
                  </svg>
                  Saving…
                </>
              ) : idStatus === "checking" ? (
                "Checking ID…"
              ) : (
                "Save Employee"
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddEmployeeModal;
