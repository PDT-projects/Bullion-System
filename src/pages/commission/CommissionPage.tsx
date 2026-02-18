import { useNavigate, useOutletContext } from 'react-router-dom';
import { 
  Calculator, 
  Percent, 
  FileText, 
  TrendingUp, 
  Plus, 
  Target,
  Award,
  BarChart3,
  ArrowRight
} from 'lucide-react';

export function CommissionPage() {
  const navigate = useNavigate();
  const { commissions, commissionSlabs, employees } = useOutletContext<{
    commissions: any[];
    commissionSlabs: any[];
    employees: any[];
  }>();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PK', {
      style: 'currency',
      currency: 'PKR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Calculate stats
  const totalSlabs = commissionSlabs?.length || 0;
  const totalCommissions = commissions?.length || 0;
  const totalCommissionAmount = commissions?.reduce((sum, c) => sum + (c.calculatedCommissionAmount || 0), 0) || 0;
  const confirmedCommissions = commissions?.filter(c => c.status === 'Confirmed').length || 0;

  const navigationCards = [
    {
      id: 'slabs',
      title: 'Commission Slabs',
      description: 'Manage commission criteria and percentage slabs for salespersons',
      icon: Percent,
      color: 'blue',
      path: '/commission/slabs',
      count: totalSlabs
    },
    {
      id: 'calculate',
      title: 'Calculate Commission',
      description: 'Calculate commissions based on sales and applied slabs',
      icon: Calculator,
      color: 'green',
      path: '/commission/calculate'
    },
    {
      id: 'reports',
      title: 'Commission Reports',
      description: 'View all calculated and confirmed commissions',
      icon: FileText,
      color: 'purple',
      path: '/commission/reports',
      count: totalCommissions
    },
    {
      id: 'create-slab',
      title: 'Create Commission Slab',
      description: 'Add new commission criteria for salespersons',
      icon: Plus,
      color: 'orange',
      path: '/commission/slabs/new'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; icon: string; hover: string; border: string }> = {
      blue: {
        bg: 'bg-blue-50',
        icon: 'text-blue-600',
        hover: 'hover:bg-blue-100 hover:border-blue-300',
        border: 'border-blue-200'
      },
      green: {
        bg: 'bg-green-50',
        icon: 'text-green-600',
        hover: 'hover:bg-green-100 hover:border-green-300',
        border: 'border-green-200'
      },
      purple: {
        bg: 'bg-purple-50',
        icon: 'text-purple-600',
        hover: 'hover:bg-purple-100 hover:border-purple-300',
        border: 'border-purple-200'
      },
      orange: {
        bg: 'bg-orange-50',
        icon: 'text-orange-600',
        hover: 'hover:bg-orange-100 hover:border-orange-300',
        border: 'border-orange-200'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Commission Management</h2>
          <p className="text-gray-600">Manage salesperson commissions, slabs, and calculations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">Total Slabs</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalSlabs}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Total Commissions</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalCommissions}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm text-gray-600">Total Amount</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalCommissionAmount)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Award className="w-5 h-5 text-orange-600" />
              <span className="text-sm text-gray-600">Confirmed</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{confirmedCommissions}</p>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {navigationCards.map((card) => {
            const colors = getColorClasses(card.color);
            const Icon = card.icon;
            
            return (
              <button
                key={card.id}
                onClick={() => navigate(card.path)}
                className={`bg-white rounded-lg shadow-sm border-2 ${colors.border} p-6 ${colors.hover} transition-all text-left group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 ${colors.bg} rounded-lg`}>
                      <Icon className={`w-8 h-8 ${colors.icon}`} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                        {card.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{card.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {card.count !== undefined && (
                      <span className={`px-3 py-1 ${colors.bg} ${colors.icon} rounded-full text-sm font-medium`}>
                        {card.count}
                      </span>
                    )}
                    <ArrowRight className={`w-5 h-5 text-gray-400 group-hover:text-gray-600`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Info */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            How Commission Works
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Percent className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">1. Define Slabs</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Create commission slabs with percentage rates for each salesperson and city
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">2. Calculate</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Select city and month to automatically calculate commissions based on sales
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">3. Review & Confirm</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Review calculated commissions, make adjustments if needed, and confirm
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
