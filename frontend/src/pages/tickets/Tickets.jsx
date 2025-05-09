import React from "react";
import { Outlet } from "react-router-dom";
import Breadcrumbs from "../../components/Breadcrumbs";

const Tickets = () => {
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-auto bg-gray-100">
      <Breadcrumbs />
      <div className="flex-1 flex flex-col h-full w-full overflow-auto bg-gray-100">
        <Outlet />
      </div>
    </div>
  );
};

export default Tickets;
