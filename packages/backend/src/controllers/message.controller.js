const { Message, User, Project } = require("../models");
const { Op } = require("sequelize");

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { content, receiverId, projectId } = req.body;
    const senderId = req.user.id;

    const message = await Message.create({
      content,
      senderId,
      receiverId,
      projectId,
    });

    return res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ error: "Failed to send message" });
  }
};

// Get conversation between two users for a specific project
exports.getConversation = async (req, res) => {
  try {
    const { projectId, otherUserId } = req.params;
    const userId = req.user.id;

    // Verify that both users are involved in the project
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        status: "error",
        message: "Project not found",
      });
    }

    const isInvolved =
      project.clientId === userId ||
      project.assignedToId === userId ||
      project.clientId === otherUserId ||
      project.assignedToId === otherUserId;

    if (!isInvolved) {
      return res.status(403).json({
        status: "error",
        message: "You do not have access to this conversation",
      });
    }

    // Get messages between the two users for the project
    const messages = await Message.findAll({
      where: {
        projectId,
        [Op.or]: [
          {
            senderId: userId,
            receiverId: otherUserId,
          },
          {
            senderId: otherUserId,
            receiverId: userId,
          },
        ],
      },
      include: [
        {
          model: User,
          as: "sender",
          attributes: [
            "id",
            "username",
            "firstName",
            "lastName",
            "profileImage",
          ],
        },
        {
          model: User,
          as: "receiver",
          attributes: [
            "id",
            "username",
            "firstName",
            "lastName",
            "profileImage",
          ],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Mark unread messages as read
    await Message.update(
      { isRead: true },
      {
        where: {
          projectId,
          senderId: otherUserId,
          receiverId: userId,
          isRead: false,
        },
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        messages,
      },
    });
  } catch (error) {
    console.error("Error getting conversation:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get conversation",
    });
  }
};

// Get all conversations for a user
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get the latest message from each conversation
    const conversations = await Message.findAll({
      attributes: [
        "projectId",
        [
          sequelize.fn("MAX", sequelize.col("Message.createdAt")),
          "lastMessageDate",
        ],
      ],
      where: {
        [Op.or]: [{ senderId: userId }, { receiverId: userId }],
      },
      group: ["projectId", "Project.id", "sender.id", "receiver.id"],
      include: [
        {
          model: Project,
          attributes: ["id", "title", "status"],
          required: true,
        },
        {
          model: User,
          as: "sender",
          attributes: [
            "id",
            "username",
            "firstName",
            "lastName",
            "profileImage",
          ],
        },
        {
          model: User,
          as: "receiver",
          attributes: [
            "id",
            "username",
            "firstName",
            "lastName",
            "profileImage",
          ],
        },
      ],
      order: [
        [sequelize.fn("MAX", sequelize.col("Message.createdAt")), "DESC"],
      ],
    });

    // Get unread message counts for each conversation
    const unreadCounts = await Message.findAll({
      attributes: [
        "projectId",
        [sequelize.fn("COUNT", sequelize.col("id")), "unreadCount"],
      ],
      where: {
        receiverId: userId,
        isRead: false,
      },
      group: ["projectId"],
    });

    // Combine the data
    const conversationsWithMeta = conversations.map((conversation) => {
      const unreadCount = unreadCounts.find(
        (count) => count.projectId === conversation.projectId
      );

      return {
        ...conversation.toJSON(),
        unreadCount: unreadCount ? parseInt(unreadCount.get("unreadCount")) : 0,
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        conversations: conversationsWithMeta,
      },
    });
  } catch (error) {
    console.error("Error getting conversations:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get conversations",
    });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { projectId, otherUserId } = req.params;
    const userId = req.user.id;

    await Message.update(
      { isRead: true },
      {
        where: {
          projectId,
          senderId: otherUserId,
          receiverId: userId,
          isRead: false,
        },
      }
    );

    res.status(200).json({
      status: "success",
      message: "Messages marked as read",
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to mark messages as read",
    });
  }
};

// Get unread message count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });

    return res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    return res.status(500).json({ error: "Failed to fetch unread count" });
  }
};
