import { Outlet, Link, NavLink, useLocation } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap, Home, Info, Sparkles, DollarSign, 
  Mail, Phone, MapPin, Heart, ShieldCheck,
  CreditCard, Headphones, Gift, Github, Youtube,
  Linkedin, Facebook, LogIn, UserPlus, Menu, X
} from "lucide-react";
import { useState } from "react";

/* ****************** PUBLIC LAYOUT  ****************** */
const PublicLayout = () => {
  return (
    <>
    <Navbar />
    <Outlet />
    <Footer />
    </>
  )
}

/* ****************** NAVBAR ****************** */
function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  // Active link check
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm sticky top-0 z-50 border-b border-emerald-100 shadow-sm">
      <nav className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo with simple fade-in */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center space-x-2">
            <Zap 
              className="w-7 h-7 md:w-8 md:h-8 text-teal-500" 
              fill="currentColor"
            />
            <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-emerald-600 via-sky-600 to-emerald-600 bg-clip-text text-transparent">
              RentEase
            </span>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-3 lg:gap-5 items-center text-sm font-medium">
          {/* Home */}
          <motion.div whileHover={{ y: -2 }}>
            <NavLink 
              to="/" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isActive("/") ? "text-emerald-600 font-semibold" : "text-gray-600 hover:text-emerald-600"
              }`}
            >
              <Home className="w-5 h-5" />
              Home
            </NavLink>
          </motion.div>
          
          {/* About */}
          <motion.div whileHover={{ y: -2 }}>
            <NavLink 
              to="/about" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isActive("/about") ? "text-emerald-600 font-semibold" : "text-gray-600 hover:text-emerald-600"
              }`}
            >
              <Info className="w-5 h-5" />
              About
            </NavLink>
          </motion.div>
          
          {/* Features - simplified without dropdown */}
          <motion.div whileHover={{ y: -2 }}>
            <NavLink 
              to="/features" 
              className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                isActive("/features") ? "text-emerald-600 font-semibold" : "text-gray-600 hover:text-emerald-600"
              }`}
            >
              <Zap className="w-5 h-5" />
              Features
            </NavLink>
          </motion.div>
          
          
          {/* Auth Buttons */}
          <div className="flex gap-2 ml-4">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <NavLink 
                to="/auth/login" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border border-emerald-500 text-emerald-600 hover:bg-emerald-50"
              >
                <LogIn className="w-4 h-4" />
                Login
              </NavLink>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <NavLink 
                to="/auth/register" 
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-emerald-600 to-sky-600 text-white hover:shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                Register
              </NavLink>
            </motion.div>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-emerald-50"
          onClick={toggleMenu}
          whileTap={{ scale: 0.95 }}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </motion.button>
      </nav>

      {/* Mobile Menu with slide animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-1 py-2 px-2 bg-white/90">
              {/* Home */}
              <motion.div
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <NavLink 
                  to="/" 
                  className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm ${
                    isActive("/") ? "text-emerald-600 font-semibold bg-emerald-50" : "text-gray-600"
                  }`}
                  onClick={closeMenu}
                >
                  <Home className="w-5 h-5" />
                  Home
                </NavLink>
              </motion.div>
              
              {/* About */}
              <motion.div
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <NavLink 
                  to="/about" 
                  className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm ${
                    isActive("/about") ? "text-emerald-600 font-semibold bg-emerald-50" : "text-gray-600"
                  }`}
                  onClick={closeMenu}
                >
                  <Info className="w-5 h-5" />
                  About
                </NavLink>
              </motion.div>
              
              {/* Features */}
              <motion.div
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <NavLink 
                  to="/features" 
                  className={`flex items-center gap-3 py-2 px-3 rounded-lg text-sm ${
                    isActive("/features") ? "text-emerald-600 font-semibold bg-emerald-50" : "text-gray-600"
                  }`}
                  onClick={closeMenu}
                >
                  <Zap className="w-5 h-5" />
                  Features
                </NavLink>
              </motion.div>
              
              
              {/* Auth Buttons */}
              <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-emerald-100">
                <motion.div
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <NavLink 
                    to="/auth/login" 
                    className="flex items-center gap-2 justify-center py-2 px-4 rounded-lg text-sm border border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                    onClick={closeMenu}
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </NavLink>
                </motion.div>
                <motion.div
                  initial={{ y: 10 }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <NavLink 
                    to="/auth/register" 
                    className="flex items-center gap-2 justify-center py-2 px-4 rounded-lg text-sm bg-gradient-to-r from-emerald-600 to-sky-600 text-white hover:shadow-md"
                    onClick={closeMenu}
                  >
                    <UserPlus className="w-4 h-4" />
                    Register
                  </NavLink>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ****************** FOOTER ****************** */
const Footer = () => {
  return (
    <motion.footer 
      className="bg-gradient-to-br from-emerald-950 to-sky-900 text-white pt-16 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-16">
          
          {/* **************************** BRAND COLUMN **************************** */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center">
              <Zap className="w-8 h-8 text-emerald-400 mr-3" fill="currentColor" />
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
                RentEase
              </span>
            </div>
            
            <p className="text-emerald-100/90 max-w-xs">
              Your trusted platform for seamless property rentals. Find your perfect space with ease and confidence.
            </p>
            
            <div className="flex space-x-4">
              {[
                { icon: Facebook, label: "Facebook" },
                { icon: Github, label: "GitHub" },
                { icon: Youtube, label: "YouTube" },
                { icon: Linkedin, label: "LinkedIn" },
              ].map((social, index) => (
                <a
                  key={index}
                  href="#"
                  className="bg-white/10 p-2 rounded-full hover:bg-emerald-500 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </motion.div>
          
          {/* **************************** QUICK LINKS **************************** */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-emerald-500 inline-block">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {[
                { icon: Home, label: "Home", path: "/" },
                { icon: Info, label: "About Us", path: "/about" },
                { icon: Sparkles, label: "Features", path: "/features" },
                { icon: DollarSign, label: "Pricing", path: "/pricing" },
              ].map((link, index) => (
                <li key={index}>
                  <a 
                    href={link.path} 
                    className="flex items-center text-emerald-100/90 hover:text-emerald-400 transition-colors"
                  >
                    <link.icon className="w-4 h-4 mr-3" />
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* **************************** CONTACT INFO **************************** */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-emerald-500 inline-block">
              Contact Us
            </h3>
            <ul className="space-y-4">
              {[
                { icon: MapPin, text: "123 Rental Street, Property City, PC 12345" },
                { icon: Phone, text: "+1 (555) 123-4567" },
                { icon: Mail, text: "support@rentease.com" },
              ].map((item, index) => (
                <li key={index} className="flex items-start">
                  <item.icon className="w-5 h-5 mr-3 mt-0.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-emerald-100/90">{item.text}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          
          {/* **************************** NEWSLETTER **************************** */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="text-xl font-bold mb-6 pb-2 border-b-2 border-emerald-500 inline-block">
              Newsletter
            </h3>
            <p className="text-emerald-100/90 mb-4">
              Subscribe to our newsletter for the latest updates and offers.
            </p>
            <form className="flex flex-col space-y-3">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                aria-label="Email address"
              />
              <button
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-sky-600 rounded-lg font-medium hover:shadow-lg transition-shadow"
              >
                Subscribe
              </button>
            </form>
          </motion.div>
        </div>
        
        {/* **************************** TRUST BADGES **************************** */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 border-t border-white/10 pt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {[
            { icon: ShieldCheck, title: "Secure Payments", desc: "SSL encrypted transactions" },
            { icon: CreditCard, title: "Flexible Payments", desc: "Multiple payment options" },
            { icon: Headphones, title: "24/7 Support", desc: "Always here to help" },
            { icon: Gift, title: "Special Offers", desc: "Exclusive member benefits" },
          ].map((item, index) => (
            <div 
              key={index}
              className="flex items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
            >
              <div className="bg-emerald-900/40 p-3 rounded-lg mr-4">
                <item.icon className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-bold">{item.title}</h4>
                <p className="text-sm text-emerald-100/80">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* **************************** COPYRIGHT **************************** */}
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-emerald-100/70 text-sm mb-4 md:mb-0">
            © {new Date().getFullYear()} RentEase. All rights reserved.
          </p>
          
          <div className="flex space-x-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item, index) => (
              <a
                key={index}
                href="#"
                className="text-emerald-100/70 text-sm hover:text-emerald-400 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </div>
        
        {/* **************************** MADE WITH LOVE **************************** */}
        <div className="flex justify-center mt-8 text-emerald-100/70 text-sm">
          Made with <Heart className="w-4 h-4 mx-1 text-red-500 fill-current" /> by RentEase Team
        </div>
      </div>
    </motion.footer>
  );
};




export default PublicLayout