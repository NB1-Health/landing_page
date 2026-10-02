import type { Block } from 'payload'

/**
 * The contact page: a hero, the ways to reach us, the message form, and the
 * callout through to the FAQ.
 *
 * The form SENDS. It posts to the backend, which emails support — it does not
 * open the visitor's mail app, whatever the mockup's own copy said. Keep the
 * submit label and the two hint paragraphs describing that: a page that promises
 * to open a mail app and then silently posts is the bug this block was built to
 * leave behind.
 *
 * Each method card is a title and a body; the body's line breaks are real, so the
 * postal address stays on three lines. Only a card with a link label draws a link.
 *
 * Every destination here is a SLUG, not a path — `faq-v2`, `privacy-policy-v2` —
 * and the locale is added when the page renders, so one value is right in all
 * nine. An absolute url, a `mailto:` or a `#anchor` is left exactly as typed.
 */
export const RdCtBlock: Block = {
  slug: "rdCt",
  interfaceName: "RdCtBlock",
  labels: { singular: "RdCt", plural: "RdCt" },
  fields: [
    { name: "anchorId", type: "text", defaultValue: "contact" },
    {
      name: "hero", type: 'group',
      fields: [
        { name: "heading", type: "text", localized: true, required: true, defaultValue: "Get in touch." },
        { name: "intro", type: "textarea", localized: true, defaultValue: "Questions about your order, your kit, your subscription, or your data, we’re here. The fastest way to reach us is email, and a real person reads every message." },
      ],
    },
    { name: "methodsLabel", type: "text", localized: true, defaultValue: "Ways to reach us" },
    {
      name: "methods", type: 'array',
      defaultValue: [
        {
          "title": "Email",
          "linkLabel": "support@nb1.com",
          "body": "For orders, your kit, subscription and billing, or anything else.",
          "linkHref": "mailto:support@nb1.com"
        },
        {
          "title": "Live chat",
          "body": "Chat with a real person during working hours, Monday to Friday. Look for the chat bubble in the corner of the site."
        },
        {
          "title": "By post",
          "body": "NB1 Health GmbH\nHimmelpfortgasse 13/11-12\n1010 Vienna, Austria"
        },
        {
          "title": "Response time",
          "body": "We reply within 1–2 working days. For order-specific questions, please include your order number."
        }
      ],
      fields: [
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true },
        { name: "linkLabel", type: "text", localized: true },
        { name: "linkHref", type: "text", localized: true },
      ],
    },
    {
      name: "legalLinks", type: 'array',
      defaultValue: [
        {
          "label": "Privacy & data",
          "url": "privacy-policy-v2"
        },
        {
          "label": "Terms",
          "url": "terms-and-conditions-v2"
        },
        {
          "label": "Imprint",
          "url": "imprint-v2"
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true, required: true },
        { name: "url", type: "text", localized: true },
      ],
    },
    { name: "formHeading", type: "text", localized: true, defaultValue: "Send us a message" },
    { name: "formNote", type: "textarea", localized: true, defaultValue: "Fill this in and we’ll reply by email, usually within 1–2 working days." },
    { name: "recipientEmail", type: "text", defaultValue: "support@nb1.com" },
    { name: "nameLabel", type: "text", localized: true, defaultValue: "Your name" },
    { name: "namePlaceholder", type: "text", localized: true, defaultValue: "Jane Doe" },
    { name: "emailLabel", type: "text", localized: true, defaultValue: "Your email" },
    { name: "emailPlaceholder", type: "text", localized: true, defaultValue: "jane@example.com" },
    { name: "topicLabel", type: "text", localized: true, defaultValue: "What’s it about?" },
    {
      name: "topics", type: 'array',
      defaultValue: [
        {
          "label": "My order"
        },
        {
          "label": "My kit & sample"
        },
        {
          "label": "Subscription & billing"
        },
        {
          "label": "Privacy & my data"
        },
        {
          "label": "Press or partnerships"
        },
        {
          "label": "Something else"
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true, required: true },
      ],
    },
    { name: "orderLabel", type: "text", localized: true, defaultValue: "Order number (optional)" },
    { name: "orderPlaceholder", type: "text", localized: true, defaultValue: "e.g. NB1-10428" },
    { name: "messageLabel", type: "text", localized: true, defaultValue: "Message" },
    { name: "messagePlaceholder", type: "text", localized: true },
    { name: "submitLabel", type: "text", localized: true, defaultValue: "Send message" },
    { name: "formHint", type: "textarea", localized: true, defaultValue: "No account needed. We’ll reply to the email address you give us." },
    { name: "showName", type: "checkbox", defaultValue: true },
    { name: "showEmail", type: "checkbox", defaultValue: true },
    { name: "showTopic", type: "checkbox", defaultValue: true },
    { name: "showOrder", type: "checkbox", defaultValue: true },
    { name: "calloutHeading", type: "text", localized: true, defaultValue: "Looking for a quick answer?" },
    { name: "calloutBody", type: "textarea", localized: true, defaultValue: "Many questions about billing, your kit, and your subscription are answered in our FAQ." },
    { name: "calloutCtaLabel", type: "text", localized: true, defaultValue: "See common questions" },
    { name: "calloutCtaHref", type: "text", localized: true, defaultValue: "faq-v2" },
  ],
}
