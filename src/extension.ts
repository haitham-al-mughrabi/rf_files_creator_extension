import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Path type options
type PathType = 'relative' | 'absolute';

// Tree item for file selection
class FileTreeItem extends vscode.TreeItem {
    children: FileTreeItem[] = [];
    parent?: FileTreeItem;
    isFile: boolean;
    filePath: string;
    importType?: 'Library' | 'Resource' | 'Variables';
    relativePath: string;
    absolutePath: string;

    constructor(
        label: string,
        collapsibleState: vscode.TreeItemCollapsibleState,
        isFile: boolean,
        filePath: string = '',
        relativePath: string = '',
        absolutePath: string = '',
        importType?: 'Library' | 'Resource' | 'Variables'
    ) {
        super(label, collapsibleState);
        this.isFile = isFile;
        this.filePath = filePath;
        this.relativePath = relativePath;
        this.absolutePath = absolutePath;
        this.importType = importType;

        if (isFile) {
            this.iconPath = new vscode.ThemeIcon(importType === 'Library' ? 'library' : importType === 'Resource' ? 'file-code' : 'symbol-variable');
            this.description = importType ? `[${importType}]` : '';
            this.checkboxState = vscode.TreeItemCheckboxState.Unchecked;
        } else {
            this.iconPath = new vscode.ThemeIcon('folder');
        }
    }
}

// Tree data provider for file selection
class FileTreeDataProvider implements vscode.TreeDataProvider<FileTreeItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<FileTreeItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    private rootItems: FileTreeItem[] = [];
    private checkedItems: Set<FileTreeItem> = new Set();

    constructor(
        private pyFiles: vscode.Uri[],
        private resourceFiles: vscode.Uri[],
        private targetDir: string,
        private workspaceRoot: string
    ) {
        this.buildTree();
    }

    private buildTree() {
        this.rootItems = [];

        // Build tree for .py files
        if (this.pyFiles.length > 0) {
            const pyRoot = new FileTreeItem(
                'Python Files (.py) - Library/Variables',
                vscode.TreeItemCollapsibleState.Expanded,
                false
            );
            this.addFilesToTree(pyRoot, this.pyFiles, ['Library', 'Variables']);
            this.rootItems.push(pyRoot);
        }

        // Build tree for .resource files
        if (this.resourceFiles.length > 0) {
            const resourceRoot = new FileTreeItem(
                'Resource Files (.resource) - Resource/Variables',
                vscode.TreeItemCollapsibleState.Expanded,
                false
            );
            this.addFilesToTree(resourceRoot, this.resourceFiles, ['Resource', 'Variables']);
            this.rootItems.push(resourceRoot);
        }
    }

    private addFilesToTree(
        root: FileTreeItem,
        files: vscode.Uri[],
        importTypes: ('Library' | 'Resource' | 'Variables')[]
    ) {
        // Group files by folder path
        const folderMap = new Map<string, { files: vscode.Uri[], folders: Map<string, any> }>();

        for (const file of files) {
            const absolutePath = this.getAbsolutePath(file.fsPath);
            const parts = absolutePath.split('/');
            const fileName = parts.pop()!;
            const folderPath = parts.join('/');

            let current = folderMap;
            let currentPath = '';

            for (const part of parts) {
                currentPath = currentPath ? `${currentPath}/${part}` : part;
                if (!current.has(currentPath)) {
                    current.set(currentPath, { files: [], folders: new Map() });
                }
                current = current.get(currentPath)!.folders;
            }

            if (!folderMap.has(folderPath)) {
                folderMap.set(folderPath, { files: [], folders: new Map() });
            }
            folderMap.get(folderPath)!.files.push(file);
        }

        // Build tree structure
        this.buildFolderTree(root, '', folderMap, importTypes);
    }

    private buildFolderTree(
        parent: FileTreeItem,
        currentPath: string,
        folderMap: Map<string, { files: vscode.Uri[], folders: Map<string, any> }>,
        importTypes: ('Library' | 'Resource' | 'Variables')[]
    ) {
        // Get all folders at current level
        const folders = new Set<string>();
        const filesAtCurrentLevel: vscode.Uri[] = [];

        for (const [folderPath, data] of folderMap.entries()) {
            if (currentPath === '') {
                // Root level - get first folder segment
                const parts = folderPath.split('/');
                if (parts[0]) {
                    folders.add(parts[0]);
                }
                if (folderPath === '' && data.files.length > 0) {
                    filesAtCurrentLevel.push(...data.files);
                }
            } else if (folderPath.startsWith(currentPath + '/')) {
                // Get next folder segment
                const remaining = folderPath.slice(currentPath.length + 1);
                const parts = remaining.split('/');
                if (parts[0]) {
                    folders.add(parts[0]);
                }
            } else if (folderPath === currentPath) {
                filesAtCurrentLevel.push(...data.files);
            }
        }

        // Add folders
        const sortedFolders = Array.from(folders).sort();
        for (const folder of sortedFolders) {
            const folderPath = currentPath ? `${currentPath}/${folder}` : folder;
            const folderItem = new FileTreeItem(
                folder,
                vscode.TreeItemCollapsibleState.Expanded,
                false
            );
            folderItem.parent = parent;
            parent.children.push(folderItem);
            this.buildFolderTree(folderItem, folderPath, folderMap, importTypes);
        }

        // Add files at current level
        for (const file of filesAtCurrentLevel) {
            const fileName = path.basename(file.fsPath);
            const relativePath = this.getRelativePath(file.fsPath);
            const absolutePath = this.getAbsolutePath(file.fsPath);

            for (const importType of importTypes) {
                const fileItem = new FileTreeItem(
                    fileName,
                    vscode.TreeItemCollapsibleState.None,
                    true,
                    file.fsPath,
                    relativePath,
                    absolutePath,
                    importType
                );
                fileItem.parent = parent;
                parent.children.push(fileItem);
            }
        }
    }

    private getRelativePath(filePath: string): string {
        return path.relative(this.targetDir, filePath).replace(/\\/g, '/');
    }

    private getAbsolutePath(filePath: string): string {
        return path.relative(this.workspaceRoot, filePath).replace(/\\/g, '/');
    }

    getTreeItem(element: FileTreeItem): vscode.TreeItem {
        return element;
    }

    getChildren(element?: FileTreeItem): FileTreeItem[] {
        if (!element) {
            return this.rootItems;
        }
        return element.children;
    }

    getParent(element: FileTreeItem): FileTreeItem | undefined {
        return element.parent;
    }

    getCheckedItems(): FileTreeItem[] {
        return Array.from(this.checkedItems);
    }

    toggleCheck(item: FileTreeItem, checked: boolean) {
        if (checked) {
            this.checkedItems.add(item);
        } else {
            this.checkedItems.delete(item);
        }
    }

    refresh() {
        this._onDidChangeTreeData.fire(undefined);
    }
}

