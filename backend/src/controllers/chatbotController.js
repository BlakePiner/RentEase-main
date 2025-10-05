import fetch from 'node-fetch';

// Get OpenRouter API key from environment
const OPENROUTER_API_KEY = process.env.CHATBOT_API || process.env.OPENROUTER_API_KEY;

// Property filtering patterns and responses
const PROPERTY_FILTERS = {
  locations: ['cebu city', 'mandaue', 'lapu-lapu', 'talamban', 'lahug', 'banilad', 'ayala', 'it park'],
  // Only the 4 amenities available in the Browse Properties UI
  amenities: {
    'wifi': 'WiFi',
    'internet': 'WiFi',
    'wireless': 'WiFi',
    'air conditioning': 'Air Conditioning',
    'aircon': 'Air Conditioning',
    'ac': 'Air Conditioning',
    'air-conditioning': 'Air Conditioning',
    'security': '24/7 Security',
    '24/7 security': '24/7 Security',
    '24/7': '24/7 Security',
    'balcony': 'Balcony'
  },
  propertyTypes: ['apartment', 'condominium', 'condo', 'boarding house', 'single house', 'house'],
  priceRanges: {
    'budget': { min: 5000, max: 10000 },
    'affordable': { min: 8000, max: 15000 },
    'mid-range': { min: 12000, max: 25000 },
    'premium': { min: 20000, max: 50000 }
  }
};

