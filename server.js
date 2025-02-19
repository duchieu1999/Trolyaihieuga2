require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({
  origin: 'https://bothieuga.vercel.app',
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// MongoDB Models
const MemberSchema = new mongoose.Schema({
  userId: { type: Number, unique: true },
  fullname: String,
  level: Number,
  previousQuay: Number,
  previousKeo: Number,
  levelPercent: Number,
  exp: { type: Number, default: 0 },
  consecutiveDays: { type: Number, default: 0 },
  lastSubmissionDate: { type: Date, default: null },
  lastConsecutiveUpdate: { type: Date, default: null },
  assets: {
    quay: Number,
    keo: Number,
    vnd: Number
  },
  hasInteracted: { type: Boolean, default: false }
});

const BangCongSchema = new mongoose.Schema({
  userId: Number,
  groupId: Number,
  date: Date,
  ten: String,
  quay: Number,
  keo: Number,
  bill: Number,
  anh: Number,
  tinh_tien: Number,
  da_tru: { type: Boolean, default: false },
  giftWon: { type: Boolean, default: false },
  prizeAmount: { type: Number, default: 0 },
  processedMessageIds: { type: [Number], default: [] },
  messageIds: [Number],
  nhan_anh_bill: { type: Number, default: 0 }
});

const Member = mongoose.model('Member', MemberSchema);
const BangCong2 = mongoose.model('BangCong2', BangCongSchema);

// Serve static files for React app
app.use(express.static(path.join(__dirname, 'build')));

// MongoDB Connection
mongoose.connect('mongodb+srv://duchieufaryoung0:80E9gUahdOXmGKuy@cluster0.6nlv1cv.mongodb.net/telegram_bot_db?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('MongoDB connection error:', err);
});

// API Routes
app.get('/api/account/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    const member = await Member.findOne({ userId });
    if (!member) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [bangCongRecordsYesterday, bangCongRecordsToday] = await Promise.all([
      BangCong2.find({
        userId,
        groupId: { $ne: -1002108234982 },
        date: { $gte: yesterday, $lt: endOfYesterday }
      }),
      BangCong2.find({
        userId,
        groupId: { $ne: -1002108234982 },
        date: { $gte: today, $lt: endOfToday }
      })
    ]);

    const calculateTotals = (records) => ({
      quay: records.reduce((acc, record) => acc + (record.quay || 0), 0),
      keo: records.reduce((acc, record) => acc + (record.keo || 0), 0),
      tinhTien: records.reduce((acc, record) => acc + (record.tinh_tien || 0), 0),
    });

    const yesterdayTotals = calculateTotals(bangCongRecordsYesterday);
    const todayTotals = calculateTotals(bangCongRecordsToday);

    const calculateBonus = (totals) => 
      totals.tinhTien - ((totals.keo * 1000) + (totals.quay * 500));

    res.json({
      fullname: member.fullname,
      level: member.level,
      levelPercent: member.levelPercent,
      totalQuayYesterday: yesterdayTotals.quay,
      totalKeoYesterday: yesterdayTotals.keo,
      totalTinhTienYesterday: yesterdayTotals.tinhTien,
      totalBonusYesterday: calculateBonus(yesterdayTotals),
      totalQuayToday: todayTotals.quay,
      totalKeoToday: todayTotals.keo,
      totalTinhTienToday: todayTotals.tinhTien,
      totalBonusToday: calculateBonus(todayTotals)
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Serve React App - Send index.html for all routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
