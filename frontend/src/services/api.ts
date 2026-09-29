export const API =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? ""
    : ["localhost", "127.0.0.1"].includes(window.location.hostname)
      ? "http://localhost:8000"
      : "");

export class ApiError extends Error {
  status: number;

  constructor(
    status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function api(
  path: string,
  options: RequestInit = {},
  token?: string
) {
  const headers: Record<
    string,
    string
  > = {
    "Content-Type":
      "application/json",
    ...((options.headers as Record<
      string,
      string
    >) || {}),
  };

  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }

  const response = await fetch(
    API + path,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    const message =
      await response.text();

    throw new ApiError(
      response.status,
      message ||
        `HTTP ${response.status}`
    );
  }

  return response.json();
}
