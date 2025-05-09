// src/pages/tickets/TicketBoard.jsx
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import { TicketIcon, TableCellsIcon } from "@heroicons/react/24/outline";
import ExportButton from "../../components/ExportButton";
import { Download, Eye } from "react-feather";

const STATUSES = [
  "Open",
  "In Progress",
  "On Hold",
  "Waiting for Customer",
  "Resolved",
  "Closed",
];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

export default function TicketBoard() {
  const { user } = useSelector((s) => s.auth);
  const isAgent = user.role === "agent";
  const isAdmin = user.role === "admin";

  const [tickets, setTickets] = useState([]);
  const [viewType, setViewType] = useState("cards"); // 'table' | 'cards'
  const [agentFilter, setAgentFilter] = useState("all"); // 'all' | 'assigned'
  const [statusFilter, setStatusFilter] = useState(""); // '' | one of STATUSES
  const [priorityFilter, setPriorityFilter] = useState(""); // '' | one of PRIORITIES
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // determine endpoint
  const endpoint = isAdmin
    ? "/api/tickets"
    : isAgent
    ? agentFilter === "assigned"
      ? "/api/tickets/assigned"
      : "/api/tickets"
    : "/api/tickets/my";

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      try {
        // build query params object
        const params = {};
        if (statusFilter) params.status = statusFilter;
        if (priorityFilter) params.priority = priorityFilter;

        const { data } = await axios.get(endpoint, { params });
        setTickets(data);
      } catch (err) {
        console.error("Error fetching tickets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [endpoint, statusFilter, priorityFilter]);

  if (loading) {
    return <div className="p-6 text-center">Loading tickets…</div>;
  }

  const downloadTickets = async (e, ticket) => {
    e.preventDefault();
    const url = `/api/tickets/${ticket?._id}/export`;
    try {
      const res = await axios.get(url, {
        responseType: "blob",
      });
      // Infer filename from headers or use default
      const filename = `${ticket?.ticketId}_ticket.xlsx`;
      saveAs(res.data, filename);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to download tickets.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-4">
        <div className="flex flex-wrap items-center space-x-2 gap-2">
          <h1 className="text-2xl font-bold">
            {isAdmin
              ? "All Tickets"
              : isAgent && agentFilter === "assigned"
              ? "My Assigned Tickets"
              : "All Tickets"}
          </h1>

          {/* Agent-only filter */}
          {isAgent && (
            <div className="flex space-x-1">
              <button
                onClick={() => setAgentFilter("all")}
                className={`px-3 py-1 rounded ${
                  agentFilter === "all"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setAgentFilter("assigned")}
                className={`px-3 py-1 rounded ${
                  agentFilter === "assigned"
                    ? "bg-blue-600 text-white"
                    : "hover:bg-gray-100"
                }`}
              >
                Assigned
              </button>
            </div>
          )}
        </div>

        {/* Filters & View Toggle */}
        <div className="flex flex-wrap items-center space-x-2 gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <button
            onClick={() => setViewType("table")}
            className={`p-2 rounded ${
              viewType === "table"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100"
            }`}
            title="Table view"
          >
            <TableCellsIcon className="h-5 w-5" />
          </button>

          <button
            onClick={() => setViewType("cards")}
            className={`p-2 rounded ${
              viewType === "cards"
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100"
            }`}
            title="Card view"
          >
            <TicketIcon className="h-5 w-5" />
          </button>

          {/* Export All Tickets */}
          <ExportButton />

          {/* Create Ticket Button */}
          <Link
            to="/tickets/create"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Create Ticket
          </Link>
        </div>
      </div>

      {/* Table View */}
      {viewType === "table" && (
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-full table-fixed border-collapse">
            <thead className="">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Title</th>
                <th className="px-4 py-2 text-left">Category</th>
                <th className="px-4 py-2 text-left">Priority</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Created At</th>
                <th className="px-4 py-2 text-left">SLA Due</th>
                <th className="px-4 py-2 text-left">SLA Status</th>
                {isAdmin && <th className="px-4 py-2 text-left">Created By</th>}
                {isAdmin && (
                  <th className="px-4 py-2 text-left">Assigned To</th>
                )}
                <th className="px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t._id} className=" hover:bg-gray-50 border-b border-gray-200">
                  <td className="px-4 py-2">{t.ticketId}</td>
                  <td className="px-4 py-2">
                    <Link
                      to={`/tickets/${t._id}`}
                      className="text-blue-600 underline"
                    >
                      {t.title}
                    </Link>
                  </td>
                  <td className="px-4 py-2">{t.category?.name || "—"}</td>
                  <td className="px-4 py-2">{t.priority}</td>
                  <td className="px-4 py-2">{t.status}</td>
                  <td className="px-4 py-2">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">
                    {t.slaDueDate
                      ? new Date(t.slaDueDate).toLocaleString()
                      : "—"}
                  </td>
                  <td className="px-4 py-2">
                    {t.isSlaBreached ? (
                      <span className="text-red-600 font-semibold">
                        Breached
                      </span>
                    ) : t.slaReminderSent ? (
                      <span className="text-orange-600">Upcoming</span>
                    ) : (
                      <span className="text-green-600">OK</span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-2">{t.createdBy?.name}</td>
                  )}
                  {isAdmin && (
                    <td className="px-4 py-2">{t.assignedTo?.name}</td>
                  )}
                  <td className="px-4 py-2">
                    <button
                      className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                      onClick={(e) => downloadTickets(e, t)}
                    >
                      <Download />
                    </button>

                    <button
                      className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer ml-2"
                      onClick={() => navigate(`/tickets/${t._id}`)}
                    >
                      <Eye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Card View */}
      {viewType === "cards" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map((t) => (
            <div
              className="block bg-white shadow rounded-lg hover:shadow-lg transition"
              key={t._id}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-lg mb-1">{t.title}</h2>
                  <button
                    className="text-gray-500 hover:text-gray-700 focus:outline-none cursor-pointer"
                    onClick={(e) => downloadTickets(e, t)}
                  >
                    <Download />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">{t.ticketId}</p>
                <div
                  className="text-sm space-y-1 cursor-pointer"
                  onClick={() => navigate(`/tickets/${t._id}`)}
                >
                  <p>
                    <span className="font-medium">Category:</span>{" "}
                    {t.category?.name || "—"}
                  </p>
                  <p>
                    <span className="font-medium">Priority:</span> {t.priority}
                  </p>
                  <p>
                    <span className="font-medium">Status:</span> {t.status}
                  </p>
                  <p>
                    <span className="font-medium">Created:</span>{" "}
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>SLA Due:</strong>{" "}
                    {new Date(t.slaDueDate).toLocaleString()}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    {t.isSlaBreached
                      ? "🚨 Breached"
                      : t.slaReminderSent
                      ? "⏰ Upcoming"
                      : "✅ OK"}
                  </p>
                  {isAdmin && (
                    <>
                      <p>
                        <span className="font-medium">By:</span>{" "}
                        {t.createdBy?.name}
                      </p>
                      <p>
                        <span className="font-medium">Assigned To:</span>{" "}
                        {t.assignedTo?.name}
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
