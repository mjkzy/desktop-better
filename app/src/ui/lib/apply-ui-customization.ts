import * as ipcRenderer from '../../lib/ipc-renderer'
import { getUICustomizationVariables } from '../../lib/ui-customization'
import { IUICustomization } from '../../models/ui-customization'

let appliedVariables: ReadonlyArray<string> = []

/**
 * Apply the customization to the body element.
 *
 * Inline custom properties on the body take precedence over the theme
 * variables of both `:root` and `body.theme-dark`.
 */
export function applyUICustomization(customization: IUICustomization) {
  const style = document.body.style
  const variables = getUICustomizationVariables(customization)

  for (const name of appliedVariables) {
    style.removeProperty(name)
  }

  for (const [name, value] of variables) {
    style.setProperty(name, value)
  }

  appliedVariables = [...variables.keys()]

  const backgroundColor = getComputedStyle(document.body)
    .getPropertyValue('--background-color')
    .trim()
  if (backgroundColor) {
    ipcRenderer.send('update-window-background-color', backgroundColor)
  }
}
