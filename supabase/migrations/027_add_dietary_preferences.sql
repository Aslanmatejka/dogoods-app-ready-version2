-- Add dietary preferences and restrictions to users and food_listings tables

-- Add dietary preference fields to users table
ALTER TABLE users 
    ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[], -- Array of dietary restrictions
    ADD COLUMN IF NOT EXISTS allergies TEXT[], -- Array of allergies
    ADD COLUMN IF NOT EXISTS dietary_preferences TEXT[], -- Array of dietary preferences
    ADD COLUMN IF NOT EXISTS preferred_categories TEXT[]; -- Preferred food categories

-- Add dietary information to food_listings table
ALTER TABLE food_listings
    ADD COLUMN IF NOT EXISTS dietary_tags TEXT[], -- Tags like 'vegetarian', 'gluten-free', etc.
    ADD COLUMN IF NOT EXISTS allergens TEXT[], -- Known allergens in the food
    ADD COLUMN IF NOT EXISTS ingredients TEXT; -- List of ingredients

-- Create index for dietary restrictions for faster queries
CREATE INDEX IF NOT EXISTS idx_users_dietary_restrictions ON users USING GIN (dietary_restrictions);
CREATE INDEX IF NOT EXISTS idx_users_allergies ON users USING GIN (allergies);
CREATE INDEX IF NOT EXISTS idx_food_dietary_tags ON food_listings USING GIN (dietary_tags);
CREATE INDEX IF NOT EXISTS idx_food_allergens ON food_listings USING GIN (allergens);

-- Add comments for documentation
COMMENT ON COLUMN users.dietary_restrictions IS 'User dietary restrictions (vegetarian, vegan, halal, kosher, etc.)';
COMMENT ON COLUMN users.allergies IS 'User food allergies (nuts, dairy, gluten, shellfish, etc.)';
COMMENT ON COLUMN users.dietary_preferences IS 'User dietary preferences and goals';
COMMENT ON COLUMN users.preferred_categories IS 'Preferred food categories for personalized recommendations';
COMMENT ON COLUMN food_listings.dietary_tags IS 'Dietary tags for the food (vegetarian, vegan, gluten-free, etc.)';
COMMENT ON COLUMN food_listings.allergens IS 'Known allergens present in the food';
COMMENT ON COLUMN food_listings.ingredients IS 'Detailed ingredient list';

-- Create a helper function to check dietary compatibility
CREATE OR REPLACE FUNCTION check_dietary_compatibility(
    user_restrictions TEXT[],
    user_allergies TEXT[],
    food_tags TEXT[],
    food_allergens TEXT[]
)
RETURNS JSONB AS $$
DECLARE
    is_compatible BOOLEAN := TRUE;
    compatibility_score INTEGER := 100;
    warnings TEXT[] := ARRAY[]::TEXT[];
    incompatible_items TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check if food contains any user allergens
    IF user_allergies IS NOT NULL AND food_allergens IS NOT NULL THEN
        SELECT ARRAY_AGG(allergen)
        INTO incompatible_items
        FROM UNNEST(user_allergies) allergen
        WHERE allergen = ANY(food_allergens);
        
        IF ARRAY_LENGTH(incompatible_items, 1) > 0 THEN
            is_compatible := FALSE;
            compatibility_score := 0;
            warnings := ARRAY_APPEND(warnings, 'Contains allergens: ' || ARRAY_TO_STRING(incompatible_items, ', '));
        END IF;
    END IF;
    
    -- Check dietary restrictions compatibility
    IF is_compatible AND user_restrictions IS NOT NULL THEN
        -- Check if food meets dietary restrictions
        -- For example, if user is vegetarian, food should be tagged as vegetarian
        IF 'vegetarian' = ANY(user_restrictions) AND NOT ('vegetarian' = ANY(food_tags) OR 'vegan' = ANY(food_tags)) THEN
            compatibility_score := compatibility_score - 50;
            warnings := ARRAY_APPEND(warnings, 'May not meet vegetarian requirements');
        END IF;
        
        IF 'vegan' = ANY(user_restrictions) AND NOT 'vegan' = ANY(food_tags) THEN
            compatibility_score := compatibility_score - 50;
            warnings := ARRAY_APPEND(warnings, 'May not meet vegan requirements');
        END IF;
        
        IF 'gluten-free' = ANY(user_restrictions) AND NOT 'gluten-free' = ANY(food_tags) THEN
            compatibility_score := compatibility_score - 30;
            warnings := ARRAY_APPEND(warnings, 'May contain gluten');
        END IF;
        
        IF 'halal' = ANY(user_restrictions) AND NOT 'halal' = ANY(food_tags) THEN
            compatibility_score := compatibility_score - 40;
            warnings := ARRAY_APPEND(warnings, 'May not be halal certified');
        END IF;
        
        IF 'kosher' = ANY(user_restrictions) AND NOT 'kosher' = ANY(food_tags) THEN
            compatibility_score := compatibility_score - 40;
            warnings := ARRAY_APPEND(warnings, 'May not be kosher certified');
        END IF;
    END IF;
    
    RETURN jsonb_build_object(
        'compatible', is_compatible,
        'score', compatibility_score,
        'warnings', warnings,
        'allergen_conflicts', COALESCE(incompatible_items, ARRAY[]::TEXT[])
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create a view for dietary-compatible food listings per user
CREATE OR REPLACE VIEW user_compatible_food AS
SELECT 
    u.id as user_id,
    fl.id as listing_id,
    fl.*,
    check_dietary_compatibility(
        u.dietary_restrictions,
        u.allergies,
        fl.dietary_tags,
        fl.allergens
    ) as compatibility_info
FROM users u
CROSS JOIN food_listings fl
WHERE fl.status = 'active';

-- Add comment
COMMENT ON VIEW user_compatible_food IS 'Shows all active food listings with dietary compatibility information for each user';
