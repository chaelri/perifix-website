import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-f7e00e4c/health", (c) => {
  return c.json({ status: "ok" });
});

// User login endpoint
app.post("/make-server-f7e00e4c/login", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, role, name } = body;

    if (!email || !password || !role) {
      return c.json({ error: "Email, password, and role are required" }, 400);
    }

    // Simple authentication (for prototype purposes)
    // Admin: admin@perifix.site / admin123
    // Students: any email with password student123
    let isAuthenticated = false;
    let userRole = role;

    if (role === "admin") {
      isAuthenticated = email === "admin@perifix.site" && password === "admin123";
    } else if (role === "student") {
      isAuthenticated = password === "student123";
    }

    if (!isAuthenticated) {
      return c.json({ error: "Invalid credentials" }, 401);
    }

    // Create user session
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionToken = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const userData = {
      id: userId,
      email,
      name: name || email.split('@')[0],
      role: userRole,
      loginTime: new Date().toISOString(),
    };

    // Store session
    await kv.set(`session:${sessionToken}`, userData);
    
    // Store user in user list
    await kv.set(`user:${userId}`, userData);

    console.log(`User login successful: ${email} as ${userRole}`);
    
    return c.json({
      success: true,
      token: sessionToken,
      user: userData,
    });
  } catch (error) {
    console.log(`Login error: ${error}`);
    return c.json({ error: "Login failed", details: String(error) }, 500);
  }
});

// Verify session endpoint
app.get("/make-server-f7e00e4c/verify", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const session = await kv.get(`session:${token}`);

    if (!session) {
      return c.json({ error: "Invalid session" }, 401);
    }

    return c.json({
      success: true,
      user: session,
    });
  } catch (error) {
    console.log(`Verify session error: ${error}`);
    return c.json({ error: "Verification failed", details: String(error) }, 500);
  }
});

// Get all users (admin only)
app.get("/make-server-f7e00e4c/users", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const session = await kv.get(`session:${token}`);

    if (!session || session.role !== "admin") {
      return c.json({ error: "Unauthorized - Admin access required" }, 403);
    }

    // Get all users
    const userKeys = await kv.getByPrefix("user:");
    const users = userKeys.map(item => item.value);

    // Sort by login time (most recent first)
    users.sort((a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime());

    return c.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error) {
    console.log(`Get users error: ${error}`);
    return c.json({ error: "Failed to fetch users", details: String(error) }, 500);
  }
});

// Logout endpoint
app.post("/make-server-f7e00e4c/logout", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) {
      return c.json({ error: "No authorization header" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Delete session
    await kv.del(`session:${token}`);

    return c.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.log(`Logout error: ${error}`);
    return c.json({ error: "Logout failed", details: String(error) }, 500);
  }
});

Deno.serve(app.fetch);