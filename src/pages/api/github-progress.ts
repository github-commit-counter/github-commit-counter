import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";
import flatCache from "flat-cache";
import path from "path";
import fs from "fs";

const cachePath = path.join(process.cwd(), "tmp");

if (!fs.existsSync(cachePath)) {
  fs.mkdirSync(cachePath, { recursive: true });
}

const cache = flatCache.load("crawlerCache", cachePath),
  ttl = 6 * 3600 * 1000; // 6 hour

/**
 * Get user total commit count with profile crawler
 *
 * @param username github username
 * @param year target year
 *
 * @returns integer
 */
async function getUserTotalCommitCount(
  username: string,
  year: number,
  targetCommitCount: number
): Promise<number> {
  const url = `https://github.com/${username}?tab=contributions&from=${year}-01-01&to=${year}-12-31`;

  const now = Date.now(),
    cacheKey = `${url}-${targetCommitCount}`,
    cachedData = cache.getKey(cacheKey);

  if (cachedData && now - cachedData.timestamp < ttl) {
    return cachedData.commitCount;
  }

  const userProfileHtml = await fetch(url, {
    headers: {
      "x-requested-with": "XMLHttpRequest",
    },
  });

  if (userProfileHtml.status === 404) {
    return -1;
  }

  let userProfileHtmlText: string = await userProfileHtml.text();

  userProfileHtmlText = userProfileHtmlText
    .replace(/[\n\t\r]+| {2,}/g, " ")
    .trim();

  // if local development, save into file, for debugging
  // if (process.env.NODE_ENV === "development") {
  //   // save into file, for debugging
  //   fs.writeFileSync("user-profile.html", userProfileHtmlText);
  // }

  const commitCountMatches = userProfileHtmlText.match(
    /([0-9,]+)[ ]+contributions[ ]+in[ ]+([0-9]{4})/i
  );

  if (!commitCountMatches) {
    throw new Error("User profile html text not match.");
  }

  const commitCount = Number(commitCountMatches[1].replaceAll(",", ""));

  cache.setKey(cacheKey, { timestamp: now, commitCount });
  cache.save(true);

  return commitCount;
}

/**
 * Github commit progress api endpoint
 */
const githubProgressApi = async (req: NextApiRequest, res: NextApiResponse) => {
  const { username, year, target } = req.query;

  if (!username || !year || !target) {
    return res
      .status(400)
      .json({ error: "Query params username, year, target is required." });
  }

  try {
    const commitCount = await getUserTotalCommitCount(
      username as string,
      Number(year),
      Number(target)
    );

    if (commitCount === -1) {
      return res.status(200).setHeader("Content-Type", "image/svg+xml")
        .send(`<svg width="450" height="25" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#eee" />
        <rect width="100%" height="100%" fill="#fc0341" />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#fff">
          user not found
        </text>
      </svg>`);
    }

    const targetCommitCount = Number(target),
      percentage = Math.round((commitCount / targetCommitCount) * 100);

    // see all supported content types: https://github.com/atmos/camo/blob/master/mime-types.json
    return res.status(200).setHeader("Content-Type", "image/svg+xml")
      .send(`<svg width="450" height="25" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#eee" />
      <rect width="${percentage}%" height="100%" fill="#f5dd42" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#000">
        ${percentage}%
      </text>
    </svg>`);
  } catch (error: any) {
    return res.status(200).setHeader("Content-Type", "image/svg+xml")
      .send(`<svg width="450" height="25" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#eee" />
        <rect width="100%" height="100%" fill="#fc0341" />
        <text x="50%" y="50%" fill="#fff">
          ${JSON.stringify(error) || "Server Error"}
        </text>
      </svg>`);
  }
};

export default githubProgressApi;
