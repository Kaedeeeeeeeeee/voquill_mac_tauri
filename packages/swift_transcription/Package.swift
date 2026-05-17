// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "voquill-transcribe-swift",
    platforms: [
        .macOS(.v14),
    ],
    products: [
        .executable(
            name: "voquill-transcribe-swift",
            targets: ["voquill-transcribe-swift"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/argmaxinc/WhisperKit.git", from: "0.13.0"),
        .package(url: "https://github.com/hummingbird-project/hummingbird.git", from: "2.5.0"),
    ],
    targets: [
        .executableTarget(
            name: "voquill-transcribe-swift",
            dependencies: [
                .product(name: "WhisperKit", package: "WhisperKit"),
                .product(name: "Hummingbird", package: "hummingbird"),
            ]
        ),
    ]
)
