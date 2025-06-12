import React, { useState } from "react";
import "./styles.css"; // Pastikan path ke file CSS Anda benar

// Impor gambar karakter Anda (sesuaikan path jika perlu)
import ambaImg from "./asset/mas-amba.png";
import rusdiImg from "./asset/mas-rusdi.png";
import ironiImg from "./asset/mr-ironi.png";
import imoetImg from "./asset/si-imoet.png";

// Definisi data karakter
const characters = [
  {
    name: "Mas Amba",
    img: ambaImg,
    health: 100,
    hunger: 100,
    thirst: 100,
    energy: 100,
    money: 50,
  },
  {
    name: "Mas Rusdi",
    img: rusdiImg,
    health: 80,
    hunger: 90,
    thirst: 90,
    energy: 120,
    money: 70,
  },
  {
    name: "Si Imoet",
    img: imoetImg,
    health: 70,
    hunger: 80,
    thirst: 80,
    energy: 150,
    money: 100,
  },
  {
    name: "Mr. Ironi",
    img: ironiImg,
    health: 90,
    hunger: 100,
    thirst: 90,
    energy: 110,
    money: 60,
  },
];

// Komponen CharacterSelect menerima onCharacterSelect sebagai prop
function CharacterSelect({ onCharacterSelect }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nickname, setNickname] = useState("");

  const currentCharacter = characters[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? characters.length - 1 : prevIndex - 1
    );
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % characters.length);
  };

  const handleSelect = () => {
    if (!nickname.trim()) {
      alert("Please enter a nickname!");
      return;
    }
    const selectedData = {
      ...currentCharacter, // Data karakter yang dipilih (health, hunger, dll. adalah nilai max/awal)
      nickname: nickname.trim(),
    };
    // Panggil fungsi yang diberikan oleh App.jsx untuk mengirim data karakter
    onCharacterSelect(selectedData);
  };

  return (
    <div className="container">
      <h1 className="title">JMK48 VS Brainrot</h1>
      <div className="character-select">
        <button className="nav-button" onClick={handlePrev}>
          ⬅
        </button>
        <div className="character-display">
          <img
            src={currentCharacter.img}
            alt={currentCharacter.name}
            className="character-image"
          />
          <p className="character-name">{currentCharacter.name}</p>
          <div className="character-stats">
            <div className="stat-box">
              ❤️ Health
              <br />
              {currentCharacter.health}
            </div>
            <div className="stat-box">
              🍗 Hunger
              <br />
              {currentCharacter.hunger}
            </div>
            <div className="stat-box">
              💧 Thirst
              <br />
              {currentCharacter.thirst}
            </div>
            <div className="stat-box">
              ⚡ Energy
              <br />
              {currentCharacter.energy}
            </div>
          </div>
        </div>
        <button className="nav-button" onClick={handleNext}>
          ➡
        </button>
      </div>
      <input
        type="text"
        placeholder="Enter your nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        className="nickname-input"
      />
      <button className="select-button" onClick={handleSelect}>
        Select
      </button>
    </div>
  );
}

export default CharacterSelect;
