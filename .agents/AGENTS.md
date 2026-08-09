# Reglas del Proyecto (Workspace Rules)

## Flujo de Trabajo y Documentación de Cambios

- **GitHub Issues**: Para cualquier nueva funcionalidad, corrección de errores o refactorización significativa, los cambios deben estar respaldados o asociados a un GitHub Issue.
- **Ramas Feature/Fix**: Trabaja siempre en ramas `feature/<nombre>`, `fix/<nombre>` o `refactor/<nombre>`.
- **Versionado SemVer**: Antes de abrir la PR hacia `develop` (o dentro de la rama de la característica), actualiza la versión correspondiente en `package.json` siguiendo SemVer.
- **Mensajes de Commit y PRs**: Incluye siempre referencias a los issues correspondientes mediante sintaxis de GitHub (ej. `Closes #<número_issue>` o `Ref #<número_issue>`).
- **Flujo de Release a Master**:
  1. Los cambios se prueban y combinan en `develop`.
  2. Desde `develop` (con la versión ya actualizada en `package.json`), se crea la rama de publicación `release/<version>` (ej. `release/3.1.0`).
  3. Las Pull Requests hacia `master` se deben realizar **únicamente desde ramas `release/<version>`**.
- **Documentación**: Si un cambio altera la arquitectura, flujos o modelos de datos, actualiza la documentación pertinente en la carpeta `docs/`.
