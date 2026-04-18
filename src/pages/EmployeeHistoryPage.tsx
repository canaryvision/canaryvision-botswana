import React from "react";
import WeeklyHistory from "../components/employee/WeeklyHistory";

const EmployeeHistoryPage: React.FC = () => {
  return (
    <div className="h-screen overflow-y-auto scrollbar-hide ">
      <WeeklyHistory />
    </div>
  );
};

export default EmployeeHistoryPage;
