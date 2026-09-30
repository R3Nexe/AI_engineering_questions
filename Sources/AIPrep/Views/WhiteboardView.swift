import SwiftUI
import WebKit

// MARK: - ExcalidrawSchemeHandler

/// Serves the excalidraw-local static build over the custom `excalidraw://` scheme.
final class ExcalidrawSchemeHandler: NSObject, WKURLSchemeHandler {

    let buildDir: URL
    init(buildDir: URL) { self.buildDir = buildDir }

    func webView(_ webView: WKWebView, start task: any WKURLSchemeTask) {
        guard let url = task.request.url else {
            task.didFailWithError(URLError(.badURL)); return
        }
        var path = url.path
        if path.isEmpty || path == "/" { path = "/index.html" }
        let fileURL = buildDir.appendingPathComponent(String(path.dropFirst()))

        guard FileManager.default.fileExists(atPath: fileURL.path),
              let data = try? Data(contentsOf: fileURL) else {
            let r = HTTPURLResponse(url: url, statusCode: 404,
                                   httpVersion: "HTTP/1.1", headerFields: nil)!
            task.didReceive(r); task.didReceive(Data()); task.didFinish()
            return
        }
        let r = HTTPURLResponse(url: url, statusCode: 200, httpVersion: "HTTP/1.1",
                                headerFields: ["Content-Type": mime(for: fileURL.pathExtension),
                                               "Content-Length": "\(data.count)"])!
        task.didReceive(r); task.didReceive(data); task.didFinish()
    }

    func webView(_ webView: WKWebView, stop task: any WKURLSchemeTask) {}

    private func mime(for ext: String) -> String {
        switch ext.lowercased() {
        case "html":         return "text/html; charset=utf-8"
        case "js", "mjs":   return "application/javascript"
        case "css":         return "text/css"
        case "json":        return "application/json"
        case "svg":         return "image/svg+xml"
        case "png":         return "image/png"
        case "woff2":       return "font/woff2"
        case "woff":        return "font/woff"
        case "ttf":         return "font/ttf"
        case "ico":         return "image/x-icon"
        case "webmanifest": return "application/manifest+json"
        default:            return "application/octet-stream"
        }
    }
}

// MARK: - WhiteboardView  (NSViewControllerRepresentable)
//
// Using NSViewControllerRepresentable instead of NSViewRepresentable is critical:
// AppKit only routes keyboard events correctly when WKWebView is the root `view`
// of an NSViewController.  A bare NSViewRepresentable wrapper doesn't fully
// participate in the responder chain, so key events fall through to the terminal.

struct WhiteboardView: NSViewControllerRepresentable {

    @Binding var scene: String?

    func makeCoordinator() -> Coordinator { Coordinator(self) }

    func makeNSViewController(context: Context) -> WhiteboardViewController {
        let vc = WhiteboardViewController()
        vc.coordinator = context.coordinator
        context.coordinator.viewController = vc
        vc.configure(buildDir: excalidrawBuildDir())
        return vc
    }

    func updateNSViewController(_ vc: WhiteboardViewController, context: Context) {
        guard let json = scene, !json.isEmpty,
              json != context.coordinator.lastKnownScene,
              let wv = vc.webView else { return }
        context.coordinator.push(json: json, into: wv)
    }

    // MARK: - Build dir resolution

