const fs = require('fs');

const readMaintainers = async (path) => {
  const rawMaintainers = await fs.promises.readFile(path, {encoding: 'utf8'});
  return rawMaintainers.trim().split('\n')
    .map((maintainer) => `@${maintainer}`)
    .join(' ');
};

module.exports = async ({ github, context: { payload }, maintainersFile }) => {
  // https://developer.github.com/v3/search/#search-issues-and-pull-requests
  const { data: { total_count, items: [pr] } } = await github.search.issuesAndPullRequests({
    q: `${payload.head_commit.id}+repo:${payload.repository.full_name}+type:pr+is:merged`,
  });

  if (!total_count) {
    throw new Error('No PR found');
  }

  const prLink = `${payload.repository.full_name}#${pr.number}`;
  const maintainersPart = await readMaintainers(maintainersFile);

  return {
    prTitle: `Node: ${pr.title}`,
    prBody: `${prLink}\n${maintainersPart}`,
    prNumber: pr.number,
  };
}
