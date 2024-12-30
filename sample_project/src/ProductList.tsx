import React from 'react';
    import Product from './Product.tsx';

    const products = [
      { id: 1, name: 'Product 1', price: 29.99, image: 'https://images.unsplash.com/photo-1519992700618-e8b3c1421763' },
      { id: 2, name: 'Product 2', price: 39.99, image: 'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0' },
      { id: 3, name: 'Product 3', price: 49.99, image: 'https://images.unsplash.com/photo-1519992647888-f5f92c9ae586' },
    ];

    function ProductList() {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map(product => (
            <Product key={product.id} {...product} />
          ))}
        </div>
      );
    }

    export default ProductList;