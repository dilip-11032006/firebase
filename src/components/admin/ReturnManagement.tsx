import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Package, User, Calendar, CheckCircle, Search, Filter } from 'lucide-react';
import { hybridDataService } from '../../services/hybridDataService';
import { BorrowRequest } from '../../types';

interface ReturnManagementProps {
  onUpdate: () => void;
}

const ReturnManagement: React.FC<ReturnManagementProps> = ({ onUpdate }) => {
  const [approvedItems, setApprovedItems] = useState<BorrowRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate' | 'studentName' | 'componentName'>('dueDate');

  useEffect(() => {
    loadApprovedItems();
  }, []);

  const loadApprovedItems = () => {
    const allRequests = hybridDataService.getRequests();
    const approved = allRequests.filter(r => r.status === 'approved');
    setApprovedItems(approved.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()));
  };

  const handleReturn = (request: BorrowRequest) => {
    const components = hybridDataService.getComponents();
    const component = components.find(c => c.id === request.componentId);
    
    if (component) {
      component.availableQuantity += request.quantity;
      hybridDataService.updateComponent(component);
    }

    const updatedRequest = {
      ...request,
      status: 'returned' as const,
      returnedAt: new Date().toISOString(),
    };
    hybridDataService.updateRequest(updatedRequest);

    // Add notification for student
    hybridDataService.addNotification({
      id: `notif-${Date.now()}`,
      userId: request.studentId,
      title: 'Item Returned Successfully',
      message: `Your return of ${request.componentName} x${request.quantity} has been confirmed. Thank you for using Isaac Asimov Robotics Lab!`,
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    });

    loadApprovedItems();
    onUpdate();
  };

  const filteredItems = approvedItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.studentName.toLowerCase().includes(searchLower) ||
      item.componentName.toLowerCase().includes(searchLower) ||
      item.rollNo.toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    switch (sortBy) {
      case 'studentName':
        return a.studentName.localeCompare(b.studentName);
      case 'componentName':
        return a.componentName.localeCompare(b.componentName);
      default:
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
  });

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  const getDaysRemaining = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const timeDiff = due.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-xl rounded-2xl border border-green-500/20 p-6"
      >
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl shadow-lg">
            <RotateCcw className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Return Management</h2>
            <p className="text-green-200">Process component returns and update inventory</p>
          </div>
        </div>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-peacock-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, component, or roll no..."
            className="w-full pl-10 pr-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white placeholder-dark-400 focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200"
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-peacock-400 w-5 h-5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full pl-10 pr-4 py-3 bg-dark-700/50 border border-dark-600 rounded-xl text-white focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200 appearance-none"
          >
            <option value="dueDate">Sort by Due Date</option>
            <option value="studentName">Sort by Student Name</option>
            <option value="componentName">Sort by Component</option>
          </select>
        </div>

        <div className="flex items-center justify-center bg-dark-700/30 rounded-xl border border-dark-600 px-4 py-3">
          <span className="text-peacock-300 font-medium">
            {filteredItems.length} items to return
          </span>
        </div>
      </motion.div>

      {/* Items List */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredItems.map((item, index) => {
            const overdue = isOverdue(item.dueDate);
            const daysRemaining = getDaysRemaining(item.dueDate);
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.01, y: -2 }}
                className={`relative overflow-hidden bg-dark-800/50 backdrop-blur-xl rounded-2xl border p-6 transition-all duration-300 ${
                  overdue 
                    ? 'border-red-500/30 bg-red-500/5' 
                    : daysRemaining <= 3 
                    ? 'border-yellow-500/30 bg-yellow-500/5'
                    : 'border-peacock-500/20 hover:border-peacock-500/40'
                }`}
              >
                {/* Status Indicator */}
                <div className={`absolute top-0 left-0 w-full h-1 ${
                  overdue ? 'bg-gradient-to-r from-red-500 to-red-600' :
                  daysRemaining <= 3 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}></div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 bg-peacock-500/20 rounded-xl">
                        <Package className="w-6 h-6 text-peacock-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-xl">{item.componentName}</h3>
                        <p className="text-peacock-300">Quantity: {item.quantity}</p>
                      </div>
                      {overdue && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-red-500/20 border border-red-500/30 px-3 py-1 rounded-full text-red-400 text-sm font-medium"
                        >
                          {Math.abs(daysRemaining)} days overdue
                        </motion.div>
                      )}
                      {!overdue && daysRemaining <= 3 && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="bg-yellow-500/20 border border-yellow-500/30 px-3 py-1 rounded-full text-yellow-400 text-sm font-medium"
                        >
                          Due in {daysRemaining} days
                        </motion.div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-peacock-400" />
                        <div>
                          <p className="text-peacock-300">Student</p>
                          <p className="text-white font-semibold">{item.studentName}</p>
                          <p className="text-peacock-300 text-xs">Roll: {item.rollNo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-peacock-400" />
                        <div>
                          <p className="text-peacock-300">Borrowed Date</p>
                          <p className="text-white">{new Date(item.requestDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-peacock-400" />
                        <div>
                          <p className="text-peacock-300">Due Date</p>
                          <p className={`font-semibold ${overdue ? 'text-red-400' : 'text-white'}`}>
                            {new Date(item.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleReturn(item)}
                      className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="relative z-10 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Mark as Returned
                      </div>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full mb-6"
          >
            <RotateCcw className="w-10 h-10 text-green-400" />
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-3">No Items to Return</h3>
          <p className="text-peacock-300 text-lg">
            {searchTerm ? 'No items match your search criteria.' : 'All approved items have been returned.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default ReturnManagement;