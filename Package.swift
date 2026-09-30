// swift-tools-version:6.0
import PackageDescription

let package = Package(
    name: "AIPrep",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(
            name: "AIPrep",
            path: "Sources/AIPrep",
            swiftSettings: [.swiftLanguageMode(.v5)],
            linkerSettings: [
                .linkedFramework("WebKit"),
                .linkedFramework("Speech"),
                .linkedFramework("AVFoundation"),
                .linkedFramework("UserNotifications"),
            ]
        )
    ]
)
