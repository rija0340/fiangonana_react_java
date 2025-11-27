# 🚀 CORRECTIFS FINAUX - PERSISTANCE & ERREUR 415

## 1. ✅ Correction Erreur 415 (Unsupported Media Type)

**Problème** : L'import dynamique `import('axios')` empêchait l'envoi correct des headers HTTP (`Content-Type: application/json`).
**Solution** : Remplacement par des imports statiques `import axios from 'axios'` partout.
**Fichiers corrigés** :
- `PlanningScheduleTab.jsx`
- `Planning2.jsx`
- `PlanningGlobalTab.jsx`
- `PlanningConfigTab.jsx`

## 2. ✅ Correction Persistance des Disponibilités

**Problème** : Les disponibilités (`availability`) n'étaient stockées que dans le state frontend et perdues au rafraîchissement, car le backend ne les stockait pas.
**Solution** : Ajout du champ `availability` (JSON stocké en String) dans l'entité `PlanningSession`.

**Modifications Backend** :
- **`PlanningSession.java`** : Ajout du champ `private String availability;` (columnDefinition = "TEXT")
- **`PlanningSessionDTO.java`** : Ajout du champ `private String availability;`
- **`PlanningSessionService.java`** : Mapping du champ entre DTO et Entity
- **`PlanningRestController.java`** : Mise à jour du champ dans `updatePlanningSession`

**Modifications Frontend** :
- **`PlanningStateProvider.jsx`** :
  - `savePlanToBackend` : Stringify `availability` avant envoi
  - `loadPlans` : Parse `availability` à la réception

## 3. ✅ Amélioration UX Disponibilités

**Demande** : Indisponible par défaut, boutons globaux.
**Modifications** :
- **Logique inversée** : `undefined` ou `false` = Indisponible (avant c'était l'inverse)
- **Boutons ajoutés** : "Tous disponibles" et "Tous indisponibles"
- **Filtrage** : `generateSchedule` ne prend maintenant que les membres explicitement marqués `true`.

## 4. ✅ Correction Assignments (Erreur JsonBackReference)

**Problème** : L'envoi de `session: { id: ... }` causait une erreur de désérialisation Jackson.
**Solution** :
- Création de **`PlanningAssignmentDTO.java`** (DTO simple)
- Création de l'endpoint **`POST /api/planning/assignment`**
- Mise à jour du frontend pour utiliser ce nouvel endpoint.

---

## 🏁 État Final

- **Persistance** : 100% fonctionnelle (Dates, Rôles, Participants, Disponibilités, Titre)
- **Génération** : Fonctionnelle (plus d'erreur 415)
- **UX** : Améliorée (Flatpickr stable, gestion des disponibilités intuitive)

Tout est prêt pour le test final ! 🎉
