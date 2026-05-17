import Foundation
import Hummingbird
import WhisperKit

func registerRoutes(router: Router<BasicRequestContext>, state: SidecarState) {
    router.get("/health") { _, _ in
        return jsonResponse(["status": "ok", "mode": "gpu"])
    }

    router.get("/v1/devices") { _, _ in
        return jsonResponse([
            ["id": "ane", "name": "Apple Neural Engine", "mode": "gpu"]
        ])
    }

    // MARK: Model management

    router.get("/v1/models/:name/status") { request, context in
        let name = try context.parameters.require("name", as: String.self)
        return jsonResponse(buildModelStatus(name: name, state: state))
    }

    router.post("/v1/models/:name/download") { _, context in
        let name = try context.parameters.require("name", as: String.self)
        let jobId = UUID()
        let job = DownloadJob(
            id: jobId,
            model: name,
            status: "pending",
            bytesDownloaded: 0,
            totalBytes: estimatedModelSize(name),
            error: nil
        )
        await state.registerDownload(job)

        // Kick off async download using WhisperKit's dedicated download API
        // (NOT the WhisperKit() constructor — that one ignores `download:true`
        // when `modelFolder` is also given and silently exits "successful").
        let modelsDir = state.modelsDir
        Task.detached {
            await state.updateDownload(jobId) { $0.status = "running" }

            do {
                let downloadedURL = try await WhisperKit.download(
                    variant: name,
                    downloadBase: modelsDir,
                    progressCallback: { progress in
                        Task {
                            await state.updateDownload(jobId) {
                                $0.bytesDownloaded = progress.completedUnitCount
                                if progress.totalUnitCount > 0 {
                                    $0.totalBytes = progress.totalUnitCount
                                }
                            }
                        }
                    }
                )
                let finalBytes = folderSize(downloadedURL)
                await state.updateDownload(jobId) {
                    $0.status = "completed"
                    $0.bytesDownloaded = finalBytes
                    if $0.totalBytes < finalBytes { $0.totalBytes = finalBytes }
                }
            } catch {
                await state.updateDownload(jobId) {
                    $0.status = "failed"
                    $0.error = "\(error)"
                }
            }
        }

        return jsonResponse(["jobId": jobId.uuidString])
    }

    router.get("/v1/models/:name/download/:jobId") { _, context in
        let jobIdStr = try context.parameters.require("jobId", as: String.self)
        guard let uuid = UUID(uuidString: jobIdStr),
              let job = await state.getDownload(uuid)
        else {
            return errorResponse(.notFound, "Unknown job")
        }
        return jsonResponse([
            "jobId": job.id.uuidString,
            "model": job.model,
            "status": job.status,
            "bytesDownloaded": job.bytesDownloaded,
            "totalBytes": job.totalBytes,
            "error": job.error as Any,
        ])
    }

    router.delete("/v1/models/:name") { _, context in
        let name = try context.parameters.require("name", as: String.self)
        let folder = modelDir(name: name, state: state)
        try? FileManager.default.removeItem(at: folder)
        await state.removeTranscriber(name)
        return jsonResponse(buildModelStatus(name: name, state: state))
    }

    // MARK: Transcription sessions

    router.post("/v1/transcriptions/sessions") { request, _ in
        struct CreateSessionBody: Decodable {
            let model: String
            let sampleRate: Int
            let language: String?
            let initialPrompt: String?
        }
        let body = try await decodeJSON(request, as: CreateSessionBody.self)
        let id = await state.createSession(
            model: body.model,
            sampleRate: body.sampleRate,
            language: body.language,
            initialPrompt: body.initialPrompt
        )
        return jsonResponse(["sessionId": id.uuidString])
    }

    router.post("/v1/transcriptions/sessions/:id/chunks") { request, context in
        let idStr = try context.parameters.require("id", as: String.self)
        guard let id = UUID(uuidString: idStr) else {
            return errorResponse(.badRequest, "Invalid session id")
        }
        // Body is raw little-endian float32 PCM samples
        var buffer = try await request.body.collect(upTo: 64 * 1024 * 1024)
        let samples = bufferToFloat32(&buffer)
        let ok = await state.appendChunk(sessionId: id, samples: samples)
        if !ok {
            return errorResponse(.notFound, "Session not found")
        }
        return jsonResponse(["receivedSamples": samples.count])
    }

    router.post("/v1/transcriptions/sessions/:id/finalize") { _, context in
        let idStr = try context.parameters.require("id", as: String.self)
        guard let id = UUID(uuidString: idStr) else {
            return errorResponse(.badRequest, "Invalid session id")
        }
        guard let session = await state.popSession(id) else {
            return errorResponse(.notFound, "Session not found")
        }

        let start = Date()
        do {
            let kit = try await state.getOrLoadTranscriber(model: session.model)
            let options = DecodingOptions(
                task: .transcribe,
                language: session.language,
                temperature: 0,
                temperatureFallbackCount: 0,
                sampleLength: 224,
                topK: 5,
                usePrefillPrompt: session.initialPrompt != nil,
                skipSpecialTokens: true,
                withoutTimestamps: true,
                clipTimestamps: [0],
                promptTokens: nil
            )
            let results = try await kit.transcribe(
                audioArray: session.samples,
                decodeOptions: options
            )
            let text = results.map { $0.text }.joined(separator: " ").trimmingCharacters(in: .whitespacesAndNewlines)
            let durationMs = Int(Date().timeIntervalSince(start) * 1000)
            return jsonResponse([
                "text": text,
                "model": session.model,
                "inferenceDevice": "ane",
                "durationMs": durationMs,
            ])
        } catch {
            return errorResponse(.internalServerError, "Transcription failed: \(error)")
        }
    }
}

