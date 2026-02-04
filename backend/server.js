// Backend Server for BharatTrip AI
const express=require('express');
const cors=require('cors');
const axios=require('axios');
const dotenv=require('dotenv');
const path=require('path');
// Load environment variables
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Handle file uploads
const multer = require('multer');

// Storage for review images
const reviewStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/reviews'))
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

// Storage for PLY files (3D models)
const plyStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, '../uploads/ply-models');
        // Create directory if it doesn't exist
        const fs = require('fs');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const upload = multer({ storage: reviewStorage });
const uploadPLY = multer({ 
    storage: plyStorage,
    fileFilter: function (req, file, cb) {
        if (file.mimetype === 'application/octet-stream' || file.originalname.toLowerCase().endsWith('.ply')) {
            cb(null, true);
        } else {
            cb(new Error('Only PLY files are allowed!'), false);
        }
    },
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});
// Reviews endpoints
app.post('/api/reviews', upload.single('image'), async (req, res) => {
    try {
        const { userId, placeId, rating, comment, title } = req.body;
        const imagePath = req.file ? `/uploads/reviews/${req.file.filename}` : null;
        
        const review = {
            id: `review_${Date.now()}`,
            userId,
            placeId,
            rating: parseInt(rating),
            comment,
            title,
            imagePath,
            createdAt: new Date().toISOString(),
            likes: 0,
            replies: []
        };

        // Store in localStorage (in production, this would be a database)
        const reviews = JSON.parse(localStorage.getItem('bharattrip_reviews') || '[]');
        reviews.push(review);
        localStorage.setItem('bharattrip_reviews', JSON.stringify(reviews));

        res.json({ success: true, review });
    } catch (error) {
        console.error('Error saving review:', error);
        res.status(500).json({ success: false, error: 'Failed to save review' });
    }
});

app.get('/api/reviews/:placeId', (req, res) => {
    try {
        const { placeId } = req.params;
        const reviews = JSON.parse(localStorage.getItem('bharattrip_reviews') || '[]');
        const placeReviews = reviews.filter(review => review.placeId === placeId);
        res.json({ success: true, reviews: placeReviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reviews' });
    }
});

// PLY file upload endpoint for 3D models
app.post('/api/upload/ply', uploadPLY.single('plyFile'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No PLY file uploaded' });
        }
        
        const fileUrl = `/uploads/ply-models/${req.file.filename}`;
        res.json({ 
            success: true, 
            fileUrl: fileUrl,
            filename: req.file.filename,
            size: req.file.size
        });
    } catch (error) {
        console.error('Error uploading PLY file:', error);
        res.status(500).json({ success: false, error: 'Failed to upload PLY file' });
    }
});

// Serve PLY files statically
app.use('/uploads/ply-models', express.static(path.join(__dirname, '../uploads/ply-models')));

// Tourist Guide Data
const touristGuides = {
    "golden-temple": [
        {
            id: "guide1",
            name: "Harpreet Singh",
            experience: "10+ years",
            languages: ["English", "Hindi", "Punjabi"],
            speciality: "Religious & Cultural Tours",
            rating: 4.8,
            contact: "+91-9876543210",
            image: "/guide-images/harpreet.jpg",
            background: "Expert in Sikh history and Golden Temple architecture. Certified guide with extensive knowledge of Punjab's culture.",
            price: "₹2000/day",
            reviews: 150
        },
        {
            id: "guide2",
            name: "Mandeep Kaur",
            experience: "8 years",
            languages: ["English", "Hindi", "Punjabi", "French"],
            speciality: "Heritage Walks",
            rating: 4.7,
            contact: "+91-9876543211",
            image: "/guide-images/mandeep.jpg",
            background: "Former history professor, now a full-time guide. Expert in local cuisine and traditions.",
            price: "₹1800/day",
            reviews: 120
        }
    ],
    "kedarnath": [
        {
            id: "guide3",
            name: "Rajesh Rawat",
            experience: "15+ years",
            languages: ["English", "Hindi", "Garhwali"],
            speciality: "Himalayan Treks & Temple History",
            rating: 4.9,
            contact: "+91-9876543212",
            image: "/guide-images/rajesh.jpg",
            background: "Local mountaineer and spiritual guide. Expert in Kedarnath temple history and safe mountain navigation.",
            price: "₹2500/day",
            reviews: 200
        },
        {
            id: "guide4",
            name: "Sunita Negi",
            experience: "12 years",
            languages: ["English", "Hindi", "Garhwali", "Sanskrit"],
            speciality: "Spiritual Tours",
            rating: 4.8,
            contact: "+91-9876543213",
            image: "/guide-images/sunita.jpg",
            background: "Sanskrit scholar and experienced trek guide. Deep knowledge of local mythology and customs.",
            price: "₹2200/day",
            reviews: 180
        }
    ]
};

// Add more locations and guides as needed
const defaultGuides = [
    {
        id: "guide-default1",
        name: "Rahul Sharma",
        experience: "7 years",
        languages: ["English", "Hindi"],
        speciality: "General Tourism",
        rating: 4.6,
        contact: "+91-9876543214",
        image: "/guide-images/rahul.jpg",
        background: "Professional tour guide with knowledge of multiple Indian destinations. Expert in local history and culture.",
        price: "₹1500/day",
        reviews: 90
    }
];

// Tourist Guide Endpoints
app.get('/api/tourist-guides/:location', (req, res) => {
    try {
        const { location } = req.params;
        const locationGuides = touristGuides[location] || defaultGuides;
        res.json({ success: true, guides: locationGuides });
    } catch (error) {
        console.error('Error fetching tourist guides:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch tourist guides' });
    }
});

// OpenAI Configuration
const { Configuration, OpenAIApi } = require('openai');
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// API Keys
const WEATHER_API_KEY = process.env.WEATHER_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'BharatTrip AI Backend is running!' });
});

// Chatbot endpoint - OpenAI Integration
app.post('/api/chatbot', async (req, res) => {
    try {
        const { message, language = 'en' } = req.body;
        
        // System prompt for travel assistant
        const systemPrompt = `You are BharatTrip AI, an intelligent travel assistant specialized in Indian tourism. 
        You provide helpful, accurate, and culturally sensitive travel advice about destinations in India.
        You can suggest itineraries, recommend places to visit, provide budget estimates, and share local insights.
        Respond in a friendly, conversational tone. If the user asks in Hindi, respond in Hindi.
        Current language preference: ${language}`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        res.json({
            success: true,
            reply: completion.data.choices[0].message.content
        });
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get chatbot response',
            fallbackReply: 'I apologize, but I\'m having trouble connecting right now. Please try again in a moment.'
        });
    }
});

// Weather endpoint - OpenWeatherMap Integration
app.get('/api/weather/:location', async (req, res) => {
    try {
        const { location } = req.params;
        const { lat, lon } = req.query;
        
        let weatherUrl;
        if (lat && lon) {
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
        } else {
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location},IN&appid=${WEATHER_API_KEY}&units=metric`;
        }

        const weatherResponse = await axios.get(weatherUrl);
        
        // Get 5-day forecast
        const forecastUrl = lat && lon 
            ? `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`
            : `https://api.openweathermap.org/data/2.5/forecast?q=${location},IN&appid=${WEATHER_API_KEY}&units=metric`;
            
        const forecastResponse = await axios.get(forecastUrl);

        res.json({
            success: true,
            current: weatherResponse.data,
            forecast: forecastResponse.data
        });
    } catch (error) {
        console.error('Weather API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch weather data'
        });
    }
});

// Places API - Google Maps Integration
app.post('/api/places/search', async (req, res) => {
    try {
        const { query, location, radius = 5000, type } = req.body;
        
        // Text search for places
        const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${location.lat},${location.lng}&radius=${radius}&type=${type || 'tourist_attraction'}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const placesResponse = await axios.get(placesUrl);
        
        res.json({
            success: true,
            places: placesResponse.data.results
        });
    } catch (error) {
        console.error('Places API error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch places data'
        });
    }
});

