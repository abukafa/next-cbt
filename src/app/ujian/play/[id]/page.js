"use client";

import { useState, useEffect, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";

export default function CBTPlayerPage({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { question_id: "A" }
  const [ragu, setRagu] = useState({}); // { question_id: true }

  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showGridMobile, setShowGridMobile] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);

  // Soft-Lock States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const MAX_VIOLATIONS = 3;

  // Use refs for autosave queue to prevent rapid firing
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    fetchExamData();

    // Offline / Online listeners
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger sync immediately if pending
      if (pendingSyncRef.current) {
        syncDataToServer();
      }
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    // Initial check
    if (!navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [id]);

  // Soft-Lock Effect
  useEffect(() => {
    // 1. Block Context Menu & Shortcuts
    const preventDefault = (e) => e.preventDefault();
    document.addEventListener("contextmenu", preventDefault);

    const handleKeyDown = (e) => {
      if (e.key === "F12") e.preventDefault();
      if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "p")) {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", handleKeyDown);

    // 2. Fullscreen Listener
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    // 3. Tab Visibility & Window Blur Listener (Catch Task View / Alt-Tab)
    const handleVisibilityOrBlur = (e) => {
      // e.type is 'blur' or 'visibilitychange'
      // Ignore if currently showing a native confirm dialog
      if (window.isConfirming) return;

      // Only penalize if they are currently in fullscreen (meaning exam has started)
      if (document.fullscreenElement) {
        if (
          e.type === "blur" ||
          (e.type === "visibilitychange" && document.hidden)
        ) {
          setViolationCount((prev) => {
            const next = prev + 1;
            if (next >= MAX_VIOLATIONS) {
              alert(
                "PELANGGARAN MAKSIMAL! Anda telah keluar dari ujian terlalu sering. Ujian akan diselesaikan secara otomatis.",
              );
              handleAutoSubmit(); // trigger auto submit
            } else {
              alert(
                `\nPERINGATAN! \nAnda terdeteksi keluar dari layar ujian atau membuka tab atau aplikasi lain.\n\nPelanggaran: ${next}/${MAX_VIOLATIONS}\nJika mencapai ${MAX_VIOLATIONS}, ujian akan ditutup otomatis!`,
              );
            }
            return next;
          });
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrBlur);
    window.addEventListener("blur", handleVisibilityOrBlur);

    return () => {
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityOrBlur);
      window.removeEventListener("blur", handleVisibilityOrBlur);
    };
  }, []);

  const pendingSyncRef = useRef(false);
  const answersRef = useRef({}); // keep track of answers for sync

  const syncDataToServer = async () => {
    try {
      await fetch(`/api/ujian/play/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jawaban: answersRef.current }),
      });
      pendingSyncRef.current = false;
      setPendingSync(false);
    } catch (err) {
      console.error("Sync failed, still offline?", err);
      pendingSyncRef.current = true;
      setPendingSync(true);
    }
  };

  const fetchExamData = async () => {
    try {
      const res = await fetch(`/api/ujian/play/${id}`);
      const result = await res.json();

      if (res.ok) {
        if (result.status === "N") {
          router.replace("/ujian/selesai");
          return;
        }

        setData(result.tes);
        setQuestions(result.questions);

        // Merge answers from server and localStorage
        const localKey = `cbt_ans_${id}`;
        const localRaguKey = `cbt_ragu_${id}`;
        let localAns = {};
        let localRagu = {};
        try {
          localAns = JSON.parse(localStorage.getItem(localKey) || "{}");
          localRagu = JSON.parse(localStorage.getItem(localRaguKey) || "{}");
        } catch (e) {}

        const mergedAns = { ...result.jawaban, ...localAns };
        setAnswers(mergedAns);
        answersRef.current = mergedAns;
        setRagu(localRagu);

        // Calculate timer
        const endTime = new Date(result.tes.tgl_selesai).getTime();
        const nowTime = new Date().getTime();
        const diffSeconds = Math.max(0, Math.floor((endTime - nowTime) / 1000));
        setTimeLeft(diffSeconds);
      } else {
        setError(result.error || "Gagal mengambil data ujian");
      }
    } catch (err) {
      setError("Kesalahan koneksi.");
    } finally {
      setLoading(false);
    }
  };

  // Timer Tick
  useEffect(() => {
    if (loading || timeLeft <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, timeLeft, isSubmitting]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionId, optionKey) => {
    const newAnswers = { ...answers, [questionId]: optionKey };
    setAnswers(newAnswers);
    answersRef.current = newAnswers;

    // Save to local storage instantly
    localStorage.setItem(`cbt_ans_${id}`, JSON.stringify(newAnswers));

    // If offline, just mark as pending sync
    if (isOffline) {
      pendingSyncRef.current = true;
      setPendingSync(true);
      return;
    }

    // Debounce save to server
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      syncDataToServer();
    }, 1000);
  };

  const handleToggleRagu = (questionId) => {
    const newRagu = { ...ragu };
    if (newRagu[questionId]) {
      delete newRagu[questionId];
    } else {
      newRagu[questionId] = true;
    }
    setRagu(newRagu);
    localStorage.setItem(`cbt_ragu_${id}`, JSON.stringify(newRagu));
  };

  const handleManualSubmit = () => {
    if (isOffline) {
      alert(
        "Koneksi internet terputus. Silakan tunggu koneksi kembali normal sebelum mengumpulkan ujian.",
      );
      return;
    }

    window.isConfirming = true;
    const confirmed = window.confirm(
      "Apakah Anda yakin ingin menyelesaikan ujian ini? Anda tidak akan bisa kembali.",
    );

    // Give browser time to restore focus before re-enabling penalties
    setTimeout(() => {
      window.isConfirming = false;
    }, 1000);

    if (confirmed) {
      submitExam();
    }
  };

  const handleAutoSubmit = () => {
    alert("Waktu habis! \nJawaban Anda akan dikirim secara otomatis.");
    submitExam();
  };

  const submitExam = async () => {
    if (isOffline) {
      alert("Menunggu koneksi internet...");
      return;
    }

    setIsSubmitting(true);
    try {
      // Force one last save just in case
      await syncDataToServer();

      // Submit
      const res = await fetch(`/api/ujian/play/${id}`, { method: "POST" });
      if (res.ok) {
        localStorage.removeItem(`cbt_ans_${id}`);
        router.replace("/ujian/selesai");
      } else {
        alert("Gagal mengirim ujian. Silakan coba lagi.");
        setIsSubmitting(false);
      }
    } catch (err) {
      alert("Kesalahan koneksi saat mengirim ujian.");
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-emerald-600"></div>
        <p className="text-emerald-600 font-medium">Memuat Soal Ujian...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Terjadi Kesalahan
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/dashboard/jadwal-ujian")}
            className="w-full bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 font-medium"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  // Support for 4 or 5 options via env var
  const jumlahPG = parseInt(process.env.NEXT_PUBLIC_JUMLAH_PG || "4");
  const optionsList =
    jumlahPG >= 5 ? ["A", "B", "C", "D", "E"] : ["A", "B", "C", "D"];

  if (!isFullscreen) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-center text-white select-none">
        <AlertTriangle
          size={64}
          className="text-yellow-500 mb-6 animate-pulse"
        />
        <h2 className="text-3xl font-bold mb-4">Mode Ujian Terkunci</h2>
        <p className="text-gray-300 mb-8 max-w-lg text-lg">
          Ujian ini menggunakan mode layar penuh untuk meminimalisir kecurangan.
          Anda dilarang keluar dari layar penuh, membuka tab/aplikasi lain, atau
          melakukan <i className="text-white font-semibold">copy-paste</i>.
        </p>
        <button
          onClick={() => {
            if (document.documentElement.requestFullscreen) {
              document.documentElement.requestFullscreen().catch((e) => {
                console.warn("Fullscreen failed", e);
                setIsFullscreen(true); // Fallback
              });
            } else {
              setIsFullscreen(true); // Fallback for unsupported browsers (iOS)
            }
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full text-lg shadow-lg transition-transform transform hover:scale-105 flex items-center gap-2"
        >
          <CheckCircle size={24} />
          Mulai / Lanjutkan Ujian
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col select-none">
      {/* OFFLINE BANNER */}
      {isOffline && (
        <div className="bg-red-500 text-white text-center py-2 px-4 font-medium flex items-center justify-center gap-2">
          <AlertTriangle size={18} />
          Koneksi terputus! Jawaban Anda disimpan di perangkat. Jangan tutup
          browser.
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 -ml-2 text-gray-600"
              onClick={() => setShowGridMobile(true)}
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="font-bold text-gray-900 truncate max-w-[200px] sm:max-w-xs">
                {data?.nama_ujian}
              </h1>
              <p className="text-xs text-gray-500">{data?.nama_mapel}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-lg
              ${timeLeft < 300 ? "bg-red-100 text-red-600 animate-pulse" : "bg-blue-50 text-blue-700"}
            `}
            >
              <Clock size={20} />
              <span className="tabular-nums tracking-wider">
                {formatTime(timeLeft)}
              </span>
            </div>

            <button
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="hidden md:flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-full font-medium transition-colors"
            >
              <CheckCircle size={18} />
              Selesai Ujian
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 p-4">
        {/* SOAL AREA */}
        <main className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {/* Soal Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
            <span className="font-bold text-gray-700">
              Soal No. {currentIndex + 1}
            </span>
            <span className="text-sm text-gray-500">
              Dari {questions.length} Soal
            </span>
          </div>

          {/* Soal Body */}
          <div className="p-6 flex-1 overflow-y-auto">
            {currentQ?.file && (
              <div className="mb-6">
                {currentQ.tipe_file?.includes("image") ? (
                  <img
                    src={`/uploads/${currentQ.file}`}
                    alt="Lampiran"
                    className="max-w-full max-h-64 rounded border border-gray-200"
                  />
                ) : currentQ.tipe_file?.includes("audio") ? (
                  <audio
                    controls
                    src={`/uploads/${currentQ.file}`}
                    className="w-full"
                  />
                ) : null}
              </div>
            )}

            <div
              className="prose max-w-none text-gray-800 text-lg mb-8 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentQ?.soal || "" }}
            />

            {/* Options */}
            <div className="space-y-3 mb-8">
              {optionsList.map((opt) => {
                let optContent = currentQ?.[`opsi_${opt.toLowerCase()}`];
                if (!optContent || optContent === "<p><br></p>") return null;

                // Hapus simbol ##### peninggalan aplikasi lama
                optContent = optContent.replace(/^#####/, "");

                const isSelected = answers[currentQ.id] === opt;

                return (
                  <label
                    key={opt}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center h-full pt-1">
                      <input
                        type="radio"
                        name={`q_${currentQ.id}`}
                        className="w-5 h-5 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                        checked={isSelected}
                        onChange={() => handleAnswer(currentQ.id, opt)}
                      />
                    </div>
                    <div className="flex-1 text-gray-800 font-medium pt-0.5 select-none">
                      <div className="flex gap-2">
                        <span className="font-bold">{opt}.</span>
                        <div
                          dangerouslySetInnerHTML={{ __html: optContent }}
                          className="prose-sm max-w-none inline-block m-0 p-0"
                        />
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50 rounded-b-xl flex-wrap gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentIndex === 0
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ChevronLeft size={20} />{" "}
              <span className="hidden sm:inline">Sebelumnya</span>
            </button>

            {/* Ragu-Ragu Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer bg-amber-50 px-4 py-2 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
              <input
                type="checkbox"
                className="w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                checked={!!ragu[currentQ?.id]}
                onChange={() => handleToggleRagu(currentQ?.id)}
              />
              <span className="font-bold text-amber-700">Ragu-ragu</span>
            </label>

            <button
              onClick={() =>
                setCurrentIndex((prev) =>
                  Math.min(questions.length - 1, prev + 1),
                )
              }
              disabled={currentIndex === questions.length - 1}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                currentIndex === questions.length - 1
                  ? "text-gray-400 bg-gray-100 cursor-not-allowed"
                  : "text-white bg-blue-600 hover:bg-blue-700"
              }`}
            >
              <span className="hidden sm:inline">Selanjutnya</span>
              <ChevronRight size={20} />
            </button>
          </div>
        </main>

        {/* RIGHT GRID SIDEBAR */}
        <aside
          className={`
          fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 md:z-0 md:w-80 md:shadow-sm md:rounded-xl md:border md:border-gray-200 flex flex-col
          ${showGridMobile ? "translate-x-0" : "translate-x-full"}
        `}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 md:rounded-t-xl">
            <h3 className="font-bold text-gray-800">Navigasi Soal</h3>
            <button
              className="md:hidden text-gray-500"
              onClick={() => setShowGridMobile(false)}
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isRagu = !!ragu[q.id];
                const isActive = idx === currentIndex;

                let btnColor =
                  "bg-white text-gray-600 border border-gray-300 hover:bg-gray-100"; // Belum
                if (isRagu) {
                  btnColor = "bg-amber-400 text-white border-transparent"; // Ragu-ragu (Prioritas warna)
                } else if (isAnswered) {
                  btnColor = "bg-emerald-500 text-white border-transparent"; // Sudah dijawab
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setShowGridMobile(false);
                    }}
                    className={`
                      aspect-square rounded flex items-center justify-center text-sm font-bold transition-all
                      ${isActive ? "ring-2 ring-offset-2 ring-blue-500" : ""}
                      ${btnColor}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <div className="w-4 h-4 bg-emerald-500 rounded-sm"></div>
                <span>Sudah Dijawab ({Object.keys(answers).length})</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="w-4 h-4 bg-white border border-gray-300 rounded-sm"></div>
                <span>
                  Belum Dijawab (
                  {questions.length - Object.keys(answers).length})
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 md:hidden bg-gray-50">
            <button
              onClick={handleManualSubmit}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-bold transition-colors"
            >
              <CheckCircle size={20} />
              SELESAI UJIAN
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
