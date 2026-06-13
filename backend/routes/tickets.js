const express = require('express');
const router = express.Router();
const {
  getStats,
  getTickets,
  createTicket,
  getTicketById,
  updateTicket,
  addComment
} = require('../controllers/ticketController');

// @route   GET /api/tickets/stats
// @desc    Get ticket stats
router.get('/stats', getStats);

// @route   GET /api/tickets
// @desc    Get all tickets with filters, sort, pagination
router.get('/', getTickets);

// @route   POST /api/tickets
// @desc    Create a new ticket and auto-assign
router.post('/', createTicket);

// @route   GET /api/tickets/:id
// @desc    Get a specific ticket
router.get('/:id', getTicketById);

// @route   PATCH /api/tickets/:id
// @desc    Update ticket (Optimistic Locking & State Machine)
router.patch('/:id', updateTicket);

// @route   POST /api/tickets/:id/comments
// @desc    Add a comment to a ticket
router.post('/:id/comments', addComment);

module.exports = router;
