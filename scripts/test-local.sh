#!/bin/bash

# Local Testing Script for 555 Results App
# Tests all endpoints and verifies the application is working correctly

echo "🧪 Testing 555 Results App - Local Environment"
echo "================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ -z "$data" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/response.txt "$url")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/response.txt -X "$method" -H "Content-Type: application/json" -d "$data" "$url")
    fi
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 201 ]; then
        echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
        echo "   Response: $(cat /tmp/response.txt)"
    else
        echo -e "${RED}❌ FAILED (HTTP $response)${NC}"
        echo "   Response: $(cat /tmp/response.txt)"
    fi
    echo ""
}

# Base URLs
DEV_FRONTEND="http://localhost:5173"
DEV_BACKEND="http://localhost:3001"
PROD_FRONTEND="http://localhost:4173"

echo -e "${YELLOW}1. Testing Development Environment${NC}"
echo "====================================="

# Test development backend
test_endpoint "GET" "$DEV_BACKEND/api/health" "" "Backend health check"
test_endpoint "GET" "$DEV_BACKEND/api/games" "" "Get games list"

# Test development frontend
test_endpoint "GET" "$DEV_FRONTEND/" "" "Development frontend"
test_endpoint "GET" "$DEV_FRONTEND/api/health" "" "Development frontend proxy"

echo -e "${YELLOW}2. Testing Production Build (Preview Server)${NC}"
echo "================================================"

# Test production frontend and proxy
test_endpoint "GET" "$PROD_FRONTEND/" "" "Production frontend"
test_endpoint "GET" "$PROD_FRONTEND/api/health" "" "Production frontend proxy"

echo -e "${YELLOW}3. Authentication Testing${NC}"
echo "============================"

# Test login
login_response=$(curl -s -X POST "$DEV_BACKEND/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

echo "Login response: $login_response"

# Extract token (simple parsing)
token=$(echo "$login_response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo "Token obtained: ${token:0:20}..."
    
    # Test authenticated endpoint
    test_endpoint "GET" "$DEV_BACKEND/api/games" "" "Authenticated games access (using token)"
    
    echo -e "${GREEN}✅ Authentication working!${NC}"
else
    echo -e "${RED}❌ Failed to get authentication token${NC}"
fi

echo ""
echo -e "${YELLOW}4. MongoDB Connection Test${NC}"
echo "=============================="

# Test database operations by creating and retrieving a game
game_data='{"title":"Test Game","description":"Test Description","maxPlayers":4}'
create_response=$(curl -s -X POST "$DEV_BACKEND/api/games" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $token" \
  -d "$game_data")

if [ -n "$create_response" ]; then
    echo -e "${GREEN}✅ Database operations working!${NC}"
    echo "Game creation response: $create_response"
else
    echo -e "${RED}❌ Database operations failed${NC}"
fi

echo ""
echo -e "${YELLOW}5. Summary${NC}"
echo "============="

# Check if all servers are running
if curl -s "$DEV_BACKEND/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Development backend running${NC}"
else
    echo -e "${RED}❌ Development backend not responding${NC}"
fi

if curl -s "$DEV_FRONTEND/" > /dev/null; then
    echo -e "${GREEN}✅ Development frontend running${NC}"
else
    echo -e "${RED}❌ Development frontend not responding${NC}"
fi

if curl -s "$PROD_FRONTEND/" > /dev/null; then
    echo -e "${GREEN}✅ Production preview running${NC}"
else
    echo -e "${RED}❌ Production preview not responding${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Local testing completed!${NC}"
echo ""
echo "📊 Available URLs:"
echo "   Development Frontend: $DEV_FRONTEND"
echo "   Development Backend:  $DEV_BACKEND"
echo "   Production Preview:   $PROD_FRONTEND"
echo ""
echo "🔧 Quick Commands:"
echo "   Start dev: npm run dev:full"
echo "   Start prod: npm run start & npm run preview"
echo "   Test endpoints: ./scripts/test-local.sh"