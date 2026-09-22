import {
  IUICustomization,
  defaultUICustomization,
} from '../models/ui-customization'

const uiCustomizationKey = 'ui-customization'

const hexColorRegex = /^#[0-9a-f]{6}$/i

const lightContrastColor = '#f6f8fa'
const darkContrastColor = '#24292e'

/** Whether the value is a color in the `#rrggbb` format */
export function isHexColor(value: unknown): value is string {
  return typeof value === 'string' && hexColorRegex.test(value)
}

function toHexColorOrNull(value: unknown): string | null {
  return isHexColor(value) ? value.toLowerCase() : null
}

/**
 * Parse a persisted customization.
 *
 * Invalid or missing colors are replaced with `null`.
 */
export function parseUICustomization(json: string | null): IUICustomization {
  if (json === null) {
    return defaultUICustomization
  }

  try {
    const parsed: unknown = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null) {
      return defaultUICustomization
    }

    const record: Record<string, unknown> = { ...parsed }
    return {
      backgroundColor: toHexColorOrNull(record.backgroundColor),
      textColor: toHexColorOrNull(record.textColor),
      toolbarColor: toHexColorOrNull(record.toolbarColor),
      accentColor: toHexColorOrNull(record.accentColor),
    }
  } catch {
    return defaultUICustomization
  }
}

/** Serialize the customization as the content of a theme file */
export function serializeUICustomization(
  customization: IUICustomization
): string {
  return `${JSON.stringify(customization, null, 2)}\n`
}

/** Whether the customization changes one or more colors */
export function hasCustomColors(customization: IUICustomization): boolean {
  return Object.values(customization).some(v => v !== null)
}

/** Load the customization from the persistent store */
export function getPersistedUICustomization(): IUICustomization {
  return parseUICustomization(localStorage.getItem(uiCustomizationKey))
}

/** Store the customization in the persistent store */
export function setPersistedUICustomization(
  customization: IUICustomization
): void {
  localStorage.setItem(uiCustomizationKey, JSON.stringify(customization))
}

function channelToLinear(channel: number) {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/**
 * Get a text color that is legible on top of the given `#rrggbb` color.
 *
 * The threshold is the WCAG relative luminance where black text and white
 * text have an equal contrast ratio.
 */
export function getContrastColor(hexColor: string): string {
  const r = channelToLinear(parseInt(hexColor.substring(1, 3), 16))
  const g = channelToLinear(parseInt(hexColor.substring(3, 5), 16))
  const b = channelToLinear(parseInt(hexColor.substring(5, 7), 16))
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b

  return luminance > 0.179 ? darkContrastColor : lightContrastColor
}

function mix(color: string, otherColor: string, otherPercentage: number) {
  return `color-mix(in srgb, ${color}, ${otherColor} ${otherPercentage}%)`
}

function getBackgroundVariables(background: string, text: string) {
  const hover = mix(background, text, 8)
  return {
    '--background-color': background,
    '--box-background-color': background,
    '--tab-bar-background-color': background,
    '--diff-gutter-background-color': background,
    '--toolbar-button-active-background-color': background,
    '--toolbar-button-active-border-color': background,
    '--app-menu-pane-background-color': background,
    '--box-alt-background-color': mix(background, text, 4),
    '--diff-empty-row-background-color': mix(background, text, 3),
    '--box-hover-background-color': hover,
    '--list-item-hover-background-color': hover,
    '--tab-bar-hover-background-color': hover,
    '--secondary-button-background': hover,
    '--box-selected-background-color': mix(background, text, 14),
  }
}

function getTextVariables(text: string, background: string) {
  return {
    '--text-color': text,
    '--box-hover-text-color': text,
    '--box-selected-text-color': text,
    '--diff-text-color': text,
    '--secondary-button-text-color': text,
    '--toolbar-button-active-color': text,
    '--app-menu-pane-color': text,
    '--text-secondary-color': mix(text, background, 30),
  }
}

function getToolbarVariables(toolbar: string) {
  const text = getContrastColor(toolbar)
  const secondaryText = mix(text, toolbar, 30)
  const hover = mix(toolbar, text, 12)
  return {
    '--toolbar-background-color': toolbar,
    '--win32-title-bar-background-color': toolbar,
    '--toolbar-border-color': mix(toolbar, text, 20),
    '--toolbar-text-color': text,
    '--toolbar-button-color': text,
    '--toolbar-button-hover-color': text,
    '--toolbar-text-secondary-color': secondaryText,
    '--toolbar-button-secondary-color': secondaryText,
    '--toolbar-button-hover-background-color': hover,
    '--toolbar-button-focus-background-color': hover,
    '--app-menu-button-hover-background-color': hover,
  }
}

function getAccentVariables(accent: string) {
  const text = getContrastColor(accent)
  return {
    '--button-background': accent,
    '--button-hover-background': mix(accent, text, 10),
    '--button-text-color': text,
    '--button-focus-border-color': mix(accent, '#ffffff', 40),
    '--link-button-color': accent,
    '--tab-bar-active-color': accent,
    '--box-border-accent-color': accent,
    '--box-selected-active-background-color': accent,
    '--box-selected-active-text-color': text,
    '--focus-color': accent,
    '--accent-color': accent,
    '--text-field-focus-shadow-color': mix(accent, 'transparent', 75),
  }
}

/**
 * Get the CSS custom properties that apply the customization.
 *
 * A custom background without a custom text color gets a text color with
 * sufficient contrast.
 */
export function getUICustomizationVariables(
  customization: IUICustomization
): ReadonlyMap<string, string> {
  const { backgroundColor, textColor, toolbarColor, accentColor } =
    customization

  const text =
    textColor ??
    (backgroundColor !== null ? getContrastColor(backgroundColor) : null)
  const background = backgroundColor ?? 'var(--background-color)'

  return new Map(
    Object.entries({
      ...(backgroundColor !== null && text !== null
        ? getBackgroundVariables(backgroundColor, text)
        : {}),
      ...(text !== null ? getTextVariables(text, background) : {}),
      ...(toolbarColor !== null ? getToolbarVariables(toolbarColor) : {}),
      ...(accentColor !== null ? getAccentVariables(accentColor) : {}),
    })
  )
}
