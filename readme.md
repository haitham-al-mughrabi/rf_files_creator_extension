# Robot Framework Files Creator

A VSCode extension that adds context menu options to quickly create Robot Framework files with predefined templates.

## Features

Right-click on any folder in the Explorer to see the following options:

1. **Create Robot Framework Test File** (`.robot`)
   - Creates a file with `*** Settings ***` and `*** Test Cases ***` sections

2. **Create Robot Framework Resource File** (`.resource`)
   - Creates a file with `*** Settings ***` and `*** Keywords ***` sections

3. **Create Robot Framework Variables File** (`.resource`)
   - Creates a file with `*** Settings ***` and `*** Variables ***` sections

4. **Create Robot Framework Locators File** (`.py`)
   - Creates an empty Python file for locators

## Installation

### From Source

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile TypeScript
4. Press `F5` in VSCode to launch the extension in debug mode

### Package and Install

1. Install vsce: `npm install -g @vscode/vsce`
2. Package the extension: `vsce package`
3. Install the generated `.vsix` file in VSCode

## Usage

1. Open a folder/workspace in VSCode
2. In the Explorer, right-click on any folder
3. Select one of the "Create Robot Framework..." options
4. Enter a filename (without extension)
5. The file will be created and opened automatically

## File Templates

### Test File (.robot)
```robot
*** Settings ***


*** Test Cases ***
```

### Resource File (.resource)
```robot
*** Settings ***


*** Keywords ***
```

### Variables File (.resource)
```robot
*** Settings ***


*** Variables ***
```

### Locators File (.py)
Empty file ready for your Python locator definitions.

## Requirements

- VSCode 1.74.0 or higher

## License

MIT