    static func excalidrawBuildDir() -> URL? {
        let candidates: [URL] = [
            URL(fileURLWithPath: ProcessInfo.processInfo.arguments[0])
                .deletingLastPathComponent()
                .appendingPathComponent("Resources/excalidraw-local/excalidraw-app/build"),
            URL(fileURLWithPath: #filePath)
                .deletingLastPathComponent()
                .deletingLastPathComponent()
                .deletingLastPathComponent()
                .deletingLastPathComponent()
                .appendingPathComponent("Resources/excalidraw-local/excalidraw-app/build"),
        ]
        return candidates.first {
            FileManager.default.fileExists(atPath: $0.appendingPathComponent("index.html").path)
        }
    }

    func excalidrawBuildDir() -> URL? { Self.excalidrawBuildDir() }

    // MARK: - Coordinator

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {

        var parent: WhiteboardView
        var lastKnownScene: String = ""
        var isReady = false
        weak var viewController: WhiteboardViewController?

        init(_ parent: WhiteboardView) { self.parent = parent }

        func push(json: String, into webView: WKWebView) {
            guard isReady else { return }
            lastKnownScene = json
            guard let data = try? JSONSerialization.data(withJSONObject: json),
                  let str  = String(data: data, encoding: .utf8) else { return }
            webView.evaluateJavaScript("window.loadScene && window.loadScene(\(str))") { _, err in
                if let err { print("[Whiteboard] loadScene error: \(err)") }
            }
        }

        // MARK: WKScriptMessageHandler
        func userContentController(_ ucc: WKUserContentController,
                                   didReceive message: WKScriptMessage) {
            switch message.name {
            case "log":
                print("[JS] \(message.body)")

            case "sceneChanged":
                guard let json = message.body as? String else { return }
                lastKnownScene = json
                DispatchQueue.main.async { self.parent.scene = json }

            case "ready":
                print("[Whiteboard] Excalidraw ready ✓")
                isReady = true
                DispatchQueue.main.async {
                    self.viewController?.claimFocus()
                }
                if let json = parent.scene, !json.isEmpty,
                   let wv = viewController?.webView {
                    push(json: json, into: wv)
                }

            default: break
            }
        }

        // MARK: WKNavigationDelegate
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            print("[Whiteboard] page loaded: \(webView.url?.absoluteString ?? "-")")
        }
        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError e: Error) {
            print("[Whiteboard] nav failed: \(e)")
        }
        func webView(_ webView: WKWebView, didFailProvisionalNavigation _: WKNavigation!, withError e: Error) {
            print("[Whiteboard] provisional nav failed: \(e)")
        }
    }
}

// MARK: - WhiteboardViewController

/// Hosts the WKWebView as its root view.  Being an NSViewController is what lets
/// AppKit properly route keyboard events into the web content.
final class WhiteboardViewController: NSViewController {

    var webView: WKWebView?
    weak var coordinator: WhiteboardView.Coordinator?

    override func loadView() {
        // Placeholder; replaced in configure().
        view = NSView()
    }

    func configure(buildDir: URL?) {
        let config = WKWebViewConfiguration()

        if let dir = buildDir {
            config.setURLSchemeHandler(ExcalidrawSchemeHandler(buildDir: dir),
                                       forURLScheme: "excalidraw")
        }

        let ucc = config.userContentController
        if let c = coordinator {
            ucc.add(c, name: "log")
            ucc.add(c, name: "sceneChanged")
            ucc.add(c, name: "ready")
        }

        // Bridge + console relay injected after page load so React has mounted.
        ucc.addUserScript(WKUserScript(source: bridgeScript,
                                       injectionTime: .atDocumentEnd,
                                       forMainFrameOnly: true))

        let wv = WKWebView(frame: .zero, configuration: config)
        wv.navigationDelegate = coordinator
        wv.autoresizingMask = [.width, .height]
        webView = wv

        // Replace placeholder
        view = wv

        if buildDir != nil {
            wv.load(URLRequest(url: URL(string: "excalidraw://localhost/")!))
        } else {
            wv.loadHTMLString(errorHTML, baseURL: nil)
        }
    }

    /// Give the web view (and its internal content view) keyboard focus.
    func claimFocus() {
        guard let wv = webView else { return }
        // Find WKContentView — the private NSView subclass that is the real
        // NSTextInputClient inside WKWebView.
        let target = wkContentView(in: wv) ?? wv
        view.window?.makeFirstResponder(target)
    }

    override func viewDidAppear() {
        super.viewDidAppear()
        claimFocus()
    }

    // MARK: - Helpers

