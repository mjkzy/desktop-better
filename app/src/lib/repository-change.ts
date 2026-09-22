/** The state of the current branch that a change description compares */
export interface IRepositorySnapshot {
  readonly branchName: string | null
  readonly tipSha: string | null
  readonly upstreamName: string | null
  readonly upstreamSha: string | null
  readonly ahead: number
  readonly behind: number
}

function commits(count: number) {
  return count === 1 ? '1 commit' : `${count} commits`
}

/**
 * Describe the change between two snapshots of a repository in one short
 * sentence, or return `null` when the branch state did not change.
 *
 * @param newCommitCount The number of commits reachable from the new tip
 *                       but not from the old tip, or `null` when unknown
 */
export function describeRepositoryChange(
  before: IRepositorySnapshot,
  after: IRepositorySnapshot,
  newCommitCount: number | null
): string | null {
  if (before.branchName !== after.branchName) {
    return after.branchName === null
      ? 'HEAD is now detached'
      : `Switched to ${after.branchName}`
  }

  const branch = after.branchName ?? 'HEAD'
  const tipChanged = before.tipSha !== after.tipSha
  const upstreamChanged = before.upstreamSha !== after.upstreamSha
  const inSyncAfter =
    after.upstreamSha !== null && after.tipSha === after.upstreamSha

  if (!tipChanged && upstreamChanged && inSyncAfter) {
    return before.ahead > 0
      ? `Pushed ${commits(before.ahead)} to ${after.upstreamName}`
      : `Pushed to ${after.upstreamName}`
  }

  const inSyncBefore =
    before.upstreamSha !== null && before.tipSha === before.upstreamSha

  if (tipChanged && upstreamChanged && inSyncBefore && inSyncAfter) {
    return newCommitCount !== null && newCommitCount > 0
      ? `Synced ${commits(newCommitCount)} with ${after.upstreamName}`
      : `Synced ${branch} with ${after.upstreamName}`
  }

  if (tipChanged && inSyncAfter && !inSyncBefore) {
    const count = newCommitCount ?? before.behind
    return count > 0
      ? `Pulled ${commits(count)} from ${after.upstreamName}`
      : `Updated ${branch} from ${after.upstreamName}`
  }

  if (tipChanged) {
    if (newCommitCount !== null && newCommitCount > 0) {
      return `${commits(newCommitCount)} added to ${branch}`
    }
    const shortSha = after.tipSha === null ? '' : after.tipSha.substring(0, 7)
    return `${branch} moved to ${shortSha}`
  }

  if (upstreamChanged && after.upstreamName !== null) {
    return after.behind > before.behind
      ? `${after.upstreamName} has ${commits(after.behind)} to pull`
      : `Fetched ${after.upstreamName}`
  }

  return null
}
