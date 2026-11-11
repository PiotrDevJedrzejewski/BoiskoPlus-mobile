import { hasAuthToken } from "../assets/utils/customFetch";
import { useDeepLinkStore } from "../context/deepLinkStore";

// Expo Router calls redirectSystemPath for every URL that opens the app
// (Universal Links, App Links, custom scheme). `path` can be a full URL,
// e.g. "https://boiskoplus.pl/link-redirect/event/<id>?ref=<userId>"
// or "boiskoplusmobile://link-redirect/event/<id>".

const LINK_REDIRECT_MARKER = "link-redirect/";
const MONGO_ID_REGEX = /^[a-f0-9]{24}$/;
const INVITE_TOKEN_REGEX = /^[A-Za-z0-9_-]{16}$/;

// URLSearchParams polyfill in React Native is incomplete, so the query is parsed by hand
const parseQuery = (queryString) => {
  const query = {};
  if (!queryString) {
    return query;
  }

  const pairs = queryString.split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (key) {
      query[decodeURIComponent(key)] = decodeURIComponent(value || "");
    }
  }
  return query;
};

// Returns the app route for a /link-redirect/ link, or "/" when the link is invalid
const getRouteFromLink = (linkPart) => {
  const [pathPart, queryString] = linkPart.split("?");
  const segments = pathPart.split("/").filter(Boolean);
  const query = parseQuery(queryString);

  const type = segments[0];
  const value = segments[1];

  if (type === "event" && MONGO_ID_REGEX.test(value)) {
    let route = `/(auth)/single-event?id=${value}`;
    if (MONGO_ID_REGEX.test(query.ref || "")) {
      route += `&ref=${query.ref}`;
    }
    return route;
  }

  if (type === "invite" && INVITE_TOKEN_REGEX.test(value || "")) {
    return `/(auth)/event-invite?token=${value}`;
  }

  return "/";
};

export async function redirectSystemPath({ path, initial }) {
  try {
    // TODO: remove after the first test on a device
    console.log("[native-intent] path:", path, "initial:", initial);

    const markerIndex = path.indexOf(LINK_REDIRECT_MARKER);

    // Not our link (dev client, OAuth redirects etc.) — leave it untouched
    if (markerIndex === -1) {
      return path;
    }

    const linkPart = path.slice(markerIndex + LINK_REDIRECT_MARKER.length);
    const route = getRouteFromLink(linkPart);

    if (route === "/") {
      return "/";
    }

    // Cold start: AuthContext always sends the user to dashboard-home after
    // login, so the route waits in the store and (auth)/_layout opens it.
    if (initial) {
      useDeepLinkStore.getState().setPendingRoute(route);
      return "/";
    }

    // App was in the background: open the route directly if the user is logged in
    const isLoggedIn = await hasAuthToken();
    if (isLoggedIn) {
      return route;
    }

    useDeepLinkStore.getState().setPendingRoute(route);
    return "/";
  } catch (error) {
    console.error("[native-intent] Failed to handle link:", error);
    return path;
  }
}
