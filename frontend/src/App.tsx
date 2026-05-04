import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import DetailPage from "./pages/DetailPage";
import ProfileFormPage from "./pages/ProfileFormPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/alumni/:id" element={<DetailPage />} />
          <Route path="/profile/new" element={<ProfileFormPage />} />
          <Route path="/profile/edit/:id" element={<ProfileFormPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
