import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import CharacterSelect from "./CharacterSelect";
import GamePage from "./GamePage";
import BattleZonePage from "./BattleZonePage"; // <-- 1. Impor BattleZonePage

function AppContent() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const navigate = useNavigate();

  const handleCharacterSelect = (characterData) => {
    setSelectedCharacter(characterData);
    navigate("/game");
  };

  // Baris 21 yang bermasalah ada di sekitar sini
  // HAPUS KARAKTER '*' YANG MUNGKIN ADA DI BARIS KOSONG INI ATAU BARIS DI BAWAHNYA

  const handleQuitGame = () => {
    // Fungsi ini juga bisa dipanggil dari BattleZonePage untuk kembali ke awal
    setSelectedCharacter(null);
    navigate("/");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          !selectedCharacter ? (
            <CharacterSelect onCharacterSelect={handleCharacterSelect} />
          ) : (
            <Navigate to="/game" replace />
          )
        }
      />
      <Route
        path="/game"
        element={
          selectedCharacter ? (
            <GamePage
              character={selectedCharacter} // Prop character berisi stat MAKSIMUM/AWAL
              onQuit={handleQuitGame} // Berikan fungsi ini ke GamePage
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/battle"
        element={
          selectedCharacter ? (
            <BattleZonePage onAppQuit={handleQuitGame} /> // Mengasumsikan Anda meneruskan prop onAppQuit
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
