import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Extend the Request object to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey"; // Use the same secret as in authController and ensure this matches your .env

export const protect = (req: Request, res: Response, next: NextFunction) => {
  let token;

  // Check if an Authorization header exists and starts with 'Bearer'
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Extract the token from the header
      token = req.headers.authorization.split(" ")[1];

      // Verify the token
      // As a best practice, define an interface for the decoded payload instead of 'any'
      const decoded: any = jwt.verify(token, JWT_SECRET);

      // Attach the userId from the token payload to the request object
      req.userId = decoded.userId;

      // Call next() to pass control to the next middleware or route handler
      next();
    } catch (error: any) {
      // If token verification fails (e.g., expired, invalid signature)
      console.error("Token verification failed:", error.message);
      res.status(401).json({ message: "Not authorized, token failed." });
    }
  } else {
    // If no token is provided in the header
    res.status(401).json({ message: "Not authorized, no token." });
  }
};
