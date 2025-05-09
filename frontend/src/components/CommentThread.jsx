import React from "react";
import { formatDistanceToNow } from "date-fns";

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".gif"];
const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function CommentThread({
  comment,
  depth = 0,

  // Reply props
  onReplyClick,
  currentReplyTo,
  replyText,
  setReplyText,
  replyFile,
  setReplyFile,
  onReplySubmit,

  // Edit/Delete props
  onEditClick,
  currentEditingId,
  editingText,
  setEditingText,
  editingFile,
  setEditingFile,
  onEditSubmit,
  onDeleteComment,

  // User context
  currentUser,
  isAdmin,

  // Image preview
  onPreview,
}) {
  const canModify = comment.user._id === currentUser._id || isAdmin;
  const isEditing = currentEditingId === comment._id;
  const isReplying = currentReplyTo === comment._id;

  // Format timestamp (e.g., "58 minutes ago")
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  const isImage = (filename) =>
    IMAGE_EXTS.some((ext) => filename.toLowerCase().endsWith(ext));

  // Handle file input click to prevent multiple triggers
  const handleAttachmentClick = (inputId) => {
    const input = document.querySelector(inputId);
    if (input) {
      input.click();
      input.value = null; // Reset value to allow reselecting the same file
    }
  };

  return (
    <div className={`flex ${depth > 0 ? "ml-8" : ""} my-4`}>
      {/* Avatar */}
      <div className="flex-shrink-0 mr-3">
        {comment.user.avatar ? (
          <img
            src={comment.user.avatar}
            alt={comment.user.name}
            className="h-10 w-10 rounded-full object-cover"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-semibold">
            {comment.user.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Comment Content */}
      <div className="flex-1">
        {/* Username and Timestamp */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-gray-800">
              {comment.user.name}
            </span>
            <span className="text-sm text-gray-500 ml-2">{timeAgo}</span>
          </div>
        </div>

        {/* Comment Text */}
        <p className="mt-1 text-gray-800">{comment.text}</p>

        {/* Comment Attachment (if any) */}
        {comment.attachments && comment.attachments.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.attachments.map((attachment, index) => {
              const isImg = isImage(attachment);
              const attachmentUrl = `${baseURL}/${attachment}`;
              return isImg ? (
                <img
                  key={index}
                  src={attachmentUrl}
                  alt={`attachment-${index}`}
                  className="h-16 w-16 object-cover cursor-pointer rounded"
                  onClick={() => onPreview(attachmentUrl)}
                />
              ) : (
                <a
                  key={index}
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-600 underline text-sm"
                >
                  {attachment.split("/").pop()}
                </a>
              );
            })}
          </div>
        )}

        {/* Actions (Likes, Reply, Edit, Delete) */}
        <div className="flex items-center mt-2 space-x-3 text-sm text-gray-500">
          <button className="flex items-center hover:text-gray-700">
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
            {comment.likes || 0}
          </button>
          <button
            onClick={() => onReplyClick(comment._id)}
            className="flex items-center hover:text-gray-700"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m0-12l-6 6"
              />
            </svg>
            Reply
          </button>
          {canModify && (
            <>
              <button
                onClick={() => onEditClick(comment)}
                className="hover:text-gray-700"
              >
                Edit
              </button>
              <button
                onClick={() => onDeleteComment(comment._id)}
                className="hover:text-gray-700"
              >
                Delete
              </button>
            </>
          )}
        </div>

        {/* Inline Edit Form */}
        {isEditing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onEditSubmit(comment._id);
            }}
            className="mt-4 space-y-2"
          >
            <div className="relative">
              <textarea
                rows={1}
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                className="flex-1 w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
              <label
                className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
                onClick={() => handleAttachmentClick("#edit-attachment-input")}
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
                  id="edit-attachment-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setEditingFile(files); // Set files without triggering preview immediately
                  }}
                />
              </label>
            </div>
            {/* Attachment Details */}
            {editingFile && editingFile.length > 0 && (
              <div className="mt-2 pl-2 space-y-1">
                {editingFile.map((file, index) => (
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
                        reader.onload = (event) => onPreview(event.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mt-2 mx-2"
                disabled={
                  !editingText.trim() &&
                  (!editingFile || editingFile.length === 0)
                }
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => onEditClick(null)}
                className="text-blue-500 mx-2 border-blue-600 border-2 px-4 py-2 rounded-md mt-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Inline Reply Form */}
        {isReplying && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onReplySubmit(comment._id);
            }}
            className="mt-4 space-y-2"
          >
            <div className="relative">
              <textarea
                rows={1}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className="flex-1 w-full border border-gray-300 rounded-md shadow-sm p-2 pr-10 focus:ring-blue-500 focus:border-blue-500 resize-none"
                placeholder="Add a reply…"
              />
              <label
                className="absolute right-2 top-1/2 transform -translate-y-1/2 cursor-pointer"
                onClick={() => handleAttachmentClick("#reply-attachment-input")}
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
                  id="reply-attachment-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    setReplyFile(files); // Set files without triggering preview immediately
                  }}
                />
              </label>
            </div>
            {/* Attachment Details */}
            {replyFile && replyFile.length > 0 && (
              <div className="mt-2 pl-2 space-y-1">
                {replyFile.map((file, index) => (
                  <span
                    key={index}
                    className="text-sm text-blue-600 underline cursor-pointer block"
                    onClick={() => {
                      if (
                        IMAGE_EXTS.some((ext) =>
                          file.name.toLowerCase().endsWith(ext)
                        )
                      ) {
                        const reader = new FileReader();
                        reader.onload = (event) => onPreview(event.target.result);
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </span>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md mt-2 mx-2"
                disabled={
                  !replyText.trim() && (!replyFile || replyFile.length === 0)
                }
              >
                Submit
              </button>
              <button
                type="button"
                onClick={() => onReplyClick(null)}
                className="text-blue-500 mx-2 border-blue-600 border-2 px-4 py-2 rounded-md mt-2"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Nested Replies */}
        {comment.replies.length > 0 && (
          <div className="mt-4 space-y-6">
            {comment.replies.map((child) => (
              <CommentThread
                key={child._id}
                comment={child}
                depth={depth + 1}
                onReplyClick={onReplyClick}
                currentReplyTo={currentReplyTo}
                replyText={replyText}
                setReplyText={setReplyText}
                replyFile={replyFile}
                setReplyFile={setReplyFile}
                onReplySubmit={onReplySubmit}
                onEditClick={onEditClick}
                currentEditingId={currentEditingId}
                editingText={editingText}
                setEditingText={setEditingText}
                editingFile={editingFile}
                setEditingFile={setEditingFile}
                onEditSubmit={onEditSubmit}
                onDeleteComment={onDeleteComment}
                currentUser={currentUser}
                isAdmin={isAdmin}
                onPreview={onPreview}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}