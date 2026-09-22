import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  IRepositorySnapshot,
  describeRepositoryChange,
} from '../../src/lib/repository-change'
import {
  classifyGitDirectoryPath,
  classifyWorkingDirectoryPath,
} from '../../src/lib/stores/helpers/repository-watcher'

const base: IRepositorySnapshot = {
  branchName: 'main',
  tipSha: 'aaaaaaaaaa',
  upstreamName: 'origin/main',
  upstreamSha: 'aaaaaaaaaa',
  ahead: 0,
  behind: 0,
}

describe('describeRepositoryChange', () => {
  it('returns null when nothing changed', () => {
    assert.equal(describeRepositoryChange(base, base, null), null)
  })

  it('describes a branch switch', () => {
    const after = { ...base, branchName: 'feature' }
    assert.equal(
      describeRepositoryChange(base, after, null),
      'Switched to feature'
    )
  })

  it('describes a push', () => {
    const before = { ...base, upstreamSha: 'bbbbbbbbbb', ahead: 2 }
    assert.equal(
      describeRepositoryChange(before, base, null),
      'Pushed 2 commits to origin/main'
    )
  })

  it('describes a pull', () => {
    const before = { ...base, upstreamSha: 'cccccccccc', behind: 3 }
    const after = { ...base, tipSha: 'cccccccccc', upstreamSha: 'cccccccccc' }
    assert.equal(
      describeRepositoryChange(before, after, 3),
      'Pulled 3 commits from origin/main'
    )
  })

  it('describes a commit and push that happen together', () => {
    const after = { ...base, tipSha: 'dddddddddd', upstreamSha: 'dddddddddd' }
    assert.equal(
      describeRepositoryChange(base, after, 1),
      'Synced 1 commit with origin/main'
    )
  })

  it('describes a local commit', () => {
    const after = { ...base, tipSha: 'eeeeeeeeee', ahead: 1 }
    assert.equal(
      describeRepositoryChange(base, after, 1),
      '1 commit added to main'
    )
  })

  it('describes a reset when no commits are new', () => {
    const after = { ...base, tipSha: 'ffffffffff' }
    assert.equal(
      describeRepositoryChange(base, after, 0),
      'main moved to fffffff'
    )
  })

  it('describes a fetch with new commits', () => {
    const after = { ...base, upstreamSha: 'gggggggggg', behind: 4 }
    assert.equal(
      describeRepositoryChange(base, after, null),
      'origin/main has 4 commits to pull'
    )
  })
})

describe('classifyWorkingDirectoryPath', () => {
  it('classifies working directory files', () => {
    assert.equal(classifyWorkingDirectoryPath('src/a.ts'), 'working-directory')
    assert.equal(classifyWorkingDirectoryPath(null), 'working-directory')
  })

  it('classifies Git directory files with either separator', () => {
    assert.equal(classifyWorkingDirectoryPath('.git/HEAD'), 'git-refs')
    assert.equal(
      classifyWorkingDirectoryPath('.git\\refs\\heads\\main'),
      'git-refs'
    )
    assert.equal(classifyWorkingDirectoryPath('.git/index'), 'git-other')
  })

  it('ignores lock files, objects and logs', () => {
    assert.equal(classifyWorkingDirectoryPath('.git'), 'ignore')
    assert.equal(classifyGitDirectoryPath('index.lock'), 'ignore')
    assert.equal(classifyGitDirectoryPath('refs/heads/main.lock'), 'ignore')
    assert.equal(classifyGitDirectoryPath('objects/ab/cdef'), 'ignore')
    assert.equal(classifyGitDirectoryPath('logs/HEAD'), 'ignore')
  })
})
