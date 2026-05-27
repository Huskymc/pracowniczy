import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "./utils";
import { base44 } from "@/api/base44Client";
import {
  LayoutDashboard,
  Home,
  Users,
  Clock,
  CalendarDays,
  FileText,
  BarChart3,
  Receipt,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Play,
  Square,
  Coffee,
  Pause,
  ChevronRight,
  Bell,
  UserCircle,
  HelpCircle,
  Sun,
  Moon,
  ChevronUp,
  ActivitySquare,
  MapPin,
  Monitor,
  Tv2,
  Fingerprint,
  FileBarChart2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingStart, setTrackingStart] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [trackingType, setTrackingType] = useState("work");
  const [trackingPanelOpen, setTrackingPanelOpen] = useState(false);
  const [presenceOpen, setPresenceOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [rcpOpen, setRcpOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("theme") === "dark");

  const trackingPanelRef = useRef(null);
  const presenceRef = useRef(null);
  const notifRef = useRef(null);
  const rcpRef = useRef(null);
  const location = useLocation();

  // Apply dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Click outside to close panels
  useEffect(() => {
    const handler = (e) => {
      if (trackingPanelRef.current && !trackingPanelRef.current.contains(e.target)) setTrackingPanelOpen(false);
      if (presenceRef.current && !presenceRef.current.contains(e.target)) setPresenceOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (rcpRef.current && !rcpRef.current.contains(e.target)) setRcpOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    const saved = localStorage.getItem("timeTracking");
    if (saved) {
      const { start, type } = JSON.parse(saved);
      setTrackingStart(new Date(start));
      setTrackingType(type || "work");
      setIsTracking(true);
    }
  }, []);

  useEffect(() => {
    let interval;
    if (isTracking && trackingStart) {
      interval = setInterval(() => setElapsedTime(Math.floor((Date.now() - trackingStart.getTime()) / 1000)), 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking, trackingStart]);

  const { data: employees } = useQuery({
    queryKey: ["employees_presence"],
    queryFn: () => base44.entities.Employee.list(),
    enabled: presenceOpen,
  });

  const { data: alerts } = useQuery({
    queryKey: ["alerts_notif"],
    queryFn: () => base44.entities.Alert.filter({ is_dismissed: false }),
  });

  const unreadCount = alerts?.filter(a => !a.is_read).length || 0;

  const formatTime = (s) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  const handleStart = (type = "work") => {
    const now = new Date();
    setTrackingStart(now);
    setIsTracking(true);
    setElapsedTime(0);
    setTrackingType(type);
    setTrackingPanelOpen(false);
    localStorage.setItem("timeTracking", JSON.stringify({ start: now.toISOString(), type }));
  };

  const handleStop = () => {
    setIsTracking(false);
    localStorage.removeItem("timeTracking");
    const checkIn = trackingStart.toTimeString().slice(0, 5);
    const checkOut = new Date().toTimeString().slice(0, 5);
    const date = new Date().toISOString().split("T")[0];
    window.location.href = createPageUrl("TimeTracking") + `?autoFill=true&checkIn=${checkIn}&checkOut=${checkOut}&date=${date}&type=${trackingType}`;
  };

  const getInitials = (name) => !name ? "U" : name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const presenceGroups = {
    "Aktywny": [],
    "Na urlopie": [],
    "Zwolnienie lekarskie": [],
    "Nieaktywny": [],
  };
  employees?.forEach(e => {
    const g = e.status || "Aktywny";
    if (presenceGroups[g]) presenceGroups[g].push(e);
  });

  // Navigation: left side links
  const leftNav = [
    { name: "Zespół", page: "Employees", icon: Users },
    { name: "Kalendarz", page: "Calendar", icon: CalendarDays },
    { name: "Wnioski", page: "LeaveRequests", icon: FileText },
    { name: "Raporty", page: "MonthlyReports", icon: BarChart3 },
  ];


  const rcpItems = [
    { name: "Zdarzenia", page: "TimeTracking", icon: ActivitySquare },
    { name: "Statusy Pracy", page: "WorkStatuses", icon: Fingerprint },
  ];

  const isActive = (page) => currentPageName === page;

  const navLinkClass = (page) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
      isActive(page)
        ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
    }`;

  const rcpActive = ["TimeTracking", "WorkStatuses"].includes(currentPageName);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      {/* TOP HEADER */}
      <header className="sticky top-0 z-50 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center h-12 px-3 gap-2">
          {/* Logo */}
          <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2 flex-shrink-0 mr-3">
            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-violet-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">Z</span>
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-white hidden sm:block">ZenithMC</span>
          </Link>

          {/* Left nav */}
          <nav className="hidden md:flex items-center gap-0.5">
            {/* Home */}
            <Link to={createPageUrl("Dashboard")} className={navLinkClass("Dashboard")} title="Strona główna">
              <Home className="w-3.5 h-3.5" />
            </Link>
            {leftNav.map((item) => (
              <Link key={item.page} to={createPageUrl(item.page)} className={navLinkClass(item.page)}>
                <item.icon className="w-3.5 h-3.5" />
                {item.name}
              </Link>
            ))}

            {/* RCP Dropdown */}
            <div ref={rcpRef} className="relative">
              <button
                onClick={() => setRcpOpen(!rcpOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  rcpActive
                    ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                RCP
                <ChevronDown className={`w-3 h-3 transition-transform ${rcpOpen ? "rotate-180" : ""}`} />
              </button>
              {rcpOpen && (
                <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1 z-50">
                  {rcpItems.map(item => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setRcpOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <item.icon className="w-4 h-4 text-slate-400" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>


          </nav>

          {/* RIGHT SIDE */}
          <div className="ml-auto flex items-center gap-1">
            {/* Time tracking button */}
            <div ref={trackingPanelRef} className="relative">
              {isTracking ? (
                <button
                  onClick={() => setTrackingPanelOpen(!trackingPanelOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-sm hover:bg-emerald-100 transition-colors"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-xs font-semibold">{formatTime(elapsedTime)}</span>
                  <ChevronDown className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={() => setTrackingPanelOpen(!trackingPanelOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span className="hidden sm:inline">Czas pracy</span>
                  <span className="font-mono">00:00:00</span>
                </button>
              )}

              {/* Tracking Panel */}
              {trackingPanelOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 z-50">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Wybierz co chcesz zrobić</p>
                  <div className="space-y-2">
                    {/* Work */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Czas pracy</p>
                        <p className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                          {isTracking && trackingType === "work" ? formatTime(elapsedTime) : "00:00:00"}
                        </p>
                      </div>
                      {isTracking && trackingType === "work" ? (
                        <button onClick={handleStop} className="w-10 h-10 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center transition-colors">
                          <Square className="w-4 h-4 fill-white text-white" />
                        </button>
                      ) : (
                        <button onClick={() => handleStart("work")} className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-colors">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </button>
                      )}
                    </div>
                    {/* Break */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20">
                      <div>
                        <p className="text-xs text-amber-600 dark:text-amber-400">Przerwa</p>
                        <p className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                          {isTracking && trackingType === "break" ? formatTime(elapsedTime) : "00:00:00"}
                        </p>
                      </div>
                      {isTracking && trackingType === "break" ? (
                        <button onClick={handleStop} className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 flex items-center justify-center transition-colors">
                          <Square className="w-4 h-4 fill-white text-white" />
                        </button>
                      ) : (
                        <button onClick={() => handleStart("break")} disabled={isTracking} className="w-10 h-10 rounded-full bg-amber-400 hover:bg-amber-500 disabled:opacity-40 flex items-center justify-center transition-colors">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </button>
                      )}
                    </div>
                    {/* Unpaid break */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                      <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Przerwa bezpłatna</p>
                        <p className="font-mono text-lg font-bold text-slate-800 dark:text-white">
                          {isTracking && trackingType === "unpaid_break" ? formatTime(elapsedTime) : "00:00:00"}
                        </p>
                      </div>
                      {isTracking && trackingType === "unpaid_break" ? (
                        <button onClick={handleStop} className="w-10 h-10 rounded-full bg-slate-500 hover:bg-slate-600 flex items-center justify-center transition-colors">
                          <Square className="w-4 h-4 fill-white text-white" />
                        </button>
                      ) : (
                        <button onClick={() => handleStart("unpaid_break")} disabled={isTracking} className="w-10 h-10 rounded-full bg-slate-400 hover:bg-slate-500 disabled:opacity-40 flex items-center justify-center transition-colors">
                          <Play className="w-4 h-4 fill-white text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Presence (person icon) */}
            <div ref={presenceRef} className="relative">
              <button
                onClick={() => { setPresenceOpen(!presenceOpen); setNotifOpen(false); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <UserCircle className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              </button>
              {presenceOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Przegląd obecności</h3>
                  </div>
                  <div className="p-3 space-y-1.5 max-h-96 overflow-y-auto">
                    {[
                      { label: "Aktualnie w pracy", key: "Aktywny", color: "bg-emerald-400" },
                      { label: "Spóźnieni", key: "_late", color: "bg-amber-400" },
                      { label: "Nieobecni", key: "Nieaktywny", color: "bg-rose-400" },
                      { label: "Na urlopie", key: "Na urlopie", color: "bg-sky-400" },
                      { label: "Zwolnienie lekarskie", key: "Zwolnienie lekarskie", color: "bg-orange-400" },
                    ].map(({ label, key, color }) => {
                      const list = presenceGroups[key] || [];
                      return (
                        <PresenceGroup key={key} label={label} count={list.length} color={color} employees={list} />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div ref={notifRef} className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setPresenceOpen(false); }}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors relative"
              >
                <Bell className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Powiadomienia</h3>
                    {unreadCount > 0 && <span className="text-xs bg-rose-100 text-rose-600 rounded-full px-2 py-0.5">{unreadCount} nowych</span>}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {alerts?.length === 0 || !alerts ? (
                      <p className="text-sm text-slate-400 p-4 text-center">Brak powiadomień</p>
                    ) : (
                      alerts.slice(0, 10).map(alert => (
                        <div key={alert.id} className={`px-4 py-3 border-b border-slate-50 dark:border-slate-700 ${!alert.is_read ? "bg-violet-50/50 dark:bg-violet-900/10" : ""}`}>
                          <p className="text-sm font-medium text-slate-800 dark:text-white">{alert.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{alert.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title={darkMode ? "Tryb jasny" : "Tryb ciemny"}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500" />}
            </button>

            {/* User avatar */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Avatar className="h-7 w-7 border-2 border-violet-100 dark:border-violet-800">
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-violet-600 text-white text-xs font-semibold">
                        {getInitials(user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200 hidden sm:block">{getInitials(user.full_name)}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 dark:bg-slate-800 dark:border-slate-700">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-white">{user.full_name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator className="dark:border-slate-700" />
                  <DropdownMenuItem onClick={() => base44.auth.logout()} className="text-red-600 dark:text-red-400">
                    <LogOut className="w-4 h-4 mr-2" />
                    Wyloguj się
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile menu */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              {mobileMenuOpen ? <X className="w-5 h-5 text-slate-600 dark:text-slate-300" /> : <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 space-y-1">
            {[{ name: "Panel główny", page: "Dashboard", icon: LayoutDashboard }, ...leftNav, { name: "Raporty", page: "MonthlyReports", icon: BarChart3 }, ...rcpItems].map((item) => (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.page) ? "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300" : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="p-4 lg:p-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 z-40 flex items-center justify-around px-2 py-1 safe-area-inset-bottom">
        {[
          { name: "Główna", page: "Dashboard", icon: Home },
          { name: "Zespół", page: "Employees", icon: Users },
          { name: "Kalendarz", page: "Calendar", icon: CalendarDays },
          { name: "Wnioski", page: "LeaveRequests", icon: FileText },
          { name: "Raporty", page: "MonthlyReports", icon: BarChart3 },
        ].map(item => (
          <Link
            key={item.page}
            to={createPageUrl(item.page)}
            className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors min-w-[48px] ${
              isActive(item.page)
                ? "text-violet-700 dark:text-violet-300"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function PresenceGroup({ label, count, color, employees }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => count > 0 && setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${count > 0 ? "hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer" : "cursor-default"}`}
      >
        <span className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{count}</span>
        <span className="text-sm text-slate-700 dark:text-slate-200 flex-1 text-left">{label}</span>
        {count > 0 && (open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />)}
      </button>
      {open && count > 0 && (
        <div className="ml-10 mb-1 space-y-0.5">
          {employees.map(emp => (
            <div key={emp.id} className="flex items-center gap-2 px-2 py-1.5">
              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-200">
                {emp.first_name?.[0]}{emp.last_name?.[0]}
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-300">{emp.first_name} {emp.last_name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
