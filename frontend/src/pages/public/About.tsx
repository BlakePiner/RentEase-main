import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Target, BookOpen, MapPin, TrendingUp, Users, Building} from "lucide-react";

/* ****************** ABOUT ****************** */
const About = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 md:px-6 md:py-12 bg-gradient-to-b from-blue-50/20 to-teal-50/20">
      <HeroSection />
      <RationaleSection />
      <ObjectivesSection />
      <ScopeSection />
      <SignificanceSection />
      <TeamSection />
      <CallToAction />
    </div>
  );
};

/* ****************** PUBLIC SECTION  ****************** */
const CallToAction = () => (
  <motion.section 
    className="text-center py-12 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3 }}
  >
    <h2 className="text-2xl font-bold mb-4">Ready to transform your rental experience?</h2>
    <p className="text-blue-100 max-w-2xl mx-auto mb-6">
      Join RentEase today and discover a better way to manage or find rental properties in Cebu City.
    </p>
    <div className="flex gap-4 justify-center">
      <Button
        className="bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        size="lg"
      >
        For Landlords
      </Button>
      <Button 
        variant="outline" 
        className="text-black border-white hover:bg-white/10"
        size="lg"
      >
        For Tenants
      </Button>
    </div>
  </motion.section>
);

/* ****************** HERO SECTION  ****************** */
const HeroSection = () => (
  <section className="text-center mb-16">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
        About RentEase
      </h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
        Transforming rental housing in Cebu City through digital innovation
      </p>
    </motion.div>
  </section>
);

/* ****************** OBJECTIVE SECTION ****************** */
const ObjectivesSection = () => (
  <section className="mb-16 relative max-w-7xl mx-auto px-4">
    {/* Decorative elements */}
    <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-xl" />
    
    <div className="relative z-10">
      <motion.div 
        className="flex items-center gap-3 mb-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
          <Target className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
          Objectives
        </h2>
      </motion.div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <Card className="p-6 bg-white dark:bg-gray-800 border-0 shadow-lg rounded-2xl overflow-hidden relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 opacity-80 z-0"></div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">General Objective</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300 flex-grow">
                To design, develop, and evaluate RentEase, an AI-powered rental management system 
                tailored for small- to mid-scale landlords and tenants in Cebu City.
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full blur opacity-30"></div>
                    <div className="relative bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-medium">
                      Comprehensive Solution
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-teal-500 text-white rounded-2xl shadow-xl overflow-hidden relative h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700/20 to-teal-600/20 z-0"></div>
            <div className="relative z-10 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                <h3 className="font-bold text-lg">Specific Objectives</h3>
              </div>
              
              <ul className="space-y-3 flex-grow">
                {[
                  "Identify current rental management pain points",
                  "Implement AI-powered property search",
                  "Develop landlord dashboard for rent tracking",
                  "Create maintenance request system",
                  "Enable digital lease agreement management",
                  "Implement secure payment processing",
                  "Design intuitive tenant portal"
                ].map((item, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + (i * 0.1) }}
                  >
                    <div className="flex-shrink-0 mt-1.5">
                      <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                    </div>
                    <span className="ml-3">{item}</span>
                  </motion.li>
                ))}
              </ul>
              
              <div className="mt-6 pt-4 border-t border-blue-400/30 flex justify-center">
                <div className="flex items-center gap-2 bg-blue-700/30 px-4 py-2 rounded-full">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">7 Key Objectives</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  </section>
);

/* ****************** RATIONALE SECTION  ****************** */
const RationaleSection = () => (
  <section className="mb-16 relative max-w-7xl mx-auto px-4">
    {/* Decorative elements */}
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-teal-400/10 rounded-full blur-xl" />
    
    <div className="relative z-10">
      <motion.div 
        className="flex items-center gap-3 mb-10"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full">
          <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
          Rationale of the Study
        </h2>
      </motion.div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: "spring" }}
        >
          <Card className="p-6 bg-white dark:bg-gray-800 border-0 shadow-lg rounded-2xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 opacity-80 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <h3 className="font-bold text-lg text-blue-600 dark:text-blue-400">The Problem</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">
                The rental housing sector in the Philippines relies heavily on inefficient, informal systems. 
                Manual processes lead to poor documentation, unclear accountability, and inconsistent rent tracking.
              </p>
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <ul className="space-y-2">
                  {[
                    "Handwritten receipts and ledgers",
                    "Inconsistent payment tracking",
                    "Poor communication channels",
                    "Limited property visibility"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                      </div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: "spring" }}
        >
          <Card className="p-6 bg-gradient-to-br from-blue-600 to-teal-500 text-white rounded-2xl shadow-xl overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700/20 to-teal-600/20 z-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-green-300 rounded-full"></div>
                <h3 className="font-bold text-lg">Our Solution</h3>
              </div>
              <p className="text-blue-100">
                RentEase bridges the gap with a lightweight, user-friendly platform featuring 
                AI-assisted property recommendations, integrated communication, and rent tracking tools.
              </p>
              
              <div className="mt-6 pt-4 border-t border-blue-400/30">
                <ul className="space-y-3">
                  {[
                    "AI-powered property matching",
                    "Digital lease agreements",
                    "Automated rent tracking",
                    "Maintenance request system",
                    "Integrated communication hub"
                  ].map((item, i) => (
                    <motion.li 
                      key={i} 
                      className="flex items-center"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + (i * 0.1) }}
                    >
                      <div className="flex-shrink-0">
                        <div className="w-2 h-2 bg-green-300 rounded-full"></div>
                      </div>
                      <span className="ml-3 font-medium">{item}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  </section>
);

