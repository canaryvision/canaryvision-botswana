import React from "react";
import EmployeePageSection from "../components/employee/EmployeePageSection";

const EmployeePage: React.FC = () => {
  return (
    <div className="h-screen overflow-y-auto scrollbar-hide ">
      <EmployeePageSection />
    </div>
  );
};

export default EmployeePage;
