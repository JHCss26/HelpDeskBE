// src/utils/stringHelpers.js
export function getInitials(fullName) {
  if (!fullName) return ''
  const parts = fullName.trim().split(/\s+/)
  // grab first two words (or fewer)
  const initials = parts
    .slice(0, 2)
    .map(name => name[0].toUpperCase())
    .join('')
  return initials
}