// Lemon Squeezy API client and utilities

export const LEMON_SQUEEZY_CONFIG = {
  storeId: process.env.LEMON_SQUEEZY_STORE_ID!,
  apiKey: process.env.LEMON_SQUEEZY_API_KEY!,
  webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!,
  monthlyVariantId: process.env.LEMON_SQUEEZY_MONTHLY_VARIANT_ID || "494290",
  annualVariantId: process.env.LEMON_SQUEEZY_ANNUAL_VARIANT_ID || "497926",
}

export interface LemonSqueezySubscription {
  id: string
  status: string
  customer_id: string
  product_id: string
  variant_id: string
  ends_at: string | null
  renews_at: string | null
  created_at: string
  updated_at: string
}

export interface LemonSqueezyCustomer {
  id: string
  email: string
  name: string
}

export async function createCheckoutUrl(
  email: string,
  userId: string,
  planType: "monthly" | "annual" = "monthly",
): Promise<string> {
  const variantId = planType === "annual" ? LEMON_SQUEEZY_CONFIG.annualVariantId : LEMON_SQUEEZY_CONFIG.monthlyVariantId

  const requestBody = {
    data: {
      type: "checkouts",
      attributes: {
        checkout_data: {
          email,
          custom: {
            user_id: userId,
          },
        },
      },
      relationships: {
        store: {
          data: {
            type: "stores",
            id: String(LEMON_SQUEEZY_CONFIG.storeId),
          },
        },
        variant: {
          data: {
            type: "variants",
            id: String(variantId),
          },
        },
      },
    },
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  })

  const responseText = await response.text()

  if (!response.ok) {
    let errorDetails
    try {
      errorDetails = JSON.parse(responseText)
    } catch {
      errorDetails = responseText
    }

    throw new Error(`LemonSqueezy API error (${response.status}): ${JSON.stringify(errorDetails)}`)
  }

  const data = JSON.parse(responseText)

  return data.data.attributes.url
}

export async function getSubscription(subscriptionId: string): Promise<LemonSqueezySubscription | null> {
  const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`,
    },
  })

  if (!response.ok) {
    return null
  }

  const data = await response.json()
  return data.data.attributes
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`,
    },
  })

  const success = response.ok

  return success
}

export async function getCustomerPortalUrl(customerId: string): Promise<string> {
  const response = await fetch(`https://api.lemonsqueezy.com/v1/customers/${customerId}`, {
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to get customer portal URL")
  }

  const data = await response.json()
  return data.data.attributes.urls.customer_portal
}
