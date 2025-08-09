import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export function activate(context: vscode.ExtensionContext) {
    console.log('Kubeseal VSCode extension is now active!');

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('kubeseal.encrypt', (uri: vscode.Uri) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Encrypting Kubernetes Secret...",
                cancellable: false
            }, async (progress) => {
                await encryptSecret(uri, progress);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('kubeseal.decrypt', (uri: vscode.Uri) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Decrypting SealedSecret...",
                cancellable: false
            }, async (progress) => {
                await decryptSecret(uri, progress);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('kubeseal.setCertPath', () => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Setting Certificate Path...",
                cancellable: false
            }, async (progress) => {
                await setCertificatePath(progress);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('kubeseal.encodeBase64', (uri: vscode.Uri) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Encoding Secret Data as Base64...",
                cancellable: false
            }, async (progress) => {
                await encodeBase64Values(uri, progress);
            });
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('kubeseal.decodeBase64', (uri: vscode.Uri) => {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Decoding Base64 Secret Data...",
                cancellable: false
            }, async (progress) => {
                await decodeBase64Values(uri, progress);
            });
        })
    );
}

async function encryptSecret(uri: vscode.Uri, progress?: vscode.Progress<{ message?: string; increment?: number }>) {
    try {
        progress?.report({ message: "Loading configuration..." });
        const filePath = uri.fsPath;
        const config = vscode.workspace.getConfiguration('kubeseal');
        let certPath = config.get<string>('certPath', '');
        const kubesealPath = config.get<string>('kubesealPath', 'kubeseal');

        // Check if certificate path is set
        if (!certPath) {
            progress?.report({ message: "Certificate path not set. Asking user..." });
            const result = await vscode.window.showInformationMessage(
                'Certificate path not set. Would you like to set it now?',
                'Yes', 'No'
            );
            if (result === 'Yes') {
                await setCertificatePath(progress);
                // Fetch updated config
                const newConfig = vscode.workspace.getConfiguration('kubeseal');
                certPath = newConfig.get<string>('certPath', '');
            }
            if (!certPath) {
                vscode.window.showErrorMessage('Certificate path is required for encryption');
                return;
            }
        }

        // Check if certificate file exists
        progress?.report({ message: "Validating certificate file..." });
        if (!fs.existsSync(certPath)) {
            vscode.window.showErrorMessage(`Certificate file not found: ${certPath}`);
            return;
        }

        // Read the input file
        progress?.report({ message: "Reading secret file..." });
        const inputContent = fs.readFileSync(filePath, 'utf8');

        // Check if the file contains a Secret resource
        if (!inputContent.includes('kind: Secret')) {
            vscode.window.showWarningMessage('This file does not appear to contain a Kubernetes Secret');
            return;
        }

        // Generate output file path
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const basename = path.basename(filePath, ext);
        const outputPath = path.join(dir, `${basename}-sealed${ext}`);

        // Run kubeseal command
        progress?.report({ message: "Running kubeseal to encrypt secret..." });
        const command = `${kubesealPath} --cert "${certPath}" --format yaml < "${filePath}" > "${outputPath}"`;

        await execAsync(command);

        vscode.window.showInformationMessage(`Secret encrypted successfully: ${outputPath}`);

        // Ask if user wants to open the encrypted file
        const openResult = await vscode.window.showInformationMessage(
            'Would you like to open the encrypted file?',
            'Yes', 'No'
        );

        if (openResult === 'Yes') {
            progress?.report({ message: "Opening encrypted file..." });
            const document = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(document);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to encrypt secret: ${errorMessage}`);
    }
}

async function decryptSecret(uri: vscode.Uri, progress?: vscode.Progress<{ message?: string; increment?: number }>) {
    try {
        progress?.report({ message: "Reading secret file..." });
        const filePath = uri.fsPath;
        const config = vscode.workspace.getConfiguration('kubeseal');
        const kubesealPath = config.get<string>('kubesealPath', 'kubeseal');

        // Read the input file
        const inputContent = fs.readFileSync(filePath, 'utf8');

        // Check if the file contains a SealedSecret resource
        if (!inputContent.includes('kind: SealedSecret')) {
            vscode.window.showWarningMessage('This file does not appear to contain a SealedSecret');
            return;
        }

        // Generate output file path
        const dir = path.dirname(filePath);
        const ext = path.extname(filePath);
        const basename = path.basename(filePath, ext);
        const outputPath = path.join(dir, `${basename}-unsealed${ext}`);

        // Extract secret name from the SealedSecret
        const secretNameMatch = inputContent.match(/name:\s*([^\s\n]+)/);
        const secretName = secretNameMatch ? secretNameMatch[1] : path.basename(filePath, ext);
        const namespaceMatch = inputContent.match(/namespace:\s*([^\s\n]+)/);
        const namespace = namespaceMatch ? namespaceMatch[1] : 'default';

        // Get secret from cluster
        const clusterCommand = `kubectl get secret ${secretName} -n ${namespace} -o yaml > "${outputPath}"`;

        progress?.report({ message: "Getting secret from cluster..." });

        await execAsync(clusterCommand);

        vscode.window.showInformationMessage(`Secret retrieved successfully from cluster: ${outputPath}`);

        const openResult = await vscode.window.showInformationMessage(
            'Would you like to open the decrypted file?',
            'Yes', 'No'
        );

        if (openResult === 'Yes') {
            progress?.report({ message: "Opening decrypted file..." });
            const document = await vscode.workspace.openTextDocument(outputPath);
            await vscode.window.showTextDocument(document);
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to decrypt secret: ${errorMessage}`);
    }
}

