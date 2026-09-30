import Foundation

// MARK: - Obsidian Vault Detection

/// Reads `obsidian.json` from the macOS Application Support path
/// (`~/Library/Application Support/obsidian/obsidian.json`), falling back to
/// the XDG `~/.config` location for Linux/custom setups.
/// Prefers the vault marked `"open": true`, then the most-recently-accessed vault (highest `ts`).
enum ObsidianVaultDetector {

    private struct Config: Decodable {
        struct Entry: Decodable {
            let path: String
            let ts:   Int64
            let open: Bool?
        }
        let vaults: [String: Entry]
    }

    static func detectVaultURL() -> URL? {
        let fm = FileManager.default
        let candidates: [URL] = [
            // macOS: ~/Library/Application Support/obsidian/obsidian.json
            fm.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
                .appendingPathComponent("obsidian/obsidian.json"),
            // XDG fallback (Linux / custom setups)
            URL(fileURLWithPath:
                ("~/.config/obsidian/obsidian.json" as NSString).expandingTildeInPath),
        ]
        return candidates.lazy.compactMap(bestVaultURL(in:)).first
    }

    private static func bestVaultURL(in configURL: URL) -> URL? {
        guard let data = try? Data(contentsOf: configURL),
              let cfg  = try? JSONDecoder().decode(Config.self, from: data)
        else { return nil }
        let entries = cfg.vaults.values
        guard let chosen = entries.first(where: { $0.open == true })
                        ?? entries.max(by: { $0.ts < $1.ts })
        else { return nil }
        return URL(fileURLWithPath: chosen.path)
    }
}

// MARK: - VaultExporter

/// Exports interview attempt notes as Obsidian-compatible Markdown files with YAML frontmatter.
///
/// Output layout inside the vault:
/// ```
/// <vault>/AIPrep/<QuestionTitle> - <ISO8601 date>.md
/// ```
///
/// Frontmatter fields:
/// ```yaml
/// ---
/// tags: [aiprep, interview-prep, <category>, <difficulty>]
/// category: "<category>"
/// difficulty: "<easy|medium|hard>"
/// format: "<short|concept|design>"
/// question_id: "<id>"
/// date: "YYYY-MM-DD"
/// duration_minutes: N
/// grade: "<again|hard|good|easy>"
/// grade_label: "<Missed it|Shaky|Solid|Nailed it>"
/// ---
/// ```
enum VaultExporter {

    // MARK: - Result type

    enum ExportError: LocalizedError {
        case noVaultDetected
        case fileWriteFailed(URL, any Error)

        var errorDescription: String? {
            switch self {
            case .noVaultDetected:
                return "No Obsidian vault detected. Open Obsidian at least once so AIPrep can find it."
            case .fileWriteFailed(let url, let underlying):
                return "Failed to write \(url.lastPathComponent): \(underlying.localizedDescription)"
            }
        }
    }

    // MARK: - Public API

    /// Exports a completed attempt to the detected Obsidian vault.
    ///
    /// - Parameters:
    ///   - question:   The question that was answered.
    ///   - draft:      The submitted draft (answer, scratchpad, notes).
    ///   - grade:      Self-assessment grade.
    ///   - durationSeconds: Elapsed time in seconds.
    ///   - vaultURL:   Explicit vault URL (pass from `obsidianVaultURL` env value if available);
    ///                 falls back to `ObsidianVaultDetector.detectVaultURL()`.
    ///
    /// - Returns: The relative vault-relative path of the created note (for `AttemptRecord.vaultNotePath`).
    @discardableResult
    static func exportAttempt(
        question:        Question,
        draft:           Draft,
        grade:           SelfGrade,
        durationSeconds: Int,
        vaultURL:        URL? = nil
    ) throws -> String {
        guard let vault = vaultURL ?? ObsidianVaultDetector.detectVaultURL() else {
            throw ExportError.noVaultDetected
        }

        let fm = FileManager.default
        let folder = vault.appendingPathComponent("AIPrep", isDirectory: true)
        try? fm.createDirectory(at: folder, withIntermediateDirectories: true)

        let (filename, relativePath) = notePath(for: question)
        let destination = folder.appendingPathComponent(filename)

        let markdown = buildMarkdown(
            question:        question,
            draft:           draft,
            grade:           grade,
            durationSeconds: durationSeconds)

        do {
            try markdown.write(to: destination, atomically: true, encoding: .utf8)
            print("[VaultExporter] ✅ Exported to \(destination.path)")
        } catch {
            throw ExportError.fileWriteFailed(destination, error)
        }

        return relativePath
    }

    // MARK: - Path helpers

    /// Generates a safe filename and vault-relative path for the question.
    static func notePath(for question: Question, date: Date = Date()) -> (filename: String, relative: String) {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withFullDate]
        let dateStr = formatter.string(from: date)

