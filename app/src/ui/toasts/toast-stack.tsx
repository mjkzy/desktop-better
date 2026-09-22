import * as React from 'react'
import classNames from 'classnames'
import { IToast } from '../../models/toast'
import { Octicon, syncClockwise } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { assertNever } from '../../lib/fatal-error'

interface IToastItemProps {
  readonly toast: IToast
  readonly onDismiss: (id: string) => void
}

class ToastItem extends React.Component<IToastItemProps> {
  public render() {
    const { kind, title, message } = this.props.toast

    return (
      <div className={classNames('toast', kind)}>
        {this.renderIcon()}
        <span className="toast-message">
          {title !== undefined && <span className="toast-title">{title}</span>}
          {message}
        </span>
        <button
          className="toast-dismiss"
          aria-label="Dismiss"
          onClick={this.onDismiss}
        >
          <Octicon symbol={octicons.x} />
        </button>
      </div>
    )
  }

  private renderIcon() {
    const { kind } = this.props.toast
    switch (kind) {
      case 'progress':
        return <Octicon className="toast-icon spin" symbol={syncClockwise} />
      case 'success':
        return <Octicon className="toast-icon" symbol={octicons.check} />
      case 'info':
        return <Octicon className="toast-icon" symbol={octicons.info} />
      default:
        return assertNever(kind, `Unknown toast kind: ${kind}`)
    }
  }

  private onDismiss = () => {
    this.props.onDismiss(this.props.toast.id)
  }
}

interface IToastStackProps {
  readonly toasts: ReadonlyArray<IToast>
  readonly onDismiss: (id: string) => void
}

/** The toasts in the bottom right corner of the window */
export class ToastStack extends React.Component<IToastStackProps> {
  public render() {
    return (
      <div className="toast-stack" role="status" aria-live="polite">
        {this.props.toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={this.props.onDismiss}
          />
        ))}
      </div>
    )
  }
}
