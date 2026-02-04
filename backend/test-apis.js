// Test script to verify all APIs are working
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const API_BASE_URL = 'http://localhost:3001/api';

// Color codes for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    reset: '\x1b[0m'
};

async function testAPIs() {
    console.log('\n🧪 Testing BharatTrip AI APIs...\n');

    // Test 1: Health Check
    try {
        console.log('1️⃣ Testing Health Check...');
        const health = await axios.get(`${API_BASE_URL}/health`);
        console.log(`${colors.green}✓ Health Check: ${health.data.message}${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Health Check Failed${colors.reset}\n`);
    }

    // Test 2: Chatbot
    try {
        console.log('2️⃣ Testing AI Chatbot...');
        const chatResponse = await axios.post(`${API_BASE_URL}/chatbot`, {
            message: "What are the top 3 places to visit in Delhi?",
            language: "en"
        });
        console.log(`${colors.green}✓ Chatbot Response: ${chatResponse.data.reply.substring(0, 100)}...${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Chatbot Failed: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}  Check your OpenAI API key in .env${colors.reset}\n`);
    }

    // Test 3: Weather
    try {
        console.log('3️⃣ Testing Weather API...');
        const weather = await axios.get(`${API_BASE_URL}/weather/Delhi`);
        console.log(`${colors.green}✓ Weather: ${weather.data.current.name} - ${weather.data.current.main.temp}°C${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Weather API Failed: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}  Check your OpenWeatherMap API key in .env${colors.reset}\n`);
    }

    // Test 4: Geocoding
    try {
        console.log('4️⃣ Testing Geocoding...');
        const geocode = await axios.get(`${API_BASE_URL}/geocode/Taj Mahal Agra`);
        console.log(`${colors.green}✓ Geocoding: Found ${geocode.data.formatted_address}${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Geocoding Failed: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}  Check your Google Maps API key in .env${colors.reset}\n`);
    }

    // Test 5: Places Search
    try{
        console.log('5️⃣ Testing Places Search...');
        const places = await axios.post(`${API_BASE_URL}/places/search`, {
            query: "restaurants in Mumbai",
            location: { lat: 19.0760, lng: 72.8777 },
            radius: 5000
        });
        console.log(`${colors.green}✓ Places: Found ${places.data.places.length} restaurants${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Places Search Failed: ${error.message}${colors.reset}`);
        console.log(`${colors.yellow}  Ensure Places API is enabled in Google Cloud Console${colors.reset}\n`);
    }

    // Test 6: Trip Planning
    try {
        console.log('6️⃣ Testing Trip Planning AI...');
        const trip = await axios.post(`${API_BASE_URL}/trip/plan`, {
            destination: "Goa",
            interests: ["beaches", "food"],
            duration: 3,
            budget: "medium",
            travelMode: "flight"
        });
        console.log(`${colors.green}✓ Trip Plan: Generated successfully${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Trip Planning Failed: ${error.message}${colors.reset}\n`);
    }

    // Test 7: Smart Insights Analysis (NEW)
    try {
        console.log('7️⃣ Testing Smart Insights Analysis...');
        const insights = await axios.post(`${API_BASE_URL}/recommendations/analyze`, {
            destination: "Mumbai",
            dates: { start: "2024-11-01", end: "2024-11-05" },
            interests: ["heritage", "food"]
        });
        console.log(`${colors.green}✓ Smart Insights: Visit Score = ${insights.data.bestVisitScore}/100${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Smart Insights Failed: ${error.message}${colors.reset}\n`);
    }

    // Test 8: Crowd Density (NEW)
    try {
        console.log('8️⃣ Testing Crowd Density Analysis...');
        const crowd = await axios.post(`${API_BASE_URL}/crowd/density`, {
            name: "India Gate",
            location: { lat: 28.6129, lng: 77.2295 }
        });
        console.log(`${colors.green}✓ Crowd Density: ${crowd.data.currentCrowd.level} (${crowd.data.currentCrowd.percentage}%)${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Crowd Density Failed: ${error.message}${colors.reset}\n`);
    }

    // Test 9: Climate Trends (NEW)
    try {
        console.log('9️⃣ Testing Climate Trends...');
        const climate = await axios.get(`${API_BASE_URL}/climate/trends/Delhi?months=6`);
        console.log(`${colors.green}✓ Climate Trends: Analysis generated for 6 months${colors.reset}\n`);
    } catch (error) {
        console.log(`${colors.red}✗ Climate Trends Failed: ${error.message}${colors.reset}\n`);
    }
     // Summary
    console.log('\n📊 API Test Summary:');
    console.log('====================');
    console.log('Tested 9 API endpoints:');
    console.log('✓ Core APIs: Health, Weather, Geocoding');
    console.log('✓ AI Features: Chatbot, Trip Planning');
    console.log('✓ Smart Insights: Recommendations, Crowd, Climate (NEW)');
    console.log('\nIf any tests failed, check:');
    console.log('1. Your .env file has all required API keys');
    console.log('2. API keys are valid and active');
    console.log('3. Required Google APIs are enabled');
    console.log('4. You have sufficient API credits/quota\n');
}

// Check if server is running first
axios.get(`${API_BASE_URL}/health`)
    .then(() => {
        testAPIs();
    })
    .catch(() => {
        console.log(`${colors.red}❌ Backend server is not running!${colors.reset}`);
        console.log(`${colors.yellow}Please start the server first: npm start${colors.reset}\n`);
    });
