import { Link } from "react-router-dom";
import { Zap, Home, Map, Key, ArrowRight, Search, Smile, Frown } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useState } from "react";

const NotFound = () => {
  const [isHappy, setIsHappy] = useState(false);

  // Bounce animation for the character
  const bounce: Variants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Floating animation for rental items
  const float = (delay: number): Variants => ({
    animate: {
      y: [0, -15, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Floating keys */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, (Math.random() - 0.5) * 60, 0],
              x: [0, (Math.random() - 0.5) * 40, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: Math.random() * 15 + 15,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Key className="h-8 w-8 text-amber-400/40" />
          </motion.div>
        ))}

        {/* Floating houses */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, (Math.random() - 0.5) * 40, 0],
              x: [0, (Math.random() - 0.5) * 30, 0],
            }}
            transition={{
              duration: Math.random() * 12 + 12,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          >
            <Home className="h-10 w-10 text-sky-300/30" />
          </motion.div>
        ))}

        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[2%]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern
              id="grid"
              width="80"
              height="80"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 80 0 L 0 0 0 80"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto">
        {/* Header with logo */}
        <motion.div 
          className="flex justify-center mb-8 md:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link
            to="/"
            className="flex items-center gap-2 text-lg font-bold text-sky-700"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 5
              }}
            >
              <Zap className="h-8 w-8 text-amber-500" fill="currentColor" />
            </motion.div>
            <span className="text-2xl">RentEase</span>
          </Link>
        </motion.div>

        {/* Main content */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {/* Illustration section */}
          <motion.div 
            className="relative flex-1 flex justify-center"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="relative">
              {/* Main illustration container */}
              <motion.div 
                className="relative bg-white p-8 rounded-2xl shadow-lg border-2 border-amber-100"
                variants={bounce}
                animate="animate"
              >
                <div className="text-center mb-6">
                  <motion.div 
                    className="text-9xl font-bold bg-gradient-to-r from-amber-500 to-sky-600 bg-clip-text text-transparent"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    404
                  </motion.div>
                  <motion.div 
                    className="text-lg font-medium text-gray-600 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Page not found
                  </motion.div>
                </div>
                
                {/* Character illustration */}
                <div className="relative mx-auto w-48 h-48 flex items-end justify-center">
                  {/* Character body */}
                  <div className="absolute bottom-0 w-32 h-40 bg-sky-400 rounded-t-full"></div>
                  
                  {/* Character head */}
                  <div className="absolute bottom-32 w-36 h-36 bg-sky-300 rounded-full"></div>
                  
                  {/* Eyes */}
                  <div className="absolute bottom-44 left-16 w-6 h-6 bg-white rounded-full"></div>
                  <div className="absolute bottom-44 right-16 w-6 h-6 bg-white rounded-full"></div>
                  
                  {/* Pupils */}
                  <div className="absolute bottom-44 left-18 w-3 h-3 bg-black rounded-full"></div>
                  <div className="absolute bottom-44 right-18 w-3 h-3 bg-black rounded-full"></div>
                  
                  {/* Mouth */}
                  <div className="absolute bottom-36 left-1/2 transform -translate-x-1/2">
                    {isHappy ? (
                      <svg width="40" height="20" viewBox="0 0 40 20">
                        <motion.path
                          d="M 5,15 Q 20,30 35,15"
                          fill="none"
                          stroke="#fc6b6b"
                          strokeWidth="3"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      </svg>
                    ) : (
                      <svg width="40" height="20" viewBox="0 0 40 20">
                        <motion.path
                          d="M 5,10 Q 20,0 35,10"
                          fill="none"
                          stroke="#fc6b6b"
                          strokeWidth="3"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.5 }}
                        />
                      </svg>
                    )}
                  </div>
                  
                  {/* Arms */}
                  <div className="absolute bottom-28 left-2 w-6 h-16 bg-sky-400 rounded-full transform -rotate-45"></div>
                  <div className="absolute bottom-28 right-2 w-6 h-16 bg-sky-400 rounded-full transform rotate-45"></div>
                  
                  {/* Question mark bubble */}
                  <motion.div 
                    className="absolute -top-8 -right-4 bg-white p-3 rounded-full shadow-md border-2 border-amber-200"
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3
                    }}
                  >
                    <div className="text-2xl font-bold text-amber-500">?</div>
                  </motion.div>
                </div>
                
                {/* Floating rental items */}
                <motion.div 
                  className="absolute -top-6 -left-6 bg-white p-3 rounded-full shadow-md border-2 border-amber-100"
                  variants={float(0)}
                  animate="animate"
                >
                  <Key className="h-6 w-6 text-amber-500" />
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-4 -right-6 bg-white p-3 rounded-full shadow-md border-2 border-sky-100"
                  variants={float(0.5)}
                  animate="animate"
                >
                  <Home className="h-6 w-6 text-sky-500" />
                </motion.div>
                
                <motion.div 
                  className="absolute top-1/2 -left-8 bg-white p-3 rounded-full shadow-md border-2 border-amber-100"
                  variants={float(0.7)}
                  animate="animate"
                >
                  <Map className="h-6 w-6 text-amber-400" />
                </motion.div>
                
                <motion.div 
                  className="absolute top-1/4 -right-8 bg-white p-3 rounded-full shadow-md border-2 border-sky-100"
                  variants={float(1)}
                  animate="animate"
                >
                  <Search className="h-6 w-6 text-sky-400" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Message section */}
          <motion.div 
            className="flex-1 text-center md:text-left max-w-md"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              Oops! We're a bit lost...
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Looks like this page has gone out for a rental viewing and forgot to leave a forwarding address!
            </p>
            <p className="text-gray-500 mb-8">
              Don't worry though - our friendly rental assistant is here to help you find your way back to amazing properties!
            </p>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-sky-600 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Home className="h-5 w-5" />
                Back to Home
                <ArrowRight className="h-5 w-5" />
              </Link>
            </motion.div>
            
            <div className="mt-8 flex justify-center md:justify-start">
              <button 
                onClick={() => setIsHappy(!isHappy)}
                className="text-sm text-gray-500 hover:text-amber-600 transition-colors flex items-center gap-1"
              >
                {isHappy ? (
                  <>
                    <Frown className="h-4 w-4" />
                    Make our assistant confused again
                  </>
                ) : (
                  <>
                    <Smile className="h-4 w-4" />
                    Cheer up our rental assistant
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.div 
          className="mt-16 text-center text-gray-400 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p>Error 404: The page you're looking for is currently unavailable</p>
          <p className="mt-1">© {new Date().getFullYear()} RentEase - Find your perfect home</p>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;