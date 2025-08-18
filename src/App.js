// src/App.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import YouTube from "react-youtube";
import animeCards from "./data/animeCards";

/** ------------------------------
 *  Estilos globales y animaciones
 *  ------------------------------ */
const GlobalStyles = () => (
  <style>{`
    @keyframes bounceOnce {
      0% { transform: scale(1); }
      40% { transform: scale(1.06); }
      100% { transform: scale(1); }
    }
    .bounce-once { animation: bounceOnce .35s ease-out; }

    @keyframes shakeOnce {
      0% { transform: translateX(0) }
      25% { transform: translateX(-10px) }
      50% { transform: translateX(10px) }
      100% { transform: translateX(0) }
    }
    .shake-once { animation: shakeOnce .32s ease-in-out; }

    @keyframes floatY {
      0% { transform: translateY(20px); }
      50% { transform: translateY(10px); }
      100% { transform: translateY(20px); }
    }
    .float-logo { animation: floatY 2.2s ease-in-out infinite; }

    .smooth-scroll { scroll-behavior: smooth; }
  `}</style>
);

/** ------------------------------
 *  Ranking (debajo del logo)
 *  ------------------------------ */
function saveScore(name, score, mode) {
  try {
    const prev = JSON.parse(localStorage.getItem("musime_scores") || "[]");
    prev.push({ name, score, mode, ts: Date.now() });
    prev.sort((a, b) => b.score - a.score);
    localStorage.setItem("musime_scores", JSON.stringify(prev.slice(0, 10)));
  } catch (e) {
    console.error("LocalStorage error:", e);
  }
}
function getScores() {
  try {
    return JSON.parse(localStorage.getItem("musime_scores") || "[]");
  } catch {
    return [];
  }
}
function resetScores() {
  localStorage.removeItem("musime_scores");
}

/** ------------------------------
 *  Helpers
 *  ------------------------------ */
const pickTwo = (arr) => [...arr].sort(() => Math.random() - 0.5).slice(0, 2);
const insertCardInTimeline = (timeline, newCard, insertIdx) => {
  const t = [...timeline];
  t.splice(insertIdx, 0, newCard);
  return t;
};

/** ------------------------------
 *  AudioModal “solo audio” con tapa opaca
 *  ------------------------------ */
