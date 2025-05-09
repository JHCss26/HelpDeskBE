// src/pages/tickets/CreateTicket.jsx
import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axiosInstance";

const CreateTicket = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    department: "",
    category: "",
    priority: "Medium",
    attachments: [], // now an array
  });
  const [previews, setPreviews] = useState([]); // array of preview URLs
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load categories & departments
  useEffect(() => {
    const loadMeta = async () => {
      try {
        const [catsRes, deptsRes] = await Promise.all([
          axios.get("/api/categories"),
          axios.get("/api/departments"),
        ]);
        setCategories(catsRes.data);
        setDepartments(deptsRes.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load categories or departments.");
      }
    };
    loadMeta();
  }, []);

  // Clean up previews on unmount or when attachments change
  useEffect(() => {
    return () => previews.forEach((url) => URL.revokeObjectURL(url));
  }, [previews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setForm((f) => ({ ...f, attachments: files }));

    // build previews for images
    const imgPreviews = files
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => URL.createObjectURL(f));

    // revoke old previews
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(imgPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate
    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.department ||
      !form.category
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const fd = new FormData();
    fd.append("title", form.title);
    fd.append("description", form.description);
    fd.append("department", form.department);
    fd.append("category", form.category);
    fd.append("priority", form.priority);
    form.attachments.forEach((file) => fd.append("attachments", file));

    setLoading(true);
    try {
      const { data } = await axios.post("/api/tickets", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/tickets/${data._id}`);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "An error occurred creating the ticket."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-1 p-8 bg-gray-100">
      <div className="w-1/2 mx-auto p-8 bg-white shadow-md rounded-lg ">
        <h2 className="text-2xl font-bold mb-6"> Create New Ticket</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block font-medium mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              className="w-full border rounded p-2 focus:outline-none focus:ring"
              placeholder="Enter ticket title"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block font-medium mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded p-2 focus:outline-none focus:ring"
              placeholder="Describe your issue..."
              required
            />
          </div>

          {/* Department & Category */}

          <div>
            <label htmlFor="department" className="block font-medium mb-1">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              id="department"
              name="department"
              value={form.department}
              onChange={handleChange}
              className="w-full border rounded p-2 focus:outline-none focus:ring"
              required
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="category" className="block font-medium mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
              className="w-full border rounded p-2 focus:outline-none focus:ring"
              required
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block font-medium mb-1">
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="w-full border rounded p-2 focus:outline-none focus:ring"
            >
              {["Low", "Medium", "High", "Critical"].map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Attachments */}
          <div>
            <label className="block font-medium mb-1">
              Attachments (optional)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="file"
                ref={fileInputRef}
                accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded focus:outline-none focus:ring"
              >
                {form.attachments.length ? "Change Files" : "Choose Files"}
              </button>
              {form.attachments.length > 0 && (
                <span className="text-sm text-gray-600">
                  {form.attachments.length} file(s) selected
                </span>
              )}
            </div>

            {/* Previews */}
            {previews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {previews.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`Preview ${i + 1}`}
                    className="h-24 w-full object-cover rounded border"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded text-white ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "Creating…" : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicket;
