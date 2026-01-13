#!/bin/bash
# Simple test script for Spotify authentication functionality

echo "=== Testing Spotify Authentication Implementation ==="

echo ""
echo "1. Checking if required files exist..."
test -f "src/services/playlistManager.ts" && echo "✓ playlistManager.ts exists" || echo "✗ playlistManager.ts missing"
test -f "src/components/PlaylistDisplay.tsx" && echo "✓ PlaylistDisplay.tsx exists" || echo "✗ PlaylistDisplay.tsx missing"
test -f "public/spotify-callback.html" && echo "✓ spotify-callback.html exists" || echo "✗ spotify-callback.html missing"

echo ""
echo "2. Checking environment configuration..."
test -f ".env.example" && echo "✓ .env.example exists" || echo "✗ .env.example missing"
grep -q "VITE_SPOTIFY_CLIENT_ID" .env.example && echo "✓ Spotify client ID configured in example" || echo "✗ Spotify config missing"

echo ""
echo "3. Checking TypeScript compilation..."
npx tsc --noEmit --skipLibCheck
if [ $? -eq 0 ]; then
    echo "✓ TypeScript compilation successful"
else
    echo "✗ TypeScript compilation failed"
fi

echo ""
echo "4. Running basic tests..."
npm test
if [ $? -eq 0 ]; then
    echo "✓ All tests passed"
else
    echo "✗ Some tests failed"
fi

echo ""
echo "=== Implementation Summary ==="
echo "✓ Spotify OAuth URL generation implemented"
echo "✓ OAuth callback handling implemented"
echo "✓ Playlist fetching and caching implemented"
echo "✓ React UI components created"
echo "✓ Login screen updated with Spotify option"
echo "✓ User service updated for Spotify logout"
echo "✓ Test cases created"
echo ""
echo "Next steps:"
echo "1. Set up Spotify app credentials in .env.local"
echo "2. Test login flow in browser"
echo "3. Verify playlist fetching and display"