function AudioModal({ url, onClose, maxTime = 30, onSpendPoints }) {
  const getVideoId = (u) => {
    const re =
      /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]{11}).*/;
    const m = u?.trim().match(re);
    if (m && m[1]) return m[1];
    const maybeId = u?.trim();
    return maybeId && maybeId.length === 11 ? maybeId : null;
  };

  const videoId = getVideoId(url);
  const [sec, setSec] = useState(maxTime);
  const [showCover, setShowCover] = useState(true);   // tapa (logo encima)
  const [hasBegun, setHasBegun] = useState(false);    // botones cuando empieza
  const [err, setErr] = useState("");
  const playerRef = useRef(null);

  useEffect(() => {
    if (sec <= 0) return;
    const t = setTimeout(() => setSec((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearTimeout(t);
  }, [sec]);

  const handleError = (e) => {
    console.error("YouTube load failed:", e);
    setErr("No se pudo cargar el video.");
  };

  const onReady = (ev) => {
    playerRef.current = ev.target;
    try {
      // Intenta reproducir; en móviles puede requerir interacción previa
      ev.target.playVideo();
    } catch {}
  };

  const onStateChange = (ev) => {
    const state = ev.data; // 1 playing, 0 ended
    if (state === 1) setHasBegun(true);
    if (state === 0) {
      // al acabar el clip, destapamos para poder ver el vídeo si lo desea
      setShowCover(false);
    }
  };

  const revealVideo = () => {
    setErr("");
    const ok = onSpendPoints?.(2);
    if (ok) {
      setShowCover(false);
      try {
        playerRef.current?.unMute?.();
      } catch {}
    } else {
      setErr("Necesitas 2 puntos para ver el video.");
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.74)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "18px 20px",
        minWidth: 330, boxShadow: "0 8px 36px #0006", textAlign: "center",
        position: "relative"
      }}>
        <h3 style={{ color: "#8100cf", margin: 0, marginBottom: 8 }}>Escuchando Opening</h3>

        <div style={{ position: "relative", width: 340, height: 200, margin: "0 auto" }}>
          {videoId ? (
            <YouTube
              videoId={videoId}
              opts={{
                host: "https://www.youtube-nocookie.com",
                height: "200",
                width: "340",
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  end: maxTime,
                  modestbranding: 1,
                  rel: 0,
                  playsinline: 1,
                  origin: window.location.origin
                }
              }}
              onReady={onReady}
              onStateChange={onStateChange}
              onError={handleError}
            />
          ) : (
            <div style={{ color: "#b7002b", marginTop: 12 }}>
              No se pudo cargar el video. Revisa la URL:
              <div style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{url}</div>
            </div>
          )}

          {/* TAPA OPACA (siempre por encima del iframe) */}
{showCover && (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: "#000", // negro sólido
      opacity: 1, // sin transparencia
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      borderRadius: 8
    }}
  >
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -20%)",
        zIndex: 11
      }}
    >
      <img
        src="/logo-musime.png"
        alt="logo"
        className="float-logo"
        style={{
          width: 180,
          height: "auto",
          filter: "drop-shadow(0 0 12px #b7002bcc)",
          transform: "translateY(200px)"
        }}
      />
    </div>
  </div>
)}


          {/* BOTONES sobre el reproductor: solo cuando empieza */}
          {hasBegun && (
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 8,
              display: "flex", gap: 10, justifyContent: "center", zIndex: 11
            }}>
              <button
                onClick={onClose}
                style={{
                  background: "#fcbe00", color: "#222", border: "2px solid #222",
                  borderRadius: 16, padding: "6px 10px", cursor: "pointer", fontWeight: "bold"
                }}
              >
                Responder
              </button>
              {showCover && (
                <button
                  onClick={revealVideo}
                  style={{
                    background: "#fff", color: "#b7002b", border: "2px solid #b7002b",
                    borderRadius: 16, padding: "6px 10px", cursor: "pointer", fontWeight: "bold"
                  }}
                >
                  Ver vídeo (-2 pts)
                </button>
              )}
            </div>
          )}
        </div>

        {!!err && <div style={{ color: "#b7002b", marginTop: 8 }}>{err}</div>}

        <div style={{ color: "#19d5ff", fontWeight: "bold", fontSize: 18, margin: "10px 0 4px" }}>
          {sec}s
        </div>
      </div>
    </div>
  );
}

/** ------------------------------
 *  Componentes UI
 *  ------------------------------ */
function Ranking({ scores, onReset }) {
  return (
    <div style={{
      width: "92%", background: "#fff", border: "1.5px solid #b7002b",
      borderRadius: 10, marginTop: 12, padding: "10px 10px 12px",
      boxShadow: "0 2px 12px #b7002b22"
    }}>
      <div style={{ color: "#b7002b", fontWeight: "bold", marginBottom: 8, display: "flex", alignItems: "center" }}>
        🏆 Ranking
        <button
          onClick={onReset}
          title="Borrar todos los registros"
          style={{ marginLeft: 8, cursor: "pointer", background: "none", border: "none" }}
        >
          🗑️
        </button>
      </div>
      {scores.length === 0 && (
        <div style={{ fontSize: 14, color: "#999" }}>Sin registros aún.</div>
      )}
      {scores.slice(0, 5).map((sc, i) => (
        <div key={i} style={{
          display: "flex", justifyContent: "space-between", fontSize: 14,
          borderBottom: "1px dashed #ddd", padding: "3px 0"
        }}>
          <span style={{ color: i === 0 ? "#b7002b" : "#222", fontWeight: i === 0 ? "bold" : "normal" }}>
            #{i + 1} {sc.name} {sc.mode === "yamete" ? "🔥" : ""}
          </span>
          <span>{sc.score} pts</span>
        </div>
      ))}
      <div style={{ fontSize: 12, color: "#b7002b", opacity: 0.67, textAlign: "center", marginTop: 8 }}>
        <b>MUSIME</b> v1.0 – {new Date().getFullYear()}
      </div>
    </div>
  );
}

