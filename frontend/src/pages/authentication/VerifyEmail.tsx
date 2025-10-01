import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { MailCheck, Zap, Sparkles } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { toast } from "sonner";
import { getUserInfoRequest, resendVerificationRequest, verifyEmailRequest } from "@/api/authApi";

const RESEND_COOLDOWN_SECONDS = 60;

const VerifyEmail = () => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.12, when: "beforeChildren" },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-sky-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating subtle blobs */}
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
        {/* Left rail */}
        <div className="hidden md:flex md:w-[40%] bg-gradient-to-b from-emerald-600 to-sky-600 text-white p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Sparkles className="w-full h-full" />
          </div>
          <div className="relative z-10 self-center text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
              <MailCheck className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Verify Email</h2>
            <p className="text-emerald-100 text-sm">Enter the 6‑digit code</p>
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

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2 mb-6"
          >
            <p className="text-gray-800 text-lg font-medium">
              Check your email
            </p>
            <p className="text-gray-500 text-sm">
              We sent a 6‑digit verification code to your email. Enter it below
              to verify your account.
            </p>
          </motion.div>

          <VerifyEmailForm />
        </div>
      </motion.div>
    </div>
  );
};

const VerifyEmailForm = () => {
  const { token } = useParams<{ token?: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Extract value after "token=" if present
  const isValidToken = token && token.length === 32;

  if (!isValidToken) {
    return <Navigate to="*" replace />;
  }

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [resendSecondsLeft, setResendSecondsLeft] = useState<number>(
    RESEND_COOLDOWN_SECONDS
  );
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => {
      setResendSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const onChangeDigit = (index: number, value: string) => {
    const next = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = next;
    setDigits(updated);

    if (next && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const onKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0)
      inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < 5)
      inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      e.preventDefault();
      const updated = Array(6)
        .fill("")
        .map((_, i) => text[i] || "");
      setDigits(updated);
      const nextIndex = Math.min(text.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const otp = digits.join("");
  const isComplete = otp.length === 6 && digits.every((d) => d !== "");

const onSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!isComplete || !token) return;

  setLoading(true);

  try {
    const res = await verifyEmailRequest({ token, otp });
    toast.success("Email verified successfully!");

    if (res.data.context === "register") {
      // ✅ Registration flow → go to login
      navigate("/auth/login");
    } else if (res.data.context === "login") {
      // ✅ Login flow → fetch user info first
      const userRes = await getUserInfoRequest();
      const { role, hasSeenOnboarding } = userRes.data.user;

      // 🔑 Check onboarding status before routing
      if (!hasSeenOnboarding) {
        navigate("/auth/onboarding");
        return;
      }

      switch (role) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "LANDLORD":
          navigate("/landlord");
          break;
        case "TENANT":
          navigate("/tenant");
          break;
        default:
          navigate("/");
      }
    }
  } catch (err: any) {
    toast.error(err.response?.data?.message || "Invalid or expired code");
  } finally {
    setLoading(false);
  }
};


  const resend = async () => {
    if (resendSecondsLeft > 0 || !token) return;

    setResendLoading(true);
    try {
      await resendVerificationRequest({ token });
      toast.info("A new verification code has been sent!");
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          6‑digit code
        </label>
        <button
          type="button"
          onClick={resend}
          disabled={resendSecondsLeft > 0 || resendLoading}
          className="text-sm font-medium text-emerald-600 hover:text-emerald-800 disabled:text-gray-400 disabled:cursor-not-allowed"
        >
          {resendLoading
            ? "Sending..."
            : resendSecondsLeft > 0
            ? `Resend in ${resendSecondsLeft}s`
            : "Resend code"}
        </button>
      </div>

      <div className="flex gap-2 justify-center" onPaste={handlePaste}>
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputRefs.current[i] = el;
            }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            onChange={(e) => onChangeDigit(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            disabled={loading}
            className="w-10 h-11 md:w-12 md:h-12 text-center text-base md:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent shadow-sm disabled:opacity-50"
          />
        ))}
      </div>

      <motion.button
        type="submit"
        disabled={!isComplete || loading}
        whileHover={{ scale: !isComplete || loading ? 1 : 1.02 }}
        whileTap={{ scale: !isComplete || loading ? 1 : 0.98 }}
        className="w-full bg-gradient-to-r from-emerald-600 to-sky-600 text-white py-3 px-4 rounded-xl font-medium transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Verifying..." : "Verify email"}
      </motion.button>

      <div className="text-center text-xs text-gray-500 pt-1">
        Having trouble? Try resending the code.
      </div>
    </form>
  );
};

export default VerifyEmail; 