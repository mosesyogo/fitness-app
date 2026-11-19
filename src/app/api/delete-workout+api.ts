import { adminClient } from "../../lib/sanity/client";

export async function POST(request: Request) {
  const { workoutId }: { workoutId: string } = await request.json();

  try {
    await adminClient.delete(workoutId as string);

    console.log("Workout deleted successfully:", workoutId);

    return Response.json({
      success: true,
      message: "Workout deleted successfully",
    });
  } catch (error) {
    const errorInfo =
      typeof error === "object" && error !== null
        ? (error as {
            message?: string;
            statusCode?: number;
            response?: {
              statusCode?: number;
              body?: { message?: string; error?: { description?: string } };
            };
          })
        : undefined;
    const errorMessage =
      errorInfo?.message ??
      errorInfo?.response?.body?.error?.description ??
      errorInfo?.response?.body?.message ??
      (typeof error === "string" ? error : "Unknown Sanity error");
    const statusCode =
      errorInfo?.statusCode ?? errorInfo?.response?.statusCode;

    console.error("Error deleting workout:", {
      message: errorMessage,
      statusCode,
    });
    const isPermissionError = /insufficient permissions|permission .* required/i.test(
      errorMessage,
    ) || statusCode === 403;
    const errorForClient = isPermissionError
      ? "Sanity rejected the delete because SANITY_API_TOKEN lacks write permission. Use an Editor or equivalent write token and restart Expo."
      : process.env.NODE_ENV !== "production"
        ? `Sanity delete failed: ${errorMessage}`
        : "Failed to delete workout. Please try again.";

    return Response.json(
      { error: errorForClient },
      { status: 500 },
    );
  }
}
