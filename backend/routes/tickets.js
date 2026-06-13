const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');

// Helper for SLA calculation
const getSLAState = (ticket) => {
  const now = new Date();
  const deadline = new Date(ticket.slaDeadline);
  const created = new Date(ticket.createdAt);
  
  if (now > deadline) return 'breached';
  
  const totalTime = deadline - created;
  const elapsed = now - created;
  if (elapsed / totalTime >= 0.75) return 'at_risk';
  
  return 'ok';
};

// Map priority bump
const bumpPriority = (priority) => {
  if (priority === 'Low') return 'Medium';
  if (priority === 'Medium') return 'High';
  if (priority === 'High') return 'Critical';
  return 'Critical'; // Can't go higher
};

// @route   GET /api/tickets/stats
// @desc    Get ticket stats
router.get('/stats', async (req, res) => {
  try {
    const stats = await Ticket.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } }
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } }
          ]
        }
      }
    ]);

    // Format response
    const formattedStats = {
      status: {},
      priority: {}
    };

    if (stats[0].byStatus) {
      stats[0].byStatus.forEach(s => { formattedStats.status[s._id] = s.count; });
    }
    if (stats[0].byPriority) {
      stats[0].byPriority.forEach(p => { formattedStats.priority[p._id] = p.count; });
    }

    res.json(formattedStats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/tickets
// @desc    Get all tickets with filters, sort, pagination
router.get('/', async (req, res) => {
  try {
    const { status, priority, search, sort, page = 1, limit = 6 } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortObj = { createdAt: -1 }; // default newest
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    else if (sort === 'priority') {
      // Priority sorting is tricky in MongoDB without aggregation or a weight field.
      // We will sort later in JS if sort=priority is passed, or modify the aggregation.
      // For simplicity, we'll fetch all matching if priority sort, then slice.
      // Or we can add a pre-save hook to add a 'priorityWeight' field.
    }

    // Since we need to update SLA breached priorities on read, we should do a pass over the tickets.
    // However, updating DB on a GET is usually a bad practice but required by instructions:
    // "A breached ticket that is still Open or In Progress gets its priority bumped one level — only once, with a history entry — the next time it is read."
    
    // We fetch current page tickets
    const tickets = await Ticket.find(query)
      .sort(sort === 'priority' ? undefined : sortObj)
      .lean(); // Use lean for performance, but we need to save so maybe not.

    // If sort=priority, we sort in JS
    if (sort === 'priority') {
      const priorityWeights = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      tickets.sort((a, b) => priorityWeights[b.priority] - priorityWeights[a.priority]);
    }

    // Apply pagination in JS because we sorted in JS potentially, or we can just slice
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTickets = tickets.slice(startIndex, endIndex);

    // Process SLA and priority bumps
    const processedTickets = [];
    for (let t of paginatedTickets) {
      let doc = await Ticket.findById(t._id); // Fetch full doc to save if needed
      
      const slaState = getSLAState(doc);
      
      if (slaState === 'breached' && !doc.hasPriorityBumped && ['Open', 'In Progress'].includes(doc.status)) {
        const oldPriority = doc.priority;
        doc.priority = bumpPriority(doc.priority);
        doc.hasPriorityBumped = true;
        doc.history.push({
          action: 'Priority Bump',
          details: `Automatically bumped priority from ${oldPriority} to ${doc.priority} due to SLA breach.`
        });
        await doc.save();
      }

      const rawObj = doc.toObject();
      rawObj.slaState = getSLAState(doc); // recalculate just in case
      processedTickets.push(rawObj);
    }

    res.json({
      tickets: processedTickets,
      totalPages: Math.ceil(tickets.length / limit),
      currentPage: Number(page),
      totalTickets: tickets.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
