import { Router } from "express";
import pool from "../db/pool.js";
import { RULES, validate } from "../lib/validate.js";
import { requireGuest } from "../lib/auth.js";

const router = Router();

const UNIQUE_VIOLATION = "23505";

function renderSignup(res, { status = 200, values = {}, error = null } = {}) {
  res.status(status).render("signup", { pageTitle: "Sign up", values, error });
}

function renderSignin(res, { status = 200, values = {}, error = null, notice = null } = {}) {
  res.status(status).render("signin", { pageTitle: "Sign in", values, error, notice });
}

router.get("/signup", requireGuest, (req, res) => renderSignup(res));

router.post("/signup", requireGuest, async (req, res) => {
  const { values, error } = validate(req.body, {
    user_id: RULES.userId,
    name: RULES.name,
    password: RULES.password,
    confirm_password: { ...RULES.password, label: "Confirm password" },
  });
  // Never send passwords back to the page
  const formValues = { user_id: values.user_id, name: values.name };

  if (error) return renderSignup(res, { status: 400, values: formValues, error });
  if (values.password !== values.confirm_password) {
    return renderSignup(res, { status: 400, values: formValues, error: "Passwords don't match." });
  }

  const taken = await pool.query("SELECT 1 FROM users WHERE user_id = $1", [values.user_id]);
  if (taken.rowCount > 0) {
    return renderSignup(res, {
      status: 409,
      values: formValues,
      error: `The user ID "${values.user_id}" is already taken. Please choose a different one.`,
    });
  }

  try {
    const result = await pool.query(
      "INSERT INTO users (user_id, password, name) VALUES ($1, crypt($2, gen_salt('bf', 10)), $3)",
      [values.user_id, values.password, values.name]
    );
    if (result.rowCount !== 1) throw new Error("User insert did not add a row");
  } catch (err) {
    // Someone else claimed the id between the check and the insert
    if (err.code === UNIQUE_VIOLATION) {
      return renderSignup(res, { status: 409, values: formValues, error: "That user ID was just taken. Please choose another." });
    }
    throw err;
  }

  res.redirect("/signin?registered=1");
});

router.get("/signin", requireGuest, (req, res) => {
  const notice = req.query.registered ? "Account created. Sign in to continue." : null;
  renderSignin(res, { notice });
});

router.post("/signin", requireGuest, async (req, res) => {
  // Only presence and length are checked here so older accounts can always sign in
  const { values, error } = validate(req.body, {
    user_id: { label: "User ID", max: 255 },
    password: { label: "Password", max: 255, trim: false },
  });
  const formValues = { user_id: values.user_id };

  if (error) return renderSignin(res, { status: 400, values: formValues, error });

  const { rows } = await pool.query(
    "SELECT user_id, name FROM users WHERE user_id = $1 AND password = crypt($2, password)",
    [values.user_id, values.password]
  );
  if (rows.length !== 1) {
    return renderSignin(res, {
      status: 401,
      values: formValues,
      error: "That user ID and password don't match. Please try again.",
    });
  }

  // New session id on sign in so an old cookie can't be reused
  req.session.regenerate((err) => {
    if (err) return res.status(500).end();
    req.session.user = { id: rows[0].user_id, name: rows[0].name };
    req.session.save(() => res.redirect("/"));
  });
});

router.post("/signout", (req, res) => {
  req.session.destroy(() => res.redirect("/signin"));
});

export default router;
