import { describe, it } from 'node:test'
import assert from 'node:assert'
import {
  getContrastColor,
  getUICustomizationVariables,
  hasCustomColors,
  parseUICustomization,
  serializeUICustomization,
} from '../../src/lib/ui-customization'
import { defaultUICustomization } from '../../src/models/ui-customization'

describe('parseUICustomization', () => {
  it('returns the default for missing or invalid JSON', () => {
    assert.deepStrictEqual(parseUICustomization(null), defaultUICustomization)
    assert.deepStrictEqual(parseUICustomization('{'), defaultUICustomization)
    assert.deepStrictEqual(parseUICustomization('42'), defaultUICustomization)
  })

  it('keeps valid colors and drops invalid colors', () => {
    const parsed = parseUICustomization(
      JSON.stringify({
        backgroundColor: '#1E1E2E',
        textColor: 'red',
        toolbarColor: '#123',
        accentColor: '#ff00aa',
      })
    )

    assert.deepStrictEqual(parsed, {
      backgroundColor: '#1e1e2e',
      textColor: null,
      toolbarColor: null,
      accentColor: '#ff00aa',
    })
  })

  it('reads the output of serializeUICustomization', () => {
    const customization = {
      backgroundColor: '#101010',
      textColor: '#eeeeee',
      toolbarColor: null,
      accentColor: '#8250df',
    }

    assert.deepStrictEqual(
      parseUICustomization(serializeUICustomization(customization)),
      customization
    )
  })
})

describe('hasCustomColors', () => {
  it('is false only when all colors are null', () => {
    assert.equal(hasCustomColors(defaultUICustomization), false)
    assert.equal(
      hasCustomColors({ ...defaultUICustomization, accentColor: '#000000' }),
      true
    )
  })
})

describe('getContrastColor', () => {
  it('returns light text for dark colors and dark text for light colors', () => {
    assert.equal(getContrastColor('#000000'), '#f6f8fa')
    assert.equal(getContrastColor('#ffffff'), '#24292e')
  })
})

describe('getUICustomizationVariables', () => {
  it('returns no variables for the default customization', () => {
    assert.equal(getUICustomizationVariables(defaultUICustomization).size, 0)
  })

  it('sets the accent variables', () => {
    const variables = getUICustomizationVariables({
      ...defaultUICustomization,
      accentColor: '#8250df',
    })

    assert.equal(variables.get('--button-background'), '#8250df')
    assert.equal(variables.get('--tab-bar-active-color'), '#8250df')
    assert.equal(variables.get('--background-color'), undefined)
  })

  it('derives a text color from a custom background', () => {
    const variables = getUICustomizationVariables({
      ...defaultUICustomization,
      backgroundColor: '#000000',
    })

    assert.equal(variables.get('--background-color'), '#000000')
    assert.equal(variables.get('--text-color'), '#f6f8fa')
  })

  it('uses the custom text color over the derived text color', () => {
    const variables = getUICustomizationVariables({
      ...defaultUICustomization,
      backgroundColor: '#000000',
      textColor: '#ff0000',
    })

    assert.equal(variables.get('--text-color'), '#ff0000')
  })
})
