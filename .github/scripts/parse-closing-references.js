// Which issues a merged PR body actually closes.
//
// GitHub's own semantics: a closing keyword closes the reference that directly
// follows it, and nothing else. The first version of this matcher tested the
// keyword against a whole line and then closed every issue mentioned on it, so
// `Closes #881. Part 1 of 4 (#882 UI chrome, #883 locale strings)` closed four
// issues instead of one (#888).

const CLOSING_REFERENCE_PATTERN =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\b[ \t]*:?[ \t]+(?:(?<owner>[A-Za-z0-9_.-]+)\/(?<repo>[A-Za-z0-9_.-]+))?#(?<number>\d+)/gi

/**
 * @param {string} body PR body.
 * @param {{ owner: string, repo: string }} repository The repository the PR was merged into.
 * @returns {number[]} Same-repository issue numbers, in ascending order, deduplicated.
 */
function parseClosingReferences(body, repository) {
  const issueNumbers = new Set()

  for (const match of String(body || '').matchAll(CLOSING_REFERENCE_PATTERN)) {
    const referenceOwner = match.groups?.owner || repository.owner
    const referenceRepo = match.groups?.repo || repository.repo
    const issueNumber = Number.parseInt(match.groups?.number || '', 10)

    if (!Number.isInteger(issueNumber) || issueNumber <= 0) {
      continue
    }

    if (referenceOwner === repository.owner && referenceRepo === repository.repo) {
      issueNumbers.add(issueNumber)
    }
  }

  return [...issueNumbers].sort((a, b) => a - b)
}

module.exports = { parseClosingReferences, CLOSING_REFERENCE_PATTERN }
