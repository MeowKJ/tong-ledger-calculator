import AppKit
import Foundation
import Vision

struct OCRItem: Encodable {
  let text: String
  let confidence: Float
  let bbox: [Double]
}

struct OCRResult: Encodable {
  let image: String
  let width: Int
  let height: Int
  let items: [OCRItem]
}

let args = CommandLine.arguments
guard args.count >= 2 else {
  FileHandle.standardError.write(Data("Usage: swift scripts/vision-ocr.swift <image>\n".utf8))
  exit(2)
}

let imagePath = args[1]
let imageUrl = URL(fileURLWithPath: imagePath)
guard let nsImage = NSImage(contentsOf: imageUrl),
      let cgImage = nsImage.cgImage(forProposedRect: nil, context: nil, hints: nil)
else {
  FileHandle.standardError.write(Data("Could not load image: \(imagePath)\n".utf8))
  exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false
request.recognitionLanguages = ["zh-Hans", "en-US"]
request.minimumTextHeight = 0.005

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
try handler.perform([request])

let items = (request.results ?? []).compactMap { observation -> OCRItem? in
  guard let candidate = observation.topCandidates(1).first else { return nil }
  let box = observation.boundingBox
  let x = Double(box.origin.x * 100)
  let y = Double((1 - box.origin.y - box.height) * 100)
  let width = Double(box.width * 100)
  let height = Double(box.height * 100)
  return OCRItem(
    text: candidate.string,
    confidence: candidate.confidence,
    bbox: [
      (x * 100).rounded() / 100,
      (y * 100).rounded() / 100,
      (width * 100).rounded() / 100,
      (height * 100).rounded() / 100,
    ]
  )
}

let result = OCRResult(image: imagePath, width: cgImage.width, height: cgImage.height, items: items)
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
FileHandle.standardOutput.write(try encoder.encode(result))
