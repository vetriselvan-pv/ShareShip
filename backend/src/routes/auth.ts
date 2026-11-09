import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { syncManager } from "../plugins/sync.js";
import { UserModel, IUser } from "../models/index.js";
import { isMongoConnected } from "../db/connection.js";
import {
  validateBody,
  LoginSchema,
  CreateSpaceSchema,
  SimulatePartnerSyncSchema,
  CreateUserSchema,
  ResetPasswordSchema,
  LoginInput,
  CreateSpaceInput,
  SimulatePartnerSyncInput,
  CreateUserInput,
  ResetPasswordInput,
} from "../validation/index.js";

// In-memory fallback list if MongoDB is offline (no mock users)
export const inMemoryUsers = new Map<string, IUser>();

const SHARESHIP_SALT = "shareship-auth-salt-v1";
const DERIVED_KEY = crypto.createHash("sha256").update(SHARESHIP_SALT).digest();

/**
 * Decrypts the encoded password received from the frontend (AES-GCM or Base64)
 */
export function decryptPassword(payload: string): string {
  if (!payload) return ""; 

  // 1. Attempt AES-GCM decryption
  try {
    const buf = Buffer.from(payload, "base64");
    if (buf.length > 28) {
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(buf.length - 16);
      const ciphertext = buf.subarray(12, buf.length - 16);
      const decipher = crypto.createDecipheriv("aes-256-gcm", DERIVED_KEY, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
      ]).toString("utf8");
      if (decrypted) return decrypted;
    }
  } catch {
    // Proceed to fallback
  }

  // 2. Attempt Base64 decoding
  try {
    const base64Decoded = Buffer.from(payload, "base64").toString("utf8");
    if (base64Decoded && /^[\x20-\x7E\s]+$/.test(base64Decoded)) {
      return base64Decoded;
    }
  } catch {
    // Proceed to raw string
  }

  // 3. Fallback to raw string
  return payload;
}

