import { watch, FSWatcher } from 'fs'
import * as Path from 'path'

/**
 * The kind of change that a file system event represents.
 *
 * - `ignore`: a change that has no effect on the state that Desktop shows.
 * - `working-directory`: a change to a file in the working directory.
 * - `git-refs`: a change to HEAD, a branch, a tag or a remote-tracking ref.
 * - `git-other`: a change to other Git state, for example the index.
 */
export type WatchEventKind =
  | 'ignore'
  | 'working-directory'
  | 'git-refs'
  | 'git-other'

const refFiles = new Set([
  'HEAD',
  'ORIG_HEAD',
  'FETCH_HEAD',
  'MERGE_HEAD',
  'CHERRY_PICK_HEAD',
  'REVERT_HEAD',
  'packed-refs',
])

const ignoredGitFiles = new Set(['COMMIT_EDITMSG', 'gc.pid', 'gc.log'])

/**
 * Classify a path inside the Git directory.
 *
 * @param path The path relative to the Git directory, with `/` separators
 */
export function classifyGitDirectoryPath(path: string): WatchEventKind {
  if (
    path.endsWith('.lock') ||
    path.startsWith('objects/') ||
    path === 'objects' ||
    path.startsWith('logs/') ||
    path === 'logs' ||
    ignoredGitFiles.has(path)
  ) {
    return 'ignore'
  }

  if (refFiles.has(path) || path.startsWith('refs/') || path === 'refs') {
    return 'git-refs'
  }

  return 'git-other'
}

/**
 * Classify a path from a file system event on the working directory.
 *
 * @param path The path relative to the working directory, or `null` when
 *             the platform does not report a file name
 */
export function classifyWorkingDirectoryPath(
  path: string | null
): WatchEventKind {
  if (path === null) {
    return 'working-directory'
  }

  const normalized = path.replace(/\\/g, '/')

  // Windows reports a change to the directory entry itself each time Git
  // creates or removes a lock file in it, which happens on every refresh.
  if (normalized === '.git') {
    return 'ignore'
  }

  if (normalized.startsWith('.git/')) {
    return classifyGitDirectoryPath(normalized.substring(5))
  }

  return 'working-directory'
}

/** The changes that the watcher saw since the last notification */
export interface IRepositoryWatchChanges {
  readonly workingDirectory: boolean
  readonly refs: boolean
  readonly otherGitState: boolean
}

const noChanges: IRepositoryWatchChanges = {
  workingDirectory: false,
  refs: false,
  otherGitState: false,
}

/** Wait this long after the last event before a notification */
const quietPeriodMs = 250

/**
 * Notify after this interval even if events continue, so that a repository
 * that changes all the time still refreshes.
 */
const maxWaitMs = 1000

/**
 * Watch the working directory and the Git directory of a repository and
 * notify, debounced, when a change occurs.
 *
 * The watcher never runs two notifications at the same time. Events that
 * occur during a notification cause one more notification after it.
 */
export class RepositoryWatcher {
  private readonly watchers: Array<FSWatcher> = []
  private pending: IRepositoryWatchChanges = noChanges
  private quietTimer: number | null = null
  private maxWaitTimer: number | null = null
  private isNotifying = false
  private isStopped = false

  public constructor(
    private readonly workingDirectory: string,
    private readonly gitDirectory: string,
    private readonly onChange: (
      changes: IRepositoryWatchChanges
    ) => Promise<void>
  ) {}

  public start() {
    this.watchPath(this.workingDirectory, classifyWorkingDirectoryPath)

    const relativeGitDirectory = Path.relative(
      this.workingDirectory,
      this.gitDirectory
    )
    const isGitDirectoryOutsideWorkingDirectory =
      relativeGitDirectory.startsWith('..') ||
      Path.isAbsolute(relativeGitDirectory)

    if (isGitDirectoryOutsideWorkingDirectory) {
      this.watchPath(this.gitDirectory, path =>
        path === null ? 'git-other' : classifyGitDirectoryPath(path)
      )
    }
  }

  public stop() {
    this.isStopped = true
    this.clearTimers()
    for (const watcher of this.watchers) {
      watcher.close()
    }
    this.watchers.length = 0
  }

  private watchPath(
    path: string,
    classify: (relativePath: string | null) => WatchEventKind
  ) {
    try {
      const watcher = watch(path, { recursive: true }, (_, filename) => {
        const relativePath =
          filename === null ? null : filename.toString().replace(/\\/g, '/')
        this.onEvent(classify(relativePath))
      })
      watcher.on('error', error => {
        log.warn(`Stopped watching '${path}' for changes`, error)
        watcher.close()
      })
      this.watchers.push(watcher)
    } catch (error) {
      log.warn(`Unable to watch '${path}' for changes`, error)
    }
  }

  private onEvent(kind: WatchEventKind) {
    if (kind === 'ignore' || this.isStopped) {
      return
    }

    this.pending = {
      workingDirectory:
        this.pending.workingDirectory || kind === 'working-directory',
      refs: this.pending.refs || kind === 'git-refs',
      otherGitState: this.pending.otherGitState || kind === 'git-other',
    }

    if (this.isNotifying) {
      return
    }

    this.schedule()
  }

  private schedule() {
    if (this.quietTimer !== null) {
      window.clearTimeout(this.quietTimer)
    }
    this.quietTimer = window.setTimeout(this.notify, quietPeriodMs)

    if (this.maxWaitTimer === null) {
      this.maxWaitTimer = window.setTimeout(this.notify, maxWaitMs)
    }
  }

  private clearTimers() {
    if (this.quietTimer !== null) {
      window.clearTimeout(this.quietTimer)
      this.quietTimer = null
    }
    if (this.maxWaitTimer !== null) {
      window.clearTimeout(this.maxWaitTimer)
      this.maxWaitTimer = null
    }
  }

  private notify = async () => {
    this.clearTimers()

    const changes = this.pending
    this.pending = noChanges

    if (this.isStopped || changes === noChanges) {
      return
    }

    this.isNotifying = true
    try {
      await this.onChange(changes)
    } catch (error) {
      log.error('Unable to refresh the repository after a change', error)
    } finally {
      this.isNotifying = false
    }

    if (!this.isStopped && this.pending !== noChanges) {
      this.schedule()
    }
  }
}
