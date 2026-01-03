import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, "..");
const CONTENT_ROOT = path.join(ROOT, "src", "content", "projects");
const OUTPUT_PATH = path.join(ROOT, "src", "content", "projects-data.json");
const USER = "cmbenello";
const COMMIT_LIMIT = 8;

const loadEnvFile = () => {
  const envPath = path.join(ROOT, ".env.local");
  if (!fsSync.existsSync(envPath)) return;
  const raw = fsSync.readFileSync(envPath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) return;
    const key = match[1];
    let value = match[2] ?? "";
    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

loadEnvFile();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error("Missing GITHUB_TOKEN. Set it before running this script.");
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const readJson = async (filePath) => {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const readText = async (filePath) => {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
};

const fetchJson = async (url, options = {}) => {
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

const fetchText = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        Accept: "application/vnd.github.raw",
      },
    });
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
};

const parseRepo = (value) => {
  if (!value) return "";
  if (value.includes("github.com")) {
    try {
      const url = new URL(value);
      const parts = url.pathname.replace(/^\/+/, "").split("/");
      return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : "";
    } catch {
      return "";
    }
  }
  if (value.includes("/")) return value;
  return `${USER}/${value}`;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
};

const formatCommitMessage = (value) => value.split("\n")[0] || value;

const getRepoData = async (owner, repo) =>
  fetchJson(`https://api.github.com/repos/${owner}/${repo}`);

const getCommitLog = async (owner, repo) =>
  fetchJson(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=${COMMIT_LIMIT}`,
  );

const getCommitActivity = async (owner, repo) => {
  const url = `https://api.github.com/repos/${owner}/${repo}/stats/commit_activity`;
  let response = await fetch(url, { headers });
  if (response.status === 202) {
    await sleep(1200);
    response = await fetch(url, { headers });
  }
  if (!response.ok) return [];
  try {
    const data = await response.json();
    if (!Array.isArray(data)) return [];
    return data.map((entry) => entry.total || 0);
  } catch {
    return [];
  }
};

const getReadme = async (owner, repo) =>
  fetchText(`https://api.github.com/repos/${owner}/${repo}/readme`);

const loadContributionCalendar = async () => {
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          months {
            name
            firstDay
            totalWeeks
          }
          weeks {
            firstDay
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }`;

  const to = new Date();
  const from = new Date();
  from.setFullYear(to.getFullYear() - 1);

  try {
    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          login: USER,
          from: from.toISOString(),
          to: to.toISOString(),
        },
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    return (
      data?.data?.user?.contributionsCollection?.contributionCalendar || null
    );
  } catch {
    return null;
  }
};

const toTitleCase = (value) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

const loadProjects = async () => {
  const categoryEntries = await fs.readdir(CONTENT_ROOT, {
    withFileTypes: true,
  });

  const categories = [];

  for (const entry of categoryEntries) {
    if (!entry.isDirectory()) continue;
    const categorySlug = entry.name;
    const categoryDir = path.join(CONTENT_ROOT, categorySlug);
    const projectEntries = await fs.readdir(categoryDir, {
      withFileTypes: true,
    });
    const projects = [];

    for (const projectEntry of projectEntries) {
      if (!projectEntry.isDirectory()) continue;
      const projectDir = path.join(categoryDir, projectEntry.name);
      const config = await readJson(path.join(projectDir, "project.json"));
      if (!config || !config.repo) continue;

      const repoId = parseRepo(config.repo);
      if (!repoId) continue;

      const [owner, repo] = repoId.split("/");
      const repoData = await getRepoData(owner, repo);
      const commits = await getCommitLog(owner, repo);
      const commitActivity = await getCommitActivity(owner, repo);

      const localReadme =
        (await readText(path.join(projectDir, "readme.md"))) ||
        (await readText(path.join(projectDir, "README.md")));
      const remoteReadme = localReadme
        ? ""
        : await getReadme(owner, repo);

      const summary = config.summary || repoData?.description || "";
      const description = repoData?.description || "";

      projects.push({
        name: config.title || repo,
        repo: repoId,
        url: repoData?.html_url || `https://github.com/${repoId}`,
        summary,
        description,
        image: config.image || "",
        timelineStart: config.timelineStart || "",
        timelineEnd: config.timelineEnd || "",
        homepage: repoData?.homepage || "",
        language: repoData?.language || "",
        tags: Array.isArray(config.tags) ? config.tags : [],
        activity: Array.isArray(config.activity) ? config.activity : [],
        topics: Array.isArray(repoData?.topics) ? repoData.topics : [],
        stars: repoData?.stargazers_count || 0,
        forks: repoData?.forks_count || 0,
        issues: repoData?.open_issues_count || 0,
        updatedAt: formatDate(repoData?.updated_at),
        createdAt: formatDate(repoData?.created_at),
        pushedAt: formatDate(repoData?.pushed_at),
        defaultBranch: repoData?.default_branch || "",
        license: repoData?.license?.name || "",
        commitLog: Array.isArray(commits)
          ? commits.map((commit) => ({
              sha: commit.sha.slice(0, 7),
              message: formatCommitMessage(commit.commit.message),
              url: commit.html_url,
              date: formatDate(commit.commit.author?.date),
              author:
                commit.commit.author?.name ||
                commit.author?.login ||
                "Unknown",
            }))
          : [],
        commitActivity,
        readme: (localReadme || remoteReadme || "").trim(),
      });
    }

    categories.push({
      title: toTitleCase(categorySlug),
      slug: categorySlug,
      projects,
    });
  }

  return categories;
};

const main = async () => {
  const categories = await loadProjects();
  const contributions = await loadContributionCalendar();

  const output = {
    generatedAt: new Date().toISOString(),
    user: USER,
    contributions,
    categories,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`Wrote ${OUTPUT_PATH}`);
};

main();