/* ****************** SCOPE SECTION  ****************** */
const ScopeSection = () => (
  <section className="mb-16">
    <div className="flex items-center gap-3 mb-6">
      <MapPin className="h-8 w-8 text-teal-500" />
      <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
        Scope
      </h2>
    </div>
    
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="p-6 bg-white border-0 shadow-sm">
        <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-300">
          <li>Web-based platform focused on Cebu City</li>
          <li>User registration and property listing</li>
          <li>Manual rent tracking and lease monitoring</li>
          <li>AI chatbot for property search</li>
          <li>Maintenance request system</li>
        </ul>
      </Card>
    </motion.div>
  </section>
);

/* ****************** SIGNIFICANCE SECTION  ****************** */
interface SignificanceItem {
  title: string;
  icon: React.ReactNode;
  desc: string;
}

// Significance Section Component
const SignificanceSection = () => {
  const significanceItems: SignificanceItem[] = [
    {
      title: "For Landlords",
      icon: <Building className="w-6 h-6 text-blue-500" />,
      desc: "Reduces administrative burdens and improves oversight of rental properties"
    },
    {
      title: "For Tenants",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      desc: "Provides transparent property search and better communication"
    },
    {
      title: "For Cebu City",
      icon: <MapPin className="w-6 h-6 text-blue-500" />,
      desc: "Supports urban development goals through transparent rental management"
    }
  ];

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-8 w-8 text-teal-500" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
          Significance
        </h2>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {significanceItems.map((item, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          >
            <Card className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow h-full">
              <div className="flex items-center mb-3">
                <div className="p-2 bg-blue-50 rounded-lg mr-3">
                  {item.icon}
                </div>
                <h3 className="font-semibold text-blue-600">{item.title}</h3>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{item.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

/* ****************** TEAM SECTION  ****************** */
interface TeamMember {
  name: string;
  role: string;
  desc: string;
  bg: string;
}
// Team Section Component
const TeamSection = () => {
  const teamMembers: TeamMember[] = [
    {
      name: "Juan Dela Cruz",
      role: "Project Lead",
      desc: "Oversees system architecture and development roadmap",
      bg: "from-blue-500 to-teal-400"
    },
    {
      name: "Maria Santos",
      role: "AI Developer",
      desc: "Implements chatbot and recommendation algorithms",
      bg: "from-blue-600 to-teal-500"
    },
    {
      name: "Pedro Bautista",
      role: "UX Designer",
      desc: "Creates user-friendly interfaces for Filipino users",
      bg: "from-blue-400 to-teal-300"
    },
    {
      name: "Ana Reyes",
      role: "Researcher",
      desc: "Conducts user studies and market analysis",
      bg: "from-blue-500 to-teal-400"
    }
  ];

  return (
    <section className="mb-16">
      <div className="flex items-center gap-3 mb-6">
        <Users className="h-8 w-8 text-teal-500" />
        <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
          Our Team
        </h2>
      </div>
      
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teamMembers.map((member, index) => (
          <motion.div 
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            whileHover={{ y: -5 }}
          >
            <Card className="p-6 text-center h-full border-0 overflow-hidden relative group">
              <div className={`absolute inset-0 bg-gradient-to-r ${member.bg} opacity-10 group-hover:opacity-20 transition-opacity`} />
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-100 to-teal-100 mb-4 relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center text-blue-500">
                  <Users className="w-10 h-10" />
                </div>
              </div>
              <h3 className="font-semibold text-blue-800">{member.name}</h3>
              <p className="text-gray-600 dark:text-gray-400">{member.role}</p>
              <p className="text-sm text-gray-500 mt-2">{member.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
};


export default About;