/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the MIT license found in the
 * LICENSE file in the root of this projects source tree.
 */

import * as vscode from "vscode";
import { Disposable, IDisposable } from "common/Disposable";
import { Webview, WebviewPanel, WebviewPanelOnDidChangeViewStateEvent } from "vscode";
import { ValueEventEmitter } from "common/ValueEventEmitter";

const PqTestResultViewPanelPrefix: string = `powerquery.sdk.pqtest`;

type SimplePqTestResultViewBrokerValues = "latestPqTestResult" | string;
// todo replace this SimplePqTestResultViewBroker with a more fancier one
export class SimplePqTestResultViewBroker {
    public static values: Readonly<Record<SimplePqTestResultViewBrokerValues, ValueEventEmitter>> = Object.freeze({
        latestPqTestResult: new ValueEventEmitter(undefined),
    });
    public static activate(): void {
        for (const oneProperty in this.values) {
            // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-explicit-any
            this.values[oneProperty].subscribe((nextValue: any) => {
                PqTestResultViewPanel.currentPanel?.postOneMessage("OnOneValueUpdated", {
                    property: oneProperty,
                    value: nextValue,
                });
            });
        }
    }
    public static emitAll(): void {
        for (const oneProperty in this.values) {
            // eslint-disable-next-line security/detect-object-injection
            this.values[oneProperty].emit();
        }
    }
    public static deActivate(): void {
        for (const oneProperty in this.values) {
            // eslint-disable-next-line security/detect-object-injection
            this.values[oneProperty].dispose();
        }
    }
    // noinspection JSUnusedLocalSymbols
    private constructor() {
        // noop
    }
}

export class PqTestResultViewPanel implements IDisposable {
    static ShowResultWebViewCommand: string = `${PqTestResultViewPanelPrefix}.ShowResultWebView`;
    public static readonly viewType: string = `${PqTestResultViewPanelPrefix}.ResultWebView`;
    public static readonly viewPaths: string[] = ["webviewDist", "pq-test-result-view"];

    public static currentPanel?: PqTestResultViewPanel;

    public static getWebviewOptions(extensionUri: vscode.Uri): vscode.WebviewOptions {
        return {
            // Enable javascript in the webview
            enableScripts: true,
            // retainContextWhenHidden: true,

            // And restrict the webview to only loading content from our extension's `main` directory.
            localResourceRoots: [vscode.Uri.joinPath(extensionUri, ...PqTestResultViewPanel.viewPaths)],
        };
    }

    public static activate(vscExtCtx: vscode.ExtensionContext): IDisposable {
        vscExtCtx.subscriptions.push(
            vscode.commands.registerCommand(PqTestResultViewPanel.ShowResultWebViewCommand, () => {
                PqTestResultViewPanel.createOrShow(vscExtCtx.extensionUri);
            }),
        );

        if (vscode.window.registerWebviewPanelSerializer) {
            // Make sure we register a serializer in activation event
            vscode.window.registerWebviewPanelSerializer(PqTestResultViewPanel.viewType, {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any,require-await
                async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, _state: any) {
                    // console.log(`Got state: ${state}`);
                    // Reset the webview options so we use latest uri for `localResourceRoots`.
                    webviewPanel.webview.options = PqTestResultViewPanel.getWebviewOptions(vscExtCtx.extensionUri);
                    PqTestResultViewPanel.revive(webviewPanel, vscExtCtx.extensionUri);
                },
            });
        }

        SimplePqTestResultViewBroker.activate();

        return new Disposable(() => {
            SimplePqTestResultViewBroker.deActivate();
        });
    }

    public static createOrShow(extensionUri: vscode.Uri): void {
        // const column: ViewColumn | undefined = vscode.window.activeTextEditor?.viewColumn ?? undefined;
        if (this.currentPanel) {
            // reveal currentPanel to current column
            this.currentPanel._panel.reveal();

            return;
        }

        // Otherwise, create a new panel. workbench.action.editorLayoutTwoColumns
        vscode.commands.executeCommand("workbench.action.editorLayoutTwoColumns").then(
            (_value: unknown) => {
                // noop
                // todo log into the telemetry
            },
            (_reason: unknown) => {
                // noop
                // todo log into the telemetry
            },
        );

        const panel: WebviewPanel = vscode.window.createWebviewPanel(
            PqTestResultViewPanel.viewType,
            "PQTest result",
            vscode.ViewColumn.Beside,
            PqTestResultViewPanel.getWebviewOptions(extensionUri),
        );

        this.currentPanel = new PqTestResultViewPanel(panel, extensionUri);
    }

    public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri): void {
        this.currentPanel = new PqTestResultViewPanel(panel, extensionUri);
    }

    private _disposables: IDisposable[] = [];

    constructor(private readonly _panel: vscode.WebviewPanel, private readonly _extensionUri: vscode.Uri) {
        this._update();
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

        // Update the content based on view changes
        this._panel.onDidChangeViewState(
            (_e: WebviewPanelOnDidChangeViewStateEvent) => {
                if (this._panel.visible) {
                    this._update();
                }
            },
            null,
            this._disposables,
        );

        // Handle messages from the webview
        this._panel.webview.onDidReceiveMessage(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (message: any) => {
                switch (message.type) {
                    case "onReady":
                        SimplePqTestResultViewBroker.emitAll();
                }
            },
            null,
            this._disposables,
        );
    }

    _update(): void {
        // noop
        this._panel.title = "PQTest result webview";
        this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);
    }

    dispose(): void {
        PqTestResultViewPanel.currentPanel = undefined;
        this._panel.dispose();

        while (this._disposables.length) {
            const disposable: IDisposable | undefined = this._disposables.pop();

            if (disposable) {
                disposable.dispose();
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public postOneMessage(type: string, payload: any): void {
        this._panel.webview
            .postMessage({
                type,
                payload,
            })
            .then(
                (_value: unknown) => {
                    // noop
                    // todo log into the telemetry
                },
                (_reason: unknown) => {
                    // noop
                    // todo log into the telemetry
                },
            );
    }

    private _getHtmlForWebview(webview: Webview): string {
        // Get the local path to main script run in the webview, then convert it to a uri we can use in the webview.
        const scriptUri: vscode.Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, ...PqTestResultViewPanel.viewPaths, "main.js"),
        );

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->

				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				
				<title>PQTest result</title>
			</head>
			<body>
        <div id="root"></div>
				<script src="${scriptUri}"></script>
			</body>
			</html>`;
    }
}