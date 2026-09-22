/** Add the repository to the end of the open tabs if it is not open yet */
export function openRepositoryTab(
  tabs: ReadonlyArray<number>,
  repositoryId: number
): ReadonlyArray<number> {
  return tabs.includes(repositoryId) ? tabs : [...tabs, repositoryId]
}

/** Put the new repository in the place of the old one */
export function replaceRepositoryTab(
  tabs: ReadonlyArray<number>,
  oldRepositoryId: number,
  newRepositoryId: number
): ReadonlyArray<number> {
  if (oldRepositoryId === newRepositoryId || !tabs.includes(oldRepositoryId)) {
    return openRepositoryTab(tabs, newRepositoryId)
  }

  return tabs
    .filter(id => id !== newRepositoryId)
    .map(id => (id === oldRepositoryId ? newRepositoryId : id))
}

/**
 * Get the tab to select after the user closes a tab: the tab to the right of
 * it, or else the tab to the left of it.
 */
export function getTabToSelectAfterClose(
  tabs: ReadonlyArray<number>,
  closedRepositoryId: number
): number | null {
  const index = tabs.indexOf(closedRepositoryId)
  if (index === -1) {
    return null
  }

  return tabs[index + 1] ?? tabs[index - 1] ?? null
}

/** Get the neighbour tab in the direction, with wrap-around */
export function getAdjacentRepositoryTab(
  tabs: ReadonlyArray<number>,
  currentRepositoryId: number | null,
  direction: 1 | -1
): number | null {
  if (tabs.length === 0) {
    return null
  }

  const index =
    currentRepositoryId === null ? -1 : tabs.indexOf(currentRepositoryId)
  if (index === -1) {
    return tabs[0]
  }

  return tabs[(index + direction + tabs.length) % tabs.length]
}
