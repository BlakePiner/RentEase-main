import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { publicApi } from "@/api/axios";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatbotProps {
  className?: string;
}

const Chatbot = ({ className = "" }: ChatbotProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hi! I'm your AI assistant for RentEase. I can help you with general questions, property search guidance, or any other topics you'd like to discuss. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history (last 10 messages to avoid token limits)
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await publicApi.post("/chatbot", {
        message: message,
        conversationHistory: conversationHistory
      });

      const data = response.data;
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chatbot error:", error);
      toast.error("Sorry, I'm having trouble responding right now. Please try again.");
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm having trouble responding right now. Please try again or use the search filters above.",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickSuggestions = [
    "Help me find a 2 bedroom apartment",
    "What properties are available in Cebu City?",
    "Tell me about the rental process",
    "What amenities do you offer?",
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {isOpen ? (
        <Card className="w-96 h-[500px] shadow-2xl border-0 bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 to-sky-600 text-white p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Property Assistant</h3>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 h-80">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-1.5 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <div className="w-5 h-5 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-br-sm"
                      : "bg-white text-gray-900 rounded-bl-sm border border-gray-200"
                  }`}
                >
                  {message.content}
                </div>
                {message.role === "user" && (
                  <div className="w-5 h-5 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-2.5 h-2.5 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-1.5 justify-start">
                <div className="w-5 h-5 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-2.5 h-2.5 text-white" />
                </div>
                <div className="bg-white text-gray-900 rounded-lg rounded-bl-sm border border-gray-200 px-2.5 py-1.5 text-xs">
                  <div className="flex space-x-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Collapsible Quick Suggestions */}
          {messages.length <= 1 && (
            <div className="bg-white border-t border-gray-100">
              <button
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="w-full p-3 text-left text-xs text-emerald-600 hover:bg-emerald-50 transition-colors flex items-center justify-between"
              >
                <span>💡 Try asking</span>
                <span className={`transform transition-transform ${showSuggestions ? 'rotate-180' : ''}`}>
                  ▲
                </span>
              </button>
              {showSuggestions && (
                <div className="px-3 pb-3 space-y-1 border-t border-gray-100">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        handleSuggestionClick(suggestion);
                        setShowSuggestions(false);
                      }}
                      className="block w-full text-left text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-2 rounded transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                disabled={isLoading}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="sm"
                className="rounded-lg w-8 h-8 p-0 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 shadow-lg"
        >
          <MessageCircle className="w-5 h-5 text-white" />
        </Button>
      )}
    </div>
  );
};

export default Chatbot;
