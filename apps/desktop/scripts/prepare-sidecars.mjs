#!/usr/bin/env node

// No-op sidecar prep.
//
// We previously staged the Swift `voquill-transcribe-swift` WhisperKit sidecar
// here. Local on-device transcription is currently disabled in the UI — the
// app uses Voquill Cloud / API providers exclusively. The Swift package at
// `packages/swift_transcription/` is kept around for future revival, but does
// not get built into the released app.
