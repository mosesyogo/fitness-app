import { useSignIn } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
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
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [verificationFactor, setVerificationFactor] = React.useState<"first" | "second">("second");
  const [verificationCode, setVerificationCode] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    if (!emailAddress || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else if (signInAttempt.status === "needs_second_factor") {
        const emailFactor = signInAttempt.supportedSecondFactors?.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailFactor) {
          await signIn.prepareSecondFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setVerificationFactor("second");
          setPendingVerification(true);
        } else {
          const availableFactors =
            signInAttempt.supportedSecondFactors
              ?.map((factor) => factor.strategy)
              .join(", ") || "none";
          setError(
            `Your account requires another verification step (${availableFactors}), but email verification is unavailable.`,
          );
        }
      } else if (signInAttempt.status === "needs_first_factor") {
        const emailFactor = signInAttempt.supportedFirstFactors?.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: emailFactor.emailAddressId,
          });
          setVerificationFactor("first");
          setPendingVerification(true);
        } else {
          const availableFactors = signInAttempt.supportedFirstFactors
            ?.map((factor) => factor.strategy)
            .join(", ") || "none";
          setError(
            `Your account requires a verification step (${availableFactors}), but email verification is unavailable.`,
          );
        }
      } else {
        setError(
          `Sign-in needs another step (status: ${signInAttempt.status}). Please check your account's verification settings.`,
        );
        console.error("Sign-in requires another step:", signInAttempt);
      }
    } catch (err: any) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      setError(
        err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Sign in failed. Try again.",
      );
      console.error("Sign-in failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    if (!verificationCode.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const attempt =
        verificationFactor === "first"
          ? await signIn.attemptFirstFactor({
              strategy: "email_code",
              code: verificationCode.trim(),
            })
          : await signIn.attemptSecondFactor({
              strategy: "email_code",
              code: verificationCode.trim(),
            });

      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId });
        router.replace("/");
      } else {
        setError("Verification is incomplete. Please try again.");
        console.error("Verification is incomplete:", attempt);
      }
    } catch (err: any) {
      setError(
        err?.errors?.[0]?.longMessage ??
          err?.errors?.[0]?.message ??
          "Invalid verification code.",
      );
      console.error("Verification failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 px-6">
          <View className="flex-1 justify-center">
            {/* Header section */}
            <View className="items-center mb-8">
              {/* Logo/Branding */}
              {/* Logo/Branding */}
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
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                FitTracker
              </Text>
              <Text className="text-lg text-gray-600 text-center">
                Track your fitness journey{"\n"}and reach your goals
              </Text>
            </View>

            {/* Sign in form */}
            <View className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
              <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Welcome Back
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

              {pendingVerification ? (
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Email verification code
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                    <Ionicons name="keypad-outline" size={20} color="#6B7280" />
                    <TextInput
                      className="flex-1 ml-3 py-3 text-gray-900 outline-none"
                      value={verificationCode}
                      placeholder="Enter the code sent to your email"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="number-pad"
                      editable={!loading}
                      onChangeText={setVerificationCode}
                    />
                  </View>
                </View>
              ) : (
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
              )}

              {/* Error message */}
              {!!error && (
                <View className="flex-row items-center bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <Ionicons name="alert-circle" size={18} color="#DC2626" />
                  <Text className="flex-1 ml-2 text-sm text-red-600">
                    {error}
                  </Text>
                </View>
              )}
            </View>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={pendingVerification ? onVerifyPress : onSignInPress}
              disabled={loading}
              className={`rounded-xl py-4 shadow-sm mb-4 ${
                loading ? "bg-gray-400" : "bg-blue-600"
              }`}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                <Ionicons
                  name={
                    loading
                      ? "refresh"
                      : pendingVerification
                        ? "checkmark-circle-outline"
                        : "log-in-outline"
                  }
                  size={20}
                  color="white"
                />
                <Text className="text-white font-semibold text-lg ml-2">
                  {loading
                    ? pendingVerification
                      ? "Verifying..."
                      : "Signing In..."
                    : pendingVerification
                      ? "Verify Code"
                      : "Sign In"}
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

            {/* Sign Up Link */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-semibold">Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </View>
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
