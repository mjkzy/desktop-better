/**
 * User-selected colors that override the colors of the active theme.
 *
 * A `null` value uses the color of the active theme.
 */
export interface IUICustomization {
  /** The main background color of the application */
  readonly backgroundColor: string | null

  /** The primary text color of the application */
  readonly textColor: string | null

  /** The background color of the toolbar and the title bar */
  readonly toolbarColor: string | null

  /**
   * The accent color, for example the primary button, the active tab
   * indicator and the selected list item
   */
  readonly accentColor: string | null
}

export const defaultUICustomization: IUICustomization = {
  backgroundColor: null,
  textColor: null,
  toolbarColor: null,
  accentColor: null,
}
