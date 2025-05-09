// src/components/SLAAlerts.jsx
import { ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/solid';

export default function SLAAlerts({ tickets }) {
  const upcoming = tickets.filter(t => t.slaReminderSent && !t.isSlaBreached);
  const breached = tickets.filter(t => t.isSlaBreached);

  if (!upcoming.length && !breached.length) return null;

  return (
    <div className="space-y-4 mb-6">
      {breached.length > 0 && (
        <div className="flex items-start bg-red-100 border-l-4 border-red-500 p-4 rounded">
          <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
          <div>
            <p className="font-semibold text-red-800">
              {breached.length} SLA-breached ticket{breached.length>1?'s':''}
            </p>
            <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
              {breached.map(t => (
                <li key={t._id}>
                  <a href={`/tickets/${t._id}`} className="underline hover:text-red-900">
                    {t.ticketId}: {t.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {upcoming.length > 0 && (
        <div className="flex items-start bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded">
          <ClockIcon className="h-6 w-6 text-yellow-600 mr-3" />
          <div>
            <p className="font-semibold text-yellow-800">
              {upcoming.length} ticket{upcoming.length>1?'s':''} nearing SLA
            </p>
            <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
              {upcoming.map(t => (
                <li key={t._id}>
                  <a href={`/tickets/${t._id}`} className="underline hover:text-yellow-900">
                    {t.ticketId}: {t.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
