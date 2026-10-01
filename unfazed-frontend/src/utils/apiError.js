/**
 * Returns true if this error is a 401 Unauthorized — the global axios
 * interceptor already handled logout/redirect, so callers should skip
 * showing an additional toast.
 */
export const isSessionExpired = (err) =>
  err?.response?.status === 401 || err?.isSessionExpired === true;

/**
 * Returns a human-readable message from an axios error.
 * Returns null for 401s (interceptor already handles those).
 */
export const getErrorMessage = (err, fallback = 'Something went wrong') => {
  if (isSessionExpired(err)) return null;
  return err?.response?.data?.message || fallback;
};
