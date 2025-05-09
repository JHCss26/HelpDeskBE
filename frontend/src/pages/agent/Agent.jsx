import React from "react";
import { Outlet } from "react-router-dom";

const Agent = () => {
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Outlet />
    </div>
  );
};

export default Agent;
