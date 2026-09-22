import * as React from 'react'
import { readFile, writeFile } from 'fs/promises'
import { Button } from '../lib/button'
import {
  IUICustomization,
  defaultUICustomization,
} from '../../models/ui-customization'
import { applyUICustomization } from '../lib/apply-ui-customization'
import {
  hasCustomColors,
  isHexColor,
  parseUICustomization,
  serializeUICustomization,
} from '../../lib/ui-customization'
import { showOpenDialog, showSaveDialog } from '../main-process-proxy'
import { ApplicationTheme } from '../lib/application-theme'

const themeFileFilters = [{ name: 'Theme file', extensions: ['json'] }]

type CustomizableColor = keyof IUICustomization

interface ICustomizableColorOption {
  readonly key: CustomizableColor
  readonly label: string
  readonly description: string
  readonly themeVariable: string
}

const colorOptions: ReadonlyArray<ICustomizableColorOption> = [
  {
    key: 'backgroundColor',
    label: 'Background',
    description: 'The background of the lists, the diff and the panes.',
    themeVariable: '--background-color',
  },
  {
    key: 'textColor',
    label: 'Text',
    description: 'The primary text color.',
    themeVariable: '--text-color',
  },
  {
    key: 'toolbarColor',
    label: 'Toolbar',
    description: 'The bar at the top of the window.',
    themeVariable: '--toolbar-background-color',
  },
  {
    key: 'accentColor',
    label: 'Accent',
    description:
      'The commit button, the active tab indicator and the selected item.',
    themeVariable: '--button-background',
  },
]

function toHexColor(value: string): string {
  const trimmed = value.trim()
  if (isHexColor(trimmed)) {
    return trimmed.toLowerCase()
  }

  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(trimmed)
  if (short !== null) {
    return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase()
  }

  return '#000000'
}

interface ICustomColorsProps {
  readonly customization: IUICustomization
  readonly onCustomizationChanged: (customization: IUICustomization) => void
  /** The theme colors are the defaults, so they change with the theme */
  readonly selectedTheme: ApplicationTheme
}

interface ICustomColorsState {
  readonly themeColors: Readonly<Record<CustomizableColor, string>>
  readonly error: string | null
}

interface ICustomColorOptionProps {
  readonly option: ICustomizableColorOption
  readonly value: string | null
  readonly themeColor: string
  readonly onChange: (key: CustomizableColor, value: string | null) => void
}

class CustomColorOption extends React.Component<ICustomColorOptionProps> {
  public render() {
    const { option, value, themeColor } = this.props
    const inputId = `custom-color-${option.key}`

    return (
      <div className="custom-color-option">
        <input
          id={inputId}
          type="color"
          value={value ?? themeColor}
          onChange={this.onColorChange}
        />
        <div className="custom-color-label">
          <label htmlFor={inputId}>{option.label}</label>
          <span className="custom-color-description">
            {option.description}
            {value === null ? ' Theme default.' : null}
          </span>
        </div>
        <Button
          size="small"
          disabled={value === null}
          onClick={this.onReset}
          ariaLabel={`Reset ${option.label.toLowerCase()} color`}
        >
          Reset
        </Button>
      </div>
    )
  }

  private onColorChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = event.currentTarget.value
    if (isHexColor(value)) {
      this.props.onChange(this.props.option.key, value.toLowerCase())
    }
  }

  private onReset = () => {
    this.props.onChange(this.props.option.key, null)
  }
}

/** The color settings of the application, with a live preview */
export class CustomColors extends React.Component<
  ICustomColorsProps,
  ICustomColorsState
> {
  public constructor(props: ICustomColorsProps) {
    super(props)

    this.state = {
      themeColors: this.readThemeColors(),
      error: null,
    }
  }

  public componentDidUpdate(prevProps: ICustomColorsProps) {
    if (prevProps.selectedTheme !== this.props.selectedTheme) {
      this.setState({ themeColors: this.readThemeColors() })
    }
  }

  public render() {
    return (
      <div className="appearance-section custom-colors">
        <h2 id="colors-heading">Colors</h2>
        <p className="custom-colors-description">
          Changes apply at once. Select Save to keep them.
        </p>
        {colorOptions.map(this.renderColorOption)}
        {this.state.error !== null ? (
          <p className="custom-colors-error" role="alert">
            {this.state.error}
          </p>
        ) : null}
        <div className="custom-colors-actions">
          <Button onClick={this.onImport}>
            {__DARWIN__ ? 'Import Theme…' : 'Import theme…'}
          </Button>
          <Button onClick={this.onExport}>
            {__DARWIN__ ? 'Export Theme…' : 'Export theme…'}
          </Button>
          <Button className="reset-all-button" onClick={this.onResetAll}>
            {__DARWIN__ ? 'Reset All Colors' : 'Reset all colors'}
          </Button>
        </div>
      </div>
    )
  }

  private renderColorOption = (option: ICustomizableColorOption) => (
    <CustomColorOption
      key={option.key}
      option={option}
      value={this.props.customization[option.key]}
      themeColor={this.state.themeColors[option.key]}
      onChange={this.updateColor}
    />
  )

  private readThemeColors(): Record<CustomizableColor, string> {
    applyUICustomization(defaultUICustomization)
    const style = getComputedStyle(document.body)
    const [background, text, toolbar, accent] = colorOptions.map(o =>
      toHexColor(style.getPropertyValue(o.themeVariable))
    )
    applyUICustomization(this.props.customization)

    return {
      backgroundColor: background,
      textColor: text,
      toolbarColor: toolbar,
      accentColor: accent,
    }
  }

  private preview(customization: IUICustomization) {
    this.setState({ error: null })
    this.props.onCustomizationChanged(customization)
  }

  private updateColor = (key: CustomizableColor, value: string | null) => {
    this.preview({ ...this.props.customization, [key]: value })
  }

  private onResetAll = () => {
    this.preview(defaultUICustomization)
  }

  private onImport = async () => {
    const path = await showOpenDialog({
      properties: ['openFile'],
      filters: themeFileFilters,
    })
    if (path === null) {
      return
    }

    try {
      const customization = parseUICustomization(await readFile(path, 'utf8'))
      if (!hasCustomColors(customization)) {
        this.setState({
          error: 'The file does not contain colors in the #rrggbb format.',
        })
        return
      }
      this.preview(customization)
    } catch (e) {
      this.setState({ error: `Unable to read the theme file: ${e}` })
    }
  }

  private onExport = async () => {
    const path = await showSaveDialog({
      defaultPath: 'github-desktop-theme.json',
      filters: themeFileFilters,
    })
    if (path === null) {
      return
    }

    try {
      await writeFile(path, serializeUICustomization(this.props.customization))
    } catch (e) {
      this.setState({ error: `Unable to write the theme file: ${e}` })
    }
  }
}
