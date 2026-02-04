# BharatTrip AI Backend Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Set Up Environment Variables
Copy `env.example` to `.env` and fill in your API keys:

```bash
cp env.example .env
```

Edit `.env` file with your API keys:
- **OPENAI_API_KEY**: Get from [OpenAI Platform](https://platform.openai.com/api-keys)
- **WEATHER_API_KEY**: Get from [OpenWeatherMap](https://openweathermap.org/api)
- **GOOGLE_MAPS_API_KEY**: Get from [Google Cloud Console](https://console.cloud.google.com/)

### 3. Enable Google APIs
In Google Cloud Console, enable these APIs:
- Maps JavaScript API
- Places API
- Geocoding API

### 4. Start the Server
```bash
# Production mode
npm start

# Development mode (auto-restart on changes)
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### Health Check
- **GET** `/api/health` - Check if backend is running

### AI Chatbot
- **POST** `/api/chatbot`
```json
{
  "message": "Tell me about places to visit in Jaipur",
  "language": "en"
}
```

### Weather Data
- **GET** `/api/weather/:location` - Get weather for a location
- **GET** `/api/weather/:location?lat=28.6139&lon=77.2090` - Get weather by coordinates

### Places Search
- **POST** `/api/places/search`
```json
{
  "query": "restaurants in Mumbai",
  "location": {"lat": 19.0760, "lng": 72.8777},
  "radius": 5000,
  "type": "restaurant"
}
```

### Nearby Places
- **POST** `/api/places/nearby`
```json
{
  "location": {"lat": 28.6139, "lng": 77.2090},
  "radius": 5000,
  "types": ["tourist_attraction", "restaurant"]
}
```

### Geocoding
- **GET** `/api/geocode/:address` - Convert address to coordinates

### Trip Planning
- **POST** `/api/trip/plan`
```json
{
  "destination": "Goa",
  "interests": ["beaches", "food", "culture"],
  "duration": 5,
  "budget": "medium",
  "travelMode": "flight"
}
```

### Landmark Recognition
- **POST** `/api/landmark/recognize`
```json
{
  "imageBase64": "base64_encoded_image_data"
}
```

### Smart Insights & Analysis (NEW) 🆕

#### AI-Powered Travel Recommendations
- **POST** `/api/recommendations/analyze`
```json
{
  "destination": "Jaipur",
  "dates": { "start": "2024-11-01", "end": "2024-11-05" },
  "interests": ["heritage", "food", "culture"]
}
```
**Returns:** Weather forecast, crowd analysis, transport recommendations, visit score

#### Real-time Crowd Density
- **POST** `/api/crowd/density`
```json
{
  "placeId": "ChIJL_P_CXMEDTkRw0ZdG-0GVvw",
  "name": "India Gate",
  "location": { "lat": 28.6129, "lng": 77.2295 }
}
```
**Returns:** Current crowd level, best times to visit, AI analysis

#### Public Transport Routes
- **POST** `/api/transport/routes`
```json
{
  "origin": { "lat": 28.7041, "lng": 77.1025 },
  "destination": { "lat": 28.6139, "lng": 77.2090 },
  "mode": "transit"
}
```
**Returns:** Optimized routes, cost estimates, travel tips, alternatives

#### Climate Trends Analysis
- **GET** `/api/climate/trends/:destination?months=6`
**Returns:** Monthly climate patterns, best months to visit, seasonal recommendations

## Testing the Backend

### Using cURL
```bash
# Test health check
curl http://localhost:3001/api/health

# Test chatbot
curl -X POST http://localhost:3001/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{"message": "Best time to visit Kerala?", "language": "en"}'

# Test geocoding
curl http://localhost:3001/api/geocode/Taj%20Mahal%20Agra
```

### Using the Frontend
1. Open `bharattrip-integrated.html` in your browser
2. Check the backend status indicator (bottom right)
3. Test features:
   - **Chatbot**: Ask travel questions
   - **Trip Planner**: Generate AI itineraries
   - **Explore Map**: Search and view places
   - **Weather**: See weather overlays on map

## Troubleshooting

### Backend won't start
- Check if port 3001 is already in use
- Verify all dependencies are installed
- Check .env file exists with valid API keys

### API errors
- Ensure API keys are valid and have proper permissions
- Check API quotas and limits
- Verify internet connection

### CORS issues
- Backend is configured to allow all origins in development
- For production, update CORS settings in server.js

## Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start server.js --name bharattrip-backend
pm2 save
pm2 startup
```

### Using Docker
```dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

### Environment Variables for Production
- Set `NODE_ENV=production`
- Use secure API keys
- Configure proper CORS origins
- Enable HTTPS

## API Rate Limits

Be aware of rate limits for external APIs:
- **OpenAI**: 3 requests/minute (free tier)
- **OpenWeatherMap**: 60 calls/minute (free tier)
- **Google Maps**: $200 free credit/month

## Support

For issues or questions:
1. Check console logs for errors
2. Verify API keys are correct
3. Ensure all required Google APIs are enabled
4. Check network connectivity
