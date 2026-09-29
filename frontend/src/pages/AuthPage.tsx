import { useState } from "react";

import type { User } from "../types";

type AuthStep = "welcome" | "register" | "login" | "gosuslugi";

export default function AuthPage({
  onComplete,
}: {
  onComplete: (user: User) => Promise<void>;
}) {
  const [step, setStep] = useState<AuthStep>("welcome");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finish(user: User) {
    setError("");
    setLoading(true);
    try {
      await onComplete(user);
    } catch {
      setError("Не удалось войти. Проверьте соединение и попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  async function register() {
    if (!firstName.trim() || !lastName.trim()) {
      setError("Укажите имя и фамилию.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Введите корректный номер телефона.");
      return;
    }
    if (!agreed) {
      setError("Подтвердите согласие на обработку данных.");
      return;
    }

    await finish({
      id: Date.now(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role: "resident",
      phone: phone.trim(),
      authProvider: "phone",
    });
  }

  async function login() {
    if (phone.replace(/\D/g, "").length < 10 || code.length < 4) {
      setError("Введите номер телефона и код из 4 цифр.");
      return;
    }

    await finish({
      id: Date.now(),
      first_name: "Анна",
      last_name: "Иванова",
      role: "resident",
      phone: phone.trim(),
      authProvider: "phone",
    });
  }

  return (
    <main className="authShell">
      <div className="authBackdrop authBackdropOne" />
      <div className="authBackdrop authBackdropTwo" />

      <section className="authCard">
        {step !== "welcome" && (
          <button
            className="authBack"
            aria-label="Назад"
            onClick={() => {
              setStep("welcome");
              setError("");
            }}
          >
            ‹
          </button>
        )}

        <div className="authBrand">
          <span>⌂</span>
          <div>
            <b>Мой Дом</b>
            <small>Всё важное — рядом</small>
          </div>
        </div>

        {step === "welcome" && (
          <div className="authWelcome">
            <div className="authIllustration" aria-hidden="true">
              <div className="authBuilding authBuildingBack" />
              <div className="authBuilding authBuildingMain">
                <i /><i /><i /><i /><i /><i />
              </div>
              <span>✓</span>
            </div>

            <div className="authIntro">
              <span className="authEyebrow">Единый кабинет жителя</span>
              <h1>Ваш дом всегда под рукой</h1>
              <p>
                Передавайте показания, следите за заявками и узнавайте новости
                дома в одном приложении.
              </p>
            </div>

            <button className="gosuslugiButton" onClick={() => setStep("gosuslugi")}>
              <span className="gosuslugiMark">г</span>
              <div>
                <b>Войти через Госуслуги</b>
                <small>Быстро и без заполнения анкеты</small>
              </div>
              <strong>›</strong>
            </button>

            <button className="authPrimary" onClick={() => setStep("register")}>
              Создать аккаунт
            </button>
            <button className="authTextButton" onClick={() => setStep("login")}>
              У меня уже есть аккаунт
            </button>

            <p className="authRememberNote">
              🛡 Аккаунт сохранится на этом устройстве
            </p>
          </div>
        )}

        {step === "register" && (
          <div className="authForm">
            <span className="authEyebrow">Регистрация</span>
            <h1>Создайте аккаунт</h1>
            <p>Заполните короткую анкету — это займёт меньше минуты.</p>

            <label>
              Имя
              <input
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Анна"
                autoComplete="given-name"
              />
            </label>
            <label>
              Фамилия
              <input
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Иванова"
                autoComplete="family-name"
              />
            </label>
            <label>
              Номер телефона
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 900 123-45-67"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>

            <label className="authAgreement">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(event) => setAgreed(event.target.checked)}
              />
              <span>
                Согласна с правилами сервиса и обработкой персональных данных
              </span>
            </label>

            {error && <div className="authError">{error}</div>}
            <button className="authPrimary" disabled={loading} onClick={register}>
              {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
            </button>
          </div>
        )}

        {step === "login" && (
          <div className="authForm">
            <span className="authEyebrow">Вход</span>
            <h1>С возвращением</h1>
            <p>Введите телефон и тестовый четырёхзначный код.</p>

            <label>
              Номер телефона
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+7 900 123-45-67"
                inputMode="tel"
                autoComplete="tel"
              />
            </label>
            <label>
              Код подтверждения
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="0000"
                inputMode="numeric"
                autoComplete="one-time-code"
              />
            </label>

            <small className="authHint">Для локального теста подойдёт любой код из 4 цифр.</small>
            {error && <div className="authError">{error}</div>}
            <button className="authPrimary" disabled={loading} onClick={login}>
              {loading ? "Входим…" : "Войти"}
            </button>
          </div>
        )}

        {step === "gosuslugi" && (
          <div className="authForm gosuslugiForm">
            <div className="esiaLogo">
              <span className="esiaRed" />
              <span className="esiaBlue" />
            </div>
            <span className="authEyebrow">ЕСИА</span>
            <h1>Вход через Госуслуги</h1>
            <p>
              Приложение получит только имя и подтверждённый номер телефона.
              Данные документов не запрашиваются.
            </p>

            <div className="gosuslugiInfo">
              <span>🛡️</span>
              <div>
                <b>Защищённая авторизация</b>
                <small>Учебный сценарий без передачи данных на портал</small>
              </div>
            </div>

            {error && <div className="authError">{error}</div>}
            <button
              className="authPrimary gosuslugiContinue"
              disabled={loading}
              onClick={() =>
                finish({
                  id: Date.now(),
                  first_name: "Анна",
                  last_name: "Иванова",
                  role: "resident",
                  phone: "+7 900 123-45-67",
                  authProvider: "gosuslugi",
                })
              }
            >
              {loading ? "Подтверждаем…" : "Продолжить через Госуслуги"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
