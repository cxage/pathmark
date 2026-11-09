"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
function activate(context) {
    const output = vscode.window.createOutputChannel("PathMark");
    const checkCommand = vscode.commands.registerCommand("pathmark.check", async () => {
        await executePathMark(context, output, false);
    });
    const runCommand = vscode.commands.registerCommand("pathmark.run", async () => {
        const answer = await vscode.window.showWarningMessage("PathMark will modify files in all workspace folders. Continue?", { modal: true }, "Apply Changes");
        if (answer !== "Apply Changes") {
            return;
        }
        await executePathMark(context, output, true);
    });
    context.subscriptions.push(checkCommand, runCommand, output);
}
async function executePathMark(context, output, applyChanges) {
    if (process.platform !== "win32") {
        vscode.window.showErrorMessage("PathMark currently supports Windows only.");
        return;
    }
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage("Please open a project folder before running PathMark.");
        return;
    }
    const executable = path.join(context.extensionPath, "bin", "pathmark.exe");
    if (!fs.existsSync(executable)) {
        vscode.window.showErrorMessage("PathMark executable could not be found.");
        return;
    }
    // Validate configuration files before execution.
    const missingConfigurations = [];
    for (const folder of folders) {
        const configPath = path.join(folder.uri.fsPath, ".pathmarkignore");
        try {
            await fs.promises.access(configPath);
        }
        catch {
            missingConfigurations.push(folder);
        }
    }
    if (missingConfigurations.length > 0) {
        const names = missingConfigurations.map((folder) => folder.name).join(", ");
        const answer = await vscode.window.showWarningMessage(`PathMark configuration file (.pathmarkignore) is missing in: ${names}`, "Create .pathmarkignore");
        if (answer === "Create .pathmarkignore") {
            for (const folder of missingConfigurations) {
                const configPath = path.join(folder.uri.fsPath, ".pathmarkignore");
                try {
                    await fs.promises.writeFile(configPath, "", { flag: "wx" });
                }
                catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    vscode.window.showErrorMessage(`Could not create .pathmarkignore in ${folder.name}: ${message}`);
                }
            }
            vscode.window.showInformationMessage("PathMark configuration file created where possible. Run PathMark again to continue.");
        }
        return;
    }
    output.clear();
    output.show(true);
    output.appendLine("PathMark");
    output.appendLine(applyChanges ? "Run mode" : "Check mode");
    output.appendLine(`Workspace folders: ${folders.length}`);
    output.appendLine("================================");
    let successful = 0;
    let failed = 0;
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: applyChanges
            ? "PathMark: Applying changes..."
            : "PathMark: Checking workspace...",
        cancellable: false,
    }, async (progress) => {
        for (let i = 0; i < folders.length; i++) {
            const folder = folders[i];
            progress.report({
                message: `${folder.name} (${i + 1}/${folders.length})`,
            });
            output.appendLine("");
            output.appendLine(`Processing workspace: ${folder.name}`);
            output.appendLine(`Path: ${folder.uri.fsPath}`);
            output.appendLine("--------------------------------");
            const exitCode = await runExecutable(executable, folder.uri.fsPath, applyChanges ? ["--run"] : [], output);
            if (exitCode === 0) {
                successful++;
            }
            else {
                failed++;
            }
        }
    });
    output.appendLine("");
    output.appendLine("================================");
    output.appendLine("PathMark Workspace Summary");
    output.appendLine(`Successful: ${successful}`);
    output.appendLine(`Failed: ${failed}`);
    output.appendLine("================================");
    if (failed === 0) {
        vscode.window.showInformationMessage(applyChanges
            ? "PathMark successfully processed all workspace folders."
            : "PathMark successfully checked all workspace folders.");
    }
    else {
        vscode.window.showWarningMessage(`PathMark completed with ${failed} failed workspace folder(s). Check the PathMark Output channel.`);
    }
}
function runExecutable(executable, workingDirectory, args, output) {
    return new Promise((resolve) => {
        let settled = false;
        const finish = (code) => {
            if (settled) {
                return;
            }
            settled = true;
            resolve(code);
        };
        const child = (0, child_process_1.spawn)(executable, args, {
            cwd: workingDirectory,
            windowsHide: true,
            stdio: ["ignore", "pipe", "pipe"],
        });
        child.stdout.on("data", (data) => {
            output.append(data.toString());
        });
        child.stderr.on("data", (data) => {
            output.append(data.toString());
        });
        child.on("error", (error) => {
            output.appendLine(`Execution error: ${error.message}`);
            finish(null);
        });
        child.on("close", (code) => {
            output.appendLine("");
            output.appendLine(`Finished with exit code: ${code}`);
            finish(code);
        });
    });
}
function deactivate() { }
// CX: commented to create auto ignore file
// import * as vscode from "vscode";
// import { spawn } from "child_process";
// import * as path from "path";
// import * as fs from "fs";
// export function activate(context: vscode.ExtensionContext) {
//   const output = vscode.window.createOutputChannel("PathMark");
//   const checkCommand = vscode.commands.registerCommand(
//     "pathmark.check",
//     async () => {
//       await executePathMark(context, output, false);
//     },
//   );
//   const runCommand = vscode.commands.registerCommand(
//     "pathmark.run",
//     async () => {
//       const answer = await vscode.window.showWarningMessage(
//         "PathMark will modify files in all workspace folders. Continue?",
//         { modal: true },
//         "Apply Changes",
//       );
//       if (answer !== "Apply Changes") {
//         return;
//       }
//       await executePathMark(context, output, true);
//     },
//   );
//   context.subscriptions.push(checkCommand, runCommand, output);
// }
// async function executePathMark(
//   context: vscode.ExtensionContext,
//   output: vscode.OutputChannel,
//   applyChanges: boolean,
// ): Promise<void> {
//   if (process.platform !== "win32") {
//     vscode.window.showErrorMessage("PathMark currently supports Windows only.");
//     return;
//   }
//   const folders = vscode.workspace.workspaceFolders;
//   if (!folders || folders.length === 0) {
//     vscode.window.showErrorMessage(
//       "Please open a project folder before running PathMark.",
//     );
//     return;
//   }
//   const executable = path.join(context.extensionPath, "bin", "pathmark.exe");
//   if (!fs.existsSync(executable)) {
//     vscode.window.showErrorMessage("PathMark executable could not be found.");
//     return;
//   }
//   output.clear();
//   output.show(true);
//   output.appendLine("PathMark");
//   output.appendLine(applyChanges ? "Run mode" : "Check mode");
//   output.appendLine(`Workspace folders: ${folders.length}`);
//   output.appendLine("================================");
//   let successful = 0;
//   let failed = 0;
//   await vscode.window.withProgress(
//     {
//       location: vscode.ProgressLocation.Notification,
//       title: applyChanges
//         ? "PathMark: Applying changes..."
//         : "PathMark: Checking workspace...",
//       cancellable: false,
//     },
//     async (progress) => {
//       for (let i = 0; i < folders.length; i++) {
//         const folder = folders[i];
//         progress.report({
//           message: `${folder.name} (${i + 1}/${folders.length})`,
//         });
//         output.appendLine("");
//         output.appendLine(`Processing workspace: ${folder.name}`);
//         output.appendLine(`Path: ${folder.uri.fsPath}`);
//         output.appendLine("--------------------------------");
//         const exitCode = await runExecutable(
//           executable,
//           folder.uri.fsPath,
//           applyChanges ? ["--run"] : [],
//           output,
//         );
//         if (exitCode === 0) {
//           successful++;
//         } else {
//           failed++;
//         }
//       }
//     },
//   );
//   output.appendLine("");
//   output.appendLine("================================");
//   output.appendLine("PathMark Workspace Summary");
//   output.appendLine(`Successful: ${successful}`);
//   output.appendLine(`Failed: ${failed}`);
//   output.appendLine("================================");
//   if (failed === 0) {
//     vscode.window.showInformationMessage(
//       applyChanges
//         ? "PathMark successfully processed all workspace folders."
//         : "PathMark successfully checked all workspace folders.",
//     );
//   } else {
//     vscode.window.showWarningMessage(
//       `PathMark completed with ${failed} failed workspace folder(s). Check the PathMark Output channel.`,
//     );
//   }
// }
// function runExecutable(
//   executable: string,
//   workingDirectory: string,
//   args: string[],
//   output: vscode.OutputChannel,
// ): Promise<number | null> {
//   return new Promise((resolve) => {
//     let settled = false;
//     const finish = (code: number | null) => {
//       if (settled) {
//         return;
//       }
//       settled = true;
//       resolve(code);
//     };
//     const child = spawn(executable, args, {
//       cwd: workingDirectory,
//       windowsHide: true,
//       stdio: ["ignore", "pipe", "pipe"],
//     });
//     child.stdout.on("data", (data: Buffer) => {
//       output.append(data.toString());
//     });
//     child.stderr.on("data", (data: Buffer) => {
//       output.append(data.toString());
//     });
//     child.on("error", (error) => {
//       output.appendLine(`Execution error: ${error.message}`);
//       finish(null);
//     });
//     child.on("close", (code) => {
//       output.appendLine("");
//       output.appendLine(`Finished with exit code: ${code}`);
//       finish(code);
//     });
//   });
// }
// export function deactivate() {}
