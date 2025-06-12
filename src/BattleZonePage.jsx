import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BattleZonePage.css";
import { ENEMIES_DATA } from "./data/enemies.js";
import hitSound from "./sounds/hit.mp3";
import brrSound from "./sounds/brr.mp3";
import sahurSound from "./sounds/sahur.mp3";
import crocoSound from "./sounds/croco.mp3";
import tralalaSound from "./sounds/tralala.mp3";
import menangSound from "./sounds/menang.mp3";
import kalahSound from "./sounds/kalah.mp3";

const CHOICES = ["batu", "gunting", "kertas"];
const PLAYER_DEFAULT_FALLBACK_DAMAGE = 10;

function BattleZonePage({ onAppQuit }) {
  const navigate = useNavigate();
  const location = useLocation();

  const initialPlayerData = location.state?.playerData;
  const [playerStats, setPlayerStats] = useState(null);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [isBattleOver, setIsBattleOver] = useState(false);
  const [battleResult, setBattleResult] = useState("");
  const [selectedEnemyId, setSelectedEnemyId] = useState(null);

  const hitAudioRef = useRef(new Audio(hitSound));
  const brrAudioRef = useRef(new Audio(brrSound));
  const sahurAudioRef = useRef(new Audio(sahurSound));
  const crocoAudioRef = useRef(new Audio(crocoSound));
  const tralalaAudioRef = useRef(new Audio(tralalaSound));
  const menangAudioRef = useRef(new Audio(menangSound));
  const kalahAudioRef = useRef(new Audio(kalahSound));
  const backgroundAudioRef = useRef(null);

  useEffect(() => {
    const audios = [hitAudioRef.current, brrAudioRef.current, sahurAudioRef.current, crocoAudioRef.current, tralalaAudioRef.current, menangAudioRef.current, kalahAudioRef.current];
    audios.forEach((audio) => { audio.preload = "auto"; audio.load(); });
    return () => audios.forEach((audio) => { audio.pause(); audio.currentTime = 0; });
  }, []);

  useEffect(() => {
    if (!isBattleOver && currentEnemy) {
      // Set background audio based on enemy name
      if (currentEnemy.name.includes("Brr")) {
        backgroundAudioRef.current = brrAudioRef.current;
      } else if (currentEnemy.name.includes("Sahur")) {
        backgroundAudioRef.current = sahurAudioRef.current;
      } else if (currentEnemy.name.includes("Croco")) {
        backgroundAudioRef.current = crocoAudioRef.current;
      } else if (currentEnemy.name.includes("Tralala")) {
        backgroundAudioRef.current = tralalaAudioRef.current;
      } else {
        backgroundAudioRef.current = hitAudioRef.current; // Default
      }
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.3; // Lower volume for background
      backgroundAudioRef.current.play().catch((err) => console.error("Error playing background sound:", err));
    }
    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      }
    };
  }, [currentEnemy, isBattleOver]);

  useEffect(() => {
    if (!isBattleOver || !battleResult) return;
    if (battleResult === "win") menangAudioRef.current.play().catch((err) => console.error("Error playing menang sound:", err));
    else if (battleResult === "lose_player_defeated") kalahAudioRef.current.play().catch((err) => console.error("Error playing kalah sound:", err));
  }, [isBattleOver, battleResult]);

  useEffect(() => {
    if (initialPlayerData && ENEMIES_DATA && ENEMIES_DATA.length > 0) {
      console.log(
        "BattleZonePage: Menerima initialPlayerData dari GamePage:",
        JSON.parse(JSON.stringify(initialPlayerData))
      );
      setPlayerStats({
        ...initialPlayerData,
      });
      setBattleLog([]);
      setIsBattleOver(false);
      setBattleResult("");
      setSelectedEnemyId(null);
      setCurrentEnemy(null);
    } else {
      if (!initialPlayerData)
        console.warn("BattleZonePage: Tidak ada data pemain diterima.");
      if (!ENEMIES_DATA || ENEMIES_DATA.length === 0)
        console.error("BattleZonePage: Data musuh tidak tersedia.");
      navigate("/");
    }
  }, [initialPlayerData, navigate]);

  const getPlayerDamage = () => {
    return playerStats?.damage || PLAYER_DEFAULT_FALLBACK_DAMAGE;
  };

  const getEnemyDamage = (enemy) => {
    if (!enemy) return 0;
    return (
      Math.floor(Math.random() * (enemy.damageMax - enemy.damageMin + 1)) +
      enemy.damageMin
    );
  };

  const determineWinnerRPS = (playerChoice, enemyChoice) => {
    if (playerChoice === enemyChoice) return "draw";
    if (
      (playerChoice === "batu" && enemyChoice === "gunting") ||
      (playerChoice === "gunting" && enemyChoice === "kertas") ||
      (playerChoice === "kertas" && enemyChoice === "batu")
    ) {
      return "player_wins_round";
    }
    return "enemy_wins_round";
  };

  const pauseAllSounds = () => {
    [hitAudioRef.current, brrAudioRef.current, sahurAudioRef.current, crocoAudioRef.current, tralalaAudioRef.current, menangAudioRef.current, kalahAudioRef.current].forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  };

  const handlePlayerChoice = (playerChoice) => {
    if (
      isBattleOver ||
      !currentEnemy ||
      !playerStats ||
      playerStats.currentHealth <= 0
    )
      return;

    hitAudioRef.current.play().catch((err) => console.error("Error playing hit sound:", err));

    const enemyChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];
    const roundWinner = determineWinnerRPS(playerChoice, enemyChoice);

    let logMessage = `Kamu: ${playerChoice} | ${currentEnemy.name}: ${enemyChoice}. `;
    let newPlayerHealth = playerStats.currentHealth;
    let newEnemyHealth = currentEnemy.currentHealth;

    if (roundWinner === "player_wins_round") {
      const damageDealt = getPlayerDamage();
      newEnemyHealth = Math.max(0, newEnemyHealth - damageDealt);
      logMessage += `Kamu menyerang! ${currentEnemy.name} -${damageDealt} HP.`;
    } else if (roundWinner === "enemy_wins_round") {
      const damageTaken = getEnemyDamage(currentEnemy);
      newPlayerHealth = Math.max(0, newPlayerHealth - damageTaken);
      logMessage += `${currentEnemy.name} menyerang! Kamu -${damageTaken} HP.`;
    } else {
      logMessage += `Seri! Tidak ada yang terluka.`;
    }

    setBattleLog((prev) => [logMessage, ...prev].slice(0, 5));

    const updatedPlayerStatsForThisRound = {
      ...playerStats,
      currentHealth: newPlayerHealth,
    };

    const tempUpdatedEnemy = { ...currentEnemy, currentHealth: newEnemyHealth };
    setCurrentEnemy(tempUpdatedEnemy);

    if (tempUpdatedEnemy.currentHealth <= 0) {
      setIsBattleOver(true);
      setBattleResult("win");
      const reward =
        Math.floor(
          Math.random() *
            (tempUpdatedEnemy.rewardMax - tempUpdatedEnemy.rewardMin + 1)
        ) + tempUpdatedEnemy.rewardMin;

      setPlayerStats({
        ...updatedPlayerStatsForThisRound,
        money: (updatedPlayerStatsForThisRound.money || 0) + reward,
      });
      console.log(
        "BattleZonePage: Player wins! Final player stats before sending:",
        JSON.parse(
          JSON.stringify({
            ...updatedPlayerStatsForThisRound,
            money: (updatedPlayerStatsForThisRound.money || 0) + reward,
          })
        )
      );
      setBattleLog((prev) =>
        [
          `Kamu mengalahkan ${tempUpdatedEnemy.name}! Mendapatkan $${reward}.`,
          ...prev,
        ].slice(0, 5)
      );
    } else if (updatedPlayerStatsForThisRound.currentHealth <= 0) {
      setIsBattleOver(true);
      setBattleResult("lose_player_defeated");
      setPlayerStats(updatedPlayerStatsForThisRound);
      console.log(
        "BattleZonePage: Player loses! Final player stats before sending:",
        JSON.parse(JSON.stringify(updatedPlayerStatsForThisRound))
      );
      setBattleLog((prev) =>
        [`Kamu dikalahkan oleh ${tempUpdatedEnemy.name}!`, ...prev].slice(0, 5)
      );
    } else {
      setPlayerStats(updatedPlayerStatsForThisRound);
    }
  };

  const handleEndBattle = () => {
    pauseAllSounds();
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
    sahurAudioRef.current.play().catch((err) => console.error("Error playing sahur sound:", err));
    if (playerStats) {
      console.log(
        "BattleZonePage: MENGIRIM KEMBALI ke GamePage SETELAH BATTLE. PlayerStats:",
        JSON.parse(JSON.stringify(playerStats)),
        "Battle Outcome:",
        battleResult
      );
      navigate("/game", {
        state: {
          updatedPlayerDataFromBattle: playerStats,
          battleOutcome: battleResult,
        },
      });
    } else {
      console.warn(
        "BattleZonePage: handleEndBattle - playerStats is null, navigating to /"
      );
      if (onAppQuit) onAppQuit();
      else navigate("/");
    }
  };

  const handleReturnToMapWithoutFighting = () => {
    pauseAllSounds();
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.pause();
      backgroundAudioRef.current.currentTime = 0;
    }
    sahurAudioRef.current.play().catch((err) => console.error("Error playing sahur sound:", err));
    if (initialPlayerData) {
      console.log(
        "BattleZonePage: MENGIRIM KEMBALI ke GamePage TANPA BATTLE. Mengirim initialPlayerData:",
        JSON.parse(JSON.stringify(initialPlayerData))
      );
      navigate("/game", {
        state: {
          updatedPlayerDataFromBattle: initialPlayerData,
          battleOutcome: "returned_without_battle",
        },
      });
    } else {
      console.warn(
        "BattleZonePage: handleReturnToMapWithoutFighting - initialPlayerData is null."
      );
      navigate("/");
    }
  };

  const handleSelectEnemy = (enemyId) => {
    const selectedEnemy = ENEMIES_DATA.find((e) => e.id === enemyId);
    if (selectedEnemy) {
      pauseAllSounds();
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0;
      }
      if (selectedEnemy.name.includes("Brr")) brrAudioRef.current.play().catch((err) => console.error("Error playing brr sound:", err));
      else if (selectedEnemy.name.includes("Sahur")) sahurAudioRef.current.play().catch((err) => console.error("Error playing sahur sound:", err));
      else if (selectedEnemy.name.includes("Croco")) crocoAudioRef.current.play().catch((err) => console.error("Error playing croco sound:", err));
      else if (selectedEnemy.name.includes("Tralala")) tralalaAudioRef.current.play().catch((err) => console.error("Error playing tralala sound:", err));
      else hitAudioRef.current.play().catch((err) => console.error("Error playing hit sound:", err));
      setCurrentEnemy({
        ...selectedEnemy,
        currentHealth: selectedEnemy.maxHealth,
      });
      setSelectedEnemyId(enemyId);
      setIsBattleOver(false);
      setBattleResult("");
      setBattleLog([]);
      console.log("BattleZonePage: Enemy selected:", selectedEnemy.name);
    }
  };

  if (!playerStats) {
    return (
      <div className="battle-zone-container">
        Loading player data for battle... (Waiting for initialPlayerData)
      </div>
    );
  }

  if (!currentEnemy) {
    return (
      <div className="battle-zone-container">
        <div className="enemy-selection">
          <h1>Pilih Musuh untuk Bertarung</h1>
          <div className="enemy-list">
            {ENEMIES_DATA.map((enemy) => (
              <div key={enemy.id} className="enemy-card">
                {enemy.img && (
                  <img
                    src={enemy.img}
                    alt={enemy.name}
                    className="enemy-img-select"
                  />
                )}
                <h2>{enemy.name}</h2>
                <p>Kesulitan: {enemy.difficulty}</p>
                <p>HP: {enemy.maxHealth}</p>
                <p>
                  Damage: {enemy.damageMin} - {enemy.damageMax}
                </p>
                <button onClick={() => handleSelectEnemy(enemy.id)}>
                  Pilih Musuh
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleReturnToMapWithoutFighting}
            className="return-button"
            style={{ marginTop: "20px" }}
          >
            Kembali ke Peta (Tanpa Bertarung)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-zone-container">
      <h1>Battle vs: {currentEnemy.name}</h1>
      <p>(Kesulitan: {currentEnemy.difficulty})</p>

      <div className="battle-area">
        <div className="combatant-display player-display">
          {playerStats.img && (
            <img
              src={playerStats.img}
              alt={playerStats.nickname || "Pemain"}
              className="combatant-img"
            />
          )}
          <h2>{playerStats.nickname || playerStats.name || "Pemain"}</h2>
          <p className="health-bar">
            ❤️{" "}
            {playerStats.currentHealth !== undefined
              ? playerStats.currentHealth.toFixed(0)
              : "N/A"}{" "}
            /{" "}
            {playerStats.maxHealth !== undefined
              ? playerStats.maxHealth
              : "N/A"}
          </p>
          <p>🗡️ Damage: {getPlayerDamage()}</p>
          <p>
            💰 Uang: ${playerStats.money !== undefined ? playerStats.money : 0}
          </p>
        </div>

        <div className="combatant-display enemy-display">
          {currentEnemy.img && (
            <img
              src={currentEnemy.img}
              alt={currentEnemy.name}
              className="combatant-img"
            />
          )}
          <h2>{currentEnemy.name}</h2>
          <p className="health-bar">
            ❤️{" "}
            {currentEnemy.currentHealth !== undefined
              ? currentEnemy.currentHealth.toFixed(0)
              : "N/A"}{" "}
            /{" "}
            {currentEnemy.maxHealth !== undefined
              ? currentEnemy.maxHealth
              : "N/A"}
          </p>
          <p>
            🗡️ Damage: {currentEnemy.damageMin} - {currentEnemy.damageMax}
          </p>
        </div>
      </div>

      {!isBattleOver ? (
        <div className="battle-actions">
          <button onClick={() => handlePlayerChoice("batu")}>Batu ✊</button>
          <button onClick={() => handlePlayerChoice("gunting")}>
            Gunting ✌️
          </button>
          <button onClick={() => handlePlayerChoice("kertas")}>
            Kertas 🖐️
          </button>
        </div>
      ) : (
        <div className="battle-result">
          <h2 className={battleResult.startsWith("lose") ? "lose" : ""}>
            {battleResult === "win"
              ? "🎉 KAMU MENANG! 🎉"
              : battleResult === "lose_player_defeated"
              ? "💔 KAMU KALAH! 💔"
              : "Pertarungan Selesai"}
          </h2>
          <button onClick={handleEndBattle} className="return-button">
            Kembali ke Peta
          </button>
        </div>
      )}

      <div className="battle-log">
        <h3>Log Pertarungan:</h3>
        <div>
          {battleLog.map((log, index) => (
            <p key={index}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default BattleZonePage;