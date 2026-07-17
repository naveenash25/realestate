-- Add Property wizard: listing details, configuration, and per-property
-- ownership documents (distinct from owners.id_document_url).

CREATE TYPE listing_type AS ENUM ('sale', 'rent');
CREATE TYPE listed_by_type AS ENUM ('individual', 'builder');
CREATE TYPE document_type AS ENUM ('ownership_deed', 'encumbrance_certificate', 'identity_proof', 'tax_receipt');
CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');

ALTER TABLE properties
  ADD COLUMN listing_type listing_type NOT NULL DEFAULT 'sale',
  ADD COLUMN listed_by    listed_by_type NOT NULL DEFAULT 'individual',
  ADD COLUMN bedrooms     INT,
  ADD COLUMN bathrooms    INT,
  ADD COLUMN area_sqft    NUMERIC(10,2),
  ADD COLUMN project_name TEXT;

ALTER TABLE properties ADD CONSTRAINT chk_bedrooms  CHECK (bedrooms  IS NULL OR bedrooms  >= 0);
ALTER TABLE properties ADD CONSTRAINT chk_bathrooms CHECK (bathrooms IS NULL OR bathrooms >= 0);
ALTER TABLE properties ADD CONSTRAINT chk_area_sqft CHECK (area_sqft IS NULL OR area_sqft >= 0);

-- Per-property ownership documents uploaded during the Add Property wizard's
-- Documents step. file_path is a private GCS object path, never a public URL —
-- reads go through a freshly-minted short-lived signed URL (see UploadService).
CREATE TABLE property_documents (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id   UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  type          document_type NOT NULL,
  file_path     TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type     TEXT NOT NULL,
  size_bytes    INT NOT NULL,
  status        document_status NOT NULL DEFAULT 'pending',
  verified_at   TIMESTAMPTZ,
  verified_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_property_documents_property ON property_documents (property_id);
-- One row per document type per property; re-upload is an UPSERT.
CREATE UNIQUE INDEX uq_property_documents_property_type ON property_documents (property_id, type);
