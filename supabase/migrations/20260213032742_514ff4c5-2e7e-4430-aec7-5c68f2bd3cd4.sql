
-- Add referral_code to influencer_partnerships
ALTER TABLE public.influencer_partnerships
ADD COLUMN referral_code TEXT UNIQUE;

-- Generate codes for existing rows
UPDATE public.influencer_partnerships
SET referral_code = 'INF_' || upper(substr(md5(random()::text || id::text), 1, 6))
WHERE referral_code IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE public.influencer_partnerships
ALTER COLUMN referral_code SET NOT NULL;

-- Add default for new rows
ALTER TABLE public.influencer_partnerships
ALTER COLUMN referral_code SET DEFAULT 'INF_' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
