import { Clipboard, Home, List, Monitor, Settings, Tag, User } from "react-feather";


// src/config/navConfig.js
export const navItemsByRole = {
  user: [
    { to: "/user/dashboard", label: "Dashboard", icon: Home},
    { to: "/tickets", label: "My Tickets", icon: Tag },
  
  ],
  agent: [
    { to: "/agent/dashboard", label: "Agent Dashboard", icon: Home },
    { to: "/tickets", label: "Assigned Tickets", icon: Tag },
   
  ],
  admin: [
    { to: "/admin/dashboard", label: "Admin Dashboard", icon: Home },
    { to: "/tickets", label: "All Tickets", icon: Tag },
    { to: "/admin/manage", label: "Manage", icon: Monitor },

  
  ],
};
