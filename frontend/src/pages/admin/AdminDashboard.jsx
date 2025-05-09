import React from 'react';

const AdminDashboard = () => {
    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
            <p className="mb-4">Welcome to the Admin Dashboard!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-xl font-semibold">User Management</h2>
                    <p>Details about user management and roles.</p>
                </div>
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="text-xl font-semibold">System Settings</h2>
                    <p>Configuration and settings for the system.</p>
                </div>
            </div>
            <div className="mt-4 bg-white p-4 rounded shadow">
                <h2 className="text-xl font-semibold">Recent Activities</h2>
                <p>List of recent activities performed by admins.</p>
            </div>
            <div className="mt-4 bg-white p-4 rounded shadow">
                <h2 className="text-xl font-semibold">System Health</h2>
                <p>Status and health of the system components.</p>
            </div>
        </div>
    );
}

export default AdminDashboard;
