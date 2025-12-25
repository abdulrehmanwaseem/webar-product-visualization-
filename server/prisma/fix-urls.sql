-- Fix URLs from S3 API endpoint to public R2.dev URL
-- Also fix double slashes in paths

UPDATE items 
SET 
  "modelUrl" = REPLACE(
    REPLACE("modelUrl", 'https://9d118f2ac3f3b5a9019eaa9911c4ec6e.eu.r2.cloudflarestorage.com/assets/', 'https://pub-765c33c14ed64131a7a0a9d76b3d2e50.r2.dev/'),
    '//', '/'
  ),
  "usdzUrl" = CASE 
    WHEN "usdzUrl" IS NOT NULL THEN REPLACE(
      REPLACE("usdzUrl", 'https://9d118f2ac3f3b5a9019eaa9911c4ec6e.eu.r2.cloudflarestorage.com/assets/', 'https://pub-765c33c14ed64131a7a0a9d76b3d2e50.r2.dev/'),
      '//', '/'
    )
    ELSE NULL
  END,
  "thumbnailUrl" = CASE 
    WHEN "thumbnailUrl" IS NOT NULL THEN REPLACE(
      REPLACE("thumbnailUrl", 'https://9d118f2ac3f3b5a9019eaa9911c4ec6e.eu.r2.cloudflarestorage.com/assets/', 'https://pub-765c33c14ed64131a7a0a9d76b3d2e50.r2.dev/'),
      '//', '/'
    )
    ELSE NULL
  END
WHERE "modelUrl" LIKE '%r2.cloudflarestorage.com%' 
   OR "usdzUrl" LIKE '%r2.cloudflarestorage.com%'
   OR "thumbnailUrl" LIKE '%r2.cloudflarestorage.com%';

-- Also fix any URLs that already have pub- but have double slashes
UPDATE items 
SET 
  "modelUrl" = REPLACE("modelUrl", 'r2.dev//', 'r2.dev/'),
  "usdzUrl" = REPLACE("usdzUrl", 'r2.dev//', 'r2.dev/'),
  "thumbnailUrl" = REPLACE("thumbnailUrl", 'r2.dev//', 'r2.dev/')
WHERE "modelUrl" LIKE '%r2.dev//%' 
   OR "usdzUrl" LIKE '%r2.dev//%'
   OR "thumbnailUrl" LIKE '%r2.dev//%';