// Global state for the tree view
let currentTreeProvider: FileTreeDataProvider | undefined;
let currentTreeView: vscode.TreeView<FileTreeItem> | undefined;
let resolveSelection: ((items: FileTreeItem[]) => void) | undefined;
let pathType: PathType = 'relative';
let pendingFilePath: string = '';
let pendingFileType: string = '';
let pendingMainSection: string = '';

export function activate(context: vscode.ExtensionContext) {
    // Register the tree view
    const treeView = vscode.window.createTreeView('rfImportSelector', {
        treeDataProvider: {
            getTreeItem: (element: FileTreeItem) => currentTreeProvider?.getTreeItem(element) || element,
            getChildren: (element?: FileTreeItem) => currentTreeProvider?.getChildren(element) || [],
            getParent: (element: FileTreeItem) => currentTreeProvider?.getParent(element),
            onDidChangeTreeData: new vscode.EventEmitter<FileTreeItem | undefined>().event
        },
        canSelectMany: true,
        manageCheckboxStateManually: true
    });

    currentTreeView = treeView;

    // Handle checkbox changes
    treeView.onDidChangeCheckboxState(e => {
        for (const [item, state] of e.items) {
            if (item.isFile) {
                currentTreeProvider?.toggleCheck(item, state === vscode.TreeItemCheckboxState.Checked);
            }
        }
    });

    // Register confirm command
    const confirmCommand = vscode.commands.registerCommand('rfFilesCreator.confirmSelection', async () => {
        if (resolveSelection && currentTreeProvider) {
            const selectedItems = currentTreeProvider.getCheckedItems();
            resolveSelection(selectedItems);
            resolveSelection = undefined;

            // Hide the view
            await vscode.commands.executeCommand('setContext', 'rfFilesCreator.showImportSelector', false);
        }
    });

    // Register skip command
    const skipCommand = vscode.commands.registerCommand('rfFilesCreator.skipSelection', async () => {
        if (resolveSelection) {
            resolveSelection([]);
            resolveSelection = undefined;

            // Hide the view
            await vscode.commands.executeCommand('setContext', 'rfFilesCreator.showImportSelector', false);
        }
    });

    // Register command: Create Robot Framework Test File
    const createTestFile = vscode.commands.registerCommand(
        'rfFilesCreator.createTestFile',
        async (uri: vscode.Uri) => {
            await createRobotFileWithImports(uri, 'test', '.robot', '*** Test Cases ***');
        }
    );

    // Register command: Create Robot Framework Resource File
    const createResourceFile = vscode.commands.registerCommand(
        'rfFilesCreator.createResourceFile',
        async (uri: vscode.Uri) => {
            await createRobotFileWithImports(uri, 'resource', '.resource', '*** Keywords ***');
        }
    );

    // Register command: Create Robot Framework Variables File
    const createVariablesFile = vscode.commands.registerCommand(
        'rfFilesCreator.createVariablesFile',
        async (uri: vscode.Uri) => {
            await createRobotFileWithImports(uri, 'variables', '.resource', '*** Variables ***');
        }
    );

    // Register command: Create Robot Framework Locators File
    const createLocatorsFile = vscode.commands.registerCommand(
        'rfFilesCreator.createLocatorsFile',
        async (uri: vscode.Uri) => {
            await createRobotFile(uri, 'locators', '.py', '');
        }
    );

    context.subscriptions.push(
        treeView,
        confirmCommand,
        skipCommand,
        createTestFile,
        createResourceFile,
        createVariablesFile,
        createLocatorsFile
    );
}