function GameCard({ card, showHelp, onPlay, bounce, shake, isYamete, hintRevealed, onBuyHint }) {
  // Texto del encabezado según el modo
  const header = isYamete && !hintRevealed
    ? "¡Paga por una pista (-5p)! 😈"
    : card.anime;

  return (
    <div
      className={bounce ? "bounce-once" : shake ? "shake-once" : ""}
      style={{
        background: "#fff", border: "4px solid #b7002b", borderRadius: 18,
        boxShadow: "0 4px 24px #b7002b44, 0 1px 8px #fff17633",
        width: 320, padding: "16px 14px", display: "flex",
        flexDirection: "column", alignItems: "center"
      }}
    >
      <div style={{
        fontWeight: "bold", fontSize: 20, color: isYamete && !hintRevealed ? "#b7002b" : "#b7002b",
        margin: "10px 0 12px", textAlign: "center"
      }}>
        {header}
      </div>

      {isYamete && !hintRevealed && (
        <button
          onClick={onBuyHint}
          style={{
            background: "#fff", color: "#b7002b", border: "2px solid #b7002b",
            borderRadius: 16, padding: "6px 10px", cursor: "pointer", fontWeight: "bold", marginBottom: 10
          }}
        >
          Revelar pista (-5p)
        </button>
      )}

      {showHelp && (
        <>
          <img
            src={card.img}
            alt={card.anime}
            style={{
              width: 140, height: 178, objectFit: "cover",
              borderRadius: 14, boxShadow: "0 3px 12px #b7002b33", marginBottom: 12
            }}
          />
          <div style={{
            width: "100%", background: "#fcbe0018", border: "1.5px solid #19d5ff",
            borderRadius: 10, padding: "8px 10px", fontWeight: "bold", fontSize: 14, color: "#222"
          }}>
            <div><b>Anime:</b> {card.anime}</div>
            <div><b>Canción:</b> {card.song}</div>
            <div><b>Año:</b> {card.year}</div>
          </div>
        </>
      )}

      <button
        onClick={onPlay}
        style={{
          background: "#d70022", color: "#fff", border: "2px solid #d70022",
          borderRadius: 22, fontWeight: "bold", fontSize: 16, padding: "10px 18px",
          marginTop: showHelp ? 14 : 20, cursor: "pointer"
        }}
      >
        ▶️ Escuchar Opening
      </button>
    </div>
  );
}