async function setCertificatePath(progress?: vscode.Progress<{ message?: string; increment?: number }>) {
    progress?.report?.({ message: "Prompting for certificate file..." });
    const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Select Certificate',
        filters: {
            'Certificate files': ['pem', 'crt', 'cert'],
            'All files': ['*']
        }
    };

    const fileUri = await vscode.window.showOpenDialog(options);
    if (fileUri && fileUri.length > 0) {
        progress?.report?.({ message: "Saving certificate path to config..." });
        const certPath = fileUri[0].fsPath;
        const config = vscode.workspace.getConfiguration('kubeseal');
        await config.update('certPath', certPath, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Certificate path set to: ${certPath}`);
    }
}

async function encodeBase64Values(uri: vscode.Uri, progress?: vscode.Progress<{ message?: string; increment?: number }>) {
    try {
        progress?.report({ message: "Reading file..." });
        const filePath = uri.fsPath;
        const inputContent = fs.readFileSync(filePath, 'utf8');

        if (!inputContent.includes('kind: Secret')) {
            vscode.window.showWarningMessage('This file does not appear to contain a Kubernetes Secret');
            return;
        }

        let modifiedContent = inputContent;
        let encodedCount = 0;

        progress?.report({ message: "Encoding values..." });

        const dataRegex = /^(\s*data:\s*\n)((?:\s{2,}[^:\s]+:\s*[^\n]*(?:\s*#[^\n]*)?\n)*)/m;
        const dataMatch = modifiedContent.match(dataRegex);

        if (dataMatch) {
            const dataPrefix = dataMatch[1];
            const dataContent = dataMatch[2];
            const lines = dataContent.split('\n');
            let newDataContent = '';

            for (const line of lines) {
                if (line.trim() === '') {
                    newDataContent += line + '\n';
                    continue;
                }

                const keyValueMatch = line.match(/^(\s*)([^:\s]+):\s*([^#\n]*?)(\s*#.*)?$/);
                if (keyValueMatch) {
                    const indent = keyValueMatch[1];
                    const key = keyValueMatch[2];
                    const value = keyValueMatch[3].trim();
                    const comment = keyValueMatch[4] || '';

                    if (value) {
                        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
                        if (!base64Regex.test(value)) {
                            const encoded = Buffer.from(value).toString('base64');
                            newDataContent += `${indent}${key}: ${encoded}${comment}\n`;
                            encodedCount++;
                        } else {
                            newDataContent += line + '\n';
                        }
                    } else {
                        newDataContent += line + '\n';
                    }
                } else {
                    newDataContent += line + '\n';
                }
            }

            if (encodedCount > 0) {
                modifiedContent = modifiedContent.replace(dataRegex, dataPrefix + newDataContent);
                fs.writeFileSync(filePath, modifiedContent, 'utf8');
                vscode.window.showInformationMessage(`Encoded ${encodedCount} value(s) to base64`);
            } else {
                vscode.window.showInformationMessage('All values in "data" are already base64 encoded');
            }
        } else {
            vscode.window.showWarningMessage('No "data" field found in the Secret');
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to encode base64 values: ${errorMessage}`);
    }
}

async function decodeBase64Values(uri: vscode.Uri, progress?: vscode.Progress<{ message?: string; increment?: number }>) {
    try {
        progress?.report({ message: "Reading file..." });
        const filePath = uri.fsPath;
        const inputContent = fs.readFileSync(filePath, 'utf8');

        if (!inputContent.includes('kind: Secret')) {
            vscode.window.showWarningMessage('This file does not appear to contain a Kubernetes Secret');
            return;
        }

        let modifiedContent = inputContent;
        let decodedCount = 0;

        progress?.report({ message: "Decoding base64 values..." });

        const dataRegex = /^(\s*data:\s*\n)((?:\s{2,}[^:\s]+:\s*[^\n]*(?:\s*#[^\n]*)?\n)*)/m;
        const dataMatch = modifiedContent.match(dataRegex);

        if (dataMatch) {
            const dataPrefix = dataMatch[1];
            const dataContent = dataMatch[2];
            const lines = dataContent.split('\n');
            let newDataContent = '';

            for (const line of lines) {
                if (line.trim() === '') {
                    newDataContent += line + '\n';
                    continue;
                }

                const keyValueMatch = line.match(/^(\s*)([^:\s]+):\s*([^#\n]*?)(\s*#.*)?$/);
                if (keyValueMatch) {
                    const indent = keyValueMatch[1];
                    const key = keyValueMatch[2];
                    const value = keyValueMatch[3].trim();
                    const comment = keyValueMatch[4] || '';

                    if (value) {
                        const base64Regex = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
                        if (base64Regex.test(value)) {
                            try {
                                const decoded = Buffer.from(value, 'base64').toString('utf8');
                                newDataContent += `${indent}${key}: ${decoded}${comment}\n`;
                                decodedCount++;
                            } catch (decodeError) {
                                newDataContent += line + '\n';
                            }
                        } else {
                            newDataContent += line + '\n';
                        }
                    } else {
                        newDataContent += line + '\n';
                    }
                } else {
                    newDataContent += line + '\n';
                }
            }

            if (decodedCount > 0) {
                modifiedContent = modifiedContent.replace(dataRegex, dataPrefix + newDataContent);
                fs.writeFileSync(filePath, modifiedContent, 'utf8');
                vscode.window.showInformationMessage(`Decoded ${decodedCount} base64 value(s)`);
            } else {
                vscode.window.showInformationMessage('No base64 encoded values found in "data" field');
            }
        } else {
            vscode.window.showWarningMessage('No "data" field found in the Secret');
        }

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        vscode.window.showErrorMessage(`Failed to decode base64 values: ${errorMessage}`);
    }
}

export function deactivate() {}
