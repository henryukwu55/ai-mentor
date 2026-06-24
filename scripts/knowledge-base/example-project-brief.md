# E-commerce Cart Project — Stripe Integration Brief

Students integrate Stripe Checkout into a simple cart app.

Common error: "No such API key provided" — usually means STRIPE_SECRET_KEY
is missing or misnamed in the .env file, or the server restarted without
reloading environment variables.

Common error: "Invalid API Key provided: sk_test_****" — usually means a
publishable key (pk_) was used where a secret key (sk_) was expected, or
vice versa on the client side.

Debugging steps:
1. Confirm .env has STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
2. Restart the dev server after editing .env.
3. Check the key is for the correct mode (test vs live).
4. Log the key's first 8 characters (never the full key) to confirm it loaded.
