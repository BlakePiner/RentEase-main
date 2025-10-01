import { useEffect, useMemo, useRef, useState } from "react";
import { motion, type Variants, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  Venus,
  Phone,
  MessageSquare,
  Facebook,
  MessageCircle,
  CheckCircle,
  ArrowRight,
  Award,
  Upload,
  Camera,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { onboardingRequest } from "@/api/authApi";
import { v4 as uuidv4 } from "uuid";

type GenderOption = "Male" | "Female" | "Other" | "Prefer not to say";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, when: "beforeChildren" },
  },
};

const Onboarding = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string>("");
  const [birthdate, setBirthdate] = useState<string>("");
  const [gender, setGender] = useState<GenderOption | "">("");
  const [bio, setBio] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [messengerUrl, setMessengerUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarPreviewUrl = useMemo(() => {
    if (!avatarFile) return "";
    return URL.createObjectURL(avatarFile);
  }, [avatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarError("");
    if (!file) {
      setAvatarFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setAvatarError("Please select an image file.");
      setAvatarFile(null);
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("Image must be 5MB or smaller.");
      setAvatarFile(null);
      return;
    }
    setAvatarFile(file);
  };

  const normalizePhone = (raw: string) => {
    const digits = raw.replace(/[^\d+]/g, "");
    return digits.replace(/\s+/g, "");
  };

  const onPhoneChange = (v: string) => {
    const normalized = normalizePhone(v);
    setPhoneNumber(normalized);
  };

  const uploadAvatarToSupabase = async (): Promise<string | null> => {
    if (!avatarFile || !user?.id) return null;

    const fileExtension = avatarFile.name.split(".").pop() || "jpg";
    const filePath = `avatars/${uuidv4()}.${fileExtension}`;

    try {
      const { data, error } = await supabase.storage
        .from("rentease-images")
        .upload(filePath, avatarFile, { cacheControl: "3600", upsert: true });

      if (error) {
        console.error("Upload failed:", error);
        setAvatarError("Upload failed. Check bucket permissions.");
        return null;
      }

      const { data: publicData } = supabase.storage
        .from("rentease-images")
        .getPublicUrl(filePath);

      console.log("Supabase upload data:", data);
      console.log("Public URL:", publicData?.publicUrl);

      return publicData?.publicUrl || null;
    } catch (err) {
      console.error("Unexpected error:", err);
      setAvatarError("Unexpected error. See console.");
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 1 validation
    if (step === 1) {
      if (!firstName || !lastName || !birthdate || !gender || !bio) {
        setAvatarError("Please fill out all required fields.");
        return;
      }
      const today = new Date();
      const birth = new Date(birthdate);
      if (birth > today) {
        setAvatarError("Birthdate cannot be a future date.");
        return;
      }
      const age = today.getFullYear() - birth.getFullYear();
      if (age < 18) {
        setAvatarError("You must be at least 18 years old.");
        return;
      }

      setAvatarError(""); // clear any previous errors
      setStep(2);
      return;
    }

    // Step 2 submission logic
    setIsSubmitting(true);
    try {
      let avatarUrl = null;
      if (avatarFile) {
        avatarUrl = await uploadAvatarToSupabase();
      }

      const onboardingData = {
        firstName,
        middleName: middleName || undefined,
        lastName,
        avatarUrl,
        birthdate,
        gender,
        bio,
        phoneNumber: phoneNumber || undefined,
        messengerUrl: messengerUrl || undefined,
        facebookUrl: facebookUrl || undefined,
        whatsappUrl: whatsappUrl || undefined,
      };

      await onboardingRequest(onboardingData);

      const targetUrl =
        user?.role === "ADMIN"
          ? "/admin"
          : user?.role === "LANDLORD"
          ? "/landlord"
          : "/tenant";

      navigate(targetUrl, { replace: true });
      window.location.replace(targetUrl);
    } catch (error) {
      console.error(error);
      setAvatarError("Failed to complete onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToPreviousStep = () => {
    if (step > 1) {
      setStep(1);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getProgressPercentage = () => (step / 2) * 100;
  const progressPercentage = getProgressPercentage();
  const progressColor = "from-green-500 to-blue-500";
  const bgColor =
    step === 1 ? "from-green-50 to-blue-50" : "from-green-50 to-blue-50";

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${bgColor} relative overflow-hidden`}
    >
      {/* Simplified Floating Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: Math.random() * 15 + 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles
              size={Math.random() * 16 + 8}
              className={i % 2 === 0 ? "text-green-300/30" : "text-blue-300/30"}
            />
          </motion.div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <motion.div
            className="text-center mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl mb-3 shadow-lg"
            >
              <User className="h-6 w-6 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Complete Your Profile
            </h1>

            {/* Progress Bar */}
            <div className="flex justify-center mb-6">
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs text-gray-600 mb-2">
                  <span className="font-medium">Personal Info</span>
                  <span className="font-medium">Contact Details</span>
                </div>

                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${progressColor}`}
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>

                <div className="flex justify-between mt-2">
                  <motion.div
                    className={`flex flex-col items-center ${
                      step >= 1 ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step >= 1
                          ? `bg-gradient-to-r ${progressColor} text-white shadow`
                          : "bg-gray-300"
                      }`}
                    >
                      1
                    </div>
                  </motion.div>
                  <motion.div
                    className={`flex flex-col items-center ${
                      step >= 2 ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        step >= 2
                          ? `bg-gradient-to-r ${progressColor} text-white shadow`
                          : "bg-gray-300"
                      }`}
                    >
                      2
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Form Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20">
              <form onSubmit={handleSubmit}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <ProfileStep
                      firstName={firstName}
                      setFirstName={setFirstName}
                      middleName={middleName}
                      setMiddleName={setMiddleName}
                      lastName={lastName}
                      setLastName={setLastName}
                      avatarError={avatarError}
                      birthdate={birthdate}
                      setBirthdate={setBirthdate}
                      gender={gender}
                      setGender={setGender}
                      bio={bio}
                      setBio={setBio}
                      fileInputRef={fileInputRef}
                      handleAvatarChange={handleAvatarChange}
                      avatarPreviewUrl={avatarPreviewUrl}
                      triggerFileInput={triggerFileInput}
                    />
                  )}
                  {step === 2 && (
                    <ContactStep
                      phoneNumber={phoneNumber}
                      onPhoneChange={onPhoneChange}
                      messengerUrl={messengerUrl}
                      setMessengerUrl={setMessengerUrl}
                      facebookUrl={facebookUrl}
                      setFacebookUrl={setFacebookUrl}
                      whatsappUrl={whatsappUrl}
                      setWhatsappUrl={setWhatsappUrl}
                    />
                  )}
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                  <motion.button
                    type="button"
                    onClick={goToPreviousStep}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      step === 1
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                    disabled={step === 1}
                    whileHover={step > 1 ? { x: -2 } : {}}
                  >
                    <ArrowRight className="h-4 w-4 rotate-180" />
                    Back
                  </motion.button>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`bg-gradient-to-r ${progressColor} text-white py-2 px-6 rounded-lg font-medium transition-all shadow-lg hover:shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isSubmitting ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        Processing...
                      </>
                    ) : step === 2 ? (
                      <>
                        Complete Profile
                        <CheckCircle className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Profile Step Component
const ProfileStep = ({
  firstName,
  setFirstName,
  middleName,
  setMiddleName,
  lastName,
  setLastName,
  avatarError,
  birthdate,
  setBirthdate,
  gender,
  setGender,
  bio,
  setBio,
  fileInputRef,
  handleAvatarChange,
  avatarPreviewUrl,
  triggerFileInput,
}: any) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    {/* Avatar Section */}
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="relative inline-block"
      >
        <div className="relative w-24 h-24 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl mb-3 shadow-md overflow-hidden">
          {avatarPreviewUrl ? (
            <img
              src={avatarPreviewUrl}
              alt="Avatar preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="h-12 w-12 text-green-400" />
            </div>
          )}
          <motion.button
            type="button"
            onClick={triggerFileInput}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute bottom-1 right-1 w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center shadow hover:shadow-md transition-all"
          >
            <Camera className="h-3 w-3 text-white" />
          </motion.button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        <motion.button
          type="button"
          onClick={triggerFileInput}
          whileHover={{ y: -1 }}
          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:border-green-300 hover:text-green-600 transition-all"
        >
          <Upload className="h-3 w-3" />
          {avatarPreviewUrl ? "Change Photo" : "Upload Photo"}
        </motion.button>

        {avatarError && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-xs mt-1"
          >
            {avatarError}
          </motion.p>
        )}
      </motion.div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          First Name *
        </label>
        <input
          type="text"
          required
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="e.g. John"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Middle Name
        </label>
        <input
          type="text"
          value={middleName}
          onChange={(e) => setMiddleName(e.target.value)}
          placeholder="Optional"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Last Name *
        </label>
        <input
          type="text"
          required
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="e.g. Doe"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
          <Calendar className="h-3 w-3 text-green-500" />
          Birthdate *
        </label>
        <input
          type="date"
          required
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
          max={new Date().toISOString().split("T")[0]} // 🚫 hides future dates
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
          <Venus className="h-3 w-3 text-green-500" />
          Gender *
        </label>
        <select
          required
          value={gender}
          onChange={(e) => setGender(e.target.value as GenderOption | "")}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition-all text-sm"
        >
          <option value="">Select gender</option>
          <option>Male</option>
          <option>Female</option>
          <option>Other</option>
          <option>Prefer not to say</option>
        </select>
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          About You *
        </label>
        <textarea
          required
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Tell us a bit about yourself..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">
          This helps others get to know you better
        </p>
      </div>
    </div>
  </motion.div>
);

// Contact Step Component
const ContactStep = ({
  phoneNumber,
  onPhoneChange,
  messengerUrl,
  setMessengerUrl,
  facebookUrl,
  setFacebookUrl,
  whatsappUrl,
  setWhatsappUrl,
}: any) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.3 }}
    className="space-y-6"
  >
    {/* Contact Icons Section */}
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
        className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-100 to-blue-100 rounded-xl mb-3 shadow-md"
      >
        <Phone className="h-8 w-8 text-green-600" />
      </motion.div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">
        Contact Information
      </h3>
      <p className="text-gray-600 text-sm">
        Add your contact details (all fields are optional)
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
          <Phone className="h-3 w-3 text-blue-500" />
          Phone Number
        </label>
        <input
          type="tel"
          inputMode="tel"
          value={phoneNumber}
          onChange={(e) => onPhoneChange(e.target.value)}
          placeholder="e.g. +15551234567"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
        />
        <p className="text-xs text-gray-500 mt-1">Digits and leading + only</p>
      </div>

      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
          <MessageSquare className="h-3 w-3 text-green-500" />
          Messenger URL
        </label>
        <input
          type="url"
          value={messengerUrl}
          onChange={(e) => setMessengerUrl(e.target.value)}
          placeholder="https://m.me/your.profile"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      <div>
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
          <Facebook className="h-3 w-3 text-blue-600" />
          Facebook URL
        </label>
        <input
          type="url"
          value={facebookUrl}
          onChange={(e) => setFacebookUrl(e.target.value)}
          placeholder="https://facebook.com/your.profile"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all text-sm"
        />
      </div>

      <div className="md:col-span-2">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
          <MessageCircle className="h-3 w-3 text-green-600" />
          WhatsApp URL
        </label>
        <input
          type="url"
          value={whatsappUrl}
          onChange={(e) => setWhatsappUrl(e.target.value)}
          placeholder="https://wa.me/15551234567"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent transition-all text-sm"
        />
      </div>
    </div>

    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200/50"
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-full mb-2"
      >
        <Award className="h-5 w-5 text-white" />
      </motion.div>
      <h4 className="font-bold text-green-800 mb-1 text-sm">
        You're Almost There!
      </h4>
      <p className="text-green-700 text-xs">
        Complete your profile to unlock the full RentEase experience
      </p>
    </motion.div>
  </motion.div>
);

export default Onboarding;
