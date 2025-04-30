const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { ValidationError } = require("sequelize");

/**
 * Controller to handle user registration
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        status: "error",
        message:
          "Email already registered. Please use a different email or login.",
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: role || "client", // Default to client if not specified
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    // Return user info and token (excluding password)
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

/**
 * Controller to handle user login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Verify password
    const isPasswordValid = await user.isValidPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Invalid email or password",
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    // Return user info and token (excluding password)
    const userWithoutPassword = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      skills: user.skills,
      hourlyRate: user.hourlyRate,
      lastLogin: user.lastLogin,
    };

    res.status(200).json({
      status: "success",
      message: "Login successful",
      data: {
        user: userWithoutPassword,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to get current user profile
 */
exports.getProfile = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to update user profile
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, bio, skills, hourlyRate } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Update fields
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.bio = bio !== undefined ? bio : user.bio;
    user.skills = skills || user.skills;
    user.hourlyRate = hourlyRate !== undefined ? hourlyRate : user.hourlyRate;

    // If there's a profile image in the request (handled by a separate middleware)
    if (req.file) {
      user.profileImage = `/uploads/profiles/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      status: "success",
      message: "Profile updated successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImage: user.profileImage,
          bio: user.bio,
          skills: user.skills,
          hourlyRate: user.hourlyRate,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return res.status(400).json({
        status: "error",
        message: "Validation failed",
        errors: error.errors.map((e) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }
    next(error);
  }
};

/**
 * Controller to change password
 */
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: "error",
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await user.isValidPassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        status: "error",
        message: "Current password is incorrect",
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
