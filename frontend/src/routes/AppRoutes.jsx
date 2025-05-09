import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Login from "../pages/auth/Login";

import PrivateRoute from "./PrivateRoute";
import NavigateToRoleDashboard from "./NavigateToRoleDashboard";
import RoleRoute from "./RoleRoute";
import AgentDashboard from "../pages/agent/AgentDashboard";
import AdminDashboard from "../pages/admin/AdminDashboard";
import Dashboard from "../pages/users/Dashboard";
import CreateTicket from "../pages/tickets/CreateTicket";
import TicketDetails from "../pages/tickets/TicketDetails";
import ManageUsers from "../pages/admin/ManageUsers";
import ManageCategories from "../pages/admin/ManageCategories";
import ManageDepartments from "../pages/admin/ManageDepartments";
import TicketBoard from "../pages/tickets/TicketBoard";
import SetupPassword from "../pages/auth/SetupPassword";
import UserDetails from "../pages/admin/UserDetails";
import SLASettingsPage from "../pages/admin/SLASettingsPage";
import MainLayout from "../layouts/MainLayout";
import Tickets from "../pages/tickets/Tickets";
import Admin from "../pages/admin/Admin";
import Agent from "../pages/agent/Agent";
import User from "../pages/users/User";
import AdminManager from "../pages/admin/AdminManager";

export default function AppRoutes() {
  const { token } = useSelector((state) => state.auth);

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />
      <Route path="/setup-password/:token" element={<SetupPassword />} />
      {/* Protected */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<NavigateToRoleDashboard />} />

        {/* Tickets */}
        <Route
          path="/tickets"
          element={
            <RoleRoute allowedRoles={["user", "admin", "agent"]}>
              <Tickets />
            </RoleRoute>
          }
        >
          <Route index element={<TicketBoard />} />
          <Route
            path="all"
            element={
              <RoleRoute allowedRoles={["user", "admin", "agent"]}>
                <TicketBoard />
              </RoleRoute>
            }
          />
          <Route
            path="create"
            element={
              <RoleRoute allowedRoles={["user", "admin", "agent"]}>
                <CreateTicket />
              </RoleRoute>
            }
          />
          <Route
            path=":id"
            element={
              <RoleRoute allowedRoles={["user", "admin", "agent"]}>
                <TicketDetails />
              </RoleRoute>
            }
          />
        </Route>

        {/* Admin */}
        <Route
          path="/admin"
          element={
            <RoleRoute allowedRoles={["admin"]}>
              <Admin />
            </RoleRoute>
          }
        >
          <Route
            path="dashboard"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </RoleRoute>
            }
          />

          <Route path="manage" element={<AdminManager />}>
            
            <Route
              path="categories"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <ManageCategories />
                </RoleRoute>
              }
            />

            <Route
              path="departments"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <ManageDepartments />
                </RoleRoute>
              }
            />
            <Route
              path="users"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <ManageUsers />
                </RoleRoute>
              }
            />

            <Route
              path="users/:id"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <UserDetails />
                </RoleRoute>
              }
            />

            <Route
              path="sla-settings"
              element={
                <RoleRoute allowedRoles={["admin"]}>
                  <SLASettingsPage />
                </RoleRoute>
              }
            />

            <Route index element={<Navigate to="/admin/manage/users" />} />
          </Route>

          <Route index element={<Navigate to="/admin/dashboard" />} />
        </Route>

        <Route
          path="/agent"
          element={
            <RoleRoute allowedRoles={["agent"]}>
              <Agent />
            </RoleRoute>
          }
        >
          <Route index element={<Navigate to="/agent/dashboard" />} />
          <Route
            path="dashboard"
            element={
              <RoleRoute allowedRoles={["agent"]}>
                <AgentDashboard />
              </RoleRoute>
            }
          />
        </Route>

        {/* User */}
        <Route
          path="/user"
          element={
            <RoleRoute allowedRoles={["user"]}>
              <User />
            </RoleRoute>
          }
        >
          <Route index element={<Navigate to="/user/dashboard" />} />
          <Route
            path="dashboard"
            element={
              <RoleRoute allowedRoles={["user"]}>
                <Dashboard />
              </RoleRoute>
            }
          />
        </Route>
      </Route>

      {/* Final Catch-All Route */}
      <Route
        path="*"
        element={
          token ? (
            <NavigateToRoleDashboard />
          ) : (
            <div className="p-6 text-center text-lg">404 — Page Not Found</div>
          )
        }
      />
    </Routes>
  );
}
