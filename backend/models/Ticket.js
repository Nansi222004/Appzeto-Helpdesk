const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true, minlength: 3 },
  createdBy: { type: String, default: 'System' }, // Can be user or system
  createdAt: { type: Date, default: Date.now }
});

const historySchema = new mongoose.Schema({
  action: { type: String, required: true },
  details: { type: String },
  timestamp: { type: Date, default: Date.now }
});

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true, minlength: 5, maxlength: 100 },
  description: { type: String, required: true, minlength: 20 },
  category: { 
    type: String, 
    required: true, 
    enum: ['Bug', 'Feature', 'Billing', 'Other'] 
  },
  priority: { 
    type: String, 
    required: true, 
    enum: ['Low', 'Medium', 'High', 'Critical'] 
  },
  status: { 
    type: String, 
    required: true, 
    enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Queued'],
    default: 'Open'
  },
  version: { type: Number, default: 0 },
  assignedAgent: { type: String, default: null },
  slaDeadline: { type: Date, required: true },
  hasPriorityBumped: { type: Boolean, default: false }, // To track the one-time bump
  comments: [commentSchema],
  history: [historySchema],
}, { timestamps: true });

// Optimistic locking: Increment version on every save
ticketSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.version += 1;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
