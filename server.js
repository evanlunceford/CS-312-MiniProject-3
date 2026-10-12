import express from "express";
import session from "express-session";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/account.js";
import postRoutes from "./routes/posts.js";
import { renderError, requireAuth } from "./lib/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    // Without a configured secret, sessions just reset whenever the server restarts
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 },
  })
);

app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

app.locals.formatDate = (date) =>
  date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });

app.use(authRoutes);

// Everything below needs a signed-in user
app.use(requireAuth);
app.use(accountRoutes);
app.use(postRoutes);

app.use((req, res) => renderError(res, 404, "That page doesn't exist."));

app.use((err, req, res, next) => {
  console.error(err);
  renderError(res, 500, "Something went wrong on our end. Please try again.");
});

app.listen(PORT, () => {
  console.log(`Blog app running at http://localhost:${PORT}`);
});
