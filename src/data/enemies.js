// src/data/enemies.js
import patapimImg from "../asset/patapim.jpg"; // Ganti dengan path sebenarnya jika beda
import tralalaImg from "../asset/tralala.jpg"; // Ganti dengan path sebenarnya jika beda
import sahurImg from "../asset/sahur.jpg"; // Ganti dengan path sebenarnya jika beda
import bombardiroImg from "../asset/bombardiro.jpg"; // Ganti dengan path sebenarnya jika beda

export const ENEMIES_DATA = [
  {
    id: "enemy_brr_patapim", // ID unik
    name: "Brr Brr Patapim",
    maxHealth: 50,
    damageMin: 5,
    damageMax: 10,
    rewardMin: 500,
    rewardMax: 1000,
    difficulty: "Easy",
    img: patapimImg, // Gunakan variabel gambar yang diimpor
    // Anda bisa tambahkan properti lain, misal deskripsi, suara serangan, dll.
  },
  {
    id: "enemy_tralala",
    name: "Tralalero Tralala",
    maxHealth: 250,
    damageMin: 15,
    damageMax: 25,
    rewardMin: 200,
    rewardMax: 400,
    difficulty: "Medium",
    img: tralalaImg,
  },
  {
    id: "enemy_sahur",
    name: "Tung Tung Tung Sahur",
    maxHealth: 5000,
    damageMin: 50,
    damageMax: 100,
    rewardMin: 1000,
    rewardMax: 2000,
    difficulty: "Hard",
    img: sahurImg,
  },
  {
    id: "enemy_bombardiro",
    name: "Bombardiro Crocodilo",
    maxHealth: 100000,
    damageMin: 1, // Bisa jadi damage sangat variatif
    damageMax: 100000,
    rewardMin: 10000,
    rewardMax: 100000,
    difficulty: "Extreme",
    img: bombardiroImg,
  },
];
