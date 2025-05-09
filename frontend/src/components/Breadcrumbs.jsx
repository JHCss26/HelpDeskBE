// src/components/Breadcrumbs.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const BREADCRUMB_NAME_MAP = {
  '/tickets':        'Tickets',
  '/tickets/all':    'All Tickets',
  '/tickets/create': 'Create Ticket',
  // add more static mappings as needed
};

export default function Breadcrumbs() {
  const { pathname } = useLocation();

  // only render for /tickets/*
  if (!pathname.startsWith('/tickets')) {
    return null;
  }

  const parts = pathname.split('/').filter(Boolean);
  // build an array of { to, label }
  const crumbs = parts.map((seg, idx) => {
    const to = '/' + parts.slice(0, idx + 1).join('/');
    const staticLabel = BREADCRUMB_NAME_MAP[to];
    return {
      to,
      // if we have a static label, use it; otherwise use the raw segment (ID)
      label: staticLabel || seg,
    };
  });

  return (
    <nav className="text-sm p-4 shadow z-2 bg-white" aria-label="breadcrumb">
      <ol className="flex items-center space-x-2">
        <li>
          <Link to="/" className="text-blue-600 hover:underline">
            Home
          </Link>
        </li>
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <li key={crumb.to} className="flex items-center space-x-2">
              <span className="text-gray-400">/</span>
              {isLast ? (
                <span className="text-gray-700">{crumb.label}</span>
              ) : (
                <Link
                  to={crumb.to}
                  className="text-blue-600 hover:underline"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
