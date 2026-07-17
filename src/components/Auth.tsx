import { FormEvent, useState } from 'react';
import { supabase } from '../lib/supabase';

type AuthMode = 'signin' | 'signup';

export function Auth({ onGuest }: { onGuest: () => void }) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    if (mode === 'signup' && password !== passwordAgain) {
      setMessage('Пароли не совпадают.');
      return;
    }

    setBusy(true);
    const { data, error } = mode === 'signup'
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setMessage(error.message);
    } else if (mode === 'signup' && !data.session) {
      setMessage('Аккаунт создан! Проверь почту и подтверди регистрацию.');
    }
    setBusy(false);
  }

  function switchMode() {
    setMode((current) => current === 'signin' ? 'signup' : 'signin');
    setMessage('');
    setPasswordAgain('');
  }

  async function signInWithGoogle() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) { setMessage(error.message); setBusy(false); }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-card__icon" aria-hidden="true">⚔️</div>
        <span className="auth-card__badge">БИТВА БАЗ</span>
        <h1>{mode === 'signup' ? 'Создать аккаунт' : 'С возвращением!'}</h1>
        <p>{mode === 'signup' ? 'Зарегистрируйся и отправляйся в бой.' : 'Войди, чтобы продолжить игру.'}</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Электронная почта
            <input type="email" placeholder="name@example.com" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
          </label>
          <label>
            Пароль
            <input type="password" placeholder="Минимум 6 символов" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} minLength={6} required />
          </label>
          {mode === 'signup' && (
            <label>
              Повтори пароль
              <input type="password" placeholder="Ещё раз тот же пароль" value={passwordAgain} onChange={(event) => setPasswordAgain(event.target.value)} autoComplete="new-password" minLength={6} required />
            </label>
          )}
          <button type="submit" disabled={busy}>
            {busy ? 'Подожди…' : mode === 'signup' ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <div className="auth-divider"><span>или</span></div>
        <button className="google-auth-button" type="button" onClick={signInWithGoogle} disabled={busy}>
          <span aria-hidden="true">G</span> Войти через Google
        </button>
        <button className="guest-auth-button" type="button" onClick={onGuest} disabled={busy}>🎮 Войти как гость</button>

        {message && <p className="auth-message" role="status">{message}</p>}
        <button className="auth-switch" type="button" onClick={switchMode}>
          {mode === 'signup' ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </section>
    </main>
  );
}