// MARK: - Helpers

func jsonResponse(_ obj: Any, status: HTTPResponse.Status = .ok) -> Response {
    let data = (try? JSONSerialization.data(withJSONObject: obj, options: [])) ?? Data("{}".utf8)
    return Response(
        status: status,
        headers: [.contentType: "application/json"],
        body: .init(byteBuffer: ByteBuffer(data: data))
    )
}

func errorResponse(_ status: HTTPResponse.Status, _ message: String) -> Response {
    return jsonResponse(["error": message], status: status)
}

/// WhisperKit downloads models into a HuggingFace-style cache layout:
///   <downloadBase>/models/argmaxinc/whisperkit-coreml/<model_variant>/
/// This helper returns that path so our status / delete logic finds the bytes
/// where WhisperKit actually puts them.
func modelDir(name: String, state: SidecarState) -> URL {
    return state.modelsDir
        .appendingPathComponent("models")
        .appendingPathComponent("argmaxinc")
        .appendingPathComponent("whisperkit-coreml")
        .appendingPathComponent(name)
}

/// Build the standard model status response shape that matches what the TS
/// `local-transcription.sidecar.ts` expects (`{model, downloaded, valid,
/// fileBytes, validationError}`).
func buildModelStatus(name: String, state: SidecarState) -> [String: Any] {
    let folder = modelDir(name: name, state: state)
    let exists = FileManager.default.fileExists(atPath: folder.path)
    let size = exists ? folderSize(folder) : 0
    let downloaded = exists && size > 1_000_000
    let validationError: Any = downloaded
        ? NSNull()
        : (exists ? "Folder exists but is empty (previous download likely failed)" : NSNull())
    return [
        "model": name,
        "downloaded": downloaded,
        "valid": downloaded,
        "fileBytes": size,
        "validationError": validationError,
    ]
}

func folderSize(_ url: URL) -> Int64 {
    guard let enumerator = FileManager.default.enumerator(
        at: url,
        includingPropertiesForKeys: [.totalFileAllocatedSizeKey, .isRegularFileKey]
    ) else { return 0 }
    var total: Int64 = 0
    for case let fileURL as URL in enumerator {
        let values = try? fileURL.resourceValues(forKeys: [.totalFileAllocatedSizeKey, .isRegularFileKey])
        if values?.isRegularFile == true, let size = values?.totalFileAllocatedSize {
            total += Int64(size)
        }
    }
    return total
}

func decodeJSON<T: Decodable>(_ request: Request, as type: T.Type) async throws -> T {
    let buffer = try await request.body.collect(upTo: 1024 * 1024)
    let data = Data(buffer: buffer)
    return try JSONDecoder().decode(T.self, from: data)
}

func bufferToFloat32(_ buffer: inout ByteBuffer) -> [Float] {
    let byteCount = buffer.readableBytes
    let floatCount = byteCount / 4
    var result = [Float](repeating: 0, count: floatCount)
    _ = result.withUnsafeMutableBytes { dest in
        buffer.readWithUnsafeReadableBytes { src in
            let n = min(dest.count, src.count)
            memcpy(dest.baseAddress, src.baseAddress, n)
            return n
        }
    }
    return result
}

/// Rough lookup for known WhisperKit model sizes. Used as initial `totalBytes` hint.
/// Real bytes get overwritten when download completes.
func estimatedModelSize(_ name: String) -> Int64 {
    let lowered = name.lowercased()
    if lowered.contains("tiny") { return 75 * 1024 * 1024 }
    if lowered.contains("base") { return 145 * 1024 * 1024 }
    if lowered.contains("small") { return 480 * 1024 * 1024 }
    if lowered.contains("medium") { return 1_500 * 1024 * 1024 }
    if lowered.contains("turbo") { return 1_500 * 1024 * 1024 }
    if lowered.contains("large") { return 3_000 * 1024 * 1024 }
    return 500 * 1024 * 1024
}
