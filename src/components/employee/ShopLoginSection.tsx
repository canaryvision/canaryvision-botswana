import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import BGImage from "../../assets/bg-img.jpg";
import Logo from "../../assets/Logo.png";

const ShopLoginSection: React.FC = () => {
  const [pin, setPin] = useState(["", "", "", ""]);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];
  const navigate = useNavigate();

  const handleChange = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    // Move to next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  useEffect(() => {
    if (pin.every((digit) => digit !== "")) {
      const enteredPin = pin.join("");
      if (enteredPin === "1111") {
        sessionStorage.setItem("shop_auth", "true");
        toast.success("Access Granted");
        navigate("/dashboard");
      } else {
        toast.error("Invalid PIN code");
        setPin(["", "", "", ""]);
        inputRefs[0].current?.focus();
      }
    }
  }, [pin, navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-cover bg-top relative"
      style={{ backgroundImage: `url(${BGImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="flex flex-col items-center gap-8 mb-12">
          <img src={Logo} alt="Logo" className="max-w-[200px]" />
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#FBCA0C] mb-2">Access Control</h1>
            <p className="text-gray-300">Please enter your 4-digit PIN to continue</p>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 rounded-3xl shadow-2xl">
          <div className="flex justify-center gap-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type="password"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-16 h-20 text-center text-3xl font-bold bg-white/5 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-[#FBCA0C] focus:ring-1 focus:ring-[#FBCA0C] transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate("/")}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Back to Welcome Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopLoginSection;
