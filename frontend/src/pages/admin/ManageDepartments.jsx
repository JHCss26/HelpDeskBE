// src/pages/admin/ManageDepartments.jsx
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

export default function ManageDepartments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [currentId, setCurrentId] = useState(null);
  const [error, setError] = useState("");

  // Load departments
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/departments");
      setDepartments(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAdd = () => {
    setIsEditing(false);
    setForm({ name: "" });
    setError("");
    setModalOpen(true);
  };

  const handleEdit = (dept) => {
    setIsEditing(true);
    setCurrentId(dept._id);
    setForm({ name: dept.name });
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this department?")) return;
    try {
      await axios.delete(`/api/departments/${id}`);
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete department");
    }
  };

  const handleChange = (e) => {
    setForm({ name: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    try {
      if (isEditing) {
        await axios.put(`/api/departments/${currentId}`, form);
      } else {
        await axios.post("/api/departments", form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Operation failed");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Departments</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Department
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="w-full bg-white shadow rounded overflow-hidden">
          <thead className="shadow border border-gray-50 rounded bg-gray-50">
            <tr>
              <th className="p-2 text-left w-5/6">Name</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.length === 0 && (
              <tr>
                <td colSpan="2" className="p-4 text-center text-gray-500">
                  No departments found.
                </td>
              </tr>
            )}
            {departments.map((d) => (
              <tr key={d._id} className="hover:bg-gray-50">
                <td className="p-2">{d.name}</td>
                <td className="p-2">
                  <button
                    onClick={() => handleEdit(d)}
                    className="text-blue-600 hover:underline mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d._id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0  flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
            <div className="shadow px-6 py-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {isEditing ? "Edit Department" : "New Department"}
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
                  value={form.name}
                  onChange={handleChange}
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mr-2 px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                  {isEditing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
