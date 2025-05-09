import { useEffect, useState } from 'react';
import axios from '../../api/axiosInstance';

export default function SLASettingsPage() {
  const [settings, setSettings] = useState({
    critical: 4,
    high:     8,
    medium:   24,
    low:      48,
  });
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  // 1️⃣ Load existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await axios.get('/api/admin/sla-settings');
        setSettings({
          critical: data.critical,
          high:     data.high,
          medium:   data.medium,
          low:      data.low,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load SLA settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 2️⃣ Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((s) => ({ ...s, [name]: Number(value) }));
  };

  // 3️⃣ Submit updates
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await axios.put('/api/admin/sla-settings', settings);
      alert('SLA settings updated');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="p-6">Loading settings…</p>;

  return (
    <div className="p-6 max-w-lg mx-auto bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold mb-4">SLA Settings</h1>
      {error && <div className="mb-4 text-red-600">{error}</div>}
      <form onSubmit={handleSave} className="space-y-4">
        {['critical','high','medium','low'].map((lvl) => (
          <div key={lvl} className="flex items-center">
            <label className="w-32 capitalize">{lvl} (hrs):</label>
            <input
              type="number"
              name={lvl}
              min="1"
              value={settings[lvl]}
              onChange={handleChange}
              className="flex-1 border rounded px-2 py-1"
              required
            />
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className={`mt-4 w-full py-2 rounded text-white ${
            saving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
