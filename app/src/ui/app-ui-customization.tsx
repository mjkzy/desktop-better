import * as React from 'react'
import { IUICustomization } from '../models/ui-customization'
import { applyUICustomization } from './lib/apply-ui-customization'

interface IAppUICustomizationProps {
  readonly customization: IUICustomization
}

/**
 * A pseudo-component that applies the user-selected colors to the body
 * element. It does not render anything into the DOM.
 */
export class AppUICustomization extends React.PureComponent<IAppUICustomizationProps> {
  public componentDidMount() {
    applyUICustomization(this.props.customization)
  }

  public componentDidUpdate() {
    applyUICustomization(this.props.customization)
  }

  public render() {
    return null
  }
}
