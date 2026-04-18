import React from "react";
import BGImage from "../assets/bg-img.jpg";
import CanaryLogo from '../assets/Logo.png'
import { useNavigate } from "react-router-dom";

const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center text-center text-white bg-cover bg-top relative"
      style={{
        backgroundImage: `url(${BGImage})`,
        backgroundSize: "cover",
      }}
    >
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-16 ">
        {/* Logo */}


        {/* Title and Subtitle */}
        <div>
          <h1 className="text-4xl md:text-[72px] font-semibold text-[#FBCA0C]">
            CanaryVision Botswana
          </h1>
          <h2 className="text-4xl md:text-[72px] font-semibold">
            Staff Movement AI System
          </h2>
        </div>

        {/* Button */}
        <button
          onClick={() => navigate("/shop-login")}
          className="bg-[#FBCA0C] text-black font-medium text-lg px-10 py-3 w-full max-w-[400px] rounded-lg shadow-md hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
        >
          Let’s Start
        </button>
      </div>
      <footer className="w-full py-10 text-center space-y-4 absolute bottom-0">
        <p className="text-sm malayalam-font text-amber-800 font-medium"></p>
        <div className="pt-4 flex  justify-center items-center gap-4">
          <p className="text-[10px] uppercase tracking-widest text-[#FFFFFF] font-bold">
            Powered By
          </p>
          <img
            src={CanaryLogo}
            alt="Logo"
            className="w-[90px] cursor-pointer"
            onClick={() => window.open("https://canarydigital.ai", "_blank")}
          />
        </div>
      </footer>
    </div>
  );
};

export default WelcomePage;
