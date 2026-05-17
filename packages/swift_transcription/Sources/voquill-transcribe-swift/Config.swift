import Foundation

struct Config {
    let host: String
    let port: Int
    let modelsDir: URL

    static func fromEnv() -> Config {
        let host = ProcessInfo.processInfo.environment["VOQUILL_TRANSCRIPTION_HOST"] ?? "127.0.0.1"
        let port = Int(ProcessInfo.processInfo.environment["VOQUILL_TRANSCRIPTION_PORT"] ?? "0") ?? 0

        let modelsDirPath: String
        if let envDir = ProcessInfo.processInfo.environment["VOQUILL_TRANSCRIPTION_MODELS_DIR"] {
            modelsDirPath = envDir
        } else {
            let appSupport = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).first!
            modelsDirPath = appSupport
                .appendingPathComponent("com.voquill.desktop")
                .appendingPathComponent("whisperkit-models")
                .path
        }
        let modelsDir = URL(fileURLWithPath: modelsDirPath)
        try? FileManager.default.createDirectory(at: modelsDir, withIntermediateDirectories: true)

        return Config(host: host, port: port, modelsDir: modelsDir)
    }
}
