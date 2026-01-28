import { Search, Bell, User } from 'lucide-react';

export function TopBar() {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 ml-6">
          <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell size={20} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ef4444] rounded-full"></span>
          </button>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
            <div className="text-right">
              <p className="text-sm font-medium">Admin User</p>
              <p className="text-xs text-gray-600">admin@pdt.com</p>
            </div>
            <div className="w-10 h-10 bg-[#4f46e5] rounded-full flex items-center justify-center text-white">
              <User size={20} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
