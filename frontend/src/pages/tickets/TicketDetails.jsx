import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "../../api/axiosInstance";
import socket from "../../sockets/socketClient";
import { useSelector } from "react-redux";
import CommentThread from "../../components/CommentThread";
import { ChatBubbleBottomCenterIcon } from "@heroicons/react/24/outline";

const STATUSES = [
  "Open",
  "In Progress",
  "On Hold",
  "Waiting for Customer",
  "Resolved",
  "Closed",
  "Reopened",
];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];
const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif"];
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function TicketDetails() {
  const { id } = useParams();
  const { user } = useSelector((s) => s.auth);
  const isAgent = user.role === "agent";
  const isAdmin = user.role === "admin";
  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [comments, setComments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [statusVal, setStatusVal] = useState("");
  const [priorityVal, setPriorityVal] = useState("");
  const [assignedToVal, setAssignedToVal] = useState("");
  const [newComment, setNewComment] = useState("");
  const [commentAttachment, setCommentAttachment] = useState([]);
  const [previewSrc, setPreviewSrc] = useState(null);

  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState([]);

  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingFile, setEditingFile] = useState([]);

  const [loading, setLoading] = useState(true);
  const commentsEndRef = useRef(null);

  const [closureReasonVal, setClosureReasonVal] = useState("");
  const [resolutionNotesVal, setResolutionNotesVal] = useState("");

  const [isOpen, setIsOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const scrollToBottom = () =>
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });

  const fetchAll = async () => {
    try {
      const { data } = await axios.get(`/api/tickets/${id}/details`);
      setTicket(data.ticket);
      setHistory(data.history);
      setComments(data.comments);
      setStatusVal(data.ticket.status);
      setPriorityVal(data.ticket.priority);
      setAssignedToVal(data.ticket.assignedTo?._id || "");
      setClosureReasonVal(data.ticket.closureReason || "");
      setResolutionNotesVal(data.ticket.resolutionNotes || "");
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load ticket details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/api/comments/${id}`);
      setComments(data);
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load comments:", err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data } = await axios.get("/api/users");
        setAgents(data.filter((u) => u.role === "agent"));
      } catch (err) {
        console.error("Failed to load agents:", err);
      }
    };
    fetchAgents();
  }, []);

  const buildTree = (flat) => {
    const map = {};
    flat.forEach((c) => {
      map[c._id] = { ...c, replies: [] };
    });
    const roots = [];
    flat.forEach((c) => {
      if (c.parentComment) {
        const p = map[c.parentComment._id];
        if (p) p.replies.push(map[c._id]);
      } else {
        roots.push(map[c._id]);
      }
    });
    return roots;
  };
  const rootComments = buildTree(comments);

  useEffect(() => {
    socket.emit("joinTicketRoom", id);

    socket.on("newComment", (cmt) => {
      if (cmt.ticket === id) {
        fetchComments(); // Fetch updated comments to ensure attachments are included
      }
    });
    socket.on("ticketUpdated", (updated) => {
      if (updated._id === id) {
        setTicket(updated);
        fetchAll();
      }
      if (updated.assignedTo?._id === user._id) {
        setAssignedToVal(updated.assignedTo._id);
      }
    });
    return () => {
      socket.emit("leaveTicketRoom", id);
      socket.off("newComment");
      socket.off("ticketUpdated");
    };
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    const payload = {};
    if (statusVal !== ticket.status) payload.status = statusVal;
    if (priorityVal !== ticket.priority) payload.priority = priorityVal;
    if ((assignedToVal || "") !== (ticket.assignedTo?._id || "")) {
      payload.assignedTo = assignedToVal || null;
    }
    if (statusVal === "Closed") {
      payload.closureReason = closureReasonVal;
      payload.resolutionNotes = resolutionNotesVal;
    }
    if (!Object.keys(payload).length) return;
    try {
      const { data: upd } = await axios.put(`/api/tickets/${id}`, payload);
      setTicket(upd);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update ticket");
    }
  };

  const handleAssignToMe = async () => {
    try {
      const { data: upd } = await axios.put(`/api/tickets/${id}`, {
        assignedTo: user._id,
      });
      setTicket(upd);
      // setAssignedToVal(user._id);
    } catch (err) {
      console.error("Assign to me failed:", err);
      alert("Failed to assign ticket");
    }
  };

  const handleAttachmentClick = (inputId) => {
    const input = document.querySelector(inputId);
    if (input) {
      input.click();
      input.value = null; // Reset value to allow reselecting the same file
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (
      !newComment.trim() &&
      (!commentAttachment || commentAttachment.length === 0)
    )
      return;
    const fd = new FormData();
    fd.append("text", newComment);
    if (commentAttachment && commentAttachment.length > 0) {
      commentAttachment.forEach((file) => {
        fd.append("file", file);
      });
    }
    try {
      await axios.post(`/api/comments/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNewComment("");
      setCommentAttachment([]);
      await fetchComments(); // Fetch updated comments to ensure attachments are displayed
    } catch (err) {
      console.error("Comment failed:", err);
      alert("Failed to post comment");
    }
  };

  const handleReplySubmit = async (parentId) => {
    if (!replyText.trim() && (!replyFile || replyFile.length === 0)) return;
    const fd = new FormData();
    fd.append("text", replyText);
    fd.append("parentComment", parentId);
    if (replyFile && replyFile.length > 0) {
      replyFile.forEach((file) => {
        fd.append("file", file);
      });
    }
    try {
      await axios.post(`/api/comments/${id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReplyTo(null);
      setReplyText("");
      setReplyFile([]);
      await fetchComments(); // Fetch updated comments to ensure attachments are displayed
    } catch (err) {
      console.error("Reply failed:", err);
      alert("Failed to post reply");
    }
  };

  const onEditClick = (comment) => {
    if (comment) {
      setEditingId(comment._id);
      setEditingText(comment.text);
      setEditingFile([]);
    } else {
      setEditingId(null);
      setEditingText("");
      setEditingFile([]);
    }
  };

  const submitEdit = async (commentId) => {
    const fd = new FormData();
    fd.append("text", editingText);
    if (editingFile && editingFile.length > 0) {
      editingFile.forEach((file) => {
        fd.append("file", file);
      });
    }
    try {
      await axios.put(`/api/comments/${commentId}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onEditClick(null);
      await fetchComments(); // Fetch updated comments to ensure attachments are displayed
    } catch (err) {
      console.error("Edit failed:", err);
      alert("Failed to edit comment");
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await axios.delete(`/api/comments/${commentId}`);
      setComments((prev) =>
        prev.filter(
          (c) => c._id !== commentId && c.parentComment?._id !== commentId
        )
      );
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete comment");
    }
  };

  const isImage = (filename) =>
    IMAGE_EXTS.some((ext) => filename.toLowerCase().endsWith(ext));

  if (loading || !ticket) {
    return <div className="p-6 text-center text-gray-600">Loading ticket…</div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-100 overflow-hidden">
      {/* Left Column (ticket details & update) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            {ticket.title}
          </h2>
          {(isAgent || isAdmin) && (
            <div className="mb-6 bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-medium text-gray-700 mb-2">Update Ticket</h3>
              {isAgent && !ticket.assignedTo?._id ? (
                <form
                  onSubmit={handleUpdate}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => {
                        setStatusVal(e.target.value);
                        if (e.target.value !== "Closed") {
                          setClosureReasonVal("");
                          setResolutionNotesVal("");
                        }
                      }}
                      className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {statusVal === "Closed" && (
                    <>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium mb-1">
                          Closure Reason
                        </label>
                        <select
                          value={closureReasonVal}
                          onChange={(e) => setClosureReasonVal(e.target.value)}
                          className="w-full border rounded p-2"
                          required
                        >
                          <option value="">Select reason</option>
                          {[
                            "Resolved",
                            "Duplicate",
                            "Not a Bug",
                            "Out of Scope",
                            "User Error",
                            "Other",
                          ].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium mb-1">
                          Resolution Notes (optional)
                        </label>
                        <textarea
                          rows={3}
                          value={resolutionNotesVal}
                          onChange={(e) =>
                            setResolutionNotesVal(e.target.value)
                          }
                          className="w-full border rounded p-2"
                          placeholder="Additional details…"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priorityVal}
                      onChange={(e) => setPriorityVal(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3 flex justify-between items-center">
                    <button
                      type="button"
                      onClick={handleAssignToMe}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                    >
                      Assign to me
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                <form
                  onSubmit={handleUpdate}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={statusVal}
                      onChange={(e) => {
                        setStatusVal(e.target.value);
                        if (e.target.value !== "Closed") {
                          setClosureReasonVal("");
                          setResolutionNotesVal("");
                        }
                      }}
                      className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {statusVal === "Closed" && (
                    <>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium mb-1">
                          Closure Reason
                        </label>
                        <select
                          value={closureReasonVal}
                          onChange={(e) => setClosureReasonVal(e.target.value)}
                          className="w-full border rounded p-2"
                          required
                        >
                          <option value="">Select reason</option>
                          {[
                            "Resolved",
                            "Duplicate",
                            "Not a Bug",
                            "Out of Scope",
                            "User Error",
                            "Other",
                          ].map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-3">
                        <label className="block text-sm font-medium mb-1">
                          Resolution Notes (optional)
                        </label>
                        <textarea
                          rows={3}
                          value={resolutionNotesVal}
                          onChange={(e) =>
                            setResolutionNotesVal(e.target.value)
                          }
                          className="w-full border rounded p-2"
                          placeholder="Additional details…"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={priorityVal}
                      onChange={(e) => setPriorityVal(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assigned To
                    </label>
                    <select
                      value={assignedToVal}
                      onChange={(e) => setAssignedToVal(e.target.value)}
                      className="w-full border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {isAdmin &&
                        agents.map((a) => (
                          <option key={a._id} value={a._id}>
                            {a.name}
                          </option>
                        ))}
                      {isAgent && ticket.assignedTo?._id && (
                        <option value={user._id}>{user.name} (You)</option>
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-3 text-right">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="text-sm text-gray-700 grid grid-cols-2 gap-4 mb-4">
            <div>
              <strong>ID:</strong> {ticket.ticketId}
            </div>
            <div>
              <strong>Status:</strong> {ticket.status}
            </div>
            <div>
              <strong>Priority:</strong> {ticket.priority}
            </div>
            <div>
              <strong>Category:</strong> {ticket.category?.name}
            </div>
            <div>
              <strong>Created By:</strong> {ticket.createdBy.name} (
              {ticket.createdBy.email})
            </div>
            <div>
              <strong>Assigned To:</strong>{" "}
              {ticket.assignedTo
                ? `${ticket.assignedTo.name} (${ticket.assignedTo.email})`
                : "Unassigned"}
            </div>
            <div>
              <strong>Created At:</strong>{" "}
              {new Date(ticket.createdAt).toLocaleString()}
            </div>
            <div>
              <strong>Updated At:</strong>{" "}
              {new Date(ticket.updatedAt).toLocaleString()}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-700 mb-1">Description</h3>
            <p className="whitespace-pre-wrap text-gray-800">
              {ticket.description}
            </p>
          </div>

          {ticket.status === "Closed" && (
            <div className="bg-gray-100 p-4 rounded my-4">
              <p>
                <strong>Closed on:</strong>{" "}
                {new Date(ticket.closureDate).toLocaleString()}
              </p>
              <p>
                <strong>Reason:</strong> {ticket.closureReason}
              </p>
              {ticket.resolutionNotes && (
                <p>
                  <strong>Notes:</strong> {ticket.resolutionNotes}
                </p>
              )}
            </div>
          )}
        </div>

        {ticket.attachments?.length > 0 && (
          <div className="bg-white p-6 rounded shadow space-y-4">
            <div>
              <h3 className="font-medium mb-2">Attachments</h3>
              <div className="flex flex-wrap gap-4">
                {ticket.attachments.map((path) => {
                  const url = `${baseURL}${path}`;
                  return isImage(path) ? (
                    <img
                      key={path}
                      src={url}
                      alt=""
                      className="h-20 w-20 object-cover cursor-pointer rounded"
                      onClick={() => setPreviewSrc(url)}
                    />
                  ) : (
                    <a
                      key={path}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {path.split("/").pop()}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            🕒 History
          </h3>
          <ul className="space-y-4">
            {history.map((h) => (
              <li key={h._id} className="relative pl-8">
                <span className="absolute left-0 top-1 h-2 w-2 bg-blue-600 rounded-full" />
                <p className="text-sm text-gray-600 mb-1">
                  {new Date(h.changedAt).toLocaleString()} by{" "}
                  <strong style={{ textTransform: "capitalize" }}>
                    {h.changedBy.name} ({h.changedBy.email})
                  </strong>
                </p>
                <p className="text-gray-800">
                  <strong>{h.fieldChanged}</strong> changed from “
                  <b style={{ textTransform: "capitalize" }}>{h.oldValue}</b>”
                  to “
                  <b style={{ textTransform: "capitalize" }}>{h.newValue?._id ? h.newValue.name : h.newValue}</b>”
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Right Column (comments) */}
      <div className="w-full md:w-1/3 h-full flex-1 flex flex-col bg-gray-50 sm:hidden md:flex">
        <div className="flex-1 flex h-full flex-col p-6">
          {/* Comment Input Form (Moved to Top) */}
          <form onSubmit={handleCommentSubmit} className="mb-6 space-y-2">
            <div className="relative">
              <textarea
                className="flex-1 w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-orange-500 focus:border-orange-500 resize-none"
                rows={1}
                placeholder="Add comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <label
                className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
                onClick={() => handleAttachmentClick("#attachment-input")}
              >
                <svg
                  className="w-5 h-5 text-gray-500 hover:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L17 9.828a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 008.485 8.485L19.828 13"
                  />
                </svg>
                <input
                  id="attachment-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setCommentAttachment(files); // Set files without triggering preview immediately
                  }}
                />
              </label>
            </div>
            {/* Attachment Details */}
            {commentAttachment && commentAttachment.length > 0 && (
              <div className="mt-2 pl-2 space-y-1">
                {commentAttachment.map((file, index) => (
                  <span
                    key={index}
                    className="text-sm text-gray-600 underline cursor-pointer block"
                    onClick={() => {
                      if (
                        IMAGE_EXTS.some((ext) =>
                          file.name.toLowerCase().endsWith(ext)
                        )
                      ) {
                        const reader = new FileReader();
                        reader.onload = (event) =>
                          setPreviewSrc(event.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                ))}
              </div>
            )}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-600 text-white px-4 py-2 rounded-md mt-2"
              disabled={
                !newComment.trim() &&
                (!commentAttachment || commentAttachment.length === 0)
              }
            >
              Submit
            </button>
          </form>

          {/* Comments Header */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-blue-800">
              Comments{" "}
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                {comments.length}
              </span>
            </h3>
            <div className="text-sm text-gray-500">
              <select className="border-none bg-transparent focus:outline-none">
                <option>Most recent</option>
                <option>Oldest</option>
              </select>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-6 overflow-y-auto flex-1">
            {rootComments.map((c) => (
              <CommentThread
                key={c._id}
                comment={c}
                depth={0}
                onReplyClick={setReplyTo}
                currentReplyTo={replyTo}
                replyText={replyText}
                setReplyText={setReplyText}
                replyFile={replyFile}
                setReplyFile={setReplyFile}
                onReplySubmit={handleReplySubmit}
                onEditClick={onEditClick}
                currentEditingId={editingId}
                editingText={editingText}
                setEditingText={setEditingText}
                editingFile={editingFile}
                setEditingFile={setEditingFile}
                onEditSubmit={submitEdit}
                onDeleteComment={handleDelete}
                currentUser={user}
                isAdmin={isAdmin}
                onPreview={setPreviewSrc}
              />
            ))}
            <div ref={commentsEndRef} />
          </div>
        </div>
      </div>

      <div className="md:hidden lg:hidden xl:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 mr-2 z-50 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-4 rounded-full shadow-lg sm:flex md:hidden lg:hidden xl:hidden"
        >
          <ChatBubbleBottomCenterIcon className="w-5 h-5" />
        </button>

        {/* Overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 bg-transparent bg-opacity-30 z-40 transition-opacity duration-300 ${
            isOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
        />

        {/* Sidebar */}
        <aside
          className={`fixed top-0 right-0 h-full w-100 max-w-full bg-white shadow-xl z-50 transform transition-transform duration-300 ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <header className="flex-1 flex items-center justify-between p-4 border-b-grey-200">
            <h2 className="text-lg font-semibold">Leave a Comment</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-gray-800 focus:outline-none"
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </header>

          <div className="flex flex-col max-h-full flex-col px-6 py-8">
            {/* Comment Input Form (Moved to Top) */}
            <form onSubmit={handleCommentSubmit} className="mb-6 space-y-2">
              <div className="relative">
                <textarea
                  className="flex-1 w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  rows={1}
                  placeholder="Add comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <label
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
                  onClick={() => handleAttachmentClick("#attachment-input")}
                >
                  <svg
                    className="w-5 h-5 text-gray-500 hover:text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15.172 7l-6.586 6.586a2 2 0 002.828 2.828L17 9.828a4 4 0 00-5.656-5.656l-6.586 6.586a6 6 0 008.485 8.485L19.828 13"
                    />
                  </svg>
                  <input
                    id="attachment-input"
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files);
                      setCommentAttachment(files); // Set files without triggering preview immediately
                    }}
                  />
                </label>
              </div>
              {/* Attachment Details */}
              {commentAttachment && commentAttachment.length > 0 && (
                <div className="mt-2 pl-2 space-y-1">
                  {commentAttachment.map((file, index) => (
                    <span
                      key={index}
                      className="text-sm text-gray-600 underline cursor-pointer block"
                      onClick={() => {
                        if (
                          IMAGE_EXTS.some((ext) =>
                            file.name.toLowerCase().endsWith(ext)
                          )
                        ) {
                          const reader = new FileReader();
                          reader.onload = (event) =>
                            setPreviewSrc(event.target.result);
                          reader.readAsDataURL(file);
                        }
                      }}
                    >
                      {file.name} ({(file.size / 1024).toFixed(2)} KB)
                    </span>
                  ))}
                </div>
              )}
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-600 text-white px-4 py-2 rounded-md mt-2"
                disabled={
                  !newComment.trim() &&
                  (!commentAttachment || commentAttachment.length === 0)
                }
              >
                Submit
              </button>
            </form>

            {/* Comments Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-blue-800">
                Comments{" "}
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {comments.length}
                </span>
              </h3>
              <div className="text-sm text-gray-500">
                <select className="border-none bg-transparent focus:outline-none">
                  <option>Most recent</option>
                  <option>Oldest</option>
                </select>
              </div>
            </div>

            {/* Comments List */}
            <div className="min-h-20 h-100 flex flex-col overflow-y-auto space-y-6 border-2 px-3 py-2 border-gray-200 ">
              {rootComments.map((c) => (
                <CommentThread
                  key={c._id}
                  comment={c}
                  depth={0}
                  onReplyClick={setReplyTo}
                  currentReplyTo={replyTo}
                  replyText={replyText}
                  setReplyText={setReplyText}
                  replyFile={replyFile}
                  setReplyFile={setReplyFile}
                  onReplySubmit={handleReplySubmit}
                  onEditClick={onEditClick}
                  currentEditingId={editingId}
                  editingText={editingText}
                  setEditingText={setEditingText}
                  editingFile={editingFile}
                  setEditingFile={setEditingFile}
                  onEditSubmit={submitEdit}
                  onDeleteComment={handleDelete}
                  currentUser={user}
                  isAdmin={isAdmin}
                  onPreview={setPreviewSrc}
                />
              ))}
              <div ref={commentsEndRef} />
            </div>
          </div>
        </aside>
      </div>

      {previewSrc && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setPreviewSrc(null)}
        >
          <img
            src={previewSrc}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
}
