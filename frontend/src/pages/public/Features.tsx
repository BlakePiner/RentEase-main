import { motion } from "framer-motion";
import { Zap, Calendar, Shield, Headphones, Star } from "lucide-react";

export default function Features() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <Zap className="w-10 h-10 mr-3" fill="white" />
            <h1 className="text-4xl md:text-5xl font-bold">Powerful Features</h1>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-xl max-w-3xl mx-auto mt-4"
          >
            Discover how our platform makes property rental effortless, secure, and enjoyable
          </motion.p>
        </div>
      </section>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureSection 
            icon={<Calendar className="w-10 h-10 text-teal-500" />}
            title="Easy Booking"
            description="Book properties in seconds with our intuitive interface. Real-time availability and instant confirmations."
          />
          
          <FeatureSection 
            icon={<Shield className="w-10 h-10 text-teal-500" />}
            title="Secure Payments"
            description="Encrypted transactions with multiple payment options. Your financial data is always protected."
          />
          
          <FeatureSection 
            icon={<Headphones className="w-10 h-10 text-teal-500" />}
            title="24/7 Support"
            description="Our dedicated team is always available to assist you with any questions or issues."
          />
          
          <FeatureSection 
            icon={<Star className="w-10 h-10 text-teal-500" />}
            title="Verified Listings"
            description="Every property is personally verified to ensure quality and accuracy."
          />
          
          <FeatureSection 
            icon={<Zap className="w-10 h-10 text-teal-500" />}
            title="Smart Recommendations"
            description="Personalized suggestions based on your preferences and booking history."
          />
          
          <FeatureSection 
            icon={<div className="text-2xl font-bold text-teal-500">$</div>}
            title="No Hidden Fees"
            description="Transparent pricing with all costs shown upfront. What you see is what you pay."
          />
        </div>
      </div>

      {/* Testimonial Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">What Our Users Say</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Testimonial 
              quote="This platform saved me hours of searching. Found my perfect apartment in minutes!"
              author="Sarah Johnson"
              role="Frequent Traveler"
            />
            
            <Testimonial 
              quote="The booking process is incredibly smooth. I've never experienced anything like it."
              author="Michael Chen"
              role="Property Owner"
            />
            
            <Testimonial 
              quote="24/7 support actually means 24/7! They helped me at 3 AM when I locked myself out."
              author="Emma Rodriguez"
              role="Digital Nomad"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-500 to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Experience the Future of Rentals?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied users and make your next rental experience effortless
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 bg-white text-teal-600 font-bold rounded-full text-lg shadow-lg"
          >
            Get Started Now
          </motion.button>
        </div>
      </section>
    </div>
  );
}

// Feature Section Component
function FeatureSection({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -10 }}
      className="bg-white p-8 rounded-xl shadow-md border border-gray-100"
    >
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
}

// Testimonial Component
function Testimonial({ quote, author, role }: { 
  quote: string; 
  author: string; 
  role: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="bg-white p-6 rounded-lg shadow-sm"
    >
      <div className="flex items-center mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
        ))}
      </div>
      <p className="text-gray-700 italic mb-4">"{quote}"</p>
      <div>
        <p className="font-semibold">{author}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>
    </motion.div>
  );
}