    private func wkContentView(in view: NSView) -> NSView? {
        for sub in view.subviews {
            if String(describing: type(of: sub)).hasPrefix("WKContent") { return sub }
            if let found = wkContentView(in: sub) { return found }
        }
        return nil
    }

    private var errorHTML: String {
        """
        <html><body style='font-family:system-ui;padding:2em;color:#c00'>
        <h2>⚠️ Excalidraw build not found</h2>
        <p>Run: <code>cd Resources/excalidraw-local && yarn install && yarn build</code></p>
        </body></html>
        """
    }

    // MARK: - JS Bridge

    /// Injected after page load.  Uses MutationObserver to detect when Excalidraw
    /// mounts its canvas, then pulls the API out of the React fiber tree.
    private var bridgeScript: String { """
    (function () {
        // Relay console to Swift for debugging
        ['log','warn','error'].forEach(function(lvl) {
            var orig = console[lvl].bind(console);
            console[lvl] = function() {
                var msg = Array.from(arguments).join(' ');
                window.webkit?.messageHandlers?.log?.postMessage(lvl.toUpperCase() + ': ' + msg);
                orig.apply(console, arguments);
            };
        });

        // Pull the Excalidraw API out of the React fiber attached to the canvas element.
        function apiFromFiber(el) {
            if (!el) return null;
            var key = Object.keys(el).find(function(k) {
                return k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance');
            });
            if (!key) return null;
            var fiber = el[key];
            while (fiber) {
                var api = fiber.pendingProps?.excalidrawAPI
                       || fiber.memoizedProps?.excalidrawAPI;
                if (api && typeof api.getSceneElements === 'function') return api;
                // Also check stateNode for class components
                var sn = fiber.stateNode;
                if (sn && typeof sn.getSceneElements === 'function') return sn;
                fiber = fiber.return;
            }
            return null;
        }

        var _api = null;

        function wire(api) {
            _api = api;
            window.loadScene = function(json) {
                try {
                    var d = JSON.parse(json);
                    _api.updateScene({ elements: d.elements || [] });
                    return true;
                } catch(e) { return false; }
            };
            window.getScene = function() {
                try {
                    return JSON.stringify({
                        elements: _api.getSceneElements(),
                        appState: _api.getAppState(),
                        files:    _api.getFiles()
                    });
                } catch(e) { return '{}'; }
            };
            window.clearScene = function() {
                _api.resetScene();
                window.webkit?.messageHandlers?.sceneChanged?.postMessage('{}');
            };
            window.webkit?.messageHandlers?.ready?.postMessage('ready');
        }

        // Watch for the Excalidraw canvas to appear in the DOM, then extract the API.
        var observer = new MutationObserver(function() {
            if (_api) return;
            var canvas = document.querySelector('.excalidraw__canvas, canvas[data-id]');
            if (!canvas) {
                // Also try any canvas inside the excalidraw container
                var container = document.querySelector('.excalidraw');
                canvas = container && container.querySelector('canvas');
            }
            if (!canvas) return;
            var api = apiFromFiber(canvas);
            if (api) {
                observer.disconnect();
                wire(api);
            }
        });
        observer.observe(document.body || document.documentElement,
                         { childList: true, subtree: true });

        // Fallback: also watch for excalidraw's own exported API object
        var pollTries = 0;
        function poll() {
            if (_api) return;
            // Some builds expose this on window
            var api = window.ExcalidrawLib?.Excalidraw
                    || window.__EXCALIDRAW_API__;
            if (api && typeof api.getSceneElements === 'function') {
                wire(api);
                return;
            }
            if (pollTries++ < 300) setTimeout(poll, 100);
            else window.webkit?.messageHandlers?.log?.postMessage(
                'ERROR: Excalidraw API not found after 30s — scene save/load disabled');
        }
        poll();
    })();
    """ }
}

// MARK: - Previews
#if DEBUG
struct WhiteboardView_Previews: PreviewProvider {
    @State static var scene: String? = nil
    static var previews: some View {
        WhiteboardView(scene: $scene).frame(width: 800, height: 600)
    }
}
#endif
