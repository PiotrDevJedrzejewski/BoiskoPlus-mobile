import customFetch from "./customFetch";
import { formatEventDateLabel, getEventTitle } from "./eventDisplay";

// Only paths under /link-redirect/ open the app (see app.config.js and the
// /.well-known files on boiskoplus.pl). The domain is always without "www".
export const APP_LINK_BASE_URL = "https://boiskoplus.pl/link-redirect";

// Public event link that any logged-in user can share.
// `userId` is saved by the server as `referredBy` when someone joins.
export const buildEventLink = (eventId, userId) => {
  let link = `${APP_LINK_BASE_URL}/event/${eventId}`;
  if (userId) {
    link += `?ref=${userId}`;
  }
  return link;
};

// Invitation link (organizer only). Works for public and private events.
export const buildInviteLink = (token) => {
  return `${APP_LINK_BASE_URL}/invite/${token}`;
};

// The server returns the existing invite token or creates it on first use.
export const fetchInviteLink = async (eventId) => {
  const response = await customFetch.post(
    `/football-events/${eventId}/invite-link`,
  );
  return buildInviteLink(response.data.token);
};

export const buildShareMessage = (event, link) => {
  const title = getEventTitle(event);
  const dateLabel = formatEventDateLabel(event);

  let message = `Dołącz do wydarzenia "${title}" w Boisko+!`;
  if (dateLabel) {
    message += `\n${dateLabel}`;
  }
  message += `\n${link}`;
  return message;
};

// The event creator can be stored as an id string or as a populated user object.
export const getEventOwnerId = (event) => {
  const createdBy = event?.createdBy;
  if (!createdBy) {
    return null;
  }
  if (typeof createdBy === "object" && createdBy._id) {
    return String(createdBy._id);
  }
  return String(createdBy);
};
