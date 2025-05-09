import { useEffect, useState, useRef, useMemo } from "react";
import { BellIcon } from "@heroicons/react/24/outline";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchNotifications,
  markNotificationRead,
  markAllRead,
  addNotification,
} from "../features/notifications/notificationSlice";
import socket from "../sockets/socketClient";
import { Link } from "react-router-dom";

const NotificationBell = () => {
  const dispatch = useDispatch();
  const { items } = useSelector((state) => state.notifications);
  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Deduplicate notifications by _id
  const uniqueNotifications = useMemo(
    () => Array.from(new Map(items.map((n) => [n._id, n])).values()),
    [items]
  );

  // Compute unread count from unique notifications
  const uniqueUnreadCount = useMemo(
    () => uniqueNotifications.filter((n) => !n.isRead).length,
    [uniqueNotifications]
  );

  // 1) Fetch existing notifications on mount
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // 2) Join socket room + listen for new ones
  useEffect(() => {
    const handler = (notification) => {
      console.log("🔔 newNotification received", notification);
      dispatch(addNotification(notification));
    };

    socket.on("newNotification", handler);
    return () => socket.off("newNotification", handler);
  }, [dispatch, user?._id]);

  // 3) Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (open && !dropdownRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // 4) Mark one as read & close dropdown
  const handleMarkRead = (id) => {
    dispatch(markNotificationRead(id));
    setOpen(false);
  };

  // 5) Mark all read
  const handleMarkAllRead = () => {
    dispatch(markAllRead());
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className="relative p-2 rounded-full hover:bg-gray-200"
        onClick={() => setOpen((o) => !o)}
      >
        <BellIcon className="h-10 w-10 text-gray-700" />
        {uniqueUnreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
            {uniqueUnreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute w-80 bg-white rounded-lg shadow-lg z-10
            top-full right-0 mt-2
            lg:top-auto lg:mt-0 lg:bottom-0 lg:left-[65px] lg:right-auto"
        >
          <div className="flex justify-between items-center p-2 border-b">
            <span className="font-semibold">Notifications</span>
            {uniqueUnreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-sm text-blue-600 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {uniqueNotifications.length === 0 ? (
              <li className="p-4 text-center text-gray-500">No notifications</li>
            ) : (
              uniqueNotifications.map((n) => (
                <li
                  key={n._id}
                  className={`flex flex-col px-4 py-3 hover:bg-gray-100 ${n.isRead ? "" : "bg-blue-50"}`}
                >
                  <Link
                    to={n.link}
                    onClick={() => handleMarkRead(n._id)}
                    className="text-sm text-gray-800"
                  >
                    {n.message}
                  </Link>
                  <span className="text-xs text-gray-500 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
