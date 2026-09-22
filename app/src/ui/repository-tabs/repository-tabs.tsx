import * as React from 'react'
import classNames from 'classnames'
import { IRepositoryTab } from '../../lib/app-state'
import { ILocalRepositoryState, Repository } from '../../models/repository'
import { iconForRepository, Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { IMenuItem, showContextualMenu } from '../../lib/menu-item'
import { TooltippedContent } from '../lib/tooltipped-content'

interface IRepositoryTabItemProps {
  readonly tab: IRepositoryTab
  readonly index: number
  readonly isSelected: boolean
  readonly isDragged: boolean
  readonly hasChanges: boolean
  readonly canClose: boolean
  readonly onSelect: (repository: Repository) => void
  readonly onSelectAdjacent: (direction: 1 | -1) => void
  readonly onClose: (repository: Repository) => void
  readonly onContextMenu: (repository: Repository, index: number) => void
  readonly onDragStart: (repository: Repository) => void
  readonly onDragEnd: () => void
  readonly onDrop: (index: number) => void
}

class RepositoryTabItem extends React.Component<IRepositoryTabItemProps> {
  private readonly tabRef = React.createRef<HTMLDivElement>()

  public componentDidMount() {
    if (this.props.isSelected) {
      this.scrollIntoView()
    }
  }

  public componentDidUpdate(prevProps: IRepositoryTabItemProps) {
    const tab = this.tabRef.current
    if (tab === null || prevProps.isSelected || !this.props.isSelected) {
      return
    }

    this.scrollIntoView()

    if (tab.parentElement?.contains(document.activeElement)) {
      tab.focus()
    }
  }

  private scrollIntoView() {
    this.tabRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  public render() {
    const { tab, isSelected, isDragged, hasChanges } = this.props
    const { repository, branchName } = tab
    const name = repository.alias ?? repository.name

    return (
      <div
        ref={this.tabRef}
        role="tab"
        aria-selected={isSelected}
        tabIndex={isSelected ? 0 : -1}
        className={classNames('repository-tab', {
          selected: isSelected,
          dragging: isDragged,
          'has-changes': hasChanges,
        })}
        draggable={true}
        onClick={this.onClick}
        onKeyDown={this.onKeyDown}
        onAuxClick={this.onAuxClick}
        onContextMenu={this.onContextMenu}
        onDragStart={this.onDragStart}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}
        onDragEnd={this.props.onDragEnd}
      >
        <Octicon
          className="repository-tab-icon"
          symbol={iconForRepository(repository)}
        />
        <TooltippedContent
          className="repository-tab-label"
          tooltip={repository.path}
          tagName="div"
        >
          <div className="repository-tab-name">{name}</div>
          {branchName !== null && (
            <div className="repository-tab-branch">{branchName}</div>
          )}
        </TooltippedContent>
        {this.renderCloseButton(name)}
      </div>
    )
  }

  private renderCloseButton(name: string) {
    const { canClose, hasChanges } = this.props

    if (!canClose) {
      return hasChanges ? (
        <span className="repository-tab-close">
          <Octicon className="dirty" symbol={octicons.dotFill} />
        </span>
      ) : null
    }

    return (
      <button
        className="repository-tab-close"
        aria-label={`Close ${name}`}
        tabIndex={-1}
        onClick={this.onCloseClick}
      >
        {hasChanges && <Octicon className="dirty" symbol={octicons.dotFill} />}
        <Octicon className="close" symbol={octicons.x} />
      </button>
    )
  }

  private onClick = () => {
    if (!this.props.isSelected) {
      this.props.onSelect(this.props.tab.repository)
    }
  }

  private onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      this.onClick()
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      this.props.onSelectAdjacent(event.key === 'ArrowRight' ? 1 : -1)
    }
  }

  private onAuxClick = (event: React.MouseEvent) => {
    if (event.button === 1 && this.props.canClose) {
      event.preventDefault()
      this.props.onClose(this.props.tab.repository)
    }
  }

  private onCloseClick = (event: React.MouseEvent) => {
    event.stopPropagation()
    this.props.onClose(this.props.tab.repository)
  }

  private onContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    this.props.onContextMenu(this.props.tab.repository, this.props.index)
  }

  private onDragStart = (event: React.DragEvent) => {
    event.dataTransfer.effectAllowed = 'move'
    this.props.onDragStart(this.props.tab.repository)
  }

  // Stop the event before the document handlers, which accept dropped
  // repository folders.
  private onDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
  }

  private onDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    this.props.onDrop(this.props.index)
  }
}