/**
 * Prompt user to select path type (relative or absolute)
 */
async function selectPathType(): Promise<PathType | undefined> {
    const options: vscode.QuickPickItem[] = [
        {
            label: '$(file-symlink-directory) Relative Path',
            description: 'e.g., ../../Library/locators.py',
            detail: 'Path relative to the new file location'
        },
        {
            label: '$(root-folder) Absolute Path (from workspace)',
            description: 'e.g., Library/locators.py',
            detail: 'Path from workspace root folder'
        }
    ];

    const selected = await vscode.window.showQuickPick(options, {
        title: 'Select Import Path Style',
        placeHolder: 'How should import paths be formatted?'
    });

    if (!selected) {
        return undefined;
    }

    return selected.label.includes('Relative') ? 'relative' : 'absolute';
}

/**
 * Generate Settings section content based on selected imports
 */
function generateSettingsSection(selectedImports: FileTreeItem[], pathType: PathType): string {
    const libraries: string[] = [];
    const resources: string[] = [];
    const variables: string[] = [];

    for (const item of selectedImports) {
        if (!item.isFile) continue;

        const filePath = pathType === 'relative' ? item.relativePath : item.absolutePath;

        switch (item.importType) {
            case 'Library':
                libraries.push(filePath);
                break;
            case 'Resource':
                resources.push(filePath);
                break;
            case 'Variables':
                variables.push(filePath);
                break;
        }
    }

    let settings = '*** Settings ***\n';

    for (const lib of libraries) {
        settings += `Library    ${lib}\n`;
    }

    for (const res of resources) {
        settings += `Resource    ${res}\n`;
    }

    for (const vars of variables) {
        settings += `Variables    ${vars}\n`;
    }

    return settings;
}

/**
 * Create Robot Framework file with import selection dialog
 */
