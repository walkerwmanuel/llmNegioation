import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import TextToText from "./pages/TextToText";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/text-to-text" element={<TextToText />} />
      </Routes>
    </Router>
  );
}