function Timeline({ timeline, insertIdx, onSlotClick, disabled }) {
  return (
    <div
      className="smooth-scroll"
      style={{
        width: "100%",
        maxWidth: 980,
        margin: "10px auto 0",
        background: "#fff",
        border: "2.5px solid #222",
        borderRadius: 12,
        boxShadow: "0 2px 12px #0002",
        padding: 8,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "flex-start",
        justifyContent: "center",
        gap: 8,
        overflow: "visible"
      }}
    >
      {Array.from({ length: timeline.length + 1 }).map((_, idx) => (
        <React.Fragment key={`slot-${idx}`}>
          {/* SLOT: línea discontinua, sin relleno */}
          <div
            onClick={() => !disabled && onSlotClick(idx)}
            title="Haz click para insertar aquí"
            style={{
              width: 26, height: 85,
              borderRadius: 8,
              cursor: disabled ? "default" : "pointer",
              background: "transparent",
              border: insertIdx === idx ? "2.5px dashed #19d5ff" : "2px dashed #666",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", userSelect: "none"
            }}
          >
            {insertIdx === idx ? "⬇️" : ""}
          </div>

          {/* CARD existente */}
          {idx < timeline.length && (
            <div
              title={`${timeline[idx].anime} • ${timeline[idx].year}`}
              style={{
                minWidth: 96, maxWidth: 110,
                background: "#fff",
                border: "2.5px solid #b7002b",
                borderRadius: 10,
                padding: "8px 8px 10px",
                display: "flex", flexDirection: "column", alignItems: "center",
                boxSizing: "border-box"
              }}
            >
              <img
                src={timeline[idx].img}
                alt={timeline[idx].anime}
                style={{
                  width: 60, height: 72, objectFit: "cover",
                  borderRadius: 8, marginBottom: 6
                }}
              />
              <div style={{
                color: "#b7002b", fontWeight: "bold", fontSize: 13,
                textAlign: "center", lineHeight: 1.15,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden"
              }}>
                {timeline[idx].anime}
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function EndGameModal({ score, onSave, onClose, playerName, setPlayerName }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.50)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 900
    }}>
      <div style={{
        background: "#fff", borderRadius: 14, padding: "18px 22px",
        width: 360, boxShadow: "0 10px 32px #0005", textAlign: "center"
      }}>
        <h2 style={{ color: "#b7002b", margin: 0, marginBottom: 8 }}>¡Fin del juego!</h2>
        <div style={{ marginBottom: 12, fontWeight: "bold" }}>
          Tu puntuación: <span style={{ color: "#b7002b" }}>{score}</span>
        </div>
        <input
          type="text"
          placeholder="Pon tu nombre (opcional)"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={18}
          style={{
            width: "100%", padding: "10px 12px",
            borderRadius: 10, border: "1.5px solid #b7002b", marginBottom: 10
          }}
        />
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onSave}
            style={{
              background: "#fcbe00", color: "#222", border: "2px solid #222",
              borderRadius: 14, padding: "8px 14px", cursor: "pointer", fontWeight: "bold"
            }}
          >
            Publicar en ranking
          </button>
          <button
            onClick={onClose}
            style={{
              background: "#fff", color: "#b7002b", border: "2px solid #b7002b",
              borderRadius: 14, padding: "8px 14px", cursor: "pointer", fontWeight: "bold"
            }}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ResetConfirmModal({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.55)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 800
    }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: 16, textAlign: "center" }}>
        <div style={{ marginBottom: 10, color: "#b7002b", fontWeight: "bold" }}>
          ¿Seguro que quieres borrar el ranking?
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onConfirm}
            style={{
              background: "#b7002b", color: "#fff", border: "2px solid #b7002b",
              borderRadius: 14, padding: "8px 14px", cursor: "pointer", fontWeight: "bold"
            }}
          >
            Borrar
          </button>
          <button
            onClick={onCancel}
            style={{
              background: "#fff", color: "#b7002b", border: "2px solid #b7002b",
              borderRadius: 14, padding: "8px 14px", cursor: "pointer", fontWeight: "bold"
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

/** ------------------------------
 *  Pantalla de inicio (modos)
 *  ------------------------------ */
function StartScreen({ onPickMode }) {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #b7002b 0%, #070000 100%)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24
    }}>
      <img
        src="/logo-musime.png"
        alt="logo musime"
        style={{ width: 420, height: "auto", filter: "drop-shadow(0 0 10px #0008)", marginBottom: 18 }}
      />
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={() => onPickMode("normal")}
          style={{
            background: "#fcbe00", color: "#222", border: "2px solid #222",
            borderRadius: 18, padding: "12px 18px", fontWeight: "bold", cursor: "pointer", minWidth: 180
          }}
        >
          Modo Normal
        </button>
        <button
          onClick={() => onPickMode("yamete")}
          style={{
            background: "#000", color: "#fff", border: "2px solid #fff",
            borderRadius: 18, padding: "12px 18px", fontWeight: "bold", cursor: "pointer", minWidth: 180
          }}
        >
          Yamete Kudasai 🔥
        </button>
      </div>
      <div style={{ color: "#fff", opacity: 0.8, marginTop: 12, textAlign: "center" }}>
        Normal: pistas visibles · Yamete: sin pistas, compra de pista (-5p), ayuda (-10p)
      </div>
    </div>
  );
}

