// src/pages/admin/UserDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axiosInstance';

export default function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', phone: '', role: '' });
  const [isSuspended, setIsSuspended] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Load user details
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/admin/users/${id}`);
        setForm({
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          role: data.role,
        });
        setIsSuspended(!!data.isSuspended);
      } catch {
        alert('Failed to load user');
        navigate('/admin/users');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Save updates
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const { name, email, phone, role } = form;
    if (!name.trim() || !email.trim()) {
      setError('Name & email required.');
      return;
    }
    try {
      await axios.put(`/api/admin/users/${id}`, { name, email, phone, role });
      alert('User updated');
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    }
  };

  // Toggle suspension
  const handleSuspend = async () => {
    try {
      await axios.put(`/api/admin/users/${id}/suspend`, {suspend: !isSuspended});
      setIsSuspended(!isSuspended);
    } catch {
      alert('Failed to toggle suspension');
    }
  };

  if (loading) {
    return <div className="p-6 text-center">Loading…</div>;
  }

  return (
    <div className="p-6">
      <Link to="/admin/users" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Users
      </Link>

      <div className="bg-white shadow rounded-lg p-6 mb-6 max-w-md">
        <h2 className="text-2xl font-semibold mb-4">Edit User</h2>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">{error}</div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border rounded p-2"
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
              className="w-full border rounded p-2"
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
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border rounded p-2"
            >
              <option value="user">User</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={handleSuspend}
              className={`px-4 py-2 rounded ${
                isSuspended
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isSuspended ? 'Unsuspend' : 'Suspend'}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
