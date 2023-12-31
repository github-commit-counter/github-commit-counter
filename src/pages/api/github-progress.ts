import { NextApiRequest, NextApiResponse } from "next";
import fetch from "node-fetch";

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
): Promise<any> {
  const userProfileHtml = await fetch(
    `https://github.com/${username}?tab=overview&from=${year}-01-01&to=${year}-12-31`
  );

  if (userProfileHtml.status === 404) {
    throw new Error("User not found");
  }

  let userProfileHtmlText: string = await userProfileHtml.text();

  userProfileHtmlText = userProfileHtmlText
    .replaceAll("\n", "")
    .replaceAll("\t", "")
    .replaceAll("  ", " ")
    .replaceAll("\r", "");

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
 * Github commit progress api
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
      progress = Math.round((commitCount / targetCommitCount) * 100);

    res.status(200).json({ commitCount, progress });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export default githubProgressApi;
