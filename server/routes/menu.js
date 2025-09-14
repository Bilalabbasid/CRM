const express = require('express');
const { body, validationResult, query } = require('express-validator');
const MenuItem = require('../models/MenuItem');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticate);

// @route   GET /api/menu
// @desc    Get all menu items with filtering and pagination
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('category').optional().isIn(['appetizers', 'salads', 'soups', 'mains', 'desserts', 'beverages', 'specials']),
  query('available').optional().isBoolean(),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['name', 'price', 'category', 'timesOrdered', 'rating.average']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category;
    const available = req.query.available;
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { ingredients: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    if (category) {
      query.category = category;
    }
    
    if (available !== undefined) {
      query.isAvailable = available === 'true';
    }

    // Execute query
    const menuItems = await MenuItem.find(query)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await MenuItem.countDocuments(query);

    res.json({
      menuItems,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total,
        limit
      }
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/menu/:id
// @desc    Get menu item by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    res.json(menuItem);
  } catch (error) {
    console.error('Get menu item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/menu
// @desc    Create new menu item
// @access  Private (Admin/Manager only)
router.post('/', authorize('admin', 'manager'), [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
  body('category').isIn(['appetizers', 'salads', 'soups', 'mains', 'desserts', 'beverages', 'specials']).withMessage('Invalid category'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be a positive number'),
  body('preparationTime').optional().isInt({ min: 0 }).withMessage('Preparation time must be a non-negative integer'),
  body('ingredients').optional().isArray().withMessage('Ingredients must be an array'),
  body('allergens').optional().isArray().withMessage('Allergens must be an array'),
  body('spiceLevel').optional().isIn(['none', 'mild', 'medium', 'hot', 'very-hot'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if menu item already exists
    const existingItem = await MenuItem.findOne({ 
      name: { $regex: new RegExp(`^${req.body.name}$`, 'i') }
    });

    if (existingItem) {
      return res.status(400).json({ 
        message: 'Menu item with this name already exists' 
      });
    }

    const menuItem = new MenuItem(req.body);
    await menuItem.save();

    res.status(201).json({
      message: 'Menu item created successfully',
      menuItem
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/menu/:id
// @desc    Update menu item
// @access  Private (Admin/Manager only)
router.put('/:id', authorize('admin', 'manager'), [
  body('name').optional().trim().isLength({ min: 2, max: 100 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('category').optional().isIn(['appetizers', 'salads', 'soups', 'mains', 'desserts', 'beverages', 'specials']),
  body('price').optional().isFloat({ min: 0 }),
  body('cost').optional().isFloat({ min: 0 }),
  body('preparationTime').optional().isInt({ min: 0 }),
  body('ingredients').optional().isArray(),
  body('allergens').optional().isArray(),
  body('spiceLevel').optional().isIn(['none', 'mild', 'medium', 'hot', 'very-hot'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    // Check for duplicate name if name is being updated
    if (req.body.name && req.body.name !== menuItem.name) {
      const duplicate = await MenuItem.findOne({
        _id: { $ne: req.params.id },
        name: { $regex: new RegExp(`^${req.body.name}$`, 'i') }
      });
      
      if (duplicate) {
        return res.status(400).json({ 
          message: 'Another menu item already exists with this name' 
        });
      }
    }

    Object.assign(menuItem, req.body);
    await menuItem.save();

    res.json({
      message: 'Menu item updated successfully',
      menuItem
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/menu/:id
// @desc    Delete menu item
// @access  Private (Admin/Manager only)
router.delete('/:id', authorize('admin', 'manager'), async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/menu/:id/availability
// @desc    Toggle menu item availability
// @access  Private
router.patch('/:id/availability', [
  body('isAvailable').isBoolean().withMessage('isAvailable must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    menuItem.isAvailable = req.body.isAvailable;
    await menuItem.save();

    res.json({
      message: `Menu item ${req.body.isAvailable ? 'enabled' : 'disabled'} successfully`,
      menuItem
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid menu item ID' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/menu/stats/popular
// @desc    Get most popular menu items
// @access  Private
router.get('/stats/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const popularItems = await MenuItem.find({ isAvailable: true })
      .sort({ timesOrdered: -1 })
      .limit(limit)
      .select('name category price timesOrdered rating');

    res.json(popularItems);
  } catch (error) {
    console.error('Get popular items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/menu/stats/categories
// @desc    Get menu statistics by category
// @access  Private
router.get('/stats/categories', async (req, res) => {
  try {
    const stats = await MenuItem.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          available: { $sum: { $cond: ['$isAvailable', 1, 0] } },
          averagePrice: { $avg: '$price' },
          totalOrders: { $sum: '$timesOrdered' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;