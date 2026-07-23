// Garment-category vocabulary used to separate genuinely fashion-relevant shared
// keywords from incidental brand-name overlap (e.g. "nike", "mango", "birkenstock")
// that dominates raw keyword-overlap results by search volume alone.
//
// Passed to DataForSEO's server-side `filters` param (no extra cost vs an
// unfiltered call). Confirmed working syntax: PCRE-style `\b` word boundaries —
// Postgres-style `\y` is rejected by DataForSEO's regex engine, and a bare
// substring match (no boundaries) false-positives on things like "dress" inside
// "dresser"/"chest dresser".
export const FASHION_KEYWORD_REGEX =
  '\\b(dress(es)?|jeans?|trousers?|pants?|jackets?|jumpers?|sweaters?|hoodies?|sweatshirts?|skirts?|shirts?|blazers?|coats?|cardigans?|leggings?|joggers?|tracksuits?|swimwear|bikinis?|jumpsuits?|co-?ords?|blouses?)\\b';
