const openai = require('./openai-config');

// Function to generate alternative activities for an itinerary day
async function generateAlternatives(currentDay, currentActivities, destination = 'the location', preferences = {}) {
    try {
        const systemPrompt = `You are an expert Indian travel planner. When suggesting alternatives, consider:
        1. Local cultural experiences
        2. Weather-appropriate activities
        3. Tourist preferences
        4. Practical logistics
        5. Local recommendations
        
        Format your response as valid JSON with exactly 3 alternatives:
        {
          "alternatives": [
            {
              "title": "Short descriptive title",
              "description": "Detailed activity description",
              "reason": "Why this is a good alternative"
            }
          ]
        }`;

        const userPrompt = `Generate 3 alternative activities for Day ${currentDay} in ${destination}.
        Current plan: "${currentActivities}"
        User preferences: ${JSON.stringify(preferences)}
        
        Ensure alternatives:
        - Are distinctly different from current activities
        - Are actually available in ${destination}
        - Consider weather and seasonality
        - Match user preferences where possible`;

        const completion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.8,
            max_tokens: 1000
        });

        // Parse and validate the response
        let responseText = completion.data.choices[0].message.content.trim();
        let parsedResponse = JSON.parse(responseText);

        // Ensure proper structure and add IDs
        if (!parsedResponse.alternatives || !Array.isArray(parsedResponse.alternatives)) {
            throw new Error('Invalid response format');
        }

        const alternatives = parsedResponse.alternatives.map((alt, index) => ({
            id: index + 1,
            title: alt.title,
            description: alt.description,
            reason: alt.reason
        }));

        return {
            success: true,
            alternatives
        };

    } catch (error) {
        console.error('Generate alternatives error:', error);
        
        // Return fallback alternatives on error
        return {
            success: false,
            error: 'Failed to generate alternatives',
            alternatives: [
                {
                    id: 1,
                    title: "Local Cultural Experience",
                    description: "Immerse yourself in local traditions with a guided cultural tour, including traditional art demonstrations and local music.",
                    reason: "Get authentic insights into local culture"
                },
                {
                    id: 2,
                    title: "Adventure Activity",
                    description: "Enjoy outdoor activities like hiking, cycling, or local adventure sports suitable for the location.",
                    reason: "Active and engaging way to explore the area"
                },
                {
                    id: 3,
                    title: "Food and Market Tour",
                    description: "Explore local markets, try street food, and learn about regional cuisine with a food expert.",
                    reason: "Experience the destination through its flavors"
                }
            ]
        };
    }
}

module.exports = generateAlternatives;