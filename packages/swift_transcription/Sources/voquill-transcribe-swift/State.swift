import Foundation
import WhisperKit

struct TranscriptionSession {
    let model: String
    let sampleRate: Int
    let language: String?
    let initialPrompt: String?
    var samples: [Float] = []
}

struct DownloadJob {
    let id: UUID
    let model: String
    var status: String  // "pending" | "running" | "completed" | "failed"
    var bytesDownloaded: Int64
    var totalBytes: Int64
    var error: String?
}

actor SidecarState {
    var transcribers: [String: WhisperKit] = [:]
    var sessions: [UUID: TranscriptionSession] = [:]
    var downloads: [UUID: DownloadJob] = [:]
    let modelsDir: URL

    init(modelsDir: URL) {
        self.modelsDir = modelsDir
    }

    func getOrLoadTranscriber(model: String) async throws -> WhisperKit {
        if let cached = transcribers[model] {
            return cached
        }
        // For LOADING we must give WhisperKit the explicit `modelFolder` path —
        // `downloadBase` alone isn't enough (that one only matters for the download step).
        // Path matches what WhisperKit.download() writes: <base>/models/argmaxinc/whisperkit-coreml/<model>/
        let folder = modelsDir
            .appendingPathComponent("models")
            .appendingPathComponent("argmaxinc")
            .appendingPathComponent("whisperkit-coreml")
            .appendingPathComponent(model)
            .path
        let config = WhisperKitConfig(
            model: model,
            modelFolder: folder,
            verbose: false,
            logLevel: .none,
            prewarm: true,
            load: true,
            download: false
        )
        let kit = try await WhisperKit(config)
        transcribers[model] = kit
        return kit
    }

    func createSession(model: String, sampleRate: Int, language: String?, initialPrompt: String?) -> UUID {
        let id = UUID()
        sessions[id] = TranscriptionSession(
            model: model,
            sampleRate: sampleRate,
            language: language,
            initialPrompt: initialPrompt
        )
        return id
    }

    func appendChunk(sessionId: UUID, samples: [Float]) -> Bool {
        guard var session = sessions[sessionId] else { return false }
        session.samples.append(contentsOf: samples)
        sessions[sessionId] = session
        return true
    }

    func popSession(_ id: UUID) -> TranscriptionSession? {
        return sessions.removeValue(forKey: id)
    }

    func registerDownload(_ job: DownloadJob) {
        downloads[job.id] = job
    }

    func updateDownload(_ id: UUID, _ update: (inout DownloadJob) -> Void) {
        if var job = downloads[id] {
            update(&job)
            downloads[id] = job
        }
    }

    func getDownload(_ id: UUID) -> DownloadJob? {
        return downloads[id]
    }

    func removeTranscriber(_ model: String) {
        transcribers.removeValue(forKey: model)
    }
}
