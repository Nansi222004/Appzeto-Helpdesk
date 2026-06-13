const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Ticket = require('./models/Ticket');
const fs = require('fs');

dotenv.config();

const rawData = `[
  {
    "id": "T-104",
    "title": "Add OTP login flow",
    "status": "In Progress",
    "assignee": "Priya Sharma",
    "estimateHours": 5,
    "createdDate": "2026-04-26",
    "dueDate": "2026-05-12",
    "priority": "High",
    "tags": ["ui", "bug"]
  },
  {
    "id": "T-110",
    "title": "Migrate to Vite",
    "status": "In Progress",
    "assignee": "Divya Nair",
    "estimateHours": 12,
    "createdDate": "2026-05-04",
    "dueDate": "2026-05-29",
    "priority": "Medium",
    "tags": ["bug"]
  },
  {
    "id": "T-118",
    "title": "Compress hero video",
    "status": "Review",
    "assignee": "Divya Nair",
    "estimateHours": "abc",
    "createdDate": "2026-04-22",
    "dueDate": "2026-05-18",
    "priority": "Low",
    "tags": ["client", "perf"]
  },
  {
    "id": "T-124",
    "title": "Notification badge count",
    "status": "In Progress",
    "assignee": "Aman Verma",
    "estimateHours": 12,
    "createdDate": "2026-05-29",
    "dueDate": "2026-06-09",
    "priority": "High",
    "tags": ["perf", "ui", "design"]
  },
  {
    "id": "T-117",
    "title": "Fix date picker timezone",
    "status": "Done",
    "assignee": "Kunal Joshi",
    "estimateHours": 4,
    "createdDate": "2026-04-18",
    "dueDate": "2026-04-23",
    "priority": "Medium",
    "tags": ["api", "bug", "client"],
    "completedDate": "2026-06-13"
  }
]`;

const tasks = JSON.parse(rawData);

const mapStatus = (taskStatus) => {
  if (['Done', 'Completed'].includes(taskStatus)) return 'Closed';
  if (['In Progress', 'Review', 'QA-Hold'].includes(taskStatus)) return 'In Progress';
  return 'Open'; // Backlog, Pending Client
};

const mapCategory = (tags) => {
  if (!tags) return 'Other';
  if (tags.includes('bug')) return 'Bug';
  if (tags.includes('design') || tags.includes('ui')) return 'Feature';
  if (tags.includes('api')) return 'Feature';
  return 'Other';
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mern_auth_app');
    console.log('MongoDB Connected');

    await Ticket.deleteMany(); // Clear existing
    console.log('Cleared existing tickets');

    const ticketsToInsert = tasks.map(t => {
      let createdAt = new Date(t.createdDate);
      if (isNaN(createdAt.getTime())) createdAt = new Date();

      let slaDeadline = new Date(t.dueDate);
      if (isNaN(slaDeadline.getTime())) {
        slaDeadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000);
      }

      const description = `Imported task ${t.id}. Estimate: ${t.estimateHours} hours. Tags: ${(t.tags || []).join(', ')}. Need more description to pass the 20 char limit.`;

      return {
        title: t.title,
        description: description,
        category: mapCategory(t.tags),
        priority: t.priority || 'Low',
        status: mapStatus(t.status),
        assignedAgent: t.assignee || null,
        slaDeadline: slaDeadline,
        createdAt: createdAt
      };
    });

    await Ticket.insertMany(ticketsToInsert);
    console.log('Seeded database with tasks!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