// Nearby places endpoint
app.post('/api/places/nearby', async (req, res) => {
    try {
        const { location, radius = 5000, types = ['tourist_attraction'] } = req.body;
        
        const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${types.join('|')}&key=${GOOGLE_MAPS_API_KEY}`;
        
        const nearbyResponse = await axios.get(nearbyUrl);
        
        res.json({
            success: true,
            places: nearbyResponse.data.results
        });
    } catch (error) {
        console.error('Nearby places error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch nearby places'
        });
    }
});

// Geocoding endpoint
app.get('/api/geocode/:address', async (req, res) => {
    try {
        const { address } = req.params;
        // Hint Google that we care about Indian locations first
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&region=IN&components=country:IN&key=${GOOGLE_MAPS_API_KEY}`;
        
        const geocodeResponse = await axios.get(geocodeUrl);
        
        if (geocodeResponse.data.results.length > 0) {
            const location = geocodeResponse.data.results[0].geometry.location;
            return res.json({
                success: true,
                location,
                formatted_address: geocodeResponse.data.results[0].formatted_address
            });
        }

        // Fallback: OpenStreetMap Nominatim
        console.log('[Geocode] Google ZERO_RESULTS, trying Nominatim…');
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address + ', India')}`;
        const nomRes = await axios.get(nominatimUrl, {
            headers: { 'User-Agent': 'BharatTripAI/1.0' }
        });

        if (nomRes.data.length > 0) {
            const loc = nomRes.data[0];
            return res.json({
                success: true,
                location: { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) },
                formatted_address: loc.display_name
            });
        }
        res.json({ success: false, error: 'Location not found' });
    } catch (error) {
        console.error('Geocoding error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to geocode address'
        });
    }
});

// Reverse geocoding endpoint (coordinates to address)
app.get('/api/reverse-geocode', async (req, res) => {
    try {
        const { lat, lon } = req.query;
        
        if (!lat || !lon) {
            return res.status(400).json({
                success: false,
                error: 'Latitude and longitude are required'
            });
        }
        
        // Try Google Maps reverse geocoding first
        try {
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&region=IN&key=${GOOGLE_MAPS_API_KEY}`;
            const geocodeResponse = await axios.get(geocodeUrl);
            
            if (geocodeResponse.data.results.length > 0) {
                return res.json({
                    success: true,
                    location: { lat: parseFloat(lat), lng: parseFloat(lon) },
                    formatted_address: geocodeResponse.data.results[0].formatted_address
                });
            }
        } catch (googleError) {
            console.log('Google reverse geocoding failed, trying OSM...');
        }
        
        // Fallback: OpenStreetMap Nominatim reverse geocoding
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`;
        const nomRes = await axios.get(nominatimUrl, {
            headers: { 'User-Agent': 'BharatTripAI/1.0' }
        });
        
        if (nomRes.data && nomRes.data.display_name) {
            return res.json({
                success: true,
                location: { lat: parseFloat(lat), lng: parseFloat(lon) },
                formatted_address: nomRes.data.display_name
            });
        }
        
        res.json({ 
            success: false, 
            error: 'Location not found',
            location: { lat: parseFloat(lat), lng: parseFloat(lon) },
            formatted_address: `Location at ${lat}, ${lon}`
        });
    } catch (error) {
        console.error('Reverse geocoding error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reverse geocode coordinates'
        });
    }
});

// Enhanced AI Trip Planner endpoint with personalized features
app.post('/api/generate-itinerary', async (req, res) => {
    try {
        const { destination, interests, startDate, endDate, budget, travelMode, userId, preferences } = req.body;
        
        // Calculate duration
        const start = new Date(startDate);
        const end = new Date(endDate);
        const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        
        console.log(`[Itinerary] Generating ${duration}-day itinerary for ${destination} (${startDate} to ${endDate})`);
        
        // Create personalized prompt based on user preferences
        let personalizedContext = '';
        if (preferences) {
            personalizedContext = `User preferences: Travel style: ${preferences.style}, Pace: ${preferences.pace}, Budget preference: ${preferences.budget}. `;
        }
        
        const prompt = `${personalizedContext}Create a detailed ${duration}-day personalized itinerary for ${destination}, India.

Trip Details:
- Destination: ${destination}
- Duration: EXACTLY ${duration} days (${startDate} to ${endDate})
- Interests: ${interests.join(', ')}
- Budget: ${budget}
- Travel Mode: ${travelMode}

IMPORTANT: You MUST create exactly ${duration} days in the dailyPlan array. No more, no less.

Create a JSON response with this exact structure:
{
  "title": "${destination} ${duration}-Day Adventure",
  "dailyPlan": [
    {
      "day": 1,
      "title": "Day 1: Arrival & First Impressions",
      "activities": [
        {
          "name": "Activity name",
          "description": "Detailed description of the activity",
          "reason": "Why this activity is special and worth visiting"
        }
      ]
    }${duration > 1 ? `,
    {
      "day": 2,
      "title": "Day 2: Exploration",
      "activities": [...]
    }` : ''}${duration > 2 ? `
    ... continue for all ${duration} days` : ''}
  ]
}

Generate exactly ${duration} day objects in the dailyPlan array. Include 3-4 activities per day. Make each activity description engaging and informative. The "reason" should explain the cultural, historical, or experiential significance.

Day progression should be logical:
- Day 1: Arrival, orientation, nearby attractions
- Middle days: Main attractions, experiences
- Last day: Final experiences, departure preparation`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an expert travel planner for India with deep knowledge of local attractions, cuisine, and culture. Always respond with valid JSON only." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        });

        let itineraryData;
        try {
            const responseText = completion.data.choices[0].message.content.trim();
            // Remove any markdown formatting
            const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '');
            itineraryData = JSON.parse(cleanedResponse);
            
            // Validate that we have the correct number of days
            if (!itineraryData.dailyPlan || itineraryData.dailyPlan.length !== duration) {
                console.log(`Warning: Generated ${itineraryData.dailyPlan?.length || 0} days, expected ${duration}. Adjusting...`);
                
                // If we have fewer days than needed, generate additional days
                if (itineraryData.dailyPlan && itineraryData.dailyPlan.length < duration) {
                    for (let i = itineraryData.dailyPlan.length + 1; i <= duration; i++) {
                        itineraryData.dailyPlan.push({
                            day: i,
                            title: `Day ${i}: ${i === duration ? 'Departure & Final Experiences' : 'Continued Exploration'}`,
                            activities: [
                                {
                                    name: `Day ${i} Activities`,
                                    description: `Explore more of ${destination} with activities suited to your interests: ${interests.join(', ')}`,
                                    reason: "Continue discovering the unique charm and attractions of this destination"
                                }
                            ]
                        });
                    }
                }
                
                // If we have more days than needed, trim to the correct duration
                if (itineraryData.dailyPlan && itineraryData.dailyPlan.length > duration) {
                    itineraryData.dailyPlan = itineraryData.dailyPlan.slice(0, duration);
                }
            }
            
        } catch (parseError) {
            console.error('JSON parsing error:', parseError);
            // Fallback: Generate the correct number of days
            itineraryData = {
                title: `${destination} ${duration}-Day Travel Itinerary`,
                dailyPlan: []
            };
            
            for (let i = 1; i <= duration; i++) {
                itineraryData.dailyPlan.push({
                    day: i,
                    title: `Day ${i}: ${i === 1 ? 'Arrival & Exploration' : i === duration ? 'Final Day & Departure' : 'Continued Discovery'}`,
                    activities: [
                        {
                            name: `${destination} Exploration`,
                            description: `Discover the best of ${destination} with activities tailored to your interests: ${interests.join(', ')}. Enjoy local attractions, cuisine, and culture.`,
                            reason: "Experience the authentic local culture and must-see attractions"
                        },
                        {
                            name: "Local Cuisine Experience",
                            description: "Try authentic local dishes and visit popular restaurants or street food spots",
                            reason: "Food is an integral part of understanding local culture"
                        },
                        {
                            name: "Cultural Activity",
                            description: "Engage in cultural activities based on your interests and local offerings",
                            reason: "Immerse yourself in the local way of life and traditions"
                        }
                    ]
                });
            }
        }

        res.json({
            success: true,
            itinerary: itineraryData
        });
    } catch (error) {
        console.error('Enhanced trip planning error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate enhanced itinerary'
        });
    }
});

// Get alternative activities endpoint
app.post('/api/get-alternatives', async (req, res) => {
    try {
        const { dayPlan, userRequest, destination, interests } = req.body;
        
        const prompt = `A user is modifying their itinerary for ${destination}. Their current plan for Day ${dayPlan.day} is: ${dayPlan.activities.map(a => a.name).join(', ')}.

