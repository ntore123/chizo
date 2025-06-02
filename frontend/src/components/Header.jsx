import { useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Button from './ui/Button';

const Header = ({ toggleSidebar }) => {
  const location = useLocation();
  const { user, logout } = useContext(AuthContext);

  // Get page title based on current path
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
      case '/parking-slots':
        return 'Parking Slots Management';
      case '/cars':
        return 'Cars Management';
      case '/parking-records':
        return 'Parking Records';
      case '/payments':
        return 'Payments';
      default:
        return 'SmartPark';
    }
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 focus:outline-none lg:hidden"
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 6H20M4 12H20M4 18H11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="ml-4 text-xl font-semibold text-gray-800">{getPageTitle()}</h1>
        </div>
        <div className="flex items-center space-x-4">
          {user && (
            <>
              <div className="relative">
                <span className="text-amber-600 font-medium">Welcome, {user.username}</span>
              </div>
              <Button
                variant="secondary"
                className="py-1 px-3 text-sm"
                onClick={logout}
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
