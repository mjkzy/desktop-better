import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  getAdjacentRepositoryTab,
  getTabToSelectAfterClose,
  openRepositoryTab,
  replaceRepositoryTab,
} from '../../src/lib/repository-tabs'

describe('repository tabs', () => {
  describe('openRepositoryTab', () => {
    it('adds a new tab at the end', () => {
      assert.deepStrictEqual(openRepositoryTab([1, 2], 3), [1, 2, 3])
    })

    it('returns the same array when the tab is open', () => {
      const tabs = [1, 2]
      assert.strictEqual(openRepositoryTab(tabs, 2), tabs)
    })
  })

  describe('replaceRepositoryTab', () => {
    it('keeps the position of the replaced tab', () => {
      assert.deepStrictEqual(replaceRepositoryTab([1, 2, 3], 2, 9), [1, 9, 3])
    })

    it('removes a duplicate of the new tab', () => {
      assert.deepStrictEqual(replaceRepositoryTab([1, 2, 3], 1, 3), [3, 2])
    })

    it('adds the new tab when the old tab is not open', () => {
      assert.deepStrictEqual(replaceRepositoryTab([1], 5, 6), [1, 6])
    })
  })

  describe('getTabToSelectAfterClose', () => {
    it('selects the tab to the right', () => {
      assert.strictEqual(getTabToSelectAfterClose([1, 2, 3], 2), 3)
    })

    it('selects the tab to the left for the last tab', () => {
      assert.strictEqual(getTabToSelectAfterClose([1, 2, 3], 3), 2)
    })

    it('returns null for the only tab', () => {
      assert.strictEqual(getTabToSelectAfterClose([1], 1), null)
    })
  })

  describe('getAdjacentRepositoryTab', () => {
    it('wraps around in both directions', () => {
      assert.strictEqual(getAdjacentRepositoryTab([1, 2, 3], 3, 1), 1)
      assert.strictEqual(getAdjacentRepositoryTab([1, 2, 3], 1, -1), 3)
    })

    it('selects the first tab when no tab is selected', () => {
      assert.strictEqual(getAdjacentRepositoryTab([4, 5], null, 1), 4)
    })

    it('returns null without tabs', () => {
      assert.strictEqual(getAdjacentRepositoryTab([], 1, 1), null)
    })
  })
})
