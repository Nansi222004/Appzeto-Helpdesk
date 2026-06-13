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

// @desc    Get ticket stats
const getStats = async (req, res) => {
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
};

// @desc    Get all tickets with filters, sort, pagination
const getTickets = async (req, res) => {
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
};

// @desc    Create a new ticket and auto-assign
const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    // Load balancing
    const agents = [
      { name: 'Riya', maxLoad: 3 },
      { name: 'Karan', maxLoad: 4 },
      { name: 'Dev', maxLoad: 5 }
    ];

    // Find active tickets for each agent
    const activeStatuses = ['Open', 'In Progress'];
    const assignedTickets = await Ticket.aggregate([
      { $match: { status: { $in: activeStatuses }, assignedAgent: { $ne: null } } },
      { $group: { _id: '$assignedAgent', count: { $sum: 1 } } }
    ]);

    let assignedCount = {};
    assignedTickets.forEach(t => { assignedCount[t._id] = t.count; });

    let bestAgent = null;
    let minLoadPct = Infinity;
    let minAbsCount = Infinity;

    for (let agent of agents) {
      const currentLoad = assignedCount[agent.name] || 0;
      if (currentLoad < agent.maxLoad) {
        const loadPct = currentLoad / agent.maxLoad;
        if (loadPct < minLoadPct) {
          minLoadPct = loadPct;
          minAbsCount = currentLoad;
          bestAgent = agent.name;
        } else if (loadPct === minLoadPct) {
          if (currentLoad < minAbsCount) {
            minAbsCount = currentLoad;
            bestAgent = agent.name;
          } else if (currentLoad === minAbsCount) {
            if (!bestAgent || agent.name < bestAgent) {
              bestAgent = agent.name;
            }
          }
        }
      }
    }

    // Determine SLA
    const now = new Date();
    let slaHours = 72; // Low
    if (priority === 'Medium') slaHours = 24;
    else if (priority === 'High') slaHours = 8;
    else if (priority === 'Critical') slaHours = 2;

    const slaDeadline = new Date(now.getTime() + slaHours * 60 * 60 * 1000);

    const newTicket = new Ticket({
      title,
      description,
      category,
      priority,
      assignedAgent: bestAgent,
      status: bestAgent ? 'Open' : 'Queued',
      slaDeadline,
      history: [{
        action: 'Created',
        details: bestAgent ? `Assigned to ${bestAgent}` : 'Queued because all agents are full.'
      }]
    });

    await newTicket.save();
    res.json(newTicket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Get a specific ticket
const getTicketById = async (req, res) => {
  try {
    const doc = await Ticket.findById(req.params.id);
    if (!doc) return res.status(404).send('Ticket not found');

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
    rawObj.slaState = getSLAState(doc); // Re-evaluate in case it bumped just now, though state is same
    res.json(rawObj);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Update ticket (Optimistic Locking & State Machine)
const updateTicket = async (req, res) => {
  try {
    const { version, status, assignedAgent } = req.body;

    if (version === undefined) {
      return res.status(400).json({ msg: 'Version is required for optimistic locking.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Ticket not found');

    if (ticket.version !== version) {
      return res.status(409).json({
        msg: 'Conflict. Ticket was changed by someone else.',
        serverState: ticket
      });
    }

    let statusChangedToResolvedOrClosed = false;

    // Validate state machine
    if (status && status !== ticket.status) {
      const legalTransitions = {
        'Open': ['In Progress'],
        'In Progress': ['Resolved'],
        'Resolved': ['Closed', 'In Progress'],
        'Queued': ['Open'],
        'Closed': [] // Terminal
      };

      if (!legalTransitions[ticket.status].includes(status)) {
        return res.status(400).json({ msg: `Invalid status transition from ${ticket.status} to ${status}` });
      }

      ticket.history.push({
        action: 'Status Change',
        details: `Status changed from ${ticket.status} to ${status}`
      });

      if (['Resolved', 'Closed'].includes(status) && !['Resolved', 'Closed'].includes(ticket.status)) {
        statusChangedToResolvedOrClosed = true;
      }

      ticket.status = status;
    }

    // Manual Agent Assignment by Admin
    if (assignedAgent !== undefined && assignedAgent !== ticket.assignedAgent) {
      ticket.history.push({
        action: 'Agent Reassigned',
        details: `Assigned from ${ticket.assignedAgent || 'Unassigned'} to ${assignedAgent || 'Unassigned'}`
      });
      ticket.assignedAgent = assignedAgent;
      if (assignedAgent !== null && ticket.status === 'Queued') {
        ticket.status = 'Open';
      } else if (assignedAgent === null && ['Open', 'In Progress'].includes(ticket.status)) {
        ticket.status = 'Queued';
      }
    }

    await ticket.save();

    // Auto-assign Queued ticket if agent freed up
    if (statusChangedToResolvedOrClosed && ticket.assignedAgent) {
      const freedAgent = ticket.assignedAgent;
      // We only assign if the freed agent is below max capacity. 
      // Simplified: we just find the oldest queued ticket and assign it to them.
      const oldestQueued = await Ticket.findOne({ status: 'Queued' }).sort({ createdAt: 1 });
      if (oldestQueued) {
        oldestQueued.assignedAgent = freedAgent;
        oldestQueued.status = 'Open';
        oldestQueued.history.push({
          action: 'Auto-Assigned',
          details: `Automatically assigned to ${freedAgent} from queue.`
        });
        await oldestQueued.save();
      }
    }

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Add a comment to a ticket
const addComment = async (req, res) => {
  try {
    const { text, createdBy } = req.body;

    if (!text || text.length < 3) {
      return res.status(400).json({ msg: 'Comment must be at least 3 characters long.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) return res.status(404).send('Ticket not found');

    if (ticket.status === 'Closed') {
      return res.status(400).json({ msg: 'Cannot add comments to a closed ticket.' });
    }

    ticket.comments.push({ text, createdBy: createdBy || 'User' });

    // We increment version when saving, because pre('save') is configured.
    await ticket.save();

    res.json(ticket);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

module.exports = {
  getStats,
  getTickets,
  createTicket,
  getTicketById,
  updateTicket,
  addComment
};