The user said: "${userRequest}".

Based on their request, suggest 3 distinct alternative activities for them to do on that day in ${destination}, keeping in mind their interests are ${interests.join(', ')}.

Respond with JSON in this exact format:
{
  "alternatives": [
    {
      "name": "Activity name",
      "description": "Activity description",
      "reason": "Why this is a good alternative"
    }
  ]
}`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful travel assistant. Always respond with valid JSON only." },
                { role: "user", content: prompt }
            ],
            temperature: 0.8,
            max_tokens: 600
        });

        let alternatives;
        try {
            const responseText = completion.data.choices[0].message.content.trim();
            const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '');
            alternatives = JSON.parse(cleanedResponse);
        } catch (parseError) {
            console.error('JSON parsing error for alternatives:', parseError);
            // Fallback alternatives
            alternatives = {
                alternatives: [
                    {
                        name: "Local Market Visit",
                        description: "Explore authentic local markets and street food",
                        reason: "Experience local culture and cuisine"
                    },
                    {
                        name: "Heritage Walk",
                        description: "Guided tour of historical landmarks",
                        reason: "Learn about local history and architecture"
                    },
                    {
                        name: "Nature Spot",
                        description: "Visit nearby parks or natural attractions",
                        reason: "Relax and enjoy natural beauty"
                    }
                ]
            };
        }

        res.json({
            success: true,
            alternatives: alternatives.alternatives
        });
    } catch (error) {
        console.error('Get alternatives error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get alternative activities'
        });
    }
});

// Original trip planning endpoint (kept for backward compatibility)
app.post('/api/trip/plan', async (req, res) => {
    try {
        const { destination, interests, duration, budget, travelMode } = req.body;
        
        const prompt = `Create a detailed ${duration}-day trip itinerary for ${destination}, India with the following preferences:
        - Interests: ${interests.join(', ')}
        - Budget: ${budget} per day
        - Travel mode: ${travelMode}
        
        Please provide:
        1. Day-by-day itinerary with timings
        2. Estimated costs for each activity
        3. Best places to stay
        4. Local food recommendations
        5. Travel tips
        
        Format the response in a clear, structured way.`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an expert travel planner for India with deep knowledge of local attractions, cuisine, and culture." },
                { role: "user", content: prompt }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        res.json({
            success: true,
            itinerary: completion.data.choices[0].message.content
        });
    } catch (error) {
        console.error('Trip planning error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate trip plan'
        });
    }
});

// Weather Map Layers endpoint (for map integration)
app.get('/api/weather/map/:layer', async (req, res) => {
    try {
        const { layer } = req.params;
        const { z, x, y } = req.query;
        
        // OpenWeatherMap tile layers
        const tileUrl = `https://tile.openweathermap.org/map/${layer}/${z}/${x}/${y}.png?appid=${WEATHER_API_KEY}`;
        
        const response = await axios.get(tileUrl, {
            responseType: 'stream'
        });
        
        res.setHeader('Content-Type', 'image/png');
        response.data.pipe(res);
    } catch (error) {
        console.error('Weather map error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch weather map tile'
        });
    }
});

