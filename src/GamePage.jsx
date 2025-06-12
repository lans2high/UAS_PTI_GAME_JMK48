import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Game.css";
import adventureBgURL from "./asset/adventure-bg.png";
import foodStallImg from "./asset/food-stall.jpg";
import clinicImg from "./asset/clinic.jpg";
import weaponShopImg from "./asset/weapon-shop.jpg";
import restAreaImg from "./asset/rest-area.jpg";
import battleZoneImg from "./asset/battle-zone.jpg";
import healingSound from "./sounds/Healing.mp3";
import snoringSound from "./sounds/snoring.mp3";
import blacksmithSound from "./sounds/Blacksmith.mp3";
import makanSound from "./sounds/makan.mp3";
import MiniMap from "./MiniMap";

// --- KONSTANTA ---
const interactablePointsDefinition = [
  {
    id: "food_stall",
    x: 70,
    y: 75,
    imgPath: foodStallImg,
    name: "Food Stall",
    type: "shop_food",
    message: "Lapar? Mampir sini!",
    imgWidth: 120,
    imgHeight: 120,
    detectionRadius: 70,
  },
  {
    id: "clinic",
    x: 400,
    y: 75,
    imgPath: clinicImg,
    name: "Clinic",
    type: "heal",
    message: "Butuh penyembuhan? Tekan E untuk menyembuhkan.",
    imgWidth: 120,
    imgHeight: 120,
    detectionRadius: 75,
  },
  {
    id: "weapon_shop",
    x: 730,
    y: 75,
    imgPath: weaponShopImg,
    name: "Weapon Shop",
    type: "shop_weapon",
    message: "Cari senjata baru?",
    imgWidth: 120,
    imgHeight: 120,
    detectionRadius: 70,
  },
  {
    id: "rest_area",
    x: 70,
    y: 520,
    imgPath: restAreaImg,
    name: "Rest Area",
    type: "rest",
    message: "Istirahat dulu? Tekan E untuk beristirahat (Timeskip 8 jam).",
    imgWidth: 120,
    imgHeight: 120,
    detectionRadius: 70,
  },
  {
    id: "battle_zone",
    x: 730,
    y: 520,
    imgPath: battleZoneImg,
    name: "Battle Zone",
    type: "battle",
    message: "Siap untuk bertarung?!",
    imgWidth: 120,
    imgHeight: 120,
    detectionRadius: 70,
  },
];
const weaponShopItems = [
  {
    id: "sword",
    name: "Sword",
    type: "weapon",
    price: 50,
    damageBonus: 10,
    description: "A sharp sword that increases damage by 10.",
  },
  {
    id: "axe",
    name: "Axe",
    type: "weapon",
    price: 80,
    damageBonus: 15,
    description: "A heavy axe that increases damage by 15.",
  },
  {
    id: "elixir_health",
    name: "Health Elixir",
    type: "elixir",
    price: 30,
    healthBonus: 20,
    description: "Increases maximum health by 20.",
  },
  {
    id: "elixir_energy",
    name: "Energy Elixir",
    type: "elixir",
    price: 30,
    energyBonus: 20,
    description: "Increases maximum energy by 20.",
  },
  {
    id: "vitality_apple",
    name: "Vitality Apple",
    type: "elixir_max_health",
    price: 75,
    maxHealthBonus: 10,
    description:
      "A mystical apple that permanently increases maximum health by 10.",
  },
];
const foodStallItems = [
  {
    id: "bread",
    name: "Bread",
    type: "food",
    price: 20,
    hungerBonus: 30,
    description: "Restores 30 hunger.",
  },
  {
    id: "water_bottle",
    name: "Water Bottle",
    type: "drink",
    price: 15,
    thirstBonus: 30,
    description: "Restores 30 thirst.",
  },
  {
    id: "combo_meal",
    name: "Combo Meal",
    type: "food_drink",
    price: 40,
    hungerBonus: 20,
    thirstBonus: 20,
    description: "Restores 20 hunger and 20 thirst.",
  },
  {
    id: "hunger_elixir",
    name: "Hunger Elixir",
    type: "elixir_hunger",
    price: 50,
    maxHungerBonus: 20,
    description: "Increases maximum hunger by 20.",
  },
  {
    id: "thirst_elixir",
    name: "Thirst Elixir",
    type: "elixir_thirst",
    price: 50,
    maxThirstBonus: 20,
    description: "Increases maximum thirst by 20.",
  },
];
const HUNGER_DECAY_PER_SECOND = 2.5;
const THIRST_DECAY_PER_SECOND = 2.5;
const ENERGY_DECAY_ON_MOVE_PER_SECOND = 5;
const HEALTH_DECAY_PER_SECOND_CRITICAL = 1.66;
const NORMAL_SPEED_PIXELS_PER_SECOND = 400;
const SLOWED_SPEED_PIXELS_PER_SECOND = 100;
const CHARACTER_BASE_DAMAGE_FALLBACK = 5;

