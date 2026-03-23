import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yaml from "js-yaml";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDir, "..");
const REGISTRY_PATH = path.join(ROOT, "src", "content", "projects.yml");
const OUTPUT_PATH = path.join(ROOT, "src", "content", "projects-data.json");
const USER = "cmbenello";
const COMMIT_LIMIT = 8;
const CONCURRENCY = 5;

// ── Env + Auth ────────────────────────────────────────────────────────────────

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
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url, options = {}) => {
  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      console.error(`  API error ${response.status} for ${url}`);
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error(`  Fetch failed for ${url}: ${e.message}`);
    return null;
  }
};

const fetchText = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: { ...headers, Accept: "application/vnd.github.raw" },
    });
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
};

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString().slice(0, 10);
};

const formatCommitMessage = (value) => value.split("\n")[0] || value;

const toTitleCase = (value) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");

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

// ── Concurrency pool ──────────────────────────────────────────────────────────

const poolMap = async (items, fn, concurrency = CONCURRENCY) => {
  const results = new Array(items.length);
  let index = 0;

  const worker = async () => {
    while (index < items.length) {
      const i = index++;
      results[i] = await fn(items[i], i);
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
};

// ── GitHub API ────────────────────────────────────────────────────────────────

const fetchAllUserRepos = async () => {
  const repos = [];
  let page = 1;
  while (true) {
    const batch = await fetchJson(
      `https://api.github.com/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`,
    );
    if (!batch || !batch.length) break;
    repos.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return repos;
};

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
          months { name firstDay totalWeeks }
          weeks {
            firstDay
            contributionDays { date contributionCount color }
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
      headers: { ...headers, "Content-Type": "application/json" },
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

// ── Registry ──────────────────────────────────────────────────────────────────

const loadRegistry = async () => {
  try {
    const raw = await fs.readFile(REGISTRY_PATH, "utf8");
    const entries = yaml.load(raw);
    if (!Array.isArray(entries)) return [];
    return entries.map((entry) => ({
      ...entry,
      repo: parseRepo(entry.repo),
    }));
  } catch {
    console.warn("No projects.yml found, using auto-import only.");
    return [];
  }
};

// ── Enrich a single repo ──────────────────────────────────────────────────────

const enrichRepo = async (repoData, override) => {
  const owner = repoData.owner.login;
  const repo = repoData.name;
  const repoId = `${owner}/${repo}`;

  console.log(`  Enriching ${repoId}...`);

  const [commits, commitActivity, readme] = await Promise.all([
    getCommitLog(owner, repo),
    getCommitActivity(owner, repo),
    getReadme(owner, repo),
  ]);

  const summary = override.summary || repoData.description || "";

  return {
    name: override.title || repo,
    repo: repoId,
    url: repoData.html_url || `https://github.com/${repoId}`,
    category: override.category || "uncategorized",
    summary,
    description: repoData.description || "",
    image: override.image || "",
    homepage: repoData.homepage || "",
    language: repoData.language || "",
    tags: Array.isArray(override.tags) ? override.tags : [],
    topics: Array.isArray(repoData.topics) ? repoData.topics : [],
    stars: repoData.stargazers_count || 0,
    forks: repoData.forks_count || 0,
    issues: repoData.open_issues_count || 0,
    updatedAt: formatDate(repoData.updated_at),
    createdAt: formatDate(repoData.created_at),
    pushedAt: formatDate(repoData.pushed_at),
    defaultBranch: repoData.default_branch || "",
    license: repoData.license?.name || "",
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
    readme: (readme || "").trim(),
  };
};

// ── Main ──────────────────────────────────────────────────────────────────────

const main = async () => {
  console.log("Loading registry...");
  const registry = await loadRegistry();
  const registryByRepo = new Map(
    registry.filter((e) => e.repo).map((e) => [e.repo.toLowerCase(), e]),
  );

  console.log(`Registry: ${registry.length} entries`);

  console.log("Fetching all public repos...");
  const allRepos = await fetchAllUserRepos();
  console.log(`Found ${allRepos.length} public repos`);

  // Also fetch repos from registry that belong to other users
  const externalRepos = registry
    .filter((e) => e.repo && !e.repo.toLowerCase().startsWith(`${USER.toLowerCase()}/`))
    .map((e) => e.repo);

  const externalRepoData = await poolMap(externalRepos, async (repoId) => {
    const [owner, repo] = repoId.split("/");
    return fetchJson(`https://api.github.com/repos/${owner}/${repo}`);
  });

  const allRepoData = [...allRepos];
  for (const data of externalRepoData) {
    if (data) allRepoData.push(data);
  }

  // Build hidden set
  const hiddenSet = new Set(
    registry
      .filter((e) => e.hidden)
      .map((e) => e.repo.toLowerCase()),
  );

  // Filter out forks and hidden repos
  const eligibleRepos = allRepoData.filter((r) => {
    const repoId = `${r.owner.login}/${r.name}`.toLowerCase();
    if (hiddenSet.has(repoId)) return false;
    if (r.fork) return false;
    return true;
  });

  console.log(`Enriching ${eligibleRepos.length} repos (concurrency: ${CONCURRENCY})...`);

  const projects = await poolMap(eligibleRepos, async (repoData) => {
    const repoId = `${repoData.owner.login}/${repoData.name}`.toLowerCase();
    const override = registryByRepo.get(repoId) || {};
    return enrichRepo(repoData, override);
  });

  // Sort: categorized first (alphabetically), then uncategorized
  projects.sort((a, b) => {
    if (a.category === "uncategorized" && b.category !== "uncategorized") return 1;
    if (a.category !== "uncategorized" && b.category === "uncategorized") return -1;
    const catCmp = a.category.localeCompare(b.category);
    if (catCmp !== 0) return catCmp;
    return a.name.localeCompare(b.name);
  });

  console.log("Loading contribution calendar...");
  const contributions = await loadContributionCalendar();

  const output = {
    generatedAt: new Date().toISOString(),
    user: USER,
    contributions,
    projects,
  };

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2));

  const categorized = projects.filter((p) => p.category !== "uncategorized").length;
  const uncategorized = projects.length - categorized;
  console.log(
    `Wrote ${OUTPUT_PATH} (${projects.length} projects: ${categorized} categorized, ${uncategorized} uncategorized)`,
  );
};

main();
