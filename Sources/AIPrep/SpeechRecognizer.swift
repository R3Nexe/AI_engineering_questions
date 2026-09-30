import Foundation
import Speech
import AVFoundation

// MARK: - SpeechRecognizer

/// Live speech-to-text transcription backed by `SFSpeechRecognizer`.
///
/// ## Lifecycle
/// ```swift
/// let sr = SpeechRecognizer()
/// await sr.requestAuthorization()   // once; shows OS permission dialog
/// try sr.start()                    // streams into `transcript`
/// sr.stop()                         // freezes transcript
/// try sr.appendAndRestart()         // continues after an auto-stop
/// ```
///
/// All mutations are dispatched on `@MainActor` so `@Published` properties
/// can be consumed directly by SwiftUI views.
@MainActor
final class SpeechRecognizer: ObservableObject {

    // MARK: - Published state

    /// Accumulated live transcription.  Grows as speech is recognized;
    /// frozen when `stop()` is called.
    @Published private(set) var transcript: String = ""

    /// `true` while the audio engine is running and producing input.
    @Published private(set) var isRecording: Bool = false

    /// Current OS-level authorization for speech recognition.
    @Published private(set) var authStatus: SFSpeechRecognizerAuthorizationStatus = .notDetermined

    // MARK: - Private

    private let recognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask:    SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    /// Text accumulated from previous sessions; prepended to new results in
    /// `appendAndRestart()`.
    private var baseTranscript = ""

    // MARK: - Init

    /// - Parameter locale: The locale used to initialize `SFSpeechRecognizer`.
    ///   Defaults to the current system locale.
    init(locale: Locale = .current) {
        recognizer = SFSpeechRecognizer(locale: locale)
    }

    // MARK: - Authorization

    /// Request speech-recognition permission from the OS.
    /// Idempotent: subsequent calls return quickly if already decided.
    func requestAuthorization() async {
        print("[SpeechRecognizer] requestAuthorization() called — current status: \(authStatus.rawValue)")
        let status = await withCheckedContinuation { (cont: CheckedContinuation<SFSpeechRecognizerAuthorizationStatus, Never>) in
            SFSpeechRecognizer.requestAuthorization { cont.resume(returning: $0) }
        }
        print("[SpeechRecognizer] authorization result: \(status.rawValue)")
        authStatus = status
    }

    // MARK: - Recording

    /// Begin streaming recognition.
    ///
    /// - Throws: `SpeechError.notAuthorized` if permission has not been granted.
    /// - Throws: `SpeechError.recognizerUnavailable` if the recognizer is offline
    ///   or unsupported for the current locale.
    /// - Throws: Any `AVAudioEngine` error if the hardware cannot be started.
    func start() throws {
        guard authStatus == .authorized else { throw SpeechError.notAuthorized }
        guard let recognizer, recognizer.isAvailable else { throw SpeechError.recognizerUnavailable }
        guard !isRecording else { return }

        // Cancel any leftover task from a prior session.
        recognitionTask?.cancel()
        recognitionTask = nil

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true
        // Prefer on-device when available (no network dependency).
        if #available(macOS 10.15, *) {
            request.requiresOnDeviceRecognition = false
        }
        recognitionRequest = request

        // Tap the microphone input and feed it to the recognition request.
        let inputNode = audioEngine.inputNode
        let fmt = inputNode.outputFormat(forBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: fmt) { [weak request] buf, _ in
            request?.append(buf)
        }

        audioEngine.prepare()
        try audioEngine.start()

        let base = baseTranscript  // capture locally to avoid @MainActor capture

        recognitionTask = recognizer.recognitionTask(with: request) { [weak self] result, error in
            guard let self else { return }

            if let result {
                let fresh = result.bestTranscription.formattedString
                let full  = base.isEmpty ? fresh : base + " " + fresh
                Task { @MainActor in self.transcript = full }
            }

            if error != nil || (result?.isFinal ?? false) {
                Task { @MainActor in self.stopEngine() }
            }
        }

        isRecording = true
    }

    /// Stop streaming and freeze the current transcript.
    func stop() {
        stopEngine()
    }

    /// Freeze the current transcript, then start a new session that appends
    /// to it.  Useful when the recognizer auto-stops after a long pause.
    ///
    /// - Throws: Same errors as `start()`.
    func appendAndRestart() throws {
        baseTranscript = transcript
        stopEngine()
        try start()
    }

    /// Reset transcript and stop any active session.
    func clear() {
        stopEngine()
        transcript     = ""
        baseTranscript = ""
    }

    // MARK: - Private helpers

    private func stopEngine() {
        guard audioEngine.isRunning else { return }
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask  = nil
        isRecording      = false
    }

    // MARK: - Errors

    enum SpeechError: LocalizedError {
        case notAuthorized
        case recognizerUnavailable

        var errorDescription: String? {
            switch self {
            case .notAuthorized:
                return "Speech recognition permission has not been granted. " +
                       "Enable it in System Settings → Privacy & Security → Speech Recognition."
            case .recognizerUnavailable:
                return "Speech recognizer is unavailable for the current locale or device."
            }
        }
    }
}
