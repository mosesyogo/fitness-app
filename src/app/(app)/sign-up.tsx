import { useSignUp } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import GoogleSignin from "../components/GoogleSignin";

export default function Page() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [resent, setResent] = React.useState(false);

  // Create the account and send an email verification code when required.
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: emailAddress.trim(),
        password,
      });

      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else if (signUpAttempt.unverifiedFields.includes("email_address")) {
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
      } else {
        const missing = signUpAttempt.missingFields.join(", ");
        setError(
          missing
            ? `Your account needs more information: ${missing}.`
            : `Account creation needs another step (status: ${signUpAttempt.status}).`,
        );
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      setError(
        err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Account creation failed. Try again.",
      );
      console.error("Account creation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Verify the email address to finish creating the account.
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    if (!code) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const attempt = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        setError(
          `Email verification needs another step (status: ${attempt.status}).`,
        );
        console.error("Email verification needs another step:", attempt);
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Invalid verification code. Try again.",
      );
      console.error("Verification failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Resend the verification code
  const onResendPress = async () => {
    if (!isLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setResent(true);
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Could not resend the code.",
      );
      console.error("Resend verification failed:", err);
    } finally {
      setLoading(false);
    }
  };

  // Shared logo + title block
  const renderHeader = (title: string, subtitle: React.ReactNode) => (
    <View className="items-center mb-8">
      <LinearGradient
        colors={["#2563EB", "#9333EA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 80,
          height: 80,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Ionicons name="fitness" size={40} color="white" />
      </LinearGradient>
      <Text className="text-3xl font-bold text-gray-900 mb-2">{title}</Text>
      <Text className="text-lg text-gray-600 text-center">{subtitle}</Text>
    </View>
  );

  // Shared error box
  const renderError = () =>
    !!error && (
      <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
        <Ionicons name="alert-circle" size={18} color="#DC2626" />
        <Text className="flex-1 ml-2 text-sm text-red-600">{error}</Text>
      </View>
    );

  // Email code screen
  if (pendingVerification) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View className="flex-1 px-6">
            <View className="flex-1 justify-center">
              {renderHeader(
                "Check your email",
                <>
                  We sent a verification code{"\n"}to {emailAddress}
                </>,
              )}

              {/* Verification form */}
              <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
                <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Enter Verification Code
                </Text>

                {/* Code Input */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-4 border border-gray-200">
                    <Ionicons name="key-outline" size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-900 text-center text-lg tracking-widest outline-none"
                      value={code}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={setCode}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!loading}
                    />
                  </View>
                </View>

                {renderError()}
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={onVerifyPress}
                disabled={loading}
                className={`rounded-xl py-4 shadow-sm mb-4 ${
                  loading ? "bg-gray-400" : "bg-green-600"
                }`}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  {loading ? (
                    <Ionicons name="refresh" size={20} color="white" />
                  ) : (
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="white"
                    />
                  )}
                  <Text className="text-white font-semibold text-lg ml-2">
                    {loading ? "Verifying..." : "Verify Email"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Resend Code */}
              <TouchableOpacity
                className="py-2"
                onPress={onResendPress}
                disabled={loading}
              >
                <Text className="text-blue-600 font-medium text-center">
                  {resent
                    ? "Code sent! Check your email"
                    : "Didn't receive the code? Resend"}
                </Text>
              </TouchableOpacity>

              {/* Back to sign in */}
              <TouchableOpacity
                onPress={() => {
                  setPendingVerification(false);
                  setCode("");
                  setError("");
                }}
              >
                <Text className="text-center text-blue-600 font-semibold">
                  Back to sign up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer section */}
            <View className="pb-6">
              <Text className="text-center text-gray-500 text-sm">
                Almost there! Just one more step
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-6">
          <View className="flex-1 justify-center">
            {/* Header section */}
            {renderHeader(
              "FitTracker",
              <>
                Track your fitness journey{"\n"}and reach your goals
              </>,
            )}

            {/* Sign in form */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Create Account
              </Text>

              {/* Email input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Email
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                  <Ionicons name="mail-outline" size={20} color="#6B7280" />
                  <TextInput
                    className="flex-1 ml-3 py-3 text-gray-900 outline-none"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={emailAddress}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    editable={!loading}
                    onChangeText={setEmailAddress}
                  />
                </View>
              </View>

              {/* Password input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Password
                </Text>
                <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color="#6B7280"
                  />
                  <TextInput
                    className="flex-1 ml-3 py-3 text-gray-900 outline-none"
                    value={password}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry={true}
                    editable={!loading}
                    onChangeText={setPassword}
                  />
                </View>
              </View>

              {/* Error message */}
              {renderError()}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={onSignUpPress}
              disabled={loading}
              className={`rounded-xl py-4 shadow-sm mb-4 ${
                loading ? "bg-gray-400" : "bg-blue-600"
              }`}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons
                  name={loading ? "refresh" : "log-in-outline"}
                  size={20}
                  color="white"
                />
                <Text className="text-white font-semibold text-lg ml-2">
                  {loading ? "Creating Account..." : "Sign Up"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View className="flex-row items-center my-4">
              <View className="flex-1 h-px bg-gray-200" />
              <Text className="mx-3 text-gray-500 text-sm">or</Text>
              <View className="flex-1 h-px bg-gray-200" />
            </View>

            <GoogleSignin />
          </View>

          {/* Sign In Link */}
          <View className="flex-row justify-center items-center">
            <Text className="text-gray-600">Already have an account? </Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <Text className="text-blue-600 font-semibold">Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Footer section */}
          <View className="pb-6">
            <Text className="text-center text-gray-500 text-sm">
              Start your fitness journey today
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