export async function authRoutes(fastify: FastifyInstance) {
  // CREATE USER / REGISTER WITH BCRYPT PASSWORD HASHING
  fastify.post(
    "/api/auth/register",
    { preHandler: validateBody(CreateUserSchema) },
    async (request, reply) => {
      const body = request.body as CreateUserInput;
      const cleanUserId = body.userId.trim().toLowerCase().replace(/^@+/, "");

      // Check if user already exists
      if (isMongoConnected) {
        try {
          const existing = await UserModel.findOne({ userId: cleanUserId });
          if (existing) {
            return reply.code(409).send({
              success: false,
              error: `User ID '@${cleanUserId}' is already registered. Please choose another.`,
            });
          }
        } catch (err) {
          fastify.log.warn("MongoDB check fallback: " + err);
        }
      } else if (inMemoryUsers.has(cleanUserId)) {
        return reply.code(409).send({
          success: false,
          error: `User ID '@${cleanUserId}' is already registered. Please choose another.`,
        });
      }

      // Decrypt the encoded password sent from the frontend, then bcrypt hash it
      const plainPassword = decryptPassword(body.password);
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

      // If image is provided, use it; otherwise pass empty string
      const avatarUrl = body.avatarUrl ? body.avatarUrl.trim() : "";

      const newUser: IUser = {
        userId: cleanUserId,
        name: body.name.trim(),
        email: body.email?.trim() || `${cleanUserId}@shareship.app`,
        password: hashedPassword,
        avatarUrl,
        createdAt: new Date().toISOString(),
      };

      if (isMongoConnected) {
        try {
          await UserModel.create(newUser);
        } catch (err: any) {
          if (err.code === 11000) {
            return reply.code(409).send({
              success: false,
              error: `User ID '@${cleanUserId}' already exists.`,
            });
          }
          fastify.log.error("Failed to create user in MongoDB: " + err);
        }
      }

      inMemoryUsers.set(cleanUserId, newUser);

      return reply.code(201).send({
        success: true,
        message: `User '@${cleanUserId}' created successfully!`,
        user: {
          userId: newUser.userId,
          name: newUser.name,
          email: newUser.email,
          avatarUrl: newUser.avatarUrl,
        },
      });
    },
  );

  // Alias for create user
  fastify.post(
    "/api/auth/create-user",
    { preHandler: validateBody(CreateUserSchema) },
    async (request, reply) => {
      return fastify
        .inject({
          method: "POST",
          url: "/api/auth/register",
          payload: request.body as any,
        })
        .then((res) => {
          reply.code(res.statusCode).headers(res.headers).send(res.payload);
        });
    },
  );

  // USER SEARCH BY USER ID OR NAME (REAL USERS ONLY, NO MOCK FALLBACK)
  fastify.get("/api/users/search", async (request, reply) => {
    const query = (request.query as { userId?: string; q?: string }) || {};
    const searchTerm = (query.userId || query.q || "")
      .trim()
      .toLowerCase()
      .replace(/^@+/, "");

    let foundUsers: Array<{
      userId: string;
      name: string;
      avatarUrl?: string;
      bio?: string;
    }> = [];

    if (isMongoConnected) {
      try {
        const mongoMatches = await UserModel.find(
          searchTerm
            ? {
                $or: [
                  { userId: { $regex: searchTerm, $options: "i" } },
                  { name: { $regex: searchTerm, $options: "i" } },
                ],
              }
            : {},
        )
          .select("-password")
          .limit(15)
          .lean();

        if (mongoMatches && mongoMatches.length > 0) {
          foundUsers = mongoMatches.map((u) => ({
            userId: u.userId,
            name: u.name,
            avatarUrl: u.avatarUrl ? u.avatarUrl.trim() : "",
            bio: u.bio || "Shareship user",
          }));
        }
      } catch (err) {
        fastify.log.warn("MongoDB search fallback: " + err);
      }
    } else {
      // In-memory real users fallback if MongoDB is not reachable
      inMemoryUsers.forEach((u) => {
        if (
          !searchTerm ||
          u.userId.toLowerCase().includes(searchTerm) ||
          u.name.toLowerCase().includes(searchTerm)
        ) {
          foundUsers.push({
            userId: u.userId,
            name: u.name,
            avatarUrl: u.avatarUrl ? u.avatarUrl.trim() : "",
            bio: u.bio || "Shareship user",
          });
        }
      });
    }

    return {
      success: true,
      query: searchTerm,
      count: foundUsers.length,
      users: foundUsers,
    };
  });

  // LOGIN: CHECKS USERNAME AND PASSWORD ONLY (NO AUTH CHECKS / NO 401 STATUS)
  fastify.post(
    "/api/auth/login",
    { preHandler: validateBody(LoginSchema) },
    async (request, reply) => {
      const { username, password } = request.body as LoginInput;
      const identifier = (username || (request.body as any).email || "")
        .trim()
        .replace(/^@+/, "");
      const lowerIdentifier = identifier.toLowerCase();

      let matchedUser: IUser | null = null;

      if (isMongoConnected) {
        try {
          const escaped = lowerIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          matchedUser = await UserModel.findOne({
            $or: [
              { userId: lowerIdentifier },
              { email: lowerIdentifier },
              { userId: { $regex: new RegExp(`^${escaped}$`, "i") } },
              { email: { $regex: new RegExp(`^${escaped}$`, "i") } },
            ],
          }).lean();
        } catch (err) {
          fastify.log.warn("MongoDB login query fallback: " + err);
        }
      }

      if (!matchedUser) {
        for (const [, u] of inMemoryUsers.entries()) {
          if (
            u.userId.toLowerCase() === lowerIdentifier ||
            (u.email && u.email.toLowerCase() === lowerIdentifier)
          ) {
            matchedUser = u;
            break;
          }
        }
      }

      // Check username exists
      if (!matchedUser) {
        return reply.code(400).send({
          success: false,
          error: "Invalid username or password",
        });
      }

      // Decrypt the encoded password sent from the frontend
      const decryptedPassword = decryptPassword(password);

      // Verify password matches
      let isPasswordValid = false;
      if (!matchedUser.password) {
        isPasswordValid = true;
      } else if (
        matchedUser.password === decryptedPassword ||
        matchedUser.password === password
      ) {
        isPasswordValid = true;
      } else {
        try {
          // Compare decrypted password against stored bcrypt hash
          isPasswordValid = await bcrypt.compare(
            decryptedPassword,
            matchedUser.password,
          );
        } catch {
          isPasswordValid = false;
        }

        // Fallback: in case stored hash was created from the encoded string directly
        if (!isPasswordValid) {
          try {
            isPasswordValid = await bcrypt.compare(
              password,
              matchedUser.password,
            );
          } catch {
            // ignore
          }
        }
      }

      if (!isPasswordValid) {
        return reply.code(400).send({
          success: false,
          error: "Invalid username or password",
        });
      }

      const space = syncManager.getSpace("shareship-space");

      return reply.code(200).send({
        success: true,
        user: {
          id: matchedUser.userId,
          userId: matchedUser.userId,
          name: matchedUser.name,
          email: matchedUser.email,
          avatarUrl: matchedUser.avatarUrl ? matchedUser.avatarUrl.trim() : "",
          isOnline: true,
        },
        partner: (space?.link.partner?.name) ? space.link.partner : null,
        space: {
          id: space?.link.spaceId || `space_${matchedUser.userId}`,
          name: space?.link.spaceName || `${matchedUser.name}'s Shared Space`,
          syncStatus: "in_sync",
          isLiveSyncActive: true,
        },
        token:
          "shareship_jwt_" +
          Buffer.from(matchedUser.userId).toString("base64") +
          "_" +
          Date.now(),
      });
    },
  );

  // RESET / FORGOT PASSWORD: SET A NEW PASSWORD FOR A USER BY USER ID OR EMAIL
  fastify.post(
    "/api/auth/reset-password",
    { preHandler: validateBody(ResetPasswordSchema) },
    async (request, reply) => {
      const { identifier, newPassword } = request.body as ResetPasswordInput;
      const cleanIdentifier = identifier.trim().replace(/^@+/, "");
      const lowerIdentifier = cleanIdentifier.toLowerCase();

      let matchedUser: any = null;

      if (isMongoConnected) {
        try {
          const escaped = lowerIdentifier.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          matchedUser = await UserModel.findOne({
            $or: [
              { userId: lowerIdentifier },
              { email: lowerIdentifier },
              { userId: { $regex: new RegExp(`^${escaped}$`, "i") } },
              { email: { $regex: new RegExp(`^${escaped}$`, "i") } },
            ],
          });
        } catch (err) {
          fastify.log.warn("MongoDB reset-password query fallback: " + err);
        }
      }

      if (!matchedUser) {
        for (const [, u] of inMemoryUsers.entries()) {
          if (
            u.userId.toLowerCase() === lowerIdentifier ||
            (u.email && u.email.toLowerCase() === lowerIdentifier)
          ) {
            matchedUser = u;
            break;
          }
        }
      }

      if (!matchedUser) {
        return reply.code(404).send({
          success: false,
          error: `No user account found matching '@${cleanIdentifier}'. Please verify your User ID or Email.`,
        });
      }

      const plainPassword = decryptPassword(newPassword);
      if (!plainPassword || plainPassword.length < 4) {
        return reply.code(400).send({
          success: false,
          error: "Password must be at least 4 characters long.",
        });
      }

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

      if (isMongoConnected) {
        try {
          await UserModel.updateOne(
            { userId: matchedUser.userId },
            { $set: { password: hashedPassword } }
          );
        } catch (err) {
          fastify.log.error("Failed to update password in MongoDB: " + err);
        }
      }

      const memUser = inMemoryUsers.get(matchedUser.userId);
      if (memUser) {
        memUser.password = hashedPassword;
      } else {
        inMemoryUsers.set(matchedUser.userId, {
          userId: matchedUser.userId,
          name: matchedUser.name,
          email: matchedUser.email,
          password: hashedPassword,
          avatarUrl: matchedUser.avatarUrl || "",
        });
      }

      return reply.code(200).send({
        success: true,
        message: `Password for '@${matchedUser.userId}' has been reset successfully. You can now sign in with your new password.`,
        userId: matchedUser.userId,
      });
    },
  );

  // Alias for forgot password
  fastify.post(
    "/api/auth/forgot-password",
    { preHandler: validateBody(ResetPasswordSchema) },
    async (request, reply) => {
      return fastify
        .inject({
          method: "POST",
          url: "/api/auth/reset-password",
          payload: request.body as any,
        })
        .then((res) => {
          reply.code(res.statusCode).headers(res.headers).send(res.payload);
        });
    },
  );

  fastify.post(
    "/api/auth/create-space",
    { preHandler: validateBody(CreateSpaceSchema) },
    async (request, reply) => {
      const body = request.body as CreateSpaceInput;
      const spaceId = "space_" + Date.now().toString(36);

      return {
        success: true,
        spaceId,
        spaceName: body.spaceName || "Our Cozy Nest",
        message: "Invitation generated for partner",
        inviteCode:
          "SHARESHIP-" +
          Math.random().toString(36).substring(2, 8).toUpperCase(),
      };
    },
  );

  fastify.get("/api/space/status", async (request, reply) => {
    const space = syncManager.getSpace("shareship-space");
    if (!space) {
      return reply.status(404).send({ error: "Space not found" });
    }
    return {
      success: true,
      link: space.link,
      recentSyncCount: space.events.length,
      lastSyncTimestamp: new Date().toISOString(),
    };
  });

  // Simulated partner interaction route to showcase real-time sync with connected partner
  fastify.post(
    "/api/space/simulate-partner-sync",
    { preHandler: validateBody(SimulatePartnerSyncSchema) },
    async (request, reply) => {
      const body = request.body as SimulatePartnerSyncInput;
      const event = syncManager.publishSyncEvent("shared-space", {
        spaceId: "shared-space",
        authorId: "user_partner",
        authorRole: "partner",
        authorName: "Partner",
        type: body.itemType || "note",
        action: "create",
        payload: {
          title:
            body.message || "Updated shared plan ❤️",
          amount: 34.5,
          createdAt: new Date().toISOString(),
        },
      });

      return {
        success: true,
        simulatedEvent: event,
      };
    },
  );
}
