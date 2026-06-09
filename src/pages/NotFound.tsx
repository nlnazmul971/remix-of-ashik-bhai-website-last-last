import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import SEO from "@/components/SEO";
import LandingResolver from "./LandingResolver";

const NotFoundView = () => {
  const location = useLocation();
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <SEO title="Page Not Found" description="The page you are looking for could not be found." path={location.pathname} noIndex />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">Return to Home</a>
      </div>
    </div>
  );
};

const NotFound = () => <LandingResolver fallback={<NotFoundView />} />;
export default NotFound;
