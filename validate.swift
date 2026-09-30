import Foundation
struct QuestionPack: Codable { let questions: [Question] }
struct Question: Codable { let id: String }
let data = try! Data(contentsOf: URL(fileURLWithPath: "Resources/questions.json"))
let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase
let pack = try! decoder.decode(QuestionPack.self, from: data)
print("Validated: \(pack.questions.count) questions")