        let safe = safeFilename(question.title)
        let filename = "\(safe) - \(dateStr).md"
        let relative = "AIPrep/\(filename)"
        return (filename, relative)
    }

    // MARK: - Markdown generation

    private static func buildMarkdown(
        question:        Question,
        draft:           Draft,
        grade:           SelfGrade,
        durationSeconds: Int
    ) -> String {
        let dateFormatter = ISO8601DateFormatter()
        dateFormatter.formatOptions = [.withFullDate]
        let dateStr = dateFormatter.string(from: Date())

        let minutesTotal = durationSeconds / 60
        let secondsRem   = durationSeconds % 60
        let durationLabel = secondsRem > 0
            ? "\(minutesTotal)m \(secondsRem)s"
            : "\(minutesTotal)m"

        // Build YAML frontmatter
        var fm: [String] = [
            "---",
            "tags:",
            "  - aiprep",
            "  - interview-prep",
            "  - \(yamlSafeTag(question.category))",
            "  - \(question.difficulty.rawValue)",
        ]

        // Add question-level tags from the question's tag list
        for tag in question.tags {
            fm.append("  - \(yamlSafeTag(tag))")
        }

        fm += [
            "category: \"\(question.category)\"",
            "difficulty: \"\(question.difficulty.rawValue)\"",
            "format: \"\(question.format.rawValue)\"",
            "question_id: \"\(question.id)\"",
            "date: \"\(dateStr)\"",
            "duration_minutes: \(max(1, Int((Double(durationSeconds) / 60).rounded())))",
            "grade: \"\(gradeName(grade))\"",
            "grade_label: \"\(grade.label)\"",
            "---",
            "",
        ]

        // Document body
        var body: [String] = [
            "# \(question.title)",
            "",
            "> **\(question.difficulty.label)** · \(question.format.label) · ⏱ \(durationLabel) · 🎯 \(grade.label)",
            "",
            "## Prompt",
            "",
            question.prompt,
            "",
        ]

        // Answer
        let answerText = draft.answer.trimmingCharacters(in: .whitespacesAndNewlines)
        body += [
            "## My Answer",
            "",
            answerText.isEmpty ? "_No answer recorded._" : answerText,
            "",
        ]

        // Scratchpad
        let scratchText = draft.scratchpad.trimmingCharacters(in: .whitespacesAndNewlines)
        if !scratchText.isEmpty {
            body += [
                "## Scratchpad",
                "",
                scratchText,
                "",
            ]
        }

        // Notes / reflections
        let notesText = draft.notes.trimmingCharacters(in: .whitespacesAndNewlines)
        if !notesText.isEmpty {
            body += [
                "## Notes",
                "",
                notesText,
                "",
            ]
        }

        // Key points hit
        if !question.keyPoints.isEmpty {
            body += ["## Key Points Checklist", ""]
            for point in question.keyPoints {
                let hit = draft.keyPointsHit.contains(point)
                body.append("- [\(hit ? "x" : " ")] \(point)")
            }
            body.append("")
        }

        // Reference answer (hidden under a collapsed callout-style block)
        body += [
            "## Reference Answer",
            "",
            "> [!note]- Expand to reveal",
            "> ",
        ]
        for line in question.expectedAnswer.components(separatedBy: "\n") {
            body.append("> \(line)")
        }
        body.append("")

        // Follow-ups
        if !question.followUps.isEmpty {
            body += ["## Follow-up Questions", ""]
            for q in question.followUps {
                body.append("- \(q)")
            }
            body.append("")
        }

        // Sources
        if !question.sources.isEmpty {
            body += ["## Sources", ""]
            for src in question.sources {
                // Detect bare URLs vs prose references
                if src.hasPrefix("http://") || src.hasPrefix("https://") {
                    body.append("- <\(src)>")
                } else {
                    body.append("- \(src)")
                }
            }
            body.append("")
        }

        return (fm + body).joined(separator: "\n")
    }

    // MARK: - String sanitisation helpers

    /// Strips characters that are illegal in macOS filenames (`:`, `/`, `\0`, etc.)
    /// and trims to ≤128 characters so paths stay manageable.
    private static func safeFilename(_ raw: String) -> String {
        let illegal = CharacterSet(charactersIn: "/\\:*?\"<>|\u{0000}")
        let cleaned = raw.unicodeScalars
            .filter { !illegal.contains($0) }
            .map { Character($0) }
            .reduce("", { $0 + String($1) })
            .trimmingCharacters(in: .whitespacesAndNewlines)
        return String(cleaned.prefix(128))
    }

    /// Converts a string to a YAML-safe tag slug (lowercase, hyphens, no spaces).
    private static func yamlSafeTag(_ raw: String) -> String {
        raw.lowercased()
            .replacingOccurrences(of: " ", with: "-")
            .filter { $0.isLetter || $0.isNumber || $0 == "-" || $0 == "_" }
    }

    /// Returns the Swift case name for a `SelfGrade` value as a YAML-friendly string.
    private static func gradeName(_ grade: SelfGrade) -> String {
        switch grade {
        case .again: "again"
        case .hard:  "hard"
        case .good:  "good"
        case .easy:  "easy"
        }
    }
}

// MARK: - Async wrapper

extension VaultExporter {
    /// Non-blocking version: runs export on a background thread and delivers the
    /// relative path (or throws) back on the calling actor.
    static func exportAttemptAsync(
        question:        Question,
        draft:           Draft,
        grade:           SelfGrade,
        durationSeconds: Int,
        vaultURL:        URL? = nil
    ) async throws -> String {
        // Capture values before crossing actor boundary
        let q = question, d = draft, g = grade, dur = durationSeconds, v = vaultURL
        return try await Task.detached(priority: .utility) {
            try VaultExporter.exportAttempt(
                question:        q,
                draft:           d,
                grade:           g,
                durationSeconds: dur,
                vaultURL:        v)
        }.value
    }
}
