import React from "react";
import HomePageSection from "../components/home/HomePageSection";

const HomePage: React.FC = () => {
  return (
    <div className="h-screen overflow-y-auto scrollbar-hide ">
      <HomePageSection />
    </div>
  );
};

export default HomePage;
