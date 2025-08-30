import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Menu, User, Shield, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    setProfileMenuOpen(false);
  };

  const handleProfile = () => {
    setLocation("/profile");
    setProfileMenuOpen(false);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Left side - Menu button and branding */}
      <div className="flex items-center space-x-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden hover:bg-gray-100"
        >
          <Menu className="h-5 w-5 text-gray-700" />
        </Button>
        
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-bold text-gray-900">Jivo E-Com</h1>
          </div>
        </div>
      </div>

      {/* Right side - User menu */}
      <Sheet open={profileMenuOpen} onOpenChange={setProfileMenuOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100 h-10 px-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-medium">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">
                {user?.full_name || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {user?.department || user?.role || 'Member'}
              </p>
            </div>
          </Button>
        </SheetTrigger>
        
        <SheetContent side="right" className="w-80">
          <SheetHeader className="text-left pb-6">
            <SheetTitle className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-medium">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {user?.full_name || user?.username || 'User'}
                </p>
                <p className="text-sm text-gray-600">{user?.email}</p>
              </div>
            </SheetTitle>
            <SheetDescription>
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role}
                </Badge>
                {user?.department && (
                  <Badge variant="outline" className="text-xs">
                    {user.department}
                  </Badge>
                )}
                <Badge 
                  variant={user?.is_active ? "default" : "destructive"} 
                  className="text-xs"
                >
                  {user?.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4">
            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4"
                onClick={handleProfile}
              >
                <User className="w-5 h-5 mr-3" />
                View Profile
              </Button>
              
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 mt-2"
                onClick={handleProfile}
              >
                <Settings className="w-5 h-5 mr-3" />
                Account Settings
              </Button>
            </div>

            <div className="border-t pt-4">
              <Button
                variant="ghost"
                className="w-full justify-start h-12 px-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-5 h-5 mr-3" />
                {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
              </Button>
            </div>

            {user?.last_login && (
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 px-4">
                  Last login: {new Date(user.last_login).toLocaleDateString()} at{" "}
                  {new Date(user.last_login).toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}