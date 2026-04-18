import React from "react";
import SystemSettingSection from "../components/setting/SystemSettingSection";

const SettingPage: React.FC = () => {
  return (
    <div className="h-screen overflow-y-auto scrollbar-hide ">
      <SystemSettingSection />
    </div>
  );
};

export default SettingPage;
