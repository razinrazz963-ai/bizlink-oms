import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { InvoicePrintView } from '../components/common/InvoicePrintView.js';
import { api } from '../api/client.js';
import { Invoice, CompanySettings, Customer } from '../types/index.js';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [customer, setCustomer] = useState<Customer | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadInvoiceData();
    }
  }, [id]);

  const loadInvoiceData = async () => {
    setLoading(true);
    try {
      const res = await api.getInvoice(id!);
      setInvoice(res.invoice);
      setCompany(res.company);
      setCustomer(res.customer);
    } catch (err) {
      console.error('Failed to load invoice:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !invoice || !company) {
    return (
      <div className="p-8 text-center text-xs text-slate-400">
        Loading tax invoice document...
      </div>
    );
  }

  return (
    <div>
      <InvoicePrintView
        invoice={invoice}
        company={company}
        customer={customer}
        onBack={() => navigate('/invoices')}
      />
    </div>
  );
};
