import React from 'react';

    interface ProductProps {
      id: number;
      name: string;
      price: number;
      image: string;
    }

    function Product({ name, price, image }: ProductProps) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-md">
          <img src={image} alt={name} className="w-full h-40 object-cover rounded" />
          <h2 className="font-bold text-lg mt-2">{name}</h2>
          <p className="text-gray-700">${price.toFixed(2)}</p>
          <button className="mt-4 w-full bg-blue-500 text-white py-2 rounded">Add to Cart</button>
        </div>
      );
    }

    export default Product;