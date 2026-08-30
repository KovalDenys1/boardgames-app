-- Acquisition attribution: where the visitor came from when the account was created.
-- Nullable; written once at creation (guest, e-mail registration, OAuth). Never updated.
ALTER TABLE "Users" ADD COLUMN "signupSource" VARCHAR(120);
