import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Package, DollarSign, Star, Image as ImageIcon } from 'lucide-react';

interface Product {
  rank?: number;
  name?: string;
  price?: string;
  price_numeric?: number;
  link?: string;
  image?: string;
  condition?: string;
}

interface StructuredResultsTableProps {
  products: Product[];
  title?: string;
  sortedBy?: string;
}

export const StructuredResultsTable: React.FC<StructuredResultsTableProps> = ({
  products,
  title = "Search Results",
  sortedBy = "price_ascending"
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const sortedProducts = [...products].sort((a, b) => {
    const priceA = a.price_numeric || 0;
    const priceB = b.price_numeric || 0;
    return sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
  });

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  if (!products || products.length === 0) {
    return (
      <div className="structured-results-empty">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-400 text-center">No products found</p>
      </div>
    );
  }

  return (
    <div className="structured-results-container">
      <div className="structured-results-header">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-[#00F3FF]" />
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <span className="px-2 py-0.5 bg-[#00F3FF]/20 text-[#00F3FF] text-xs rounded-full">
            {products.length} items
          </span>
        </div>
        <button 
          onClick={toggleSort}
          className="flex items-center gap-1 px-3 py-1 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg text-sm text-gray-300 transition-colors"
        >
          <DollarSign className="w-4 h-4" />
          Price {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      <div className="structured-results-table-wrapper">
        <table className="structured-results-table">
          <thead>
            <tr>
              <th className="w-12">#</th>
              <th className="w-16">Image</th>
              <th>Product</th>
              <th className="w-28">Price</th>
              <th className="w-24">Condition</th>
              <th className="w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.map((product, index) => (
              <React.Fragment key={index}>
                <tr 
                  className={`product-row ${expandedRows.has(index) ? 'expanded' : ''}`}
                  onClick={() => toggleRow(index)}
                >
                  <td className="rank-cell">
                    <span className="rank-badge">{product.rank || index + 1}</span>
                  </td>
                  <td className="image-cell">
                    {product.image ? (
                      <img 
                        src={product.image} 
                        alt={product.name || 'Product'} 
                        className="product-thumbnail"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="product-thumbnail-placeholder">
                        <ImageIcon className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                  </td>
                  <td className="name-cell">
                    <div className="product-name">{product.name || 'Unknown Product'}</div>
                  </td>
                  <td className="price-cell">
                    <span className="price-tag">{product.price || 'N/A'}</span>
                  </td>
                  <td className="condition-cell">
                    {product.condition && (
                      <span className="condition-badge">{product.condition}</span>
                    )}
                  </td>
                  <td className="action-cell">
                    {product.link && (
                      <a 
                        href={product.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="view-link"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
                {expandedRows.has(index) && (
                  <tr className="expanded-row">
                    <td colSpan={6}>
                      <div className="expanded-content">
                        <div className="expanded-details">
                          <div className="detail-item">
                            <span className="detail-label">Full Name:</span>
                            <span className="detail-value">{product.name || 'N/A'}</span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Price:</span>
                            <span className="detail-value">{product.price || 'N/A'}</span>
                          </div>
                          {product.condition && (
                            <div className="detail-item">
                              <span className="detail-label">Condition:</span>
                              <span className="detail-value">{product.condition}</span>
                            </div>
                          )}
                          {product.link && (
                            <div className="detail-item">
                              <span className="detail-label">Link:</span>
                              <a 
                                href={product.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="detail-link"
                              >
                                View Product <ExternalLink className="w-3 h-3 inline ml-1" />
                              </a>
                            </div>
                          )}
                        </div>
                        {product.image && (
                          <div className="expanded-image">
                            <img src={product.image} alt={product.name || 'Product'} />
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="structured-results-footer">
        <span className="text-xs text-gray-500">
          Sorted by: {sortOrder === 'asc' ? 'Lowest to Highest' : 'Highest to Lowest'} price
        </span>
      </div>
    </div>
  );
};

export default StructuredResultsTable;
