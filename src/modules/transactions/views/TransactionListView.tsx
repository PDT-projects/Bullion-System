// // Transactions Module - Transaction List View
// // UI exactly same as src/pages/transactions/TransactionsPage.tsx

// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Transaction } from '../models/types';
// import { 
//   Plus, 
//   Eye, 
//   Edit, 
//   Trash2, 
//   Search, 
//   ArrowLeft,
//   TrendingUp,
//   TrendingDown,
//   Wallet
// } from 'lucide-react';
// import { toast } from 'sonner';

// interface TransactionListViewProps {
//   transactions: Transaction[];
//   setTransactions: (transactions: Transaction[]) => void;
// }

// export function TransactionListView({ transactions, setTransactions }: TransactionListViewProps) {
//   const navigate = useNavigate();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [viewTransaction, setViewTransaction] = useState<Transaction | null>(null);
//   const [isViewModalOpen, setIsViewModalOpen] = useState(false);

//   const handleDeleteTransaction = (id: string) => {
//     if (confirm('Are you sure you want to delete this transaction?')) {
//       setTransactions(transactions.filter(trans => trans.id !== id));
//       toast.success('Transaction deleted successfully');
//     }
//   };

//   const openViewModal = (transaction: Transaction) => {
//     setViewTransaction(transaction);
//     setIsViewModalOpen(true);
//   };