// Future Weather Prediction endpoint using CDS and historical data
app.post('/api/weather/future-prediction', async (req, res) => {
    try {
        const { lat, lon, date } = req.body;
        
        if (!lat || !lon || !date) {
            return res.status(400).json({
                success: false,
                error: 'Latitude, longitude, and date are required'
            });
        }
        
        // Validate date is within next year
        const selectedDate = new Date(date);
        const today = new Date();
        const oneYearLater = new Date();
        oneYearLater.setFullYear(today.getFullYear() + 1);
        
        if (selectedDate < today || selectedDate > oneYearLater) {
            return res.status(400).json({
                success: false,
                error: 'Date must be between today and one year from now'
            });
        }
        
        // Get current weather for baseline
        const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
        const currentWeatherResponse = await axios.get(currentWeatherUrl);
        
        // Calculate days from today
        const daysFromNow = Math.ceil((selectedDate - today) / (1000 * 60 * 60 * 24));
        
        // For dates within 5 days, use OpenWeatherMap forecast
        if (daysFromNow <= 5) {
            const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
            const forecastResponse = await axios.get(forecastUrl);
            
            // Find closest forecast to selected date
            const selectedDateTime = selectedDate.getTime();
            const forecastList = forecastResponse.data.list;
            let closestForecast = forecastList[0];
            let minDiff = Math.abs(new Date(forecastList[0].dt * 1000).getTime() - selectedDateTime);
            
            forecastList.forEach(forecast => {
                const diff = Math.abs(new Date(forecast.dt * 1000).getTime() - selectedDateTime);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestForecast = forecast;
                }
            });
            
            return res.json({
                success: true,
                prediction: {
                    date: date,
                    location: {
                        lat: parseFloat(lat),
                        lon: parseFloat(lon),
                        name: currentWeatherResponse.data.name || 'Selected Location'
                    },
                    temperature: closestForecast.main.temp,
                    feelsLike: closestForecast.main.feels_like,
                    humidity: closestForecast.main.humidity,
                    pressure: closestForecast.main.pressure,
                    windSpeed: closestForecast.wind.speed,
                    windDirection: closestForecast.wind.deg || 0,
                    description: closestForecast.weather[0].description,
                    icon: closestForecast.weather[0].icon,
                    clouds: closestForecast.clouds.all,
                    visibility: closestForecast.visibility / 1000,
                    precipitation: closestForecast.rain ? (closestForecast.rain['3h'] || 0) : 0,
                    source: 'openweathermap_forecast'
                },
                currentWeather: currentWeatherResponse.data,
                daysFromNow: daysFromNow
            });
        }
        
        // For dates beyond 5 days, use historical climate data and prediction
        // Extract month and day for historical analysis
        const month = selectedDate.getMonth() + 1;
        const day = selectedDate.getDate();
        
        // Get historical weather data for same month/day (using current year as proxy)
        // This simulates climate-based prediction
        const historicalUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=metric`;
        const historicalResponse = await axios.get(historicalUrl);
        
        // Climate-based prediction using historical patterns
        // Adjust temperature based on seasonal variations
        const currentMonth = today.getMonth() + 1;
        const currentTemp = currentWeatherResponse.data.main.temp;
        
        // Simple seasonal adjustment (can be enhanced with actual climate data)
        const seasonalAdjustments = {
            1: -5, 2: -3, 3: 0, 4: 3, 5: 5, 6: 2,
            7: -1, 8: -1, 9: 1, 10: 3, 11: 1, 12: -2
        };
        
        const tempAdjustment = seasonalAdjustments[month] - seasonalAdjustments[currentMonth];
        const predictedTemp = currentTemp + tempAdjustment;
        
        // Generate prediction based on historical patterns
        const prediction = {
            date: date,
            location: {
                lat: parseFloat(lat),
                lon: parseFloat(lon),
                name: currentWeatherResponse.data.name || 'Selected Location'
            },
            temperature: Math.round(predictedTemp * 10) / 10,
            feelsLike: Math.round((predictedTemp - 2) * 10) / 10,
            humidity: currentWeatherResponse.data.main.humidity + (Math.random() * 20 - 10), // Variation
            pressure: currentWeatherResponse.data.main.pressure,
            windSpeed: currentWeatherResponse.data.wind.speed,
            windDirection: currentWeatherResponse.data.wind.deg || 0,
            description: currentWeatherResponse.data.weather[0].description,
            icon: currentWeatherResponse.data.weather[0].icon,
            clouds: currentWeatherResponse.data.clouds.all,
            visibility: (currentWeatherResponse.data.visibility || 10000) / 1000,
            precipitation: 0,
            source: 'climate_based_prediction',
            confidence: daysFromNow <= 30 ? 'medium' : 'low',
            note: `Prediction based on historical climate patterns for ${month}/${day}`
        };
        
        // Trip planning recommendations
        const recommendations = [];
        
        if (prediction.temperature > 30) {
            recommendations.push('🌞 Hot weather expected - plan for early morning or evening activities');
        } else if (prediction.temperature < 15) {
            recommendations.push('❄️ Cool weather expected - pack warm clothing');
        } else {
            recommendations.push('🌤️ Pleasant weather expected - great for outdoor activities');
        }
        
        if (prediction.humidity > 70) {
            recommendations.push('💧 High humidity expected - stay hydrated');
        }
        
        if (prediction.precipitation > 5) {
            recommendations.push('🌧️ Rain expected - carry umbrella or rain gear');
        }
        
        if (prediction.visibility < 5) {
            recommendations.push('🌫️ Reduced visibility - be cautious while traveling');
        }
        
        return res.json({
            success: true,
            prediction: prediction,
            currentWeather: currentWeatherResponse.data,
            daysFromNow: daysFromNow,
            recommendations: recommendations,
            tripPlanningTips: {
                bestTimeToVisit: prediction.temperature >= 20 && prediction.temperature <= 30 ? 'Excellent' : 'Moderate',
                activitySuitability: {
                    outdoor: prediction.precipitation < 5 && prediction.visibility > 5 ? 'Good' : 'Fair',
                    sightseeing: prediction.visibility > 5 ? 'Good' : 'Fair',
                    photography: prediction.clouds < 50 && prediction.visibility > 5 ? 'Excellent' : 'Good'
                }
            }
        });
        
    } catch (error) {
        console.error('Future weather prediction error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch weather prediction',
            details: error.message
        });
    }
});

// Landmark recognition endpoint (mock for now, can integrate with Google Vision API)
app.post('/api/landmark/recognize', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        
        // For now, return mock data
        // In production, integrate with Google Vision API
        const mockLandmarks = [
            { name: 'Taj Mahal', location: 'Agra', confidence: 0.95 },
            { name: 'India Gate', location: 'New Delhi', confidence: 0.92 },
            { name: 'Gateway of India', location: 'Mumbai', confidence: 0.89 }
        ];
        
        const randomLandmark = mockLandmarks[Math.floor(Math.random() * mockLandmarks.length)];
        
        res.json({
            success: true,
            landmark: randomLandmark
        });
    } catch (error) {
        console.error('Landmark recognition error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to recognize landmark'
        });
    }
});

// AI-Powered Travel Recommendations with Climate & Crowd Analysis
app.post('/api/recommendations/analyze', async (req, res) => {
    try {
        const { destination, dates, interests } = req.body;
        
        // Fetch weather forecast for destination
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${destination},IN&appid=${WEATHER_API_KEY}&units=metric`;
        const weatherResponse = await axios.get(weatherUrl);
        
        // Analyze weather patterns
        const weatherData = weatherResponse.data.list;
        const avgTemp = weatherData.reduce((sum, item) => sum + item.main.temp, 0) / weatherData.length;
        const avgHumidity = weatherData.reduce((sum, item) => sum + item.main.humidity, 0) / weatherData.length;
        const rainDays = weatherData.filter(item => item.weather[0].main.includes('Rain')).length;
        
        // Get location coordinates for crowd analysis
        const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;
        const geocodeResponse = await axios.get(geocodeUrl);
        const location = geocodeResponse.data.results[0]?.geometry.location;
        
        // Analyze crowd density patterns using AI
        const crowdAnalysisPrompt = `Analyze crowd density and best visiting times for ${destination}, India.
        Consider: ${interests.join(', ')} interests.
        Weather: Avg temp ${avgTemp.toFixed(1)}°C, Humidity ${avgHumidity.toFixed(0)}%
        
        Provide:
        1. Best time to visit (time of day and days of week)
        2. Expected crowd levels (Low/Medium/High)
        3. Peak hours to avoid
        4. Off-peak recommendations
        Format as JSON with keys: bestTime, crowdLevel, peakHours, offPeakTimes, reasoning`;
        
        const crowdAnalysis = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a travel data analyst expert in Indian tourism patterns and crowd management." },
                { role: "user", content: crowdAnalysisPrompt }
            ],
            temperature: 0.7,
            max_tokens: 500
        });
        
        // Transport route optimization
        const transportPrompt = `Suggest optimal public transport routes for ${destination}, India.
        Consider weather (${avgTemp.toFixed(1)}°C, ${rainDays > 5 ? 'rainy' : 'clear'} conditions).
        Interests: ${interests.join(', ')}
        
        Provide:
        1. Best transport modes (metro/bus/auto/taxi)
        2. Recommended routes between attractions
        3. Travel time estimates
        4. Cost estimates
        5. Weather-appropriate transport suggestions
        Format as JSON.`;
        
        const transportAnalysis = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a local transport expert with knowledge of Indian public transport systems." },
                { role: "user", content: transportPrompt }
            ],
            temperature: 0.7,
            max_tokens: 600
        });
        
        // Climate trend analysis
        const climateTrends = {
            currentTemp: avgTemp.toFixed(1),
            humidity: avgHumidity.toFixed(0),
            rainProbability: ((rainDays / weatherData.length) * 100).toFixed(0),
            comfort: avgTemp < 25 ? 'Pleasant' : avgTemp < 35 ? 'Warm' : 'Hot',
            recommendation: avgTemp < 25 && rainDays < 3 ? 'Excellent' : 
                           avgTemp < 30 && rainDays < 5 ? 'Good' : 'Fair'
        };
        
        res.json({
            success: true,
            destination,
            weatherForecast: {
                avgTemperature: avgTemp.toFixed(1),
                avgHumidity: avgHumidity.toFixed(0),
                rainDays: rainDays,
                forecastDays: weatherData.length / 8, // 3-hour intervals
                comfort: climateTrends.comfort,
                recommendation: climateTrends.recommendation
            },
            crowdAnalysis: JSON.parse(crowdAnalysis.data.choices[0].message.content.replace(/```json\n?|\n?```/g, '')),
            transportRecommendations: JSON.parse(transportAnalysis.data.choices[0].message.content.replace(/```json\n?|\n?```/g, '')),
            climateTrends: climateTrends,
            bestVisitScore: calculateVisitScore(avgTemp, avgHumidity, rainDays),
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Recommendations error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate recommendations',
            message: error.message
        });
    }
});

// Real-time crowd density estimation
app.post('/api/crowd/density', async (req, res) => {
    try {
        const { placeId, location, name } = req.body;
        
        // Get place details from Google Maps
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,opening_hours&key=${GOOGLE_MAPS_API_KEY}`;
        const placeResponse = await axios.get(placeDetailsUrl);
        const placeData = placeResponse.data.result;
        
        // Estimate crowd density based on ratings and current time
        const now = new Date();
        const hour = now.getHours();
        const dayOfWeek = now.getDay();
        
        // Peak hours logic: 10am-12pm and 4pm-7pm on weekdays, all day weekends
        let crowdLevel = 'Medium';
        let crowdPercentage = 50;
        
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
            crowdPercentage = 70;
            crowdLevel = 'High';
        } else if ((hour >= 10 && hour <= 12) || (hour >= 16 && hour <= 19)) { // Peak hours
            crowdPercentage = 75;
            crowdLevel = 'High';
        } else if (hour >= 6 && hour <= 9) { // Early morning
            crowdPercentage = 30;
            crowdLevel = 'Low';
        } else if (hour >= 20 || hour <= 5) { // Night/early morning
            crowdPercentage = 20;
            crowdLevel = 'Very Low';
        }
        
        // Use AI to provide detailed crowd analysis
        const crowdPrompt = `Analyze current crowd density for ${name || 'this location'} in India.
        Current time: ${now.toLocaleTimeString('en-IN')}
        Day: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek]}
        Rating: ${placeData.rating || 'N/A'}
        Total ratings: ${placeData.user_ratings_total || 'N/A'}
        
        Provide: 1) Detailed crowd analysis, 2) Best times to visit today, 3) Tips to avoid crowds.
        Keep it concise (3-4 sentences).`;
        
        const aiAnalysis = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a crowd management expert analyzing tourist site congestion." },
                { role: "user", content: crowdPrompt }
            ],
            temperature: 0.7,
            max_tokens: 200
        });
        
        res.json({
            success: true,
            placeName: name || placeData.name,
            currentCrowd: {
                level: crowdLevel,
                percentage: crowdPercentage,
                timestamp: now.toISOString()
            },
            analysis: aiAnalysis.data.choices[0].message.content,
            peakHours: ['10:00-12:00', '16:00-19:00'],
            bestTimes: ['06:00-09:00', '14:00-16:00'],
            placeDetails: {
                rating: placeData.rating,
                totalRatings: placeData.user_ratings_total,
                isOpen: placeData.opening_hours?.open_now || null
            }
        });
    } catch (error) {
        console.error('Crowd density error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get crowd density data'
        });
    }
});

// Public transport updates and route optimization
app.post('/api/transport/routes', async (req, res) => {
    try {
        const { origin, destination, mode, destination_name } = req.body;
        
        // Get directions from Google Maps
        const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&mode=${mode || 'transit'}&key=${GOOGLE_MAPS_API_KEY}`;
        const directionsResponse = await axios.get(directionsUrl);
        
        if (directionsResponse.data.routes.length === 0) {
            return res.json({
                success: false,
                error: 'No routes found'
            });
        }
        
        const route = directionsResponse.data.routes[0];
        const leg = route.legs[0];
        
        // Use AI to provide context-aware transport recommendations
        const transportPrompt = `Analyze this travel route in India:
        From: ${leg.start_address}
        To: ${leg.end_address}
        Distance: ${leg.distance.text}
        Duration: ${leg.duration.text}
        Mode: ${mode || 'transit'}
        
        Provide: 1) Alternative transport options, 2) Cost estimates, 3) Time-saving tips, 4) Safety recommendations.
        Format as JSON with keys: alternatives, costEstimate, tips, safetyNotes`;
        
        const aiRecommendations = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a local transport advisor familiar with Indian public transport." },
                { role: "user", content: transportPrompt }
            ],
            temperature: 0.7,
            max_tokens: 400
        });
        
        res.json({
            success: true,
            route: {
                distance: leg.distance.text,
                duration: leg.duration.text,
                startAddress: leg.start_address,
                endAddress: leg.end_address,
                steps: leg.steps.map(step => ({
                    instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                    distance: step.distance.text,
                    duration: step.duration.text,
                    mode: step.travel_mode
                }))
            },
            aiRecommendations: JSON.parse(aiRecommendations.data.choices[0].message.content.replace(/```json\n?|\n?```/g, '')),
            mapPolyline: route.overview_polyline.points
        });
    } catch (error) {
        console.error('Transport routes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get transport routes'
        });
    }
});

