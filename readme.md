# Robot Framework Toolkit

A VSCode extension that adds context menu options to quickly create Robot Framework files with predefined templates and manage imports.

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

5. **Edit Robot Framework Imports** (on `.robot` and `.resource` files)
   - Browse all importable files in a unified view (no more separate Python/Resource sections)
   - Select files to import as Libraries, Resources, or Variables
   - Preserve and pre-select existing imports
   - Choose between relative paths or workspace paths
   - Collapsible folder structure for easy navigation
   - Search functionality to quickly find desired files
   - Context-aware suggestions based on file content
   - Visual progress indicators during scanning

## Import Management Features

### Dedicated Sidebar View
- The extension now has its own dedicated view in the activity bar with the title "Robot Framework Toolkit"
- Always visible and accessible with enhanced icons and navigation options
- Shows "All Importable Files" and "Current Imports" sections

### File Browsing and Selection
- Browse all importable files in a unified tree view (Python, Resource, and other supported files)
- Select files to import as Library, Resource, or Variables
- Choose between relative paths or workspace paths
- Collapsible folder structure for easy navigation
- Enhanced file icons to distinguish file types (.py, .robot, .resource)
- Star icons mark context-aware suggestions based on content in the file

### Target File Locking
- **Automatic Locking**: When you click "View File" on any importable file, the current target file (the one you're editing imports for) is automatically locked
- **Preserve Context**: While browsing and viewing other files, the import management remains focused on your target file
- **Go to Target Button**: A "Go to Target File" button appears in the navigation bar when a target is locked, allowing you to quickly return to your original file
- **Automatic Unlocking**: The system automatically unlocks when you return to your locked target file or switch to a different robot file

### Import Organization
- **Current Imports Section**: Shows existing imports in the file with appropriate icons (Library, Resource, Variables)
- **All Importable Files Section**: Displays all available files for import in a collapsible folder structure
- **Import Type Selection**: Click on files to choose whether to import as Library, Resource, or Variables
- **Checkboxes**: Visual indication of selected imports with checkboxes to toggle selection

### Navigation and Search
- **Smart Button Visibility**: Buttons appear contextually based on current state
  - *Confirm/Clear* buttons only show when you have pending import selections
  - *Clear Search* button only shows when an active search is in progress
- **Search Functionality**: Quickly filter and find desired files using the search feature
- **Clear Search**: Revert search results to show all files again
- **Expand All**: Expand all tree nodes at once
- **Collapse All**: Collapse all tree nodes at once
- **View File**: Right-click on any file to view its content directly
- **Confirm/Clear/Cancel**: Navigation buttons in the tree view header to manage changes

### Context-Aware Features
- **File Filtering**: Only shows files in allowed project folders (Libraries, Tests, Utilities, Resources, POM, etc.)
- **Content Analysis**: Automatic suggestions based on content in the file
- **Existing Import Detection**: Preserves and highlights existing imports from the target file
- **Progress Indicators**: Visual feedback during file scanning and processing

## Usage

### Creating New Files
1. Open a folder/workspace in VSCode
2. In the Explorer, right-click on any folder
3. Select one of the "Create Robot Framework..." options
4. Enter a filename (without extension)
5. The file will be created and opened automatically

### Editing Existing File Imports
1. Right-click on an existing `.robot` or `.resource` file in VSCode Explorer
2. Select "Edit Robot Framework Imports"
3. The import management view will appear in the dedicated sidebar
4. Browse the tree view to select files to import
5. Click on files to choose whether to import as Library, Resource, or Variables
6. Use the navigation buttons in the header to manage your selections:
   - Search: Filter files by name or type
   - Clear Search: Show all files again (only visible when search is active)
   - Expand All/Collapse All: Control tree view expansion
   - View File: Right-click to open any file for inspection
   - Confirm Imports: Apply selected imports to the target file (only visible when changes are pending)
   - Cancel: Close without making changes (only visible when changes are pending)
7. Click "Confirm Imports" to update the file or "Cancel" to abort

### Import Management Workflow
1. **Auto-Detection**: When you open a robot or resource file, imports are automatically loaded
2. **File Locking**: Click "View File" on any importable file to lock your target file automatically
3. **Browsing**: Browse files while keeping your target locked - imports stay with the target
4. **Navigation**: Use the "Go to Target File" button when locked to return to your target
5. **Organization**: See "Current Imports" section with existing imports and "All Importable Files" for new ones
6. **Selection**: Use checkboxes to select files and click files to choose import type (Library/Resource/Variables)

## Requirements

- VSCode 1.74.0 or higher

## License

MIT - see the [LICENSE](LICENSE) file for details.