//   const filteredTransactions = transactions.filter(trans =>
//     trans.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     trans.mainCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     trans.subCategory?.toLowerCase().includes(searchQuery.toLowerCase()) ||
//     trans.note?.toLowerCase().includes(searchQuery.toLowerCase())
//   );

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-PK', {
//       style: 'currency',
//       currency: 'PKR',
//       minimumFractionDigits: 0
//     }).format(amount);
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('en-PK', {
//       year: 'numeric',
//       month: 'short',
//       day: 'numeric'
//     });
//   };

//   const getCategoryColor = (category: string) => {
//     return category === 'Cash Inflow' 
//       ? 'bg-green-100 text-green-800' 
//       : category === 'Cash Outflow'
//       ? 'bg-red-100 text-red-800'
//       : 'bg-blue-100 text-blue-800';
//   };

//   const getModeBadge = (mode: string) => {
//     const colors: Record<string, string> = {
//       'Cash': 'bg-gray-100 text-gray-800',
//       'Bank': 'bg-blue-100 text-blue-800',
//       'Cheque': 'bg-purple-100 text-purple-800'
//     };
//     return colors[mode] || 'bg-gray-100 text-gray-800';
//   };

//   // Calculate statistics
//   const stats = {
//     totalInflow: transactions
//       .filter(t => t.mainCategory === 'Cash Inflow')
//       .reduce((sum, t) => sum + (t.amount || 0), 0),
//     totalOutflow: transactions
//       .filter(t => t.mainCategory === 'Cash Outflow')
//       .reduce((sum, t) => sum + (t.amount || 0), 0),
//     netBalance: 0
//   };
//   stats.netBalance = stats.totalInflow - stats.totalOutflow;

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div className="flex items-center gap-4">
//           <button
//             onClick={() => navigate('/finance')}
//             className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
//           >
//             <ArrowLeft size={24} />
//           </button>
//           <div>
//             <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
//             <p className="text-gray-600 mt-1">Record and manage all financial transactions</p>
//           </div>
//         </div>
//         <button
//           onClick={() => navigate('/transactions/new')}
//           className="flex items-center gap-2 px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca] transition-colors"
//         >
//           <Plus size={18} />
//           Add Transaction
//         </button>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-green-100 rounded-lg">
//               <TrendingUp size={20} className="text-green-600" />
//             </div>
//             <p className="text-sm text-gray-600">Total Inflow</p>
//           </div>
//           <h3 className="text-2xl font-bold text-green-600">
//             {formatCurrency(stats.totalInflow)}
//           </h3>
//         </div>
//         <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-red-100 rounded-lg">
//               <TrendingDown size={20} className="text-red-600" />
//             </div>
//             <p className="text-sm text-gray-600">Total Outflow</p>
//           </div>
//           <h3 className="text-2xl font-bold text-red-600">
//             {formatCurrency(stats.totalOutflow)}
//           </h3>
//         </div>
//         <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
//           <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 bg-blue-100 rounded-lg">
//               <Wallet size={20} className="text-blue-600" />
//             </div>
//             <p className="text-sm text-gray-600">Net Balance</p>
//           </div>
//           <h3 className={`text-2xl font-bold ${stats.netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
//             {formatCurrency(stats.netBalance)}
//           </h3>
//         </div>
//       </div>

//       {/* Search Bar */}
//       <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
//           <input
//             type="text"
//             placeholder="Search transactions by company, category, or notes..."
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5]"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//         </div>
//       </div>

//       {/* Transactions Table */}
//       <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
//         <div className="p-4 border-b border-gray-200">
//           <h3 className="text-lg font-semibold text-gray-900">All Transactions ({filteredTransactions.length})</h3>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead className="bg-gray-50 border-b border-gray-200">
//               <tr>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Date</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Company</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Main Category</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sub Category</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Mode</th>
//                 <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Bank</th>
//                 <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {filteredTransactions.length === 0 ? (
//                 <tr>
//                   <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
//                     <Wallet className="mx-auto mb-3 text-gray-300" size={48} />
//                     <p className="text-lg font-medium">No transactions found</p>
//                     <p className="text-sm mt-1">Create a new transaction to get started</p>
//                   </td>
//                 </tr>
//               ) : (
//                 filteredTransactions.map((transaction) => (
//                   <tr key={transaction.id} className="hover:bg-gray-50">
//                     <td className="px-4 py-3 font-medium text-gray-900">
//                       {formatDate(transaction.date)}
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
//                       {transaction.company?.replace('Pakistan Detectors Technologies - ', '')}
//                     </td>
//                     <td className="px-4 py-3">
//                       <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(transaction.mainCategory)}`}>
//                         {transaction.mainCategory}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-600">
//                       {transaction.subCategory}
//                     </td>
//                     <td className={`px-4 py-3 font-semibold ${transaction.mainCategory === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'}`}>
//                       {transaction.mainCategory === 'Cash Inflow' ? '+' : '-'} {formatCurrency(transaction.amount || 0)}
//                     </td>
//                     <td className="px-4 py-3">
//                       <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getModeBadge(transaction.mode)}`}>
//                         {transaction.mode}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-sm text-gray-600">
//                       {transaction.bankName || '-'}
//                     </td>
//                     <td className="px-4 py-3 text-right">
//                       <div className="flex justify-end gap-2">
//                         <button
//                           onClick={() => openViewModal(transaction)}
//                           className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//                           title="View"
//                         >
//                           <Eye size={18} />
//                         </button>
//                         <button
//                           onClick={() => navigate(`/transactions/${transaction.id}/edit`)}
//                           className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
//                           title="Edit"
//                         >
//                           <Edit size={18} />
//                         </button>
//                         <button
//                           onClick={() => navigate(`/transactions/${transaction.id}/delete`)}
//                           className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
//                           title="Delete"
//                         >
//                           <Trash2 size={18} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* View Transaction Modal */}
//       {isViewModalOpen && viewTransaction && (
//         <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
//           <div className="bg-white rounded-lg max-w-2xl w-full">
//             <div className="flex items-center justify-between p-6 border-b border-gray-200">
//               <h3 className="text-xl font-bold">Transaction Details</h3>
//               <button
//                 onClick={() => setIsViewModalOpen(false)}
//                 className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
//               >
//                 <ArrowLeft size={24} />
//               </button>
//             </div>
//             <div className="p-6 space-y-4">
//               <div className="grid grid-cols-2 gap-4">
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Date</p>
//                   <p className="font-medium">{formatDate(viewTransaction.date)}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Amount</p>
//                   <p className={`font-bold text-lg ${viewTransaction.mainCategory === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'}`}>
//                     {formatCurrency(viewTransaction.amount || 0)}
//                   </p>
//                 </div>
//                 <div className="col-span-2">
//                   <p className="text-sm text-gray-600 mb-1">Company</p>
//                   <p className="font-medium">{viewTransaction.company}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Main Category</p>
//                   <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(viewTransaction.mainCategory)}`}>
//                     {viewTransaction.mainCategory}
//                   </span>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Sub Category</p>
//                   <p className="font-medium">{viewTransaction.subCategory}</p>
//                 </div>
//                 <div>
//                   <p className="text-sm text-gray-600 mb-1">Payment Mode</p>
//                   <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getModeBadge(viewTransaction.mode)}`}>
//                     {viewTransaction.mode}
//                   </span>
//                 </div>
//                 {viewTransaction.bankName && (
//                   <div>
//                     <p className="text-sm text-gray-600 mb-1">Bank Name</p>
//                     <p className="font-medium">{viewTransaction.bankName}</p>
//                   </div>
//                 )}
//                 <div className="col-span-2">
//                   <p className="text-sm text-gray-600 mb-1">Note</p>
//                   <p className="font-medium">{viewTransaction.note || '-'}</p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
