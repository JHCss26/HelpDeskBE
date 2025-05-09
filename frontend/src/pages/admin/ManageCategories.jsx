// src/pages/admin/ManageCategories.jsx
import React, { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";

export default function ManageCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [currentId, setCurrentId] = useState(null);
  const [error, setError] = useState("");

  // Load categories
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/categories");
      setCategories(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load categories");
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

  const handleEdit = (cat) => {
    setIsEditing(true);
    setCurrentId(cat._id);
    setForm({ name: cat.name });
    setError("");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category?")) return;
    try {
      await axios.delete(`/api/categories/${id}`);
      load();
    } catch (err) {
      console.error(err);
      alert("Failed to delete category");
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
        await axios.put(`/api/categories/${currentId}`, form);
      } else {
        await axios.post("/api/categories", form);
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
        <h1 className="text-2xl font-bold">Manage Categories</h1>
        <button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          New Category
        </button>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="table w-full bg-white shadow rounded overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2  text-left w-5/6">Name</th>
              <th className="p-2  text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan="2" className="p-4 text-center text-gray-500">
                  No categories found.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50">
                <td className="p-2 ">{c.name}</td>
                <td className="p-2 ">
                  <button
                    onClick={() => handleEdit(c)}
                    className="text-blue-600 hover:underline mr-4"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(c._id)}
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
            <div className="px-6 py-4 flex justify-between items-center shadow">
              <h2 className="text-lg font-semibold">
                {isEditing ? "Edit Category" : "New Category"}
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
                  className="w-full  rounded p-2 border"
                  required
                />
              </div>
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="mr-2 px-4 py-2 rounded "
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
