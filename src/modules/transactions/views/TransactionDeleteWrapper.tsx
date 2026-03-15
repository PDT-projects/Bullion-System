// // Transactions Module - Transaction Delete Wrapper

// import { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { Transaction } from '../models/types';
// import { 
//   ArrowLeft, 
//   Trash2, 
//   AlertTriangle,
//   X,
//   Building2,
//   Wallet,
//   TrendingUp,
//   TrendingDown,
//   Calendar,
//   DollarSign
// } from 'lucide-react';
// import { toast } from "sonner";

// interface TransactionDeleteWrapperProps {
//   transactions: Transaction[];
//   setTransactions: (transactions: Transaction[]) => void;
// }

// export function TransactionDeleteWrapper({ transactions, setTransactions }: TransactionDeleteWrapperProps) {
//   const { id } = useParams<{ id: string }>();
//   const navigate = useNavigate();
//   const [transaction, setTransaction] = useState<Transaction | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [confirmText, setConfirmText] = useState('');

//   useEffect(() => {
//     const foundTransaction = transactions.find(t => t.id === id);
//     setTransaction(foundTransaction || null);
//     setIsLoading(false);
//   }, [id, transactions]);

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

//   const handleDelete = () => {
//     if (!transaction) return;

//     if (confirmText !== 'DELETE') {
//       toast.error('Please type DELETE to confirm');
//       return;
//     }

//     setIsDeleting(true);
//     setTransactions(transactions.filter(t => t.id !== id));
//     toast.success('Transaction deleted successfully');
//     navigate('/transactions');
//   };

//   const getCategoryIcon = (category: string) => {
//     switch (category) {
//       case 'Cash Inflow':
//         return <TrendingUp className="w-6 h-6 text-green-600" />;
//       case 'Cash Outflow':
//         return <TrendingDown className="w-6 h-6 text-red-600" />;
//       case 'Loans & Advances':
//         return <Wallet className="w-6 h-6 text-blue-600" />;
//       default:
//         return <Wallet className="w-6 h-6 text-gray-600" />;
//     }
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

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
//           <p className="text-gray-600">Loading transaction...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!transaction) {
//     return (
//       <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
//         <div className="text-center">
//           <X className="w-16 h-16 text-red-500 mx-auto mb-4" />
//           <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Not Found</h2>
//           <p className="text-gray-600 mb-4">The transaction you're trying to delete doesn't exist.</p>
//           <button
//             onClick={() => navigate('/transactions')}
//             className="px-4 py-2 bg-[#4f46e5] text-white rounded-lg hover:bg-[#4338ca]"
//           >
//             Back to Transactions
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 p-6">
//       <div className="max-w-3xl mx-auto">
//         {/* Header */}
//         <div className="flex items-center gap-4 mb-6">
//           <button
//             onClick={() => navigate('/transactions')}
//             className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors"
//           >
//             <ArrowLeft size={24} />
//           </button>
//           <div>
//             <h2 className="text-3xl font-bold text-gray-900">Delete Transaction</h2>
//             <p className="text-gray-600 mt-1">Permanently remove this transaction record</p>
//           </div>
//         </div>

//         {/* Warning Banner */}
//         <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
//           <div className="flex items-center gap-3">
//             <AlertTriangle className="w-6 h-6 text-red-600" />
//             <div>
//               <h3 className="font-semibold text-red-900">Warning: This action cannot be undone</h3>
//               <p className="text-sm text-red-700">
//                 Deleting this transaction will permanently remove it from the system and affect financial reports.
//               </p>
//             </div>
//           </div>
//         </div>

