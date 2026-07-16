DELETE FROM "patient_transfer_content"
WHERE lower("content_type") IN ('encounter', 'encounters');
