import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { History, Search, Filter, Calendar, User, Package } from 'lucide-react';
import { hybridDataService } from '../../services/hybridDataService';
import { BorrowRequest } from '../../types';

const BorrowHistory: React.FC = () => {
  const [history, setHistory] = useState<BorrowRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const requests = hybridDataService.getRequests();
    setHistory(requests.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));
  };

  const filteredHistory = history.filter(request => {
    const matchesSearch = request.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.componentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.rollNo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    const matchesDate = !dateFilter || 
                       new Date(request.requestDate).toISOString().split('T')[0] === dateFilter;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'rejected':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'returned':
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
      default:
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-peacock-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, component, or roll no..."
            className="w-full pl-10 pr-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-peacock-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200 appearance-none"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="returned">Returned</option>
          </select>
        </div>
        
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-peacock-400 w-5 h-5" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="bg-dark-800/50 backdrop-blur-xl rounded-xl border border-peacock-500/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-dark-700/50">
              <tr>
                <th className="text-left p-4 text-peacock-300 font-medium">Student</th>
                <th className="text-left p-4 text-peacock-300 font-medium">Component</th>
                <th className="text-left p-4 text-peacock-300 font-medium">Quantity</th>
                <th className="text-left p-4 text-peacock-300 font-medium">Request Date</th>
                <th className="text-left p-4 text-peacock-300 font-medium">Due Date</th>
                <th className="text-left p-4 text-peacock-300 font-medium">Status</th>
                <th className="text-left p-4 text-peacock-300 font-medium">Action Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((request, index) => (
                <motion.tr
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="border-t border-dark-700 hover:bg-dark-700/30 transition-colors duration-200"
                >
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-peacock-400" />
                      <div>
                        <p className="text-white font-medium">{request.studentName}</p>
                        <p className="text-peacock-300 text-sm">{request.rollNo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-peacock-400" />
                      <span className="text-white">{request.componentName}</span>
                    </div>
                  </td>
                  <td className="p-4 text-white">{request.quantity}</td>
                  <td className="p-4 text-white">{new Date(request.requestDate).toLocaleDateString()}</td>
                  <td className="p-4 text-white">{new Date(request.dueDate).toLocaleDateString()}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-4 text-white text-sm">
                    {request.approvedAt && new Date(request.approvedAt).toLocaleDateString()}
                    {request.returnedAt && new Date(request.returnedAt).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredHistory.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <History className="w-16 h-16 text-peacock-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No History Found</h3>
          <p className="text-peacock-300">
            {searchTerm || statusFilter !== 'all' || dateFilter
              ? 'No records match your current filters.'
              : 'No borrowing history available yet.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default BorrowHistory;