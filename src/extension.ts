import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

// Robot Framework file templates
const templates = {
    testFile: `*** Settings ***


*** Test Cases ***
`,
    resourceFile: `*** Settings ***


*** Keywords ***
`,
    variablesFile: `*** Settings ***


*** Variables ***
`,
    locatorsFile: ``
};

export function activate(context: vscode.ExtensionContext) {
    // Register command: Create Robot Framework Test File
    const createTestFile = vscode.commands.registerCommand(
        'rfFilesCreator.createTestFile',
        async (uri: vscode.Uri) => {
            await createRobotFile(uri, 'test', '.robot', templates.testFile);
        }
    );

    // Register command: Create Robot Framework Resource File
    const createResourceFile = vscode.commands.registerCommand(
        'rfFilesCreator.createResourceFile',
        async (uri: vscode.Uri) => {
            await createRobotFile(uri, 'resource', '.resource', templates.resourceFile);
        }
    );

    // Register command: Create Robot Framework Variables File
    const createVariablesFile = vscode.commands.registerCommand(
        'rfFilesCreator.createVariablesFile',
        async (uri: vscode.Uri) => {
            await createRobotFile(uri, 'variables', '.resource', templates.variablesFile);
        }
    );

    // Register command: Create Robot Framework Locators File
    const createLocatorsFile = vscode.commands.registerCommand(
        'rfFilesCreator.createLocatorsFile',
        async (uri: vscode.Uri) => {
            await createRobotFile(uri, 'locators', '.py', templates.locatorsFile);
        }
    );

    context.subscriptions.push(
        createTestFile,
        createResourceFile,
        createVariablesFile,
        createLocatorsFile
    );
}

async function createRobotFile(
    uri: vscode.Uri | undefined,
    fileType: string,
    extension: string,
    template: string
): Promise<void> {
    // Determine the target directory
    let targetDir: string;

    if (uri) {
        targetDir = uri.fsPath;
    } else {
        // If no URI provided, use workspace folder or prompt user
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            targetDir = workspaceFolders[0].uri.fsPath;
        } else {
            vscode.window.showErrorMessage('No workspace folder open. Please open a folder first.');
            return;
        }
    }

    // Prompt user for filename
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
        return; // User cancelled
    }

    const fullFileName = fileName + extension;
    const filePath = path.join(targetDir, fullFileName);

    // Check if file already exists
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
        // Create the file with template content
        fs.writeFileSync(filePath, template, 'utf8');

        // Open the newly created file
        const document = await vscode.workspace.openTextDocument(filePath);
        await vscode.window.showTextDocument(document);

        vscode.window.showInformationMessage(`Created Robot Framework ${fileType} file: ${fullFileName}`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        vscode.window.showErrorMessage(`Failed to create file: ${errorMessage}`);
    }
}

export function deactivate() {}
