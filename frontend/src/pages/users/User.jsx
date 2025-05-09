import React from 'react';
import { Outlet } from 'react-router-dom';

const User = () => {
    return (
        <div className='flex flex-1 min-h-screen overflow-hidden'>
            <Outlet />
        </div>
    );
}

export default User;
