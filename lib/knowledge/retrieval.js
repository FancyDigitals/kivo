import { formatCurrency } from '../utils/helpers';

/**
 * Formats knowledge items into context text for prompt injection.
 */
export function buildKnowledgeContext(knowledgeItems = []) {
  if (!knowledgeItems || knowledgeItems.length === 0) {
    return 'No custom knowledge base articles uploaded yet.';
  }

  return knowledgeItems
    .map(
      (item, idx) =>
        `[ARTICLE ${idx + 1}: ${item.name} (${item.type})]\n${item.content}`
    )
    .join('\n\n');
}

/**
 * Formats catalog products into context text for prompt injection.
 */
export function buildProductContext(products = []) {
  if (!products || products.length === 0) {
    return 'No products currently in catalog.';
  }

  return products
    .map(
      (p, idx) =>
        `[PRODUCT ${idx + 1}]\n- Name: ${p.name}\n- Category: ${p.category}\n- Price: ${formatCurrency(p.price, p.currency)}\n- SKU: ${p.sku}\n- Details: ${p.description || 'N/A'}`
    )
    .join('\n\n');
}