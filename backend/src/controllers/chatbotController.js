import fetch from 'node-fetch';

// Get OpenRouter API key from environment
const OPENROUTER_API_KEY = process.env.CHATBOT_API || process.env.OPENROUTER_API_KEY;

export const handleChatbotMessage = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: "Message is required" 
      });
    }

    // If no API key is configured, use smart fallback responses
    if (!OPENROUTER_API_KEY) {
      console.log("OpenRouter API key not found, using fallback responses");
      console.log("Environment variables:", {
        CHATBOT_API: process.env.CHATBOT_API ? "SET" : "NOT SET",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "SET" : "NOT SET"
      });
      const fallbackResponse = generateSmartFallbackResponse(message);
      return res.json({
        response: fallbackResponse,
        timestamp: new Date().toISOString()
      });
    }

    console.log("Using OpenRouter API with key:", OPENROUTER_API_KEY.substring(0, 10) + "...");

    // Create a system prompt that makes the AI a helpful general assistant
    const systemPrompt = `You are a helpful AI assistant. Answer questions directly and concisely. 

Key guidelines:
- Give direct, accurate answers to specific questions
- If asked about flag colors, just list the colors clearly
- If asked about a country's flag, focus on the flag, not general country information
- Keep responses relevant to what was actually asked
- Be conversational but stay on topic

You can also help with RentEase property search if users ask about rental properties, but primarily act as a general-purpose AI assistant.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "https://rentease.com",
        "X-Title": "RentEase",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "deepseek/deepseek-chat-v3.1:free",
        "messages": [
          {
            "role": "system",
            "content": systemPrompt
          },
          ...conversationHistory,
          {
            "role": "user",
            "content": message
          }
        ],
        "temperature": 0.3,
        "max_tokens": 200
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API error:", response.status, errorText);
      
      // Handle rate limiting specifically
      if (response.status === 429) {
        console.log("Rate limit hit, using fallback response");
        const fallbackResponse = generateSmartFallbackResponse(message);
        return res.json({
          response: fallbackResponse,
          timestamp: new Date().toISOString()
        });
      }
      
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response format from OpenRouter API");
    }

    const aiResponse = data.choices[0].message.content;

    res.json({
      response: aiResponse,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    
    // Fallback response when API fails
    const fallbackResponses = [
      "I'm having trouble connecting right now. Try using the search filters above to find properties!",
      "Sorry, I'm experiencing technical difficulties. You can browse properties using the search and filter options on this page.",
      "I'm temporarily unavailable. Please use the location and amenity filters to find your perfect rental property."
    ];
    
    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.json({
      response: randomFallback,
      timestamp: new Date().toISOString()
    });
  }
};

// Smart fallback response generator when API is not available
function generateSmartFallbackResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  // Location-based responses
  if (lowerMessage.includes('cebu') || lowerMessage.includes('mandaue') || lowerMessage.includes('lapu-lapu')) {
    return "Great choice! I can help you find properties in that area. Try using the location filter above to search for 'Cebu City', 'Mandaue', or 'Lapu-Lapu City'. You can also specify your budget and preferred amenities!";
  }
  
  // Budget-based responses
  if (lowerMessage.includes('budget') || lowerMessage.includes('price') || lowerMessage.includes('₱') || lowerMessage.includes('peso')) {
    return "I'd be happy to help you find properties within your budget! Use the search filters above to browse by price range. Most properties range from ₱8,000 to ₱15,000 per month. What's your preferred budget range?";
  }
  
  // Room/bedroom responses
  if (lowerMessage.includes('bedroom') || lowerMessage.includes('br') || lowerMessage.includes('room') || lowerMessage.includes('studio')) {
    return "Perfect! I can help you find the right size property. Use the search filters to look for studios, 1BR, 2BR, or larger units. You can also filter by maximum occupancy to find the perfect fit for your needs.";
  }
  
  // Amenity-based responses
  if (lowerMessage.includes('wifi') || lowerMessage.includes('parking') || lowerMessage.includes('ac') || lowerMessage.includes('air conditioning') || lowerMessage.includes('furnished')) {
    return "Excellent! Those are popular amenities. Use the amenities filter above to search for 'WiFi', 'Parking Space', 'Air Conditioning', or 'Furnished' properties. You can combine multiple amenities to find your ideal rental!";
  }
  
  // Pet-related responses
  if (lowerMessage.includes('pet') || lowerMessage.includes('dog') || lowerMessage.includes('cat')) {
    return "Pet-friendly properties are available! Look for the 'Pet Friendly' amenity in the search filters. Many landlords welcome pets with a small additional deposit.";
  }
  
  // General property search responses
  if (lowerMessage.includes('property') || lowerMessage.includes('rental') || lowerMessage.includes('apartment') || lowerMessage.includes('house')) {
    return "I can help you find the perfect rental property! Use the search filters above to narrow down by location, amenities, and property type. You can search for apartments, condominiums, boarding houses, or single houses.";
  }
  
  // Help/greeting responses
  if (lowerMessage.includes('help') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hi there! I'm here to help you find your perfect rental property. Try asking me about specific locations like 'Cebu City', amenities like 'WiFi and parking', or budget ranges. You can also use the search filters above for more detailed searches!";
  }
  
  // Default response
  return "I understand you're looking for a rental property! Try using the search filters above to find properties by location, amenities, or property type. You can also ask me about specific features like '2BR with WiFi in Cebu City' and I'll guide you to the right filters!";
}
