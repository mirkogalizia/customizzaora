// src/lib/shopify/storefront.ts

const SHOPIFY_DOMAIN = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!
const SHOPIFY_STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!
const API_URL = `https://${SHOPIFY_DOMAIN}/api/2024-01/graphql.json`

async function storefrontFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Shopify API error: ${res.status}`)
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

// ─── TYPES ───────────────────────────────────────────────────────────────────

export interface ShopifyProduct {
  id: string
  title: string
  handle: string
  description: string
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string }
  }
  images: { edges: { node: { url: string; altText: string | null } }[] }
  variants: {
    edges: {
      node: {
        id: string          // gid://shopify/ProductVariant/xxx
        title: string       // "Black / S"
        price: { amount: string; currencyCode: string }
        availableForSale: boolean
        selectedOptions: { name: string; value: string }[]
      }
    }[]
  }
}

export interface ShopifyCart {
  id: string
  checkoutUrl: string
  totalQuantity: number
  cost: {
    totalAmount: { amount: string; currencyCode: string }
    subtotalAmount: { amount: string; currencyCode: string }
  }
  lines: {
    edges: {
      node: {
        id: string
        quantity: number
        cost: { totalAmount: { amount: string; currencyCode: string } }
        merchandise: {
          id: string
          title: string
          price: { amount: string; currencyCode: string }
          product: {
            title: string
            images: { edges: { node: { url: string } }[] }
          }
          selectedOptions: { name: string; value: string }[]
        }
        attributes: { key: string; value: string }[]
      }
    }[]
  }
}

// ─── FRAGMENTS ───────────────────────────────────────────────────────────────

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      totalAmount { amount currencyCode }
      subtotalAmount { amount currencyCode }
    }
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          cost { totalAmount { amount currencyCode } }
          merchandise {
            ... on ProductVariant {
              id
              title
              price { amount currencyCode }
              product {
                title
                images(first: 1) { edges { node { url } } }
              }
              selectedOptions { name value }
            }
          }
          attributes { key value }
        }
      }
    }
  }
`

// ─── PRODUCT QUERIES ─────────────────────────────────────────────────────────

export async function getShopifyProduct(handle: string): Promise<ShopifyProduct | null> {
  const query = `
    query GetProduct($handle: String!) {
      product(handle: $handle) {
        id title handle description
        priceRange {
          minVariantPrice { amount currencyCode }
        }
        images(first: 10) {
          edges { node { url altText } }
        }
        variants(first: 100) {
          edges {
            node {
              id title availableForSale
              price { amount currencyCode }
              selectedOptions { name value }
            }
          }
        }
      }
    }
  `
  const data = await storefrontFetch<{ product: ShopifyProduct | null }>(query, { handle })
  return data.product
}

export async function getShopifyProducts(): Promise<ShopifyProduct[]> {
  const query = `
    query GetProducts {
      products(first: 20) {
        edges {
          node {
            id title handle description
            priceRange {
              minVariantPrice { amount currencyCode }
            }
            images(first: 1) {
              edges { node { url altText } }
            }
            variants(first: 100) {
              edges {
                node {
                  id title availableForSale
                  price { amount currencyCode }
                  selectedOptions { name value }
                }
              }
            }
          }
        }
      }
    }
  `
  const data = await storefrontFetch<{ products: { edges: { node: ShopifyProduct }[] } }>(query)
  return data.products.edges.map(e => e.node)
}

// Trova il variantId dato colore e taglia
export function findVariantId(
  product: ShopifyProduct,
  color: string,
  size: string
): string | null {
  const variant = product.variants.edges.find(({ node }) => {
    const colorOpt = node.selectedOptions.find(o => o.name === 'Colore' || o.name === 'Color')
    const sizeOpt = node.selectedOptions.find(o => o.name === 'Taglia' || o.name === 'Size')
    return colorOpt?.value === color && sizeOpt?.value === size
  })
  return variant?.node.id ?? null
}

// ─── CART MUTATIONS ──────────────────────────────────────────────────────────

export async function createCart(): Promise<ShopifyCart> {
  const mutation = `
    mutation CreateCart {
      cartCreate {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `
  const data = await storefrontFetch<{ cartCreate: { cart: ShopifyCart } }>(mutation)
  return data.cartCreate.cart
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  const query = `
    query GetCart($cartId: ID!) {
      cart(id: $cartId) { ...CartFields }
    }
    ${CART_FRAGMENT}
  `
  const data = await storefrontFetch<{ cart: ShopifyCart | null }>(query, { cartId })
  return data.cart
}

export async function addToCart(
  cartId: string,
  variantId: string,
  quantity: number,
  attributes: { key: string; value: string }[] = []
): Promise<ShopifyCart> {
  const mutation = `
    mutation AddToCart($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `
  const data = await storefrontFetch<{ cartLinesAdd: { cart: ShopifyCart; userErrors: any[] } }>(
    mutation,
    {
      cartId,
      lines: [{ merchandiseId: variantId, quantity, attributes }],
    }
  )
  if (data.cartLinesAdd.userErrors.length > 0) {
    throw new Error(data.cartLinesAdd.userErrors[0].message)
  }
  return data.cartLinesAdd.cart
}

export async function removeFromCart(cartId: string, lineId: string): Promise<ShopifyCart> {
  const mutation = `
    mutation RemoveFromCart($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `
  const data = await storefrontFetch<{ cartLinesRemove: { cart: ShopifyCart } }>(mutation, {
    cartId,
    lineIds: [lineId],
  })
  return data.cartLinesRemove.cart
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const mutation = `
    mutation UpdateCartLine($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFields }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `
  const data = await storefrontFetch<{ cartLinesUpdate: { cart: ShopifyCart } }>(mutation, {
    cartId,
    lines: [{ id: lineId, quantity }],
  })
  return data.cartLinesUpdate.cart
}
