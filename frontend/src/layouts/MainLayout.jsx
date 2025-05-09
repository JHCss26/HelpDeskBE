// src/layouts/MainLayout.jsx
import React, { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import NotificationBell from "../components/NotificationBell";
import { logout } from "../features/auth/authSlice";
import { navItemsByRole } from "../config/navConfig";
import Logo from "../assets/logo.png";
import { getInitials } from "../utils/stringHelpers";

export default function MainLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const [isOpen, setIsOpen] = useState(false);
  const toggleSidebar = () => setIsOpen((prev) => !prev);
  // this is for user Profile button
  const initial = getInitials(user.name);
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const [isVerticalOpen, setIsVerticalOpen] = useState(false);
  const verticalContainerRef = useRef(null);

  useEffect(() => {
    function onClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") toggleSidebar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    setOpen(false);
  };

  // pick nav list for this user.role
  const navItems = navItemsByRole[user.role] || [];

  return (
    <div className="flex-1 flex lg:flex-row md:flex-col sm:flex-col max-sm:flex-col h-screen w-full overflow-auto">
      <aside className="py-8 z-20 flex-col w-36 shadow-[2px_0_6px_0_hsla(0,0%,76.1%,0.5)] hidden lg:flex xl:flex h-full">
        {/* Header Section */}
        <div className="text-center flex flex-col items-center justify-center">
          <h3 className="text-3xl font-extrabold text-[#E30613] border-b-2 border-[#] inline-block pb-0.5">
            HDS
          </h3>
          <h6 className="mt-0.5 text-2x1 font-medium text-[#6CBD45] inline-block pb-1 ">
            HelpDesk
          </h6>
        </div>

        {/* Navigation Section */}
        <div className="flex flex-col items-center justify-center h-full my-6">
          <nav className="flex-1 space-y-2 overflow-y-auto h-fit w-full px-2">
            {navItems.map(({ to, icon: Icon, lable }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `flex justify-center items-center rounded ${
                    isActive ? "bg-blue-600 text-[#fff]" : "hover:bg-gray-100"
                  } `
                }
              >
                <Icon className="my-4 w-full" size={32} />
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Notification Section */}
        <div className="flex items-center justify-center w-full my-4">
          <NotificationBell />
        </div>

        {/* Logout Section */}
        <div
          ref={verticalContainerRef}
          className="relative flex items-center justify-center w-full"
        >
          {/* profile button */}
          <button
            onClick={() => setIsVerticalOpen((v) => !v)}
            className="flex items-center justify-center w-15 h-15 rounded-full  bg-gray-100 hover:bg-blue-600 hover:text-[#fff] font-bold text-2x1  focus:outline-none"
          >
            {initial}
          </button>

          {/* profile button dropdown */}
          {isVerticalOpen && (
            <div
              className="
                absolute 
                top-1/2 
                left-10/12      
                transform -translate-y-1/2 
                w-40 
              bg-white border border-gray-200 rounded shadow-lg z-50
              transition-all duration-300 ease-in-out
              "
            >
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-[#373737] hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="lg:hidden xl:hidden">
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 bg-transparent bg-opacity-30 z-40 transition-opacity duration-300 ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        />
        <aside
          className={`fixed top-0 right-0 h-full w-50 max-w-full bg-white shadow-xl z-50 transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between p-4 bg-white shadow-md">
            <button
              onClick={toggleSidebar}
              className="text-gray-500 focus:outline-none lg:hidden xl:hidden "
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              </svg>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center h-full my-6">
            <nav className="flex-1 space-y-2 overflow-y-auto h-fit w-full px-2">
              {navItems.map(({ to, icon: Icon, lable }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex justify-center items-center rounded ${
                      isActive ? "bg-blue-600 text-[#fff]" : "hover:bg-gray-100"
                    } `
                  }
                >
                  <Icon className="my-4 w-full" size={32} />
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>
      </div>

      <div className="w-full h-[10%] lg:hidden xl:hidden md:flex sm:flex max-sm:flex justify-between items-center bg-white z-10 p-2.5 shadow-[2px_0_6px_0_hsla(0,0%,76.1%,0.5)]">
        <img src={Logo} alt="HelpDesk Logo" className="w-[250px] max-sm:w-40" />
        <div className="flex items-center justify-center space-x-4 w-auto">
          <NotificationBell />
          <div  ref={containerRef} className="flex items-center justify-center w-full">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center justify-center w-15 h-15 rounded-full font-bold text-2x1 bg-gray-100 hover:bg-blue-300 hover:text-[#fff] focus:outline-none"
            >
              {initial}
            </button>
            {open && (
              <div
                className="
                absolute 
                top-[12%] 
                right-0      
                transform -translate-y-1/2 
                w-40
                z-10 
              bg-white border border-gray-200 rounded shadow-lg z-50
              transition-all duration-300 ease-in-out
              "
              >
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-[#373737] hover:bg-gray-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="text-gray-500 focus:outline-none lg:hidden xl:hidden mr-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col w-full  overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
