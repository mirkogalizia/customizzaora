/**
 * Shopify Storefront API — Cart Operations
 * Usa le variabili già presenti nel progetto
 */

const STOREFRONT_URL = `https://${process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`;
const STOREFRONT_TOKEN = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN!;

async function shopifyFetch(query: string, variables?: Record<string, any>) {
  const res = await fetch(STOREFRONT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// ── Tipi ──────────────────────────────────────────────────────────────────────

export interface CartLineAttribute {
  key: string;
  value: string;
}

export interface CartLine {
  id: string;
  quantity: number;
  attributes: CartLineAttribute[];
  merchandise: {
    id: string;
    title: string;       // es. "Black / M"
    priceV2: { amount: string; currencyCode: string };
    image?: { url: string; altText?: string };
    product: {
      title: string;
      handle: string;
    };
  };
}

export interface ShopifyCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: { amount: string; currencyCode: string };
    totalAmount:    { amount: string; currencyCode: string };
  };
  lines: { edges: { node: CartLine }[] };
}

// ── Fragments ─────────────────────────────────────────────────────────────────

const CART_FRAGMENT = `
  fragment CartFragment on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount { amount currencyCode }
      totalAmount    { amount currencyCode }
    }
    lines(first: 100) {
      edges {
        node {
          id
          quantity
          attributes { key value }
          merchandise {
            ... on ProductVariant {
              id
              title
              priceV2 { amount currencyCode }
              image { url altText }
              product { title handle }
            }
          }
        }
      }
    }
  }
`;

// ── Operations ────────────────────────────────────────────────────────────────

export async function createCart(): Promise<ShopifyCart> {
  const data = await shopifyFetch(`
    mutation cartCreate {
      cartCreate {
        cart { ...CartFragment }
      }
    }
    ${CART_FRAGMENT}
  `);
  return data.cartCreate.cart;
}

export async function getCart(cartId: string): Promise<ShopifyCart | null> {
  try {
    const data = await shopifyFetch(`
      query getCart($cartId: ID!) {
        cart(id: $cartId) { ...CartFragment }
      }
      ${CART_FRAGMENT}
    `, { cartId });
    return data.cart;
  } catch {
    return null;
  }
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number; attributes?: CartLineAttribute[] }[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch(`
    mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
      cartLinesAdd(cartId: $cartId, lines: $lines) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, { cartId, lines });
  if (data.cartLinesAdd.userErrors?.length) {
    throw new Error(data.cartLinesAdd.userErrors[0].message);
  }
  return data.cartLinesAdd.cart;
}

export async function updateCartLine(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<ShopifyCart> {
  const data = await shopifyFetch(`
    mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
      cartLinesUpdate(cartId: $cartId, lines: $lines) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, { cartId, lines: [{ id: lineId, quantity }] });
  return data.cartLinesUpdate.cart;
}

export async function removeFromCart(
  cartId: string,
  lineIds: string[]
): Promise<ShopifyCart> {
  const data = await shopifyFetch(`
    mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
      cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
        cart { ...CartFragment }
        userErrors { field message }
      }
    }
    ${CART_FRAGMENT}
  `, { cartId, lineIds });
  return data.cartLinesRemove.cart;
}
