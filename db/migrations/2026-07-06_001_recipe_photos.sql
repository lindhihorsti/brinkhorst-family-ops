-- Recipe thumbnails: downloaded from the source page at import time,
-- resized server-side (max 800px JPEG), served via GET /api/recipes/{id}/photo.
CREATE TABLE IF NOT EXISTS recipe_photos (
  recipe_id uuid PRIMARY KEY REFERENCES recipes(id) ON DELETE CASCADE,
  data bytea NOT NULL,
  mime text NOT NULL DEFAULT 'image/jpeg',
  created_at timestamptz NOT NULL DEFAULT now()
);
