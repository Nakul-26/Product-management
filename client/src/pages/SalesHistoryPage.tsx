import { useEffect, useMemo, useState } from 'react';
import api from '../api/api';
import { Sale, SalesListResponse } from '../types';

type InvoiceData = {
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  items: Sale['items'];
  subTotal: number;
  discount: number;
  gstRate: number;
  gstAmount: number;
  grandTotal: number;
  paymentMethod: 'cash' | 'upi' | 'card';
  notes?: string;
};

const ITEMS_PER_PAGE = 10;

function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'upi' | 'card'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [invoiceError, setInvoiceError] = useState('');

  const loadSales = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<SalesListResponse>('/sales', { params: { page: 1, limit: 200 } });
      setSales(response.data.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || requestError?.message || 'Failed to load sales history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      if (paymentFilter !== 'all' && sale.paymentMethod !== paymentFilter) return false;

      const saleDate = new Date(sale.createdAt);
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (saleDate < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`);
        if (saleDate > to) return false;
      }

      return true;
    });
  }, [sales, paymentFilter, fromDate, toDate]);

  const totalPages = Math.max(Math.ceil(filteredSales.length / ITEMS_PER_PAGE), 1);

  const paginatedSales = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredSales.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredSales, page]);

  useEffect(() => {
    setPage(1);
  }, [paymentFilter, fromDate, toDate]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const openInvoice = async (saleId: string) => {
    setInvoiceLoading(true);
    setInvoiceError('');
    setInvoiceData(null);
    try {
      const response = await api.get<InvoiceData>(`/sales/${saleId}/invoice`);
      setInvoiceData(response.data);
    } catch (requestError: any) {
      setInvoiceError(requestError?.response?.data?.error || requestError?.message || 'Failed to load invoice.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  return (
    <main className="app">
      <header>
        <h1>Sales History</h1>
        <p>Audit previous sales and open invoices.</p>
      </header>

      <section className="panel">
        <div className="panel-header">
          <h2>Filters</h2>
          <button type="button" className="btn btn-light" onClick={loadSales} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        <div className="history-filters">
          <label>
            Payment Method
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as 'all' | 'cash' | 'upi' | 'card')}>
              <option value="all">all</option>
              <option value="cash">cash</option>
              <option value="upi">upi</option>
              <option value="card">card</option>
            </select>
          </label>

          <label>
            From Date
            <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          </label>

          <label>
            To Date
            <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          </label>
        </div>
      </section>

      {error && <p className="error-text">{error}</p>}

      <section className="panel">
        <table>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Date</th>
              <th>Payment Method</th>
              <th>Total Amount</th>
              <th>Created By</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSales.length === 0 ? (
              <tr>
                <td colSpan={7} className="muted">
                  No sales found for selected filters.
                </td>
              </tr>
            ) : (
              paginatedSales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.invoiceNumber}</td>
                  <td>{new Date(sale.createdAt).toLocaleString()}</td>
                  <td>{sale.paymentMethod}</td>
                  <td>₹{sale.grandTotal.toFixed(2)}</td>
                  <td>{sale.createdBy}</td>
                  <td><span className="status-pill">completed</span></td>
                  <td>
                    <div className="action-row">
                      <button type="button" className="btn btn-light" onClick={() => setSelectedSale(sale)}>
                        Details
                      </button>
                      <button type="button" className="btn btn-primary" onClick={() => openInvoice(sale._id)}>
                        Invoice
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="pagination-row">
          <p className="muted">Page {page} of {totalPages}</p>
          <div className="action-row">
            <button type="button" className="btn btn-light" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page <= 1}>
              Previous
            </button>
            <button type="button" className="btn btn-light" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page >= totalPages}>
              Next
            </button>
          </div>
        </div>
      </section>

      {selectedSale && (
        <section className="modal-backdrop" role="presentation" onClick={() => setSelectedSale(null)}>
          <article className="modal-card" role="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <h3>Sale Details</h3>
              <button className="btn btn-light" type="button" onClick={() => setSelectedSale(null)}>Close</button>
            </div>
            <p><strong>Invoice:</strong> {selectedSale.invoiceNumber}</p>
            <p><strong>Customer:</strong> {selectedSale.customerName || '-'}</p>
            <p><strong>Phone:</strong> {selectedSale.customerPhone || '-'}</p>
            <p><strong>Payment:</strong> {selectedSale.paymentMethod}</p>
            <p><strong>Sub Total:</strong> ₹{selectedSale.subTotal.toFixed(2)}</p>
            <p><strong>Discount:</strong> ₹{selectedSale.discount.toFixed(2)}</p>
            <p><strong>GST:</strong> ₹{selectedSale.gstAmount.toFixed(2)} ({selectedSale.gstRate}%)</p>
            <p><strong>Grand Total:</strong> ₹{selectedSale.grandTotal.toFixed(2)}</p>
            <h4>Items</h4>
            <ul className="modal-items-list">
              {selectedSale.items.map((item) => (
                <li key={`${selectedSale._id}-${item.productId}`}>
                  {item.productName} ({item.quantity} × ₹{item.unitPrice.toFixed(2)}) = ₹{item.lineTotal.toFixed(2)}
                </li>
              ))}
            </ul>
          </article>
        </section>
      )}

      {(invoiceLoading || invoiceData || invoiceError) && (
        <section className="modal-backdrop" role="presentation" onClick={() => { setInvoiceData(null); setInvoiceError(''); }}>
          <article className="modal-card" role="dialog" onClick={(event) => event.stopPropagation()}>
            <div className="panel-header">
              <h3>Invoice</h3>
              <button className="btn btn-light" type="button" onClick={() => { setInvoiceData(null); setInvoiceError(''); }}>
                Close
              </button>
            </div>

            {invoiceLoading && <p>Loading invoice...</p>}
            {!invoiceLoading && invoiceError && <p className="error-text">{invoiceError}</p>}

            {!invoiceLoading && invoiceData && (
              <div>
                <p><strong>Invoice #:</strong> {invoiceData.invoiceNumber}</p>
                <p><strong>Date:</strong> {new Date(invoiceData.createdAt).toLocaleString()}</p>
                <p><strong>Customer:</strong> {invoiceData.customerName || '-'}</p>
                <p><strong>Phone:</strong> {invoiceData.customerPhone || '-'}</p>
                <p><strong>Payment:</strong> {invoiceData.paymentMethod}</p>
                <h4>Items</h4>
                <ul className="modal-items-list">
                  {invoiceData.items.map((item) => (
                    <li key={`invoice-${invoiceData.invoiceNumber}-${item.productId}`}>
                      {item.productName} ({item.quantity} × ₹{item.unitPrice.toFixed(2)}) = ₹{item.lineTotal.toFixed(2)}
                    </li>
                  ))}
                </ul>
                <p><strong>Sub Total:</strong> ₹{invoiceData.subTotal.toFixed(2)}</p>
                <p><strong>Discount:</strong> ₹{invoiceData.discount.toFixed(2)}</p>
                <p><strong>GST:</strong> ₹{invoiceData.gstAmount.toFixed(2)} ({invoiceData.gstRate}%)</p>
                <h3>Total: ₹{invoiceData.grandTotal.toFixed(2)}</h3>
              </div>
            )}
          </article>
        </section>
      )}
    </main>
  );
}

export default SalesHistoryPage;
