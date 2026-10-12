export const CATEGORIES = ["Tech", "Lifestyle", "Education"];

// Field rules shared by the routes. max values match the column sizes in db/schema.sql.
export const RULES = {
  userId: {
    label: "User ID",
    min: 3,
    max: 50,
    pattern: /^[A-Za-z0-9_.-]+$/,
    message: "User ID can only contain letters, numbers, dots, dashes and underscores.",
  },
  // bcrypt only looks at the first 72 bytes, and passwords are never trimmed
  password: { label: "Password", min: 6, max: 72, trim: false },
  name: { label: "Name", max: 100 },
  title: { label: "Title", max: 255 },
  body: { label: "Content", max: 10000 },
  category: { label: "Category", max: 50, oneOf: CATEGORIES },
};

// Pulls the listed fields out of a form body and checks them against their rules.
// Always returns every value (so forms can be refilled) plus the first error, or null.
export function validate(body, fields) {
  const values = {};
  let error = null;

  for (const [field, rule] of Object.entries(fields)) {
    const raw = typeof body?.[field] === "string" ? body[field] : "";
    values[field] = rule.trim === false ? raw : raw.trim();
    error ??= check(values[field], rule);
  }

  return { values, error };
}

function check(value, rule) {
  if (!value) return rule.optional ? null : `${rule.label} is required.`;
  if (rule.min && value.length < rule.min) return `${rule.label} must be at least ${rule.min} characters.`;
  if (value.length > rule.max) return `${rule.label} must be ${rule.max} characters or fewer.`;
  if (rule.pattern && !rule.pattern.test(value)) return rule.message;
  if (rule.oneOf && !rule.oneOf.includes(value)) return `${rule.label} must be one of ${rule.oneOf.join(", ")}.`;
  return null;
}

// Route ids must be a positive integer that fits in a SERIAL column, otherwise null
export function parseId(param) {
  if (!/^[1-9]\d{0,9}$/.test(param)) return null;
  const id = Number(param);
  return id <= 2147483647 ? id : null;
}
