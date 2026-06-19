import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import HomePage from "@/pages/HomePage";
import BlogListPage from "@/pages/BlogListPage";
import BlogPostPage from "@/pages/BlogPostPage";
import GalleryPage from "@/pages/GalleryPage";
import AboutPage from "@/pages/AboutPage";
import ContactPage from "@/pages/ContactPage";
import NotFound from "@/pages/not-found";

import AdminDashboard from "@/pages/admin/Dashboard";
import AdminBlogList from "@/pages/admin/BlogList";
import AdminBlogEditor from "@/pages/admin/BlogEditor";
import AdminCategories from "@/pages/admin/Categories";
import AdminGallery from "@/pages/admin/Gallery";
import AdminMedia from "@/pages/admin/Media";
import AdminComments from "@/pages/admin/Comments";
import AdminAnalytics from "@/pages/admin/Analytics";
import AdminProfile from "@/pages/admin/Profile";
import AdminContact from "@/pages/admin/Contact";
import SuperAdminPage from "@/pages/admin/SuperAdmin";
import BackupPage from "@/components/superadmin/BackupPage";
import AdminNetwork from "./pages/admin/Network"; // Community Network list

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

import { useEffect } from "react";
import { useLocation } from "wouter";

function RedirectToPortal() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/portal");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/blog" component={BlogListPage} />
      <Route path="/blog/:slug" component={BlogPostPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/contact" component={ContactPage} />

      <Route path="/portal" component={AdminDashboard} />
      <Route path="/portal/blogs" component={AdminBlogList} />
      <Route path="/portal/blogs/new" component={AdminBlogEditor} />
      <Route path="/portal/blogs/:id/edit" component={AdminBlogEditor} />
      <Route path="/portal/categories" component={AdminCategories} />
      <Route path="/portal/gallery" component={AdminGallery} />
      <Route path="/portal/media" component={AdminMedia} />
      <Route path="/portal/comments" component={AdminComments} />
      <Route path="/portal/analytics" component={AdminAnalytics} />
      <Route path="/portal/profile" component={AdminProfile} />
      <Route path="/portal/contact" component={AdminContact} />
      <Route path="/portal/backup" component={BackupPage} />
      <Route path="/portal/network" component={AdminNetwork} />
      <Route path="/portal/superadmin-secure-gate-token-9b1deb4d3b7d4f968e7e1f440a3243f78923a1ef96d84a7e930f3532cb11b439-management-dashboard" component={SuperAdminPage} />
      <Route path="/portal/superadmin-secure-gate-token-9b1deb4d3b7d4f968e7e1f440a3243f78923a1ef96d84a7e930f3532cb11b439-management-dashboard/overview" component={SuperAdminPage} />
      <Route path="/portal/superadmin-secure-gate-token-9b1deb4d3b7d4f968e7e1f440a3243f78923a1ef96d84a7e930f3532cb11b439-management-dashboard/users" component={SuperAdminPage} />
      <Route path="/portal/superadmin-secure-gate-token-9b1deb4d3b7d4f968e7e1f440a3243f78923a1ef96d84a7e930f3532cb11b439-management-dashboard/security" component={SuperAdminPage} />

      <Route path="/admin" component={RedirectToPortal} />
      <Route path="/admin/:wildcard*" component={RedirectToPortal} />

      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