async function createRobotFileWithImports(
    uri: vscode.Uri | undefined,
    fileType: string,
    extension: string,
    mainSection: string
): Promise<void> {
    let targetDir: string;
    let workspaceRoot: string;

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('No workspace folder open. Please open a folder first.');
        return;
    }
    workspaceRoot = workspaceFolders[0].uri.fsPath;

    if (uri) {
        targetDir = uri.fsPath;
    } else {
        targetDir = workspaceRoot;
    }

    // Prompt user for filename first
    const fileName = await vscode.window.showInputBox({
        prompt: `Enter the name for the new Robot Framework ${fileType} file`,
        placeHolder: `my_${fileType}`,
        validateInput: (value) => {
            if (!value || value.trim() === '') {
                return 'File name cannot be empty';
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                return 'File name can only contain letters, numbers, underscores, and hyphens';
            }
            return null;
        }
    });

    if (!fileName) {
        return;
    }

    const fullFileName = fileName + extension;
    const filePath = path.join(targetDir, fullFileName);

    if (fs.existsSync(filePath)) {
        const overwrite = await vscode.window.showWarningMessage(
            `File "${fullFileName}" already exists. Do you want to overwrite it?`,
            'Yes',
            'No'
        );
        if (overwrite !== 'Yes') {
            return;
        }
    }

    // Find importable files
    const pyFiles = await vscode.workspace.findFiles('**/*.py', '**/node_modules/**');
    const resourceFiles = await vscode.workspace.findFiles('**/*.resource', '**/node_modules/**');

    let selectedImports: FileTreeItem[] = [];
    let selectedPathType: PathType = 'relative';

    if (pyFiles.length > 0 || resourceFiles.length > 0) {
        // Ask for path type
        const pathTypeResult = await selectPathType();
        if (pathTypeResult === undefined) {
            // User cancelled, create file without imports
            const template = `*** Settings ***\n\n\n${mainSection}\n`;
            try {
                fs.writeFileSync(filePath, template, 'utf8');
                const document = await vscode.workspace.openTextDocument(filePath);
                await vscode.window.showTextDocument(document);
                vscode.window.showInformationMessage(`Created Robot Framework ${fileType} file: ${fullFileName}`);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                vscode.window.showErrorMessage(`Failed to create file: ${errorMessage}`);
            }
            return;
        }
        selectedPathType = pathTypeResult;

        // Show QuickPick with tree-like structure
        selectedImports = await showFileSelectionQuickPick(pyFiles, resourceFiles, targetDir, workspaceRoot, selectedPathType);
    }

    // Generate file content
    const settingsSection = generateSettingsSection(selectedImports, selectedPathType);
    const template = `${settingsSection}\n\n${mainSection}\n`;

    try {
        fs.writeFileSync(filePath, template, 'utf8');
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Created Robot Framework ${fileType} file: ${fullFileName}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create file: ${errorMessage}`);
    }
}

/**
 * Show file selection using QuickPick with tree-like indentation
 */
async function showFileSelectionQuickPick(
    pyFiles: vscode.Uri[],
    resourceFiles: vscode.Uri[],
    targetDir: string,
    workspaceRoot: string,
    pathType: PathType
): Promise<FileTreeItem[]> {
    interface SelectableItem extends vscode.QuickPickItem {
        isFile: boolean;
        filePath: string;
        relativePath: string;
        absolutePath: string;
        importType?: 'Library' | 'Resource' | 'Variables';
        depth: number;
        folderPath: string;
    }

    const items: SelectableItem[] = [];

    // Helper to get paths
    const getRelativePath = (filePath: string) => path.relative(targetDir, filePath).replace(/\\/g, '/');
    const getAbsolutePath = (filePath: string) => path.relative(workspaceRoot, filePath).replace(/\\/g, '/');

    // Build folder structure for files
    const buildFolderStructure = (
        files: vscode.Uri[],
        importTypes: ('Library' | 'Resource' | 'Variables')[],
        sectionLabel: string
    ) => {
        if (files.length === 0) return;

        // Add section header
        items.push({
            label: `$(folder-library) ${sectionLabel}`,
            kind: vscode.QuickPickItemKind.Separator,
            isFile: false,
            filePath: '',
            relativePath: '',
            absolutePath: '',
            depth: 0,
            folderPath: ''
        });

        // Group files by folder
        const folderFiles = new Map<string, vscode.Uri[]>();
        for (const file of files) {
            const absPath = getAbsolutePath(file.fsPath);
            const folderPath = path.dirname(absPath);
            if (!folderFiles.has(folderPath)) {
                folderFiles.set(folderPath, []);
            }
            folderFiles.get(folderPath)!.push(file);
        }

        // Sort folders
        const sortedFolders = Array.from(folderFiles.keys()).sort();

        for (const folder of sortedFolders) {
            const folderDepth = folder ? folder.split('/').length : 0;
            const indent = '    '.repeat(folderDepth);
            const folderName = folder ? folder.split('/').pop() : '(root)';

            // Add folder item (as separator)
            if (folder) {
                items.push({
                    label: `${indent}$(folder) ${folder}`,
                    kind: vscode.QuickPickItemKind.Separator,
                    isFile: false,
                    filePath: '',
                    relativePath: '',
                    absolutePath: '',
                    depth: folderDepth,
                    folderPath: folder
                });
            }

            // Add files in this folder
            const filesInFolder = folderFiles.get(folder)!;
            filesInFolder.sort((a, b) => path.basename(a.fsPath).localeCompare(path.basename(b.fsPath)));

            for (const file of filesInFolder) {
                const fileName = path.basename(file.fsPath);
                const relativePath = getRelativePath(file.fsPath);
                const absolutePath = getAbsolutePath(file.fsPath);
                const fileIndent = '    '.repeat(folderDepth + 1);
                const displayPath = pathType === 'relative' ? relativePath : absolutePath;

                for (const importType of importTypes) {
                    const icon = importType === 'Library' ? '$(library)' : importType === 'Resource' ? '$(file-code)' : '$(symbol-variable)';
                    items.push({
                        label: `${fileIndent}${icon} ${fileName}`,
                        description: `[${importType}]`,
                        detail: displayPath,
                        isFile: true,
                        filePath: file.fsPath,
                        relativePath,
                        absolutePath,
                        importType,
                        depth: folderDepth + 1,
                        folderPath: folder
                    });
                }
            }
        }
    };

    // Build structure for both file types
    buildFolderStructure(pyFiles, ['Library', 'Variables'], 'Python Files (.py)');
    buildFolderStructure(resourceFiles, ['Resource', 'Variables'], 'Resource Files (.resource)');

    // Show QuickPick
    const quickPick = vscode.window.createQuickPick<SelectableItem>();
    quickPick.items = items;
    quickPick.canSelectMany = true;
    quickPick.title = 'Select files to import';
    quickPick.placeholder = 'Check files to import (Enter to confirm, Esc to skip)';

    const result = await new Promise<SelectableItem[]>((resolve) => {
        quickPick.onDidAccept(() => {
            resolve([...quickPick.selectedItems]);
            quickPick.hide();
        });
        quickPick.onDidHide(() => {
            resolve([]);
            quickPick.dispose();
        });
        quickPick.show();
    });

    // Convert to FileTreeItem format
    return result.filter(item => item.isFile).map(item => {
        const treeItem = new FileTreeItem(
            path.basename(item.filePath),
            vscode.TreeItemCollapsibleState.None,
            true,
            item.filePath,
            item.relativePath,
            item.absolutePath,
            item.importType
        );
        return treeItem;
    });
}

/**
 * Create simple Robot Framework file without import selection (for .py files)
 */
async function createRobotFile(
    uri: vscode.Uri | undefined,
    fileType: string,
    extension: string,
    template: string
): Promise<void> {
    let targetDir: string;

    if (uri) {
        targetDir = uri.fsPath;
    } else {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            targetDir = workspaceFolders[0].uri.fsPath;
        } else {
            vscode.window.showErrorMessage('No workspace folder open. Please open a folder first.');
            return;
        }
    }

    const fileName = await vscode.window.showInputBox({
        prompt: `Enter the name for the new Robot Framework ${fileType} file`,
        placeHolder: `my_${fileType}`,
        validateInput: (value) => {
            if (!value || value.trim() === '') {
                return 'File name cannot be empty';
            }
            if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
                return 'File name can only contain letters, numbers, underscores, and hyphens';
            }
            return null;
        }
    });

    if (!fileName) {
        return;
    }

    const fullFileName = fileName + extension;
    const filePath = path.join(targetDir, fullFileName);

    if (fs.existsSync(filePath)) {
        const overwrite = await vscode.window.showWarningMessage(
            `File "${fullFileName}" already exists. Do you want to overwrite it?`,
            'Yes',
            'No'
        );
        if (overwrite !== 'Yes') {
            return;
        }
    }

    try {
        fs.writeFileSync(filePath, template, 'utf8');
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);
        vscode.window.showInformationMessage(`Created Robot Framework ${fileType} file: ${fullFileName}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create file: ${errorMessage}`);
    }
}

export function deactivate() {}
