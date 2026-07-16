UPDATE "patient_immunization"
SET "current_dose" = CASE lower(btrim("current_dose"))
	WHEN '1' THEN '1st dose'
	WHEN '1st dose' THEN '1st dose'
	WHEN '2' THEN '2nd dose'
	WHEN '2nd dose' THEN '2nd dose'
	WHEN '3' THEN '3rd dose'
	WHEN '3rd dose' THEN '3rd dose'
	WHEN '4' THEN '4th dose'
	WHEN '4th dose' THEN '4th dose'
	WHEN 'booster' THEN 'Booster'
	WHEN 'booster dose' THEN 'Booster'
	WHEN 'single dose' THEN 'Single dose'
	WHEN 'birth dose' THEN 'Birth dose'
	ELSE btrim("current_dose")
END
WHERE "current_dose" IS NOT NULL;
