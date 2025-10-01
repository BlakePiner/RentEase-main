import { motion } from "framer-motion";
import { ChevronRight, Search, Heart, Star, MapPin, Zap, Home as HomeIcon, Users, Calendar, ShieldCheck, Check, Smartphone, Key } from "lucide-react";

/* ****************** LANDING ****************** */
const Landing = () => {
  return (
    <div className="bg-gray-50">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
}

/* ****************** CTA SECTION ****************** */
const CTASection = () => {
  return (
    <section className="py-16 bg-gradient-to-r from-emerald-600 to-sky-600 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">
          Ready to Find Your Dream Rental?
        </h2>
        <p className="text-lg mb-10 max-w-2xl mx-auto">
          Join thousands of satisfied renters and start your journey today
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button className="px-6 py-3 bg-white text-emerald-600 rounded-xl font-bold shadow-md hover:shadow-lg transition-all">
            Get Started Now
          </button>
          <button className="px-6 py-3 bg-transparent border-2 border-white rounded-xl font-bold hover:bg-white/10 transition-all">
            <span className="flex items-center justify-center">
              Schedule a Demo <ChevronRight className="ml-2" size={20} />
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};


/* ****************** FEATURES SECTION ****************** */
const FeaturesSection = () => {
  const features = [
    { icon: Search, title: "Smart Search", desc: "AI-powered property matching" },
    { icon: Heart, title: "Save Favorites", desc: "Bookmark properties you love" },
    { icon: Star, title: "Verified Listings", desc: "100% authentic properties" },
    { icon: MapPin, title: "Neighborhood Insights", desc: "Know the area before you rent" },
  ];

  return (
    <section className="py-16 relative">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-r from-emerald-100 to-sky-100 blur-3xl opacity-40"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Why Choose <span className="text-emerald-600">RentEase</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Everything you need to find, tour, and secure your perfect rental
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
              whileHover={{ y: -10 }}
            >
              <div className="bg-emerald-50 p-3 rounded-lg inline-block mb-4">
                <feature.icon className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* ****************** HERO SECTION ****************** */
const HeroSection = () => {
  const stats = [
    { icon: HomeIcon, value: "50K+", label: "Verified Properties" },
    { icon: Users, value: "120+", label: "Cities Worldwide" },
    { icon: Calendar, value: "98%", label: "Satisfaction Rate" },
    { icon: ShieldCheck, value: "24/7", label: "Premium Support" }
  ];

  const features = [
    { icon: Check, text: "Instant booking confirmation" },
    { icon: Check, text: "Virtual property tours" },
    { icon: Check, text: "Smart search filters" },
    { icon: Check, text: "Secure payment system" }
  ];

  return (
    <section className="relative min-h-screen flex items-center py-16 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-emerald-300/20 to-sky-300/20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 60 + 10}px`,
              height: `${Math.random() * 60 + 10}px`,
            }}
            animate={{
              y: [0, (Math.random() - 0.5) * 80, 0],
              x: [0, (Math.random() - 0.5) * 80, 0],
              rotate: [0, 360],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Animated grid */}
        <div className="absolute inset-0 opacity-[3%]">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-3 bg-emerald-50 px-4 py-2 rounded-full mb-6">
              <motion.span
                animate={{ 
                  rotate: [0, 10, -10, 5, 0],
                  scale: [1, 1.1, 1.05, 1.08, 1],
                  transition: { 
                    duration: 1.5,
                    repeat: Infinity,
                    repeatType: "reverse" as const
                  }
                }}
              >
                <Zap className="w-6 h-6 text-emerald-600" fill="currentColor" />
              </motion.span>
              <span className="text-sm font-medium text-gray-700">
                The future of rental experience
              </span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-6">
              Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-sky-600">Dream Home</span> Without the Hassle
            </h1>
            
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto lg:mx-0">
              Discover thousands of verified properties, virtual tours, and move in with confidence. 
              The smart way to find your perfect space.
            </p>
            
            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 max-w-xl">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="bg-emerald-100 p-1.5 rounded-full mt-0.5">
                    <feature.icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">{feature.text}</span>
                </div>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
                className="px-7 py-4 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-xl font-bold text-lg text-white shadow-lg flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span>Explore Properties</span>
              </motion.button>
              <motion.button
                whileHover={{ 
                  scale: 1.05,
                  backgroundColor: "#f9fafb"
                }}
                whileTap={{ scale: 0.95 }}
                className="px-7 py-4 bg-white border border-gray-200 rounded-xl font-bold text-lg flex items-center gap-2"
              >
                <span>How It Works</span>
                <ChevronRight className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
          
          {/* Right Content - Property Card */}
          <div className="relative">
            <motion.div 
              className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-lg mx-auto border border-gray-100"
              animate={{
                y: [0, -15, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                repeatType: "reverse" as const,
                ease: "easeInOut"
              }}
            >
              {/* Property Image */}
              <div className="relative h-72 overflow-hidden">
                <div className="bg-gradient-to-br from-emerald-400/20 to-sky-500/30 absolute inset-0" />
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80')] bg-cover bg-center mix-blend-overlay" />
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <div className="bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    Verified
                  </div>
                  <div className="bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                    New Listing
                  </div>
                </div>
                
                {/* Price */}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">$1,850<span className="text-base font-normal">/mo</span></div>
                </div>
              </div>
              
              {/* Property Details */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Modern Downtown Loft</h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <MapPin className="w-4 h-4 mr-1.5" />
                      <span>Downtown, San Francisco</span>
                    </div>
                  </div>
                  <div className="flex items-center bg-amber-50 px-2 py-1 rounded">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="ml-1 text-amber-700 font-medium">4.9</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mb-5">
                  {["2 Beds", "2 Baths", "1200 sqft", "Parking"].map((item, i) => (
                    <div key={i} className="bg-gray-100 px-3 py-1.5 rounded-lg text-sm text-gray-700">
                      {item}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((item) => (
                      <div 
                        key={item} 
                        className="w-8 h-8 rounded-full border-2 border-white bg-gray-200"
                      />
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">12 people</span> viewed today
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Stats Grid */}
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mx-auto">
              {stats.map((stat, index) => (
                <motion.div 
                  key={index}
                  className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                  whileHover={{ y: -8, borderColor: "rgba(16, 185, 129, 0.3)" }}
                >
                  <div className="flex justify-center mb-3">
                    <div className="bg-gradient-to-r from-emerald-500 to-sky-500 p-2 rounded-lg">
                      <stat.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <p className="text-xl font-bold text-center text-gray-800">{stat.value}</p>
                  <p className="text-sm text-center text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ****************** HOW IT WORKS SECTION ****************** */
const HowItWorksSection = () => {
  const steps = [
    { icon: Search, title: "Search", desc: "Find properties that match your needs" },
    { icon: Heart, title: "Save", desc: "Shortlist your favorite options" },
    { icon: Smartphone, title: "Contact", desc: "Message owners directly" },
    { icon: Key, title: "Move In", desc: "Sign digitally and move in" },
  ];

  return (
    <section className="py-16 bg-gray-50 relative">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-gradient-to-r from-emerald-100 to-sky-100 blur-3xl opacity-30"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            How <span className="text-emerald-600">RentEase</span> Works
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Simple steps to find and secure your perfect rental
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div 
              key={index}
              className="bg-white p-6 rounded-2xl shadow-md border border-gray-100"
              whileHover={{ y: -5 }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="bg-emerald-500 rounded-full w-12 h-12 flex items-center justify-center text-white mb-4">
                  <span className="font-bold">{index + 1}</span>
                </div>
                <div className="bg-emerald-100 p-3 rounded-full mb-4">
                  <step.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};


export default Landing