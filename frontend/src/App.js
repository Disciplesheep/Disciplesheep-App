import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import JournalEntry from "@/pages/JournalEntry";
import PeopleTracker from "@/pages/PeopleTracker";
import ExpenseLedger from "@/pages/ExpenseLedger";
import DiscipleshipTracker from "@/pages/DiscipleshipTracker";
import Stewardship from "@/pages/Stewardship";
import Reports from "@/pages/Reports";
import Settings from "@/pages/Settings";

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="journal" element={<JournalEntry />} />
              <Route path="discipleship" element={<DiscipleshipTracker />} />
              <Route path="stewardship" element={<Stewardship />} />
              <Route path="stewardship/people" element={<PeopleTracker />} />
              <Route path="stewardship/expenses" element={<ExpenseLedger />} />
              <Route path="stewardship/reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors />
      </div>
    </ThemeProvider>
  );
}

export default App;
