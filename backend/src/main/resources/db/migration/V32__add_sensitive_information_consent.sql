ALTER TABLE user_consent_agreements
    ADD COLUMN sensitive_info_agreed BOOLEAN NOT NULL DEFAULT FALSE AFTER privacy_version;