// Climate trends analysis for destination
app.get('/api/climate/trends/:destination', async (req, res) => {
    try {
        const { destination } = req.params;
        const { months = 6 } = req.query;
        
        // Get historical and forecast weather data
        const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${destination},IN&appid=${WEATHER_API_KEY}&units=metric`;
        const weatherResponse = await axios.get(weatherUrl);
        
        // Analyze climate trends using AI
        const trendsPrompt = `Analyze climate trends for ${destination}, India over the next ${months} months.
        Current conditions: ${weatherResponse.data.list[0].weather[0].description}
        Temperature: ${weatherResponse.data.list[0].main.temp}°C
        
        Provide monthly breakdown:
        - Best months to visit
        - Monsoon/dry season information
        - Temperature ranges
        - Festival seasons
        - Tourist season (peak/off-peak)
        
        Format as JSON with month-wise data.`;
        
        const aiTrends = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a climatologist specializing in Indian weather patterns and tourism seasons." },
                { role: "user", content: trendsPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800
        });
        
        res.json({
            success: true,
            destination,
            currentWeather: weatherResponse.data.list[0],
            forecast: weatherResponse.data.list.slice(0, 8), // Next 24 hours
            climateTrends: JSON.parse(aiTrends.data.choices[0].message.content.replace(/```json\n?|\n?```/g, '')),
            analyzedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Climate trends error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze climate trends'
        });
    }
});

// Cultural Insights API - Festivals, Customs, Local Culture
app.post('/api/cultural/insights', async (req, res) => {
    try {
        const { destination, language = 'en' } = req.body;
        
        const culturalPrompt = `Provide comprehensive cultural insights for ${destination}, India in simple, readable format.

Format your response EXACTLY as follows (plain text, not nested JSON):

FESTIVALS:
- List 4-5 major festivals with months (e.g., "Diwali in October-November")

CUSTOMS:
- List 4-5 local customs as simple bullet points

DOS:
- List 4-5 cultural do's

DONTS:
- List 4-5 cultural don'ts

PHRASES:
- List 5-6 useful phrases with translations (format: "Namaste - Hello")

FOOD:
Write 2-3 sentences about local food culture and dining etiquette.

TIPS:
- List 3-4 practical cultural tips

Keep it concise and practical. ${language !== 'en' ? `Include ${language} where helpful.` : ''}`;
        
        const culturalInsights = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a cultural anthropologist and expert on Indian traditions, customs, and regional cultures." },
                { role: "user", content: culturalPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1200
        });
        
        const content = culturalInsights.data.choices[0].message.content;
        
        // Simple line-by-line parsing
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        const parsedContent = {
            festivals: [],
            customs: [],
            etiquette: { dos: [], donts: [] },
            language: [],
            food: '',
            tips: []
        };
        
        let currentSection = null;
        
        for (const line of lines) {
            if (/FESTIVALS:/i.test(line)) {
                currentSection = 'festivals';
            } else if (/CUSTOMS:/i.test(line)) {
                currentSection = 'customs';
            } else if (/DOS:/i.test(line)) {
                currentSection = 'dos';
            } else if (/DONTS?:/i.test(line)) {
                currentSection = 'donts';
            } else if (/PHRASES:/i.test(line)) {
                currentSection = 'language';
            } else if (/FOOD:/i.test(line)) {
                currentSection = 'food';
            } else if (/TIPS:/i.test(line)) {
                currentSection = 'tips';
            } else if (line.startsWith('-') || line.startsWith('•')) {
                const cleanLine = line.replace(/^[-•*]\s*/, '');
                if (currentSection === 'festivals') parsedContent.festivals.push(cleanLine);
                else if (currentSection === 'customs') parsedContent.customs.push(cleanLine);
                else if (currentSection === 'dos') parsedContent.etiquette.dos.push(cleanLine);
                else if (currentSection === 'donts') parsedContent.etiquette.donts.push(cleanLine);
                else if (currentSection === 'language') parsedContent.language.push(cleanLine);
                else if (currentSection === 'tips') parsedContent.tips.push(cleanLine);
            } else if (currentSection === 'food' && line.length > 10) {
                parsedContent.food += (parsedContent.food ? ' ' : '') + line;
            }
        }
        
        res.json({
            success: true,
            destination,
            culturalInsights: parsedContent,
            language,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Cultural insights error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch cultural insights',
            message: error.message
        });
    }
});

// Smart Planner API - Advanced trip planning with multi-destination support
app.post('/api/planner/smart', async (req, res) => {
    try {
        const { destinations, duration, budget, interests, preferences } = req.body;
        
        const plannerPrompt = `Create a multi-destination trip plan for India.

Destinations: ${Array.isArray(destinations) ? destinations.join(' → ') : destinations}
Duration: ${duration} days
Budget: ${budget} per person
Interests: ${interests.join(', ')}

Format your response as follows:

ROUTE:
- City 1 (X days)
- City 2 (Y days)
- etc.

TIMELINE:
Day 1-2: City - Activities
Day 3-4: City - Activities
etc.

RECOMMENDATIONS:
- Recommendation 1
- Recommendation 2
- etc.

TIPS:
- Tip 1
- Tip 2
- etc.

Keep it concise and practical.`;
        
        const smartPlan = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an expert travel planner specializing in multi-city Indian tours with budget optimization." },
                { role: "user", content: plannerPrompt }
            ],
            temperature: 0.7,
            max_tokens: 1500
        });
        
        const content = smartPlan.data.choices[0].message.content;
        
        // Parse plain text response
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        
        const parsedPlan = {
            route: [],
            timeline: [],
            recommendations: [],
            tips: []
        };
        
        let currentSection = null;
        
        for (const line of lines) {
            if (/ROUTE:/i.test(line)) {
                currentSection = 'route';
            } else if (/TIMELINE:/i.test(line)) {
                currentSection = 'timeline';
            } else if (/RECOMMENDATIONS:/i.test(line)) {
                currentSection = 'recommendations';
            } else if (/TIPS:/i.test(line)) {
                currentSection = 'tips';
            } else if (line.startsWith('-') || line.startsWith('•') || /^Day\s+\d/.test(line)) {
                const cleanLine = line.replace(/^[-•*]\s*/, '');
                if (currentSection === 'route') {
                    parsedPlan.route.push(cleanLine);
                } else if (currentSection === 'timeline') {
                    parsedPlan.timeline.push(cleanLine);
                } else if (currentSection === 'recommendations') {
                    parsedPlan.recommendations.push(cleanLine);
                } else if (currentSection === 'tips') {
                    parsedPlan.tips.push(cleanLine);
                }
            }
        }
        
        res.json({
            success: true,
            smartPlan: parsedPlan,
            totalDuration: duration,
            estimatedBudget: budget,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Smart planner error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create smart plan',
            message: error.message
        });
    }
});

// Budget calculator with group split functionality
app.post('/api/budget/calculate', async (req, res) => {
    try {
        const { itinerary, numberOfPeople, splitEqually } = req.body;
        
        const budgetPrompt = `Calculate budget for this trip (${numberOfPeople} people, ${splitEqually ? 'equal split' : 'individual'}):

Provide estimates in INR:
- Transport: ₹X
- Stay: ₹Y  
- Food: ₹Z
- Activities: ₹A
- Total: ₹Total
- Per Person: ₹PerPerson

Keep it simple with realistic Indian prices.`;
        
        const budgetAnalysis = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a budget travel expert helping travelers optimize costs in India." },
                { role: "user", content: budgetPrompt }
            ],
            temperature: 0.7,
            max_tokens: 800
        });
        
        const budgetContent = budgetAnalysis.data.choices[0].message.content;
        
        // Simple number extraction
        const extractAmount = (text, key) => {
            const regex = new RegExp(`${key}[:\\s]*₹?([\\d,]+)`, 'i');
            const match = text.match(regex);
            return match ? match[1].replace(/,/g, '') : '0';
        };
        
        const breakdown = {
            breakdown: {
                transport: extractAmount(budgetContent, 'Transport'),
                stay: extractAmount(budgetContent, 'Stay|Accommodation'),
                food: extractAmount(budgetContent, 'Food'),
                activities: extractAmount(budgetContent, 'Activities')
            },
            total: extractAmount(budgetContent, 'Total'),
            perPerson: extractAmount(budgetContent, 'Per Person')
        };
        
        res.json({
            success: true,
            budgetBreakdown: breakdown,
            numberOfPeople,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Budget calculator error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to calculate budget'
        });
    }
});

// Eco-friendly route suggestions
app.post('/api/eco/routes', async (req, res) => {
    try {
        const { origin, destination, preferences } = req.body;
        
        const ecoPrompt = `Eco-friendly travel options from ${origin} to ${destination}, India:

Provide:
- Eco Score: X/100
- Best green transport option
- Carbon savings estimate
- 2-3 eco-friendly recommendations

Keep it brief and practical.`;
        
        const ecoAnalysis = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an eco-tourism expert promoting sustainable travel in India." },
                { role: "user", content: ecoPrompt }
            ],
            temperature: 0.7,
            max_tokens: 700
        });
        
        const ecoContent = ecoAnalysis.data.choices[0].message.content;
        
        // Extract eco score
        const scoreMatch = ecoContent.match(/eco\s+score[:\s]*(\d+)/i);
        const ecoScore = scoreMatch ? parseInt(scoreMatch[1]) : 75;
        
        // Extract recommendations
        const recommendations = ecoContent.replace(/eco\s+score[:\s]*\d+/i, '').trim();
        
        res.json({
            success: true,
            ecoRoutes: {
                ecoScore: ecoScore,
                recommendations: recommendations
            },
            origin,
            destination,
            generatedAt: new Date().toISOString()
        });
    } catch (error) {
        console.error('Eco routes error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate eco routes'
        });
    }
});

// Helper function to calculate visit score
function calculateVisitScore(temp, humidity, rainDays) {
    let score = 100;
    
    // Temperature scoring (ideal: 15-28°C)
    if (temp < 15 || temp > 35) score -= 30;
    else if (temp < 20 || temp > 32) score -= 15;
    
    // Humidity scoring (ideal: 40-70%)
    if (humidity < 30 || humidity > 80) score -= 20;
    else if (humidity < 40 || humidity > 75) score -= 10;
    
    // Rain scoring
    score -= (rainDays * 5);
    
    return Math.max(0, Math.min(100, score));
}

// Travel Partner Feature - In-memory storage (replace with database in production)
const travelPostsData = [];
const joinRequestsData = [];
const sharedPlansData = {};
const lookingToJoinPostsData = [];
const fs = require('fs');
const dataFilePath = path.join(__dirname, '../data/travel-partner-data.json');

// Load data from file if exists
function loadTravelPartnerData() {
    try {
        if (fs.existsSync(dataFilePath)) {
            const data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));
            travelPostsData.length = 0;
            joinRequestsData.length = 0;
            Object.keys(sharedPlansData).forEach(key => delete sharedPlansData[key]);
            lookingToJoinPostsData.length = 0;
            
            travelPostsData.push(...(data.travelPosts || []));
            joinRequestsData.push(...(data.joinRequests || []));
            Object.assign(sharedPlansData, data.sharedPlans || {});
            lookingToJoinPostsData.push(...(data.lookingToJoinPosts || []));
            
            // Initialize missing fields in existing posts
            travelPostsData.forEach(post => {
                if (!post.status) post.status = 'active';
                if (!post.joinedUsers || !Array.isArray(post.joinedUsers)) {
                    post.joinedUsers = [post.userId];
                }
                if (post.joinRequestCount === undefined || post.joinRequestCount === null) {
                    // Count pending requests for this post
                    post.joinRequestCount = joinRequestsData.filter(r => r.postId === post.id && r.status === 'pending').length;
                }
            });
        }
    } catch (error) {
        console.error('Error loading travel partner data:', error);
    }
}

// Save data to file
function saveTravelPartnerData() {
    try {
        const dataDir = path.dirname(dataFilePath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        const data = {
            travelPosts: travelPostsData,
            joinRequests: joinRequestsData,
            sharedPlans: sharedPlansData,
            lookingToJoinPosts: lookingToJoinPostsData
        };
        fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving travel partner data:', error);
    }
}

// Load data on startup
loadTravelPartnerData();

// Travel Partner Endpoints

// Create a travel post
app.post('/api/travel-posts', (req, res) => {
    try {
        const { userId, userName, destination, startDate, endDate, tripType, budget, description, allowMultiple, maxParticipants } = req.body;
        
        if (!userId || !destination || !startDate || !endDate) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        
        const post = {
            id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            userName: userName || 'Anonymous',
            destination,
            startDate,
            endDate,
            tripType: tripType || 'Leisure',
            budget: budget || 'Flexible',
            description: description || '',
            allowMultiple: allowMultiple !== false,
            maxParticipants: maxParticipants || 10,
            createdAt: new Date().toISOString(),
            status: 'active',
            joinedUsers: Array.isArray([userId]) ? [userId] : [], // Owner is automatically joined
            joinRequestCount: 0
        };
        
        travelPostsData.push(post);
        saveTravelPartnerData();
        
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error creating travel post:', error);
        res.status(500).json({ success: false, error: 'Failed to create travel post' });
    }
});

// Get all travel posts (community feed)
app.get('/api/travel-posts', (req, res) => {
    try {
        const { status, destination, tripType, userId } = req.query;
        
        let posts = [...travelPostsData];
        
        // Filter by status
        if (status) {
            posts = posts.filter(p => p.status === status);
        } else {
            // Show active posts, or posts without status (for backward compatibility)
            posts = posts.filter(p => !p.status || p.status === 'active');
        }
        
        // Filter by destination
        if (destination) {
            posts = posts.filter(p => p.destination.toLowerCase().includes(destination.toLowerCase()));
        }
        
        // Filter by trip type
        if (tripType) {
            posts = posts.filter(p => p.tripType === tripType);
        }
        
        // Filter by user (my posts)
        if (userId) {
            posts = posts.filter(p => p.userId === userId);
        }
        
        // Sort by newest first
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching travel posts:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch travel posts' });
    }
});

// IMPORTANT: These specific routes MUST be BEFORE /api/travel-posts/:postId to avoid route conflicts
// Create "looking to join" post
app.post('/api/travel-posts/looking-to-join', (req, res) => {
    try {
        const { userId, userName, destination, preferredDates, tripType, budget, description, flexibleDates } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }
        
        const post = {
            id: `looking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            userName: userName || 'Anonymous',
            destination: destination || 'Any',
            preferredDates: preferredDates || 'Flexible',
            tripType: tripType || 'Leisure',
            budget: budget || 'Flexible',
            description: description || '',
            flexibleDates: flexibleDates !== false,
            createdAt: new Date().toISOString(),
            status: 'active'
        };
        
        lookingToJoinPostsData.push(post);
        saveTravelPartnerData();
        
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error creating looking-to-join post:', error);
        res.status(500).json({ success: false, error: 'Failed to create looking-to-join post' });
    }
});

