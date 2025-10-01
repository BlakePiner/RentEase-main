import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User,
  Mail,
  Shield,
  Phone,
  MessageSquare,
  Facebook,
  MessageCircle,
  Calendar,
  Venus,
  Edit3,
  Key,
  X,
  Save,
} from "lucide-react";
import { useAuthStore } from "@/stores/useAuthStore";
import { supabase } from "@/lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { forgotPasswordRequest, updateProfileRequest } from "@/api/authApi";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024; // 5 MB

const formatDate = (iso?: string | null) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
};

const initialsOf = (first?: string | null, last?: string | null) => {
  const f = (first?.[0] ?? "").toUpperCase();
  const l = (last?.[0] ?? "").toUpperCase();
  return f + l || "U";
};

const AccountProfile = () => {
  const user = useAuthStore((state) => state.user);

  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string>("");
  const [isPasswordResetModalOpen, setIsPasswordResetModalOpen] =
    useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    birthdate: "",
    gender: "",
    bio: "",
    phoneNumber: "",
    messengerUrl: "",
    facebookUrl: "",
    whatsappUrl: "",
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        middleName: user.middleName || "",
        lastName: user.lastName || "",
        birthdate: user.birthdate || "",
        gender: user.gender || "",
        bio: user.bio || "",
        phoneNumber: user.phoneNumber || "",
        messengerUrl: user.messengerUrl || "",
        facebookUrl: user.facebookUrl || "",
        whatsappUrl: user.whatsappUrl || "",
      });
    }
  }, [user]);

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-500">Loading profile...</div>
    );
  }

  // Role-based theming to match Admin layout colors when role is ADMIN
  const isAdmin = (user.role || "").toUpperCase() === "ADMIN";
  const theme = {
    // gradients
    gradientStrongFrom: isAdmin ? "from-purple-600" : "from-emerald-600",
    gradientStrongTo: isAdmin ? "to-blue-600" : "to-sky-600",
    gradientMidFrom: isAdmin ? "from-purple-500" : "from-emerald-500",
    gradientMidTo: isAdmin ? "to-blue-500" : "to-sky-500",
    gradientSoftFrom: isAdmin ? "from-purple-100" : "from-emerald-100",
    gradientSoftTo: isAdmin ? "to-blue-100" : "to-sky-100",
    // accents
    accentBg50: isAdmin ? "bg-purple-50" : "bg-emerald-50",
    accentText600: isAdmin ? "text-purple-600" : "text-emerald-600",
    accentText700: isAdmin ? "text-purple-700" : "text-emerald-700",
    accentText800: isAdmin ? "text-purple-800" : "text-emerald-800",
    accentBorder200: isAdmin ? "border-purple-200" : "border-emerald-200",
    accentHoverBg50: isAdmin ? "hover:bg-purple-50" : "hover:bg-emerald-50",
  } as const;

  const avatarPreviewUrl = avatarFile
    ? URL.createObjectURL(avatarFile)
    : user.avatarUrl || "";

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

  const uploadAvatarToSupabase = async (): Promise<string | null> => {
    if (!avatarFile) return null;

    try {
      const fileExtension = avatarFile.name.split(".").pop() || "jpg";
      const filePath = `avatars/${uuidv4()}.${fileExtension}`;

      const { error } = await supabase.storage
        .from("rentease-images")
        .upload(filePath, avatarFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("rentease-images").getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      setAvatarError("Failed to upload image. Please try again.");
      return null;
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      // ✅ Validate birthdate first
      const birthdateError = isValidBirthdate(formData.birthdate);
      if (birthdateError) {
        toast.error(birthdateError);
        setIsLoading(false);
        return;
      }
      let avatarUrl = user?.avatarUrl;

      // ✅ Upload avatar if a new file was chosen
      if (avatarFile) {
        const uploadedUrl = await uploadAvatarToSupabase();
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }

      // ✅ Build payload (only fields the backend expects)
      const payload = {
        ...formData,
        avatarUrl,
      };

      // ✅ Call API
      await updateProfileRequest(payload);

      // ✅ Update Zustand user state (merge, don’t overwrite)
      useAuthStore.setState((state) => ({
        user: state.user
          ? {
              ...state.user,
              ...payload, // only patch updated fields
            }
          : state.user, // fallback if somehow null
      }));

      toast.success("Profile updated successfully");

      // ✅ Reset states
      setIsEditProfileModalOpen(false);
      setAvatarFile(null);
      setAvatarError("");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const isValidBirthdate = (birthdate: string): string | null => {
    if (!birthdate) return "Birthdate is required";

    const date = new Date(birthdate);
    const today = new Date();

    // Future check
    if (date > today) {
      return "Birthdate cannot be in the future";
    }

    // Age check
    const ageDiff = today.getFullYear() - date.getFullYear();
    const hasBirthdayPassed =
      today.getMonth() > date.getMonth() ||
      (today.getMonth() === date.getMonth() &&
        today.getDate() >= date.getDate());

    const age = hasBirthdayPassed ? ageDiff : ageDiff - 1;

    if (age < 18) {
      return "You must be at least 18 years old";
    }

    return null;
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      birthdate: user.birthdate || "",
      gender: user.gender || "",
      bio: user.bio || "",
      phoneNumber: user.phoneNumber || "",
      messengerUrl: user.messengerUrl || "",
      facebookUrl: user.facebookUrl || "",
      whatsappUrl: user.whatsappUrl || "",
    });
    setAvatarFile(null);
    setAvatarError("");
    setIsEditProfileModalOpen(false);
  };

  const handlePasswordReset = async () => {
    if (!user.email) {
      toast.error("Email is required");
      return;
    }

    try {
      await forgotPasswordRequest({ email: user.email });
      toast.success("Password reset link sent to " + user.email);
      setIsPasswordResetModalOpen(false);
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      toast.error(
        error.response?.data?.message || "Failed to send password reset email"
      );
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const openEditModal = () => {
    setIsEditProfileModalOpen(true);
    // Reset form to current user data when opening modal
    setFormData({
      firstName: user.firstName || "",
      middleName: user.middleName || "",
      lastName: user.lastName || "",
      birthdate: user.birthdate || "",
      gender: user.gender || "",
      bio: user.bio || "",
      phoneNumber: user.phoneNumber || "",
      messengerUrl: user.messengerUrl || "",
      facebookUrl: user.facebookUrl || "",
      whatsappUrl: user.whatsappUrl || "",
    });
    setAvatarFile(null);
    setAvatarError("");
  };

  return (
    <div className="p-4 md:p-6 space-y-6 md:space-y-8 max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className={`absolute -top-20 -right-20 w-64 h-64 rounded-full bg-gradient-to-r ${theme.gradientSoftFrom} ${theme.gradientSoftTo} blur-2xl opacity-70`}
          />
          <div
            className={`absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-gradient-to-r ${theme.gradientSoftFrom} ${theme.gradientSoftTo} blur-3xl opacity-70`}
          />
        </div>

        <div className="relative p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24 ring-4 ring-white shadow-lg">
              <AvatarImage src={user.avatarUrl || undefined} alt="avatar" />
              <AvatarFallback
                className={`bg-gradient-to-br ${theme.gradientMidFrom} ${theme.gradientMidTo} text-white text-xl font-semibold`}
              >
                {initialsOf(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {user.firstName} {user.lastName}
            </h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Mail size={14} />
                <span>{user.email}</span>
              </div>
              <div className="w-1 h-1 rounded-full bg-gray-400"></div>
              <div className="text-sm text-gray-600 capitalize">
                {user.role.toLowerCase()}
              </div>
            </div>
            <p className="mt-2 text-gray-600 max-w-xl">
              Manage your personal information and account security.
            </p>
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            <Button
              onClick={openEditModal}
              className={`gap-2 bg-gradient-to-r ${theme.gradientStrongFrom} ${theme.gradientStrongTo} hover:brightness-110 shadow-md text-white`}
            >
              <Edit3 size={16} />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
        {/* Profile Details Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme.accentBg50}`}>
                <User className={`h-5 w-5 ${theme.accentText600}`} />
              </div>
              <h2 className="font-semibold text-gray-900 text-lg">
                Profile Details
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                First Name
              </label>
              <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                {user.firstName || "—"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Middle Name
              </label>
              <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                {user.middleName || "—"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500">
                Last Name
              </label>
              <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                {user.lastName || "—"}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar size={14} />
                Birthdate
              </label>
              <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                {formatDate(user.birthdate)}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Venus size={14} />
                Gender
              </label>
              <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                {user.gender || "—"}
              </div>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <label className="text-sm font-medium text-gray-500">Bio</label>
              <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 min-h-[48px]">
                {user.bio || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${
                  isAdmin ? "bg-blue-50" : "bg-sky-50"
                }`}
              >
                <Phone
                  className={`h-5 w-5 ${
                    isAdmin ? "text-blue-600" : "text-sky-600"
                  }`}
                />
              </div>
              <h2 className="font-semibold text-gray-900 text-lg">
                Contact Info
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Phone size={14} />
                Phone
              </label>
              {user.phoneNumber ? (
                <a
                  href={`tel:${user.phoneNumber}`}
                  className="block px-4 py-3 rounded-xl bg-gray-50 text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition truncate"
                >
                  {user.phoneNumber}
                </a>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 truncate">
                  —
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <MessageSquare size={14} />
                Messenger
              </label>
              {user.messengerUrl ? (
                <a
                  href={user.messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 rounded-xl bg-gray-50 text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition truncate"
                >
                  {user.messengerUrl}
                </a>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 truncate">
                  —
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Facebook size={14} />
                Facebook
              </label>
              {user.facebookUrl ? (
                <a
                  href={user.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 rounded-xl bg-gray-50 text-blue-700 hover:text-blue-800 hover:bg-blue-50 transition truncate"
                >
                  {user.facebookUrl}
                </a>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 truncate">
                  —
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <MessageCircle size={14} />
                WhatsApp
              </label>
              {user.whatsappUrl ? (
                <a
                  href={user.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block px-4 py-3 rounded-xl bg-gray-50 text-green-700 hover:text-green-800 hover:bg-green-50 transition truncate"
                >
                  {user.whatsappUrl}
                </a>
              ) : (
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 truncate">
                  —
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Account & Security Card - Always Read Only */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 md:p-6 space-y-5 shadow-sm hover:shadow-md transition-shadow lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${theme.accentBg50}`}>
                <Shield className={`h-5 w-5 ${theme.accentText600}`} />
              </div>
              <h2 className="font-semibold text-gray-900 text-lg">
                Account & Security
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Email
                </label>
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 flex items-center justify-between">
                  {user.email}
                  {user.isVerified ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                      Verified
                    </span>
                  ) : (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium">
                      Unverified
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Role
                </label>
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900 capitalize">
                  {user.role.toLowerCase()}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Last Login
                </label>
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                  {formatDate(user.lastLogin)}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-500">
                  Last Password Change
                </label>
                <div className="px-4 py-3 rounded-xl bg-gray-50 text-gray-900">
                  {formatDate(user.lastPasswordChange)}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-5 border-t border-gray-200">
            <Button
              onClick={() => setIsPasswordResetModalOpen(true)}
              variant="outline"
              className={`gap-2 border ${theme.accentBorder200} ${theme.accentText700} ${theme.accentHoverBg50}`}
            >
              <Key size={16} />
              Send Password Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Dialog
        open={isEditProfileModalOpen}
        onOpenChange={setIsEditProfileModalOpen}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal information and contact details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-20 w-20 ring-4 ring-white shadow-lg">
                  <AvatarImage
                    src={avatarPreviewUrl || undefined}
                    alt="avatar"
                  />
                  <AvatarFallback
                    className={`bg-gradient-to-br ${theme.gradientMidFrom} ${theme.gradientMidTo} text-white text-lg font-semibold`}
                  >
                    {initialsOf(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2">
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div
                      className={`p-2 rounded-full ${theme.accentBg50} shadow-md hover:shadow-lg transition-shadow`}
                    >
                      <Edit3 className={`h-4 w-4 ${theme.accentText600}`} />
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
              <div>
                <h3 className="font-medium">Profile Picture</h3>
                <p className="text-sm text-gray-500">
                  Click the pencil icon to change your avatar
                </p>
                {avatarError && (
                  <p className="text-red-500 text-xs mt-1">{avatarError}</p>
                )}
              </div>
            </div>

            {/* Profile Details */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    First Name *
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="First Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Middle Name
                  </label>
                  <Input
                    value={formData.middleName}
                    onChange={(e) =>
                      handleInputChange("middleName", e.target.value)
                    }
                    placeholder="Middle Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Last Name *
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Last Name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Calendar size={14} />
                    Birthdate *
                  </label>
                  <Input
                    type="date"
                    value={
                      formData.birthdate
                        ? new Date(formData.birthdate)
                            .toISOString()
                            .split("T")[0]
                        : ""
                    }
                    onChange={(e) =>
                      handleInputChange("birthdate", e.target.value)
                    }
                    max={new Date().toISOString().split("T")[0]} // ⛔ Prevent selecting future dates
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Venus size={14} />
                    Gender *
                  </label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) =>
                      handleInputChange("gender", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                      <SelectItem value="Prefer not to say">
                        Prefer not to say
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-gray-500">
                    Bio *
                  </label>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Phone size={14} />
                    Phone
                  </label>
                  <Input
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      handleInputChange("phoneNumber", e.target.value)
                    }
                    placeholder="+1234567890"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <MessageSquare size={14} />
                    Messenger URL
                  </label>
                  <Input
                    value={formData.messengerUrl}
                    onChange={(e) =>
                      handleInputChange("messengerUrl", e.target.value)
                    }
                    placeholder="https://m.me/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <Facebook size={14} />
                    Facebook URL
                  </label>
                  <Input
                    value={formData.facebookUrl}
                    onChange={(e) =>
                      handleInputChange("facebookUrl", e.target.value)
                    }
                    placeholder="https://facebook.com/username"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                    <MessageCircle size={14} />
                    WhatsApp URL
                  </label>
                  <Input
                    value={formData.whatsappUrl}
                    onChange={(e) =>
                      handleInputChange("whatsappUrl", e.target.value)
                    }
                    placeholder="https://wa.me/1234567890"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X size={16} className="mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className={`gap-2 bg-gradient-to-r ${theme.gradientStrongFrom} ${theme.gradientStrongTo} text-white`}
              >
                <Save size={16} />
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog
        open={isPasswordResetModalOpen}
        onOpenChange={setIsPasswordResetModalOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              We will send a password reset link to your email address.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-gray-50">
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {user.email}
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setIsPasswordResetModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordReset}
                className={`gap-2 bg-gradient-to-r ${theme.gradientStrongFrom} ${theme.gradientStrongTo} text-white`}
              >
                <Key size={16} />
                Send Reset Link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountProfile;