// --- Komponen GamePage ---
function GamePage({ character, onQuit }) {
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);

  // --- Audio Instances ---
  const healingAudioRef = useRef(new Audio(healingSound));
  const snoringAudioRef = useRef(new Audio(snoringSound));
  const blacksmithAudioRef = useRef(new Audio(blacksmithSound));
  const makanAudioRef = useRef(new Audio(makanSound));

  // --- Preload Audio Files ---
  useEffect(() => {
    healingAudioRef.current.preload = "auto";
    snoringAudioRef.current.preload = "auto";
    blacksmithAudioRef.current.preload = "auto";
    makanAudioRef.current.preload = "auto";
    healingAudioRef.current.load();
    snoringAudioRef.current.load();
    blacksmithAudioRef.current.load();
    makanAudioRef.current.load();
  }, []);

  // --- STATE UTAMA PEMAIN (TERPUSAT) ---
  const [playerData, setPlayerData] = useState(null);

  // --- State UI & Game Mekanik Lainnya ---
  const [keysPressed, setKeysPressed] = useState({});
  const [joystickPressed, setJoystickPressed] = useState({
    up: false,
    down: false,
    left: false,
    right: false,
  });
  const characterDisplaySize = 70;
  const playerPositionRef = useRef({
    x: 400 - characterDisplaySize / 2,
    y: 300 - characterDisplaySize / 2,
  });
  const lastFrameTimeRef = useRef(performance.now());
  const timeAccumulatorPassiveDecay = useRef(0);
  const timeAccumulatorCriticalDecay = useRef(0);
  const bgImageRef = useRef(new Image());
  const characterImageRef = useRef(new Image());
  const [assetsLoaded, setAssetsLoaded] = useState({
    bg: false,
    character: false,
    interactables: false,
  });
  const [interactablePointImages, setInteractablePointImages] = useState({});
  const [nearbyInteractable, setNearbyInteractable] = useState(null);
  const [showInteractionPrompt, setShowInteractionPrompt] = useState(false);
  const [interactionMessage, setInteractionMessage] = useState("");
  const [isInteracting, setIsInteracting] = useState(false);
  const [showShopMenu, setShowShopMenu] = useState(false);
  const [showFoodMenu, setShowFoodMenu] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [gameTime, setGameTime] = useState(() => {
    const now = new Date("2025-06-12T18:25:00+07:00"); // Updated to 06:25 PM WIB
    return { hours: now.getHours(), minutes: now.getMinutes(), day: 1 };
  });

  const formatGameTime = () => {
    const { hours, minutes, day } = gameTime;
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `Day ${day} - ${displayHours}:${displayMinutes} ${period}`;
  };

  // Inisialisasi atau Update playerData dari Battle / Karakter Awal
  useEffect(() => {
    const dataFromBattle = location.state?.updatedPlayerDataFromBattle;
    const battleOutcome = location.state?.battleOutcome;
    let newPlayerDataToSet;
    let shouldUpdateStateAndTimers = false;

    if (dataFromBattle) {
      console.log(
        "GamePage: Menerima data dari BattleZonePage:",
        JSON.parse(JSON.stringify(dataFromBattle)),
        "Outcome:",
        battleOutcome
      );
      newPlayerDataToSet = { ...dataFromBattle };
      if (battleOutcome === "lose_player_defeated") {
        newPlayerDataToSet.currentHealth =
          typeof dataFromBattle.currentHealth === "number"
            ? dataFromBattle.currentHealth
            : 0;
        if (newPlayerDataToSet.currentHealth < 0) {
          newPlayerDataToSet.currentHealth = 0;
        }
      }
      newPlayerDataToSet.inventory = Array.isArray(newPlayerDataToSet.inventory)
        ? newPlayerDataToSet.inventory
        : [];
      newPlayerDataToSet.money =
        typeof newPlayerDataToSet.money === "number"
          ? newPlayerDataToSet.money
          : 0;
      newPlayerDataToSet.damageBonus =
        typeof newPlayerDataToSet.damageBonus === "number"
          ? newPlayerDataToSet.damageBonus
          : 0;
      newPlayerDataToSet.baseDamage =
        typeof newPlayerDataToSet.baseDamage === "number"
          ? newPlayerDataToSet.baseDamage
          : CHARACTER_BASE_DAMAGE_FALLBACK;
      newPlayerDataToSet.currentHunger =
        typeof newPlayerDataToSet.currentHunger === "number"
          ? newPlayerDataToSet.currentHunger
          : 100;
      newPlayerDataToSet.currentThirst =
        typeof newPlayerDataToSet.currentThirst === "number"
          ? newPlayerDataToSet.currentThirst
          : 100;
      newPlayerDataToSet.currentEnergy =
        typeof newPlayerDataToSet.currentEnergy === "number"
          ? newPlayerDataToSet.currentEnergy
          : 100;
      newPlayerDataToSet.maxHunger =
        typeof newPlayerDataToSet.maxHunger === "number"
          ? newPlayerDataToSet.maxHunger
          : 100;
      newPlayerDataToSet.maxThirst =
        typeof newPlayerDataToSet.maxThirst === "number"
          ? newPlayerDataToSet.maxThirst
          : 100;
      newPlayerDataToSet.maxEnergy =
        typeof newPlayerDataToSet.maxEnergy === "number"
          ? newPlayerDataToSet.maxEnergy
          : 100;
      newPlayerDataToSet.currentHealth =
        typeof newPlayerDataToSet.currentHealth === "number"
          ? newPlayerDataToSet.currentHealth
          : 100;
      newPlayerDataToSet.maxHealth =
        typeof newPlayerDataToSet.maxHealth === "number"
          ? newPlayerDataToSet.maxHealth
          : 100;
      shouldUpdateStateAndTimers = true;
    } else if (character && !playerData) {
      console.log(
        "GamePage: Inisialisasi AWAL dari 'character':",
        JSON.parse(JSON.stringify(character))
      );
      const savedMoney = localStorage.getItem("playerMoney");
      const initialMoney =
        savedMoney !== null ? parseInt(savedMoney, 10) : character.money || 0;
      newPlayerDataToSet = {
        nickname: character.nickname || "",
        name: character.name || "",
        img: character.img || "",
        currentHealth: character.health || 100,
        maxHealth: character.maxHealth || character.health || 100,
        currentHunger: character.hunger || 100,
        maxHunger: character.maxHunger || character.hunger || 100,
        currentThirst: character.thirst || 100,
        maxThirst: character.maxThirst || character.thirst || 100,
        currentEnergy: character.energy || 100,
        maxEnergy: character.maxEnergy || character.energy || 100,
        money: initialMoney,
        inventory: Array.isArray(character.inventory)
          ? character.inventory
          : [],
        baseDamage: character.baseDamage || CHARACTER_BASE_DAMAGE_FALLBACK,
        damageBonus: character.damageBonus || 0,
      };
      if (
        localStorage.getItem("playerMoney") === null ||
        parseInt(localStorage.getItem("playerMoney"), 10) !== initialMoney
      ) {
        localStorage.setItem("playerMoney", initialMoney.toString());
      }
      const lsMoney = localStorage.getItem("playerMoney");
      if (lsMoney !== null && newPlayerDataToSet.money === undefined) {
        newPlayerDataToSet.money = parseInt(lsMoney, 10);
      }
      shouldUpdateStateAndTimers = true;
    }

    if (shouldUpdateStateAndTimers && newPlayerDataToSet) {
      setPlayerData(newPlayerDataToSet);
      if (!dataFromBattle && character) {
        playerPositionRef.current = {
          x: 400 - characterDisplaySize / 2,
          y: 300 - characterDisplaySize / 2,
        };
      }
      setIsGameOver(false);
      lastFrameTimeRef.current = performance.now();
      timeAccumulatorPassiveDecay.current = 0;
      timeAccumulatorCriticalDecay.current = 0;
      console.log(
        "GamePage: PlayerData updated/initialized, timers & flags reset."
      );
    }
    if (dataFromBattle) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [character, location.state, navigate]);

  useEffect(() => {
    /* Game Time Update */ 
    const interval = setInterval(() => {
      if (isInteracting || isGameOver) return;
      setGameTime((prev) => {
        let newMinutes = prev.minutes + 1 * speedMultiplier;
        let newHours = prev.hours;
        let newDay = prev.day;
        if (newMinutes >= 60) {
          newMinutes -= 60;
          newHours += 1;
        }
        if (newHours >= 24) {
          newHours -= 24;
          newDay += 1;
        }
        return { hours: newHours, minutes: newMinutes, day: newDay };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isInteracting, isGameOver, speedMultiplier]);

  useEffect(() => {
    /* Passive Stats Decay */ 
    if (!playerData || isInteracting || isGameOver) {
      return;
    }
    const decayIntervalId = setInterval(() => {
      setPlayerData((prevData) => {
        if (!prevData) return null;
        let newCurrentHealth = prevData.currentHealth;
        let newCurrentHunger = prevData.currentHunger;
        let newCurrentThirst = prevData.currentThirst;
        let hasChanged = false;
        timeAccumulatorPassiveDecay.current += 1;
        if (timeAccumulatorPassiveDecay.current >= 1.0 / speedMultiplier) {
          const calculatedNewHunger = Math.max(
            0,
            prevData.currentHunger - HUNGER_DECAY_PER_SECOND
          );
          const calculatedNewThirst = Math.max(
            0,
            prevData.currentThirst - THIRST_DECAY_PER_SECOND
          );
          if (calculatedNewHunger !== prevData.currentHunger) {
            newCurrentHunger = calculatedNewHunger;
            hasChanged = true;
          }
          if (calculatedNewThirst !== prevData.currentThirst) {
            newCurrentThirst = calculatedNewThirst;
            hasChanged = true;
          }
          timeAccumulatorPassiveDecay.current = 0;
        }
        if (newCurrentHunger <= 0 || newCurrentThirst <= 0) {
          timeAccumulatorCriticalDecay.current += 1;
          if (timeAccumulatorCriticalDecay.current >= 1.0 / speedMultiplier) {
            const calculatedNewHealth = Math.max(
              0,
              newCurrentHealth - HEALTH_DECAY_PER_SECOND_CRITICAL
            );
            if (calculatedNewHealth !== newCurrentHealth) {
              newCurrentHealth = calculatedNewHealth;
              hasChanged = true;
            }
            timeAccumulatorCriticalDecay.current = 0;
          }
        } else {
          timeAccumulatorCriticalDecay.current = 0;
        }
        return hasChanged
          ? {
              ...prevData,
              currentHealth: newCurrentHealth,
              currentHunger: newCurrentHunger,
              currentThirst: newCurrentThirst,
            }
          : prevData;
      });
    }, 1000);
    return () => {
      clearInterval(decayIntervalId);
    };
  }, [playerData, isInteracting, isGameOver, speedMultiplier]);

  useEffect(() => {
    /* Game Over Check */ 
    if (
      playerData &&
      playerData.currentHealth <= 0 &&
      !isGameOver
    ) {
      setIsGameOver(true);
    }
  }, [playerData, isGameOver]);

  useEffect(() => {
    /* Asset Loading: Background & Character Image */ 
    bgImageRef.current.onload =
      () => setAssetsLoaded((prev) => ({ ...prev, bg: true }));
    bgImageRef.current.onerror = () =>
      console.error("Gagal memuat gambar latar:", adventureBgURL);
    bgImageRef.current.src = adventureBgURL;
    if (playerData?.img) {
      characterImageRef.current.onload = () =>
        setAssetsLoaded((prev) => ({ ...prev, character: true }));
      characterImageRef.current.onerror = () =>
        console.error("Gagal memuat gambar karakter:", playerData.img);
      characterImageRef.current.src = playerData.img;
    } else if (
      character ||
      location.state?.updatedPlayerDataFromBattle ||
      playerData
    ) {
      setAssetsLoaded((prev) => ({ ...prev, character: true }));
    }
  }, [playerData, character, location.state]);

  useEffect(() => {
    /* Asset Loading: Interactable Point Images */ 
    const images = {};
    let loadedCount = 0;
    const totalToLoad = interactablePointsDefinition.length;
    if (totalToLoad === 0) {
      setAssetsLoaded((prev) => ({ ...prev, interactables: true }));
      return;
    }
    interactablePointsDefinition.forEach((point) => {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        images[point.id] = { instance: img, loaded: true, ...point };
        if (loadedCount === totalToLoad) {
          setInteractablePointImages(images);
          setAssetsLoaded((prev) => ({ ...prev, interactables: true }));
        }
      };
      img.onerror = () => {
        loadedCount++;
        console.error(`Gagal memuat gambar: ${point.name} (${point.imgPath})`);
        images[point.id] = { instance: null, loaded: false, ...point };
        if (loadedCount === totalToLoad) {
          setInteractablePointImages(images);
          setAssetsLoaded((prev) => ({ ...prev, interactables: true }));
        }
      };
      img.src = point.imgPath;
    });
  }, []);

  useEffect(() => {
    /* Keyboard Event Listeners */ 
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (isGameOver && key === "e") {
        onQuit();
        return;
      }
      if (isInteracting && key === "e") {
        closeInteractionDialog();
        return;
      }
      if (isInteracting || isGameOver) return;
      setKeysPressed((prevKeys) => ({ ...prevKeys, [key]: true }));
    };
    const handleKeyUp = (e) => {
      setKeysPressed((prevKeys) => {
        const newKeys = { ...prevKeys };
        delete newKeys[e.key.toLowerCase()];
        return newKeys;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isInteracting, isGameOver, onQuit]);

  const getCharacterRenderDimensions = (imgInstance, displaySize) => {
    if (
      !imgInstance ||
      !imgInstance.complete ||
      !imgInstance.naturalWidth ||
      !imgInstance.naturalHeight
    ) {
      return { width: displaySize, height: displaySize };
    }
    const aspectRatio = imgInstance.naturalWidth / imgInstance.naturalHeight;
    let renderWidth = displaySize;
    let renderHeight = displaySize;
    if (aspectRatio > 1) renderHeight = displaySize / aspectRatio;
    else renderWidth = displaySize * aspectRatio;
    renderWidth = Number.isFinite(renderWidth)
      ? Math.max(1, renderWidth)
      : displaySize;
    renderHeight = Number.isFinite(renderHeight)
      ? Math.max(1, renderHeight)
      : displaySize;
    return { width: renderWidth, height: renderHeight };
  };

  const closeInteractionDialog = () => {
    setInteractionMessage("");
    setIsInteracting(false);
    setShowShopMenu(false);
    setShowFoodMenu(false);
  };

  const buyItemFromWeaponShop = useCallback((item) => {
    setPlayerData((prev) => {
      if (!prev || typeof prev.money !== "number") {
        setInteractionMessage("Data pemain belum siap.");
        return prev;
      }
      if (prev.money < item.price) {
        setInteractionMessage("Uang tidak cukup!");
        return prev;
      }
      // Play blacksmith sound immediately
      blacksmithAudioRef.current.currentTime = 0;
      blacksmithAudioRef.current.play().catch((e) => console.error("Error playing blacksmith sound:", e));
      
      const newMoney = prev.money - item.price;
      localStorage.setItem("playerMoney", newMoney.toString());
      const newInventory = [...prev.inventory];
      const existingItemIndex = newInventory.findIndex((i) => i.id === item.id);
      if (existingItemIndex > -1) {
        newInventory[existingItemIndex] = {
          ...newInventory[existingItemIndex],
          quantity: newInventory[existingItemIndex].quantity + 1,
        };
      } else {
        newInventory.push({ ...item, quantity: 1 });
      }
      let newDamageBonus = prev.damageBonus;
      let newMaxHealth = prev.maxHealth;
      let newCurrentHealth = prev.currentHealth;
      let newMaxEnergy = prev.maxEnergy;
      let newCurrentEnergy = prev.currentEnergy;
      if (item.type === "weapon") newDamageBonus += item.damageBonus;
      else if (item.type === "elixir") {
        if (item.healthBonus) {
          newMaxHealth += item.healthBonus;
          newCurrentHealth = Math.min(
            newMaxHealth,
            prev.currentHealth + item.healthBonus
          );
        }
        if (item.energyBonus) {
          newMaxEnergy += item.energyBonus;
          newCurrentEnergy = Math.min(
            newMaxEnergy,
            prev.currentEnergy + item.energyBonus
          );
        }
      } else if (item.type === "elixir_max_health") {
        newMaxHealth += item.maxHealthBonus;
        newCurrentHealth = Math.min(
          newMaxHealth,
          prev.currentHealth + item.maxHealthBonus
        );
      }
      setInteractionMessage(`Berhasil membeli ${item.name}!`);
      return {
        ...prev,
        money: newMoney,
        inventory: newInventory,
        damageBonus: newDamageBonus,
        maxHealth: newMaxHealth,
        currentHealth: newCurrentHealth,
        maxEnergy: newMaxEnergy,
        currentEnergy: newCurrentEnergy,
      };
    });
  }, []);

  const buyItemFromFoodStall = useCallback((item) => {
    setPlayerData((prev) => {
      if (!prev || typeof prev.money !== "number") {
        setInteractionMessage("Data pemain belum siap.");
        return prev;
      }
      if (prev.money < item.price) {
        setInteractionMessage("Uang tidak cukup!");
        return prev;
      }
      // Play makan sound immediately
      makanAudioRef.current.currentTime = 0;
      makanAudioRef.current.play().catch((e) => console.error("Error playing makan sound:", e));
      
      const newMoney = prev.money - item.price;
      localStorage.setItem("playerMoney", newMoney.toString());
      let newCurrentHunger = prev.currentHunger;
      let newCurrentThirst = prev.currentThirst;
      let newMaxHunger = prev.maxHunger;
      let newMaxThirst = prev.maxThirst;
      if (item.type === "food")
        newCurrentHunger = Math.min(
          prev.maxHunger,
          prev.currentHunger + item.hungerBonus
        );
      else if (item.type === "drink")
        newCurrentThirst = Math.min(
          prev.maxThirst,
          prev.currentThirst + item.thirstBonus
        );
      else if (item.type === "food_drink") {
        newCurrentHunger = Math.min(
          prev.maxHunger,
          prev.currentHunger + item.hungerBonus
        );
        newCurrentThirst = Math.min(
          prev.maxThirst,
          prev.currentThirst + item.thirstBonus
        );
      } else if (item.type === "elixir_hunger") {
        newMaxHunger += item.maxHungerBonus;
        newCurrentHunger = Math.min(
          newMaxHunger,
          newCurrentHunger + item.maxHungerBonus
        );
      } else if (item.type === "elixir_thirst") {
        newMaxThirst += item.maxThirstBonus;
        newCurrentThirst = Math.min(
          newMaxThirst,
          newCurrentThirst + item.maxThirstBonus
        );
      }
      setInteractionMessage(`Berhasil membeli ${item.name}!`);
      return {
        ...prev,
        money: newMoney,
        currentHunger: newCurrentHunger,
        currentThirst: newCurrentThirst,
        maxHunger: newMaxHunger,
        maxThirst: newMaxThirst,
      };
    });
  }, []);

  const healAtClinic = useCallback(() => {
    setPlayerData((prev) => {
      if (!prev || typeof prev.maxHealth !== "number") {
        setInteractionMessage("Data pemain belum siap.");
        return prev;
      }
      setInteractionMessage("Health Anda telah dipulihkan sepenuhnya!");
      return { ...prev, currentHealth: prev.maxHealth };
    });
  }, []);

  const restAtRestArea = useCallback(() => {
    setPlayerData((prev) => {
      if (!prev || typeof prev.maxEnergy !== "number") {
        setInteractionMessage("Data pemain belum siap.");
        return prev;
      }
      setGameTime((currentTime) => {
        let newHours = currentTime.hours + 8;
        let newDay = currentTime.day;
        if (newHours >= 24) {
          newHours -= 24;
          newDay += 1;
        }
        return { ...currentTime, hours: newHours, day: newDay };
      });
      setInteractionMessage("Energy Anda telah dipulihkan! Waktu maju 8 jam.");
      return { ...prev, currentEnergy: prev.maxEnergy };
    });
  }, []);

  useEffect(() => {
    /* Interaction Handling (E key) */ 
    if (
      keysPressed["e"] &&
      nearbyInteractable &&
      !isInteracting &&
      !isGameOver
    ) {
      const { type, message } = nearbyInteractable;
      if (type === "battle") {
        if (!playerData) {
          console.error("GamePage: playerData belum siap untuk battle.");
          setInteractionMessage("Data pemain belum dimuat.");
          return;
        }
        const {
          nickname,
          name,
          img,
          maxHealth,
          currentHealth,
          money,
          baseDamage,
          damageBonus,
          maxHunger,
          currentHunger,
          maxThirst,
          currentThirst,
          maxEnergy,
          currentEnergy,
          inventory,
        } = playerData;
        const fieldsToValidate = {
          nickname,
          name,
          img,
          maxHealth,
          currentHealth,
          money,
          baseDamage,
          damageBonus,
          maxHunger,
          currentHunger,
          maxThirst,
          currentThirst,
          maxEnergy,
          currentEnergy,
          inventory,
        };
        for (const key in fieldsToValidate) {
          const value = fieldsToValidate[key];
          if (
            value === undefined ||
            (typeof value === "string" && value === "")
          ) {
            if (key === "inventory" && Array.isArray(value)) continue;
            console.error(
              `GamePage: GAGAL mengirim ke BattleZone. Stat '${key}' dari playerData tidak valid. Value:`,
              value
            );
            setInteractionMessage(`Data pemain (stat: ${key}) belum siap.`);
            return;
          }
        }
        const dataForBattle = {
          ...playerData,
          damage: (playerData.baseDamage || 0) + (playerData.damageBonus || 0),
        };
        console.log(
          "GamePage: MENGIRIM player data ke BattleZonePage (struktur terpusat):",
          JSON.parse(JSON.stringify(dataForBattle))
        );
        navigate("/battle", { state: { playerData: dataForBattle } });
        setIsInteracting(false);
        setShowInteractionPrompt(false);
        setNearbyInteractable(null);
      } else if (type === "shop_weapon") {
        setInteractionMessage("");
        setShowShopMenu(true);
        setIsInteracting(true);
      } else if (type === "shop_food") {
        setInteractionMessage("");
        setShowFoodMenu(true);
        setIsInteracting(true);
      } else if (type === "heal") {
        // Play healing sound immediately
        healingAudioRef.current.currentTime = 0;
        healingAudioRef.current.play().catch((e) => console.error("Error playing healing sound:", e));
        setInteractionMessage(message);
        setIsInteracting(true);
        healAtClinic();
      } else if (type === "rest") {
        // Play snoring sound immediately
        snoringAudioRef.current.currentTime = 0;
        snoringAudioRef.current.play().catch((e) => console.error("Error playing snoring sound:", e));
        setInteractionMessage(message);
        setIsInteracting(true);
        restAtRestArea();
      } else {
        setInteractionMessage(message || "Interaksi tidak dikenal.");
        setIsInteracting(true);
      }
      setKeysPressed((keys) => ({ ...keys, e: false }));
    }
  }, [
    keysPressed,
    nearbyInteractable,
    isInteracting,
    isGameOver,
    navigate,
    playerData,
    healAtClinic,
    restAtRestArea,
  ]);

  // --- PERBAIKAN GAME LOOP UTAMA ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (
      !playerData ||
      !assetsLoaded.bg ||
      !assetsLoaded.character ||
      !assetsLoaded.interactables
    ) {
      return;
    }
    const {
      currentEnergy: playerCurrentEnergy,
      img: playerImgData,
      nickname: playerNicknameData,
    } = playerData;
    if (
      typeof playerCurrentEnergy !== "number" ||
      typeof playerData.currentHealth !== "number"
    ) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Gagal mendapatkan 2D context.");
      return;
    }
    let animationFrameId;
    lastFrameTimeRef.current = performance.now();

    const updateCanvasSize = () => {
      if (canvasRef.current) {
        canvasRef.current.width = 800;
        canvasRef.current.height = 600;
      }
    };
    updateCanvasSize();
    const drawInteractablePoints = () => {
      Object.values(interactablePointImages).forEach((pointAsset) => {
        if (pointAsset.instance && pointAsset.loaded) {
          const drawX = pointAsset.x - pointAsset.imgWidth / 2;
          const drawY = pointAsset.y - pointAsset.imgHeight / 2;
          ctx.drawImage(
            pointAsset.instance,
            drawX,
            drawY,
            pointAsset.imgWidth,
            pointAsset.imgHeight
          );
          ctx.font = "bold 13px Arial";
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.fillText(
            pointAsset.name,
            pointAsset.x,
            pointAsset.y + pointAsset.imgHeight / 2 + 15
          );
          if (
            nearbyInteractable &&
            nearbyInteractable.id === pointAsset.id &&
            !isGameOver &&
            !isInteracting
          ) {
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2;
            ctx.strokeRect(
              drawX - 2,
              drawY - 2,
              pointAsset.imgWidth + 4,
              pointAsset.imgHeight + 4
            );
          }
        }
      });
    };
    const drawInteractionPrompt = () => {
      if (
        showInteractionPrompt &&
        nearbyInteractable &&
        !isInteracting &&
        !isGameOver
      ) {
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        const promptText = nearbyInteractable.message.includes("Tekan E")
          ? nearbyInteractable.message
          : `Tekan E: ${nearbyInteractable.name}`;
        const textMetrics = ctx.measureText(promptText);
        const textWidth = textMetrics.width;
        const textHeightActual =
          textMetrics.actualBoundingBoxAscent +
            textMetrics.actualBoundingBoxDescent || 16;
        const charDims = getCharacterRenderDimensions(
          characterImageRef.current,
          characterDisplaySize
        );
        const charActualWidth = playerImgData
          ? charDims.width
          : characterDisplaySize;
        const promptBoxWidth = textWidth + 10;
        const promptBoxHeight = textHeightActual + 10;
        const promptBoxX =
          playerPositionRef.current.x +
          charActualWidth / 2 -
          promptBoxWidth / 2;
        const promptBoxY = playerPositionRef.current.y - promptBoxHeight - 5;
        ctx.fillRect(promptBoxX, promptBoxY, promptBoxWidth, promptBoxHeight);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(
          promptText,
          promptBoxX + promptBoxWidth / 2,
          promptBoxY + promptBoxHeight / 2
        );
      }
    };
    const draw = () => {
      if (!canvasRef.current) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      if (assetsLoaded.bg && bgImageRef.current.complete) {
        ctx.drawImage(
          bgImageRef.current,
          0,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
      }
      drawInteractablePoints();
      if (assetsLoaded.character && playerData) {
        if (playerImgData && characterImageRef.current.complete) {
          const { width: renderWidth, height: renderHeight } =
            getCharacterRenderDimensions(
              characterImageRef.current,
              characterDisplaySize
            );
          if (renderWidth > 0 && renderHeight > 0) {
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(
              characterImageRef.current,
              playerPositionRef.current.x,
              playerPositionRef.current.y,
              renderWidth,
              renderHeight
            );
          }
        } else if (!playerImgData) {
          ctx.fillStyle = "grey";
          ctx.fillRect(
            playerPositionRef.current.x,
            playerPositionRef.current.y,
            characterDisplaySize,
            characterDisplaySize
          );
          ctx.fillStyle = "white";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const charInitial = (playerNicknameData || "P")
            .charAt(0)
            .toUpperCase();
          ctx.fillText(
            charInitial,
            playerPositionRef.current.x + characterDisplaySize / 2,
            playerPositionRef.current.y + characterDisplaySize / 2
          );
        }
      }
      drawInteractionPrompt();
    };
    const checkProximityToInteractables = () => {
      if (!playerData) return;
      const charDims = getCharacterRenderDimensions(
        characterImageRef.current,
        characterDisplaySize
      );
      const playerActualWidth = playerImgData
        ? charDims.width
        : characterDisplaySize;
      const playerActualHeight = playerImgData
        ? charDims.height
        : characterDisplaySize;
      const playerCenterX = playerPositionRef.current.x + playerActualWidth / 2;
      const playerCenterY =
        playerPositionRef.current.y + playerActualHeight / 2;
      let foundInteractable = null;
      for (const point of Object.values(interactablePointImages)) {
        if (!point.loaded) continue;
        const distance = Math.sqrt(
          Math.pow(playerCenterX - point.x, 2) +
            Math.pow(playerCenterY - point.y, 2)
        );
        if (
          distance <
          point.detectionRadius +
            Math.min(playerActualWidth, playerActualHeight) / 2
        ) {
          foundInteractable = point;
          break;
        }
      }
      if (nearbyInteractable?.id !== foundInteractable?.id) {
        setNearbyInteractable(foundInteractable);
      }
      setShowInteractionPrompt(!!foundInteractable);
    };

    const updatePosition = (deltaTime) => {
      if (!playerData || isInteracting || isGameOver || !canvasRef.current)
        return;
      const { width: charRenderWidth, height: charRenderHeight } =
        getCharacterRenderDimensions(
          characterImageRef.current,
          characterDisplaySize
        );
      if (
        (playerData.img && (charRenderWidth <= 0 || charRenderHeight <= 0)) ||
        (!playerData.img && characterDisplaySize <= 0)
      )
        return;

      let newX = playerPositionRef.current.x;
      let newY = playerPositionRef.current.y;
      let moved = false;

      const currentEffectiveSpeedPPS =
        playerData.currentEnergy <= 0
          ? SLOWED_SPEED_PIXELS_PER_SECOND * speedMultiplier
          : NORMAL_SPEED_PIXELS_PER_SECOND * speedMultiplier;
      const moveAmount = currentEffectiveSpeedPPS * deltaTime;

      if (keysPressed["arrowup"] || keysPressed["w"] || joystickPressed.up) {
        newY -= moveAmount;
        moved = true;
      }
      if (
        keysPressed["arrowdown"] ||
        keysPressed["s"] ||
        joystickPressed.down
      ) {
        newY += moveAmount;
        moved = true;
      }
      if (
        keysPressed["arrowleft"] ||
        keysPressed["a"] ||
        joystickPressed.left
      ) {
        newX -= moveAmount;
        moved = true;
      }
      if (
        keysPressed["arrowright"] ||
        keysPressed["d"] ||
        joystickPressed.right
      ) {
        newX += moveAmount;
        moved = true;
      }

      if (moved && playerData.currentEnergy > 0) {
        setPlayerData((prev) => {
          if (!prev) return null;
          const energyDecayAmount =
            ENERGY_DECAY_ON_MOVE_PER_SECOND * deltaTime * speedMultiplier;
          const newEnergy = Math.max(0, prev.currentEnergy - energyDecayAmount);
          return newEnergy !== prev.currentEnergy
            ? { ...prev, currentEnergy: newEnergy }
            : prev;
        });
      }
      const boundaryWidth = playerData.img
        ? charRenderWidth
        : characterDisplaySize;
      const boundaryHeight = playerData.img
        ? charRenderHeight
        : characterDisplaySize;
      playerPositionRef.current.x = Math.max(
        0,
        Math.min(newX, canvasRef.current.width - boundaryWidth)
      );
      playerPositionRef.current.y = Math.max(
        0,
        Math.min(newY, canvasRef.current.height - boundaryHeight)
      );
    };

    const gameLoop = (currentTime) => {
      if (!canvasRef.current) return;
      const now = currentTime || performance.now();
      const deltaTime = (now - lastFrameTimeRef.current) / 1000;
      lastFrameTimeRef.current = now;
      const clampedDeltaTime = Math.min(deltaTime, 0.1);

      if (!isGameOver && !isInteracting) {
        updatePosition(clampedDeltaTime);
        checkProximityToInteractables();
      }
      draw();
      animationFrameId = requestAnimationFrame(gameLoop);
    };
    animationFrameId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    assetsLoaded,
    keysPressed,
    joystickPressed,
    isInteracting,
    nearbyInteractable,
    interactablePointImages,
    characterDisplaySize,
    isGameOver,
    playerData,
    speedMultiplier,
  ]);

  const handleJoystickInteraction = (direction, isPressed) => {
    if (isInteracting || isGameOver) return;
    setJoystickPressed((prev) => ({ ...prev, [direction]: isPressed }));
  };
  const handleSpeedChange = (multiplier) => {
    setSpeedMultiplier(multiplier);
  };

  if (
    !playerData ||
    !assetsLoaded.bg ||
    !assetsLoaded.character ||
    !assetsLoaded.interactables
  ) {
    return (
      <div>
        Loading Game Data... (playerData: {playerData ? "Loaded" : "Pending"},
        assets: BG-{assetsLoaded.bg}, Char-{assetsLoaded.character}, Interact-
        {assetsLoaded.interactables})
      </div>
    );
  }

  // --- JSX untuk render ---
  return (
    <div className="game-container">
      <div className="game-wrapper">
        <div className="status-and-canvas">
          <div className="time-display">
            <span>Time: {formatGameTime()}</span>
          </div>
          <div className="status-bars">
            <div className="status-bar">
              <span>
                Health: {playerData.currentHealth.toFixed(0)}/
                {playerData.maxHealth}
              </span>
              <div className="bar">
                <div
                  className="bar-fill health"
                  style={{
                    width: `${
                      (playerData.currentHealth / playerData.maxHealth) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="status-bar">
              <span>
                Hunger: {playerData.currentHunger.toFixed(0)}/
                {playerData.maxHunger}
              </span>
              <div className="bar">
                <div
                  className="bar-fill hunger"
                  style={{
                    width: `${
                      (playerData.currentHunger / playerData.maxHunger) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="status-bar">
              <span>
                Thirst: {playerData.currentThirst.toFixed(0)}/
                {playerData.maxThirst}
              </span>
              <div className="bar">
                <div
                  className="bar-fill thirst"
                  style={{
                    width: `${
                      (playerData.currentThirst / playerData.maxThirst) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="status-bar">
              <span>
                Energy: {playerData.currentEnergy.toFixed(0)}/
                {playerData.maxEnergy}
              </span>
              <div className="bar">
                <div
                  className="bar-fill energy"
                  style={{
                    width: `${
                      (playerData.currentEnergy / playerData.maxEnergy) * 100
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
          <div className="canvas-container">
            <canvas ref={canvasRef} className="game-canvas" />
          </div>
        </div>
        <div className="character-info">
          <MiniMap playerPosition={playerPositionRef.current} />
          <button
            className="inventory-button"
            onClick={() => setShowInventoryModal(true)}
          >
            Inventory
          </button>
          <h3>Nickname: {playerData.nickname}</h3>
          <div>Character: {playerData.name}</div>
          <div>Money: ${playerData.money || 0}</div>
          <div className="speed-controls">
            <h4>Game Speed: {speedMultiplier}x</h4>
            <button
              onClick={() => handleSpeedChange(1)}
              disabled={speedMultiplier === 1}
            >
              1x
            </button>
            <button
              onClick={() => handleSpeedChange(2)}
              disabled={speedMultiplier === 2}
            >
              2x
            </button>
            <button
              onClick={() => handleSpeedChange(3)}
              disabled={speedMultiplier === 3}
            >
              3x
            </button>
          </div>
        </div>
      </div>
      {!isGameOver && (
        <div className="joystick">
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onMouseDown={() => handleJoystickInteraction("up", true)}
              onMouseUp={() => handleJoystickInteraction("up", false)}
              onMouseLeave={() => handleJoystickInteraction("up", false)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleJoystickInteraction("up", true);
              }}
              onTouchEnd={() => handleJoystickInteraction("up", false)}
            >
              ⬆️
            </button>
          </div>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <button
              onMouseDown={() => handleJoystickInteraction("left", true)}
              onMouseUp={() => handleJoystickInteraction("left", false)}
              onMouseLeave={() => handleJoystickInteraction("left", false)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleJoystickInteraction("left", true);
              }}
              onTouchEnd={() => handleJoystickInteraction("left", false)}
            >
              ⬅️
            </button>
            <button
              onMouseDown={() => handleJoystickInteraction("down", true)}
              onMouseUp={() => handleJoystickInteraction("down", false)}
              onMouseLeave={() => handleJoystickInteraction("down", false)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleJoystickInteraction("down", true);
              }}
              onTouchEnd={() => handleJoystickInteraction("down", false)}
            >
              ⬇️
            </button>
            <button
              onMouseDown={() => handleJoystickInteraction("right", true)}
              onMouseUp={() => handleJoystickInteraction("right", false)}
              onMouseLeave={() => handleJoystickInteraction("right", false)}
              onTouchStart={(e) => {
                e.preventDefault();
                handleJoystickInteraction("right", true);
              }}
              onTouchEnd={() => handleJoystickInteraction("right", false)}
            >
              ➡️
            </button>
          </div>
        </div>
      )}
      {isInteracting &&
        !showShopMenu &&
        !showFoodMenu &&
        interactionMessage &&
        !isGameOver && (
          <div className="interaction-dialog-overlay">
            <div className="interaction-dialog">
              <p>{interactionMessage}</p>
              <button onClick={closeInteractionDialog}>Close (E)</button>
            </div>
          </div>
        )}
      {isInteracting && showShopMenu && !isGameOver && (
        <div className="interaction-dialog-overlay">
          <div className="interaction-dialog shop-menu">
            <h2>Weapon Shop</h2>
            <ul>
              {weaponShopItems.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.name} - ${item.price} ({item.description})
                  </span>
                  <button onClick={() => buyItemFromWeaponShop(item)}>
                    Buy
                  </button>
                </li>
              ))}
            </ul>
            {interactionMessage && (
              <p
                style={{
                  color: interactionMessage.startsWith("Berhasil")
                    ? "green"
                    : "red",
                  marginTop: "10px",
                }}
              >
                {interactionMessage}
              </p>
            )}
            <button onClick={closeInteractionDialog}>Close (E)</button>
          </div>
        </div>
      )}
      {isInteracting && showFoodMenu && !isGameOver && (
        <div className="interaction-dialog-overlay">
          <div className="interaction-dialog shop-menu">
            <h2>Food Stall</h2>
            <ul>
              {foodStallItems.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.name} - ${item.price} ({item.description})
                  </span>
                  <button onClick={() => buyItemFromFoodStall(item)}>
                    Buy
                  </button>
                </li>
              ))}
            </ul>
            {interactionMessage && (
              <p
                style={{
                  color: interactionMessage.startsWith("Berhasil")
                    ? "green"
                    : "red",
                  marginTop: "10px",
                }}
              >
                {interactionMessage}
              </p>
            )}
            <button onClick={closeInteractionDialog}>Close (E)</button>
          </div>
        </div>
      )}
      {showInventoryModal && (
        <div className="inventory-modal-overlay">
          <div className="inventory-modal">
            <h2>Inventory</h2>
            <div className="inventory-section">
              <h3>Weapons</h3>
              {(playerData.inventory || []).filter(
                (item) => item.type === "weapon"
              ).length === 0 ? (
                <p>No weapons.</p>
              ) : (
                <ul>
                  {(playerData.inventory || [])
                    .filter((item) => item.type === "weapon")
                    .map((item) => (
                      <li key={item.id}>
                        {item.name} (x{item.quantity}) - {item.description}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <div className="inventory-section">
              <h3>Elixirs</h3>
              {(playerData.inventory || []).filter(
                (item) =>
                  item.type === "elixir" ||
                  item.type === "elixir_hunger" ||
                  item.type === "elixir_thirst" ||
                  item.type === "elixir_max_health"
              ).length === 0 ? (
                <p>No elixirs.</p>
              ) : (
                <ul>
                  {(playerData.inventory || [])
                    .filter(
                      (item) =>
                        item.type === "elixir" ||
                        item.type === "elixir_hunger" ||
                        item.type === "elixir_thirst" ||
                        item.type === "elixir_max_health"
                    )
                    .map((item) => (
                      <li key={item.id}>
                        {item.name} (x{item.quantity}) - {item.description}
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <button onClick={() => setShowInventoryModal(false)}>Close</button>
          </div>
        </div>
      )}
      {isGameOver && (
        <div className="interaction-dialog-overlay game-over-overlay">
          <div className="interaction-dialog game-over-dialog">
            <h2>GAME OVER</h2>
            <p>Health Anda telah mencapai 0.</p>
            <button onClick={onQuit}>Back to Character Select (E)</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GamePage;