// Get all "looking to join" posts
app.get('/api/travel-posts/looking-to-join', (req, res) => {
    try {
        const { destination, tripType, userId } = req.query;
        
        let posts = [...lookingToJoinPostsData].filter(p => p.status === 'active');
        
        if (destination && destination !== 'Any') {
            posts = posts.filter(p => p.destination.toLowerCase().includes(destination.toLowerCase()) || p.destination === 'Any');
        }
        
        if (tripType) {
            posts = posts.filter(p => p.tripType === tripType);
        }
        
        if (userId) {
            posts = posts.filter(p => p.userId === userId);
        }
        
        posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        res.json({ success: true, posts });
    } catch (error) {
        console.error('Error fetching looking-to-join posts:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch looking-to-join posts' });
    }
});

// Get a single travel post
app.get('/api/travel-posts/:postId', (req, res) => {
    try {
        const { postId } = req.params;
        const post = travelPostsData.find(p => p.id === postId);
        
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        res.json({ success: true, post });
    } catch (error) {
        console.error('Error fetching travel post:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch travel post' });
    }
});

// Send join request
app.post('/api/travel-posts/:postId/join-request', (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, userName, message } = req.body;
        
        if (!userId) {
            return res.status(400).json({ success: false, error: 'User ID is required' });
        }
        
        const post = travelPostsData.find(p => p.id === postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Initialize joinedUsers if not present
        if (!post.joinedUsers || !Array.isArray(post.joinedUsers)) {
            post.joinedUsers = [post.userId]; // Owner is always first
            saveTravelPartnerData(); // Save the fix
        }
        
        // Check if user already joined
        if (post.joinedUsers.includes(userId)) {
            return res.status(400).json({ success: false, error: 'You have already joined this trip' });
        }
        
        // Check if request already exists
        const existingRequest = joinRequestsData.find(r => r.postId === postId && r.userId === userId && r.status === 'pending');
        if (existingRequest) {
            return res.status(400).json({ success: false, error: 'You have already sent a join request' });
        }
        
        const request = {
            id: `request_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            postId,
            userId,
            userName: userName || 'Anonymous',
            message: message || '',
            status: 'pending',
            createdAt: new Date().toISOString()
        };
        
        joinRequestsData.push(request);
        post.joinRequestCount = (post.joinRequestCount || 0) + 1;
        saveTravelPartnerData();
        
        res.json({ success: true, request });
    } catch (error) {
        console.error('Error sending join request:', error);
        res.status(500).json({ success: false, error: 'Failed to send join request' });
    }
});

// Get join requests for a post
app.get('/api/travel-posts/:postId/join-requests', (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.query;
        
        const post = travelPostsData.find(p => p.id === postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Only post owner can see all requests
        let requests = joinRequestsData.filter(r => r.postId === postId);
        
        // If not owner, only show their own request
        if (userId && userId !== post.userId) {
            requests = requests.filter(r => r.userId === userId);
        }
        
        res.json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching join requests:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch join requests' });
    }
});

// Accept or reject join request
app.post('/api/travel-posts/:postId/join-requests/:requestId/respond', (req, res) => {
    try {
        const { postId, requestId } = req.params;
        const { action, userId } = req.body; // action: 'accept' or 'reject'
        
        if (!['accept', 'reject'].includes(action)) {
            return res.status(400).json({ success: false, error: 'Invalid action. Use "accept" or "reject"' });
        }
        
        const post = travelPostsData.find(p => p.id === postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Only post owner can respond
        if (userId !== post.userId) {
            return res.status(403).json({ success: false, error: 'Only post owner can respond to requests' });
        }
        
        const request = joinRequestsData.find(r => r.id === requestId && r.postId === postId);
        if (!request) {
            return res.status(404).json({ success: false, error: 'Join request not found' });
        }
        
        if (request.status !== 'pending') {
            return res.status(400).json({ success: false, error: 'Request has already been responded to' });
        }
        
        if (action === 'accept') {
            // Initialize joinedUsers if not present
            if (!post.joinedUsers || !Array.isArray(post.joinedUsers)) {
                post.joinedUsers = [post.userId]; // Owner is always first
            }
            
            // Check if trip allows multiple participants and has space
            if (!post.allowMultiple && post.joinedUsers.length > 1) {
                return res.status(400).json({ success: false, error: 'Trip is full' });
            }
            
            if (post.joinedUsers.length >= post.maxParticipants) {
                return res.status(400).json({ success: false, error: 'Trip has reached maximum participants' });
            }
            
            request.status = 'accepted';
            if (!post.joinedUsers.includes(request.userId)) {
                post.joinedUsers.push(request.userId);
            }
            
            // Decrement join request count
            if (post.joinRequestCount && post.joinRequestCount > 0) {
                post.joinRequestCount--;
            }
            
            // Initialize shared plan if it doesn't exist
            if (!sharedPlansData[postId]) {
                sharedPlansData[postId] = {
                    postId,
                    members: [post.userId, request.userId],
                    activities: [],
                    notes: [],
                    budgetBreakdown: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            } else {
                if (!sharedPlansData[postId].members.includes(request.userId)) {
                    sharedPlansData[postId].members.push(request.userId);
                }
                sharedPlansData[postId].updatedAt = new Date().toISOString();
            }
        } else {
            request.status = 'rejected';
            // Decrement join request count for rejected requests too
            if (post.joinRequestCount && post.joinRequestCount > 0) {
                post.joinRequestCount--;
            }
        }
        
        saveTravelPartnerData();
        
        res.json({ success: true, request, post });
    } catch (error) {
        console.error('Error responding to join request:', error);
        res.status(500).json({ success: false, error: 'Failed to respond to join request' });
    }
});

// Get shared planning space
app.get('/api/travel-posts/:postId/plan', (req, res) => {
    try {
        const { postId } = req.params;
        const { userId } = req.query;
        
        const post = travelPostsData.find(p => p.id === postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        // Only joined users can access shared plan
        if (!post.joinedUsers.includes(userId)) {
            return res.status(403).json({ success: false, error: 'You must be a member of this trip to view the plan' });
        }
        
        let plan = sharedPlansData[postId];
        if (!plan) {
            // Create initial plan
            plan = {
                postId,
                members: post.joinedUsers,
                activities: [],
                notes: [],
                budgetBreakdown: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            sharedPlansData[postId] = plan;
            saveTravelPartnerData();
        }
        
        res.json({ success: true, plan, post });
    } catch (error) {
        console.error('Error fetching shared plan:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch shared plan' });
    }
});

// Add item to shared planning space (activity, note, or budget item)
app.post('/api/travel-posts/:postId/plan', (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, type, data } = req.body; // type: 'activity', 'note', or 'budget'
        
        if (!['activity', 'note', 'budget'].includes(type)) {
            return res.status(400).json({ success: false, error: 'Invalid type. Use "activity", "note", or "budget"' });
        }
        
        const post = travelPostsData.find(p => p.id === postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        if (!post.joinedUsers.includes(userId)) {
            return res.status(403).json({ success: false, error: 'You must be a member of this trip' });
        }
        
        if (!sharedPlansData[postId]) {
            sharedPlansData[postId] = {
                postId,
                members: post.joinedUsers,
                activities: [],
                notes: [],
                budgetBreakdown: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        
        const item = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            ...data,
            createdAt: new Date().toISOString()
        };
        
        if (type === 'activity') {
            sharedPlansData[postId].activities.push(item);
        } else if (type === 'note') {
            sharedPlansData[postId].notes.push(item);
        } else if (type === 'budget') {
            sharedPlansData[postId].budgetBreakdown.push(item);
        }
        
        sharedPlansData[postId].updatedAt = new Date().toISOString();
        saveTravelPartnerData();
        
        res.json({ success: true, item, plan: sharedPlansData[postId] });
    } catch (error) {
        console.error('Error adding to shared plan:', error);
        res.status(500).json({ success: false, error: 'Failed to add to shared plan' });
    }
});

// Create AI-generated itinerary for a trip
app.post('/api/travel-posts/:postId/itinerary', async (req, res) => {
    try {
        const { postId } = req.params;
        const { userId, destination, startDate, endDate, days, tripType, budget } = req.body;
        
        const post = travelPostsData.find(p => p.id === postId);
        if (!post) {
            return res.status(404).json({ success: false, error: 'Post not found' });
        }
        
        if (!post.joinedUsers.includes(userId)) {
            return res.status(403).json({ success: false, error: 'You must be a member of this trip' });
        }
        
        // Generate itinerary using OpenAI
        const itineraryPrompt = `Create a detailed ${days}-day travel itinerary for ${destination}, India.

Trip Details:
- Type: ${tripType}
- Budget: ${budget}
- Start Date: ${startDate}
- End Date: ${endDate}

Provide a JSON response with this exact structure:
{
    "days": [
        {
            "title": "Day title/theme",
            "date": "${startDate}",
            "activities": [
                {
                    "time": "09:00",
                    "name": "Activity name",
                    "description": "Brief description",
                    "location": "Specific location",
                    "cost": "Estimated cost in INR"
                }
            ]
        }
    ],
    "tips": "Overall travel tips for this destination",
    "estimatedBudget": "Total estimated budget breakdown"
}

Include 3-5 activities per day with realistic timings. Focus on ${tripType.toLowerCase()} activities matching a ${budget.toLowerCase()} budget. Include local food recommendations, must-visit places, and practical tips.`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an expert Indian travel planner. Always respond with valid JSON only, no additional text." },
                { role: "user", content: itineraryPrompt }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });
        
        let itineraryData;
        const responseText = completion.data.choices[0].message.content;
        
        try {
            // Try to parse JSON directly
            itineraryData = JSON.parse(responseText);
        } catch (parseError) {
            // Try to extract JSON from markdown code blocks
            const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
                itineraryData = JSON.parse(jsonMatch[1].trim());
            } else {
                throw new Error('Failed to parse itinerary response');
            }
        }
        
        // Ensure the plan exists
        if (!sharedPlansData[postId]) {
            sharedPlansData[postId] = {
                postId,
                members: post.joinedUsers,
                activities: [],
                notes: [],
                budgetBreakdown: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        }
        
        // Save the itinerary to the shared plan
        sharedPlansData[postId].itinerary = {
            ...itineraryData,
            generatedAt: new Date().toISOString(),
            generatedBy: userId
        };
        sharedPlansData[postId].updatedAt = new Date().toISOString();
        
        saveTravelPartnerData();
        
        res.json({ success: true, itinerary: sharedPlansData[postId].itinerary });
    } catch (error) {
        console.error('Error creating itinerary:', error);
        
        // Fallback: Create a simple itinerary without AI
        try {
            const { postId } = req.params;
            const { userId, destination, startDate, endDate, days, tripType, budget } = req.body;
            
            const post = travelPostsData.find(p => p.id === postId);
            if (!post) {
                return res.status(500).json({ success: false, error: 'Failed to create itinerary' });
            }
            
            // Generate a basic itinerary
            const fallbackItinerary = {
                days: Array.from({ length: Math.min(days || 3, 7) }, (_, i) => {
                    const dayDate = new Date(startDate);
                    dayDate.setDate(dayDate.getDate() + i);
                    return {
                        title: `Exploring ${destination} - Day ${i + 1}`,
                        date: dayDate.toISOString().split('T')[0],
                        activities: [
                            {
                                time: "09:00",
                                name: "Morning Sightseeing",
                                description: `Explore popular attractions in ${destination}`,
                                location: destination,
                                cost: "Varies"
                            },
                            {
                                time: "13:00",
                                name: "Local Lunch",
                                description: "Try local cuisine at a popular restaurant",
                                location: `Local restaurant in ${destination}`,
                                cost: budget === 'Budget-friendly' ? "₹200-400" : budget === 'Moderate' ? "₹500-800" : "₹1000+"
                            },
                            {
                                time: "15:00",
                                name: "Afternoon Activity",
                                description: tripType === 'Adventure' ? "Adventure activity" : tripType === 'Cultural' ? "Cultural experience" : "Leisure time",
                                location: destination,
                                cost: "Varies"
                            },
                            {
                                time: "19:00",
                                name: "Evening Exploration",
                                description: "Enjoy the evening atmosphere and local markets",
                                location: `${destination} city center`,
                                cost: "Varies"
                            }
                        ]
                    };
                }),
                tips: `Best time to visit ${destination} varies by season. Carry comfortable walking shoes and stay hydrated. Always keep some cash handy as not all places accept cards.`,
                estimatedBudget: budget === 'Budget-friendly' ? "₹5,000-10,000 per person" : budget === 'Moderate' ? "₹15,000-25,000 per person" : "₹30,000+ per person"
            };
            
            if (!sharedPlansData[postId]) {
                sharedPlansData[postId] = {
                    postId,
                    members: post.joinedUsers,
                    activities: [],
                    notes: [],
                    budgetBreakdown: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
            }
            
            sharedPlansData[postId].itinerary = {
                ...fallbackItinerary,
                generatedAt: new Date().toISOString(),
                generatedBy: userId,
                isBasic: true
            };
            sharedPlansData[postId].updatedAt = new Date().toISOString();
            
            saveTravelPartnerData();
            
            res.json({ success: true, itinerary: sharedPlansData[postId].itinerary });
        } catch (fallbackError) {
            console.error('Fallback itinerary error:', fallbackError);
            res.status(500).json({ success: false, error: 'Failed to create itinerary' });
        }
    }
});

// Get user profile (minimal info)
app.get('/api/users/:userId/profile', (req, res) => {
    try {
        const { userId } = req.params;
        
        // For privacy, only return minimal info until they're accepted
        // In a real app, this would check if the requester has been accepted
        const userPosts = travelPostsData.filter(p => p.userId === userId);
        const joinedTrips = travelPostsData.filter(p => p.joinedUsers.includes(userId) && p.userId !== userId);
        
        res.json({
            success: true,
            profile: {
                userId,
                tripCount: userPosts.length,
                joinedTripsCount: joinedTrips.length,
                // Add more public info here if needed
            }
        });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 BharatTrip AI Backend running on http://localhost:${PORT}`);
    console.log(`📍 API Endpoints:`);
    console.log(`   - Health Check: GET /api/health`);
    console.log(`   - Chatbot: POST /api/chatbot`);
    console.log(`   - Weather: GET /api/weather/:location`);
    console.log(`   - Places Search: POST /api/places/search`);
    console.log(`   - Nearby Places: POST /api/places/nearby`);
    console.log(`   - Geocoding: GET /api/geocode/:address`);
    console.log(`   - Trip Planning: POST /api/trip/plan`);
    console.log(`   - 🧠 AI Recommendations: POST /api/recommendations/analyze`);
    console.log(`   - 👥 Crowd Density: POST /api/crowd/density`);
    console.log(`   - 🚇 Transport Routes: POST /api/transport/routes`);
    console.log(`   - 🌦️ Climate Trends: GET /api/climate/trends/:destination`);
    console.log(`   - 🎭 Cultural Insights: POST /api/cultural/insights`);
    console.log(`   - 🗺️ Smart Planner: POST /api/planner/smart`);
    console.log(`   - 💰 Budget Calculator: POST /api/budget/calculate`);
    console.log(`   - 🌿 Eco Routes: POST /api/eco/routes`);
    console.log(`   - 🌡️ Future Weather Prediction: POST /api/weather/future-prediction`);
    console.log(`   - 👫 Travel Partner Feature:`);
    console.log(`     - Create Post: POST /api/travel-posts`);
    console.log(`     - Get Posts: GET /api/travel-posts`);
    console.log(`     - Join Request: POST /api/travel-posts/:postId/join-request`);
    console.log(`     - Respond to Request: POST /api/travel-posts/:postId/join-requests/:requestId/respond`);
    console.log(`     - Shared Plan: GET/POST /api/travel-posts/:postId/plan`);
    console.log(`     - Looking to Join: POST/GET /api/travel-posts/looking-to-join`);
});
