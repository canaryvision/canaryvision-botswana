import React from "react";
import { FiArrowLeft, FiCamera, FiMaximize2, FiRefreshCcw } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import BGImage from "../assets/bg image.jpg";

const CameraLivePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen text-white flex flex-col p-6 bg-cover bg-top bg-no-repeat"
      style={{ backgroundImage: `url(${BGImage})` }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-10 max-w-[90%] mx-auto w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
          >
            <FiArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-semibold flex items-center gap-3">
              <FiCamera className="text-[#FDC500]" /> Live Camera Feed
            </h1>
            <p className="text-gray-400 text-sm">Monitoring live streams from all active zones.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-full text-red-400 text-xs font-medium animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                LIVE
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md text-sm transition font-medium">
                <FiRefreshCcw /> Refresh Streams
            </button>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="max-w-[90%] mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
        {[1, 2].map((cam) => (
          <div key={cam} className="group relative rounded-2xl border-2 border-[#FDC50033] bg-black overflow-hidden shadow-[0_10px_40px_rgba(253,197,0,0.1)] hover:border-[#FDC500] transition-all duration-300">
            {/* Header Overlay */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-linear-to-b from-black/80 to-transparent z-10 flex justify-between items-center">
              <span className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-md text-xs font-semibold border border-white/10">
                CAMERA 0{cam} - {cam === 1 ? 'Entrance' : 'Counter Area'}
              </span>
              <button className="p-2 bg-black/40 hover:bg-black/80 rounded-md transition backdrop-blur-md opacity-0 group-hover:opacity-100">
                <FiMaximize2 size={16} />
              </button>
            </div>

            {/* Placeholder for Video Feed */}
            <div className="aspect-video bg-[#0A0E17] flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-20 pointer-events-none">
                 <div className="w-full h-px bg-white/10 absolute top-1/4"></div>
                 <div className="w-full h-px bg-white/10 absolute top-1/2"></div>
                 <div className="w-full h-px bg-white/10 absolute top-3/4"></div>
                 <div className="h-full w-px bg-white/10 absolute left-1/4"></div>
                 <div className="h-full w-px bg-white/10 absolute left-1/2"></div>
                 <div className="h-full w-px bg-white/10 absolute left-3/4"></div>
               </div>
               
               <div className="flex flex-col items-center gap-4 z-10">
                 <div className="w-16 h-16 rounded-full bg-[#FDC50010] border border-[#FDC50040] flex items-center justify-center">
                   <FiCamera className="text-[#FDC500] size-8 animate-pulse" />
                 </div>
                 <p className="text-gray-400 text-sm font-medium">Connecting to secure stream...</p>
                 <div className="w-48 h-1 bg-[#1E293B] rounded-full overflow-hidden">
                    <div className="h-full bg-[#FDC500] w-1/3 animate-[loading_2s_infinite]"></div>
                 </div>
               </div>
               
               {/* Scanlines Effect */}
               <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,rgba(253,197,0,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            </div>

            {/* Footer Overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
               <div className="flex gap-2">
                 <span className="px-2 py-1 bg-black/60 rounded text-[10px] font-mono border border-white/10">192.168.1.10{cam}</span>
                 <span className="px-2 py-1 bg-black/60 rounded text-[10px] font-mono border border-white/10">30 FPS</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
};

export default CameraLivePage;
