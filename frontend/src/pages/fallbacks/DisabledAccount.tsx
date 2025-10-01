import { Link } from "react-router-dom";
import { Zap, Home, AlertTriangle, Lock, Mail, ArrowRight, FileText } from "lucide-react";
import { motion, type Variants } from "framer-motion";

const DisabledAccount = () => {
  // Floating animation for icons
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
        {/* Floating lock icons */}
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
            <Lock className="h-8 w-8 text-amber-400/40" />
          </motion.div>
        ))}

        {/* Floating warning triangles */}
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
            <AlertTriangle className="h-10 w-10 text-amber-300/30" />
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

      <div className="relative z-10 w-full max-w-4xl mx-auto">
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
        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
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
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="text-center mb-6">
                  <motion.div 
                    className="text-6xl font-bold bg-gradient-to-r from-amber-500 to-red-600 bg-clip-text text-transparent"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  >
                    Account Disabled
                  </motion.div>
                  <motion.div 
                    className="text-lg font-medium text-gray-600 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Due to policy violations
                  </motion.div>
                </div>
                
                {/* Lock illustration */}
                <div className="relative mx-auto w-48 h-48 flex items-center justify-center">
                  {/* Lock body */}
                  <div className="relative w-32 h-40 bg-red-400 rounded-lg rounded-t-3xl flex items-center justify-center">
                    {/* Lock keyhole */}
                    <div className="absolute top-8 w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="absolute top-11 w-2 h-6 bg-gray-200"></div>
                    
                    {/* Lock shackle */}
                    <div className="absolute -top-4 w-36 h-10 bg-red-500 rounded-t-full"></div>
                  </div>
                  
                  {/* Warning symbol */}
                  <motion.div 
                    className="absolute -top-6 -right-6 bg-amber-100 p-3 rounded-full border-2 border-amber-300"
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
                    <AlertTriangle className="h-8 w-8 text-amber-600" fill="currentColor" />
                  </motion.div>
                </div>
                
                {/* Floating icons */}
                <motion.div 
                  className="absolute -top-6 -left-6 bg-white p-3 rounded-full shadow-md border-2 border-amber-100"
                  variants={float(0)}
                  animate="animate"
                >
                  <FileText className="h-6 w-6 text-amber-500" />
                </motion.div>
                
                <motion.div 
                  className="absolute -bottom-4 -right-6 bg-white p-3 rounded-full shadow-md border-2 border-red-100"
                  variants={float(0.5)}
                  animate="animate"
                >
                  <Lock className="h-6 w-6 text-red-500" />
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Account Restricted
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Your RentEase account has been temporarily disabled due to violations of our community guidelines.
            </p>
            
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-6 text-left rounded">
              <p className="font-medium text-amber-800">Possible reasons:</p>
              <ul className="list-disc pl-5 mt-2 text-amber-700">
                <li>Multiple complaints from other users</li>
                <li>Violation of terms of service</li>
                <li>Suspicious activity detected</li>
                <li>Inappropriate content or behavior</li>
              </ul>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600">
                If you believe this is a mistake or would like to appeal this decision, please contact our support team with your account details.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <a
                  href="mailto:support@rentease.com"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-sky-600 text-white font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Mail className="h-5 w-5" />
                  Contact Support
                  <ArrowRight className="h-5 w-5" />
                </a>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 font-medium py-3 px-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <Home className="h-5 w-5" />
                  Return Home
                </Link>
              </motion.div>
            </div>
            
            <div className="mt-6 text-sm text-gray-500">
              <p>For more information, please review our <a href="#" className="text-sky-600 hover:underline">Community Guidelines</a> and <a href="#" className="text-sky-600 hover:underline">Terms of Service</a>.</p>
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
          <p>© {new Date().getFullYear()} RentEase - Find your perfect home</p>
        </motion.div>
      </div>
    </div>
  );
};

export default DisabledAccount;