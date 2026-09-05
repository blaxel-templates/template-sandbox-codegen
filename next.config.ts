// Set exact preview hostnames before starting the development server.
const allowedDevOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((hostname) => hostname.trim())
  .filter(Boolean);

export default { allowedDevOrigins };
