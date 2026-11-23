
import { useState } from "react";
import "./Auth.css";

const USERS_KEY = "lumina_users_demo_v1";

function getUsers() {
  try {
    const data = JSON.parse(
      localStorage.getItem(USERS_KEY) || "[]"
    );

    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Password demo di-hash memakai PBKDF2 + salt.
// Ini tidak menggantikan autentikasi backend.
async function hashPassword(password, saltHex) {
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g).map(
      (hex) => parseInt(hex, 16)
    )
  );

  const encoder = new TextEncoder();

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 120000,
      hash: "SHA-256",
    },
    key,
    256
  );

  return bytesToHex(new Uint8Array(bits));
}

export default function AuthPage({
  onSuccess,
  onBack,
}) {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const isRegister = mode === "register";

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");

    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) return;

    setError("");
    setBusy(true);

    try {
      if (!crypto?.subtle) {
        throw new Error(
          "Browser tidak mendukung fitur keamanan yang diperlukan."
        );
      }

      const email = form.email.trim().toLowerCase();
      const password = form.password;
      const users = getUsers();

      if (!email || !password) {
        setError("Isi email dan password.");
        return;
      }

      if (isRegister) {
        const name = form.name.trim();

        if (name.length < 2) {
          setError("Nama minimal 2 karakter.");
          return;
        }

        if (password.length < 8) {
          setError("Password minimal 8 karakter.");
          return;
        }

        if (password !== form.confirmPassword) {
          setError("Konfirmasi password tidak cocok.");
          return;
        }

        if (
          users.some((user) => user.email === email)
        ) {
          setError("Email sudah terdaftar. Silakan login.");
          return;
        }

        const saltBytes = crypto.getRandomValues(
          new Uint8Array(16)
        );

        const salt = bytesToHex(saltBytes);

        const passwordHash = await hashPassword(
          password,
          salt
        );

        const newUser = {
          id: crypto.randomUUID(),
          name,
          email,
          salt,
          passwordHash,
          createdAt: new Date().toISOString(),
          role: "customer",
        };

        localStorage.setItem(
          USERS_KEY,
          JSON.stringify([...users, newUser])
        );

        onSuccess({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: "customer",
        });

        return;
      }

      const user = users.find(
        (item) => item.email === email
      );

      if (!user) {
        setError("Email atau password salah.");
        return;
      }

      const candidateHash = await hashPassword(
        password,
        user.salt
      );

      if (candidateHash !== user.passwordHash) {
        setError("Email atau password salah.");
        return;
      }

      onSuccess({
        id: user.id,
        name: user.name,
        email: user.email,
        role: "customer",
      });
    } catch (err) {
      setError(
        err.message ||
          "Terjadi kesalahan. Silakan coba lagi."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="lum-auth-page">
      <section className="lum-auth-visual">
        <div className="lum-auth-visual-inner">
          <span className="lum-auth-overline">
            LUMINA STORE · MEMBERSHIP
          </span>

          <h1>
            Your Style.
            <br />
            Your Story.
          </h1>

          <p>
            Bergabung dengan LUMINA STORE dan
            temukan pilihan fashion untuk
            setiap momen istimewa.
          </p>

          <div className="lum-auth-visual-bottom">
            <span>✦ Premium Collection</span>
            <span>✦ Modern Lifestyle</span>
            <span>✦ Personal Shopping</span>
          </div>
        </div>
      </section>

      <section className="lum-auth-form-area">
        <div className="lum-auth-card">
          <button
            type="button"
            className="lum-auth-back"
            onClick={onBack}
          >
            ← Kembali ke toko
          </button>

          <p className="lum-auth-eyebrow">
            WELCOME TO LUMINA
          </p>

          <h2>
            {isRegister
              ? "Create an Account"
              : "Welcome Back"}
          </h2>

          <p className="lum-auth-description">
            {isRegister
              ? "Daftar untuk mulai berbelanja di LUMINA."
              : "Masuk untuk melanjutkan pengalaman belanjamu."}
          </p>

          <div className="lum-auth-tabs">
            <button
              type="button"
              className={
                !isRegister ? "active" : ""
              }
              onClick={() => switchMode("login")}
            >
              Login
            </button>

            <button
              type="button"
              className={
                isRegister ? "active" : ""
              }
              onClick={() => switchMode("register")}
            >
              Registrasi
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="lum-auth-form"
          >
            {isRegister && (
              <div className="lum-auth-field">
                <label htmlFor="lum-name">
                  Nama Lengkap
                </label>

                <input
                  id="lum-name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    updateField(
                      "name",
                      e.target.value
                    )
                  }
                />
              </div>
            )}

            <div className="lum-auth-field">
              <label htmlFor="lum-email">
                Email
              </label>

              <input
                id="lum-email"
                type="email"
                placeholder="contoh@email.com"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) =>
                  updateField(
                    "email",
                    e.target.value
                  )
                }
              />
            </div>

            <div className="lum-auth-field">
              <label htmlFor="lum-password">
                Password
              </label>

              <div className="lum-auth-password">
                <input
                  id="lum-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder={
                    isRegister
                      ? "Minimal 8 karakter"
                      : "Masukkan password"
                  }
                  autoComplete={
                    isRegister
                      ? "new-password"
                      : "current-password"
                  }
                  minLength={isRegister ? 8 : undefined}
                  required
                  value={form.password}
                  onChange={(e) =>
                    updateField(
                      "password",
                      e.target.value
                    )
                  }
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((v) => !v)
                  }
                >
                  {showPassword
                    ? "Sembunyikan"
                    : "Lihat"}
                </button>
              </div>
            </div>

            {isRegister && (
              <div className="lum-auth-field">
                <label htmlFor="lum-confirm">
                  Konfirmasi Password
                </label>

                <input
                  id="lum-confirm"
                  type="password"
                  placeholder="Ulangi password"
                  autoComplete="new-password"
                  required
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField(
                      "confirmPassword",
                      e.target.value
                    )
                  }
                />
              </div>
            )}

            {error && (
              <p
                className="lum-auth-error"
                role="alert"
              >
                {error}
              </p>
            )}

            <button
              className="lum-auth-submit"
              type="submit"
              disabled={busy}
            >
              {busy
                ? "Memproses..."
                : isRegister
                  ? "Buat Akun →"
                  : "Masuk ke LUMINA →"}
            </button>
          </form>

          <p className="lum-auth-switch">
            {isRegister
              ? "Sudah punya akun?"
              : "Belum punya akun?"}

            <button
              type="button"
              onClick={() =>
                switchMode(
                  isRegister
                    ? "login"
                    : "register"
                )
              }
            >
              {isRegister
                ? "Login di sini"
                : "Daftar sekarang"}
            </button>
          </p>

          <p className="lum-auth-note">
            Akun ini hanya untuk simulasi
            portofolio. Jangan gunakan password
            yang kamu pakai pada akun penting.
          </p>
        </div>
      </section>
    </main>
  );
}
