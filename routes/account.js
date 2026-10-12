import { Router } from "express";
import pool from "../db/pool.js";
import { RULES, validate } from "../lib/validate.js";

const router = Router();

const UNIQUE_VIOLATION = "23505";

function renderAccount(req, res, { status = 200, values, error = null, notice = null } = {}) {
  res.status(status).render("account", {
    pageTitle: "Account",
    values: values || { user_id: req.session.user.id, name: req.session.user.name },
    error,
    notice,
  });
}

router.get("/account", (req, res) => {
  const notice = req.query.updated ? "Your account has been updated." : null;
  renderAccount(req, res, { notice });
});

router.post("/account", async (req, res) => {
  const { values, error } = validate(req.body, {
    user_id: RULES.userId,
    name: RULES.name,
    new_password: { ...RULES.password, label: "New password", optional: true },
    confirm_password: { ...RULES.password, label: "Confirm new password", optional: true },
    current_password: { label: "Current password", max: 255, trim: false },
  });
  const formValues = { user_id: values.user_id, name: values.name };
  const fail = (status, message) => renderAccount(req, res, { status, values: formValues, error: message });

  if (error) return fail(400, error);
  if (values.new_password !== values.confirm_password) return fail(400, "New passwords don't match.");

  const currentId = req.session.user.id;
  if (values.user_id !== currentId) {
    const taken = await pool.query("SELECT 1 FROM users WHERE user_id = $1", [values.user_id]);
    if (taken.rowCount > 0) return fail(409, `The user ID "${values.user_id}" is already taken.`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // The current password check is part of the WHERE, so a wrong password updates nothing.
    // Changing user_id cascades to blogs.creator_user_id through the foreign key.
    const updated = await client.query(
      `UPDATE users
          SET user_id = $1,
              name = $2,
              password = CASE WHEN $3::text = '' THEN password ELSE crypt($3, gen_salt('bf', 10)) END
        WHERE user_id = $4 AND password = crypt($5, password)
        RETURNING user_id, name`,
      [values.user_id, values.name, values.new_password, currentId, values.current_password]
    );
    if (updated.rowCount !== 1) {
      await client.query("ROLLBACK");
      return fail(401, "Your current password is incorrect.");
    }

    // Posts store the creator's name, so keep them in sync
    await client.query("UPDATE blogs SET creator_name = $1 WHERE creator_user_id = $2", [
      values.name,
      values.user_id,
    ]);
    await client.query("COMMIT");

    req.session.user = { id: updated.rows[0].user_id, name: updated.rows[0].name };
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === UNIQUE_VIOLATION) return fail(409, `The user ID "${values.user_id}" is already taken.`);
    throw err;
  } finally {
    client.release();
  }

  res.redirect("/account?updated=1");
});

export default router;
