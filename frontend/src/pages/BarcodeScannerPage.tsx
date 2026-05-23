import { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/api';
import { Product, ProductListResponse } from '../types';
import { useCart } from '../context/CartContext';

function BarcodeScannerPage() {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const { addToCart } = useCart();
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode('reader');
      }

      if (html5QrCodeRef.current.isScanning) {
        return;
      }

      setIsCameraActive(true);
      setError('');
      setNotice('');

      await html5QrCodeRef.current.start(
        { facingMode: 'environment' },
        { 
          fps: 20, 
          qrbox: { width: 300, height: 250 },
          aspectRatio: 1.0
        },
        onScanSuccess,
        onScanFailure
      );
    } catch (err: any) {
      setError('Failed to start camera. ' + err.message);
      setIsCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error('Failed to stop camera', err);
      }
    }
  };

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
    };
  }, []);

  async function onScanSuccess(decodedText: string) {
    // Immediately stop the camera hardware
    await stopScanner();
    
    setScanResult(decodedText);
    setLoading(true);
    setProduct(null);
    setQuantity(1);

    try {
      const response = await api.get<ProductListResponse>('/products', {
        params: { barcode: decodedText }
      });

      const found = response.data.data.find(p => p.barcode === decodedText);
      if (found) {
        setProduct(found);
      } else {
        setError('Product not found in database.');
      }
    } catch (err: any) {
      setError('Failed to check product. ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  }

  function onScanFailure(error: any) {
    // Expected behavior, don't show errors
  }

  const handleAddToCart = () => {
    if (product) {
      const result = addToCart(product, quantity);
      if (result.success) {
        setNotice(`Added ${quantity} x ${product.name} to cart.`);
        setProduct(null);
        setScanResult(null);
        setQuantity(1);
        // Start scanner again for next item
        startScanner();
      } else {
        setError(result.error || 'Failed to add to cart.');
      }
    }
  };

  const handleCreateProduct = () => {
    const url = `/products?barcode=${scanResult}`;
    window.history.pushState({}, '', url);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const resetScanner = () => {
    setScanResult(null);
    setProduct(null);
    setQuantity(1);
    setError('');
    setNotice('');
    startScanner();
  };

  return (
    <main className="app">
      <header>
        <h1>Barcode Scanner</h1>
        <p>Scan product barcodes using your camera.</p>
      </header>

      <div className="scanner-container">
        <div 
          id="reader" 
          style={{ 
            width: '100%', 
            maxWidth: '600px', 
            margin: '0 auto', 
            background: isCameraActive ? 'transparent' : '#eee',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {!isCameraActive && !scanResult && !loading && <p className="muted">Camera is off. Click "Scan Again" to start.</p>}
          {!isCameraActive && scanResult && <p className="success-text">Barcode Scanned Successfully!</p>}
        </div>
        
        {loading && <p>Searching for product...</p>}
        {error && <p className="error-text">{error}</p>}
        {notice && <p className="success-text">{notice}</p>}

        {scanResult && !loading && (
          <div className="panel" style={{ marginTop: '20px' }}>
            <h3>Scanned Barcode: {scanResult}</h3>
            
            {product ? (
              <div className="product-info">
                <p><strong>Name:</strong> {product.name}</p>
                <p><strong>Price:</strong> ₹{product.price.toFixed(2)}</p>
                <p><strong>Stock:</strong> {product.stock}</p>
                
                <div style={{ margin: '15px 0' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Quantity:</label>
                  <input 
                    type="number" 
                    min={1} 
                    max={product.stock} 
                    value={quantity} 
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    style={{ padding: '8px', width: '80px', fontSize: '16px' }}
                  />
                </div>

                <button className="btn btn-primary" onClick={handleAddToCart}>
                  Add to Cart
                </button>
              </div>
            ) : (
              <div className="scanner-actions">
                <p>No product found with this barcode.</p>
                <button className="btn btn-primary" onClick={handleCreateProduct}>
                  Create New Product
                </button>
              </div>
            )}
            
            <button className="btn btn-light" style={{ marginTop: '10px' }} onClick={resetScanner}>
              Scan Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

export default BarcodeScannerPage;
