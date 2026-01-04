/*
  # Add Food Safety Fields
  
  1. New Types
    - storage_type enum for storage requirements
    - packaging_type enum for packaging types  
    - food_condition enum for food condition assessment
    
  2. New Columns to food_listings
    - storage_requirements (storage_type)
    - packaging_type (packaging_type)
    - current_condition (food_condition)
    - is_perishable (boolean)
    - allergen_info (text array)
*/

-- Create storage type enum
DO $$ BEGIN
    CREATE TYPE storage_type AS ENUM (
        'refrigerated',
        'frozen',
        'room_temperature',
        'cool_dry',
        'heated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create packaging type enum
DO $$ BEGIN
    CREATE TYPE packaging_type AS ENUM (
        'sealed_original',
        'sealed_container',
        'wrapped',
        'open_container',
        'unwrapped',
        'vacuum_sealed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create food condition enum
DO $$ BEGIN
    CREATE TYPE food_condition AS ENUM (
        'excellent',
        'good',
        'fair',
        'poor',
        'unsafe'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add food safety fields to food_listings table
ALTER TABLE food_listings
ADD COLUMN IF NOT EXISTS storage_requirements storage_type DEFAULT 'room_temperature',
ADD COLUMN IF NOT EXISTS packaging_type packaging_type DEFAULT 'sealed_original',
ADD COLUMN IF NOT EXISTS current_condition food_condition DEFAULT 'good',
ADD COLUMN IF NOT EXISTS is_perishable BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS allergen_info TEXT[];