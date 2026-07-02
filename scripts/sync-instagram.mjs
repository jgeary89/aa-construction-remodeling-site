import { mkdir, readFile, writeFile } from "node:fs/promises";

const token = process.env.INSTAGRAM_ACCESS_TOKEN;
let igUserId = process.env.INSTAGRAM_USER_ID;
const facebookPageId = process.env.INSTAGRAM_FACEBOOK_PAGE_ID;
const apiVersion = process.env.INSTAGRAM_API_VERSION || "v24.0";
const outputPath = process.env.GALLERY_FEED_PATH || "data/gallery-feed.json";
const profile = process.env.INSTAGRAM_PROFILE || "aaconstruction.inc";
const mediaLimit = process.env.INSTAGRAM_MEDIA_LIMIT || "36";

if (!token) {
  throw new Error("Set INSTAGRAM_ACCESS_TOKEN before running the Instagram gallery sync.");
}

if (!igUserId && facebookPageId) {
  igUserId = await getConnectedInstagramUserId(facebookPageId);
}

if (!igUserId) {
  throw new Error(
    "Set INSTAGRAM_USER_ID to the authorized Instagram professional account ID, or set INSTAGRAM_FACEBOOK_PAGE_ID so the script can discover it.",
  );
}

const fields = [
  "id",
  "caption",
  "media_type",
  "media_url",
  "permalink",
  "thumbnail_url",
  "timestamp",
  "children{media_type,media_url,thumbnail_url,permalink,timestamp}",
].join(",");

const endpoint = new URL(`https://graph.facebook.com/${apiVersion}/${igUserId}/media`);
endpoint.searchParams.set("fields", fields);
endpoint.searchParams.set("limit", mediaLimit);
endpoint.searchParams.set("access_token", token);

const payload = await getJson(endpoint);
const items = (payload.data || []).map((item) => {
  const displayMedia = getDisplayMedia(item);
  const category = classifyMedia(item.caption || "");
  const mediaType = displayMedia.mediaType || "IMAGE";
  const title = `${prettyCategory(category)} ${mediaType === "VIDEO" ? "Video" : "Project"}`;

  return {
    id: item.id,
    title,
    caption: cleanCaption(item.caption || `Latest ${prettyCategory(category).toLowerCase()} project media from Instagram.`),
    category,
    mediaType,
    instagramMediaType: item.media_type || mediaType,
    src: displayMedia.src,
    thumbnailUrl: displayMedia.thumbnailUrl,
    permalink: item.permalink || displayMedia.permalink,
    timestamp: item.timestamp || displayMedia.timestamp,
  };
}).filter((item) => item.src);

const previousFeed = await readPreviousFeed(outputPath);
const nextFeed = {
  source: "instagram",
  profile,
  updatedAt: new Date().toISOString(),
  items: items.length ? items : previousFeed.items || [],
};

await mkdir("data", { recursive: true });
await writeFile(outputPath, `${JSON.stringify(nextFeed, null, 2)}\n`);

console.log(`Synced ${items.length} Instagram media items to ${outputPath}`);

async function getConnectedInstagramUserId(pageId) {
  const pageEndpoint = new URL(`https://graph.facebook.com/${apiVersion}/${pageId}`);
  pageEndpoint.searchParams.set("fields", "instagram_business_account{id,username}");
  pageEndpoint.searchParams.set("access_token", token);

  const page = await getJson(pageEndpoint);
  const connectedAccount = page.instagram_business_account;
  if (!connectedAccount?.id) {
    throw new Error(`No Instagram professional account is connected to Facebook Page ID ${pageId}.`);
  }

  console.log(`Using connected Instagram account ${connectedAccount.username || connectedAccount.id}`);
  return connectedAccount.id;
}

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Instagram sync failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

async function readPreviousFeed(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return { items: [] };
  }
}

function getDisplayMedia(item) {
  const firstChild = Array.isArray(item.children?.data)
    ? item.children.data.find((child) => child.media_url || child.thumbnail_url)
    : null;
  const media = firstChild || item;
  const mediaType = (media.media_type || item.media_type || "IMAGE").toUpperCase();

  return {
    mediaType: mediaType === "CAROUSEL_ALBUM" ? "IMAGE" : mediaType,
    src: media.media_url || media.thumbnail_url,
    thumbnailUrl: media.thumbnail_url || media.media_url,
    permalink: media.permalink || item.permalink,
    timestamp: media.timestamp || item.timestamp,
  };
}

function classifyMedia(text) {
  const normalized = text.toLowerCase().replace(/[#/_-]+/g, " ");
  const compact = normalized.replace(/\s+/g, "");
  const categories = [
    ["kitchen", ["kitchen", "kitchenremodel", "cabinet", "counter", "backsplash", "island", "pantry", "sink"]],
    ["bathroom", ["bath", "bathroom", "bathroomremodel", "shower", "vanity", "toilet", "tub", "waterproof"]],
    ["exterior", ["exterior", "siding", "porch", "entry", "door", "deck", "roof", "gutter", "fascia"]],
    ["interior", ["interior", "drywall", "paint", "flooring", "trim", "baseboard", "living", "bedroom"]],
    ["new-builds", ["new build", "newbuild", "newbuilds", "new construction", "ground up", "groundup", "framing", "foundation"]],
    ["additions", ["addition", "additions", "room addition", "roomaddition", "add on", "addon", "build out", "buildout", "expansion"]],
    ["repair", ["repair", "restore", "patch", "damage", "replace", "fix"]],
  ];

  return categories.find(([, keywords]) => keywords.some((keyword) => normalized.includes(keyword) || compact.includes(keyword.replace(/\s+/g, ""))))?.[0] || "interior";
}

function prettyCategory(category) {
  return {
    kitchen: "Kitchen",
    bathroom: "Bathroom",
    interior: "Interior",
    exterior: "Exterior",
    "new-builds": "New Build",
    additions: "Room Addition",
    repair: "Repair",
  }[category] || "Project";
}

function cleanCaption(caption) {
  return caption.replace(/\s+/g, " ").trim().slice(0, 180);
}
