# Crear PR para desplegar cambios

## Estado actual

- **Rama:** `feature/cubrir-puntos-pendientes-doc-impl`
- **Commit:** Incluye todas las fases del plan (doc, CI Gitleaks, export CSV, validación, WCAG axe).

## Pasos para subir y abrir el PR

### 1. Añadir el remoto (solo la primera vez)

Si aún no tienes configurado el remoto de GitHub/GitLab:

```bash
git remote add origin https://github.com/TU-ORG/gptSercop.git
```

Sustituye `TU-ORG/gptSercop` por la URL real de tu repositorio.

### 2. Subir la rama

```bash
git push -u origin feature/cubrir-puntos-pendientes-doc-impl
```

Si el remoto ya tiene historial (por ejemplo una rama `main` existente) y es la primera vez que subes este repo, puede que necesites:

```bash
git pull origin main --allow-unrelated-histories
# Resolver conflictos si los hay, luego:
git push -u origin feature/cubrir-puntos-pendientes-doc-impl
```

### 3. Abrir el Pull Request

**Opción A – Desde la web**

1. Entra en tu repo en GitHub/GitLab.
2. Verás un aviso para crear un PR desde `feature/cubrir-puntos-pendientes-doc-impl`.
3. Pulsa "Compare & pull request" y rellena título y descripción.

**Opción B – Con GitHub CLI**

Si tienes [GitHub CLI](https://cli.github.com/) instalado y autenticado:

```bash
gh pr create --base main --head feature/cubrir-puntos-pendientes-doc-impl --title "feat: cubrir puntos pendientes doc-impl (doc, CI, export CSV, validación, WCAG)" --body "Ver descripción en PULL_REQUEST.md o en el plan."
```

### 4. (Opcional) Configurar tu identidad en git

Para que los próximos commits tengan tu nombre y email:

```bash
git config user.name "Tu Nombre"
git config user.email "tu@email.com"
```

Para cambiarlo solo en este repo, ejecuta lo anterior dentro de `c:\code\gptSercop`. Para todos los repos, añade `--global`.
