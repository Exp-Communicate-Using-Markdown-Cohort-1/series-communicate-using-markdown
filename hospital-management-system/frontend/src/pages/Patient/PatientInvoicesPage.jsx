import React, { useEffect } from 'react';
import usePatientDataStore from '../../store/patientDataStore';
import InvoiceList from '../../components/Invoices/InvoiceList'; // Adjust path as necessary
import useAuthStore from '../../store/authStore';

const PatientInvoicesPage = () => {
  const { 
    invoices, 
    isLoadingInvoices, 
    errorInvoices, 
    fetchMyInvoices 
  } = usePatientDataStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role === 'patient') {
      fetchMyInvoices();
    }
  }, [fetchMyInvoices, user]);

  if (user && user.role !== 'patient') {
    return (
      <div className="p-4">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p className="text-gray-700">This page is only accessible to patients.</p>
      </div>
    );
  }
  
  if (isLoadingInvoices) {
    return <div className="p-4 text-lg text-gray-700">Loading invoices...</div>;
  }

  if (errorInvoices) {
    return <div className="p-4 text-red-600">Error: {errorInvoices}</div>;
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-semibold text-gray-800">My Invoices</h1>
      <InvoiceList invoices={invoices} />
    </div>
  );
};

export default PatientInvoicesPage;
