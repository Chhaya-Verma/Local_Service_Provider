import { Request, Response } from "express";
import Support from "../models/Support";
import Booking from "../models/Booking";
import { AuthRequest } from "../middleware/auth";

// Create a support ticket
export const createSupportTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const {
      type,
      subject,
      description,
      bookingId,
      priority = "medium",
      attachments = [],
    } = req.body;

    // If bookingId provided, validate it belongs to user
    if (bookingId) {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: "Booking not found",
        });
        return;
      }

      const hasAccess = booking.customerId.toString() === user._id.toString() ||
                       booking.serviceProviderId.toString() === user._id.toString();

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: "Access denied to this booking",
        });
        return;
      }
    }

    // Create support ticket
    const ticket = new Support({
      userId: user._id,
      bookingId,
      user: {
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
      },
      type,
      priority,
      subject,
      description,
      attachments,
      messages: [
        {
          sender: user._id,
          senderName: user.name,
          senderType: "user",
          message: description,
          timestamp: new Date(),
        },
      ],
    });

    await ticket.save();

    res.status(201).json({
      success: true,
      message: "Support ticket created successfully",
      data: { ticket },
    });
  } catch (error: any) {
    console.error("Create support ticket error:", error);
    
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validationErrors,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Internal server error while creating support ticket",
    });
  }
};

// Get user's support tickets
export const getUserSupportTickets = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { 
      status, 
      type,
      page = 1, 
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc"
    } = req.query;

    const query: any = { userId: user._id };
    if (status && status !== "all") {
      query.status = status;
    }
    if (type && type !== "all") {
      query.type = type;
    }

    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === "asc" ? 1 : -1;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const tickets = await Support.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select('-messages'); // Exclude messages for list view

    const total = await Support.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        tickets,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum,
        },
      },
    });
  } catch (error: any) {
    console.error("Get user support tickets error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching support tickets",
    });
  }
};

// Get support ticket by ID
export const getSupportTicketById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { ticketId } = req.params;
    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
      return;
    }

    // Check if user has access to this ticket
    if (ticket.userId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: "Access denied to this support ticket",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { ticket },
    });
  } catch (error: any) {
    console.error("Get support ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching support ticket",
    });
  }
};

// Add message to support ticket
export const addMessageToTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { ticketId } = req.params;
    const { message } = req.body;

    const ticket = await Support.findById(ticketId);
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
      return;
    }

    // Check if user has access to this ticket
    if (ticket.userId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: "Access denied to this support ticket",
      });
      return;
    }

    // Check if ticket is still open
    if (ticket.status === "closed") {
      res.status(400).json({
        success: false,
        message: "Cannot add message to a closed ticket",
      });
      return;
    }

    // Add message
    ticket.messages.push({
      sender: user._id,
      senderName: user.name,
      senderType: "user",
      message,
      timestamp: new Date(),
    });

    // Update ticket status if it was resolved
    if (ticket.status === "resolved") {
      ticket.status = "open";
    }

    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Message added successfully",
      data: { ticket },
    });
  } catch (error: any) {
    console.error("Add message error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while adding message",
    });
  }
};

// Close support ticket
export const closeSupportTicket = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const { ticketId } = req.params;
    const ticket = await Support.findById(ticketId);

    if (!ticket) {
      res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
      return;
    }

    // Check if user has access to this ticket
    if (ticket.userId.toString() !== user._id.toString()) {
      res.status(403).json({
        success: false,
        message: "Access denied to this support ticket",
      });
      return;
    }

    // Update ticket status
    ticket.status = "closed";
    await ticket.save();

    res.status(200).json({
      success: true,
      message: "Support ticket closed successfully",
      data: { ticket },
    });
  } catch (error: any) {
    console.error("Close support ticket error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while closing support ticket",
    });
  }
};
