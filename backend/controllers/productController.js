const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const { featured, limit, sort, category, search } = req.query;
    let query = { isActive: true };
    
    if (featured === 'true') {
      query.isFeatured = true;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    let productsQuery = Product.find(query).populate('category', 'name');
    
    // Default sorting for homepage fallback/latest
    if (sort === 'latest') {
       productsQuery = productsQuery.sort({ createdAt: -1 });
    } else {
       // Regular default sorting
       productsQuery = productsQuery.sort({ createdAt: -1 });
    }
    
    if (limit) {
      productsQuery = productsQuery.limit(parseInt(limit));
    }
    
    const products = await productsQuery;
    res.json(products);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, image, category, isActive, isFeatured } = req.body;

    const product = new Product({
      name,
      description,
      price,
      stock,
      image,
      category,
      isActive: isActive === undefined ? true : isActive,
      isFeatured: isFeatured === undefined ? false : isFeatured
    });

    const createdProduct = await product.save();

    // Trigger Real-time Analytics Update
    const io = req.app.get('io');
    if (io) io.emit('analyticsUpdate');

    res.status(201).json(createdProduct);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { name, description, price, stock, image, category, isActive, isFeatured } = req.body;

    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.stock = stock || product.stock;
      product.image = image || product.image;
      product.category = category || product.category;
      product.isActive = isActive !== undefined ? isActive : product.isActive;
      product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;

      const updatedProduct = await product.save();

      // Trigger Real-time Analytics Update
      const io = req.app.get('io');
      if (io) io.emit('analyticsUpdate');

      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      await Product.deleteOne({ _id: product._id });

      // Trigger Real-time Analytics Update
      const io = req.app.get('io');
      if (io) io.emit('analyticsUpdate');

      res.json({ message: 'Product removed' });
    } else {
      res.status(404);
      throw new Error('Product not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
