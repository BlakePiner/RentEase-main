// Test script for OpenRouter API
import fetch from 'node-fetch';

const OPENROUTER_API_KEY = process.env.CHATBOT_API || "YOUR_API_KEY_HERE";

async function testChatbot() {
  try {
    console.log("Testing OpenRouter API...");
    
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
            "role": "user",
            "content": "What are the colors of Japan's flag?"
          }
        ]
      })
    });

    console.log("Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      return;
    }

    const data = await response.json();
    console.log("API Response:", JSON.stringify(data, null, 2));
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      console.log("AI Response:", data.choices[0].message.content);
    } else {
      console.log("No response content found");
    }

  } catch (error) {
    console.error("Error:", error.message);
  }
}

testChatbot();
