const fs = require('fs');

const readMaintainers = async (path) => {
  const rawMaintainers = await fs.promises.readFile(path);
  return rawMaintainers.split('\n')
    .map((maintainer) => `@${maintainer}`)
    .join(' ');
};


module.exports = async ({ github, context: { payload }, maintainersFile }) => {
  // https://developer.github.com/v3/search/#search-issues-and-pull-requests
  const { total_count, items: [pr] } = await github.search.issuesAndPullRequests({
    q: `${payload.event.head_commit.id}+repo:${payload.event.repository.full_name}+type:pr+is:merged`,
  });

  // Use pr title if available or fallback to first line of head commit message
  const title = total_count
    ? pr.title
    : payload.event.head_commit.message.split('\n')[0];

  const prTitle = `Node: ${title}`;

  // Link to either the pull request or commit range
  const refMessage = total_count
    ? `Pull Request: ${payload.event.repository.full_name}#${pr.number}`
    : `Commit: ${payload.event.repository.html_url}/compare/${payload.event.before}...${payload.event.after}`;

  const maintainersPart = await readMaintainers(maintainersFile);

  const prBody = `${refMessage}\n${maintainersPart}`;

  // Use prNumber of 0 to indicate that we found no PR
  const prNumber = total_count
    ? pr.number
    : 0;

  return {
    prTitle,
    prBody,
    prNumber,
  };
}
