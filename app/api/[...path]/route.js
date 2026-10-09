import { createApplication } from "../../../backend/application.js";
import { createDatabase } from "../../../backend/database.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

let applicationPromise;

function getApplication() {
  if (!applicationPromise) {
    applicationPromise = createDatabase()
      .then(createApplication)
      .catch((error) => {
        applicationPromise = undefined;
        throw error;
      });
  }
  return applicationPromise;
}

async function handler(request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 9 * 1024 * 1024)
      return new Response("Fichier trop volumineux", { status: 413 });
    return await (await getApplication())(request);
  } catch (error) {
    console.error("YAVIYA configuration error", error.message);
    return Response.json(
      {
        error:
          "Le service de compte est temporairement indisponible. Réessayez plus tard.",
      },
      {
        status: 503,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
