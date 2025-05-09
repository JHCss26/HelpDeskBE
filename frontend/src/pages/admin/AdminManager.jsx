import React, { useState, useRef, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

// Ensure framer-motion is installed: npm install framer-motion

const tabs = [
  { label: "User Management", path: "/admin/manage/users" },
  { label: "Category Management", path: "/admin/manage/categories" },
  { label: "Department Management", path: "/admin/manage/departments" },
  { label: "SLA Settings", path: "/admin/manage/sla-settings" },
  // Add additional tabs as needed
];

export default function AdminManager() {
  const location = useLocation();
  const [indicator, setIndicator] = useState({ width: 0, left: 0 });
  const tabsRef = useRef([]);

  // Update the sliding indicator based on active route
  useEffect(() => {
    // Find the index of the current tab by matching the path
    const activeIdx = tabs.findIndex((tab) =>
      location.pathname.startsWith(tab.path)
    );
    const idx = activeIdx >= 0 ? activeIdx : 0;
    const currentTab = tabsRef.current[idx];
    if (currentTab) {
      setIndicator({
        width: currentTab.offsetWidth,
        left: currentTab.offsetLeft,
      });
    }
  }, [location]);

  return (
    <div className="w-full bg-gray-50 h-full">
      <nav className="relative flex space-x-4 h-fit shadow bg-white p-4 justify-start items-center">
        {tabs.map((tab, idx) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            ref={(el) => (tabsRef.current[idx] = el)}
            className={({ isActive }) =>
              `py-2 px-6 focus:outline-none ${
                isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-800"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}

        {/* Sliding underline indicator */}
        <motion.div
          className="absolute bottom-0 h-0.5 bg-blue-600"
          animate={{ width: indicator.width, x: indicator.left }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </nav>

      {/* Render the matched child route */}
      <div className="mt-4">
        <Outlet />
      </div>
    </div>
  );
}
