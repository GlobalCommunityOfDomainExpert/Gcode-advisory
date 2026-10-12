/**
 * Opens Cashfree's hosted checkout for a payment session. Card, UPI and bank details are typed on Cashfree's own page; our
 * page never sees them. The customer comes back to /book/return, which asks the server (not the browser) what happened.
 * Returns an error message to show, or null once the redirect has started.
 */
interface CashfreeSdk {
  checkout: (opts: { paymentSessionId: string; redirectTarget: "_self" }) => Promise<{ error?: { message?: string } } | undefined>;
}
declare global {
  interface Window {
    Cashfree?: (opts: { mode: "sandbox" | "production" }) => CashfreeSdk;
  }
}

const SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

function loadSdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Cashfree) return Promise.resolve(true);
  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SDK_URL}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener("load", () => resolve(!!window.Cashfree), { once: true });
    script.addEventListener("error", () => resolve(false), { once: true });
    if (!existing) {
      script.src = SDK_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export async function openCashfreeCheckout(paymentSessionId: string, mode: "sandbox" | "production"): Promise<string | null> {
  if (!(await loadSdk()) || !window.Cashfree) return "We couldn’t open the payment page. Check your connection and try again.";
  try {
    const result = await window.Cashfree({ mode }).checkout({ paymentSessionId, redirectTarget: "_self" });
    return result?.error ? "The payment page couldn’t be opened. Please try again." : null;
  } catch {
    return "The payment page couldn’t be opened. Please try again.";
  }
}