/** ------------------------------
 *  APP
 *  ------------------------------ */
export default function App() {
  // Modo: menu | normal | yamete
  const [gameMode, setGameMode] = useState("menu");
  const isYamete = gameMode === "yamete";

  // Baraja y estado inicial
  const [deck] = useState(() => [...animeCards].sort(() => Math.random() - 0.5));
  const [timeline, setTimeline] = useState(() =>
    pickTwo(animeCards).sort((a, b) => a.year - b.year)
  );
  const [usedIds, setUsedIds] = useState(() => timeline.map((c) => c.id));

  const remaining = useMemo(() => deck.filter((c) => !usedIds.includes(c.id)), [deck, usedIds]);
  const currentCard = remaining[0] || null;

  // Juego
  const [insertIdx, setInsertIdx] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [finished, setFinished] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  // Pistas en Yamete
  const [hintRevealed, setHintRevealed] = useState(false); // revela nombre del anime (no la canción)

  // Puntuación / Reloj
  const [score, setScore] = useState(0);
  const [chrono, setChrono] = useState(15);
  const [timerActive, setTimerActive] = useState(false);
  const chronoRef = useRef(null);

  // Intentos / Ranking
  const [attempt, setAttempt] = useState(0);
  const [scores, setScores] = useState(getScores());
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Guardar puntuación
  const [showSaveScore, setShowSaveScore] = useState(false);
  const [playerName, setPlayerName] = useState("");

  // Efectos visuales carta
  const [shake, setShake] = useState(false);
  const [bounce, setBounce] = useState(false);

  /** Cronómetro */
  useEffect(() => {
    if (timerActive && !showAudioModal && !finished && currentCard) {
      chronoRef.current = setInterval(() => setChrono((c) => (c > 0 ? c - 1 : 0)), 1000);
    } else {
      clearInterval(chronoRef.current);
    }
    return () => clearInterval(chronoRef.current);
  }, [timerActive, showAudioModal, finished, currentCard]);

  /** Reset al cambiar carta o acabar */
  useEffect(() => {
    setChrono(15);
    setAttempt(0);
    setShowHelp(false);
    setInsertIdx(0);
    setFeedback("");
    setTimerActive(!!currentCard && !finished);
    setHintRevealed(false);
  }, [currentCard, finished]);

  /** Tiempo agotado -> fallo */
  useEffect(() => {
    if (chrono === 0 && timerActive && !finished) {
      handleMiss(`⏱️ ¡Tiempo agotado! Intento ${attempt + 1}/3`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chrono]);

  /** Gasto de puntos */
  const spendPoints = (n) => {
    if (score >= n) {
      setScore((s) => s - n);
      return true;
    }
    return false;
  };

  /** Handlers */
  const handlePlay = () => { setShowAudioModal(true); setTimerActive(false); };
  const handleAudioClose = () => { setShowAudioModal(false); setTimerActive(true); };
  const handleHelp = () => {
    if (isYamete) {
      if (spendPoints(10)) setShowHelp((v) => !v);
      else setFeedback("Te faltan puntos para usar la ayuda (-10p).");
    } else {
      setShowHelp((v) => !v);
    }
    setChrono(15);
  };

  const buyHint = () => {
    if (!isYamete || hintRevealed) return;
    if (spendPoints(5)) setHintRevealed(true);
    else setFeedback("Te faltan puntos para comprar la pista (-5p).");
  };

  const endGame = () => {
    setTimerActive(false);
    setFinished(true);
    setTimeout(() => setShowSaveScore(true), 150);
  };

  const handleMiss = (msg) => {
    setShake(true);
    setTimeout(() => setShake(false), 330);
    const next = attempt + 1;
    setAttempt(next);
    setFeedback(msg);
    if (next >= 3) {
      endGame();
    } else {
      setTimerActive(true);
    }
  };

  const handleSlotClick = (idx) => {
    if (finished || showAudioModal) return;
    setInsertIdx(idx);
    setFeedback("");
  };

  const handleCheck = () => {
    if (!currentCard && !finished) {
      endGame();
      return;
    }
    if (!currentCard || insertIdx == null) {
      setFeedback("Elige un hueco en la línea de tiempo.");
      setShake(true);
      setTimeout(() => setShake(false), 330);
      return;
    }

    const test = insertCardInTimeline(timeline, currentCard, insertIdx);
    const years = test.map((c) => c.year);
    const sorted = [...years].sort((a, b) => a - b);
    const ok = years.every((y, i) => y === sorted[i]);

    setTimerActive(false);

    if (ok) {
      setTimeline(test);
      setUsedIds((ids) => [...ids, currentCard.id]);
      const add = attempt === 0 ? 10 : 1;
      setScore((s) => s + add);
      setFeedback(add === 10 ? "¡Correcto! +10 pts" : "¡Correcto! +1 pt");
      setBounce(true);
      setTimeout(() => setBounce(false), 350);

      if (remaining.length <= 1) endGame();
      else setTimeout(() => setFeedback(""), 900);
    } else {
      handleMiss(`¡Error! Intento ${attempt + 1}/3`);
    }
  };

  const handleFinish = () => endGame();

  const handleSaveScore = () => {
    const name = playerName.trim() || "Sin Nombre";
    saveScore(name, score, isYamete ? "yamete" : "normal");
    setScores(getScores());
    setShowSaveScore(false);
  };

  const handleReset = () => window.location.reload();
  const handleConfirmResetRanking = () => {
    resetScores();
    setScores([]); 
    setShowResetConfirm(false);
  };

  /** Pantalla de inicio */
  if (gameMode === "menu") {
    return (
      <>
        <GlobalStyles />
        <StartScreen onPickMode={(m) => setGameMode(m)} />
      </>
    );
  }

  /** Layout principal */
  return (
    <>
      <GlobalStyles />
      <div style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #b7002b 0%, #070000 100%)",
        display: "grid",
        gridTemplateColumns: "420px 1fr",
        gap: 18,
        width: "100vw",
        alignItems: "start"
      }}>
        {/* PANEL IZQUIERDO */}
        <div style={{
          minHeight: "100vh",
          background: "#fff",
          borderRight: "6px solid #b7002b",
          boxShadow: "0 0 32px #b7002b22",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "12px 8px"
        }}>
          <img
            src="/logo-musime.png"
            alt="logo musime"
            style={{
              width: 400, height: "auto",
              marginBottom: 8,
              filter: "drop-shadow(0 0 7px #b7002b66)",
              objectFit: "contain"
            }}
          />
          <button
            onClick={() => setGameMode("menu")}
            style={{
              background: "#fff", color: "#b7002b", border: "2px solid #b7002b",
              borderRadius: 14, padding: "6px 10px", cursor: "pointer", fontWeight: "bold", marginBottom: 8
            }}
          >
            ← Volver al inicio
          </button>
          <Ranking
            scores={scores}
            onReset={() => setShowResetConfirm(true)}
          />
        </div>

        {/* PANEL CENTRAL */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "10px 10px 30px"
        }}>
          {/* Tiempo y puntos */}
          <div style={{
            display: "flex", gap: 12, alignItems: "center",
            justifyContent: "center", margin: "6px 0 2px"
          }}>
            <div style={{
              background: "#fff", color: "#b7002b", borderRadius: 14,
              border: "2px solid #b7002b", fontWeight: "bold", fontSize: 16,
              padding: "8px 14px", textAlign: "center"
            }}>
              ⏱️ {chrono}s
            </div>
            <div style={{
              background: "#fff", color: "#222", borderRadius: 14,
              border: "2.5px solid #222", fontWeight: "bold", fontSize: 20,
              padding: "8px 14px", textAlign: "center", boxShadow: "0 0 18px #b7002b44"
            }}>
              {score} pts
            </div>
          </div>

          {/* Título */}
          <h2 style={{
            color: "#fff", fontSize: 22, margin: "6px 0 10px",
            textShadow: "0 2px 8px #b7002b, 0 2px 14px #fff", textAlign: "center"
          }}>
            {isYamete ? "Yamete Kudasai: ¡adivina solo con la música!" : "Coloca la canción en la línea temporal"}
          </h2>

          {/* Carta + Botones */}
          {!finished && currentCard && (
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(320px, 320px) auto",
              alignItems: "center",
              gap: 18
            }}>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <GameCard
                  card={currentCard}
                  showHelp={showHelp}
                  onPlay={handlePlay}
                  bounce={bounce}
                  shake={shake}
                  isYamete={isYamete}
                  hintRevealed={hintRevealed}
                  onBuyHint={buyHint}
                />
              </div>

              <div style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 12, justifyContent: "center"
              }}>
                <button
                  onClick={handleCheck}
                  disabled={showAudioModal || !currentCard}
                  style={{
                    background: "#fff", color: "#222", border: "2.5px solid #222",
                    borderRadius: 20, fontWeight: "bold", fontSize: 18,
                    padding: "10px 18px", cursor: "pointer", minWidth: 160
                  }}
                >
                  ¡COLOCAR!
                </button>
                <button
                  onClick={handleHelp}
                  disabled={showAudioModal}
                  style={{
                    background: "#fff", color: "#222", border: "2px solid #222",
                    borderRadius: 20, fontWeight: "bold", fontSize: 14,
                    padding: "8px 14px", cursor: "pointer", minWidth: 110
                  }}
                >
                  ¿Ayuda? {isYamete ? "(-10p)" : ""}
                </button>
                <button
                  onClick={handleFinish}
                  disabled={showAudioModal}
                  style={{
                    background: "#000", color: "#fff", border: "2px solid #fff",
                    borderRadius: 20, fontWeight: "bold", fontSize: 16,
                    padding: "10px 18px", cursor: "pointer", minWidth: 160
                  }}
                >
                  Acabar
                </button>
              </div>
            </div>
          )}

          {/* Timeline */}
          <Timeline
            timeline={timeline}
            insertIdx={insertIdx}
            onSlotClick={handleSlotClick}
            disabled={finished || showAudioModal}
          />

          {/* Feedback */}
          <div style={{
            marginTop: 10, fontSize: 16,
            color: feedback.startsWith("¡Correcto!") ? "#19d5ff" : "#ffdddd",
            textShadow: feedback.startsWith("¡Correcto!") ? "0 0 8px #19d5ff99" : "0 0 7px #b7002b88",
            minHeight: 22, textAlign: "center"
          }}>
            {feedback}
          </div>

          {/* Jugar de nuevo */}
          {finished && !showSaveScore && (
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <button
                onClick={handleReset}
                style={{
                  padding: "10px 18px", background: "#fcbe00", color: "#222",
                  borderRadius: 16, fontWeight: "bold", fontSize: 16,
                  border: "2.2px solid #000", boxShadow: "0 2px 12px #b7002b66", cursor: "pointer"
                }}
              >
                JUGAR DE NUEVO
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modales */}
      {showAudioModal && currentCard && (
        <AudioModal
          url={currentCard.youtube}
          maxTime={isYamete ? 20 : 30}
          onClose={handleAudioClose}
          onSpendPoints={spendPoints}
        />
      )}

      {showSaveScore && (
        <EndGameModal
          score={score}
          playerName={playerName}
          setPlayerName={setPlayerName}
          onSave={handleSaveScore}
          onClose={() => setShowSaveScore(false)}
        />
      )}

      {showResetConfirm && (
        <ResetConfirmModal
          onConfirm={handleConfirmResetRanking}
          onCancel={() => setShowResetConfirm(false)}
        />
      )}
    </>
  );
}
