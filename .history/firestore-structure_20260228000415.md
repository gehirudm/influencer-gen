users/{userId}
  ├── public/profile
  └── private/data

projects/{projectId}
  - userId
  - name

characters/{characterId}
  - userId
  - name
  - imageIds: [imageId1, ...]

images/{imageId}
  - userId
  - projectId
  - characterId
  - isPublic
  - metadata
  - createdAt

likes/{likeId}
  - imageId
  - userId

comments/{commentId}
  - imageId
  - userId
  - text

jobs/{jobId}
  - userId
  - prompt
  - negativePrompt
  - seed
  - status       // e.g., pending, processing, complete, failed
  - generatedImageId (nullable)
  - createdAt

loras/{loraId}
  - displayName           // Public display name
  - loraName              // Must match storage bucket filename
  - description
  - thumbnailImageId
  - displayImageIds: [imageId1, ...]
  - thumbnailUrl
  - displayImageUrls: [url1, ...]
  - createdAt
  - createdBy             // Admin userId who created
  - assignedUserId        // User ID if assigned, null if public
  - isPublic              // true if marketplace item
  - isFree                // true if free public LoRA
  - isLimitedEdition      // true if limited quantity
  - availableQuantity     // Number available (if limited)
  - purchasedCount        // Number purchased
  - price                 // Price in tokens (if paid)

user-lora-purchases/{userId}_{loraId}
  - userId
  - loraId
  - purchasedAt
  - price

character-train-requests/{requestId}
  - characterId
  - userId
  - characterName
  - characterGender
  - characterAge
  - characterBodyType
  - characterDescription
  - characterImageUrls: [url1, ...]
  - characterBaseImageUrl
  - characteristics: [{name, value}, ...]
  - status                // pending, in_progress, completed, rejected
  - loraUrl               // Filled by admin on completion
  - loraName              // Filled by admin on completion
  - loraKeyword           // Filled by admin on completion
  - adminNotes
  - requestedAt
  - completedAt
  - completedBy           // Admin userId