// Function to detect property filtering intent and extract parameters
export function detectPropertyFilters(message) {
  const lowerMessage = message.toLowerCase();
  const filters = {
    search: null,
    location: null,
    amenities: [],
    propertyType: null,
    minPrice: null,
    maxPrice: null,
    hasPropertyIntent: false
  };

  // Check if message contains property-related keywords
  const propertyKeywords = ['property', 'properties', 'rental', 'apartment', 'condo', 'condominium', 'house', 'room', 'bedroom', 'br', 'studio', 'rent', 'lease', 'show', 'find', 'search', 'place', 'places', 'need', 'want', 'looking', 'looking for'];
  filters.hasPropertyIntent = propertyKeywords.some(keyword => lowerMessage.includes(keyword));

  if (!filters.hasPropertyIntent) {
    return filters;
  }

  // Extract location
  for (const location of PROPERTY_FILTERS.locations) {
    if (lowerMessage.includes(location)) {
      filters.location = location.charAt(0).toUpperCase() + location.slice(1);
      break;
    }
  }

  // Extract amenities - only the 4 available in Browse Properties UI
  for (const [variation, standardAmenity] of Object.entries(PROPERTY_FILTERS.amenities)) {
    // Use word boundary matching for better accuracy
    const regex = new RegExp(`\\b${variation.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lowerMessage)) {
      if (!filters.amenities.includes(standardAmenity)) {
        filters.amenities.push(standardAmenity);
        console.log(`✅ Detected amenity: "${variation}" -> "${standardAmenity}"`);
      }
    }
  }

  // Extract property type
  for (const type of PROPERTY_FILTERS.propertyTypes) {
    if (lowerMessage.includes(type)) {
      if (type === 'apartment') filters.propertyType = 'APARTMENT';
      else if (type === 'condominium' || type === 'condo') {
        // Handle both possible spellings in database
        filters.propertyType = 'CONDOMINIUM';
      }
      else if (type === 'boarding house') filters.propertyType = 'BOARDING_HOUSE';
      else if (type === 'single house' || type === 'house') filters.propertyType = 'SINGLE_HOUSE';
      console.log(`Detected property type: ${type} -> ${filters.propertyType}`);
      break;
    }
  }

  // Extract price information - only when explicitly mentioned with price keywords
  const priceKeywords = ['price', 'budget', 'cost', 'rent', 'peso', '₱', 'php', 'under', 'below', 'above', 'over', 'max', 'min', 'maximum', 'minimum'];
  const hasPriceContext = priceKeywords.some(keyword => lowerMessage.includes(keyword));
  
  console.log(`Price context check: hasPriceContext=${hasPriceContext}, message="${lowerMessage}"`);
  
  if (hasPriceContext) {
    const priceMatch = lowerMessage.match(/(\d+)(?:k|,000)?(?:\s*-\s*(\d+)(?:k|,000)?)?/);
    if (priceMatch) {
      const firstPrice = parseInt(priceMatch[1]);
      const minPrice = firstPrice < 1000 ? firstPrice * 1000 : firstPrice;
      filters.minPrice = minPrice;
      if (priceMatch[2]) {
        const secondPrice = parseInt(priceMatch[2]);
        const maxPrice = secondPrice < 1000 ? secondPrice * 1000 : secondPrice;
        filters.maxPrice = maxPrice;
      } else {
        // If only one price is mentioned, treat it as max price
        filters.maxPrice = minPrice;
        filters.minPrice = null;
      }
    }
  }

  // Check for price range keywords
  for (const [range, prices] of Object.entries(PROPERTY_FILTERS.priceRanges)) {
    if (lowerMessage.includes(range)) {
      filters.minPrice = prices.min;
      filters.maxPrice = prices.max;
      break;
    }
  }

  // Extract search terms - ONLY the text inside quotes
  // Look for text within single or double quotes
  const quotedMatch = message.match(/['"]([^'"]+)['"]/);
  if (quotedMatch) {
    const searchTerm = quotedMatch[1].trim();
    if (searchTerm.length > 0) {
      filters.search = searchTerm;
      console.log(`Extracted search term from quotes: "${searchTerm}"`);
    }
  }

  return filters;
}

export const handleChatbotMessage = async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        error: "Message is required" 
      });
    }

    // Detect property filtering intent
    const propertyFilters = detectPropertyFilters(message);
    console.log('Detected filters:', propertyFilters);

    // If no API key is configured, use smart fallback responses
    if (!OPENROUTER_API_KEY) {
      console.log("OpenRouter API key not found, using fallback responses");
      console.log("Environment variables:", {
        CHATBOT_API: process.env.CHATBOT_API ? "SET" : "NOT SET",
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ? "SET" : "NOT SET"
      });
      const fallbackResponse = generateSmartFallbackResponse(message, propertyFilters);
      return res.json({
        response: fallbackResponse,
        timestamp: new Date().toISOString(),
        filters: propertyFilters.hasPropertyIntent ? propertyFilters : null
      });
    }

    console.log("Using OpenRouter API with key:", OPENROUTER_API_KEY.substring(0, 10) + "...");

    // Create a system prompt that makes the AI a helpful general assistant
    const systemPrompt = `You are a helpful AI assistant for RentEase, a property rental platform. Answer questions directly and concisely. 

Key guidelines:
- Give direct, accurate answers to specific questions
- If asked about flag colors, just list the colors clearly
- If asked about a country's flag, focus on the flag, not general country information
- Keep responses relevant to what was actually asked
- Be conversational but stay on topic

For property-related questions:
- When users ask about finding properties, respond with helpful messages like "I'll help you find properties with those criteria!" or "Let me apply those filters for you!"
- If users want to search for a specific property name, suggest they put it in quotes like "Sample 2"
- Do NOT give instructions on how to use filters - the system will automatically apply them
- Be encouraging and confirm that you're helping them find properties
- Keep responses short and friendly

You can help with RentEase property search and general questions.`;

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
        const fallbackResponse = generateSmartFallbackResponse(message, propertyFilters);
        return res.json({
          response: fallbackResponse,
          timestamp: new Date().toISOString(),
          filters: propertyFilters.hasPropertyIntent ? propertyFilters : null
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
      timestamp: new Date().toISOString(),
      filters: propertyFilters.hasPropertyIntent ? propertyFilters : null
    });

  } catch (error) {
    console.error("Chatbot error:", error);
    
    // Detect property filters even in error case
    const propertyFilters = detectPropertyFilters(message);
    
    // Fallback response when API fails
    const fallbackResponses = [
      "I'm having trouble connecting right now. Try using the search filters above to find properties!",
      "Sorry, I'm experiencing technical difficulties. You can browse properties using the search and filter options on this page.",
      "I'm temporarily unavailable. Please use the location and amenity filters to find your perfect rental property."
    ];
    
    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.json({
      response: randomFallback,
      timestamp: new Date().toISOString(),
      filters: propertyFilters.hasPropertyIntent ? propertyFilters : null
    });
  }
};

// Smart fallback response generator when API is not available
function generateSmartFallbackResponse(message, propertyFilters = null) {
  const lowerMessage = message.toLowerCase();
  
  // If we detected property filters, provide a more specific response
  if (propertyFilters && propertyFilters.hasPropertyIntent) {
    let response = "I found some property search criteria in your message! ";
    
    if (propertyFilters.location) {
      response += `I'll help you find properties in ${propertyFilters.location}. `;
    }
    
    if (propertyFilters.amenities.length > 0) {
      response += `Looking for properties with ${propertyFilters.amenities.join(', ')}. `;
    }
    
    if (propertyFilters.propertyType) {
      response += `Searching for ${propertyFilters.propertyType.toLowerCase()} properties. `;
    }
    
    if (propertyFilters.minPrice || propertyFilters.maxPrice) {
      const priceRange = propertyFilters.minPrice && propertyFilters.maxPrice 
        ? `₱${propertyFilters.minPrice.toLocaleString()} - ₱${propertyFilters.maxPrice.toLocaleString()}`
        : propertyFilters.minPrice 
        ? `₱${propertyFilters.minPrice.toLocaleString()}+`
        : `up to ₱${propertyFilters.maxPrice.toLocaleString()}`;
      response += `Within your budget of ${priceRange}. `;
    }
    
    response += "I'll apply these filters to help you find the perfect property!";
    return response;
  }
  
  // Location-based responses
  if (lowerMessage.includes('cebu') || lowerMessage.includes('mandaue') || lowerMessage.includes('lapu-lapu')) {
    return "I'll help you find properties in that area! Let me apply the location filter for you.";
  }
  
  // Budget-based responses
  if (lowerMessage.includes('budget') || lowerMessage.includes('price') || lowerMessage.includes('₱') || lowerMessage.includes('peso')) {
    return "I'll help you find properties within your budget! Let me apply the price filter for you.";
  }
  
  // Room/bedroom responses
  if (lowerMessage.includes('bedroom') || lowerMessage.includes('br') || lowerMessage.includes('room') || lowerMessage.includes('studio')) {
    return "I'll help you find the right size property! Let me apply the appropriate filters for you.";
  }
  
  // Amenity-based responses - only for the 4 available amenities
  if (lowerMessage.includes('wifi') || lowerMessage.includes('air conditioning') || lowerMessage.includes('ac') || lowerMessage.includes('aircon') || lowerMessage.includes('security') || lowerMessage.includes('balcony')) {
    return "I'll help you find properties with those amenities! Let me apply the amenity filters for you.";
  }
  
  // Pet-related responses
  if (lowerMessage.includes('pet') || lowerMessage.includes('dog') || lowerMessage.includes('cat')) {
    return "I'll help you find pet-friendly properties! Let me apply the pet-friendly filter for you.";
  }
  
  // General property search responses
  if (lowerMessage.includes('property') || lowerMessage.includes('rental') || lowerMessage.includes('apartment') || lowerMessage.includes('house') || lowerMessage.includes('condo') || lowerMessage.includes('condominium')) {
    return "I'll help you find the perfect rental property! Let me apply the appropriate filters for you.";
  }
  
  // Help/greeting responses
  if (lowerMessage.includes('help') || lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hi there! I'm here to help you find your perfect rental property. Try asking me about specific locations like 'Cebu City', amenities like 'WiFi, Air Conditioning, 24/7 Security, or Balcony', or budget ranges. I'll automatically apply the filters for you!";
  }
  
  // Default response
  return "I'll help you find the perfect rental property! Let me apply the appropriate filters for you.";
}
