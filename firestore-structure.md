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
