import { Link } from "react-router-dom";
import { Zap, Home, Lock, Shield, AlertTriangle, ArrowRight, KeyIcon, DoorOpen, DoorClosed } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useState } from "react";

const Unauthorized = () => {
  const [isKnocking, setIsKnocking] = useState(false);

// Fixed animations
const bounce = (): Variants => ({
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
});

const knock = (): Variants => ({
  animate: {
    x: [0, -5, 5, -3, 3, 0],
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
});

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

  const handleKnock = () => {
    setIsKnocking(true);
    setTimeout(() => setIsKnocking(false), 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Floating locks */}
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
            <Lock className="h-8 w-8 text-purple-400/40" />
          </motion.div>
        ))}

        {/* Floating shields */}
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
            <Shield className="h-10 w-10 text-blue-300/30" />
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
            className="flex items-center gap-2 text-lg font-bold text-blue-700"
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
              <Zap className="h-8 w-8 text-purple-500" fill="currentColor" />
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
                className="relative bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100"
                variants={bounce()}
                animate="animate"
              >
                <div className="text-center mb-6">
                  <motion.div 
                    className="text-9xl font-bold bg-gradient-to-r from-purple-500 to-blue-600 bg-clip-text text-transparent"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    401
                  </motion.div>
                  <motion.div 
                    className="text-lg font-medium text-gray-600 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Access Denied
                  </motion.div>
                </div>
                
                {/* Door illustration */}
                <div className="relative mx-auto w-48 h-48 flex items-end justify-center">
                  {/* Door */}
                  <div className="absolute bottom-0 w-32 h-40 bg-amber-700 rounded-md"></div>
                  
                  {/* Door handle */}
                  <div className="absolute bottom-20 right-8 w-4 h-4 bg-yellow-400 rounded-full"></div>
                  
                  {/* Character trying to enter */}
                  <div className="absolute bottom-5 left-4">
                    {/* Character body */}
                    <div className="w-10 h-16 bg-blue-400 rounded-t-full"></div>
                    
                    {/* Character head */}
                    <div className="absolute -top-6 left-0 w-10 h-10 bg-blue-300 rounded-full"></div>
                    
                    {/* Eyes */}
                    <div className="absolute -top-4 left-2 w-2 h-2 bg-white rounded-full"></div>
                    <div className="absolute -top-4 right-2 w-2 h-2 bg-white rounded-full"></div>
                    
                    {/* Pupils */}
                    <div className="absolute -top-4 left-3 w-1 h-1 bg-black rounded-full"></div>
                    <div className="absolute -top-4 right-3 w-1 h-1 bg-black rounded-full"></div>
                    
                    {/* Mouth - surprised */}
                    <div className="absolute -top-1 left-4 w-2 h-2 bg-black rounded-full"></div>
                    
                    {/* Arms - knocking */}
                    <motion.div 
                      className="absolute top-4 -left-4 w-6 h-3 bg-blue-400 rounded-full"
                      variants={knock()}
                      animate={isKnocking ? "animate" : ""}
                    >
                    </motion.div>
                  </div>
                  
                  {/* "No Entry" sign */}
                  <motion.div 
                    className="absolute -top-8 right-2 bg-white p-2 rounded-full shadow-md border-2 border-red-200"
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
                    <AlertTriangle className="h-6 w-6 text-red-500" fill="currentColor" />
                  </motion.div>
                </div>
                
                {/* Floating security items */}
                <motion.div 
                  className="absolute -top-6 -left-6 bg-white p-3 rounded-full shadow-md border-2 border-purple-100"
                  variants={float(0)}
                  animate="animate"
                >
                  <Lock className="h-6 w-6 text-purple-500" />
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-4 -right-6 bg-white p-3 rounded-full shadow-md border-2 border-blue-100"
                  variants={float(0.5)}
                  animate="animate"
                >
                  <Shield className="h-6 w-6 text-blue-500" />
                </motion.div>
                
                <motion.div 
                  className="absolute top-1/2 -left-8 bg-white p-3 rounded-full shadow-md border-2 border-purple-100"
                  variants={float(0.7)}
                  animate="animate"
                >
                  <KeyIcon className="h-6 w-6 text-purple-400" />
                </motion.div>
                
                <motion.div 
                  className="absolute top-1/4 -right-8 bg-white p-3 rounded-full shadow-md border-2 border-blue-100"
                  variants={float(1)}
                  animate="animate"
                >
                  <DoorClosed className="h-6 w-6 text-blue-400" />
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
              Whoa there, stranger!
            </h1>
            <p className="text-lg text-gray-600 mb-2">
              Looks like you've stumbled upon the VIP section without the secret handshake.
            </p>
            <p className="text-gray-500 mb-6">
              Our digital bouncer is pretty strict about who gets to see this content. 
              Maybe you forgot the password? Or perhaps you need to show your credentials?
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500 to-blue-600 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Home className="h-5 w-5" />
                  Back to Safety
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <button
                  onClick={handleKnock}
                  className="inline-flex items-center gap-2 bg-white text-purple-600 border border-purple-200 font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <DoorOpen className="h-5 w-5" />
                  Try Knocking
                </button>
              </motion.div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-800 mb-2">Did You Know?</h3>
              <p className="text-sm text-blue-600">
                In the digital world, doors don't have peepholes. Our security guard is a very 
                strict algorithm that doesn't accept cookies as bribes.
              </p>
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
          <p>Error 401: You shall not pass! (Without proper credentials)</p>
          <p className="mt-1">© {new Date().getFullYear()} RentEase - Find your perfect home</p>
        </motion.div>
      </div>
    </div>
  );
};

export default Unauthorized;