//         {/* Transaction Details Card */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
//           <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-200">
//             <div className="p-3 bg-gray-100 rounded-lg">
//               {getCategoryIcon(transaction.mainCategory)}
//             </div>
//             <div className="flex-1">
//               <h3 className="text-xl font-semibold text-gray-900">
//                 {transaction.transactionId || transaction.id}
//               </h3>
//               <div className="flex items-center gap-2 mt-1">
//                 <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(transaction.mainCategory)}`}>
//                   {transaction.mainCategory}
//                 </span>
//                 <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getModeBadge(transaction.mode)}`}>
//                   {transaction.mode}
//                 </span>
//               </div>
//             </div>
//             <div className="text-right">
//               <p className="text-sm text-gray-600">Amount</p>
//               <p className={`text-2xl font-bold ${transaction.mainCategory === 'Cash Inflow' ? 'text-green-600' : 'text-red-600'}`}>
//                 {transaction.mainCategory === 'Cash Inflow' ? '+' : '-'} {formatCurrency(transaction.amount || 0)}
//               </p>
//             </div>
//           </div>

//           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//             <div className="p-3 bg-gray-50 rounded-lg">
//               <p className="text-sm text-gray-600 mb-1">Date</p>
//               <p className="font-medium text-gray-900">{formatDate(transaction.date)}</p>
//             </div>
//             <div className="p-3 bg-gray-50 rounded-lg">
//               <p className="text-sm text-gray-600 mb-1">Company</p>
//               <p className="font-medium text-gray-900">
//                 {transaction.company?.replace('Pakistan Detectors Technologies - ', '')}
//               </p>
//             </div>
//             <div className="p-3 bg-gray-50 rounded-lg">
//               <p className="text-sm text-gray-600 mb-1">Sub Category</p>
//               <p className="font-medium text-gray-900">{transaction.subCategory}</p>
//             </div>
//             <div className="p-3 bg-gray-50 rounded-lg">
//               <p className="text-sm text-gray-600 mb-1">Payment Mode</p>
//               <p className="font-medium text-gray-900">{transaction.mode}</p>
//             </div>
//             {transaction.bankName && (
//               <div className="p-3 bg-blue-50 rounded-lg">
//                 <p className="text-sm text-gray-600 mb-1">Bank</p>
//                 <p className="font-medium text-blue-900">{transaction.bankName}</p>
//               </div>
//             )}
//             <div className="p-3 bg-gray-50 rounded-lg">
//               <p className="text-sm text-gray-600 mb-1">Time</p>
//               <p className="font-medium text-gray-900">{transaction.time || '-'}</p>
//             </div>
//           </div>

//           {transaction.note && (
//             <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
//               <p className="text-sm text-gray-600 mb-1">Note</p>
//               <p className="font-medium text-gray-900">{transaction.note}</p>
//             </div>
//           )}
//         </div>

//         {/* Impact Summary */}
//         <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
//           <h4 className="font-semibold text-orange-900 mb-2">📊 Financial Impact</h4>
//           <p className="text-sm text-orange-700">
//             Deleting this transaction will affect your financial reports:
//           </p>
//           <ul className="mt-2 space-y-1 text-sm text-orange-700">
//             <li>• {transaction.mainCategory === 'Cash Inflow' ? 'Total Inflow' : 'Total Outflow'} will be adjusted</li>
//             <li>• Net Balance will be recalculated</li>
//             {transaction.mode === 'Bank' && transaction.bankName && (
//               <li>• Bank account records may need reconciliation</li>
//             )}
//           </ul>
//         </div>

//         {/* Confirmation Section */}
//         <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Deletion</h3>
//           <p className="text-gray-600 mb-4">
//             To confirm deletion, please type <strong className="text-red-600">DELETE</strong> in the field below:
//           </p>
          
//           <input
//             type="text"
//             value={confirmText}
//             onChange={(e) => setConfirmText(e.target.value)}
//             className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
//             placeholder="Type DELETE to confirm"
//           />

//           <div className="flex items-center justify-end gap-4">
//             <button
//               onClick={() => navigate('/transactions')}
//               className="px-6 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleDelete}
//               disabled={isDeleting || confirmText !== 'DELETE'}
//               className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
//             >
//               <Trash2 size={20} />
//               {isDeleting ? 'Deleting...' : 'Permanently Delete Transaction'}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
