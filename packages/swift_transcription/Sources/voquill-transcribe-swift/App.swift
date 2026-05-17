import Foundation
import Hummingbird

@main
struct VoquillTranscribeSwift {
    static func main() async throws {
        let config = Config.fromEnv()
        let state = SidecarState(modelsDir: config.modelsDir)

        let router = Router()
        // Allow any origin — we only bind localhost, so external requests can't
        // reach us anyway. The Tauri webview makes cross-origin requests from
        // tauri://localhost (or custom scheme), so we need CORS headers on every
        // response including the preflight OPTIONS.
        router.add(middleware: CORSMiddleware(
            allowOrigin: .all,
            allowHeaders: [.contentType, .authorization, .accept],
            allowMethods: [.get, .post, .delete, .options],
            allowCredentials: false,
            maxAge: .seconds(3600)
        ))
        registerRoutes(router: router, state: state)

        let app = Application(
            router: router,
            configuration: ApplicationConfiguration(
                address: .hostname(config.host, port: config.port)
            ),
            onServerRunning: { channel in
                if let port = channel.localAddress?.port {
                    // Parent process (Tauri sidecar) reads this line to learn the port.
                    FileHandle.standardOutput.write(
                        "VOQUILL_TRANSCRIPTION_BOUND_PORT=\(port)\n".data(using: .utf8)!
                    )
                }
            }
        )

        try await app.runService()
    }
}
