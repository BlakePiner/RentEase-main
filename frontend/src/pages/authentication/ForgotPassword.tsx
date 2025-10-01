import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Sparkles, Zap, CheckCircle } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { forgotPasswordRequest } from "@/api/authApi";
import { toast } from "sonner";

const ForgotPassword = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, when: "beforeChildren" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle floating blobs (distinct from login/register) */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-br from-emerald-300/20 to-sky-300/20"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 36 + 12}px`,
              height: `${Math.random() * 36 + 12}px`,
              filter: "blur(4px)",
            }}
            animate={{
              y: [0, (Math.random() - 0.5) * 50, 0],
              x: [0, (Math.random() - 0.5) * 50, 0],
              scale: [1, 1.08, 1],
            }}
            transition={{ duration: Math.random() * 8 + 8, repeat: Infinity }}
          />
        ))}
      </div>

      <motion.div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden z-10 flex flex-col md:flex-row"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Left decorative rail - unique layout */}
        <div className="hidden md:flex md:w-[40%] bg-gradient-to-b from-emerald-600 to-sky-600 text-white p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Sparkles className="w-full h-full" />
          </div>
          <div className="relative z-10 self-center">
            <h2 className="text-xl font-semibold mb-2">Forgot Password</h2>
            <p className="text-emerald-100 text-sm">
              We'll send you a secure link
            </p>
          </div>
        </div>

        {/* Right content */}
        <div className="md:w-[60%] p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 transition-colors"
            >
              <motion.div
                whileHover={{
                  rotate: [0, -10, 10, 0],
                  transition: { duration: 0.4 },
                }}
              >
                <Zap className="h-5 w-5 text-emerald-500" fill="currentColor" />
              </motion.div>
              Back to home
            </Link>
          </div>
          
          <ForgotPasswordForm />
        </div>
      </motion.div>
    </div>
  );
};

const ForgotPasswordForm = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await forgotPasswordRequest({ email });
      toast.success(res.data.message || "Check your email for the reset link");
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full mb-6">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Check your email
        </h2>
        <p className="text-gray-600 mb-6">
          We've sent a password reset link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          If you don't see the email, check your spam folder.
        </p>
        <div className="text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link
            to="/auth/login"
            className="text-emerald-600 hover:text-emerald-800 font-medium"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2 mb-6"
      >
        <p className="text-gray-800 text-lg font-medium">
          Reset your password
        </p>
        <p className="text-gray-500 text-sm">
          Enter the email associated with your account. We will send a
          secure link to reset your password.
        </p>
      </motion.div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all text-sm shadow-sm"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          className="w-full bg-gradient-to-r from-emerald-600 to-sky-600 text-white py-3 px-4 rounded-xl font-medium hover:from-emerald-700 hover:to-sky-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Sending..." : "Send reset link"}
        </motion.button>

        <div className="text-center text-xs text-gray-500 pt-2">
          Remember your password?{" "}
          <Link
            to="/auth/login"
            className="text-emerald-600 hover:text-emerald-800 font-medium"
          >
            Sign in
          </Link>
        </div>
      </form>
    </>
  );
};

export default ForgotPassword;