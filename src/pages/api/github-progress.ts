import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";
import fs from "fs";

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
  year: number
): Promise<number> {
  const userProfileHtml = await fetch(
    `https://github.com/${username}?tab=contributions&from=${year}-01-01&to=${year}-12-31`,
    {
      headers: {
        "x-requested-with": "XMLHttpRequest",
      },
    }
  );

  if (userProfileHtml.status === 404) {
    throw new Error("User not found");
  }

  let userProfileHtmlText: string = await userProfileHtml.text();

  userProfileHtmlText = userProfileHtmlText
    .replace(/[\n\t\r]+| {2,}/g, " ")
    .trim();

  // save into file, for debugging
  // fs.writeFileSync("user-profile.html", userProfileHtmlText);

  const commitCountMatches = userProfileHtmlText.match(
    /([0-9,]+)[ ]+contributions[ ]+in[ ]+([0-9]{4})/i
  );

  if (!commitCountMatches) {
    throw new Error("User profile html text not match.");
  }

  const commitCount = commitCountMatches[1].replaceAll(",", "");

  return parseInt(commitCount, 10);
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
      parseInt(year as string, 10)
    );

    const targetCommitCount = parseInt(target as string, 10),
      percentage = Math.round((commitCount / targetCommitCount) * 100);

    return res.status(200).setHeader("Content-Type", "image/svg+xml")
      .send(`<svg width="450" height="25" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#eee" />
      <rect width="${percentage}%" height="100%" fill="#f5dd42" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#000">
        ${percentage}%
      </text>
    </svg>`);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default githubProgressApi;
