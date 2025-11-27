# 🚨 CORRECTIFS URGENTS - SAUVEGARDE & CRASH

## 1. ✅ Correction Absence de Sauvegarde (Sélection Membres)

**Problème** : La sélection des membres dans l'onglet Global ne déclenchait aucune requête vers le backend, donc les modifications étaient perdues au rechargement.
**Cause** : `PlanningGlobalTab.jsx` mettait à jour le store local mais n'appelait pas la fonction de persistance `savePlanToBackend`.
**Solution** :
- Import de `savePlanToBackend` depuis le contexte `usePlanning`.
- Appel explicite de `savePlanToBackend(planToSave)` dans `togglePersonSelection` et `selectAllMembers`.

## 2. ✅ Correction Crash `localeCompare is not a function`

**Problème** : L'application crashait dans l'onglet Planning (modale ou assistant) avec l'erreur `nameA.localeCompare is not a function`.
**Cause** : Le tri des membres utilisait `getPersonName` qui pouvait retourner un ID numérique (si le nom n'était pas trouvé), et `localeCompare` n'existe pas sur les nombres.
**Solution** :
- Forçage de la conversion en chaîne de caractères : `String(getPersonName(...) || '').localeCompare(...)`.
- Appliqué dans `renderModal` et `renderMatrixAssistant` de `PlanningScheduleTab.jsx`.

---

## 🏁 État Actuel

- **Persistance Membres** : Fonctionnelle (Requête PUT envoyée à chaque clic).
- **Persistance Disponibilités** : Fonctionnelle (Gérée par `PlanningStateProvider` qui appelle déjà `savePlanToBackend`).
- **Stabilité** : Plus de crash lors du tri des membres.
- **Fonctionnalités** : Modale d'édition et Assistant matriciel opérationnels.

Vous pouvez tester à nouveau !
