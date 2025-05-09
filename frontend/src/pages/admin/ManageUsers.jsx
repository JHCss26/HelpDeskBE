// src/pages/admin/ManageUsers.jsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";
import { Eye, UserMinus, UserX } from "react-feather";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "user",
    phone: "",
  });
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const navigate = useNavigate();
  // Load all users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/admin/users");
      setUsers(data);
    } catch {
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadUsers();
  }, []);

  // Add User Modal handlers
  const handleAdd = () => {
    setIsEditing(false);
    setForm({ name: "", email: "", role: "user", phone: "" });
    setError("");
    setModalOpen(true);
  };
  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const { name, email, role, phone } = form;
    if (!name.trim() || !email.trim()) {
      setError("Name & email are required.");
      return;
    }
    try {
      if (isEditing) {
        await axios.put(`/api/admin/users/${currentId}`, {
          name,
          email,
          role,
          phone,
        });
      } else {
        await axios.post("/api/admin/users", { name, email, role, phone });
      }
      setModalOpen(false);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed.");
    }
  };

  // Suspend/Unsuspend user
  const toggleSuspend = async (data) => {
    if (!window.confirm("Toggle suspend for this user?")) return;
    try {
      await axios.put(`/api/admin/users/${data.id}/suspend`, {
        suspend: data.isSuspended,
      });
      setUsers((prev) =>
        prev.map((u) =>
          u._id === data.id ? { ...u, isSuspended: data.isSuspended } : u
        )
      );
      loadUsers();
    } catch {
      alert("Failed to toggle suspend");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add User
        </button>
      </div>

      {loading ? (
        <p>Loading users…</p>
      ) : (
        <table className="w-full bg-white shadow rounded overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Phone</th>
              <th className="p-2 text-left">Suspended</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="p-4 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="p-2">{u.name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2 capitalize">{u.role}</td>
                <td className="p-2">{u.phone || "—"}</td>
                <td className="p-2">{u.isSuspended ? "Yes" : "No"}</td>
                <td className="p-2 space-x-2">
                  <div className="text-gray-500 hover:text-gray-800 cursor-pointer flex justify-start items-center gap-2">
                    <button
                      className="text-indigo-600 hover:underline"
                      onClick={() => navigate(`/admin/manage/users/${u._id}`)}
                    >
                      <Eye className="inline" />
                    </button>
                    <button
                      onClick={() =>
                        toggleSuspend({
                          id: u._id,
                          isSuspended: u.isSuspended ? false : true,
                        })
                      }
                      className="text-red-600 hover:underline"
                    >
                      {u.isSuspended ? <UserMinus /> : <UserX />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className=" px-6 py-4 flex justify-between items-center shadow">
              <h2 className="text-lg font-semibold">
                {isEditing ? "Edit User" : "Add User"}
              </h2>
              <button onClick={() => setModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              {error && (
                <div className="p-2 bg-red-100 text-red-700 rounded">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full rounded p-2 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full rounded p-2 border"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  className="w-full rounded p-2 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full rounded p-2 border"
                >
                  <option value="user">User</option>
                  <option value="agent">Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mr-2 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  {isEditing ? "Save Changes" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
