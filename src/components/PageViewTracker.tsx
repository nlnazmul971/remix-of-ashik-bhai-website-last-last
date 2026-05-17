import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { pushPageView } from '@/lib/gtm';

const PageViewTracker = () => {
  const location = useLocation();
  useEffect(() => {
    pushPageView();
  }, [location.pathname, location.search]);
  return null;
};

export default PageViewTracker;
