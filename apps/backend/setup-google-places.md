# Google Places API Setup Guide

## Step 1: Enable the New Places API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to "APIs & Services" → "Library"
4. Search for and enable these APIs:
   - **Places API (New)** ⭐ **IMPORTANT - This is the new one!**
   - ~~Places API~~ (Legacy - being deprecated)
   - Geocoding API (optional)
   - Maps JavaScript API (optional for maps)

## Step 2: API Key Configuration

Your API key is already configured: `AIzaSyCwN9nJzc2dSlCONQ-Bsd1pdRjGF9kaXSI`

### For Development:
- Application restrictions: "None"
- API restrictions: Select "Restrict key" and choose:
  - Places API (New)
  - Geocoding API
  - Maps JavaScript API

### For Production:
- Application restrictions: "Android apps" and "iOS apps"
- Add bundle IDs: `com.chickentinder.app`

## Step 3: Test Your Setup

Run this command to test:
```bash
npx tsx test-google-api.ts
```

## What's Different in the New API?

### Old API (Deprecated):
```
GET /maps/api/place/nearbysearch/json
```

### New API (Current):
```
POST /places/googleapis.com/v1/places:searchText
```

## Pricing

- **Places API (New)**: $32 per 1,000 requests
- **Free Tier**: $200/month credit (≈6,250 searches)
- **Photos**: $7 per 1,000 requests

## Your Implementation

Your code now:
✅ Uses the new Places API (New) as primary method
✅ Falls back to legacy API if new one fails
✅ Handles both response formats
✅ Caches results in database for cost optimization
✅ Enhanced photo URLs for both API versions

## Common Issues

### 403 Error: "REQUEST_DENIED"
- Make sure "Places API (New)" is enabled
- Check API key restrictions
- Verify billing is enabled

### Empty Results
- Check your location coordinates
- Verify radius isn't too small
- Ensure there are restaurants in the area 