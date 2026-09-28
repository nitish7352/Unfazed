// v202609290052
/**
 * Dynamically loads the Razorpay checkout SDK only when needed.
 * Calling this multiple times is safe — it resolves immediately if already loaded.
 * @returns {Promise<void>}
 */
export const loadRazorpay = () => {
  return new Promise((resolve, reject) => {
    // Already loaded
    if (window.Razorpay) return resolve();

    // Already injecting
    if (document.getElementById('razorpay-sdk')) {
      document.getElementById('razorpay-sdk').addEventListener('load', resolve);
      return;
    }

    const script = document.createElement('script');
    script.id  = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload  = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
    document.head.appendChild(script);
  });
};