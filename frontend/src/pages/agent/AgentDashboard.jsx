import { useEffect, useState } from "react";
import axios from "../../api/axiosInstance";
import Logo from "../../assets/Logo.png";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { InformationCircleIcon, TagIcon } from "@heroicons/react/24/outline";
import { Tag } from "react-feather";
import dayjs from "dayjs";
import SLAAlerts from "../../components/SLAAlerts";

const STATUS_LIST = [
  "Open",
  "In Progress",
  "On Hold",
  "Waiting for Customer",
  "Resolved",
  "Closed",
];

const AgentDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const { data } = await axios.get("/api/tickets/assigned");
        setTickets(data);
      } catch (err) {
        console.error("Failed to load tickets:", err);
      }
    };

    fetchTickets();
  }, []);

  // Fetch status‐breakdown via our stats API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get("/api/tickets/assigned/stats");
        setStats(data);
      } catch (err) {
        console.error("Failed to load ticket stats:", err);
      }
    };
    fetchStats();
  }, []);

  // While stats aren’t in, show a loader in that panel
  const OverviewContent = () => {
    if (!stats) {
      return <p className="text-gray-600">Loading stats…</p>;
    }
    return (
      <div className="mt-4 grid grid-cols-1 gap-2">
        {STATUS_LIST.map((status) => (
          <div key={status} className="flex justify-between text-2 font-medium">
            <span className="capitalize">{status}</span>
            <span className="font-semibold">{stats[status] || 0}</span>
          </div>
        ))}
      </div>
    );
  };

  const dateFormater = (dateString) => {
    const formattedDate = useMemo(() => {
      dayjs(dateString).format("DD/MM/YYYY");
    }, [dateString]);
    return formattedDate;
  };

  return (
    <div className=" flex-1 overflow-y-hidden bg-gray-50">
      {/* Title header */}
      <div className="h-1/6 flex justify-between border-b border-b-[#d9d9d9] shadow-[2px_0_6px_0_hsla(0,0%,76.1%,0.5)] z-20 bg-[#fff]">
        <div className="flex items-center justify-between px-15 md:px-8 sm:px-4 py-2 w-full">
          <div className="flex items-center space-x-4 justify-start">
            <img
              src={Logo}
              alt="Helers Logo"
              className="w-[350px] hidden lg:flex xl:flex"
            />
            <div className="inline-block sm:hidden h-[auto] min-h-[1em] w-0.5 self-stretch bg-neutral-300 dark:bg-white/10"></div>
            <div className="text-base md:text-md sm:text-sm lg:text-xl xl:text-2xl font-[700]  leading-[normal] block">
              <h2 className="text-2xl font-bold text-[#353D77] sm:text-sm md:text-md lg:text-3xl xl:text-4xl">
                Welcome to the HelpDesk Support
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-4 justify-end">
            <button
              className="bg-blue-600 text-white px-4 py-2 sm:px-2 md:py-2 sm:text-sm md:text-md rounded"
              onClick={() => navigate("/tickets/create")}
            >
              Submit New Ticket
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Main Container */}
      <div className="flex flex-col h-full w-full overflow-y-auto bg-gray-50 px-10 py-8">
        {/* sub header */}
        <SLAAlerts tickets={tickets} />
        <div className="flex gap-2 flex-col w-full mb-4">
          <h2 className="text-2xl font-bold text-[#353D77]">
            Essential Items To Review
          </h2>
          <button className="bg-blue-600 text-white px-4 py-2 rounded w-fit my-2">
            Tickets
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="overflow-y-auto w-full h-auto flex gap-6 flex-wrap">
          <div className="flex-1 rounded-[8px] bg-[#ecf2f6] py-6 px-4 flex-col min-[328px]">
            {/* titleContainer */}
            <div className="gap-[12px] items-center flex leading-normal font-[500] text-[20px] text-[#232360]">
              <div className="flex items-center justify-center w-10 h-10">
                <Tag className=" w-8" />
              </div>
              <label>Tickets Overview</label>
            </div>
            <OverviewContent />
          </div>
          <div className="flex-3 rounded-[8px] p-4 shadow-[0_4px_16px_0_rgba(0,94,197,.04)] flex-col bg-[#fff] min-[360px] w-full">
            <div className="header justify-between flex items-center">
              <div className="flex gap-[12px] items-center leading-normal font-[500] text-[20px] text-[#232360]">
                <label className="DetailedPod-podTitle text-[#112138]">
                  Open Tickets (0)
                </label>
                <InformationCircleIcon className="h-7 w-7 text-[#A0AEC0] cursor-pointer" />
              </div>
              <div onClick={() => navigate("/tickets")} className="cursor-pointer">
                <label className="text-[16px] font-[500] text-[#0953fe] mb-2 cursor-pointer flex gap-2">
                  Look up a ticket
                </label>
              </div>
            </div>
            <label className="text-[12px] font-[500] text-[#232360] mb-2">
              Here are the tickets you have submitted. Click Look up a ticket.
            </label>
            <div className="py-[16px] pl-[16px] pr-[4px] flex rounded-[6px] bg-[#f4f6f7]">
              {tickets.length > 0 ? (
                <div className="flex justify-start flex-col h-[220px] w-full overflow-auto rounded-tl-sm pr-4 bg-[#f4f6f7]">
                  {tickets.map((ticket) => (
                    <div
                      key={ticket._id}
                      className="flex justify-between items-center bg-white p-2 mb-2 rounded shadow-sm"
                      onClick={() => navigate(`/tickets/${ticket._id}`)}
                    >
                      <div className="flex flex-col">
                        <span className="text-lg font-semibold text-[#232360] flex justify-start items-center">
                          <div className="text-sm px-1 w-fit bg-blue-200 rounded">
                            {ticket.ticketId}
                          </div>
                          <label className="text-sm ml-2 text-blue-500">
                            {ticket.title}
                          </label>
                        </span>
                        <span className="text-sm text-gray-500 flex justify-start items-center">
                          {dayjs(ticket.createdAt).format(
                            "MMMM D, YYYY h:mm a"
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-semibold text-[#232360] flex justify-start items-center gap-2">
                          <div className="text-sm px-1 h-2 w-fit bg-green-600 rounded"></div>
                          <span>Status: {ticket.status}</span>
                        </span>
                        <span className="text-sm text-gray-500 flex justify-start items-center">
                          Priority: {ticket.priority}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-[220px] w-full overflow-auto rounded-tl-sm pr-4 bg-[#f4f6f7]">
                  <label className=" text-2xl font-[700] leading-normal text-[#232360]">
                    No open tickets found.
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
