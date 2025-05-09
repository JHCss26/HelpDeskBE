import React from 'react';
import { Outlet } from 'react-router-dom';

const Admin = () => {
    return (
        <div className="w-full bg-gray-50 h-full">
            <Outlet />
        </div>
    );
}

export default Admin;
