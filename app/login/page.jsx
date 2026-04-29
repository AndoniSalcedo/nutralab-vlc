export default function LoginPage() {
  return (
    <div className="container" style={{ maxWidth: 520, paddingTop: 64 }}>
      <div className="card stack">
        <div>
          <h1 className="heroTitle">VCF Nutrición</h1>
          <p className="muted">Acceso privado para staff. Login actualizado.</p>
        </div>
        <form method="post" action="/api/login" className="stack">
          <div>
            <label className="label">Usuario</label>
            <input className="input" name="username" autoComplete="username" />
          </div>
          <div>
            <label className="label">Contraseña</label>
            <input className="input" name="password" type="password" autoComplete="current-password" />
          </div>
          <button className="button" type="submit">Entrar</button>
        </form>
        <p className="small muted">Luego podrás proteger además el dominio desde Vercel si quieres una segunda barrera.</p>
      </div>
    </div>
  );
}