interface IRepositoryTabsProps {
  readonly tabs: ReadonlyArray<IRepositoryTab>
  readonly selectedRepositoryId: number | null
  readonly localRepositoryStateLookup: Map<number, ILocalRepositoryState>
  readonly onSelect: (repository: Repository) => void
  readonly onClose: (repositories: ReadonlyArray<Repository>) => void
  readonly onMove: (repository: Repository, toIndex: number) => void
  readonly getRepositoryMenuItems: (
    repository: Repository
  ) => ReadonlyArray<IMenuItem>

  /** The button that opens the repository list, after the last tab */
  readonly children?: React.ReactNode
}

interface IRepositoryTabsState {
  readonly draggedRepositoryId: number | null
}

/** The open repository tabs in the toolbar */
export class RepositoryTabs extends React.Component<
  IRepositoryTabsProps,
  IRepositoryTabsState
> {
  public constructor(props: IRepositoryTabsProps) {
    super(props)
    this.state = { draggedRepositoryId: null }
  }

  public render() {
    const { tabs, selectedRepositoryId, localRepositoryStateLookup } =
      this.props

    return (
      <div className="repository-tabs">
        <div
          className="repository-tabs-list"
          role="tablist"
          aria-label="Repository tabs"
          onWheel={this.onWheel}
        >
          {tabs.map((tab, index) => (
            <RepositoryTabItem
              key={tab.repository.id}
              tab={tab}
              index={index}
              isSelected={tab.repository.id === selectedRepositoryId}
              isDragged={tab.repository.id === this.state.draggedRepositoryId}
              hasChanges={
                (localRepositoryStateLookup.get(tab.repository.id)
                  ?.changedFilesCount ?? 0) > 0
              }
              canClose={tabs.length > 1}
              onSelect={this.props.onSelect}
              onSelectAdjacent={this.selectAdjacent}
              onClose={this.onCloseTab}
              onContextMenu={this.showTabContextMenu}
              onDragStart={this.onDragStart}
              onDragEnd={this.onDragEnd}
              onDrop={this.onDrop}
            />
          ))}
        </div>
        {this.props.children}
      </div>
    )
  }

  private onWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (event.deltaX === 0) {
      event.currentTarget.scrollLeft += event.deltaY
    }
  }

  private selectAdjacent = (direction: 1 | -1) => {
    const { tabs, selectedRepositoryId } = this.props
    const index = tabs.findIndex(t => t.repository.id === selectedRepositoryId)

    if (index === -1) {
      return
    }

    const next = tabs[(index + direction + tabs.length) % tabs.length]
    this.props.onSelect(next.repository)
  }

  private onCloseTab = (repository: Repository) => {
    this.props.onClose([repository])
  }

  private onDragStart = (repository: Repository) => {
    this.setState({ draggedRepositoryId: repository.id })
  }

  private onDragEnd = () => {
    this.setState({ draggedRepositoryId: null })
  }

  private onDrop = (toIndex: number) => {
    const dragged = this.props.tabs.find(
      t => t.repository.id === this.state.draggedRepositoryId
    )

    if (dragged !== undefined) {
      this.props.onMove(dragged.repository, toIndex)
    }

    this.setState({ draggedRepositoryId: null })
  }

  private showTabContextMenu = (repository: Repository, index: number) => {
    const { tabs } = this.props
    const others = tabs
      .filter(t => t.repository.id !== repository.id)
      .map(t => t.repository)
    const toTheRight = tabs.slice(index + 1).map(t => t.repository)

    const items: ReadonlyArray<IMenuItem> = [
      {
        label: __DARWIN__ ? 'Close Tab' : 'Close tab',
        action: () => this.props.onClose([repository]),
        enabled: tabs.length > 1,
      },
      {
        label: __DARWIN__ ? 'Close Other Tabs' : 'Close other tabs',
        action: () => this.props.onClose(others),
        enabled: others.length > 0,
      },
      {
        label: __DARWIN__
          ? 'Close Tabs to the Right'
          : 'Close tabs to the right',
        action: () => this.props.onClose(toTheRight),
        enabled: toTheRight.length > 0,
      },
      { type: 'separator' },
      ...this.props.getRepositoryMenuItems(repository),
    ]

    showContextualMenu(items)
  }
}
