import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Package, Search, Trash2 } from 'lucide-react';
import { hybridDataService } from '../../services/hybridDataService';
import { Component } from '../../types';

const InventoryManagement: React.FC = () => {
  const [components, setComponents] = useState<Component[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingComponent, setEditingComponent] = useState<Component | null>(null);
  const [componentToDelete, setComponentToDelete] = useState<Component | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    totalQuantity: 0,
    category: '',
    description: '',
  });

  useEffect(() => {
    loadComponents();
  }, []);

  const loadComponents = () => {
    setComponents(hybridDataService.getComponents());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingComponent) {
      const updatedComponent: Component = {
        ...editingComponent,
        name: formData.name,
        totalQuantity: formData.totalQuantity,
        availableQuantity: editingComponent.availableQuantity + (formData.totalQuantity - editingComponent.totalQuantity),
        category: formData.category,
        description: formData.description,
      };
      hybridDataService.updateComponent(updatedComponent);
    } else {
      const newComponent: Component = {
        id: `comp-${Date.now()}`,
        name: formData.name,
        totalQuantity: formData.totalQuantity,
        availableQuantity: formData.totalQuantity,
        category: formData.category,
        description: formData.description,
      };
      hybridDataService.addComponent(newComponent);
    }

    resetForm();
    loadComponents();
  };

  const handleEdit = (component: Component) => {
    setEditingComponent(component);
    setFormData({
      name: component.name,
      totalQuantity: component.totalQuantity,
      category: component.category,
      description: component.description || '',
    });
    setShowAddForm(true);
  };

  const handleDelete = (component: Component) => {
    setComponentToDelete(component);
  };

  const confirmDelete = () => {
    if (componentToDelete) {
      hybridDataService.deleteComponent(componentToDelete.id);
      setComponentToDelete(null);
      loadComponents();
    }
  };

  const cancelDelete = () => {
    setComponentToDelete(null);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      totalQuantity: 0,
      category: '',
      description: '',
    });
    setEditingComponent(null);
    setShowAddForm(false);
  };

  const filteredComponents = components.filter(component =>
    component.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    component.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockStatus = (available: number, total: number) => {
    const percentage = (available / total) * 100;
    if (percentage === 0) return { color: 'text-red-400', bg: 'bg-red-500/10', text: 'Out of Stock' };
    if (percentage < 20) return { color: 'text-orange-400', bg: 'bg-orange-500/10', text: 'Low Stock' };
    if (percentage < 50) return { color: 'text-yellow-400', bg: 'bg-yellow-500/10', text: 'Medium Stock' };
    return { color: 'text-green-400', bg: 'bg-green-500/10', text: 'Good Stock' };
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-peacock-400 w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search components..."
            className="w-full pl-10 pr-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200"
          />
        </div>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-peacock-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-peacock-600 hover:to-blue-600 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Component
        </motion.button>
      </div>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && resetForm()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-800 rounded-2xl border border-peacock-500/20 p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-white mb-4">
                {editingComponent ? 'Edit Component' : 'Add New Component'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-peacock-300 text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-peacock-300 text-sm font-medium mb-2">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-peacock-300 text-sm font-medium mb-2">Total Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.totalQuantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalQuantity: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-peacock-300 text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 bg-dark-700/50 border border-dark-600 rounded-lg text-white placeholder-dark-400 focus:border-peacock-500 focus:ring-2 focus:ring-peacock-500/20 transition-all duration-200"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-peacock-500 to-blue-500 text-white py-3 rounded-lg font-medium hover:from-peacock-600 hover:to-blue-600 transition-all duration-200"
                  >
                    {editingComponent ? 'Update' : 'Add'} Component
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-6 py-3 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 transition-all duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {componentToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && cancelDelete()}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-dark-800 rounded-2xl border border-red-500/20 p-6 w-full max-w-md"
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 rounded-full mb-4">
                  <Trash2 className="w-8 h-8 text-red-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Delete Component</h3>
                <p className="text-red-300">
                  Are you sure you want to delete "{componentToDelete.name}"? This action cannot be undone.
                </p>
                {componentToDelete.totalQuantity - componentToDelete.availableQuantity > 0 && (
                  <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <p className="text-yellow-400 text-sm font-medium">
                      ⚠️ Warning: This component has {componentToDelete.totalQuantity - componentToDelete.availableQuantity} units currently in use.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={cancelDelete}
                  className="flex-1 px-4 py-3 bg-dark-700 text-white rounded-lg font-medium hover:bg-dark-600 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white py-3 rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Components Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredComponents.map((component, index) => {
          const stockStatus = getStockStatus(component.availableQuantity, component.totalQuantity);
          
          return (
            <motion.div
              key={component.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-dark-800/50 backdrop-blur-xl rounded-xl border border-peacock-500/20 p-6 hover:border-peacock-500/40 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-peacock-500/20 rounded-lg">
                    <Package className="w-6 h-6 text-peacock-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{component.name}</h3>
                    <p className="text-peacock-300 text-sm">{component.category}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEdit(component)}
                    className="p-2 text-peacock-400 hover:text-peacock-300 hover:bg-dark-700/50 rounded-lg transition-all duration-200"
                    title="Edit component"
                  >
                    <Edit className="w-4 h-4" />
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(component)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    title="Delete component"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-peacock-300">Available:</span>
                  <span className="text-white font-medium">{component.availableQuantity}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-peacock-300">Total:</span>
                  <span className="text-white font-medium">{component.totalQuantity}</span>
                </div>
                
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${stockStatus.bg} ${stockStatus.color}`}>
                  {stockStatus.text}
                </div>

                {component.description && (
                  <p className="text-dark-300 text-sm">{component.description}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {filteredComponents.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <Package className="w-16 h-16 text-peacock-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Components Found</h3>
          <p className="text-peacock-300">
            {searchTerm ? 'No components match your search.' : 'Start by adding your first component.'}
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default InventoryManagement;