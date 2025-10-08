// Lemon Squeezy API client and utilities

import { logger } from "@/lib/logger"

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

  await logger.info("payment", "Creating LemonSqueezy checkout", {
    email,
    userId,
    planType,
    variantId,
    storeId: LEMON_SQUEEZY_CONFIG.storeId,
  })

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

    await logger.error("payment", "LemonSqueezy checkout creation failed", new Error(`API error: ${response.status}`), {
      status: response.status,
      statusText: response.statusText,
      errorDetails,
      userId,
      email,
    })

    throw new Error(`LemonSqueezy API error (${response.status}): ${JSON.stringify(errorDetails)}`)
  }

  const data = JSON.parse(responseText)

  await logger.info("payment", "LemonSqueezy checkout URL created successfully", {
    userId,
    email,
    hasUrl: !!data.data.attributes.url,
  })

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
    await logger.warn("payment", "Failed to fetch subscription", {
      subscriptionId,
      status: response.status,
    })
    return null
  }

  const data = await response.json()
  return data.data.attributes
}

export async function cancelSubscription(subscriptionId: string): Promise<boolean> {
  await logger.info("payment", "Cancelling subscription", { subscriptionId })

  const response = await fetch(`https://api.lemonsqueezy.com/v1/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: {
      Accept: "application/vnd.api+json",
      Authorization: `Bearer ${LEMON_SQUEEZY_CONFIG.apiKey}`,
    },
  })

  const success = response.ok

  if (success) {
    await logger.info("payment", "Subscription cancelled successfully", { subscriptionId })
  } else {
    await logger.error("payment", "Failed to cancel subscription", undefined, {
      subscriptionId,
      status: response.status,
    })
  }

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
    await logger.error("payment", "Failed to get customer portal URL", undefined, {
      customerId,
      status: response.status,
    })
    throw new Error("Failed to get customer portal URL")
  }

  const data = await response.json()
  return data.data.attributes.urls.customer_portal
}
