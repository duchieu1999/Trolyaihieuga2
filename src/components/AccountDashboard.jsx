import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Award, TrendingUp, DollarSign, Coffee, Candy } from 'lucide-react';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

function AccountDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Lấy userId từ Telegram Web App
        const tg = window.Telegram.WebApp;
        const userId = tg.initDataUnsafe?.user?.id;

        if (!userId) {
          throw new Error('Cannot get Telegram user ID');
        }

        const response = await fetch('https://yourserver.com/api/account/123')
  .then(response => {
    if (!response.ok) throw new Error("Lỗi API");
    return response.json();
  })
  .then(data => console.log(data))
  .catch(error => console.error("Lỗi:", error));
        const jsonData = await response.json();
        setData(jsonData);
      } catch (err) {
        setError(err.message);
      } finally {
        // Giả lập loading trong 2.5s
        setTimeout(() => setLoading(false), 2500);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-24 h-24 mb-8"
          >
            <div className="w-full h-full rounded-full border-4 border-blue-500 border-t-transparent"/>
          </motion.div>
          <motion.h1
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-3xl font-bold text-white"
          >
            GameVier
          </motion.h1>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center text-red-600">
          <h2 className="text-2xl font-bold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900">
      <main className="container mx-auto px-4 py-8">
        {/* Header Section */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="p-4 bg-blue-500 rounded-full">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{data.fullname}</h1>
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-400" />
                <span className="text-white">Level {data.level}</span>
                <div className="w-32 h-2 bg-white/20 rounded-full">
                  <div 
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${data.levelPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Today's Stats */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Today's Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Quay</span>
                </div>
                <span className="text-white font-bold">{data.totalQuayToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Candy className="w-5 h-5 text-pink-400" />
                  <span className="text-white">Kẹo</span>
                </div>
                <span className="text-white font-bold">{data.totalKeoToday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-white">Earnings</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(data.totalTinhTienToday)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">Bonus</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(data.totalBonusToday)}</span>
              </div>
            </div>
          </motion.div>

          {/* Yesterday's Stats */}
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-4">Yesterday's Stats</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coffee className="w-5 h-5 text-blue-400" />
                  <span className="text-white">Quay</span>
                </div>
                <span className="text-white font-bold">{data.totalQuayYesterday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Candy className="w-5 h-5 text-pink-400" />
                  <span className="text-white">Kẹo</span>
                </div>
                <span className="text-white font-bold">{data.totalKeoYesterday}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-white">Earnings</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(data.totalTinhTienYesterday)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">Bonus</span>
                </div>
                <span className="text-white font-bold">{formatCurrency(data.totalBonusYesterday)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg"
        >
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <motion.p
                animate={{ x: [-100, 0] }}
                transition={{ duration: 0.5 }}
                className="text-white text-sm"
              >
                © 2024 GameVier. All rights reserved.
              </motion.p>
              <motion.div
                animate={{ x: [100, 0] }}
                transition={{ duration: 0.5 }}
                className="flex gap-4"
              >
                <a href="#" className="text-white hover:text-blue-400 transition-colors">
                  Terms
                </a>
                <a href="#" className="text-white hover:text-blue-400 transition-colors">
                  Privacy
                </a>
                <a href="#" className="text-white hover:text-blue-400 transition-colors">
                  Support
                </a>
              </motion.div>
            </div>
          </div>
        </motion.footer>
      </main>
    </div>
  );
}

export default AccountDashboard;
